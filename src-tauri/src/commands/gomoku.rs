use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn submit_gomoku_match(
    state: State<'_, AppState>,
    submission: repositories::GomokuMatchSubmission,
) -> Result<repositories::GomokuMatchSubmissionResult, AppError> {
    state.with_database(|database| {
        repositories::submit_gomoku_match(database.connection_mut(), &submission)
    })
}
