import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getLastfmTrackArtist } from "../../app/lastfm-public";
import type { DiscoverPreviewState } from "../../app/types";
import type { ChartSource } from "../../hooks/use-discover-charts";
import { useShell } from "../layout/ShellContext";

type DiscoverChartsProps = {
  activeDiscoverPreviewKey: string | null;
  discoverPreviewState: DiscoverPreviewState;
  getDiscoverPreviewKey: (artistName: string, trackName: string) => string;
  getLastFmImage: (images: { "#text": string; size: string }[] | undefined, preferredSize?: string) => string;
  onDownload: (query: string) => void;
  onPreviewToggle: (artistName: string, trackName: string) => void;
};

const sameSource = (left: ChartSource, right: ChartSource) =>
  left.kind === right.kind && (left.kind !== "tag" || (right.kind === "tag" && left.tag === right.tag));

/** Discover › Charts: your genres (or the global chart), 30 songs per page. */
export function DiscoverCharts({
  activeDiscoverPreviewKey,
  discoverPreviewState,
  getDiscoverPreviewKey,
  getLastFmImage,
  onDownload,
  onPreviewToggle,
}: DiscoverChartsProps) {
  const { copy, discoverCharts: charts } = useShell();
  const listRef = useRef<HTMLDivElement | null>(null);
  const { page, pageCount, pageSize, source, tags } = charts;

  // New page or genre: back to the top of the list.
  useEffect(() => {
    listRef.current?.scrollIntoView({ block: "nearest" });
  }, [page, source.kind, source.kind === "tag" ? source.tag : ""]);

  const sources: Array<{ label: string; value: ChartSource }> = [
    ...(tags.length > 0 ? [{ label: copy.discoverChartsForYou, value: { kind: "mix" } as ChartSource }] : []),
    ...tags.map((tag) => ({ label: tag, value: { kind: "tag", tag } as ChartSource })),
    { label: copy.discoverChartsGlobal, value: { kind: "global" } },
  ];

  const title =
    source.kind === "global"
      ? copy.discoverChartsTitle
      : source.kind === "tag"
        ? `${copy.discoverChartsTopOf} ${source.tag}`
        : copy.discoverChartsYourTaste;
  const basisHint =
    source.kind === "global"
      ? copy.discoverChartsGlobalHint
      : charts.basis === "lastfm"
        ? copy.discoverChartsBasisLastfm
        : copy.discoverChartsBasisLibrary;

  const pager =
    pageCount > 1 ? (
      <div className="discover-page-controls">
        <button
          aria-label={copy.discoverPagePrevious}
          className="discover-page-button"
          disabled={page <= 0 || charts.loading}
          onClick={() => charts.setPage(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={14} strokeWidth={2.2} />
          {copy.discoverPagePrevious}
        </button>
        <span className="discover-page-label">
          {copy.discoverPageLabel} {page + 1} / {pageCount}
        </span>
        <button
          aria-label={copy.discoverPageNext}
          className="discover-page-button"
          disabled={page >= pageCount - 1 || charts.loading}
          onClick={() => charts.setPage(page + 1)}
          type="button"
        >
          {copy.discoverPageNext}
          <ChevronRight aria-hidden="true" size={14} strokeWidth={2.2} />
        </button>
      </div>
    ) : null;

  return (
    <div className="discover-scroll" ref={listRef}>
      <div className="discover-chart-sources" role="tablist" aria-label={copy.discoverTabCharts}>
        {sources.map(({ label, value }) => (
          <button
            aria-selected={sameSource(source, value)}
            className={`discover-chart-source${sameSource(source, value) ? " active" : ""}`}
            key={label}
            onClick={() => charts.setSource(value)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="discover-section-header">
        <div>
          <h3 className="discover-section-title">{title}</h3>
          <p className="discover-chart-basis">{basisHint}</p>
        </div>
        {pager}
      </div>

      {charts.loading && charts.items.length === 0 ? (
        <div className="discover-empty"><p>{copy.discoverLoading}</p></div>
      ) : charts.error || charts.items.length === 0 ? (
        <div className="discover-empty"><p>{copy.discoverError}</p></div>
      ) : (
        <>
          <div className={`discover-charts-list${charts.loading ? " is-loading" : ""}`}>
            {charts.items.map((track, index) => {
              const artistName = getLastfmTrackArtist(track);
              const img = track.coverUrl || getLastFmImage(track.image, "medium");
              const previewKey = getDiscoverPreviewKey(artistName, track.name);
              const isPreviewActive = activeDiscoverPreviewKey === previewKey;
              const isPreviewLoading = isPreviewActive && discoverPreviewState === "loading";
              const isPreviewUnavailable =
                isPreviewActive && (discoverPreviewState === "unavailable" || discoverPreviewState === "error");
              const isPreviewPlaying = isPreviewActive && discoverPreviewState === "playing";

              return (
                <div className="discover-chart-row" key={`${artistName}-${track.name}-${index}`}>
                  <span className="discover-chart-pos">{page * pageSize + index + 1}</span>
                  {img ? (
                    <img alt={track.name} className="discover-chart-img" loading="lazy" src={img} />
                  ) : (
                    <div className="discover-chart-img discover-chart-img--placeholder" />
                  )}
                  <div className="discover-chart-info">
                    <button
                      className={`discover-chart-title discover-track-preview${isPreviewPlaying ? " is-playing" : ""}${
                        isPreviewUnavailable ? " is-unavailable" : ""
                      }`}
                      onClick={() => onPreviewToggle(artistName, track.name)}
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
                      <strong className="discover-track-preview-text">{track.name}</strong>
                      {isPreviewLoading ? (
                        <span className="discover-preview-badge">{copy.discoverPreviewLoading}</span>
                      ) : isPreviewUnavailable ? (
                        <span className="discover-preview-badge">{copy.discoverPreviewUnavailable}</span>
                      ) : null}
                    </button>
                    <span className="discover-chart-artist">{artistName}</span>
                  </div>
                  {track.listeners ? (
                    <span className="discover-chart-listeners">
                      {Number(track.listeners).toLocaleString()} {copy.discoverListenersLabel}
                    </span>
                  ) : null}
                  <button
                    className="discover-dl-btn"
                    onClick={() => onDownload(`${artistName} ${track.name}`)}
                    title={copy.discoverDownloadHint}
                    type="button"
                  >
                    <Download size={12} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
          {pager ? <div className="discover-chart-footer">{pager}</div> : null}
        </>
      )}
    </div>
  );
}
