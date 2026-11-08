import type { ChangeEvent, RefObject } from "react";
import { Download, Palette, PanelLeft, PanelRight, Settings } from "lucide-react";
import { useShell } from "./ShellContext";

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

/**
 * Search bar. Downloads, appearance/settings and scanning moved to the
 * sidebar; the right-hand button shows or hides the side panel.
 */
export function TopBar({
  copy,
  directoryInputRef,
  isDiscoverView,
  onDirectoryChange,
  onSearchQueryChange,
  onToggleSidebar,
  searchQuery,
  supportedAudioAccept,
}: TopBarProps) {
  const {
    copy: shellCopy,
    detailPanelOpen,
    isScanning,
    onOpenAppearance,
    onOpenDownloads,
    onOpenSettings,
    onScanFolder,
    onToggleDetailPanel,
  } = useShell();

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
      </div>

      <div className="toolbar-actions">
        {/* The sidebar is hidden on narrow windows: keep its shortcuts reachable. */}
        <button
          aria-label={shellCopy.downloadsNav}
          className="circle-button topbar-narrow-only"
          onClick={onOpenDownloads}
          title={shellCopy.downloadsNav}
          type="button"
        >
          <Download size={16} />
        </button>
        <button
          aria-label={shellCopy.appearanceNav}
          className="circle-button topbar-narrow-only"
          onClick={onOpenAppearance}
          title={shellCopy.appearanceNav}
          type="button"
        >
          <Palette size={16} />
        </button>
        <button
          aria-label={shellCopy.settingsNav}
          className="circle-button topbar-narrow-only"
          onClick={onOpenSettings}
          title={shellCopy.settingsNav}
          type="button"
        >
          <Settings size={16} />
        </button>
        <button
          className="toolbar-button topbar-narrow-only"
          disabled={isScanning}
          onClick={onScanFolder}
          type="button"
        >
          {isScanning ? shellCopy.scanning : shellCopy.scanNow}
        </button>
        <button
          aria-label={detailPanelOpen ? shellCopy.hidePanel : shellCopy.showPanel}
          aria-pressed={detailPanelOpen}
          className={`circle-button panel-toggle-btn${detailPanelOpen ? " active" : ""}`}
          onClick={onToggleDetailPanel}
          title={detailPanelOpen ? shellCopy.hidePanel : shellCopy.showPanel}
          type="button"
        >
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}
