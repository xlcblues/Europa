use serde::ser::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("参数无效：{0}")]
    Validation(String),
    #[error("本地数据库操作失败")]
    Database(#[from] rusqlite::Error),
    #[error("文件系统操作失败")]
    Io(#[from] std::io::Error),
    #[error("应用路径解析失败")]
    Tauri(#[from] tauri::Error),
    #[error("本地数据格式无效")]
    InvalidData(#[from] serde_json::Error),
    #[error("数据库版本 {0} 高于当前应用支持的版本")]
    UnsupportedSchema(i64),
    #[error("应用状态暂时不可用")]
    StateUnavailable,
}

impl AppError {
    fn public_message(&self) -> &str {
        match self {
            Self::Validation(message) => message,
            Self::Database(_) => "本地存储暂时不可用，请稍后重试。",
            Self::Io(_) => "无法访问本地存储目录。",
            Self::Tauri(_) => "无法解析应用数据目录。",
            Self::InvalidData(_) => "本地数据格式无效，请重启应用。",
            Self::UnsupportedSchema(_) => "本地数据库版本与当前应用不兼容。",
            Self::StateUnavailable => "应用状态暂时不可用，请重启应用。",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.public_message())
    }
}
