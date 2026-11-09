use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn load_match_history(
    state: State<'_, AppState>,
    game_id: Option<String>,
    limit: Option<i64>,
) -> Result<Vec<repositories::MatchHistoryEntry>, AppError> {
    let limit = limit.unwrap_or(50);
    state.with_database(|database| {
        repositories::load_match_history(database.connection_mut(), game_id.as_deref(), limit)
    })
}

#[tauri::command]
pub fn clear_game_history(
    state: State<'_, AppState>,
    game_id: Option<String>,
) -> Result<repositories::ClearResult, AppError> {
    state.with_database(|database| {
        repositories::clear_game_history(database.connection_mut(), game_id.as_deref())
    })
}

#[tauri::command]
pub fn clear_platformer_saves(
    state: State<'_, AppState>,
) -> Result<repositories::SavesClearResult, AppError> {
    state.with_database(|database| repositories::clear_platformer_saves(database.connection_mut()))
}
