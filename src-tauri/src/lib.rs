mod commands;
mod db;
mod error;

use std::fs;

use db::{AppState, Database};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?.join("Europa");
            fs::create_dir_all(&app_data_dir)?;
            let database_path = app_data_dir.join("europa.db");
            let database = Database::open(&database_path)?;

            app.manage(AppState::new(database, database_path));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap::load_bootstrap,
            commands::gomoku::submit_gomoku_match,
            commands::platformer::clear_platformer_checkpoint,
            commands::platformer::load_platformer_checkpoint,
            commands::platformer::save_platformer_checkpoint,
            commands::platformer::submit_platformer_match,
            commands::settings::save_setting,
            commands::snake::submit_snake_match
        ])
        .run(tauri::generate_context!())
        .expect("Europa failed to start");
}
