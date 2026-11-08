use tauri::State;

use crate::{
    db::{repositories, AppState},
    error::AppError,
};

#[tauri::command]
pub fn load_bootstrap(state: State<'_, AppState>) -> Result<repositories::BootstrapData, AppError> {
    let database_path = state.database_path().to_path_buf();

    state.with_database(|database| {
        let schema_version = database.schema_version();
        repositories::load_bootstrap(database.connection_mut(), &database_path, schema_version)
    })
}
