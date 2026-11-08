pub mod migrations;
pub mod repositories;

use std::{
    ffi::OsStr,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
    time::Duration,
};

use rusqlite::Connection;

use crate::error::AppError;

pub struct Database {
    connection: Connection,
    schema_version: i64,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, AppError> {
        let mut connection = Connection::open(path)?;
        configure_connection(&connection)?;

        let version = migrations::current_version(&connection)?;
        if version > 0 && version < migrations::LATEST_VERSION {
            backup_database(&connection, path, version)?;
        }

        let schema_version = migrations::run(&mut connection)?;

        Ok(Self {
            connection,
            schema_version,
        })
    }

    pub fn connection_mut(&mut self) -> &mut Connection {
        &mut self.connection
    }

    pub fn schema_version(&self) -> i64 {
        self.schema_version
    }
}

pub struct AppState {
    database: Mutex<Database>,
    database_path: PathBuf,
}

impl AppState {
    pub fn new(database: Database, database_path: PathBuf) -> Self {
        Self {
            database: Mutex::new(database),
            database_path,
        }
    }

    pub fn database_path(&self) -> &Path {
        &self.database_path
    }

    pub fn with_database<T>(
        &self,
        operation: impl FnOnce(&mut Database) -> Result<T, AppError>,
    ) -> Result<T, AppError> {
        let mut database = self
            .database
            .lock()
            .map_err(|_| AppError::StateUnavailable)?;
        operation(&mut database)
    }
}

fn configure_connection(connection: &Connection) -> Result<(), AppError> {
    connection.busy_timeout(Duration::from_secs(5))?;
    connection.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA synchronous = NORMAL;
         PRAGMA temp_store = MEMORY;",
    )?;

    connection.execute_batch("PRAGMA journal_mode = WAL;")?;

    Ok(())
}

fn backup_database(connection: &Connection, path: &Path, version: i64) -> Result<(), AppError> {
    connection.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;

    let file_name = path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("europa.db");
    let backup_path = path.with_file_name(format!("{file_name}.bak-v{version}"));

    if !backup_path.exists() {
        fs::copy(path, &backup_path)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use tempfile::tempdir;

    use super::Database;

    #[test]
    fn persistent_database_opens_and_reopens_with_stable_schema() {
        let directory = tempdir().expect("temporary directory should be created");
        let path = directory.path().join("europa.db");

        let first = Database::open(&path).expect("first database open should succeed");
        assert_eq!(first.schema_version(), 3);
        drop(first);

        let second = Database::open(&path).expect("second database open should succeed");
        assert_eq!(second.schema_version(), 3);
        drop(second);

        let connection = Connection::open(&path).expect("database should still be readable");
        let journal_mode: String = connection
            .query_row("PRAGMA journal_mode", [], |row| row.get(0))
            .expect("journal mode should be readable");
        assert_eq!(journal_mode.to_ascii_lowercase(), "wal");
    }
}
