use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn save_setting(
    state: State<'_, AppState>,
    key: String,
    value_json: String,
) -> Result<repositories::SettingRecord, AppError> {
    state.with_database(|database| {
        repositories::save_setting(database.connection_mut(), &key, &value_json)
    })
}
