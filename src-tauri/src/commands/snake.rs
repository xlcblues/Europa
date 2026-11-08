use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn submit_snake_match(
    state: State<'_, AppState>,
    submission: repositories::SnakeMatchSubmission,
) -> Result<repositories::SnakeMatchSubmissionResult, AppError> {
    state.with_database(|database| {
        repositories::submit_snake_match(database.connection_mut(), &submission)
    })
}
