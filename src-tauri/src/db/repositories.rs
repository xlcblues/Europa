use std::{
    collections::BTreeMap,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::AppError;

const MAX_SETTING_JSON_BYTES: usize = 4096;
const SNAKE_GAME_ID: &str = "snake";
const PLATFORMER_GAME_ID: &str = "platformer";
const PLATFORMER_TOTAL_LEVELS: i64 = 3;
const PLATFORMER_LEVEL_CRYSTALS: [i64; 3] = [9, 12, 15];
const PLATFORMER_LEVEL_SENTINELS: [i64; 3] = [1, 2, 3];
const PLATFORMER_LEVEL_CHECKPOINTS: [i64; 3] = [1, 1, 2];
const PLATFORMER_SCORE_CRYSTAL: i64 = 100;
const PLATFORMER_SCORE_SENTINEL: i64 = 250;
const PLATFORMER_SCORE_CHECKPOINT: i64 = 100;
const PLATFORMER_SCORE_BEACON: i64 = 1000;
const PLATFORMER_SCORE_FULL_COLLECTION: i64 = 750;
const PLATFORMER_SCORE_ZERO_DEATH: i64 = 1000;
const PLATFORMER_SCORE_VICTORY: i64 = 2000;
const PLATFORMER_MAX_DURATION_MS: i64 = 86_400_000;
const PLATFORMER_MAX_SUBMISSION_SCORE: i64 = 1_000_000;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStat {
    pub game_id: String,
    pub best_score: i64,
    pub games_played: i64,
    pub wins: i64,
    pub losses: i64,
    pub draws: i64,
    pub total_play_ms: i64,
    pub last_played_at: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformerSave {
    pub slot: String,
    pub level_id: i64,
    pub checkpoint_id: String,
    pub score: i64,
    pub lives: i64,
    pub details: Value,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaInfo {
    pub version: i64,
    pub path: String,
    pub storage_mode: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapData {
    pub settings: BTreeMap<String, Value>,
    pub game_stats: Vec<GameStat>,
    pub latest_platformer_save: Option<PlatformerSave>,
    pub schema: SchemaInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingRecord {
    pub key: String,
    pub value: Value,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnakeMatchSubmission {
    pub session_id: String,
    pub outcome: String,
    pub score: i64,
    pub duration_ms: i64,
    pub food_eaten: i64,
    pub final_length: i64,
    pub speed_level: i64,
    pub tick_ms: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnakeMatchSubmissionResult {
    pub recorded: bool,
    pub stat: GameStat,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformerMatchLevelResult {
    pub level_id: i64,
    pub score: i64,
    pub crystals_collected: i64,
    pub crystals_total: i64,
    pub sentinels_defeated: i64,
    pub sentinels_total: i64,
    pub checkpoints_activated: i64,
    pub checkpoints_total: i64,
    pub deaths: i64,
    pub duration_ms: i64,
    pub completed: bool,
    pub reached_beacon: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformerMatchSubmission {
    pub session_id: String,
    pub outcome: String,
    pub score: i64,
    pub duration_ms: i64,
    pub levels_completed: i64,
    pub crystals_collected: i64,
    pub sentinels_defeated: i64,
    pub deaths: i64,
    pub level_results: Vec<PlatformerMatchLevelResult>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformerMatchSubmissionResult {
    pub recorded: bool,
    pub stat: GameStat,
}

pub fn load_bootstrap(
    connection: &Connection,
    database_path: &Path,
    schema_version: i64,
) -> Result<BootstrapData, AppError> {
    let settings = load_all_settings(connection)?;
    let game_stats = load_game_stats(connection)?;
    let latest_platformer_save = load_latest_platformer_save(connection)?;

    Ok(BootstrapData {
        settings,
        game_stats,
        latest_platformer_save,
        schema: SchemaInfo {
            version: schema_version,
            path: database_path.to_string_lossy().into_owned(),
            storage_mode: "sqlite".to_owned(),
        },
    })
}

pub fn save_setting(
    connection: &mut Connection,
    key: &str,
    value_json: &str,
) -> Result<SettingRecord, AppError> {
    let value = validate_setting(key, value_json)?;
    let canonical_json = serde_json::to_string(&value)?;
    let updated_at = now_millis();
    let transaction = connection.transaction()?;

    transaction.execute(
        "INSERT INTO settings (key, value_json, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET
             value_json = excluded.value_json,
             updated_at = excluded.updated_at",
        params![key, canonical_json, updated_at],
    )?;
    transaction.commit()?;

    Ok(SettingRecord {
        key: key.to_owned(),
        value,
        updated_at,
    })
}

pub fn submit_snake_match(
    connection: &mut Connection,
    submission: &SnakeMatchSubmission,
) -> Result<SnakeMatchSubmissionResult, AppError> {
    validate_snake_submission(submission)?;

    let transaction = connection.transaction()?;
    let existing_id: Option<i64> = transaction
        .query_row(
            "SELECT id FROM match_history WHERE session_id = ?1",
            [&submission.session_id],
            |row| row.get(0),
        )
        .optional()?;

    if existing_id.is_some() {
        let stat = load_game_stat(&transaction, SNAKE_GAME_ID)?
            .unwrap_or_else(|| empty_game_stat(SNAKE_GAME_ID));
        transaction.commit()?;
        return Ok(SnakeMatchSubmissionResult {
            recorded: false,
            stat,
        });
    }

    let now = now_millis();
    let victory = submission.outcome == "victory";
    let detail = serde_json::json!({
        "foodEaten": submission.food_eaten,
        "finalLength": submission.final_length,
        "speedLevel": submission.speed_level,
        "tickMs": submission.tick_ms,
    });
    let detail_json = serde_json::to_string(&detail)?;

    transaction.execute(
        "INSERT INTO match_history
         (game_id, outcome, score, duration_ms, detail_json, created_at, session_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            SNAKE_GAME_ID,
            submission.outcome,
            submission.score,
            submission.duration_ms,
            detail_json,
            now,
            submission.session_id,
        ],
    )?;

    transaction.execute(
        "INSERT INTO game_stats
         (game_id, best_score, games_played, wins, losses, draws, total_play_ms, last_played_at)
         VALUES (?1, ?2, 1, ?3, ?4, 0, ?5, ?6)
         ON CONFLICT(game_id) DO UPDATE SET
             best_score = MAX(game_stats.best_score, excluded.best_score),
             games_played = game_stats.games_played + 1,
             wins = game_stats.wins + excluded.wins,
             losses = game_stats.losses + excluded.losses,
             total_play_ms = game_stats.total_play_ms + excluded.total_play_ms,
             last_played_at = excluded.last_played_at",
        params![
            SNAKE_GAME_ID,
            submission.score,
            if victory { 1_i64 } else { 0_i64 },
            if victory { 0_i64 } else { 1_i64 },
            submission.duration_ms,
            now,
        ],
    )?;

    let stat = load_game_stat(&transaction, SNAKE_GAME_ID)?
        .unwrap_or_else(|| empty_game_stat(SNAKE_GAME_ID));
    transaction.commit()?;

    Ok(SnakeMatchSubmissionResult {
        recorded: true,
        stat,
    })
}

pub fn load_platformer_checkpoint(
    connection: &Connection,
    slot: &str,
) -> Result<Option<PlatformerSave>, AppError> {
    let row = connection
        .query_row(
            "SELECT slot, level_id, checkpoint_id, score, lives, details_json, updated_at
             FROM platformer_saves
             WHERE slot = ?1",
            [slot],
            |row| {
                let details_json: String = row.get(5)?;
                let details = serde_json::from_str(&details_json).map_err(|error| {
                    rusqlite::Error::FromSqlConversionFailure(
                        5,
                        rusqlite::types::Type::Text,
                        Box::new(error),
                    )
                })?;

                Ok(PlatformerSave {
                    slot: row.get(0)?,
                    level_id: row.get(1)?,
                    checkpoint_id: row.get(2)?,
                    score: row.get(3)?,
                    lives: row.get(4)?,
                    details,
                    updated_at: row.get(6)?,
                })
            },
        )
        .optional()?;

    Ok(row)
}

pub fn save_platformer_checkpoint(
    connection: &mut Connection,
    record: &PlatformerSave,
) -> Result<PlatformerSave, AppError> {
    validate_platformer_checkpoint(record)?;
    let updated_at = now_millis();
    let details_json = serde_json::to_string(&record.details)?;

    connection.execute(
        "INSERT INTO platformer_saves
         (slot, level_id, checkpoint_id, score, lives, details_json, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(slot) DO UPDATE SET
             level_id = excluded.level_id,
             checkpoint_id = excluded.checkpoint_id,
             score = excluded.score,
             lives = excluded.lives,
             details_json = excluded.details_json,
             updated_at = excluded.updated_at",
        params![
            record.slot,
            record.level_id,
            record.checkpoint_id,
            record.score,
            record.lives,
            details_json,
            updated_at,
        ],
    )?;

    Ok(PlatformerSave {
        slot: record.slot.clone(),
        level_id: record.level_id,
        checkpoint_id: record.checkpoint_id.clone(),
        score: record.score,
        lives: record.lives,
        details: record.details.clone(),
        updated_at,
    })
}

pub fn clear_platformer_checkpoint(connection: &Connection, slot: &str) -> Result<(), AppError> {
    connection.execute("DELETE FROM platformer_saves WHERE slot = ?1", [slot])?;
    Ok(())
}

pub fn submit_platformer_match(
    connection: &mut Connection,
    submission: &PlatformerMatchSubmission,
) -> Result<PlatformerMatchSubmissionResult, AppError> {
    validate_platformer_submission(submission)?;

    let transaction = connection.transaction()?;
    let existing_id: Option<i64> = transaction
        .query_row(
            "SELECT id FROM match_history WHERE session_id = ?1",
            [&submission.session_id],
            |row| row.get(0),
        )
        .optional()?;

    if existing_id.is_some() {
        let stat = load_game_stat(&transaction, PLATFORMER_GAME_ID)?
            .unwrap_or_else(|| empty_game_stat(PLATFORMER_GAME_ID));
        transaction.commit()?;
        return Ok(PlatformerMatchSubmissionResult {
            recorded: false,
            stat,
        });
    }

    let now = now_millis();
    let victory = submission.outcome == "victory";
    let detail = serde_json::json!({
        "levelsCompleted": submission.levels_completed,
        "crystalsCollected": submission.crystals_collected,
        "sentinelsDefeated": submission.sentinels_defeated,
        "deaths": submission.deaths,
        "levelResults": submission.level_results,
    });
    let detail_json = serde_json::to_string(&detail)?;

    transaction.execute(
        "INSERT INTO match_history
         (game_id, outcome, score, duration_ms, detail_json, created_at, session_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            PLATFORMER_GAME_ID,
            submission.outcome,
            submission.score,
            submission.duration_ms,
            detail_json,
            now,
            submission.session_id,
        ],
    )?;

    transaction.execute(
        "INSERT INTO game_stats
         (game_id, best_score, games_played, wins, losses, draws, total_play_ms, last_played_at)
         VALUES (?1, ?2, 1, ?3, ?4, 0, ?5, ?6)
         ON CONFLICT(game_id) DO UPDATE SET
             best_score = MAX(game_stats.best_score, excluded.best_score),
             games_played = game_stats.games_played + 1,
             wins = game_stats.wins + excluded.wins,
             losses = game_stats.losses + excluded.losses,
             total_play_ms = game_stats.total_play_ms + excluded.total_play_ms,
             last_played_at = excluded.last_played_at",
        params![
            PLATFORMER_GAME_ID,
            submission.score,
            if victory { 1_i64 } else { 0_i64 },
            if victory { 0_i64 } else { 1_i64 },
            submission.duration_ms,
            now,
        ],
    )?;

    let stat = load_game_stat(&transaction, PLATFORMER_GAME_ID)?
        .unwrap_or_else(|| empty_game_stat(PLATFORMER_GAME_ID));
    transaction.commit()?;

    Ok(PlatformerMatchSubmissionResult {
        recorded: true,
        stat,
    })
}

fn validate_platformer_checkpoint(record: &PlatformerSave) -> Result<(), AppError> {
    let valid_slot = (1..=64).contains(&record.slot.len())
        && record
            .slot
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-');
    if !valid_slot {
        return Err(AppError::Validation("存档槽位无效。".to_owned()));
    }
    if record.level_id < 1 {
        return Err(AppError::Validation("存档关卡无效。".to_owned()));
    }
    if record.score < 0 || record.lives < 0 {
        return Err(AppError::Validation("存档数据无效。".to_owned()));
    }
    Ok(())
}

fn validate_platformer_submission(submission: &PlatformerMatchSubmission) -> Result<(), AppError> {
    let valid_session_id = (8..=64).contains(&submission.session_id.len())
        && submission
            .session_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_');
    if !valid_session_id {
        return Err(AppError::Validation("对局会话 ID 无效。".to_owned()));
    }

    match submission.outcome.as_str() {
        "game_over" | "victory" => {}
        _ => {
            return Err(AppError::Validation("对局结果无效。".to_owned()));
        }
    }

    if !(0..=PLATFORMER_MAX_SUBMISSION_SCORE).contains(&submission.score) {
        return Err(AppError::Validation("对局分数无效。".to_owned()));
    }
    if !(0..=PLATFORMER_MAX_DURATION_MS).contains(&submission.duration_ms) {
        return Err(AppError::Validation("对局时长无效。".to_owned()));
    }
    if !(0..=PLATFORMER_TOTAL_LEVELS).contains(&submission.levels_completed) {
        return Err(AppError::Validation("通关进度无效。".to_owned()));
    }
    if !(0..=36).contains(&submission.crystals_collected) {
        return Err(AppError::Validation("收集数量无效。".to_owned()));
    }
    if !(0..=6).contains(&submission.sentinels_defeated) {
        return Err(AppError::Validation("哨兵数量无效。".to_owned()));
    }
    if submission.deaths < 0 {
        return Err(AppError::Validation("死亡次数无效。".to_owned()));
    }

    if submission.level_results.len() != PLATFORMER_TOTAL_LEVELS as usize {
        return Err(AppError::Validation("关卡结果无效。".to_owned()));
    }

    let mut expected_score = 0_i64;
    let mut expected_duration_ms = 0_i64;
    let mut expected_crystals = 0_i64;
    let mut expected_sentinels = 0_i64;
    let mut expected_deaths = 0_i64;
    let mut completed_count = 0_i64;
    let mut seen_incomplete = false;

    for (index, result) in submission.level_results.iter().enumerate() {
        let level_id = index as i64 + 1;
        let crystals_total = PLATFORMER_LEVEL_CRYSTALS[index];
        let sentinels_total = PLATFORMER_LEVEL_SENTINELS[index];
        let checkpoints_total = PLATFORMER_LEVEL_CHECKPOINTS[index];

        if result.level_id != level_id {
            return Err(AppError::Validation("关卡顺序无效。".to_owned()));
        }
        if result.score < 0 {
            return Err(AppError::Validation("关卡得分无效。".to_owned()));
        }
        if !(0..=crystals_total).contains(&result.crystals_collected) {
            return Err(AppError::Validation("关卡收集数量无效。".to_owned()));
        }
        if !(0..=sentinels_total).contains(&result.sentinels_defeated) {
            return Err(AppError::Validation("关卡哨兵数量无效。".to_owned()));
        }
        if !(0..=checkpoints_total).contains(&result.checkpoints_activated) {
            return Err(AppError::Validation("关卡检查点数量无效。".to_owned()));
        }
        if result.deaths < 0 {
            return Err(AppError::Validation("关卡死亡次数无效。".to_owned()));
        }
        if !(0..=PLATFORMER_MAX_DURATION_MS).contains(&result.duration_ms) {
            return Err(AppError::Validation("关卡时长无效。".to_owned()));
        }

        if seen_incomplete
            && (result.completed
                || result.reached_beacon
                || result.score != 0
                || result.crystals_collected != 0
                || result.sentinels_defeated != 0
                || result.checkpoints_activated != 0
                || result.deaths != 0
                || result.duration_ms != 0)
        {
            return Err(AppError::Validation(
                "未完成关卡之后存在进度数据。".to_owned(),
            ));
        }

        if result.completed {
            if !result.reached_beacon {
                return Err(AppError::Validation("已通关关卡缺少信标记录。".to_owned()));
            }
            completed_count += 1;
        } else {
            seen_incomplete = true;
        }

        let mut level_score = result.crystals_collected * PLATFORMER_SCORE_CRYSTAL;
        level_score += result.sentinels_defeated * PLATFORMER_SCORE_SENTINEL;
        level_score += result.checkpoints_activated * PLATFORMER_SCORE_CHECKPOINT;
        if result.reached_beacon {
            level_score += PLATFORMER_SCORE_BEACON;
        }
        if result.completed {
            if result.crystals_collected == crystals_total {
                level_score += PLATFORMER_SCORE_FULL_COLLECTION;
            }
            if result.deaths == 0 {
                level_score += PLATFORMER_SCORE_ZERO_DEATH;
            }
        }
        if level_id == PLATFORMER_TOTAL_LEVELS && completed_count == PLATFORMER_TOTAL_LEVELS {
            level_score += PLATFORMER_SCORE_VICTORY;
        }

        if result.score != level_score {
            return Err(AppError::Validation(
                "关卡得分与收集进度不一致。".to_owned(),
            ));
        }

        expected_score += level_score;
        expected_duration_ms += result.duration_ms;
        expected_crystals += result.crystals_collected;
        expected_sentinels += result.sentinels_defeated;
        expected_deaths += result.deaths;
    }

    if completed_count != submission.levels_completed {
        return Err(AppError::Validation("通关进度不一致。".to_owned()));
    }
    if completed_count == PLATFORMER_TOTAL_LEVELS && submission.outcome != "victory" {
        return Err(AppError::Validation(
            "胜利状态与通关进度不一致。".to_owned(),
        ));
    }
    if completed_count < PLATFORMER_TOTAL_LEVELS && submission.outcome != "game_over" {
        return Err(AppError::Validation(
            "对局结果与通关进度不一致。".to_owned(),
        ));
    }
    if submission.score != expected_score {
        return Err(AppError::Validation(
            "对局总分与关卡得分不一致。".to_owned(),
        ));
    }
    if submission.duration_ms != expected_duration_ms {
        return Err(AppError::Validation(
            "对局时长与关卡时长不一致。".to_owned(),
        ));
    }
    if submission.crystals_collected != expected_crystals {
        return Err(AppError::Validation("收集总数不一致。".to_owned()));
    }
    if submission.sentinels_defeated != expected_sentinels {
        return Err(AppError::Validation("哨兵总数不一致。".to_owned()));
    }
    if submission.deaths != expected_deaths {
        return Err(AppError::Validation("死亡总数不一致。".to_owned()));
    }

    Ok(())
}

#[cfg(test)]
pub fn load_setting_value(connection: &Connection, key: &str) -> Result<Option<Value>, AppError> {
    let value_json: Option<String> = connection
        .query_row(
            "SELECT value_json FROM settings WHERE key = ?1",
            [key],
            |row| row.get(0),
        )
        .optional()?;

    value_json
        .map(|raw| serde_json::from_str(&raw).map_err(AppError::from))
        .transpose()
}

fn load_all_settings(connection: &Connection) -> Result<BTreeMap<String, Value>, AppError> {
    let mut statement = connection.prepare(
        "SELECT key, value_json
         FROM settings
         ORDER BY key ASC",
    )?;
    let rows = statement.query_map([], |row| {
        let key: String = row.get(0)?;
        let raw: String = row.get(1)?;
        Ok((key, raw))
    })?;

    let mut settings = BTreeMap::new();
    for row in rows {
        let (key, raw) = row?;
        let value = serde_json::from_str(&raw)?;
        settings.insert(key, value);
    }

    Ok(settings)
}

fn load_game_stats(connection: &Connection) -> Result<Vec<GameStat>, AppError> {
    let mut statement = connection.prepare(
        "SELECT game_id, best_score, games_played, wins, losses, draws,
                total_play_ms, last_played_at
         FROM game_stats
         ORDER BY game_id ASC",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(GameStat {
            game_id: row.get(0)?,
            best_score: row.get(1)?,
            games_played: row.get(2)?,
            wins: row.get(3)?,
            losses: row.get(4)?,
            draws: row.get(5)?,
            total_play_ms: row.get(6)?,
            last_played_at: row.get(7)?,
        })
    })?;

    rows.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
}

fn load_game_stat(connection: &Connection, game_id: &str) -> Result<Option<GameStat>, AppError> {
    connection
        .query_row(
            "SELECT game_id, best_score, games_played, wins, losses, draws,
                    total_play_ms, last_played_at
             FROM game_stats
             WHERE game_id = ?1",
            [game_id],
            |row| {
                Ok(GameStat {
                    game_id: row.get(0)?,
                    best_score: row.get(1)?,
                    games_played: row.get(2)?,
                    wins: row.get(3)?,
                    losses: row.get(4)?,
                    draws: row.get(5)?,
                    total_play_ms: row.get(6)?,
                    last_played_at: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(AppError::from)
}

fn empty_game_stat(game_id: &str) -> GameStat {
    GameStat {
        game_id: game_id.to_owned(),
        best_score: 0,
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        total_play_ms: 0,
        last_played_at: None,
    }
}

fn load_latest_platformer_save(
    connection: &Connection,
) -> Result<Option<PlatformerSave>, AppError> {
    let row = connection
        .query_row(
            "SELECT slot, level_id, checkpoint_id, score, lives, details_json, updated_at
             FROM platformer_saves
             ORDER BY updated_at DESC
             LIMIT 1",
            [],
            |row| {
                let details_json: String = row.get(5)?;
                let details = serde_json::from_str(&details_json).map_err(|error| {
                    rusqlite::Error::FromSqlConversionFailure(
                        5,
                        rusqlite::types::Type::Text,
                        Box::new(error),
                    )
                })?;

                Ok(PlatformerSave {
                    slot: row.get(0)?,
                    level_id: row.get(1)?,
                    checkpoint_id: row.get(2)?,
                    score: row.get(3)?,
                    lives: row.get(4)?,
                    details,
                    updated_at: row.get(6)?,
                })
            },
        )
        .optional()?;

    Ok(row)
}

fn validate_setting(key: &str, value_json: &str) -> Result<Value, AppError> {
    if value_json.len() > MAX_SETTING_JSON_BYTES {
        return Err(AppError::Validation("设置值超出允许的长度。".to_owned()));
    }

    let value: Value = serde_json::from_str(value_json)
        .map_err(|_| AppError::Validation("设置值不是有效的 JSON。".to_owned()))?;

    match key {
        "theme" => match value.as_str() {
            Some("system" | "light" | "dark") => Ok(value),
            _ => Err(AppError::Validation(
                "主题只能是 system、light 或 dark。".to_owned(),
            )),
        },
        "sound_enabled" | "reduced_motion" => match value {
            Value::Bool(_) => Ok(value),
            _ => Err(AppError::Validation("该设置项必须是布尔值。".to_owned())),
        },
        "master_volume" => match value.as_f64() {
            Some(volume) if volume.is_finite() && (0.0..=1.0).contains(&volume) => Ok(value),
            _ => Err(AppError::Validation(
                "音量必须是 0 到 1 之间的数字。".to_owned(),
            )),
        },
        _ => Err(AppError::Validation("不支持的设置项。".to_owned())),
    }
}

fn validate_snake_submission(submission: &SnakeMatchSubmission) -> Result<(), AppError> {
    let valid_session_id = (8..=64).contains(&submission.session_id.len())
        && submission
            .session_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_');
    if !valid_session_id {
        return Err(AppError::Validation("对局会话 ID 无效。".to_owned()));
    }

    let victory = match submission.outcome.as_str() {
        "game_over" => false,
        "victory" => true,
        _ => {
            return Err(AppError::Validation("对局结果无效。".to_owned()));
        }
    };

    if !(0..=86_400_000).contains(&submission.duration_ms) {
        return Err(AppError::Validation("对局时长无效。".to_owned()));
    }
    if !(0..=396).contains(&submission.food_eaten) {
        return Err(AppError::Validation("食物数量无效。".to_owned()));
    }

    let expected_length = 4 + submission.food_eaten;
    if submission.final_length != expected_length {
        return Err(AppError::Validation("蛇身长度无效。".to_owned()));
    }

    let speed_level = submission.food_eaten / 5 + 1;
    let tick_ms = (130 - 8 * (submission.food_eaten / 5)).max(65);
    if submission.speed_level != speed_level || submission.tick_ms != tick_ms {
        return Err(AppError::Validation("速度数据无效。".to_owned()));
    }

    let expected_score = submission.food_eaten * 10 + if victory { 500 } else { 0 };
    if submission.score != expected_score {
        return Err(AppError::Validation("对局分数无效。".to_owned()));
    }
    if victory != (submission.food_eaten == 396) {
        return Err(AppError::Validation(
            "胜利状态与棋盘完成度不一致。".to_owned(),
        ));
    }

    Ok(())
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::{
        clear_platformer_checkpoint, load_platformer_checkpoint, load_setting_value,
        save_platformer_checkpoint, save_setting, submit_platformer_match, submit_snake_match,
        PlatformerMatchLevelResult, PlatformerMatchSubmission, PlatformerSave,
        SnakeMatchSubmission,
    };
    use crate::db::migrations;

    fn test_connection() -> Connection {
        let mut connection = Connection::open_in_memory().expect("in-memory database should open");
        migrations::run(&mut connection).expect("migration should succeed");
        connection
    }

    #[test]
    fn setting_write_is_readable_and_stable() {
        let mut connection = test_connection();
        let saved =
            save_setting(&mut connection, "theme", r#""dark""#).expect("valid theme should save");
        assert_eq!(saved.value, serde_json::json!("dark"));

        let loaded = load_setting_value(&connection, "theme")
            .expect("setting should be readable")
            .expect("setting should exist");
        assert_eq!(loaded, serde_json::json!("dark"));

        let overwritten = save_setting(&mut connection, "theme", r#""light""#)
            .expect("theme should be overwritable");
        assert_eq!(overwritten.value, serde_json::json!("light"));
    }

    #[test]
    fn invalid_key_and_value_are_rejected() {
        let mut connection = test_connection();
        assert!(save_setting(&mut connection, "unknown", "true").is_err());
        assert!(save_setting(&mut connection, "theme", r#""sepia""#).is_err());
        assert!(save_setting(&mut connection, "sound_enabled", "1").is_err());
    }

    #[test]
    fn injection_payload_does_not_change_schema() {
        let mut connection = test_connection();
        let payload = r#""dark'); DROP TABLE settings; --""#;

        let result = save_setting(&mut connection, "theme", payload);
        assert!(result.is_err());

        let table_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'settings'",
                [],
                |row| row.get(0),
            )
            .expect("schema should be readable");
        assert_eq!(table_count, 1);
    }

    fn platformer_victory_submission(session_id: &str) -> PlatformerMatchSubmission {
        PlatformerMatchSubmission {
            session_id: session_id.to_owned(),
            outcome: "victory".to_owned(),
            score: 15_750,
            duration_ms: 6_000,
            levels_completed: 3,
            crystals_collected: 36,
            sentinels_defeated: 6,
            deaths: 0,
            level_results: vec![
                PlatformerMatchLevelResult {
                    level_id: 1,
                    score: 4_000,
                    crystals_collected: 9,
                    crystals_total: 9,
                    sentinels_defeated: 1,
                    sentinels_total: 1,
                    checkpoints_activated: 1,
                    checkpoints_total: 1,
                    deaths: 0,
                    duration_ms: 1_000,
                    completed: true,
                    reached_beacon: true,
                },
                PlatformerMatchLevelResult {
                    level_id: 2,
                    score: 4_550,
                    crystals_collected: 12,
                    crystals_total: 12,
                    sentinels_defeated: 2,
                    sentinels_total: 2,
                    checkpoints_activated: 1,
                    checkpoints_total: 1,
                    deaths: 0,
                    duration_ms: 2_000,
                    completed: true,
                    reached_beacon: true,
                },
                PlatformerMatchLevelResult {
                    level_id: 3,
                    score: 7_200,
                    crystals_collected: 15,
                    crystals_total: 15,
                    sentinels_defeated: 3,
                    sentinels_total: 3,
                    checkpoints_activated: 2,
                    checkpoints_total: 2,
                    deaths: 0,
                    duration_ms: 3_000,
                    completed: true,
                    reached_beacon: true,
                },
            ],
        }
    }

    fn platformer_game_over_submission(session_id: &str) -> PlatformerMatchSubmission {
        PlatformerMatchSubmission {
            session_id: session_id.to_owned(),
            outcome: "game_over".to_owned(),
            score: 4_850,
            duration_ms: 3_000,
            levels_completed: 1,
            crystals_collected: 14,
            sentinels_defeated: 2,
            deaths: 1,
            level_results: vec![
                PlatformerMatchLevelResult {
                    level_id: 1,
                    score: 4_000,
                    crystals_collected: 9,
                    crystals_total: 9,
                    sentinels_defeated: 1,
                    sentinels_total: 1,
                    checkpoints_activated: 1,
                    checkpoints_total: 1,
                    deaths: 0,
                    duration_ms: 1_000,
                    completed: true,
                    reached_beacon: true,
                },
                PlatformerMatchLevelResult {
                    level_id: 2,
                    score: 850,
                    crystals_collected: 5,
                    crystals_total: 12,
                    sentinels_defeated: 1,
                    sentinels_total: 2,
                    checkpoints_activated: 1,
                    checkpoints_total: 1,
                    deaths: 1,
                    duration_ms: 2_000,
                    completed: false,
                    reached_beacon: false,
                },
                PlatformerMatchLevelResult {
                    level_id: 3,
                    score: 0,
                    crystals_collected: 0,
                    crystals_total: 15,
                    sentinels_defeated: 0,
                    sentinels_total: 3,
                    checkpoints_activated: 0,
                    checkpoints_total: 2,
                    deaths: 0,
                    duration_ms: 0,
                    completed: false,
                    reached_beacon: false,
                },
            ],
        }
    }

    #[test]
    fn platformer_checkpoint_save_load_and_clear() {
        let mut connection = test_connection();
        let record = PlatformerSave {
            slot: "platformer_main".to_owned(),
            level_id: 2,
            checkpoint_id: "checkpoint_1".to_owned(),
            score: 2_500,
            lives: 2,
            details: serde_json::json!({ "frozen": true }),
            updated_at: 0,
        };

        let saved = save_platformer_checkpoint(&mut connection, &record)
            .expect("platformer checkpoint should save");
        assert_eq!(saved.slot, "platformer_main");
        assert!(saved.updated_at > 0);

        let loaded = load_platformer_checkpoint(&connection, "platformer_main")
            .expect("platformer checkpoint should load")
            .expect("platformer checkpoint should exist");
        assert_eq!(loaded.level_id, 2);
        assert_eq!(loaded.checkpoint_id, "checkpoint_1");
        assert_eq!(loaded.score, 2_500);
        assert_eq!(loaded.lives, 2);
        assert_eq!(loaded.details, serde_json::json!({ "frozen": true }));

        let overwritten = PlatformerSave {
            slot: "platformer_main".to_owned(),
            level_id: 3,
            checkpoint_id: "checkpoint_2".to_owned(),
            score: 3_600,
            lives: 1,
            details: serde_json::json!({}),
            updated_at: 0,
        };
        save_platformer_checkpoint(&mut connection, &overwritten)
            .expect("platformer checkpoint should overwrite");
        let reloaded = load_platformer_checkpoint(&connection, "platformer_main")
            .expect("overwritten checkpoint should load")
            .expect("overwritten checkpoint should exist");
        assert_eq!(reloaded.level_id, 3);
        assert_eq!(reloaded.score, 3_600);

        clear_platformer_checkpoint(&connection, "platformer_main")
            .expect("platformer checkpoint should clear");
        let missing = load_platformer_checkpoint(&connection, "platformer_main")
            .expect("cleared checkpoint should read as missing");
        assert!(missing.is_none());
    }

    #[test]
    fn invalid_platformer_checkpoint_is_rejected() {
        let mut connection = test_connection();
        let invalid = PlatformerSave {
            slot: "bad slot/name".to_owned(),
            level_id: 1,
            checkpoint_id: "c".to_owned(),
            score: 0,
            lives: 3,
            details: serde_json::json!({}),
            updated_at: 0,
        };
        assert!(save_platformer_checkpoint(&mut connection, &invalid).is_err());
    }

    #[test]
    fn platformer_match_submission_is_idempotent() {
        let mut connection = test_connection();
        let submission = platformer_victory_submission("platformer-idem-0001");

        let first = submit_platformer_match(&mut connection, &submission)
            .expect("first platformer submission should succeed");
        assert!(first.recorded);
        assert_eq!(first.stat.best_score, 15_750);
        assert_eq!(first.stat.games_played, 1);
        assert_eq!(first.stat.wins, 1);
        assert_eq!(first.stat.total_play_ms, 6_000);

        let duplicate = submit_platformer_match(&mut connection, &submission)
            .expect("duplicate platformer submission should be ignored");
        assert!(!duplicate.recorded);
        assert_eq!(duplicate.stat.best_score, 15_750);
        assert_eq!(duplicate.stat.games_played, 1);
        assert_eq!(duplicate.stat.total_play_ms, 6_000);

        let history_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM match_history", [], |row| row.get(0))
            .expect("history should be readable");
        assert_eq!(history_count, 1);
    }

    #[test]
    fn platformer_stats_accumulate_and_best_score_only_increases() {
        let mut connection = test_connection();
        let first = platformer_game_over_submission("platformer-stat-0001");
        let second = platformer_victory_submission("platformer-stat-0002");

        submit_platformer_match(&mut connection, &first).expect("first match should save");
        let victory =
            submit_platformer_match(&mut connection, &second).expect("victory should save");

        assert_eq!(victory.stat.best_score, 15_750);
        assert_eq!(victory.stat.games_played, 2);
        assert_eq!(victory.stat.wins, 1);
        assert_eq!(victory.stat.losses, 1);
        assert_eq!(victory.stat.total_play_ms, 9_000);
        assert!(victory.stat.last_played_at.is_some());
    }

    #[test]
    fn inconsistent_platformer_result_is_rejected_without_writes() {
        let mut connection = test_connection();
        let mut submission = platformer_victory_submission("platformer-inv-0001");
        submission.score = 999;

        let result = submit_platformer_match(&mut connection, &submission);
        assert!(result.is_err());

        let history_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM match_history", [], |row| row.get(0))
            .expect("history should be readable");
        let stats_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM game_stats", [], |row| row.get(0))
            .expect("stats should be readable");
        assert_eq!(history_count, 0);
        assert_eq!(stats_count, 0);
    }

    fn snake_submission(
        session_id: &str,
        food_eaten: i64,
        victory: bool,
        duration_ms: i64,
    ) -> SnakeMatchSubmission {
        SnakeMatchSubmission {
            session_id: session_id.to_owned(),
            outcome: if victory { "victory" } else { "game_over" }.to_owned(),
            score: food_eaten * 10 + if victory { 500 } else { 0 },
            duration_ms,
            food_eaten,
            final_length: 4 + food_eaten,
            speed_level: food_eaten / 5 + 1,
            tick_ms: (130 - 8 * (food_eaten / 5)).max(65),
        }
    }

    #[test]
    fn snake_match_submission_is_idempotent() {
        let mut connection = test_connection();
        let submission = snake_submission("session-idempotent-001", 3, false, 1200);

        let first = submit_snake_match(&mut connection, &submission)
            .expect("first snake submission should succeed");
        assert!(first.recorded);
        assert_eq!(first.stat.best_score, 30);
        assert_eq!(first.stat.games_played, 1);
        assert_eq!(first.stat.losses, 1);
        assert_eq!(first.stat.total_play_ms, 1200);

        let duplicate = submit_snake_match(&mut connection, &submission)
            .expect("duplicate snake submission should be ignored");
        assert!(!duplicate.recorded);
        assert_eq!(duplicate.stat.best_score, 30);
        assert_eq!(duplicate.stat.games_played, 1);
        assert_eq!(duplicate.stat.total_play_ms, 1200);

        let history_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM match_history", [], |row| row.get(0))
            .expect("history should be readable");
        assert_eq!(history_count, 1);
    }

    #[test]
    fn snake_stats_accumulate_and_best_score_only_increases() {
        let mut connection = test_connection();
        let first = snake_submission("session-stats-0001", 4, false, 800);
        let second = snake_submission("session-stats-0002", 2, false, 600);
        let third = snake_submission("session-stats-0003", 396, true, 90_000);

        submit_snake_match(&mut connection, &first).expect("first match should save");
        submit_snake_match(&mut connection, &second).expect("second match should save");
        let victory = submit_snake_match(&mut connection, &third).expect("victory should save");

        assert_eq!(victory.stat.best_score, 4460);
        assert_eq!(victory.stat.games_played, 3);
        assert_eq!(victory.stat.wins, 1);
        assert_eq!(victory.stat.losses, 2);
        assert_eq!(victory.stat.total_play_ms, 91_400);
        assert!(victory.stat.last_played_at.is_some());
    }

    #[test]
    fn inconsistent_snake_result_is_rejected_without_writes() {
        let mut connection = test_connection();
        let mut submission = snake_submission("session-invalid-0001", 2, false, 500);
        submission.score = 999;

        let result = submit_snake_match(&mut connection, &submission);
        assert!(result.is_err());

        let history_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM match_history", [], |row| row.get(0))
            .expect("history should be readable");
        let stats_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM game_stats", [], |row| row.get(0))
            .expect("stats should be readable");
        assert_eq!(history_count, 0);
        assert_eq!(stats_count, 0);
    }
}
