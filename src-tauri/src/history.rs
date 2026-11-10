//! Listening history: one JSON line per play in `<app data>/history.jsonl`.
//! Kept on disk (not localStorage) because a year of plays is several MB.
//! It feeds "recently played", "most played" and the statistics page.

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use tauri::Manager;

const FILE_NAME: &str = "history.jsonl";
const MAX_TEXT: usize = 300;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    /// Track key in the library (path based) at the time of the play.
    pub key: String,
    pub artist: String,
    pub title: String,
    pub album: String,
    /// Song length in seconds.
    pub duration: u32,
    /// When the play started (Unix seconds).
    pub started_at: i64,
    /// Seconds actually listened (seeks excluded).
    pub listened: u32,
}

impl HistoryEntry {
    fn sanitized(mut self) -> Self {
        let clip = |value: &mut String| {
            if value.chars().count() > MAX_TEXT {
                *value = value.chars().take(MAX_TEXT).collect();
            }
        };
        clip(&mut self.key);
        clip(&mut self.artist);
        clip(&mut self.title);
        clip(&mut self.album);
        self
    }
}

fn history_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(FILE_NAME))
}

fn append_entry(path: &PathBuf, entry: &HistoryEntry) -> Result<(), String> {
    let line = serde_json::to_string(entry).map_err(|e| e.to_string())?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| e.to_string())?;
    writeln!(file, "{line}").map_err(|e| e.to_string())
}

/// Reads every valid line; a damaged line (e.g. power cut mid-write) is skipped.
fn read_entries(path: &PathBuf) -> Result<Vec<HistoryEntry>, String> {
    let file = match fs::File::open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(error.to_string()),
    };

    Ok(BufReader::new(file)
        .lines()
        .map_while(Result::ok)
        .filter_map(|line| serde_json::from_str::<HistoryEntry>(&line).ok())
        .collect())
}

#[tauri::command]
pub async fn history_append(app: tauri::AppHandle, entry: HistoryEntry) -> Result<(), String> {
    let path = history_path(&app)?;
    let entry = entry.sanitized();
    tauri::async_runtime::spawn_blocking(move || append_entry(&path, &entry))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn history_read(app: tauri::AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let path = history_path(&app)?;
    tauri::async_runtime::spawn_blocking(move || read_entries(&path))
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(title: &str) -> HistoryEntry {
        HistoryEntry {
            key: format!("C:/Music/{title}.flac"),
            artist: "Band".into(),
            title: title.into(),
            album: "Album".into(),
            duration: 200,
            started_at: 1_700_000_000,
            listened: 120,
        }
    }

    #[test]
    fn appends_and_reads_back_skipping_damaged_lines() {
        let dir = std::env::temp_dir().join(format!("dionyx-history-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join(FILE_NAME);
        let _ = fs::remove_file(&path);

        append_entry(&path, &entry("One")).unwrap();
        fs::OpenOptions::new()
            .append(true)
            .open(&path)
            .unwrap()
            .write_all(b"{broken\n")
            .unwrap();
        append_entry(&path, &entry("Two")).unwrap();

        let read = read_entries(&path).unwrap();
        assert_eq!(read.iter().map(|e| e.title.as_str()).collect::<Vec<_>>(), vec!["One", "Two"]);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn missing_file_is_an_empty_history() {
        let path = std::env::temp_dir().join("dionyx-history-does-not-exist.jsonl");
        assert!(read_entries(&path).unwrap().is_empty());
    }

    #[test]
    fn long_text_is_clipped() {
        let mut long = entry("x");
        long.title = "a".repeat(1000);
        assert_eq!(long.sanitized().title.chars().count(), MAX_TEXT);
    }
}
