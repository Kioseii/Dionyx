import { type CSSProperties, type FormEvent } from "react";
import {
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { AppLanguage, LibraryTrack, RepeatMode } from "../../app/types";
import { formatTime } from "../../app/utils";

type PlayerBarCopy = {
  next: string;
  pause: string;
  play: string;
  previous: string;
  repeatAll: string;
  repeatOff: string;
  repeatOne: string;
  shuffleOff: string;
  shuffleOn: string;
  volume: string;
};

type PlayerBarProps = {
  RepeatIcon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  VolumeIcon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  activeDuration: number;
  appLanguage: AppLanguage;
  copy: PlayerBarCopy;
  displayedPlaybackTime: number;
  isPlaying: boolean;
  onBeginProgressScrub: () => void;
  onCyclePlaybackRate: () => void;
  onCycleRepeatMode: () => void;
  onPlayNextTrack: () => void;
  onPlayPreviousTrack: () => void;
  onSetVolume: (value: number) => void;
  onStartMarquee: (element: HTMLElement) => void;
  onStopMarquee: (element: HTMLElement) => void;
  onTogglePlayback: () => void;
  onToggleShuffle: () => void;
  onUpdateProgressScrub: (value: number) => void;
  onSeek: (value: number) => void;
  playbackRate: number;
  repeatMode: RepeatMode;
  selectedTrack: LibraryTrack;
  shuffleEnabled: boolean;
  volume: number;
};

export function PlayerBar({
  RepeatIcon,
  VolumeIcon,
  activeDuration,
  appLanguage,
  copy,
  displayedPlaybackTime,
  isPlaying,
  onBeginProgressScrub,
  onCyclePlaybackRate,
  onCycleRepeatMode,
  onPlayNextTrack,
  onPlayPreviousTrack,
  onSetVolume,
  onStartMarquee,
  onStopMarquee,
  onTogglePlayback,
  onToggleShuffle,
  onUpdateProgressScrub,
  onSeek,
  playbackRate,
  repeatMode,
  selectedTrack,
  shuffleEnabled,
  volume,
}: PlayerBarProps) {
  const coverProgressPercent =
    activeDuration > 0
      ? (Math.min(displayedPlaybackTime, activeDuration) / activeDuration) * 100
      : 0;

  return (
    <footer className="player-bar">
      <div
        className="player-track"
        onMouseEnter={(e) => e.currentTarget.querySelectorAll<HTMLElement>(".marquee-clip").forEach(onStartMarquee)}
        onMouseLeave={(e) => e.currentTarget.querySelectorAll<HTMLElement>(".marquee-clip").forEach(onStopMarquee)}
      >
        <div
          className="player-cover-ring"
          style={{ "--cover-progress": `${coverProgressPercent}%` } as CSSProperties}
        >
          <div className="player-cover">
            {selectedTrack.artworkDataUrl ? (
              <img
                alt={`Portada de ${selectedTrack.album}`}
                className="player-cover-image"
                src={selectedTrack.artworkDataUrl}
              />
            ) : null}
          </div>
        </div>
        <div className="player-track-info">
          <strong className="marquee-clip"><span className="marquee-text">{selectedTrack.title}</span></strong>
          <p className="marquee-clip"><span className="marquee-text">{selectedTrack.artist} • {selectedTrack.album}</span></p>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            aria-label={shuffleEnabled ? copy.shuffleOn : copy.shuffleOff}
            className={`mini-button player-icon-button ${shuffleEnabled ? "active" : ""}`}
            onClick={onToggleShuffle}
            type="button"
          >
            <Shuffle aria-hidden="true" className="player-icon" size={16} strokeWidth={2.1} />
          </button>
          <button
            aria-label={copy.previous}
            className="mini-button player-icon-button"
            onClick={onPlayPreviousTrack}
            type="button"
          >
            <SkipBack aria-hidden="true" className="player-icon" size={18} strokeWidth={2.15} />
          </button>
          <button
            aria-label={isPlaying ? copy.pause : copy.play}
            className="mini-button active player-icon-button player-play-button"
            onClick={onTogglePlayback}
            type="button"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="player-icon" size={20} strokeWidth={2.2} />
            ) : (
              <Play aria-hidden="true" className="player-icon play-glyph" size={20} strokeWidth={2.2} />
            )}
          </button>
          <button
            aria-label={copy.next}
            className="mini-button player-icon-button"
            onClick={onPlayNextTrack}
            type="button"
          >
            <SkipForward aria-hidden="true" className="player-icon" size={18} strokeWidth={2.15} />
          </button>
          <button
            aria-label={
              repeatMode === "one"
                ? copy.repeatOne
                : repeatMode === "all"
                  ? copy.repeatAll
                  : copy.repeatOff
            }
            className={`mini-button player-icon-button ${repeatMode !== "off" ? "active" : ""}`}
            onClick={onCycleRepeatMode}
            type="button"
          >
            <RepeatIcon aria-hidden="true" className="player-icon" size={16} strokeWidth={2.1} />
          </button>
        </div>

        <div className="player-progress">
          <span className="timecode">{formatTime(displayedPlaybackTime)}</span>
          <input
            className={`progress-slider${isPlaying ? " playing" : ""}`}
            max={activeDuration > 0 ? activeDuration : 0}
            min="0"
            onChange={(event) => {
              onSeek(Number(event.currentTarget.value));
            }}
            onInput={(event: FormEvent<HTMLInputElement>) => {
              onUpdateProgressScrub(Number(event.currentTarget.value));
            }}
            onPointerDown={onBeginProgressScrub}
            step="0.01"
            style={{ "--pct": `${activeDuration > 0 ? (Math.min(displayedPlaybackTime, activeDuration) / activeDuration) * 100 : 0}%` } as CSSProperties}
            type="range"
            value={activeDuration > 0 ? Math.min(displayedPlaybackTime, activeDuration) : displayedPlaybackTime}
          />
          <span className="timecode">
            {activeDuration > 0 ? formatTime(activeDuration) : selectedTrack.duration}
          </span>
        </div>
      </div>

      <div className="player-tools">
        <button
          aria-label={appLanguage === "es" ? "Velocidad de reproducción" : "Playback speed"}
          className={`speed-button ${playbackRate !== 1 ? "active" : ""}`}
          onClick={onCyclePlaybackRate}
          type="button"
        >
          {playbackRate === 1 ? "1×" : `${playbackRate}×`}
        </button>
        <label className="volume-control">
          <span aria-hidden="true" className="volume-icon">
            <VolumeIcon className="player-icon" size={18} strokeWidth={2.1} />
          </span>
          <input
            aria-label={copy.volume}
            className="volume-slider"
            max="1"
            min="0"
            onChange={(event) => {
              onSetVolume(Number(event.currentTarget.value));
            }}
            step="0.01"
            style={{ "--pct": `${volume * 100}%` } as CSSProperties}
            type="range"
            value={volume}
          />
          <span className="volume-value">{Math.round(volume * 100)}</span>
        </label>
      </div>
    </footer>
  );
}
