//! Last.fm scrobbling.
//!
//! The API key identifies the *app*; each person links their *own* Last.fm
//! account (desktop auth: token -> browser approval -> session key), and the
//! session key, kept on their computer by the frontend, decides whose profile
//! the scrobbles go to. Calls are signed with the shared secret, which is
//! compiled in from `.lastfm.env` (see build.rs) and never sent anywhere.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::time::Duration;
use tauri_plugin_opener::OpenerExt;

const API_ROOT: &str = "https://ws.audioscrobbler.com/2.0/";
const API_KEY: Option<&str> = option_env!("DIONYX_LASTFM_API_KEY");
const API_SECRET: Option<&str> = option_env!("DIONYX_LASTFM_API_SECRET");
/// Last.fm accepts at most 50 scrobbles per request.
const MAX_BATCH: usize = 50;

fn credentials() -> Result<(&'static str, &'static str), String> {
    match (API_KEY, API_SECRET) {
        (Some(key), Some(secret)) if !key.is_empty() && !secret.is_empty() => Ok((key, secret)),
        _ => Err("lastfm:not-configured".to_string()),
    }
}

// ── MD5 (needed only for the api_sig; small enough to not pull a crate) ──

pub(crate) fn md5_hex(input: &[u8]) -> String {
    const S: [u32; 64] = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
        14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15,
        21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];
    let k: Vec<u32> = (0..64)
        .map(|i| ((i as f64 + 1.0).sin().abs() * 4_294_967_296.0) as u32)
        .collect();

    let mut message = input.to_vec();
    let bit_len = (input.len() as u64).wrapping_mul(8);
    message.push(0x80);
    while message.len() % 64 != 56 {
        message.push(0);
    }
    message.extend_from_slice(&bit_len.to_le_bytes());

    let (mut a0, mut b0, mut c0, mut d0) = (0x67452301u32, 0xefcdab89u32, 0x98badcfeu32, 0x10325476u32);

    for chunk in message.chunks(64) {
        let m: Vec<u32> = chunk
            .chunks(4)
            .map(|word| u32::from_le_bytes([word[0], word[1], word[2], word[3]]))
            .collect();
        let (mut a, mut b, mut c, mut d) = (a0, b0, c0, d0);

        for i in 0..64 {
            let (f, g) = match i {
                0..=15 => ((b & c) | (!b & d), i),
                16..=31 => ((d & b) | (!d & c), (5 * i + 1) % 16),
                32..=47 => (b ^ c ^ d, (3 * i + 5) % 16),
                _ => (c ^ (b | !d), (7 * i) % 16),
            };
            let rotated = f
                .wrapping_add(a)
                .wrapping_add(k[i])
                .wrapping_add(m[g])
                .rotate_left(S[i]);
            a = d;
            d = c;
            c = b;
            b = b.wrapping_add(rotated);
        }

        a0 = a0.wrapping_add(a);
        b0 = b0.wrapping_add(b);
        c0 = c0.wrapping_add(c);
        d0 = d0.wrapping_add(d);
    }

    [a0, b0, c0, d0]
        .iter()
        .flat_map(|value| value.to_le_bytes())
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

/// api_sig: every parameter (except `format`/`callback`) sorted by name,
/// concatenated as name+value, followed by the secret, then MD5.
pub(crate) fn sign(params: &BTreeMap<String, String>, secret: &str) -> String {
    let mut base = String::new();
    for (name, value) in params {
        if name == "format" || name == "callback" {
            continue;
        }
        base.push_str(name);
        base.push_str(value);
    }
    base.push_str(secret);
    md5_hex(base.as_bytes())
}

async fn call(method: &str, mut params: BTreeMap<String, String>, post: bool) -> Result<serde_json::Value, String> {
    let (key, secret) = credentials()?;
    params.insert("method".into(), method.into());
    params.insert("api_key".into(), key.into());
    let signature = sign(&params, secret);
    params.insert("api_sig".into(), signature);
    params.insert("format".into(), "json".into());

    let client = reqwest::Client::builder()
        .user_agent("DIONYX")
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;

    let encoded = reqwest::Url::parse_with_params(API_ROOT, params.iter())
        .map_err(|e| e.to_string())?;

    let request = if post {
        client
            .post(API_ROOT)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(encoded.query().unwrap_or_default().to_string())
    } else {
        client.get(encoded)
    };

    let response = request.send().await.map_err(|e| format!("lastfm:network:{e}"))?;
    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("lastfm:network:{e}"))?;

    // Errors come back as {"error": code, "message": "..."} (often with HTTP 4xx).
    if let Some(code) = body.get("error").and_then(|value| value.as_i64()) {
        let message = body.get("message").and_then(|value| value.as_str()).unwrap_or("");
        return Err(format!("lastfm:{code}:{message}"));
    }

    Ok(body)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LastfmSession {
    name: String,
    key: String,
}

#[derive(Deserialize)]
pub struct ScrobbleItem {
    artist: String,
    track: String,
    album: Option<String>,
    duration: Option<u32>,
    timestamp: i64,
}

#[tauri::command]
pub fn lastfm_is_configured() -> bool {
    credentials().is_ok()
}

/// Step 1: gets a request token and opens the Last.fm approval page in the browser.
#[tauri::command]
pub async fn lastfm_begin_auth(app: tauri::AppHandle) -> Result<String, String> {
    let body = call("auth.getToken", BTreeMap::new(), false).await?;
    let token = body
        .get("token")
        .and_then(|value| value.as_str())
        .ok_or("lastfm:bad-response")?
        .to_string();
    let (key, _) = credentials()?;
    let url = reqwest::Url::parse_with_params(
        "https://www.last.fm/api/auth/",
        [("api_key", key), ("token", token.as_str())],
    )
    .map_err(|e| e.to_string())?;

    app.opener()
        .open_url(url.as_str(), None::<&str>)
        .map_err(|e| e.to_string())?;

    Ok(token)
}

/// Step 2: once approved in the browser, exchanges the token for a session.
/// Before approval Last.fm answers error 14 ("unauthorized token").
#[tauri::command]
pub async fn lastfm_finish_auth(token: String) -> Result<LastfmSession, String> {
    let mut params = BTreeMap::new();
    params.insert("token".to_string(), token);
    let body = call("auth.getSession", params, false).await?;
    let session = body.get("session").ok_or("lastfm:bad-response")?;
    let field = |name: &str| {
        session
            .get(name)
            .and_then(|value| value.as_str())
            .map(str::to_string)
            .ok_or_else(|| "lastfm:bad-response".to_string())
    };

    Ok(LastfmSession {
        name: field("name")?,
        key: field("key")?,
    })
}

#[tauri::command]
pub async fn lastfm_now_playing(
    session_key: String,
    artist: String,
    track: String,
    album: Option<String>,
    duration: Option<u32>,
) -> Result<(), String> {
    let mut params = BTreeMap::new();
    params.insert("sk".to_string(), session_key);
    params.insert("artist".to_string(), artist);
    params.insert("track".to_string(), track);
    if let Some(album) = album.filter(|value| !value.is_empty()) {
        params.insert("album".to_string(), album);
    }
    if let Some(duration) = duration.filter(|value| *value > 0) {
        params.insert("duration".to_string(), duration.to_string());
    }
    call("track.updateNowPlaying", params, true).await.map(|_| ())
}

/// Sends up to 50 scrobbles in one request; returns how many were accepted.
#[tauri::command]
pub async fn lastfm_scrobble(session_key: String, items: Vec<ScrobbleItem>) -> Result<u32, String> {
    if items.is_empty() {
        return Ok(0);
    }

    let mut params = BTreeMap::new();
    params.insert("sk".to_string(), session_key);
    for (index, item) in items.iter().take(MAX_BATCH).enumerate() {
        params.insert(format!("artist[{index}]"), item.artist.clone());
        params.insert(format!("track[{index}]"), item.track.clone());
        params.insert(format!("timestamp[{index}]"), item.timestamp.to_string());
        if let Some(album) = item.album.as_ref().filter(|value| !value.is_empty()) {
            params.insert(format!("album[{index}]"), album.clone());
        }
        if let Some(duration) = item.duration.filter(|value| *value > 0) {
            params.insert(format!("duration[{index}]"), duration.to_string());
        }
    }

    let body = call("track.scrobble", params, true).await?;
    Ok(body
        .pointer("/scrobbles/@attr/accepted")
        .and_then(|value| value.as_u64())
        .unwrap_or(0) as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn md5_matches_rfc_1321_vectors() {
        assert_eq!(md5_hex(b""), "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(md5_hex(b"abc"), "900150983cd24fb0d6963f7d28e17f72");
        assert_eq!(md5_hex(b"message digest"), "f96b697d7cb7938d525a2f31aaf161d0");
        assert_eq!(
            md5_hex(b"12345678901234567890123456789012345678901234567890123456789012345678901234567890"),
            "57edf4a22be3c955ac49da2e2107b67a"
        );
    }

    /// Real call to Last.fm with the compiled-in key and secret (needs
    /// network and .lastfm.env): `cargo test -- --ignored lastfm_live`.
    #[test]
    #[ignore]
    fn lastfm_live_credentials_are_accepted() {
        if credentials().is_err() {
            panic!("no Last.fm credentials compiled in (src-tauri/.lastfm.env)");
        }
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let body = runtime
            .block_on(call("auth.getToken", BTreeMap::new(), false))
            .expect("Last.fm rejected the signed request");
        assert!(body.get("token").and_then(|value| value.as_str()).is_some());
    }

    #[test]
    fn signature_sorts_params_and_skips_format() {
        let mut params = BTreeMap::new();
        params.insert("method".to_string(), "auth.getSession".to_string());
        params.insert("api_key".to_string(), "KEY".to_string());
        params.insert("token".to_string(), "TOKEN".to_string());
        params.insert("format".to_string(), "json".to_string());
        let expected = md5_hex(b"api_keyKEYmethodauth.getSessiontokenTOKENSECRET");
        assert_eq!(sign(&params, "SECRET"), expected);
    }
}
