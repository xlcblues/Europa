use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn load_platformer_checkpoint(
    state: State<'_, AppState>,
    slot: String,
) -> Result<Option<repositories::PlatformerSave>, AppError> {
    state.with_database(|database| {
        repositories::load_platformer_checkpoint(database.connection_mut(), &slot)
    })
}

#[tauri::command]
pub fn save_platformer_checkpoint(
    state: State<'_, AppState>,
    record: repositories::PlatformerSave,
) -> Result<repositories::PlatformerSave, AppError> {
    state.with_database(|database| {
        repositories::save_platformer_checkpoint(database.connection_mut(), &record)
    })
}

#[tauri::command]
pub fn clear_platformer_checkpoint(
    state: State<'_, AppState>,
    slot: String,
) -> Result<(), AppError> {
    state.with_database(|database| {
        repositories::clear_platformer_checkpoint(database.connection_mut(), &slot)
    })
}

#[tauri::command]
pub fn submit_platformer_match(
    state: State<'_, AppState>,
    submission: repositories::PlatformerMatchSubmission,
) -> Result<repositories::PlatformerMatchSubmissionResult, AppError> {
    state.with_database(|database| {
        repositories::submit_platformer_match(database.connection_mut(), &submission)
    })
}
