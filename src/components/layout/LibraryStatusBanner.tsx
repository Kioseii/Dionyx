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

/**
 * Only the persistent scan error stays inline in the main stage; transient
 * status messages are shown by <NoticeToast />.
 */
export function LibraryStatusBanner({ scanError }: LibraryStatusBannerProps) {
  return scanError ? <p className="error-banner">{scanError}</p> : null;
}
