use crate::db;
use crate::db::models::{Project, ProjectSettings};
use crate::error::Result;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>> {
    let projects = db::list_projects(&state.db).await?;
    Ok(projects)
}

#[tauri::command]
pub async fn create_project(state: State<'_, AppState>, name: String) -> Result<Project> {
    let project = db::create_project(&state.db, name).await?;
    Ok(project)
}

#[tauri::command]
pub async fn get_project(state: State<'_, AppState>, project_id: String) -> Result<Project> {
    let project = db::get_project(&state.db, &project_id).await?;
    Ok(project)
}

#[tauri::command]
pub async fn get_project_settings(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<ProjectSettings> {
    let project = db::get_project(&state.db, &project_id).await?;
    let settings: ProjectSettings = serde_json::from_str(&project.settings_json)?;
    Ok(settings)
}

#[tauri::command]
pub async fn update_project_settings(
    state: State<'_, AppState>,
    project_id: String,
    settings: ProjectSettings,
) -> Result<()> {
    db::update_project_settings(&state.db, &project_id, settings).await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, project_id: String) -> Result<()> {
    db::delete_project(&state.db, &project_id).await?;
    Ok(())
}
