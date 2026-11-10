import { HeartButton } from "../library/HeartButton";
import { type ComponentType, type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Languages,
  Pause,
  PictureInPicture2,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { storageKeys } from "../../app/constants";
import type { LibraryTrack, RepeatMode } from "../../app/types";
import { formatTime, getTrackArtworkSrc, readStoredValue, writeStoredValue } from "../../app/utils";
import { useTrackLyrics } from "../../hooks/use-track-lyrics";
import { useShell } from "../layout/ShellContext";

type NowPlayingViewProps = {
  RepeatIcon: ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  activeDuration: number;
  displayedPlaybackTime: number;
  isPlaying: boolean;
  onBeginProgressScrub: () => void;
  onCycleRepeatMode: () => void;
  onPlayNextTrack: () => void;
  onPlayPreviousTrack: () => void;
  onSeek: (value: number) => void;
  onTogglePlayback: () => void;
  onToggleShuffle: () => void;
  onUpdateProgressScrub: (value: number) => void;
  repeatMode: RepeatMode;
  selectedTrack: LibraryTrack;
  shuffleEnabled: boolean;
};

/**
 * Full-window "Now Playing": large cover over a blurred copy of itself, its
 * own transport controls and big synced lyrics (click a line to jump there).
 * Mounted only while open, so its lyrics hook does not run in the background.
 */
export function NowPlayingView({
  RepeatIcon,
  activeDuration,
  displayedPlaybackTime,
  isPlaying,
  onBeginProgressScrub,
  onCycleRepeatMode,
  onPlayNextTrack,
  onPlayPreviousTrack,
  onSeek,
  onTogglePlayback,
  onToggleShuffle,
  onUpdateProgressScrub,
  repeatMode,
  selectedTrack,
  shuffleEnabled,
}: NowPlayingViewProps) {
  const shell = useShell();
  const { copy } = shell;
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const [showRomaji, setShowRomaji] = useState(() => readStoredValue(storageKeys.showRomaji) !== "false");
  const lyrics = useTrackLyrics({ activeDuration, displayedPlaybackTime, selectedTrack });
  const artworkSrc = getTrackArtworkSrc(selectedTrack);
  const progress = activeDuration > 0 ? Math.min(displayedPlaybackTime, activeDuration) : displayedPlaybackTime;
  const progressPercent = activeDuration > 0 ? (progress / activeDuration) * 100 : 0;

  useEffect(() => {
    writeStoredValue(storageKeys.showRomaji, String(showRomaji));
  }, [showRomaji]);

  // Focus the close button on open and close on Escape.
  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        shell.onCloseNowPlaying();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lyrics.activeLineIndex < 0) {
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, [lyrics.activeLineIndex]);

  const lyricsMessage =
    lyrics.status === "loading"
      ? copy.lyricsLoading
      : lyrics.status === "error"
        ? copy.lyricsUnavailable
        : lyrics.status === "ready" && lyrics.isInstrumental
          ? copy.lyricsInstrumental
          : lyrics.status === "empty" || (lyrics.status === "ready" && lyrics.lines.length === 0)
            ? copy.lyricsEmpty
            : null;

  return (
    <div aria-label={copy.fullscreen} aria-modal="true" className="now-playing-view" role="dialog">
      <div aria-hidden="true" className="np-backdrop">
        {artworkSrc ? <img alt="" className="np-backdrop-image" src={artworkSrc} /> : null}
        <div className="np-backdrop-glow" />
        <div className="np-backdrop-shade" />
      </div>

      <header className="np-header">
        <button
          className="np-pill-button"
          onClick={shell.onCloseNowPlaying}
          ref={closeButtonRef}
          type="button"
        >
          <ChevronDown aria-hidden="true" size={18} strokeWidth={2.2} />
          {copy.exitFullscreen}
        </button>
        <div className="np-header-actions">
          {lyrics.hasRomanji ? (
            <button
              aria-pressed={showRomaji}
              className={`np-pill-button${showRomaji ? " active" : ""}`}
              onClick={() => setShowRomaji((current) => !current)}
              type="button"
            >
              <Languages aria-hidden="true" size={16} strokeWidth={2.1} />
              {copy.romanization}
            </button>
          ) : null}
          <button
            aria-label={copy.miniPlayer}
            className="np-icon-button"
            onClick={() => {
              shell.onCloseNowPlaying();
              shell.onEnterMiniMode();
            }}
            title={copy.miniPlayer}
            type="button"
          >
            <PictureInPicture2 aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="np-body">
        <section aria-label={copy.panelNowPlaying} className="np-track">
          <div className="np-cover">
            {artworkSrc ? <img alt="" className="np-cover-image" src={artworkSrc} /> : <div className="np-cover-fallback" />}
          </div>

          <div className="np-track-copy">
            <div className="np-title-row">
              <h2 className="np-title">{selectedTrack.title}</h2>
              <HeartButton
                artist={selectedTrack.artist}
                className="np-heart"
                labels={{ add: shell.copy.favoriteAdd, remove: shell.copy.favoriteRemove }}
                size={22}
                title={selectedTrack.title}
              />
            </div>
            <p className="np-subtitle">
              <button
                className="player-link"
                onClick={() => {
                  shell.onCloseNowPlaying();
                  shell.onOpenTrackArtist(selectedTrack);
                }}
                type="button"
              >
                {selectedTrack.artist}
              </button>
              {" · "}
              <button
                className="player-link"
                onClick={() => {
                  shell.onCloseNowPlaying();
                  shell.onOpenTrackAlbum(selectedTrack);
                }}
                type="button"
              >
                {selectedTrack.album}
              </button>
            </p>
          </div>

          <div className="np-progress">
            <input
              aria-label={copy.panelNowPlaying}
              className={`progress-slider${isPlaying ? " playing" : ""}`}
              max={activeDuration > 0 ? activeDuration : 0}
              min="0"
              onChange={(event) => onSeek(Number(event.currentTarget.value))}
              onInput={(event: FormEvent<HTMLInputElement>) => onUpdateProgressScrub(Number(event.currentTarget.value))}
              onPointerDown={onBeginProgressScrub}
              step="0.01"
              style={{ "--pct": `${progressPercent}%` } as CSSProperties}
              type="range"
              value={progress}
            />
            <div className="np-times">
              <span>{formatTime(displayedPlaybackTime)}</span>
              <span>{activeDuration > 0 ? formatTime(activeDuration) : selectedTrack.duration}</span>
            </div>
          </div>

          <div className="np-controls">
            <button
              aria-label={shuffleEnabled ? copy.shuffleOn : copy.shuffleOff}
              aria-pressed={shuffleEnabled}
              className={`np-control${shuffleEnabled ? " active" : ""}`}
              onClick={onToggleShuffle}
              type="button"
            >
              <Shuffle aria-hidden="true" size={20} strokeWidth={2} />
            </button>
            <button aria-label={copy.previous} className="np-control np-control--large" onClick={onPlayPreviousTrack} type="button">
              <SkipBack aria-hidden="true" size={24} strokeWidth={2.1} />
            </button>
            <button
              aria-label={isPlaying ? copy.pause : copy.play}
              className="np-control np-control--play"
              onClick={onTogglePlayback}
              type="button"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={28} strokeWidth={2.2} />
              ) : (
                <Play aria-hidden="true" className="play-glyph" size={28} strokeWidth={2.2} />
              )}
            </button>
            <button aria-label={copy.next} className="np-control np-control--large" onClick={onPlayNextTrack} type="button">
              <SkipForward aria-hidden="true" size={24} strokeWidth={2.1} />
            </button>
            <button
              aria-label={repeatMode === "one" ? copy.repeatOne : repeatMode === "all" ? copy.repeatAll : copy.repeatOff}
              aria-pressed={repeatMode !== "off"}
              className={`np-control${repeatMode !== "off" ? " active" : ""}`}
              onClick={onCycleRepeatMode}
              type="button"
            >
              <RepeatIcon size={20} strokeWidth={2} />
            </button>
          </div>
        </section>

        <section aria-label={copy.panelLyrics} className="np-lyrics">
          <p className="np-lyrics-source">
            {lyrics.status === "ready" && lyrics.lines.length > 0
              ? `${lyrics.isSynced ? copy.lyricsSynced : copy.lyricsUnsynced} · ${lyrics.sourceLabel}`
              : copy.panelLyrics}
          </p>

          {lyricsMessage ? (
            <p className="np-lyrics-message">{lyricsMessage}</p>
          ) : (
            <div className="np-lyrics-lines">
              {lyrics.lines.map((line, index) => {
                const isActive = lyrics.isSynced && index === lyrics.activeLineIndex;
                const isPast = lyrics.isSynced && lyrics.activeLineIndex >= 0 && index < lyrics.activeLineIndex;
                const canSeek = lyrics.isSynced && typeof line.startTimeMs === "number";

                return (
                  <button
                    className={`np-line${isActive ? " active" : ""}${isPast ? " past" : ""}${lyrics.isSynced ? "" : " static"}`}
                    disabled={!canSeek}
                    key={line.id}
                    onClick={() => {
                      if (canSeek) {
                        onSeek((line.startTimeMs as number) / 1000);
                      }
                    }}
                    ref={isActive ? activeLineRef : null}
                    type="button"
                  >
                    <span className="np-line-text">{line.text}</span>
                    {showRomaji && line.romaji ? <span className="np-line-romaji">{line.romaji}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
