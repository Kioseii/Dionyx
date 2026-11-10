//! Library tools: M3U playlist files and sending songs to the Recycle Bin.

use std::fs;
use std::path::{Path, PathBuf};

use crate::lyrics::decode_text;
use crate::{ensure_library_audio_file, LibraryRoots};

const MAX_M3U_BYTES: u64 = 2 * 1024 * 1024;

/// Only real playlist files: the path comes from a file dialog, but the
/// command must not become a way to write or read anything else.
fn m3u_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    let is_m3u = path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("m3u") || extension.eq_ignore_ascii_case("m3u8"));
    if is_m3u {
        Ok(path)
    } else {
        Err("Solo se pueden usar archivos .m3u o .m3u8.".into())
    }
}

#[tauri::command]
pub async fn m3u_write(path: String, content: String) -> Result<(), String> {
    let path = m3u_path(&path)?;
    if content.len() as u64 > MAX_M3U_BYTES {
        return Err("La playlist es demasiado grande.".into());
    }
    tauri::async_runtime::spawn_blocking(move || fs::write(&path, content).map_err(|e| e.to_string()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn m3u_read(path: String) -> Result<String, String> {
    let path = m3u_path(&path)?;
    tauri::async_runtime::spawn_blocking(move || {
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        if metadata.len() > MAX_M3U_BYTES {
            return Err("La playlist es demasiado grande.".into());
        }
        Ok(decode_text(&fs::read(&path).map_err(|e| e.to_string())?))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Moves a library song to the Recycle Bin (recoverable, never a permanent delete).
#[tauri::command]
pub async fn trash_track_file(roots: tauri::State<'_, LibraryRoots>, path: String) -> Result<(), String> {
    let file = ensure_library_audio_file(&roots, &path)?;
    tauri::async_runtime::spawn_blocking(move || trash_path(&file))
        .await
        .map_err(|e| e.to_string())?
}

fn trash_path(path: &Path) -> Result<(), String> {
    trash::delete(path).map_err(|e| format!("No se pudo mover a la papelera: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_m3u_files_are_accepted() {
        assert!(m3u_path("C:/Lists/Road trip.m3u8").is_ok());
        assert!(m3u_path("C:/Lists/old.M3U").is_ok());
        assert!(m3u_path("C:/Windows/system.ini").is_err());
        assert!(m3u_path("C:/Lists/no-extension").is_err());
    }
}
