use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub settings_json: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default)]
    pub system_prompt: Option<String>,
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    #[serde(default = "default_temperature")]
    pub temperature: f32,
}

fn default_model() -> String {
    "claude-sonnet-4-5-20250929".to_string()
}

fn default_max_tokens() -> u32 {
    4096
}

fn default_temperature() -> f32 {
    1.0
}

impl Default for ProjectSettings {
    fn default() -> Self {
        Self {
            model: default_model(),
            system_prompt: None,
            max_tokens: default_max_tokens(),
            temperature: default_temperature(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Chat {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub role: String,
    pub content: String,
    pub images: Option<String>,
    pub model: Option<String>,
    pub extended_thinking: Option<i32>,
    pub created_at: String,
}

impl Message {
    pub fn new_user(chat_id: String, content: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            chat_id,
            role: "user".to_string(),
            content,
            images: None,
            model: None,
            extended_thinking: None,
            created_at: now,
        }
    }

    pub fn new_assistant(chat_id: String, content: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            chat_id,
            role: "assistant".to_string(),
            content,
            images: None,
            model: None,
            extended_thinking: None,
            created_at: now,
        }
    }
}
