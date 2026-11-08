import { getTrackArtworkSrc } from "../../app/utils";
import { type CSSProperties, type FormEvent, type RefObject } from "react";
import { Pause, Pin, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { LibraryTrack } from "../../app/types";
import { formatTime } from "../../app/utils";

type MiniPlayerOverlayProps = {
  activeDuration: number;
  displayedPlaybackTime: number;
  handleMiniPlayerMouseDown: (event: React.MouseEvent<HTMLElement>) => void;
  isPlaying: boolean;
  miniMode: boolean;
  miniPinned: boolean;
  mpArtistScrolls: boolean;
  mpInfoRef: RefObject<HTMLDivElement | null>;
  mpTitleScrolls: boolean;
  onBeginProgressScrub: () => void;
  onExitMiniMode: () => void;
  onHandleSeek: (value: number) => void;
  onPlayNextTrack: () => void;
  onPlayPreviousTrack: () => void;
  onToggleMiniPin: () => void;
  onTogglePlayback: () => void;
  onUpdateProgressScrub: (value: number) => void;
  selectedTrack: LibraryTrack;
  themeStyle: CSSProperties;
};

export function MiniPlayerOverlay({
  activeDuration,
  displayedPlaybackTime,
  handleMiniPlayerMouseDown,
  isPlaying,
  miniMode,
  miniPinned,
  mpArtistScrolls,
  mpInfoRef,
  mpTitleScrolls,
  onBeginProgressScrub,
  onExitMiniMode,
  onHandleSeek,
  onPlayNextTrack,
  onPlayPreviousTrack,
  onToggleMiniPin,
  onTogglePlayback,
  onUpdateProgressScrub,
  selectedTrack,
  themeStyle,
}: MiniPlayerOverlayProps) {
  if (!miniMode) {
    return null;
  }

  return (
    <div
      className="mini-player-root"
      onMouseDown={handleMiniPlayerMouseDown}
      style={themeStyle}
    >
      <div className="mp-main-row">
        <div className="mp-artwork">
          {getTrackArtworkSrc(selectedTrack) ? (
            <img alt="artwork" src={getTrackArtworkSrc(selectedTrack) ?? undefined} />
          ) : (
            <div className="mp-artwork-fallback" />
          )}
        </div>
        <div className="mp-ticker" ref={mpInfoRef}>
          <span className="mp-ticker-line">
            {mpTitleScrolls ? (
              <span className="mp-ticker-inner mp-title">
                {selectedTrack.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{selectedTrack.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ) : (
              <span className="mp-title">{selectedTrack.title || "—"}</span>
            )}
          </span>
          <span className="mp-ticker-line">
            {mpArtistScrolls ? (
              <span className="mp-ticker-inner mp-artist">
                {selectedTrack.artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{selectedTrack.artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ) : (
              <span className="mp-artist">{selectedTrack.artist || "—"}</span>
            )}
          </span>
        </div>
        <div className="mp-controls mp-interactive">
          <button aria-label="Anterior" className="mp-btn" onClick={onPlayPreviousTrack} type="button">
            <SkipBack size={13} strokeWidth={2.2} />
          </button>
          <button
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            className="mp-btn mp-play-btn"
            onClick={onTogglePlayback}
            type="button"
          >
            {isPlaying ? (
              <Pause size={14} strokeWidth={2.2} />
            ) : (
              <Play size={14} strokeWidth={2.2} style={{ marginLeft: 1 }} />
            )}
          </button>
          <button aria-label="Siguiente" className="mp-btn" onClick={onPlayNextTrack} type="button">
            <SkipForward size={13} strokeWidth={2.2} />
          </button>
          <button
            aria-label={miniPinned ? "Dejar de mantener al frente" : "Mantener al frente"}
            className={`mp-btn mp-pin-btn${miniPinned ? " active" : ""}`}
            onClick={onToggleMiniPin}
            type="button"
          >
            <Pin size={11} strokeWidth={2.3} />
          </button>
          <button aria-label="Cerrar mini player" className="mp-btn mp-close-btn" onClick={onExitMiniMode} type="button">
            <X size={12} strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="mp-progress-row mp-interactive">
        <span className="mp-timecode">{formatTime(displayedPlaybackTime)}</span>
        <input
          className="mp-seek"
          max={activeDuration > 0 ? activeDuration : 0}
          min="0"
          onChange={(event) => onHandleSeek(Number(event.currentTarget.value))}
          onInput={(event: FormEvent<HTMLInputElement>) => {
            onUpdateProgressScrub(Number(event.currentTarget.value));
          }}
          onPointerDown={onBeginProgressScrub}
          step="0.01"
          type="range"
          value={activeDuration > 0 ? Math.min(displayedPlaybackTime, activeDuration) : displayedPlaybackTime}
        />
        <span className="mp-timecode">
          {activeDuration > 0 ? formatTime(activeDuration) : selectedTrack.duration}
        </span>
      </div>
    </div>
  );
}
