import { type CSSProperties, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import "./App.css";

// ── Minimal theme helpers (mirrors App.tsx) ───────────────────────────────

const DEFAULT_THEME = "#A85EFF";

function sanitizeHex(v: string | null | undefined): string {
  const s = (v ?? "").normalize("NFKC").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(s) ? s : DEFAULT_THEME;
}

function hexToRgb(hex: string) {
  const h = sanitizeHex(hex).slice(1);
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  w: number,
) {
  const t = Math.min(Math.max(w, 0), 1);
  return {
    r: Math.round(a.r * (1 - t) + b.r * t),
    g: Math.round(a.g * (1 - t) + b.g * t),
    b: Math.round(a.b * (1 - t) + b.b * t),
  };
}

function css(c: { r: number; g: number; b: number }) {
  return `${c.r} ${c.g} ${c.b}`;
}

function buildThemeVars(hex: string): CSSProperties {
  const base = hexToRgb(hex);
  const soft = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.34);
  const deep = mixRgb(base, { r: 24, g: 16, b: 32 }, 0.5);
  const dark = mixRgb(base, { r: 10, g: 8, b: 14 }, 0.72);
  const textSoft = mixRgb({ r: 223, g: 210, b: 239 }, base, 0.22);
  const textFaint = mixRgb({ r: 216, g: 199, b: 234 }, base, 0.3);
  const textBright = mixRgb({ r: 241, g: 231, b: 251 }, base, 0.16);
  return {
    "--accent-rgb": css(base),
    "--accent-soft-rgb": css(soft),
    "--accent-deep-rgb": css(deep),
    "--accent-dark-rgb": css(dark),
    "--text-soft-rgb": css(textSoft),
    "--text-faint-rgb": css(textFaint),
    "--text-bright-rgb": css(textBright),
  } as CSSProperties;
}

// ── Types ─────────────────────────────────────────────────────────────────

interface MiniState {
  title: string;
  artist: string;
  artworkDataUrl: string | null;
  isPlaying: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function MiniPlayer() {
  const themeColor = sanitizeHex(localStorage.getItem("dionyx:theme-color"));
  const themeVars = buildThemeVars(themeColor);

  const [state, setState] = useState<MiniState>({
    title: "",
    artist: "",
    artworkDataUrl: null,
    isPlaying: false,
  });

  useEffect(() => {
    // Register mini-state listener FIRST, then announce ready.
    // emit("mini-ready") must not fire until the listener is fully registered,
    // otherwise the main window's response (mini-state) arrives before we listen and is lost.
    const unlistenPromise = listen<MiniState>("mini-state", (e) => {
      setState(e.payload);
    }).then((unlisten) => {
      void emit("mini-ready", {});
      return unlisten;
    });

    return () => {
      void unlistenPromise.then((f) => f());
    };
  }, []);

  const sendCmd = (cmd: string) => void emit("mini-cmd", { cmd });

  const handleClose = () => void invoke("close_mini_player");

  return (
    <div
      className="mini-player-root"
      style={themeVars}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest(".mp-controls")) return;
        e.preventDefault();
        void getCurrentWindow().startDragging();
      }}
    >
      {/* Album art */}
      <div className="mp-artwork">
        {state.artworkDataUrl ? (
          <img alt="artwork" src={state.artworkDataUrl} />
        ) : (
          <div className="mp-artwork-fallback" />
        )}
      </div>

      {/* Track info */}
      <div className="mp-info">
        <span className="mp-title">{state.title || "—"}</span>
        <span className="mp-artist">{state.artist || "—"}</span>
      </div>

      {/* Controls */}
      <div className="mp-controls">
        <button
          aria-label="Anterior"
          className="mp-btn"
          onClick={() => sendCmd("prev")}
          type="button"
        >
          <SkipBack size={13} strokeWidth={2.2} />
        </button>
        <button
          aria-label={state.isPlaying ? "Pausar" : "Reproducir"}
          className="mp-btn mp-play-btn"
          onClick={() => sendCmd("play-pause")}
          type="button"
        >
          {state.isPlaying ? (
            <Pause size={14} strokeWidth={2.2} />
          ) : (
            <Play size={14} strokeWidth={2.2} style={{ marginLeft: 1 }} />
          )}
        </button>
        <button
          aria-label="Siguiente"
          className="mp-btn"
          onClick={() => sendCmd("next")}
          type="button"
        >
          <SkipForward size={13} strokeWidth={2.2} />
        </button>
        <button
          aria-label="Cerrar mini player"
          className="mp-btn mp-close-btn"
          onClick={handleClose}
          type="button"
        >
          <X size={12} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
