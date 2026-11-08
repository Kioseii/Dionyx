import { getTrackArtworkSrc } from "../../app/utils";
import { type CSSProperties, type FormEvent } from "react";
import {
  ListMusic,
  Maximize2,
  MicVocal,
  Pause,
  PictureInPicture2,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
} from "lucide-react";
import { useShell } from "../layout/ShellContext";
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
  const shell = useShell();
  const isLyricsOpen = shell.detailPanelOpen && shell.detailPanelTab === "lyrics";
  const isQueueOpen = shell.detailPanelOpen && shell.detailPanelTab === "queue";
  const hasTrack = Boolean(selectedTrack.path || selectedTrack.source);
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
        <button
          aria-label={shell.copy.fullscreen}
          className="player-cover-ring player-cover-button"
          disabled={!hasTrack}
          onClick={shell.onOpenNowPlaying}
          style={{ "--cover-progress": `${coverProgressPercent}%` } as CSSProperties}
          title={shell.copy.fullscreen}
          type="button"
        >
          <span className="player-cover">
            {getTrackArtworkSrc(selectedTrack) ? (
              <img
                alt=""
                className="player-cover-image"
                src={getTrackArtworkSrc(selectedTrack) ?? undefined}
              />
            ) : null}
          </span>
          <span aria-hidden="true" className="player-cover-expand">
            <Maximize2 size={16} strokeWidth={2.2} />
          </span>
        </button>
        <div className="player-track-info">
          {hasTrack ? (
            <>
              <strong className="marquee-clip">
                <span className="marquee-text">
                  <button
                    className="player-link"
                    onClick={() => shell.onOpenTrackAlbum(selectedTrack)}
                    title={shell.copy.openAlbum}
                    type="button"
                  >
                    {selectedTrack.title}
                  </button>
                </span>
              </strong>
              <p className="marquee-clip">
                <span className="marquee-text">
                  <button
                    className="player-link"
                    onClick={() => shell.onOpenTrackArtist(selectedTrack)}
                    title={shell.copy.openArtist}
                    type="button"
                  >
                    {selectedTrack.artist}
                  </button>
                  {" • "}
                  <button
                    className="player-link"
                    onClick={() => shell.onOpenTrackAlbum(selectedTrack)}
                    title={shell.copy.openAlbum}
                    type="button"
                  >
                    {selectedTrack.album}
                  </button>
                </span>
              </p>
            </>
          ) : (
            <>
              <strong className="marquee-clip"><span className="marquee-text">{selectedTrack.title}</span></strong>
              <p className="marquee-clip"><span className="marquee-text">{selectedTrack.artist} • {selectedTrack.album}</span></p>
            </>
          )}
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
        <div className="player-shortcuts">
          <button
            aria-label={shell.copy.panelLyrics}
            aria-pressed={isLyricsOpen}
            className={`player-tool-button${isLyricsOpen ? " active" : ""}`}
            onClick={() => shell.onShowDetailPanel("lyrics")}
            title={shell.copy.panelLyrics}
            type="button"
          >
            <MicVocal aria-hidden="true" size={17} strokeWidth={2} />
          </button>
          <button
            aria-label={shell.copy.panelQueue}
            aria-pressed={isQueueOpen}
            className={`player-tool-button${isQueueOpen ? " active" : ""}`}
            onClick={() => shell.onShowDetailPanel("queue")}
            title={shell.copy.panelQueue}
            type="button"
          >
            <ListMusic aria-hidden="true" size={17} strokeWidth={2} />
          </button>
          <button
            aria-label={appLanguage === "es" ? "Ecualizador" : "Equalizer"}
            className="player-tool-button"
            onClick={shell.onOpenEqualizer}
            title={appLanguage === "es" ? "Ecualizador" : "Equalizer"}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={17} strokeWidth={2} />
          </button>
          <button
            aria-label={shell.copy.miniPlayer}
            className="player-tool-button"
            onClick={shell.onEnterMiniMode}
            title={shell.copy.miniPlayer}
            type="button"
          >
            <PictureInPicture2 aria-hidden="true" size={17} strokeWidth={2} />
          </button>
        </div>
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
