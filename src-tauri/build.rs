use std::fs;

/// Last.fm credentials for scrobbling come from `src-tauri/.lastfm.env`
/// (ignored by git, so the shared secret never lands in the repository):
///
/// ```text
/// DIONYX_LASTFM_API_KEY=...
/// DIONYX_LASTFM_API_SECRET=...
/// ```
///
/// Environment variables with the same names win over the file (handy in CI).
/// Without them the app builds fine and scrobbling shows as not configured.
fn main() {
    println!("cargo:rerun-if-changed=.lastfm.env");
    println!("cargo:rerun-if-env-changed=DIONYX_LASTFM_API_KEY");
    println!("cargo:rerun-if-env-changed=DIONYX_LASTFM_API_SECRET");

    if let Ok(contents) = fs::read_to_string(".lastfm.env") {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((name, value)) = line.split_once('=') {
                let name = name.trim();
                let value = value.trim().trim_matches('"');
                let allowed = name == "DIONYX_LASTFM_API_KEY" || name == "DIONYX_LASTFM_API_SECRET";
                if allowed && !value.is_empty() && std::env::var(name).is_err() {
                    println!("cargo:rustc-env={name}={value}");
                }
            }
        }
    }

    tauri_build::build()
}
