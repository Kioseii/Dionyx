use lofty::{
    prelude::{Accessor, AudioFile, TaggedFileExt},
    probe::Probe,
};
use serde::Serialize;
use std::{
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

mod lastfm;

// ── Discord Rich Presence (custom IPC — supports activity type 2 "Listening") ──

const DISCORD_CLIENT_ID: &str = "1518467237512609883";

#[cfg(target_os = "windows")]
struct DiscordPipe(std::fs::File);

#[cfg(target_os = "windows")]
struct DiscordState(Mutex<Option<DiscordPipe>>);

#[cfg(not(target_os = "windows"))]
struct DiscordState;

#[cfg(target_os = "windows")]
fn create_discord_state() -> DiscordState {
    DiscordState(Mutex::new(None))
}

#[cfg(not(target_os = "windows"))]
fn create_discord_state() -> DiscordState {
    DiscordState
}

#[cfg(target_os = "windows")]
fn discord_connect() -> Option<DiscordPipe> {
    for i in 0..10u32 {
        for path in [
            format!(r"\\?\pipe\discord-ipc-{}", i),
            format!(r"\\.\pipe\discord-ipc-{}", i),
        ] {
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .read(true)
                .write(true)
                .open(&path)
            {
                // Send handshake (opcode 0)
                let hs = serde_json::json!({
                    "v": 1,
                    "client_id": DISCORD_CLIENT_ID
                })
                .to_string();
                if discord_write(&mut f, 0, &hs).is_ok() {
                    // Wait briefly for the READY response without ever blocking
                    // indefinitely: a client that never answers must not hang
                    // the command (and the mutex) forever.
                    for _ in 0..20 {
                        match discord_bytes_available(&f) {
                            None => break,
                            Some(0) => std::thread::sleep(Duration::from_millis(100)),
                            Some(_) => break,
                        }
                    }
                    if discord_drain(&mut f).is_ok() {
                        return Some(DiscordPipe(f));
                    }
                }
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn discord_write(f: &mut std::fs::File, opcode: u32, payload: &str) -> std::io::Result<()> {
    let data = payload.as_bytes();
    let len = data.len() as u32;
    let mut header = [0u8; 8];
    header[0..4].copy_from_slice(&opcode.to_le_bytes());
    header[4..8].copy_from_slice(&len.to_le_bytes());
    f.write_all(&header)?;
    f.write_all(data)?;
    f.flush()
}

#[cfg(target_os = "windows")]
fn discord_read(f: &mut std::fs::File) -> std::io::Result<String> {
    let mut header = [0u8; 8];
    f.read_exact(&mut header)?;
    let len = u32::from_le_bytes(header[4..8].try_into().unwrap()) as usize;
    let mut buf = vec![0u8; len];
    f.read_exact(&mut buf)?;
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

/// Number of bytes waiting in the named pipe, or `None` if the pipe is broken.
/// Uses `PeekNamedPipe`, which never blocks.
#[cfg(target_os = "windows")]
fn discord_bytes_available(f: &std::fs::File) -> Option<u32> {
    use std::os::windows::io::AsRawHandle;

    #[link(name = "kernel32")]
    extern "system" {
        fn PeekNamedPipe(
            pipe: *mut std::ffi::c_void,
            buffer: *mut std::ffi::c_void,
            buffer_size: u32,
            bytes_read: *mut u32,
            total_bytes_avail: *mut u32,
            bytes_left_this_message: *mut u32,
        ) -> i32;
    }

    let mut available: u32 = 0;
    // SAFETY: the handle comes from a live `File`; all out-pointers are either
    // null (allowed by the API) or point to a valid local.
    let ok = unsafe {
        PeekNamedPipe(
            f.as_raw_handle(),
            std::ptr::null_mut(),
            0,
            std::ptr::null_mut(),
            &mut available,
            std::ptr::null_mut(),
        )
    };

    if ok == 0 {
        None
    } else {
        Some(available)
    }
}

/// Consumes every response frame Discord already wrote, so the pipe buffer never
/// fills up. Returns an error if the pipe is closed (caller reconnects).
#[cfg(target_os = "windows")]
fn discord_drain(f: &mut std::fs::File) -> std::io::Result<()> {
    loop {
        match discord_bytes_available(f) {
            None => {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::BrokenPipe,
                    "discord pipe closed",
                ))
            }
            Some(available) if available >= 8 => {
                discord_read(f)?;
            }
            Some(_) => return Ok(()),
        }
    }
}

#[cfg(target_os = "windows")]
fn lock_discord(state: &DiscordState) -> std::sync::MutexGuard<'_, Option<DiscordPipe>> {
    // A panic while holding the lock must not disable Rich Presence for the rest
    // of the session.
    state.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[cfg(target_os = "windows")]
enum DiscordSendError {
    /// The pipe broke: reconnect and retry.
    Pipe,
    /// Discord answered with an ERROR event (shown to the user).
    Rejected(String),
}

/// Sends SET_ACTIVITY and waits briefly for Discord's answer to that nonce, so
/// rejections (bad client id, invalid payload, ...) are reported instead of
/// silently ignored. No answer within the timeout counts as success.
#[cfg(target_os = "windows")]
fn discord_set_activity(
    pipe: &mut DiscordPipe,
    payload: serde_json::Value,
) -> Result<(), DiscordSendError> {
    discord_drain(&mut pipe.0).map_err(|_| DiscordSendError::Pipe)?;

    let nonce = uuid_v4();
    let msg = serde_json::json!({
        "cmd": "SET_ACTIVITY",
        "args": {
            "pid": std::process::id(),
            "activity": payload
        },
        "nonce": nonce
    })
    .to_string();

    discord_write(&mut pipe.0, 1, &msg).map_err(|_| DiscordSendError::Pipe)?;
    discord_await_response(&mut pipe.0, &nonce, Duration::from_millis(600))
}

#[cfg(target_os = "windows")]
fn discord_await_response(
    f: &mut std::fs::File,
    nonce: &str,
    timeout: Duration,
) -> Result<(), DiscordSendError> {
    let deadline = std::time::Instant::now() + timeout;

    loop {
        match discord_bytes_available(f) {
            None => return Err(DiscordSendError::Pipe),
            Some(available) if available >= 8 => {
                let frame = discord_read(f).map_err(|_| DiscordSendError::Pipe)?;
                if let Some(result) = discord_response_for_nonce(&frame, nonce) {
                    return result.map_err(DiscordSendError::Rejected);
                }
            }
            Some(_) => {
                if std::time::Instant::now() >= deadline {
                    return Ok(());
                }
                std::thread::sleep(Duration::from_millis(25));
            }
        }
    }
}

/// `Some(Ok)` / `Some(Err(message))` if `frame` answers `nonce`, else `None`.
fn discord_response_for_nonce(frame: &str, nonce: &str) -> Option<Result<(), String>> {
    let value = serde_json::from_str::<serde_json::Value>(frame).ok()?;

    if value.get("nonce").and_then(|n| n.as_str()) != Some(nonce) {
        return None;
    }

    if value.get("evt").and_then(|e| e.as_str()) == Some("ERROR") {
        let message = value
            .pointer("/data/message")
            .and_then(|m| m.as_str())
            .unwrap_or("Discord rechazo la actividad.")
            .to_string();
        return Some(Err(message));
    }

    Some(Ok(()))
}

/// Error string the frontend treats as "Discord is not open" (not shown).
#[cfg(target_os = "windows")]
const DISCORD_NOT_RUNNING: &str = "discord-not-running";

fn uuid_v4() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::sync::atomic::AtomicU64;

    // Nonces are matched against Discord's answers: never reuse one.
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let mut h = DefaultHasher::new();
    SystemTime::now().hash(&mut h);
    std::process::id().hash(&mut h);
    COUNTER.fetch_add(1, Ordering::Relaxed).hash(&mut h);
    let n = h.finish();
    format!(
        "{:016x}-{:04x}-4{:03x}-{:04x}-{:012x}",
        n >> 32,
        (n >> 16) & 0xffff,
        (n >> 4) & 0xfff,
        0x8000 | ((n >> 2) & 0x3fff),
        n & 0xffffffffffff
    )
}

// Discord IPC is blocking pipe I/O: run it on the blocking pool, never on the
// main thread (sync Tauri commands run on the main thread and freeze the UI).
#[tauri::command]
#[cfg(target_os = "windows")]
async fn update_discord_presence(
    app: tauri::AppHandle,
    title: String,
    artist: String,
    cover_url: Option<String>,
    elapsed_secs: f64,
    duration_secs: f64,
    is_playing: bool,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<DiscordState>();
        update_discord_presence_blocking(
            &state,
            title,
            artist,
            cover_url,
            elapsed_secs,
            duration_secs,
            is_playing,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(target_os = "windows")]
fn update_discord_presence_blocking(
    state: &DiscordState,
    title: String,
    artist: String,
    cover_url: Option<String>,
    elapsed_secs: f64,
    duration_secs: f64,
    is_playing: bool,
) -> Result<(), String> {
    let mut guard = lock_discord(state);

    if guard.is_none() {
        *guard = discord_connect();
    }

    let Some(pipe) = guard.as_mut() else {
        return Err(DISCORD_NOT_RUNNING.into());
    };

    {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let start_ts = now - elapsed_secs as i64;
        let end_ts = start_ts + duration_secs as i64;

        let large_image = cover_url.as_deref().unwrap_or("dionyx-logo");

        let mut activity = serde_json::json!({
            "type": 2,
            "details": title,
            "state": artist,
            "assets": {
                "large_image": large_image,
                "large_text": "DIONYX"
            }
        });

        if is_playing && duration_secs > 0.0 {
            activity["timestamps"] = serde_json::json!({
                "start": start_ts,
                "end": end_ts
            });
        } else if is_playing {
            activity["timestamps"] = serde_json::json!({ "start": start_ts });
        }

        match discord_set_activity(pipe, activity.clone()) {
            Ok(()) => Ok(()),
            Err(DiscordSendError::Rejected(message)) => Err(message),
            Err(DiscordSendError::Pipe) => {
                // Discord restarted: reconnect once and retry.
                *guard = discord_connect();
                match guard.as_mut() {
                    None => Err(DISCORD_NOT_RUNNING.into()),
                    Some(reconnected) => match discord_set_activity(reconnected, activity) {
                        Ok(()) => Ok(()),
                        Err(DiscordSendError::Rejected(message)) => Err(message),
                        Err(DiscordSendError::Pipe) => {
                            *guard = None;
                            Err(DISCORD_NOT_RUNNING.into())
                        }
                    },
                }
            }
        }
    }
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn update_discord_presence(
    _title: String,
    _artist: String,
    _cover_url: Option<String>,
    _elapsed_secs: f64,
    _duration_secs: f64,
    _is_playing: bool,
    _state: tauri::State<DiscordState>,
) {}

#[tauri::command]
#[cfg(target_os = "windows")]
async fn clear_discord_presence(app: tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<DiscordState>();
        let mut guard = lock_discord(&state);
        if let Some(pipe) = guard.as_mut() {
            if discord_drain(&mut pipe.0).is_err() {
                *guard = None;
                return;
            }
            let msg = serde_json::json!({
                "cmd": "SET_ACTIVITY",
                "args": {
                    "pid": std::process::id(),
                    "activity": serde_json::Value::Null
                },
                "nonce": uuid_v4()
            })
            .to_string();
            if discord_write(&mut pipe.0, 1, &msg).is_err() {
                *guard = None;
            }
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn clear_discord_presence(_state: tauri::State<DiscordState>) {}

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
const CREATE_NO_WINDOW: u32 = 0x08000000;

// ── Generic HTTP fetch (for Last.fm, etc.) ────────────────────────────────

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let parsed = validate_fetch_url(&url)?;

    reqwest::Client::builder()
        .user_agent("DIONYX lyrics module")
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?
        .get(parsed)
        .send()
        .await
        .and_then(|response| response.error_for_status())
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

/// Hosts the frontend is allowed to reach through `fetch_url` (which exists
/// to bypass CORS). Anything else is refused so the command cannot be used as
/// a general-purpose proxy.
const FETCH_URL_ALLOWED_HOSTS: &[&str] = &["ws.audioscrobbler.com", "lrclib.net", "api.deezer.com"];

fn validate_fetch_url(url: &str) -> Result<reqwest::Url, String> {
    let parsed = reqwest::Url::parse(url).map_err(|_| "URL no valida.".to_string())?;

    if parsed.scheme() != "https" {
        return Err("Solo se permiten URLs https.".into());
    }

    match parsed.host_str() {
        Some(host) if FETCH_URL_ALLOWED_HOSTS.contains(&host) => Ok(parsed),
        _ => Err("Host no permitido.".into()),
    }
}

// ── Library roots (write/delete guard) ────────────────────────────────────

/// Canonical folders scanned during this session. Commands that modify or
/// delete files only act inside them.
struct LibraryRoots(Mutex<Vec<PathBuf>>);

fn remember_library_root(state: &LibraryRoots, root: &Path) {
    if let Ok(canonical) = root.canonicalize() {
        let mut roots = state.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        if !roots.contains(&canonical) {
            roots.push(canonical);
        }
    }
}

fn is_inside_roots(roots: &[PathBuf], canonical: &Path) -> bool {
    roots.iter().any(|root| canonical.starts_with(root))
}

/// Resolves `path` and checks that it is a supported audio file inside a
/// scanned library folder.
fn ensure_library_audio_file(state: &LibraryRoots, path: &str) -> Result<PathBuf, String> {
    let canonical = PathBuf::from(path)
        .canonicalize()
        .map_err(|_| "El archivo no existe en el disco.".to_string())?;

    if !canonical.is_file() || !is_supported_audio_file(&canonical) {
        return Err("Solo se pueden modificar archivos de audio de la biblioteca.".into());
    }

    let roots = state.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if !is_inside_roots(&roots, &canonical) {
        return Err("El archivo esta fuera de la biblioteca escaneada.".into());
    }

    Ok(canonical)
}

fn ensure_library_folder(state: &LibraryRoots, path: &str) -> Result<PathBuf, String> {
    let canonical = PathBuf::from(path)
        .canonicalize()
        .map_err(|_| "La carpeta de destino no existe.".to_string())?;

    let roots = state.0.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if !canonical.is_dir() || !is_inside_roots(&roots, &canonical) {
        return Err("La carpeta de destino no es una biblioteca escaneada.".into());
    }

    Ok(canonical)
}

// ── Tray state ────────────────────────────────────────────────────────────

struct HideOnTrayState(AtomicBool);

#[tauri::command]
fn set_hide_on_tray(enabled: bool, state: tauri::State<HideOnTrayState>) {
    state.0.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "mp3", "flac", "wav", "aiff", "aif", "alac", "m4a", "aac", "ogg", "opus",
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TrackSearchResult {
    id: String,
    title: String,
    channel: String,
    duration: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LibraryTrack {
    title: String,
    artist: String,
    album: String,
    format: String,
    quality: String,
    duration: String,
    path: String,
    /// Cached cover on disk (served through the asset protocol).
    artwork_path: Option<String>,
    /// Only used when the cover could not be written to the cache.
    artwork_data_url: Option<String>,
    /// File modification time (Unix seconds), used for "recently added".
    modified_at: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LibraryScan {
    collection_name: String,
    scanned_path: String,
    track_count: usize,
    tracks: Vec<LibraryTrack>,
}

#[tauri::command]
async fn scan_music_folder(
    app: tauri::AppHandle,
    folder_path: String,
) -> Result<LibraryScan, String> {
    let artwork_dir = app
        .path()
        .app_cache_dir()
        .ok()
        .map(|dir| dir.join("artwork"))
        .filter(|dir| fs::create_dir_all(dir).is_ok());

    let scan = run_blocking(move || scan_music_folder_blocking(&folder_path, artwork_dir.as_deref()))
        .await?;
    remember_library_root(&app.state::<LibraryRoots>(), Path::new(&scan.scanned_path));
    Ok(scan)
}

fn scan_music_folder_blocking(
    folder_path: &str,
    artwork_dir: Option<&Path>,
) -> Result<LibraryScan, String> {
    let root = PathBuf::from(folder_path);

    if !root.exists() {
        return Err("La carpeta seleccionada no existe.".into());
    }

    if !root.is_dir() {
        return Err("La ruta seleccionada no es una carpeta valida.".into());
    }

    let collection_name = root
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or("Biblioteca local")
        .to_string();

    let mut audio_files = Vec::new();
    // Only the root folder itself must be readable; unreadable subfolders are
    // skipped instead of failing the whole scan.
    fs::read_dir(&root).map_err(|error| format!("No pude leer la carpeta: {error}"))?;
    collect_audio_files(&root, &mut audio_files);

    audio_files.sort_by(|left, right| {
        left.file_name()
            .cmp(&right.file_name())
            .then_with(|| left.cmp(right))
    });

    let tracks = audio_files
        .iter()
        .map(|path| track_from_path(path, artwork_dir))
        .collect::<Vec<_>>();

    Ok(LibraryScan {
        collection_name,
        scanned_path: root.display().to_string(),
        track_count: tracks.len(),
        tracks,
    })
}

/// Recursively collects supported audio files. Symlinked/junction folders are
/// not followed (avoids cycles) and unreadable entries are skipped.
fn collect_audio_files(directory: &Path, output: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };

    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        let path = entry.path();

        if file_type.is_dir() {
            collect_audio_files(&path, output);
        } else if (file_type.is_file() || file_type.is_symlink()) && is_supported_audio_file(&path) {
            output.push(path);
        }
    }
}

fn is_supported_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            let normalized = extension.to_ascii_lowercase();
            SUPPORTED_EXTENSIONS
                .iter()
                .any(|supported| supported == &normalized)
        })
        .unwrap_or(false)
}

fn track_from_path(path: &Path, artwork_dir: Option<&Path>) -> LibraryTrack {
    let file_stem = path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("Unknown Track");

    let (fallback_artist, fallback_title) = parse_track_name(file_stem);

    // Use the parsed artist as fallback album — cleaner than showing the folder name
    let fallback_album = fallback_artist.clone();

    let format = path
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or("--")
        .to_ascii_uppercase();

    let quality = match format.as_str() {
        "FLAC" | "ALAC" | "WAV" | "AIFF" | "AIF" => "Lossless local",
        _ => "Compressed local",
    }
    .to_string();

    let mut track = LibraryTrack {
        title: fallback_title,
        artist: fallback_artist,
        album: fallback_album,
        format,
        quality,
        duration: "--:--".into(),
        path: path.display().to_string(),
        artwork_path: None,
        artwork_data_url: None,
        modified_at: fs::metadata(path)
            .and_then(|metadata| metadata.modified())
            .ok()
            .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
            .map(|elapsed| elapsed.as_secs()),
    };

    if let Ok(tagged_file) = Probe::open(path).and_then(|probe| probe.read()) {
        if let Some(tag) = tagged_file
            .primary_tag()
            .or_else(|| tagged_file.first_tag())
        {
            if let Some(title) = clean_metadata_value(tag.title().as_deref()) {
                track.title = title;
            }

            if let Some(artist) = clean_metadata_value(tag.artist().as_deref()) {
                track.artist = artist;
            }

            if let Some(album) = clean_metadata_value(tag.album().as_deref()) {
                track.album = album;
            } else {
                // No album tag: use the artist name so tracks group aesthetically
                // instead of showing the folder name ("Descargas", "Downloads", etc.)
                track.album = track.artist.clone();
            }

            if let Some(picture) = tag.pictures().first() {
                match artwork_dir.and_then(|dir| cache_artwork(dir, picture)) {
                    Some(cached) => track.artwork_path = Some(cached),
                    None => track.artwork_data_url = artwork_data_url(picture),
                }
            }
        }

        track.duration = format_duration(tagged_file.properties().duration());
    }

    track
}

fn parse_track_name(file_stem: &str) -> (String, String) {
    if let Some((artist, title)) = file_stem.split_once(" - ") {
        return (artist.trim().to_string(), title.trim().to_string());
    }

    ("Unknown Artist".into(), file_stem.replace('_', " "))
}

fn clean_metadata_value(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

/// Image type of an embedded cover: declared MIME first, then magic bytes.
fn artwork_kind(picture: &lofty::picture::Picture) -> Option<(&'static str, &'static str)> {
    use lofty::picture::MimeType;

    match picture.mime_type() {
        Some(MimeType::Png) => return Some(("png", "image/png")),
        Some(MimeType::Jpeg) => return Some(("jpg", "image/jpeg")),
        Some(MimeType::Gif) => return Some(("gif", "image/gif")),
        Some(MimeType::Bmp) => return Some(("bmp", "image/bmp")),
        _ => {}
    }

    let data = picture.data();
    if data.starts_with(&[0x89, b'P', b'N', b'G']) {
        Some(("png", "image/png"))
    } else if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some(("jpg", "image/jpeg"))
    } else {
        None
    }
}

/// Writes the cover to `<cache>/artwork/<sha256>.<ext>` (once per distinct
/// image, so a whole album shares one file) and returns its path.
fn cache_artwork(dir: &Path, picture: &lofty::picture::Picture) -> Option<String> {
    use sha2::{Digest, Sha256};

    let (extension, _) = artwork_kind(picture)?;
    let data = picture.data();
    if data.is_empty() {
        return None;
    }

    let digest = format!("{:x}", Sha256::digest(data));
    let file = dir.join(format!("{}.{extension}", &digest[..32]));

    if !file.exists() {
        let partial = dir.join(format!("{}.{extension}.part", &digest[..32]));
        fs::write(&partial, data).ok()?;
        if fs::rename(&partial, &file).is_err() {
            let _ = fs::remove_file(&partial);
            if !file.exists() {
                return None;
            }
        }
    }

    Some(file.display().to_string())
}

fn artwork_data_url(picture: &lofty::picture::Picture) -> Option<String> {
    let (_, mime_type) = artwork_kind(picture)?;
    let encoded = {
        use base64::{engine::general_purpose::STANDARD, Engine as _};

        STANDARD.encode(picture.data())
    };

    Some(format!("data:{mime_type};base64,{encoded}"))
}

fn format_duration(duration: Duration) -> String {
    let total_seconds = duration.as_secs();

    if total_seconds == 0 {
        return "--:--".into();
    }

    let minutes = total_seconds / 60;
    let seconds = total_seconds % 60;

    format!("{minutes}:{seconds:02}")
}

// ── Metadata writing ─────────────────────────────────────────────────────

/// Writes title, artist, album (and optionally a new cover image) to an audio file.
/// `artwork_b64` is a base64-encoded JPEG or PNG; `artwork_mime` is its MIME type.
#[tauri::command]
async fn save_track_metadata(
    roots: tauri::State<'_, LibraryRoots>,
    path: String,
    title: String,
    artist: String,
    album: String,
    artwork_b64: Option<String>,
    artwork_mime: Option<String>,
) -> Result<(), String> {
    let path = ensure_library_audio_file(&roots, &path)?
        .display()
        .to_string();
    run_blocking(move || {
        save_track_metadata_blocking(path, title, artist, album, artwork_b64, artwork_mime)
    })
    .await
}

fn save_track_metadata_blocking(
    path: String,
    title: String,
    artist: String,
    album: String,
    artwork_b64: Option<String>,
    artwork_mime: Option<String>,
) -> Result<(), String> {
    use lofty::{
        config::WriteOptions,
        picture::{MimeType, Picture, PictureType},
        prelude::{Accessor, TaggedFileExt},
    };

    let file_path = std::path::PathBuf::from(&path);

    let mut tagged_file = lofty::probe::Probe::open(&file_path)
        .and_then(|p| p.read())
        .map_err(|e| format!("No se pudo leer el archivo: {e}"))?;

    let has_primary = tagged_file.primary_tag().is_some();
    let tag = if has_primary {
        tagged_file.primary_tag_mut().unwrap()
    } else {
        tagged_file
            .first_tag_mut()
            .ok_or_else(|| "El archivo no tiene tags compatibles.".to_string())?
    };

    if !title.is_empty() {
        tag.set_title(title);
    }
    if !artist.is_empty() {
        tag.set_artist(artist);
    }
    if !album.is_empty() {
        tag.set_album(album);
    }

    if let (Some(b64), Some(mime_str)) = (artwork_b64, artwork_mime) {
        use base64::{engine::general_purpose::STANDARD, Engine as _};

        let bytes = STANDARD
            .decode(&b64)
            .map_err(|e| format!("Error decodificando la imagen: {e}"))?;

        let mime_type = match mime_str.as_str() {
            "image/png" => MimeType::Png,
            _ => MimeType::Jpeg,
        };

        let picture = Picture::new_unchecked(PictureType::CoverFront, Some(mime_type), None, bytes);

        tag.remove_picture_type(PictureType::CoverFront);
        tag.push_picture(picture);
    }

    tagged_file
        .save_to_path(&file_path, WriteOptions::default())
        .map_err(|e| format!("No se pudo guardar: {e}"))?;

    Ok(())
}

// ── yt-dlp integration ────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    download_id: String,
    percent: f32,
    speed: String,
    eta: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadDone {
    download_id: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadFailed {
    download_id: String,
    message: String,
}

/// Permanently deletes an audio file from disk.
#[tauri::command]
async fn delete_track_file(
    roots: tauri::State<'_, LibraryRoots>,
    path: String,
) -> Result<(), String> {
    // Only audio files inside a folder scanned this session can be deleted.
    let file_path = ensure_library_audio_file(&roots, &path)?;
    run_blocking(move || {
        std::fs::remove_file(&file_path)
            .map_err(|e| format!("No se pudo eliminar el archivo: {e}"))
    })
    .await
}

/// Runs blocking work (file I/O, child processes) on Tauri's blocking pool so
/// it never stalls the main thread or an async worker.
async fn run_blocking<T, F>(work: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|e| format!("La tarea en segundo plano falló: {e}"))?
}

/// Returns `Ok(version)` if yt-dlp is in PATH, or an error string.
#[tauri::command]
async fn check_ytdlp(app: tauri::AppHandle) -> Result<String, String> {
    let exe = ytdlp_exe(&app);
    run_blocking(move || check_ytdlp_blocking(&exe)).await
}

fn check_ytdlp_blocking(exe: &Path) -> Result<String, String> {
    let mut cmd = std::process::Command::new(exe);
    cmd.arg("--version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output()
        .map_err(|_| "not found".to_string())
        .and_then(|o| {
            if o.status.success() {
                Ok(String::from_utf8_lossy(&o.stdout).trim().to_string())
            } else {
                Err("not found".to_string())
            }
        })
}

#[tauri::command]
async fn check_ffmpeg() -> Result<String, String> {
    run_blocking(check_ffmpeg_blocking).await
}

fn check_ffmpeg_blocking() -> Result<String, String> {
    let mut cmd = std::process::Command::new(ffmpeg_exe());
    cmd.arg("-version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output()
        .map_err(|_| "not found".to_string())
        .and_then(|o| {
            if o.status.success() {
                let out = String::from_utf8_lossy(&o.stdout);
                let version = out
                    .lines()
                    .next()
                    .unwrap_or("")
                    .split_whitespace()
                    .take(3)
                    .collect::<Vec<_>>()
                    .join(" ");
                Ok(version)
            } else {
                Err("not found".to_string())
            }
        })
}

// ── Tool resolution helpers ───────────────────────────────────────────────

/// Returns the DIONYX-managed tools directory (inside AppData).
fn tools_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("tools")
}

fn managed_ytdlp_filename() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "yt-dlp.exe"
    }

    #[cfg(not(target_os = "windows"))]
    {
        "yt-dlp"
    }
}

/// Official stable release channel. Every release publishes `SHA2-256SUMS`.
const YTDLP_RELEASE_BASE_URL: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/";

/// Asset name of the standalone yt-dlp build for this platform.
fn managed_ytdlp_asset_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "yt-dlp.exe"
    }

    #[cfg(target_os = "macos")]
    {
        "yt-dlp_macos"
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        "yt-dlp"
    }
}

/// Finds the lowercase SHA-256 for `asset` in a `SHA2-256SUMS` file
/// (`<hash>  <name>` per line, optional `*` binary marker).
fn expected_sha256(sums: &str, asset: &str) -> Option<String> {
    sums.lines().find_map(|line| {
        let mut parts = line.split_whitespace();
        let hash = parts.next()?;
        let name = parts.next()?.trim_start_matches('*');
        (name == asset && hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit()))
            .then(|| hash.to_ascii_lowercase())
    })
}

fn append_platform_specific_ytdlp_args(args: &mut Vec<String>) {
    args.extend([
        "--extractor-args".into(),
        "youtube:player_client=default,-android_sdkless".into(),
    ]);

    // yt-dlp also needs ffmpeg (--extract-audio, thumbnails); hand it the one we
    // found so it works even when ffmpeg is not on this process' PATH.
    if let Some(ffmpeg) = find_executable("ffmpeg") {
        args.extend(["--ffmpeg-location".into(), ffmpeg.display().to_string()]);
    }

    #[cfg(target_os = "windows")]
    {
        args.push("--windows-filenames".into());
    }
}

fn is_likely_youtube_video_id(value: &str) -> bool {
    value.len() == 11
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// Finds yt-dlp: prefers the local tools dir, then PATH and the usual package
/// manager folders (see `find_executable`).
fn ytdlp_exe(app: &tauri::AppHandle) -> PathBuf {
    let local = tools_dir(app).join(managed_ytdlp_filename());
    if local.exists() {
        local
    } else {
        find_executable("yt-dlp").unwrap_or_else(|| PathBuf::from("yt-dlp"))
    }
}

/// Folders where package managers put executables but that are often missing
/// from this process' PATH: a macOS app opened from Finder only gets
/// /usr/bin:/bin:/usr/sbin:/sbin, and on Windows the PATH of a running process
/// is not refreshed after `winget install`.
fn extra_tool_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    #[cfg(target_os = "windows")]
    {
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            dirs.push(PathBuf::from(local).join("Microsoft").join("WinGet").join("Links"));
        }
        if let Some(program_files) = std::env::var_os("ProgramFiles") {
            dirs.push(PathBuf::from(program_files).join("WinGet").join("Links"));
        }
        if let Some(profile) = std::env::var_os("USERPROFILE") {
            dirs.push(PathBuf::from(profile).join("scoop").join("shims"));
        }
        dirs.push(PathBuf::from(r"C:\ProgramData\chocolatey\bin"));
    }

    #[cfg(target_os = "macos")]
    {
        dirs.push(PathBuf::from("/opt/homebrew/bin"));
        dirs.push(PathBuf::from("/usr/local/bin"));
        dirs.push(PathBuf::from("/opt/local/bin"));
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        dirs.push(PathBuf::from("/usr/local/bin"));
        if let Some(home) = std::env::var_os("HOME") {
            dirs.push(PathBuf::from(home).join(".local").join("bin"));
        }
    }

    dirs
}

/// Looks for `name` (plus `.exe` on Windows) in PATH, then in `extra_tool_dirs`.
fn find_executable(name: &str) -> Option<PathBuf> {
    let file_name = if cfg!(target_os = "windows") {
        format!("{name}.exe")
    } else {
        name.to_string()
    };

    let path_dirs = std::env::var_os("PATH")
        .map(|paths| std::env::split_paths(&paths).collect::<Vec<_>>())
        .unwrap_or_default();

    path_dirs
        .into_iter()
        .chain(extra_tool_dirs())
        .map(|dir| dir.join(&file_name))
        .find(|candidate| candidate.is_file())
}

/// ffmpeg resolved through `find_executable`, falling back to the bare name.
fn ffmpeg_exe() -> PathBuf {
    find_executable("ffmpeg").unwrap_or_else(|| PathBuf::from("ffmpeg"))
}

// ── Tool install commands ─────────────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
struct ToolProgress {
    tool: String,
    percent: u8,
}

#[derive(Clone, serde::Serialize)]
struct ToolDone {
    tool: String,
}

#[derive(Clone, serde::Serialize)]
struct ToolFailed {
    tool: String,
    message: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolingSupport {
    platform: String,
    ffmpeg_install_method: String,
    ytdlp_install_method: String,
    supports_automatic_ffmpeg_install: bool,
    supports_automatic_ytdlp_install: bool,
}

#[tauri::command]
// Each platform block returns early; which one is "last" depends on the target.
#[allow(clippy::needless_return)]
fn get_tooling_support() -> ToolingSupport {
    #[cfg(target_os = "windows")]
    {
        return ToolingSupport {
            platform: "windows".into(),
            ffmpeg_install_method: "winget".into(),
            ytdlp_install_method: "managed-download".into(),
            supports_automatic_ffmpeg_install: true,
            supports_automatic_ytdlp_install: true,
        };
    }

    #[cfg(target_os = "macos")]
    {
        return ToolingSupport {
            platform: "macos".into(),
            ffmpeg_install_method: "homebrew".into(),
            ytdlp_install_method: "managed-download".into(),
            supports_automatic_ffmpeg_install: true,
            supports_automatic_ytdlp_install: true,
        };
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        ToolingSupport {
            platform: "linux".into(),
            ffmpeg_install_method: "manual".into(),
            ytdlp_install_method: "managed-download".into(),
            supports_automatic_ffmpeg_install: false,
            supports_automatic_ytdlp_install: true,
        }
    }
}

/// Downloads the platform-specific yt-dlp binary into the DIONYX tools dir.
///
/// The binary is streamed to a `.part` file, verified against the release's
/// published SHA-256 and only then moved over the previous binary, so an
/// interrupted or tampered download never replaces a working yt-dlp.
#[tauri::command]
async fn install_ytdlp(app: tauri::AppHandle) -> Result<(), String> {
    use futures_util::StreamExt as _;
    use sha2::{Digest, Sha256};
    use std::io::Write as _;
    use tauri::Emitter as _;

    let dir = tools_dir(&app);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let asset = managed_ytdlp_asset_name();
    let dest = dir.join(managed_ytdlp_filename());
    let partial = dir.join(format!("{}.part", managed_ytdlp_filename()));

    let client = reqwest::Client::builder()
        .user_agent("DIONYX")
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;

    let sums = client
        .get(format!("{YTDLP_RELEASE_BASE_URL}SHA2-256SUMS"))
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("No pude obtener las sumas de verificación de yt-dlp: {e}"))?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    let expected = expected_sha256(&sums, asset)
        .ok_or_else(|| format!("La release de yt-dlp no publica una suma para {asset}."))?;

    let resp = client
        .get(format!("{YTDLP_RELEASE_BASE_URL}{asset}"))
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("No pude descargar yt-dlp: {e}"))?;
    let total = resp.content_length().unwrap_or(0);
    let mut stream = resp.bytes_stream();

    let result: Result<(), String> = async {
        let mut file = std::fs::File::create(&partial).map_err(|e| e.to_string())?;
        let mut hasher = Sha256::new();
        let mut downloaded: u64 = 0;
        let mut last_pct: u8 = 0;

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("La descarga de yt-dlp se interrumpió: {e}"))?;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            hasher.update(&chunk);
            downloaded += chunk.len() as u64;
            if let Some(pct) = (downloaded * 100).checked_div(total) {
                let pct = pct.min(100) as u8;
                if pct != last_pct {
                    last_pct = pct;
                    let _ = app.emit(
                        "tool-progress",
                        ToolProgress {
                            tool: "ytdlp".into(),
                            percent: pct,
                        },
                    );
                }
            }
        }

        file.sync_all().map_err(|e| e.to_string())?;
        drop(file);

        let actual = format!("{:x}", hasher.finalize());
        if actual != expected {
            return Err(
                "La verificación SHA-256 de yt-dlp falló; no se instaló el archivo descargado."
                    .into(),
            );
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut permissions = std::fs::metadata(&partial)
                .map_err(|e| e.to_string())?
                .permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(&partial, permissions).map_err(|e| e.to_string())?;
        }

        std::fs::rename(&partial, &dest)
            .map_err(|e| format!("No pude reemplazar yt-dlp (¿está en uso?): {e}"))
    }
    .await;

    if result.is_err() {
        let _ = std::fs::remove_file(&partial);
    }
    result?;

    let _ = app.emit(
        "tool-done",
        ToolDone {
            tool: "ytdlp".into(),
        },
    );
    Ok(())
}

/// Installs ffmpeg using the platform's common package manager when supported.
#[tauri::command]
async fn install_ffmpeg(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Emitter as _;

    let _ = app.emit(
        "tool-progress",
        ToolProgress {
            tool: "ffmpeg".into(),
            percent: 10,
        },
    );

    let out = tokio::task::spawn_blocking(|| {
        #[cfg(target_os = "windows")]
        let mut cmd = {
            let mut cmd = std::process::Command::new(
                find_executable("winget").unwrap_or_else(|| PathBuf::from("winget")),
            );
            cmd.args([
                "install",
                "--id",
                "Gyan.FFmpeg",
                "--silent",
                "--accept-package-agreements",
                "--accept-source-agreements",
            ]);
            cmd
        };

        #[cfg(target_os = "macos")]
        let mut cmd = {
            // Finder-launched apps do not have Homebrew on PATH.
            let mut cmd = std::process::Command::new(
                find_executable("brew").unwrap_or_else(|| PathBuf::from("brew")),
            );
            cmd.args(["install", "ffmpeg"]);
            cmd
        };

        #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
        let mut cmd = {
            let mut cmd = std::process::Command::new("sh");
            cmd.args([
                "-c",
                "echo 'Automatic ffmpeg install is not supported on this platform yet' >&2; exit 1",
            ]);
            cmd
        };

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.output()
    })
    .await
    .map_err(|e| e.to_string())?;

    match out {
        Ok(o) if o.status.success() => {
            let _ = app.emit(
                "tool-progress",
                ToolProgress {
                    tool: "ffmpeg".into(),
                    percent: 100,
                },
            );
            let _ = app.emit(
                "tool-done",
                ToolDone {
                    tool: "ffmpeg".into(),
                },
            );
            Ok(())
        }
        Ok(o) => {
            let stderr = String::from_utf8_lossy(&o.stderr).trim().to_string();
            #[cfg(target_os = "windows")]
            let fallback = "winget falló sin mensaje".to_string();
            #[cfg(target_os = "macos")]
            let fallback = "brew falló sin mensaje".to_string();
            #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
            let fallback =
                "La instalación automática de ffmpeg no está disponible en esta plataforma."
                    .to_string();

            let msg = if stderr.is_empty() { fallback } else { stderr };
            let _ = app.emit(
                "tool-failed",
                ToolFailed {
                    tool: "ffmpeg".into(),
                    message: msg.clone(),
                },
            );
            Err(msg)
        }
        Err(e) => {
            #[cfg(target_os = "windows")]
            let msg = format!("winget no está disponible: {e}");
            #[cfg(target_os = "macos")]
            let msg = format!(
                "Homebrew no está disponible. Instálalo o ejecuta `brew install ffmpeg`: {e}"
            );
            #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
            let msg = format!("No se pudo iniciar la instalación automática de ffmpeg: {e}");
            let _ = app.emit(
                "tool-failed",
                ToolFailed {
                    tool: "ffmpeg".into(),
                    message: msg.clone(),
                },
            );
            Err(msg)
        }
    }
}

/// Returns up to 3 YouTube Music search results for a text query.
#[tauri::command]
async fn search_tracks(
    query: String,
    app: tauri::AppHandle,
) -> Result<Vec<TrackSearchResult>, String> {
    // URL-encode over UTF-8 bytes so multi-byte chars (Japanese, Korean, etc.) encode correctly
    let encoded: String = query
        .bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (b as char).to_string()
            }
            b' ' => "+".to_string(),
            b => format!("%{:02X}", b),
        })
        .collect();
    let search_url = format!("https://music.youtube.com/search?q={}", encoded);
    let mut cmd = std::process::Command::new(ytdlp_exe(&app));
    let mut args = vec![
        "--flat-playlist",
        "--playlist-items",
        "1-10",
        "--print",
        "%(id)s\t%(title)s\t%(channel)s\t%(duration_string)s",
        &search_url,
    ]
    .into_iter()
    .map(String::from)
    .collect::<Vec<_>>();
    append_platform_specific_ytdlp_args(&mut args);
    cmd.args(&args);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = run_blocking(move || {
        cmd.output()
            .map_err(|e| format!("No se pudo ejecutar yt-dlp: {e}"))
    })
    .await?;

    if !output.status.success() {
        return Err("La búsqueda no devolvió resultados.".to_string());
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let results: Vec<TrackSearchResult> = text
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(4, '\t');
            let id = parts.next()?.trim().to_string();
            if !is_likely_youtube_video_id(&id) {
                return None;
            }
            let title = parts.next()?.trim().to_string();
            let channel = parts.next().unwrap_or("").trim().to_string();
            let duration = parts.next().unwrap_or("").trim().to_string();
            if id.is_empty() {
                None
            } else {
                Some(TrackSearchResult {
                    id,
                    title,
                    channel,
                    duration,
                })
            }
        })
        .take(3)
        .collect();

    Ok(results)
}

/// For text queries (non-URLs): search the top 5 YouTube results,
/// pick the one that looks most like an audio track (not a music video / live),
/// then return a YouTube Music URL for better metadata/artwork.
fn resolve_to_ytmusic_url(input: &str, ytdlp: &Path) -> String {
    if input.starts_with("http://") || input.starts_with("https://") {
        return input.to_string();
    }

    // Keywords that suggest a music video or live recording — skip these
    let video_keywords = [
        "official video",
        "official mv",
        "music video",
        " mv)",
        "(mv)",
        " pv)",
        "(pv)",
        "live",
        "concert",
        "tour",
        "[video]",
        "【mv】",
        "【pv】",
    ];
    // Keywords that strongly suggest an audio track — prefer these
    let audio_keywords = [
        "official audio",
        "audio only",
        "lyric",
        "lyrics",
        "full audio",
    ];

    let search = format!("ytsearch5:{}", input);
    let mut search_cmd = std::process::Command::new(ytdlp);
    let mut search_args = vec![
        "--flat-playlist",
        "--print",
        "%(id)s\t%(title)s",
        "--no-playlist",
        &search,
    ]
    .into_iter()
    .map(String::from)
    .collect::<Vec<_>>();
    append_platform_specific_ytdlp_args(&mut search_args);
    search_cmd.args(&search_args);
    #[cfg(target_os = "windows")]
    search_cmd.creation_flags(CREATE_NO_WINDOW);
    let out = search_cmd.output();

    if let Ok(out) = out {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            let candidates: Vec<(&str, &str)> = text
                .lines()
                .filter_map(|line| {
                    let mut parts = line.splitn(2, '\t');
                    let id = parts.next()?.trim();
                    let title = parts.next()?.trim();
                    if id.is_empty() {
                        None
                    } else {
                        Some((id, title))
                    }
                })
                .collect();

            // 1. Prefer explicit audio tracks
            if let Some((id, _)) = candidates.iter().find(|(_, title)| {
                let t = title.to_lowercase();
                audio_keywords.iter().any(|k| t.contains(k))
            }) {
                return format!("https://music.youtube.com/watch?v={}", id);
            }

            // 2. Skip obvious music videos / live recordings, take first clean result
            if let Some((id, _)) = candidates.iter().find(|(_, title)| {
                let t = title.to_lowercase();
                !video_keywords.iter().any(|k| t.contains(k))
            }) {
                return format!("https://music.youtube.com/watch?v={}", id);
            }

            // 3. Fallback: just take the first result
            if let Some((id, _)) = candidates.first() {
                return format!("https://music.youtube.com/watch?v={}", id);
            }
        }
    }

    // Last resort: plain search URL
    format!("ytsearch1:{}", input)
}

/// Fetches the video title without downloading (fast metadata-only call).
#[tauri::command]
async fn get_video_info(url: String, app: tauri::AppHandle) -> Result<String, String> {
    let exe = ytdlp_exe(&app);
    run_blocking(move || get_video_info_blocking(&url, &exe)).await
}

fn get_video_info_blocking(url: &str, exe: &Path) -> Result<String, String> {
    let resolved = resolve_to_ytmusic_url(url, exe);
    let mut info_cmd = std::process::Command::new(exe);
    let mut info_args = vec![
        "--get-title".to_string(),
        "--no-playlist".to_string(),
        resolved,
    ];
    append_platform_specific_ytdlp_args(&mut info_args);
    info_cmd.args(&info_args);
    #[cfg(target_os = "windows")]
    info_cmd.creation_flags(CREATE_NO_WINDOW);
    let output = info_cmd
        .output()
        .map_err(|e| format!("No se pudo ejecutar yt-dlp: {e}"))?;

    if output.status.success() {
        let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if title.is_empty() {
            "Titulo desconocido".into()
        } else {
            title
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(if stderr.is_empty() {
            "No se pudo obtener informacion del video.".into()
        } else {
            // Return first meaningful error line from yt-dlp
            stderr
                .lines()
                .find(|l| l.contains("ERROR") || l.contains("error"))
                .unwrap_or(&stderr)
                .to_string()
        })
    }
}

/// Starts an audio download in a background thread.
/// Emits `download-progress`, `download-done`, or `download-failed` events.
#[tauri::command]
fn download_audio(
    app: tauri::AppHandle,
    roots: tauri::State<'_, LibraryRoots>,
    download_id: String,
    url: String,
    format: String,
    output_dir: String,
) -> Result<(), String> {
    if !matches!(format.as_str(), "mp3" | "flac" | "m4a" | "opus" | "ogg" | "wav") {
        return Err("Formato de audio no soportado.".into());
    }
    let output_dir = ensure_library_folder(&roots, &output_dir)?
        .display()
        .to_string();

    // Resolve text queries → YouTube Music URL for better metadata/artwork
    let exe = ytdlp_exe(&app);
    std::thread::spawn(move || {
        use std::io::BufRead as _;
        use tauri::Emitter as _;

        // Text queries run a yt-dlp search; do it here, off the main thread.
        let resolved_url = resolve_to_ytmusic_url(&url, &exe);

        // Use the video ID (always ASCII) as the temp filename during download.
        // This avoids OSError [Errno 22] on Windows with Unicode/Japanese titles.
        // The correct title/artist end up in the file's metadata tags anyway.
        let output_template = format!("{output_dir}/%(id)s.%(ext)s");

        // Phase 1 — Download best available audio in its native container.
        // We do NOT convert here; we keep the source at maximum quality
        // (usually opus/webm ~160 kbps or m4a ~128 kbps from YouTube).
        // Conversion to the user-selected format happens in Phase 2.
        let mut dl_cmd = std::process::Command::new(&exe);
        let mut download_args = vec![
            "-f".into(),
            "bestaudio[ext=m4a]/bestaudio[ext=mp4]/bestaudio/best".into(),
            "--extract-audio".into(), // audio-only, keep native ext (no conversion yet)
            "--no-playlist".into(),
            "--newline".into(),
            "--write-info-json".into(), // write VIDEO_ID.info.json with title/artist/album
            "--write-thumbnail".into(), // write thumbnail for embedding in Phase 2
            "--convert-thumbnails".into(),
            "jpg".into(),
        ];
        append_platform_specific_ytdlp_args(&mut download_args);
        download_args.extend(["--output".into(), output_template, resolved_url]);
        dl_cmd
            .args(&download_args)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());
        #[cfg(target_os = "windows")]
        dl_cmd.creation_flags(CREATE_NO_WINDOW);
        let spawned = dl_cmd.spawn();

        match spawned {
            Err(e) => {
                let _ = app.emit(
                    "download-failed",
                    DownloadFailed {
                        download_id,
                        message: format!("No se pudo iniciar yt-dlp: {e}"),
                    },
                );
            }
            Ok(mut child) => {
                // Drain stderr on a side thread so stdout doesn't block.
                let stderr_thread = child.stderr.take().map(|stderr| {
                    std::thread::spawn(move || {
                        use std::io::Read as _;
                        let mut buf = String::new();
                        let _ = std::io::BufReader::new(stderr).read_to_string(&mut buf);
                        buf
                    })
                });

                // Track the downloaded file path from yt-dlp output lines like:
                // "[download] Destination: /path/file.webm"
                // "[ExtractAudio] Destination: /path/file.m4a"
                let mut native_path: Option<PathBuf> = None;

                if let Some(stdout) = child.stdout.take() {
                    for line in std::io::BufReader::new(stdout)
                        .lines()
                        .map_while(Result::ok)
                    {
                        // Progress: "[download]  45.6% of 5.00MiB at 1.23MiB/s ETA 00:02"
                        if line.contains("[download]") && line.contains('%') {
                            if let Some(pct) = parse_download_percent(&line) {
                                let _ = app.emit(
                                    "download-progress",
                                    DownloadProgress {
                                        download_id: download_id.clone(),
                                        percent: pct,
                                        speed: extract_ydlp_field(&line, "at"),
                                        eta: extract_ydlp_field(&line, "ETA"),
                                    },
                                );
                            }
                        }
                        // Always overwrite with the latest "Destination:" line.
                        // yt-dlp prints one for the raw download and another for
                        // the extracted audio (--extract-audio). The last one is
                        // the file that actually exists after yt-dlp finishes.
                        if line.contains("Destination:") {
                            if let Some((_, path_str)) = line.split_once("Destination:") {
                                native_path = Some(PathBuf::from(path_str.trim()));
                            }
                        }
                    }
                }

                let stderr_content = stderr_thread
                    .and_then(|t| t.join().ok())
                    .unwrap_or_default();

                match child.wait() {
                    Ok(s) if s.success() => {
                        // Phase 2 — Read metadata from info.json, then convert + rename.
                        let converted = if let Some(src) = native_path {
                            // Parse title/artist/album from the companion info.json.
                            let info_path = src.with_extension("info.json");
                            let meta = read_info_json(&info_path);
                            let _ = std::fs::remove_file(&info_path); // clean up

                            convert_audio(&src, &format, meta)
                        } else {
                            true // no source path captured; assume done
                        };

                        if converted {
                            let _ = app.emit("download-done", DownloadDone { download_id });
                        } else {
                            let _ = app.emit(
                                "download-failed",
                                DownloadFailed {
                                    download_id,
                                    message: "La conversión de audio falló.".into(),
                                },
                            );
                        }
                    }
                    Ok(_) => {
                        let message = stderr_content
                            .lines()
                            .filter(|l| !l.trim().is_empty())
                            .rfind(|l| {
                                let low = l.to_lowercase();
                                low.contains("error")
                                    || low.contains("warning")
                                    || low.contains("unable")
                            })
                            .or_else(|| stderr_content.lines().next_back())
                            .map(|l| l.trim().trim_start_matches("ERROR: ").to_string())
                            .unwrap_or_else(|| "yt-dlp terminó con un error desconocido.".into());

                        let _ = app.emit(
                            "download-failed",
                            DownloadFailed {
                                download_id,
                                message,
                            },
                        );
                    }
                    Err(e) => {
                        let _ = app.emit(
                            "download-failed",
                            DownloadFailed {
                                download_id,
                                message: e.to_string(),
                            },
                        );
                    }
                }
            }
        }
    });

    Ok(())
}

struct TrackMeta {
    title: Option<String>,
    artist: Option<String>,
    album: Option<String>,
}

/// Reads title/artist/album from a yt-dlp `.info.json` file.
fn read_info_json(path: &Path) -> TrackMeta {
    let empty = TrackMeta {
        title: None,
        artist: None,
        album: None,
    };
    let Ok(text) = std::fs::read_to_string(path) else {
        return empty;
    };
    let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) else {
        return empty;
    };

    let str_field = |key: &str| -> Option<String> {
        v.get(key)?
            .as_str()
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    };

    // yt-dlp exposes "artist", "creator", "uploader" and "album".
    let artist = str_field("artist")
        .or_else(|| str_field("creator"))
        .or_else(|| str_field("uploader"));

    TrackMeta {
        title: str_field("title"),
        artist,
        album: str_field("album"),
    }
}

/// Sanitises a string so it can be used as a Windows filename.
fn sanitize_filename(name: &str) -> String {
    let invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let sanitized: String = name
        .chars()
        .map(|c| {
            if invalid.contains(&c) || c.is_control() {
                '_'
            } else {
                c
            }
        })
        .collect();
    // Windows filenames cannot end with space or dot.
    let trimmed = sanitized.trim_end_matches([' ', '.']);
    // Cap length to avoid MAX_PATH issues.
    if trimmed.chars().count() > 120 {
        trimmed.chars().take(120).collect()
    } else {
        trimmed.to_string()
    }
}

/// Converts `src` to the target `format` using ffmpeg, embedding the companion
/// thumbnail (`.jpg`) if present. Returns `true` on success or if no conversion
/// was needed.
fn convert_audio(src: &Path, format: &str, meta: TrackMeta) -> bool {
    let src_ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let target_ext = if format == "ogg" { "ogg" } else { format };

    // Determine final filename: prefer sanitized title, fall back to stem.
    let stem = meta
        .title
        .as_deref()
        .map(sanitize_filename)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| {
            src.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("track")
                .to_string()
        });

    // Nothing to convert — already in the right format.
    if src_ext == target_ext {
        // Embed the thumbnail if present, then rename.
        embed_thumbnail_inplace(src);
        let dst = unique_destination(&src.with_file_name(format!("{stem}.{target_ext}")), src);
        if dst != src {
            let _ = std::fs::rename(src, &dst);
        }
        return true;
    }

    // Never overwrite an existing library file that happens to share the title.
    let dst = unique_destination(&src.with_file_name(format!("{stem}.{target_ext}")), src);
    let src_str = src.to_str().unwrap_or("");
    let dst_str = dst.to_str().unwrap_or("");

    // Companion thumbnail written by yt-dlp --write-thumbnail --convert-thumbnails jpg
    let thumb = src.with_extension("jpg");
    let has_thumb = thumb.exists();

    let codec = match target_ext {
        "mp3" => "libmp3lame",
        "m4a" | "aac" => "aac",
        "flac" => "flac",
        "wav" => "pcm_s16le",
        "opus" => "libopus",
        "ogg" => "libvorbis",
        _ => "copy",
    };

    let mut args: Vec<String> = vec!["-i".into(), src_str.into()];

    // Feed thumbnail as a second input when available.
    if has_thumb {
        args.extend(["-i".into(), thumb.to_str().unwrap_or("").into()]);
    }

    args.extend(["-map".into(), "0:a".into()]);

    if has_thumb {
        // Map the thumbnail input as cover art.
        args.extend(["-map".into(), "1:v".into()]);
        args.extend(["-c:v".into(), "copy".into()]);
        if target_ext == "mp3" {
            args.extend(["-id3v2_version".into(), "3".into()]);
        }
        if target_ext == "flac" {
            args.extend(["-disposition:v".into(), "attached_pic".into()]);
        }
    }

    args.extend(["-c:a".into(), codec.into()]);

    // Codec-specific quality settings.
    match target_ext {
        "mp3" | "ogg" => args.extend(["-q:a".into(), "0".into()]),
        "m4a" | "aac" => args.extend(["-b:a".into(), "256k".into()]),
        "opus" => args.extend(["-b:a".into(), "320k".into()]),
        "flac" => args.extend(["-compression_level".into(), "8".into()]),
        _ => {}
    }

    // Embed metadata from info.json directly (overrides whatever was in the source).
    args.extend(["-map_metadata".into(), "0".into()]);
    if let Some(t) = &meta.title {
        args.extend(["-metadata".into(), format!("title={t}")]);
    }
    if let Some(a) = &meta.artist {
        args.extend(["-metadata".into(), format!("artist={a}")]);
    }
    if let Some(b) = &meta.album {
        args.extend(["-metadata".into(), format!("album={b}")]);
    }
    args.extend([dst_str.into(), "-y".into()]);

    let run_ffmpeg = |a: &[String]| -> bool {
        let mut ff = std::process::Command::new(ffmpeg_exe());
        ff.args(a);
        #[cfg(target_os = "windows")]
        ff.creation_flags(CREATE_NO_WINDOW);
        ff.stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());
        ff.status().map(|s| s.success()).unwrap_or(false)
    };

    // First attempt: with thumbnail.
    if run_ffmpeg(&args) {
        let _ = std::fs::remove_file(src);
        let _ = std::fs::remove_file(&thumb);
        return true;
    }

    // If thumbnail embedding failed, retry without it (audio-only).
    if has_thumb {
        let mut args_no_thumb: Vec<String> = vec![
            "-i".into(),
            src_str.into(),
            "-map".into(),
            "0:a".into(),
            "-c:a".into(),
            codec.into(),
        ];
        match target_ext {
            "mp3" | "ogg" => args_no_thumb.extend(["-q:a".into(), "0".into()]),
            "m4a" | "aac" => args_no_thumb.extend(["-b:a".into(), "256k".into()]),
            "opus" => args_no_thumb.extend(["-b:a".into(), "320k".into()]),
            "flac" => args_no_thumb.extend(["-compression_level".into(), "8".into()]),
            _ => {}
        }
        args_no_thumb.extend(["-map_metadata".into(), "0".into()]);
        if let Some(t) = &meta.title {
            args_no_thumb.extend(["-metadata".into(), format!("title={t}")]);
        }
        if let Some(a) = &meta.artist {
            args_no_thumb.extend(["-metadata".into(), format!("artist={a}")]);
        }
        if let Some(b) = &meta.album {
            args_no_thumb.extend(["-metadata".into(), format!("album={b}")]);
        }
        if target_ext == "mp3" {
            args_no_thumb.extend(["-id3v2_version".into(), "3".into()]);
        }
        args_no_thumb.extend([dst_str.into(), "-y".into()]);

        if run_ffmpeg(&args_no_thumb) {
            let _ = std::fs::remove_file(src);
            let _ = std::fs::remove_file(&thumb);
            return true;
        }
    }

    false
}

/// Returns `candidate` if it is free (or is `src` itself); otherwise the first
/// free "Name (2).ext", "Name (3).ext", ... in the same folder.
fn unique_destination(candidate: &Path, src: &Path) -> PathBuf {
    if candidate == src || !candidate.exists() {
        return candidate.to_path_buf();
    }

    let stem = candidate
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("track")
        .to_string();
    let ext = candidate
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{e}"))
        .unwrap_or_default();

    for n in 2..10_000 {
        let next = candidate.with_file_name(format!("{stem} ({n}){ext}"));
        if !next.exists() {
            return next;
        }
    }

    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    candidate.with_file_name(format!("{stem} ({millis}){ext}"))
}

/// For cases where the native format already matches the target, embed the
/// companion thumbnail in-place (overwrite the source file).
fn embed_thumbnail_inplace(src: &Path) {
    let thumb = src.with_extension("jpg");
    if !thumb.exists() {
        return;
    }

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let tmp = src.with_extension("_tmp.".to_string() + &ext);

    let src_str = src.to_str().unwrap_or("");
    let tmp_str = tmp.to_str().unwrap_or("");
    let thumb_str = thumb.to_str().unwrap_or("");

    let mut args = vec![
        "-i".to_string(),
        src_str.into(),
        "-i".to_string(),
        thumb_str.into(),
        "-map".to_string(),
        "0:a".into(),
        "-map".to_string(),
        "1:v".into(),
        "-c".to_string(),
        "copy".into(),
        "-map_metadata".to_string(),
        "0".into(),
    ];
    if ext == "mp3" {
        args.extend(["-id3v2_version".to_string(), "3".into()]);
    }
    if ext == "flac" {
        args.extend(["-disposition:v".to_string(), "attached_pic".into()]);
    }
    args.extend([tmp_str.to_string(), "-y".to_string()]);

    let mut ff = std::process::Command::new(ffmpeg_exe());
    ff.args(&args);
    #[cfg(target_os = "windows")]
    ff.creation_flags(CREATE_NO_WINDOW);
    ff.stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    if ff.status().map(|s| s.success()).unwrap_or(false) {
        let _ = std::fs::remove_file(src);
        let _ = std::fs::rename(&tmp, src);
        let _ = std::fs::remove_file(&thumb);
    } else {
        let _ = std::fs::remove_file(&tmp);
        let _ = std::fs::remove_file(&thumb);
    }
}

fn parse_download_percent(line: &str) -> Option<f32> {
    // "[download]  45.6% of ..." → 45.6
    let pct_pos = line.find('%')?;
    let before = line[..pct_pos].trim_end();
    let num_start = before.rfind(' ')?;
    before[num_start + 1..].parse().ok()
}

fn extract_ydlp_field(line: &str, keyword: &str) -> String {
    (|| {
        let pos = line.find(keyword)?;
        let after = line[pos + keyword.len()..].trim_start();
        Some(after.split_whitespace().next().unwrap_or("").to_string())
    })()
    .unwrap_or_default()
}

// ── entry point ───────────────────────────────────────────────────────────

/// Brings the main window back (from the tray, minimized or hidden).
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // Automatic updates from GitHub Releases (signed; see tauri.conf.json).
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(HideOnTrayState(AtomicBool::new(false)))
        .manage(LibraryRoots(Mutex::new(Vec::new())))
        .manage(create_discord_state())
        .invoke_handler(tauri::generate_handler![
            scan_music_folder,
            delete_track_file,
            save_track_metadata,
            set_hide_on_tray,
            quit_app,
            get_tooling_support,
            check_ytdlp,
            check_ffmpeg,
            install_ytdlp,
            install_ffmpeg,
            search_tracks,
            get_video_info,
            download_audio,
            fetch_url,
            update_discord_presence,
            clear_discord_presence,
            lastfm::lastfm_is_configured,
            lastfm::lastfm_begin_auth,
            lastfm::lastfm_finish_auth,
            lastfm::lastfm_now_playing,
            lastfm::lastfm_scrobble
        ])
        .setup(|app| {
            use tauri::{
                menu::{Menu, MenuItem},
                tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
            };

            let show_item = MenuItem::with_id(app, "show", "Mostrar DIONYX", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("No se encontró el ícono de la app");

            TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("DIONYX")
                .on_tray_icon_event(|tray, event| {
                    // Left-click → show/focus the window
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        show_main_window(app);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let hide = window
                    .app_handle()
                    .state::<HideOnTrayState>()
                    .0
                    .load(Ordering::Relaxed);

                if hide {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, _event| {
        // macOS: clicking the Dock icon while the window is hidden in the tray
        // ("hide on close") must bring it back.
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen {
            has_visible_windows: false,
            ..
        } = _event
        {
            show_main_window(_app_handle);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expected_sha256_finds_asset_line() {
        let hash = "a".repeat(64);
        let sums = format!(
            "{}  yt-dlp\n{}  yt-dlp.exe\n{} *yt-dlp_macos\n",
            "b".repeat(64),
            hash,
            "C".repeat(64)
        );
        assert_eq!(expected_sha256(&sums, "yt-dlp.exe"), Some(hash));
        assert_eq!(expected_sha256(&sums, "yt-dlp_macos"), Some("c".repeat(64)));
        assert_eq!(expected_sha256(&sums, "yt-dlp_linux"), None);
    }

    #[test]
    fn fetch_url_only_allows_known_https_hosts() {
        assert!(validate_fetch_url("https://lrclib.net/api/get?track_name=x").is_ok());
        assert!(validate_fetch_url("https://api.deezer.com/search?q=x").is_ok());
        assert!(validate_fetch_url("https://cdn-images.dzcdn.net/x.jpg").is_err());
        assert!(validate_fetch_url("https://ws.audioscrobbler.com/2.0/?method=x").is_ok());
        assert!(validate_fetch_url("http://lrclib.net/api/get").is_err());
        assert!(validate_fetch_url("https://evil.example/").is_err());
        assert!(validate_fetch_url("https://lrclib.net.evil.example/").is_err());
        assert!(validate_fetch_url("file:///C:/Windows/win.ini").is_err());
    }

    #[test]
    fn library_guard_only_accepts_audio_inside_scanned_roots() {
        let base = std::env::temp_dir().join(format!("dionyx-roots-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        let library = base.join("library");
        let outside = base.join("outside");
        std::fs::create_dir_all(&library).unwrap();
        std::fs::create_dir_all(&outside).unwrap();
        std::fs::write(library.join("song.mp3"), b"x").unwrap();
        std::fs::write(library.join("notes.txt"), b"x").unwrap();
        std::fs::write(outside.join("other.mp3"), b"x").unwrap();

        let state = LibraryRoots(Mutex::new(Vec::new()));
        let inside = library.join("song.mp3").display().to_string();
        assert!(ensure_library_audio_file(&state, &inside).is_err(), "nothing scanned yet");

        remember_library_root(&state, &library);
        assert!(ensure_library_audio_file(&state, &inside).is_ok());
        assert!(ensure_library_audio_file(&state, &library.join("notes.txt").display().to_string()).is_err());
        assert!(ensure_library_audio_file(&state, &outside.join("other.mp3").display().to_string()).is_err());
        let traversal = library.join("..").join("outside").join("other.mp3");
        assert!(ensure_library_audio_file(&state, &traversal.display().to_string()).is_err());
        assert!(ensure_library_folder(&state, &library.display().to_string()).is_ok());
        assert!(ensure_library_folder(&state, &outside.display().to_string()).is_err());

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn discord_response_matching() {
        let ok = r#"{"cmd":"SET_ACTIVITY","evt":null,"nonce":"n1","data":{}}"#;
        let err = r#"{"cmd":"SET_ACTIVITY","evt":"ERROR","nonce":"n2","data":{"code":4000,"message":"child \"activity\" fails"}}"#;
        assert_eq!(discord_response_for_nonce(ok, "n1"), Some(Ok(())));
        assert_eq!(discord_response_for_nonce(ok, "other"), None);
        assert_eq!(
            discord_response_for_nonce(err, "n2"),
            Some(Err("child \"activity\" fails".into()))
        );
        assert_eq!(discord_response_for_nonce("not json", "n1"), None);
    }

    #[test]
    fn nonces_are_unique() {
        let a = uuid_v4();
        let b = uuid_v4();
        assert_ne!(a, b);
    }

    #[test]
    fn find_executable_searches_path() {
        let dir = std::env::temp_dir().join(format!("dionyx-bin-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let name = "dionyx-fake-tool";
        let file = if cfg!(target_os = "windows") {
            dir.join(format!("{name}.exe"))
        } else {
            dir.join(name)
        };
        std::fs::write(&file, b"x").unwrap();

        let old_path = std::env::var_os("PATH").unwrap_or_default();
        let mut paths = vec![dir.clone()];
        paths.extend(std::env::split_paths(&old_path));
        std::env::set_var("PATH", std::env::join_paths(paths).unwrap());
        assert_eq!(find_executable(name), Some(file));
        std::env::set_var("PATH", old_path);

        assert_eq!(find_executable("dionyx-surely-missing-tool"), None);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn expected_sha256_rejects_malformed_hash() {
        assert_eq!(expected_sha256("xyz  yt-dlp.exe", "yt-dlp.exe"), None);
    }

    #[test]
    fn unique_destination_avoids_existing_files() {
        let dir = std::env::temp_dir().join(format!("dionyx-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();

        let src = dir.join("abc123.m4a");
        let wanted = dir.join("Intro.mp3");
        assert_eq!(unique_destination(&wanted, &src), wanted);

        std::fs::write(&wanted, b"existing").unwrap();
        assert_eq!(unique_destination(&wanted, &src), dir.join("Intro (2).mp3"));

        std::fs::write(dir.join("Intro (2).mp3"), b"existing").unwrap();
        assert_eq!(unique_destination(&wanted, &src), dir.join("Intro (3).mp3"));

        // A file never conflicts with itself.
        assert_eq!(unique_destination(&wanted, &wanted), wanted);

        let _ = std::fs::remove_dir_all(&dir);
    }
}
