//! Watches the scanned music folder and tells the app when audio files are
//! added, removed or renamed, so new downloads or deletions show up without
//! pressing "Scan". Events are grouped (2 s) so copying an album is one rescan.

use notify_debouncer_mini::{
    new_debouncer,
    notify::{RecommendedWatcher, RecursiveMode},
    DebounceEventResult, Debouncer,
};
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager};

use crate::is_supported_audio_file;

pub const LIBRARY_CHANGED_EVENT: &str = "library-changed";

#[derive(Default)]
pub struct LibraryWatcher(Mutex<Option<Debouncer<RecommendedWatcher>>>);

/// Whether a changed path can change the library: an audio file, or a path
/// that no longer exists and has no extension (a deleted or moved folder).
fn affects_library(path: &Path) -> bool {
    is_supported_audio_file(path) || (path.extension().is_none() && !path.exists())
}

/// (Re)starts watching `root`; a previous watch is dropped. Failures are not
/// fatal: the library simply needs a manual rescan, as before.
pub fn watch_library_root(app: &tauri::AppHandle, root: &Path) {
    let handle = app.clone();
    let debouncer = new_debouncer(Duration::from_secs(2), move |result: DebounceEventResult| {
        if let Ok(events) = result {
            if events.iter().any(|event| affects_library(&event.path)) {
                let _ = handle.emit(LIBRARY_CHANGED_EVENT, ());
            }
        }
    });

    let Ok(mut debouncer) = debouncer else {
        return;
    };
    if debouncer.watcher().watch(root, RecursiveMode::Recursive).is_err() {
        return;
    }

    let state = app.state::<LibraryWatcher>();
    let mut slot = state.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    *slot = Some(debouncer);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_audio_files_and_removed_folders_matter() {
        assert!(affects_library(Path::new("C:/Music/new song.flac")));
        assert!(affects_library(Path::new("C:/Music/does-not-exist-folder")));
        assert!(!affects_library(Path::new("C:/Music/cover.jpg")));
        assert!(!affects_library(Path::new("C:/Music/download.part")));
    }
}
