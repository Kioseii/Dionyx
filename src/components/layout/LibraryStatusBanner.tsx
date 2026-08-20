type LibraryStatusBannerCopy = {
  currentFolder: string;
  demoLibraryHint: string;
  libraryStatus: string;
  results: string;
};

type LibraryStatusBannerProps = {
  copy: LibraryStatusBannerCopy;
  filteredTrackCount: number;
  isBannerVisible: boolean;
  normalizedSearch: string;
  scanError: string | null;
  scannedPath: string | null;
  sourceTrackCount: number;
  statusMessage: string;
};

export function LibraryStatusBanner({
  copy,
  filteredTrackCount,
  isBannerVisible,
  normalizedSearch,
  scanError,
  scannedPath,
  sourceTrackCount,
  statusMessage,
}: LibraryStatusBannerProps) {
  return (
    <>
      <section className={`scan-banner ${isBannerVisible ? "" : "scan-banner--hidden"}`} aria-live="polite">
        <div>
          <p className="eyebrow">{copy.libraryStatus}</p>
          <strong>{statusMessage}</strong>
          <p className="muted path-text">
            {scannedPath ? `${copy.currentFolder}: ${scannedPath}` : copy.demoLibraryHint}
          </p>
        </div>
        <span className="status-pill">
          {normalizedSearch ? `${filteredTrackCount} ${copy.results}` : `${sourceTrackCount} tracks`}
        </span>
      </section>

      {scanError ? <p className="error-banner">{scanError}</p> : null}
    </>
  );
}
