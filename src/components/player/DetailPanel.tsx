import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { FileText, ListMusic, Minimize2, SlidersHorizontal } from "lucide-react";
import type { LibraryTrack, SavedPlaylist } from "../../app/types";
import { formatTime, getTrackKey } from "../../app/utils";
import { useTrackLyrics } from "../../hooks/use-track-lyrics";

type DetailPanelCopy = {
  equalizer: string;
  lyrics: string;
  lyricsEmpty: string;
  lyricsInstrumental: string;
  lyricsLoading: string;
  lyricsSynced: string;
  lyricsUnavailable: string;
  lyricsUnsynced: string;
  nowPlaying: string;
  playingFrom: string;
  queue: string;
  queueEmpty: string;
  removeFromPlaylist: string;
  saveToPlaylist: string;
  tracksWord: string;
};

type QueueRow = {
  position: number;
  track: LibraryTrack;
  trackIndex: number;
};

type DetailPanelProps = {
  activeDuration: number;
  activePlaylist: SavedPlaylist | null;
  copy: DetailPanelCopy;
  displayedPlaybackTime: number;
  isPlaying: boolean;
  onBeginProgressScrub: () => void;
  onEnterMiniMode: () => void;
  onJumpToQueuePosition: (nextPosition: number) => void;
  onOpenEqualizer: () => void;
  onOpenTrackPlaylistModal: (track: LibraryTrack) => void;
  onRemoveTrackFromActivePlaylist: () => void;
  onSeek: (value: number) => void;
  onUpdateProgressScrub: (value: number) => void;
  playbackPlaylist: SavedPlaylist | null;
  playbackQueue: number[];
  queuePosition: number;
  queueRows: QueueRow[];
  selectedTrack: LibraryTrack;
  selectedTrackInViewIndex: number;
};

export function DetailPanel({
  activeDuration,
  activePlaylist,
  copy,
  displayedPlaybackTime,
  isPlaying,
  onBeginProgressScrub,
  onEnterMiniMode,
  onJumpToQueuePosition,
  onOpenEqualizer,
  onOpenTrackPlaylistModal,
  onRemoveTrackFromActivePlaylist,
  onSeek,
  onUpdateProgressScrub,
  playbackPlaylist,
  playbackQueue,
  queuePosition,
  queueRows,
  selectedTrack,
  selectedTrackInViewIndex,
}: DetailPanelProps) {
  const [sidePanelTab, setSidePanelTab] = useState<"lyrics" | "queue">("queue");
  const activeLyricLineRef = useRef<HTMLDivElement | null>(null);
  const lyrics = useTrackLyrics({
    activeDuration,
    displayedPlaybackTime,
    selectedTrack,
  });
  const isLyricsTab = sidePanelTab === "lyrics";

  useEffect(() => {
    if (!isLyricsTab || lyrics.activeLineIndex < 0) {
      return;
    }

    activeLyricLineRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [isLyricsTab, lyrics.activeLineIndex]);

  return (
    <aside
      className="detail-panel"
      onMouseEnter={(e) => e.currentTarget.classList.add("scrollbar-visible")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("scrollbar-visible")}
    >
      <div className={`now-card ${isLyricsTab ? "now-card--lyrics" : ""}`}>
        <div className="now-card-header">
          <p className="eyebrow">{copy.nowPlaying}</p>
          <div className="now-card-header-actions">
            <button
              className={`mini-button now-card-header-toggle ${isLyricsTab ? "active" : ""}`}
              onClick={() => {
                setSidePanelTab((current) => (current === "lyrics" ? "queue" : "lyrics"));
              }}
              type="button"
            >
              <FileText aria-hidden="true" className="ui-icon" size={14} strokeWidth={2.1} />
              {copy.lyrics}
            </button>
            <button
              aria-label="Mini player"
              className="mp-open-btn"
              onClick={onEnterMiniMode}
              title="Mini player"
              type="button"
            >
              <Minimize2 size={13} strokeWidth={2.1} />
            </button>
          </div>
        </div>
        {isLyricsTab ? (
          <div className="now-card-lyrics-block">
            <div className="now-card-lyrics-header">
              <div className="now-card-lyrics-track">
                <h3 className="now-card-title">{selectedTrack.title}</h3>
                <p className="muted now-card-subtitle">{selectedTrack.artist}</p>
              </div>
              <div className="now-card-lyrics-mode">
                {lyrics.status === "ready" ? (
                  <strong>{lyrics.isSynced ? copy.lyricsSynced : copy.lyricsUnsynced}</strong>
                ) : null}
              </div>
            </div>
            <div className="lyrics-list now-card-lyrics-list">
              {lyrics.status === "loading" ? (
                <div className="queue-empty">
                  <strong>{copy.lyricsLoading}</strong>
                </div>
              ) : null}
              {lyrics.status === "error" ? (
                <div className="queue-empty">
                  <strong>{copy.lyricsUnavailable}</strong>
                </div>
              ) : null}
              {lyrics.status === "ready" && lyrics.isInstrumental ? (
                <div className="queue-empty">
                  <strong>{copy.lyricsInstrumental}</strong>
                </div>
              ) : null}
              {lyrics.status === "ready" && !lyrics.isInstrumental && lyrics.lines.length === 0 ? (
                <div className="queue-empty">
                  <strong>{copy.lyricsEmpty}</strong>
                </div>
              ) : null}
              {lyrics.status === "empty" ? (
                <div className="queue-empty">
                  <strong>{copy.lyricsEmpty}</strong>
                </div>
              ) : null}
              {lyrics.status === "ready" && lyrics.lines.length > 0
                ? lyrics.lines.map((line, index) => {
                  const isActiveLine = lyrics.isSynced && index === lyrics.activeLineIndex;

                  return (
                    <div
                      className={`lyrics-line ${isActiveLine ? "active" : ""}`}
                      key={line.id}
                      ref={isActiveLine ? activeLyricLineRef : null}
                    >
                      <p className="lyrics-line-text">{line.text}</p>
                      {line.romaji ? (
                        <p className="lyrics-line-romaji">{line.romaji}</p>
                      ) : null}
                    </div>
                  );
                })
                : null}
            </div>
          </div>
        ) : (
          <>
            <div className="artwork-frame">
              {selectedTrack.artworkDataUrl ? (
                <img
                  alt={`Portada de ${selectedTrack.album}`}
                  className="artwork-image"
                  src={selectedTrack.artworkDataUrl}
                />
              ) : (
                <div className="artwork-core" />
              )}
            </div>
            <div className="now-card-copy">
              <h3 className="now-card-title">{selectedTrack.title}</h3>
              <p className="muted now-card-subtitle">
                {selectedTrack.artist}
              </p>
              <p className="muted now-card-meta-line">
                {[
                  selectedTrack.album || null,
                  selectedTrack.format,
                  selectedTrack.quality,
                  activeDuration > 0 ? formatTime(activeDuration) : selectedTrack.duration,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
            {playbackPlaylist ? (
              <div className="playlist-track-tools">
                <span className="muted playlist-track-meta">
                  {copy.playingFrom} {playbackPlaylist.name}
                </span>
                <div className="playlist-track-actions">
                  <button
                    className="mini-button danger-button"
                    disabled={!activePlaylist || selectedTrackInViewIndex < 0}
                    onClick={onRemoveTrackFromActivePlaylist}
                    type="button"
                  >
                    {copy.removeFromPlaylist}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="now-card-actions">
              {!activePlaylist || selectedTrackInViewIndex < 0 ? (
                <button
                  className="mini-button now-card-action"
                  disabled={!selectedTrack.path && !selectedTrack.source}
                  onClick={() => {
                    onOpenTrackPlaylistModal(selectedTrack);
                  }}
                  type="button"
                >
                  {copy.saveToPlaylist}
                </button>
              ) : null}
              <button
                className="mini-button now-card-action"
                onClick={onOpenEqualizer}
                type="button"
              >
                <SlidersHorizontal aria-hidden="true" className="ui-icon" size={16} strokeWidth={2.1} />
                {copy.equalizer}
              </button>
            </div>
            <div className="progress-block">
              <div className="progress-meta">
                <span className="timecode">{formatTime(displayedPlaybackTime)}</span>
                <span className="timecode">
                  {activeDuration > 0 ? formatTime(activeDuration) : selectedTrack.duration}
                </span>
              </div>
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
                style={{
                  "--pct": `${activeDuration > 0 ? (Math.min(displayedPlaybackTime, activeDuration) / activeDuration) * 100 : 0}%`,
                } as CSSProperties}
                type="range"
                value={activeDuration > 0 ? Math.min(displayedPlaybackTime, activeDuration) : displayedPlaybackTime}
              />
            </div>
          </>
        )}
      </div>

      <div className="side-card">
        <div className="side-card-heading">
          <div className="side-card-title">
            <ListMusic aria-hidden="true" className="ui-icon" size={16} strokeWidth={2.1} />
            <div>
              <p className="eyebrow">{copy.queue}</p>
              {queueRows.length > 0 ? (
                <strong>{`${Math.max(playbackQueue.length - (queuePosition + 1), 0)} ${copy.tracksWord}`}</strong>
              ) : null}
            </div>
          </div>
        </div>
        <div className="queue-list">
          {queueRows.length > 0 ? (() => {
            const BEFORE = 3;
            const AFTER = 14;
            const start = Math.max(0, queuePosition - BEFORE);
            const end = Math.min(queueRows.length, queuePosition + AFTER + 1);
            const visible = queueRows.slice(start, end);

            return visible.map(({ position, track }) => (
              <button
                className={`queue-item ${position === queuePosition ? "active" : ""}`}
                key={`${getTrackKey(track)}-${position}`}
                onClick={() => {
                  onJumpToQueuePosition(position);
                }}
                type="button"
              >
                {position === queuePosition ? (
                  <span className="queue-item-index queue-item-now">▶</span>
                ) : (
                  <span className="queue-item-index">{position + 1}</span>
                )}
                <div className="queue-item-artwork">
                  {track.artworkDataUrl ? (
                    <img
                      alt={`Portada de ${track.album || track.title}`}
                      className="queue-item-artwork-image"
                      src={track.artworkDataUrl}
                    />
                  ) : (
                    <div className="queue-item-artwork-fallback" />
                  )}
                </div>
                <div className="queue-item-copy">
                  <strong>{track.title}</strong>
                  <p>{track.artist}</p>
                </div>
                <span className="queue-item-time">{track.duration}</span>
              </button>
            ));
          })() : (
            <div className="queue-empty">
              <strong>{copy.queueEmpty}</strong>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
