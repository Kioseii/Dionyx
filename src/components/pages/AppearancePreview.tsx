import type { CSSProperties } from "react";
import { Compass, Disc3, ListMusic, Play } from "lucide-react";
import { getTrackArtworkSrc } from "../../app/utils";
import { useShell } from "../layout/ShellContext";

/**
 * Live preview for the Appearance page. It is drawn with the app's own theme
 * variables and fonts, so it changes the moment a color or font is picked.
 * Decorative only (hidden from assistive tech; nothing in it is interactive).
 */
export function AppearancePreview() {
  const { copy, currentTrack } = useShell();
  const hasTrack = Boolean(currentTrack.path || currentTrack.source);
  const coverSrc = hasTrack ? getTrackArtworkSrc(currentTrack) : null;
  const title = hasTrack ? currentTrack.title : "Night drive library";
  const artist = hasTrack ? currentTrack.artist : "DIONYX";

  return (
    <section aria-labelledby="appearance-preview-title" className="page-card appearance-preview">
      <h2 className="page-card-title" id="appearance-preview-title">{copy.previewTitle}</h2>
      <p className="library-stats">{copy.previewHint}</p>

      <div aria-hidden="true" className="preview-frame">
        <div className="preview-nav">
          <span className="preview-nav-item active">
            <ListMusic size={15} strokeWidth={2} />
            {copy.home}
          </span>
          <span className="preview-nav-item">
            <Compass size={15} strokeWidth={2} />
            {copy.discoverNav}
          </span>
        </div>

        <div className="preview-tabs">
          <span className="library-tab active">{copy.viewSongs}</span>
          <span className="library-tab">{copy.viewAlbums}</span>
        </div>

        <div className="preview-rows">
          <div className="preview-row active">
            <span className="preview-row-cover">
              {coverSrc ? <img alt="" src={coverSrc} /> : <Disc3 size={16} strokeWidth={2} />}
            </span>
            <span className="preview-row-copy">
              <strong>{title}</strong>
              <span>{artist}</span>
            </span>
            <span className="format-pill">FLAC</span>
          </div>
          <div className="preview-row">
            <span className="preview-row-cover"><Disc3 size={16} strokeWidth={2} /></span>
            <span className="preview-row-copy">
              <strong>After midnight bloom</strong>
              <span>DIONYX</span>
            </span>
            <span className="format-pill">MP3</span>
          </div>
        </div>

        <div className="preview-player">
          <span className="player-cover-ring" style={{ "--cover-progress": "38%" } as CSSProperties}>
            <span className="player-cover">
              {coverSrc ? <img alt="" className="player-cover-image" src={coverSrc} /> : null}
            </span>
          </span>
          <span className="preview-player-copy">
            <strong>{title}</strong>
            <span className="preview-progress"><span /></span>
          </span>
          <span className="preview-play">
            <Play size={18} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </section>
  );
}
