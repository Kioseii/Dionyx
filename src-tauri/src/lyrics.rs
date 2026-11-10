//! Lyrics kept on this computer: an on-disk cache of what LRCLIB returned
//! (so lyrics work offline) and `.lrc` files sitting next to the songs.

use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

use crate::{ensure_library_audio_file, LibraryRoots};

const MAX_ENTRY_BYTES: usize = 256 * 1024;
const MAX_LRC_BYTES: u64 = 512 * 1024;

fn cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("lyrics");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// File name for a cache key (artist/title/duration): its SHA-256, so any
/// characters in song names are safe on disk.
fn entry_file(dir: &Path, key: &str) -> PathBuf {
    let digest = Sha256::digest(key.as_bytes());
    let name: String = digest.iter().map(|byte| format!("{byte:02x}")).collect();
    dir.join(format!("{name}.json"))
}

/// Text of a `.lrc` file: UTF-8 (with or without BOM), else Latin-1 like
/// older Windows tools write.
pub(crate) fn decode_text(bytes: &[u8]) -> String {
    let bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(bytes);
    match std::str::from_utf8(bytes) {
        Ok(text) => text.to_string(),
        Err(_) => bytes.iter().map(|&byte| byte as char).collect(),
    }
}

#[tauri::command]
pub async fn lyrics_cache_get(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    let file = entry_file(&cache_dir(&app)?, &key);
    tauri::async_runtime::spawn_blocking(move || match fs::read_to_string(&file) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn lyrics_cache_set(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    if value.len() > MAX_ENTRY_BYTES {
        return Err("Letra demasiado grande para la caché.".into());
    }
    let file = entry_file(&cache_dir(&app)?, &key);
    tauri::async_runtime::spawn_blocking(move || fs::write(&file, value).map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

/// Number of cached lyrics and their total size in bytes.
#[tauri::command]
pub async fn lyrics_cache_info(app: tauri::AppHandle) -> Result<(u32, u64), String> {
    let dir = cache_dir(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        let mut count = 0u32;
        let mut bytes = 0u64;
        for entry in fs::read_dir(&dir).map_err(|e| e.to_string())?.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    count += 1;
                    bytes += metadata.len();
                }
            }
        }
        Ok((count, bytes))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn lyrics_cache_clear(app: tauri::AppHandle) -> Result<(), String> {
    let dir = cache_dir(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        for entry in fs::read_dir(&dir).map_err(|e| e.to_string())?.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|extension| extension == "json") {
                let _ = fs::remove_file(path);
            }
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// The `.lrc` next to a library song (same name), if there is one.
#[tauri::command]
pub async fn lyrics_read_lrc(
    roots: tauri::State<'_, LibraryRoots>,
    path: String,
) -> Result<Option<String>, String> {
    let audio = ensure_library_audio_file(&roots, &path)?;
    let lrc = audio.with_extension("lrc");
    tauri::async_runtime::spawn_blocking(move || {
        let Ok(metadata) = fs::metadata(&lrc) else {
            return Ok(None);
        };
        if !metadata.is_file() || metadata.len() > MAX_LRC_BYTES {
            return Ok(None);
        }
        let text = decode_text(&fs::read(&lrc).map_err(|e| e.to_string())?);
        Ok((!text.trim().is_empty()).then_some(text))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_file_names_are_safe_and_stable() {
        let dir = Path::new("cache");
        let first = entry_file(dir, "米津玄師::Lemon::256");
        assert_eq!(first, entry_file(dir, "米津玄師::Lemon::256"));
        assert_ne!(first, entry_file(dir, "米津玄師::Lemon::257"));
        let name = first.file_name().unwrap().to_str().unwrap();
        assert!(name.ends_with(".json") && name.len() == 64 + 5);
        assert!(name.chars().all(|c| c.is_ascii_hexdigit() || c == '.' || c.is_ascii_alphabetic()));
    }

    #[test]
    fn lrc_text_handles_bom_and_latin1() {
        assert_eq!(decode_text(b"\xEF\xBB\xBF[00:01.00]Hola"), "[00:01.00]Hola");
        assert_eq!(decode_text(b"[00:01.00]Coraz\xF3n"), "[00:01.00]Corazón");
    }
}
