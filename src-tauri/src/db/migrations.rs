use rusqlite::Connection;

use crate::error::AppError;

struct Migration {
    version: i64,
    sql: &'static str,
}

const V1_SCHEMA: &str = r#"
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE game_stats (
    game_id TEXT PRIMARY KEY,
    best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
    games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    draws INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
    total_play_ms INTEGER NOT NULL DEFAULT 0 CHECK (total_play_ms >= 0),
    last_played_at INTEGER
);

CREATE TABLE platformer_saves (
    slot TEXT PRIMARY KEY,
    level_id INTEGER NOT NULL CHECK (level_id >= 1),
    checkpoint_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    lives INTEGER NOT NULL CHECK (lives >= 0),
    details_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    outcome TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    detail_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_game_stats_last_played
    ON game_stats(last_played_at DESC);

CREATE INDEX idx_match_history_game_created
    ON match_history(game_id, created_at DESC);
"#;

const V2_SCHEMA: &str = r#"
ALTER TABLE match_history ADD COLUMN session_id TEXT;

CREATE UNIQUE INDEX idx_match_history_session
    ON match_history(session_id)
    WHERE session_id IS NOT NULL;
"#;
const V3_SCHEMA: &str = r#"
ALTER TABLE game_stats ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0);
ALTER TABLE game_stats ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0);
ALTER TABLE game_stats ADD COLUMN fastest_win_moves INTEGER;
ALTER TABLE game_stats ADD COLUMN fastest_win_ms INTEGER;
"#;

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        sql: V1_SCHEMA,
    },
    Migration {
        version: 2,
        sql: V2_SCHEMA,
    },
    Migration {
        version: 3,
        sql: V3_SCHEMA,
    },
];

pub const LATEST_VERSION: i64 = 3;

pub fn current_version(connection: &Connection) -> Result<i64, AppError> {
    Ok(connection.query_row("PRAGMA user_version", [], |row| row.get(0))?)
}

pub fn run(connection: &mut Connection) -> Result<i64, AppError> {
    let current = current_version(connection)?;

    if current > LATEST_VERSION {
        return Err(AppError::UnsupportedSchema(current));
    }

    for migration in MIGRATIONS.iter().filter(|item| item.version > current) {
        let transaction = connection.transaction()?;
        transaction.execute_batch(migration.sql)?;
        transaction.pragma_update(None, "user_version", migration.version)?;
        transaction.commit()?;
    }

    current_version(connection)
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::{current_version, run, LATEST_VERSION, V1_SCHEMA, V2_SCHEMA};
    use crate::error::AppError;

    fn table_count(connection: &Connection) -> i64 {
        connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master
                 WHERE type = 'table'
                   AND name IN ('settings', 'game_stats', 'platformer_saves', 'match_history')",
                [],
                |row| row.get(0),
            )
            .expect("table count should be readable")
    }

    #[test]
    fn first_migration_sets_version_and_creates_tables() {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        let version = run(&mut connection).expect("migration should succeed");

        assert_eq!(version, LATEST_VERSION);
        assert_eq!(table_count(&connection), 4);
    }

    #[test]
    fn migration_is_idempotent() {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        run(&mut connection).expect("first migration should succeed");
        let second = run(&mut connection).expect("second migration should be a no-op");

        assert_eq!(second, LATEST_VERSION);
        assert_eq!(current_version(&connection).unwrap(), LATEST_VERSION);
        assert_eq!(table_count(&connection), 4);
    }

    #[test]
    fn future_schema_is_rejected() {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        connection
            .pragma_update(None, "user_version", LATEST_VERSION + 1)
            .expect("test schema version should be writable");

        let result = run(&mut connection);
        assert!(matches!(
            result,
            Err(AppError::UnsupportedSchema(version)) if version == LATEST_VERSION + 1
        ));
    }

    #[test]
    fn v2_adds_session_id_and_preserves_v1_history() {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        connection
            .execute_batch(V1_SCHEMA)
            .expect("v1 schema should be installable");
        connection
            .pragma_update(None, "user_version", 1)
            .expect("test schema version should be writable");
        connection
            .execute(
                "INSERT INTO match_history
                 (game_id, outcome, score, duration_ms, detail_json, created_at)
                 VALUES ('snake', 'game_over', 10, 500, '{}', 1)",
                [],
            )
            .expect("v1 history should be insertable");

        let version = run(&mut connection).expect("v1 should upgrade to the latest version");
        assert_eq!(version, LATEST_VERSION);

        let history_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM match_history", [], |row| row.get(0))
            .expect("history should remain readable");
        assert_eq!(history_count, 1);

        let session_column_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('match_history') WHERE name = 'session_id'",
                [],
                |row| row.get(0),
            )
            .expect("match_history columns should be readable");
        assert_eq!(session_column_count, 1);

        let index_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master
                 WHERE type = 'index' AND name = 'idx_match_history_session'",
                [],
                |row| row.get(0),
            )
            .expect("index metadata should be readable");
        assert_eq!(index_count, 1);
    }
    #[test]
    fn v3_adds_streak_columns_and_preserves_v2_history() {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        connection
            .execute_batch(V1_SCHEMA)
            .expect("v1 schema should be installable");
        connection
            .execute_batch(V2_SCHEMA)
            .expect("v2 schema should be installable");
        connection
            .pragma_update(None, "user_version", 2)
            .expect("test schema version should be writable");
        connection
            .execute(
                "INSERT INTO game_stats
                 (game_id, best_score, games_played, wins, losses, draws, total_play_ms)
                 VALUES ('snake', 100, 5, 3, 2, 0, 4000)",
                [],
            )
            .expect("v2 game_stats row should be insertable");

        let version = run(&mut connection).expect("v2 should upgrade to v3");
        assert_eq!(version, LATEST_VERSION);
        assert_eq!(version, 3);

        for column in ["current_streak", "longest_streak", "fastest_win_moves", "fastest_win_ms"] {
            let count: i64 = connection
                .query_row(
                    "SELECT COUNT(*) FROM pragma_table_info('game_stats') WHERE name = ?1",
                    [column],
                    |row| row.get(0),
                )
                .expect("game_stats columns should be readable");
            assert_eq!(count, 1, "column {column} should exist");
        }

        let (best_score, current_streak, longest_streak, fastest_win_moves): (i64, i64, i64, Option<i64>) =
            connection
                .query_row(
                    "SELECT best_score, current_streak, longest_streak, fastest_win_moves
                     FROM game_stats WHERE game_id = 'snake'",
                    [],
                    |row| {
                        Ok((
                            row.get(0)?,
                            row.get(1)?,
                            row.get(2)?,
                            row.get(3)?,
                        ))
                    },
                )
                .expect("existing game_stats row should remain readable");
        assert_eq!(best_score, 100);
        assert_eq!(current_streak, 0);
        assert_eq!(longest_streak, 0);
        assert_eq!(fastest_win_moves, None);
    }

}