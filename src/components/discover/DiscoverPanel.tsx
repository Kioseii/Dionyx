import { Compass, Download } from "lucide-react";
import { DiscoverCharts } from "./DiscoverCharts";
import type {
  DiscoverPreviewState,
  DiscoverTab,
  LastFmArtist,
} from "../../app/types";

type DiscoverCopy = {
  discoverNav: string;
  discoverTabForYou: string;
  discoverTabCharts: string;
  discoverLoading: string;
  discoverSimilarEmpty: string;
  discoverSimilarTitle: string;
  discoverPagePrevious: string;
  discoverPageLabel: string;
  discoverPageNext: string;
  discoverListenersLabel: string;
  discoverPreviewLoading: string;
  discoverPreviewUnavailable: string;
  discoverPreviewPause: string;
  discoverPreviewPlay: string;
  discoverDownloadHint: string;
  discoverError: string;
  discoverChartsTitle: string;
};

type DiscoverPanelProps = {
  activeDiscoverPreviewKey: string | null;
  copy: DiscoverCopy;
  discoverError: string | null;
  discoverForYou: LastFmArtist[];
  discoverForYouPageCount: number;
  discoverPreviewState: DiscoverPreviewState;
  discoverTab: DiscoverTab;
  getDiscoverPreviewKey: (artistName: string, trackName: string) => string;
  getLastFmImage: (
    images: { "#text": string; size: string }[] | undefined,
    preferredSize?: string,
  ) => string;
  isDiscoverLoading: boolean;
  onDownload: (query: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onPreviewToggle: (artistName: string, trackName: string) => void;
  onTabChange: (tab: DiscoverTab) => void;
  safeDiscoverForYouPage: number;
};

export function DiscoverPanel({
  activeDiscoverPreviewKey,
  copy,
  discoverError,
  discoverForYou,
  discoverForYouPageCount,
  discoverPreviewState,
  discoverTab,
  getDiscoverPreviewKey,
  getLastFmImage,
  isDiscoverLoading,
  onDownload,
  onNextPage,
  onPreviousPage,
  onPreviewToggle,
  onTabChange,
  safeDiscoverForYouPage,
}: DiscoverPanelProps) {
  return (
    <div className="discover-panel">
      <div className="discover-header">
        <Compass aria-hidden="true" className="discover-header-icon" size={20} strokeWidth={2} />
        <h2 className="discover-title">{copy.discoverNav}</h2>
      </div>

      <div className="discover-tabs" role="tablist">
        {(["foryou", "charts"] as const).map((tab) => (
          <button
            key={tab}
            className={`discover-tab ${discoverTab === tab ? "active" : ""}`}
            onClick={() => onTabChange(tab)}
            role="tab"
            type="button"
          >
            {tab === "foryou" ? copy.discoverTabForYou : copy.discoverTabCharts}
          </button>
        ))}
      </div>

      {discoverTab === "charts" ? (
        <DiscoverCharts
          activeDiscoverPreviewKey={activeDiscoverPreviewKey}
          discoverPreviewState={discoverPreviewState}
          getDiscoverPreviewKey={getDiscoverPreviewKey}
          getLastFmImage={getLastFmImage}
          onDownload={onDownload}
          onPreviewToggle={onPreviewToggle}
        />
      ) : isDiscoverLoading ? (
        <div className="discover-empty"><p>{copy.discoverLoading}</p></div>
      ) : discoverError ? (
        <div className="discover-empty error"><p>{discoverError}</p></div>
      ) : discoverTab === "foryou" ? (
        discoverForYou.length === 0 ? (
          <div className="discover-empty"><p>{copy.discoverSimilarEmpty}</p></div>
        ) : (
          <div className="discover-scroll">
            <div className="discover-section-header">
              <h3 className="discover-section-title">{copy.discoverSimilarTitle}</h3>
              {discoverForYouPageCount > 1 ? (
                <div className="discover-page-controls">
                  <button
                    className="discover-page-button"
                    disabled={safeDiscoverForYouPage <= 0}
                    onClick={onPreviousPage}
                    type="button"
                  >
                    {copy.discoverPagePrevious}
                  </button>
                  <span className="discover-page-label">
                    {copy.discoverPageLabel} {safeDiscoverForYouPage + 1} / {discoverForYouPageCount}
                  </span>
                  <button
                    className="discover-page-button"
                    disabled={safeDiscoverForYouPage >= discoverForYouPageCount - 1}
                    onClick={onNextPage}
                    type="button"
                  >
                    {copy.discoverPageNext}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="discover-artists-grid">
              {discoverForYou.map((artist) => {
                const img =
                  artist.coverUrl ||
                  getLastFmImage(artist.image, "extralarge") ||
                  getLastFmImage(artist.image, "large");

                return (
                  <div className="discover-artist-card" key={artist.name}>
                    {img ? (
                      <img alt={artist.name} className="discover-artist-img" src={img} />
                    ) : (
                      <div className="discover-artist-img discover-artist-img--placeholder">
                        <span className="discover-artist-initials">
                          {artist.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="discover-artist-info">
                      <strong className="discover-artist-name">{artist.name}</strong>
                      {artist.listeners ? (
                        <span className="discover-artist-listeners">
                          {Number(artist.listeners).toLocaleString()} {copy.discoverListenersLabel}
                        </span>
                      ) : null}
                    </div>

                    {artist.topTracks && artist.topTracks.length > 0 ? (
                      <ul className="discover-top-tracks">
                        {artist.topTracks.slice(0, 3).map((track) => {
                          const previewKey = getDiscoverPreviewKey(artist.name, track.name);
                          const isPreviewActive = activeDiscoverPreviewKey === previewKey;
                          const isPreviewLoading =
                            isPreviewActive && discoverPreviewState === "loading";
                          const isPreviewUnavailable =
                            isPreviewActive &&
                            (discoverPreviewState === "unavailable" || discoverPreviewState === "error");
                          const isPreviewPlaying =
                            isPreviewActive && discoverPreviewState === "playing";

                          return (
                            <li className="discover-track-row" key={track.name}>
                              <button
                                className={`discover-track-name discover-track-preview${
                                  isPreviewPlaying ? " is-playing" : ""
                                }${isPreviewUnavailable ? " is-unavailable" : ""}`}
                                onClick={() => {
                                  onPreviewToggle(artist.name, track.name);
                                }}
                                title={
                                  isPreviewLoading
                                    ? copy.discoverPreviewLoading
                                    : isPreviewUnavailable
                                      ? copy.discoverPreviewUnavailable
                                      : isPreviewPlaying
                                        ? copy.discoverPreviewPause
                                        : copy.discoverPreviewPlay
                                }
                                type="button"
                              >
                                <span className="discover-track-preview-text">{track.name}</span>
                                {isPreviewLoading ? (
                                  <span className="discover-preview-badge">{copy.discoverPreviewLoading}</span>
                                ) : isPreviewUnavailable ? (
                                  <span className="discover-preview-badge">{copy.discoverPreviewUnavailable}</span>
                                ) : null}
                              </button>
                              <button
                                className="discover-dl-btn"
                                onClick={() => {
                                  onDownload(`${artist.name} ${track.name}`);
                                }}
                                title={copy.discoverDownloadHint}
                                type="button"
                              >
                                <Download size={12} strokeWidth={2} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
