use crate::db::models::{Message, ProjectSettings};
use crate::error::{AppError, Result};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

const ANTHROPIC_API_URL: &str = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION: &str = "2023-06-01";

#[derive(Debug, Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: u32,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    system: Option<String>,
    messages: Vec<AnthropicMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking: Option<ThinkingConfig>,
}

#[derive(Debug, Serialize)]
struct ThinkingConfig {
    #[serde(rename = "type")]
    thinking_type: String,
    budget_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
enum MessageContent {
    Text(String),
    Blocks(Vec<ContentBlock>),
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
enum ContentBlock {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "image")]
    Image {
        source: ImageSource,
    },
    #[serde(rename = "document")]
    Document {
        source: DocumentSource,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct ImageSource {
    #[serde(rename = "type")]
    source_type: String,
    media_type: String,
    data: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DocumentSource {
    #[serde(rename = "type")]
    source_type: String,
    media_type: String,
    data: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicMessage {
    role: String,
    content: MessageContent,
}

#[derive(Debug, Deserialize)]
struct StreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(default)]
    delta: Option<ContentDelta>,
}

#[derive(Debug, Deserialize)]
struct ContentDelta {
    #[serde(default)]
    text: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamChunk {
    pub delta: String,
    pub done: bool,
}

pub async fn stream_chat_completion(
    app: AppHandle,
    api_key: String,
    settings: ProjectSettings,
    messages: Vec<Message>,
    extended_thinking: bool,
) -> Result<String> {
    // Convert messages to Anthropic format
    let anthropic_messages: Vec<AnthropicMessage> = messages
        .iter()
        .map(|m| {
            let has_images = m.images.as_ref().map(|s| !s.is_empty()).unwrap_or(false);
            let has_documents = m.documents.as_ref().map(|s| !s.is_empty()).unwrap_or(false);

            let content = if has_images || has_documents {
                let mut blocks = Vec::new();

                // Add text first if present
                if !m.content.is_empty() {
                    blocks.push(ContentBlock::Text {
                        text: m.content.clone(),
                    });
                }

                // Add images
                if let Some(images_json) = &m.images {
                    if let Ok(images) = serde_json::from_str::<Vec<serde_json::Value>>(images_json) {
                        for image in images {
                            if let (Some(data), Some(media_type)) = (
                                image.get("data").and_then(|v| v.as_str()),
                                image.get("media_type").and_then(|v| v.as_str()),
                            ) {
                                blocks.push(ContentBlock::Image {
                                    source: ImageSource {
                                        source_type: "base64".to_string(),
                                        media_type: media_type.to_string(),
                                        data: data.to_string(),
                                    },
                                });
                            }
                        }
                    }
                }

                // Add documents
                if let Some(documents_json) = &m.documents {
                    if let Ok(documents) = serde_json::from_str::<Vec<serde_json::Value>>(documents_json) {
                        for document in documents {
                            if let (Some(data), Some(media_type)) = (
                                document.get("data").and_then(|v| v.as_str()),
                                document.get("media_type").and_then(|v| v.as_str()),
                            ) {
                                blocks.push(ContentBlock::Document {
                                    source: DocumentSource {
                                        source_type: "base64".to_string(),
                                        media_type: media_type.to_string(),
                                        data: data.to_string(),
                                    },
                                });
                            }
                        }
                    }
                }

                MessageContent::Blocks(blocks)
            } else {
                MessageContent::Text(m.content.clone())
            };

            AnthropicMessage {
                role: m.role.clone(),
                content,
            }
        })
        .collect();

    let thinking_config = if extended_thinking {
        Some(ThinkingConfig {
            thinking_type: "enabled".to_string(),
            budget_tokens: 10000,
        })
    } else {
        None
    };

    let request = AnthropicRequest {
        model: settings.model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        system: settings.system_prompt,
        messages: anthropic_messages,
        stream: true,
        thinking: thinking_config,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(ANTHROPIC_API_URL)
        .header("x-api-key", api_key)
        .header("anthropic-version", ANTHROPIC_VERSION)
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(AppError {
            message: format!("API error: {}", error_text),
        });
    }

    let mut stream = response.bytes_stream();
    let mut full_content = String::new();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        // Process complete SSE events
        while let Some(event_end) = buffer.find("\n\n") {
            let event = buffer[..event_end].to_string();
            buffer = buffer[event_end + 2..].to_string();

            // Parse SSE event
            for line in event.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        continue;
                    }

                    if let Ok(stream_event) = serde_json::from_str::<StreamEvent>(data) {
                        match stream_event.event_type.as_str() {
                            "content_block_delta" => {
                                if let Some(delta) = stream_event.delta {
                                    if let Some(text) = delta.text {
                                        full_content.push_str(&text);

                                        // Emit to frontend
                                        let _ = app.emit("stream_chunk", StreamChunk {
                                            delta: text,
                                            done: false,
                                        });
                                    }
                                }
                            }
                            "message_stop" => {
                                // Emit completion
                                let _ = app.emit("stream_chunk", StreamChunk {
                                    delta: String::new(),
                                    done: true,
                                });
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    Ok(full_content)
}

pub async fn generate_chat_title(
    api_key: String,
    user_message: String,
    assistant_response: String,
) -> Result<String> {
    let prompt = format!(
        "Based on this conversation, generate a concise 3-5 word title that captures the main topic. Return ONLY the title, no quotes or extra text.\n\nUser: {}\n\nAssistant: {}",
        user_message,
        assistant_response.chars().take(500).collect::<String>() // Limit assistant response length
    );

    let request = AnthropicRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 20,
        temperature: 0.5,
        system: None,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: MessageContent::Text(prompt),
        }],
        stream: false,
        thinking: None,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(ANTHROPIC_API_URL)
        .header("x-api-key", api_key)
        .header("anthropic-version", ANTHROPIC_VERSION)
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(AppError {
            message: format!("API error: {}", error_text),
        });
    }

    #[derive(Deserialize)]
    struct TitleResponse {
        content: Vec<ContentBlock>,
    }

    #[derive(Deserialize)]
    struct ContentBlock {
        text: String,
    }

    let response_data: TitleResponse = response.json().await?;
    let title = response_data
        .content
        .first()
        .map(|c| c.text.trim().to_string())
        .unwrap_or_else(|| "New Chat".to_string());

    Ok(title)
}
