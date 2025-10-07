pub mod models;

use anyhow::{Context, Result};
use chrono::Utc;
use models::{Chat, Message, Project, ProjectSettings};
use sqlx::sqlite::SqlitePool;
use std::path::PathBuf;

const SCHEMA: &str = include_str!("schema.sql");

pub async fn init_db(db_path: PathBuf) -> Result<SqlitePool> {
    // Create parent directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .context("Failed to create database directory")?;
    }

    // Use sqlite:// URL format with absolute path
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    let pool = SqlitePool::connect(&db_url)
        .await
        .context("Failed to connect to database")?;

    // Run schema
    sqlx::raw_sql(SCHEMA)
        .execute(&pool)
        .await
        .context("Failed to initialize database schema")?;

    Ok(pool)
}

// Project queries
pub async fn create_project(pool: &SqlitePool, name: String) -> Result<Project> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let settings = ProjectSettings::default();
    let settings_json = serde_json::to_string(&settings)?;

    sqlx::query(
        "INSERT INTO projects (id, name, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&name)
    .bind(&settings_json)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(Project {
        id,
        name,
        settings_json,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn list_projects(pool: &SqlitePool) -> Result<Vec<Project>> {
    let projects = sqlx::query_as::<_, Project>(
        "SELECT id, name, settings_json, created_at, updated_at FROM projects ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await?;

    Ok(projects)
}

pub async fn get_project(pool: &SqlitePool, project_id: &str) -> Result<Project> {
    let project = sqlx::query_as::<_, Project>(
        "SELECT id, name, settings_json, created_at, updated_at FROM projects WHERE id = ?",
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn update_project_settings(
    pool: &SqlitePool,
    project_id: &str,
    settings: ProjectSettings,
) -> Result<()> {
    let settings_json = serde_json::to_string(&settings)?;
    let now = Utc::now().to_rfc3339();

    sqlx::query("UPDATE projects SET settings_json = ?, updated_at = ? WHERE id = ?")
        .bind(settings_json)
        .bind(now)
        .bind(project_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn delete_project(pool: &SqlitePool, project_id: &str) -> Result<()> {
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(project_id)
        .execute(pool)
        .await?;

    Ok(())
}

// Chat queries
pub async fn create_chat(pool: &SqlitePool, project_id: Option<String>) -> Result<Chat> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let title = "New Chat".to_string();

    sqlx::query(
        "INSERT INTO chats (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&project_id)
    .bind(&title)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(Chat {
        id,
        project_id,
        title,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn list_chats(pool: &SqlitePool, project_id: Option<String>) -> Result<Vec<Chat>> {
    let chats = if let Some(pid) = project_id {
        sqlx::query_as::<_, Chat>(
            "SELECT id, project_id, title, created_at, updated_at FROM chats WHERE project_id = ? ORDER BY updated_at DESC",
        )
        .bind(pid)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Chat>(
            "SELECT id, project_id, title, created_at, updated_at FROM chats WHERE project_id IS NULL ORDER BY updated_at DESC",
        )
        .fetch_all(pool)
        .await?
    };

    Ok(chats)
}

pub async fn get_chat(pool: &SqlitePool, chat_id: &str) -> Result<Chat> {
    let chat = sqlx::query_as::<_, Chat>(
        "SELECT id, project_id, title, created_at, updated_at FROM chats WHERE id = ?",
    )
    .bind(chat_id)
    .fetch_one(pool)
    .await?;

    Ok(chat)
}

pub async fn update_chat_title(pool: &SqlitePool, chat_id: &str, title: String) -> Result<()> {
    let now = Utc::now().to_rfc3339();

    sqlx::query("UPDATE chats SET title = ?, updated_at = ? WHERE id = ?")
        .bind(title)
        .bind(now)
        .bind(chat_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn delete_chat(pool: &SqlitePool, chat_id: &str) -> Result<()> {
    sqlx::query("DELETE FROM chats WHERE id = ?")
        .bind(chat_id)
        .execute(pool)
        .await?;

    Ok(())
}

// Message queries
pub async fn create_message(pool: &SqlitePool, message: Message) -> Result<()> {
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO messages (id, chat_id, role, content, images, model, extended_thinking, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.chat_id)
    .bind(&message.role)
    .bind(&message.content)
    .bind(&message.images)
    .bind(&message.model)
    .bind(&message.extended_thinking)
    .bind(&message.created_at)
    .execute(pool)
    .await?;

    // Update chat's updated_at timestamp
    sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
        .bind(now)
        .bind(&message.chat_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn list_messages(pool: &SqlitePool, chat_id: &str) -> Result<Vec<Message>> {
    let messages = sqlx::query_as::<_, Message>(
        "SELECT id, chat_id, role, content, images, model, extended_thinking, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
    )
    .bind(chat_id)
    .fetch_all(pool)
    .await?;

    Ok(messages)
}
