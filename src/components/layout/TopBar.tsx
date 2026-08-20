import type { ChangeEvent, RefObject } from "react";
import { Download, PanelLeft, Settings2 } from "lucide-react";

type TopBarCopy = {
  downloadButton: string;
  personalization: string;
  scanFolders: string;
  scanning: string;
  searchPlaceholder: string;
};

type TopBarProps = {
  copy: TopBarCopy;
  directoryInputRef: RefObject<HTMLInputElement | null>;
  isDiscoverView: boolean;
  isScanning: boolean;
  onDirectoryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenDownload: () => void;
  onOpenPersonalization: () => void;
  onScanFolder: () => void;
  onSearchQueryChange: (value: string) => void;
  onToggleSidebar: () => void;
  searchQuery: string;
  supportedAudioAccept: string;
};

export function TopBar({
  copy,
  directoryInputRef,
  isDiscoverView,
  isScanning,
  onDirectoryChange,
  onOpenDownload,
  onOpenPersonalization,
  onScanFolder,
  onSearchQueryChange,
  onToggleSidebar,
  searchQuery,
  supportedAudioAccept,
}: TopBarProps) {
  return (
    <header className="topbar" style={isDiscoverView ? { display: "none" } : undefined}>
      <input
        ref={(node) => {
          directoryInputRef.current = node;
          node?.setAttribute("webkitdirectory", "");
          node?.setAttribute("directory", "");
        }}
        accept={supportedAudioAccept}
        className="hidden-directory-input"
        multiple
        onChange={onDirectoryChange}
        type="file"
      />

      <div className="search-download-group">
        <button
          aria-label="Toggle sidebar"
          className="circle-button sidebar-toggle-btn"
          onClick={onToggleSidebar}
          type="button"
        >
          <PanelLeft size={16} />
        </button>
        <label className="search-shell" htmlFor="track-search">
          <span className="search-icon" aria-hidden="true" />
          <input
            className="search-input"
            id="track-search"
            onChange={(event) => {
              onSearchQueryChange(event.currentTarget.value);
            }}
            placeholder={copy.searchPlaceholder}
            type="search"
            value={searchQuery}
          />
        </label>

        {!isDiscoverView ? (
          <button
            aria-label={copy.downloadButton}
            className="toolbar-button toolbar-icon-button download-trigger-button"
            onClick={onOpenDownload}
            title={copy.downloadButton}
            type="button"
          >
            <Download aria-hidden="true" className="ui-icon" size={18} strokeWidth={2.1} />
          </button>
        ) : null}
      </div>

      <div className="toolbar-actions">
        <button
          aria-label={copy.personalization}
          className="toolbar-button toolbar-icon-button"
          onClick={onOpenPersonalization}
          title={copy.personalization}
          type="button"
        >
          <Settings2 aria-hidden="true" className="ui-icon" size={18} strokeWidth={2.1} />
        </button>
        {!isDiscoverView ? (
          <button
            className="toolbar-button"
            disabled={isScanning}
            onClick={onScanFolder}
            type="button"
          >
            {isScanning ? copy.scanning : copy.scanFolders}
          </button>
        ) : null}
      </div>
    </header>
  );
}
