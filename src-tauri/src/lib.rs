mod commands;
mod db;
mod error;
mod state;

use state::AppState;
use std::env;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load environment variables
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Get API key from environment
            let api_key = env::var("ANTHROPIC_API_KEY").ok();

            if api_key.is_none() {
                eprintln!("Warning: ANTHROPIC_API_KEY not set in environment");
            }

            // Initialize database
            let app_handle = app.handle().clone();
            let app_dir = app.path().app_data_dir().expect("Failed to get app data directory");
            let db_path = app_dir.join("claude.db");

            println!("App data directory: {:?}", app_dir);
            println!("Database path: {:?}", db_path);

            // Initialize DB and state
            tauri::async_runtime::block_on(async move {
                let pool = db::init_db(db_path.clone()).await
                    .unwrap_or_else(|e| panic!("Failed to initialize database at {:?}: {}", db_path, e));
                let state = AppState::new(pool, api_key);
                app_handle.manage(state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::create_project,
            commands::get_project,
            commands::get_project_settings,
            commands::update_project_settings,
            commands::delete_project,
            commands::list_chats,
            commands::create_chat,
            commands::get_chat,
            commands::update_chat_title,
            commands::delete_chat,
            commands::list_messages,
            commands::send_message,
            commands::generate_title,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
