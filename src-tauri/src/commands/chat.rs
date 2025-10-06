use crate::commands::anthropic::{self, stream_chat_completion};
use crate::db;
use crate::db::models::{Chat, Message, ProjectSettings};
use crate::error::{AppError, Result};
use crate::state::AppState;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn list_chats(
    state: State<'_, AppState>,
    project_id: Option<String>,
) -> Result<Vec<Chat>> {
    let chats = db::list_chats(&state.db, project_id).await?;
    Ok(chats)
}

#[tauri::command]
pub async fn create_chat(
    state: State<'_, AppState>,
    project_id: Option<String>,
) -> Result<Chat> {
    let chat = db::create_chat(&state.db, project_id).await?;
    Ok(chat)
}

#[tauri::command]
pub async fn get_chat(state: State<'_, AppState>, chat_id: String) -> Result<Chat> {
    let chat = db::get_chat(&state.db, &chat_id).await?;
    Ok(chat)
}

#[tauri::command]
pub async fn update_chat_title(
    state: State<'_, AppState>,
    chat_id: String,
    title: String,
) -> Result<()> {
    db::update_chat_title(&state.db, &chat_id, title).await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_chat(state: State<'_, AppState>, chat_id: String) -> Result<()> {
    db::delete_chat(&state.db, &chat_id).await?;
    Ok(())
}

#[tauri::command]
pub async fn list_messages(state: State<'_, AppState>, chat_id: String) -> Result<Vec<Message>> {
    let messages = db::list_messages(&state.db, &chat_id).await?;
    Ok(messages)
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct MessageImage {
    data: String,
    media_type: String,
}

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    state: State<'_, AppState>,
    chat_id: String,
    content: String,
    project_id: Option<String>,
    model: Option<String>,
    images: Option<Vec<MessageImage>>,
) -> Result<Message> {
    // Get API key
    let api_key = state.get_api_key().ok_or_else(|| AppError {
        message: "API key not configured. Please set ANTHROPIC_API_KEY environment variable."
            .to_string(),
    })?;

    // Get settings
    let mut settings = if let Some(pid) = &project_id {
        let project = db::get_project(&state.db, pid).await?;
        serde_json::from_str(&project.settings_json)?
    } else {
        ProjectSettings::default()
    };

    // Override model if provided
    if let Some(m) = model {
        settings.model = m;
    }

    // Save user message with images
    let images_json = images.as_ref().map(|imgs| serde_json::to_string(imgs).ok()).flatten();
    let mut user_message = Message::new_user(chat_id.clone(), content);
    user_message.images = images_json;
    db::create_message(&state.db, user_message.clone()).await?;

    // Get message history
    let messages = db::list_messages(&state.db, &chat_id).await?;

    // Stream response from Claude
    let assistant_content = stream_chat_completion(app, api_key, settings, messages.clone()).await?;

    // Save assistant message
    let assistant_message = Message::new_assistant(chat_id.clone(), assistant_content);
    db::create_message(&state.db, assistant_message.clone()).await?;

    Ok(assistant_message)
}

#[tauri::command]
pub async fn generate_title(
    state: State<'_, AppState>,
    user_message: String,
    assistant_response: String,
) -> Result<String> {
    let api_key = state.get_api_key().ok_or_else(|| AppError {
        message: "API key not configured".to_string(),
    })?;

    anthropic::generate_chat_title(api_key, user_message, assistant_response).await
}
