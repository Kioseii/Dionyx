import { createPortal } from "react-dom";
import { useShell } from "../layout/ShellContext";
import type { RefObject } from "react";
import { Check, ChevronDown, Download } from "lucide-react";
import { AUDIO_FORMATS } from "../../app/constants";
import type { AudioDownloadFormat, DownloadItem, ToolingSupport, TrackSearchResult } from "../../app/types";

type DownloadModalCopy = {
  downloadModalTitle: string;
  downloadModalHint: string;
  downloadNoFolder: string;
  downloadUrlPlaceholder: string;
  downloadAddButton: string;
  downloadSearching: string;
  downloadPickVersion: string;
  downloadBack: string;
  downloadQueueTitle: string;
  downloadClearDone: string;
  downloadQueueEmpty: string;
  downloadFetching: string;
  downloadPending: string;
  downloadDone: string;
  downloadError: string;
};

type DownloadModalProps = {
  appLanguage: "es" | "en";
  copy: DownloadModalCopy;
  downloadFormat: AudioDownloadFormat;
  downloadFormatMenuRef: RefObject<HTMLDivElement | null>;
  downloadQueue: DownloadItem[];
  downloadUrl: string;
  ffmpegInstallError: string | null;
  ffmpegInstallProgress: number;
  ffmpegVersion: string | null;
  isDownloadFormatMenuOpen: boolean;
  isFfmpegAvailable: boolean | null;
  isInstallingFfmpeg: boolean;
  isInstallingYtdlp: boolean;
  isOpen: boolean;
  isSearchingTracks: boolean;
  isYtdlpAvailable: boolean | null;
  onAddDownload: () => void;
  onClose: () => void;
  onDownloadFormatChange: (format: AudioDownloadFormat) => void;
  onDownloadFormatMenuToggle: () => void;
  onDownloadUrlChange: (value: string) => void;
  onFfmpegInstall: () => void;
  onPickSearchResult: (result: TrackSearchResult) => void;
  onRecheckDeps: () => void;
  onTrackSearchResultsClear: () => void;
  onYtdlpInstall: () => void;
  scannedPath: string | null;
  setDownloadQueue: (updater: (queue: DownloadItem[]) => DownloadItem[]) => void;
  trackSearchResults: TrackSearchResult[] | null;
  toolingSupport: ToolingSupport;
  ytdlpInstallError: string | null;
  ytdlpInstallProgress: number;
  ytdlpVersion: string | null;
};

export function DownloadModal({
  appLanguage,
  copy,
  downloadFormat,
  downloadFormatMenuRef,
  downloadQueue,
  downloadUrl,
  ffmpegInstallError,
  ffmpegInstallProgress,
  ffmpegVersion,
  isDownloadFormatMenuOpen,
  isFfmpegAvailable,
  isInstallingFfmpeg,
  isInstallingYtdlp,
  isOpen,
  isSearchingTracks,
  isYtdlpAvailable,
  onAddDownload,
  onDownloadFormatChange,
  onDownloadFormatMenuToggle,
  onDownloadUrlChange,
  onFfmpegInstall,
  onPickSearchResult,
  onRecheckDeps,
  onTrackSearchResultsClear,
  onYtdlpInstall,
  scannedPath,
  setDownloadQueue,
  trackSearchResults,
  toolingSupport,
  ytdlpInstallError,
  ytdlpInstallProgress,
  ytdlpVersion,
}: DownloadModalProps) {
  const shell = useShell();

  if (!isOpen) {
    return null;
  }

  const toolsMissing =
    (isYtdlpAvailable === null || !isYtdlpAvailable || isFfmpegAvailable === null || isFfmpegAvailable === false) &&
    !(isYtdlpAvailable === true && isFfmpegAvailable === true);
  const ytdlpHint =
    toolingSupport.platform === "macos"
      ? (appLanguage === "es"
          ? "Motor de descarga de YouTube. DIONYX puede bajar el binario de macOS por ti."
          : "YouTube download engine. DIONYX can fetch the macOS binary for you.")
      : toolingSupport.platform === "windows"
        ? (appLanguage === "es"
            ? "Motor de descarga de YouTube. DIONYX puede bajar el binario de Windows por ti."
            : "YouTube download engine. DIONYX can fetch the Windows binary for you.")
        : (appLanguage === "es"
            ? "Motor de descarga de YouTube."
            : "YouTube download engine.");
  const ffmpegHint =
    toolingSupport.ffmpegInstallMethod === "homebrew"
      ? (appLanguage === "es"
          ? "Necesario para MP3, FLAC, OGG y WAV. En macOS DIONYX intentara instalarlo con Homebrew."
          : "Required for MP3, FLAC, OGG and WAV. On macOS DIONYX will try to install it with Homebrew.")
      : toolingSupport.ffmpegInstallMethod === "winget"
        ? (appLanguage === "es"
            ? "Necesario para MP3, FLAC, OGG y WAV. En Windows DIONYX intentara instalarlo con winget."
            : "Required for MP3, FLAC, OGG and WAV. On Windows DIONYX will try to install it with winget.")
        : (appLanguage === "es"
            ? "Necesario para MP3, FLAC, OGG y WAV. Puede requerir instalacion manual en esta plataforma."
            : "Required for MP3, FLAC, OGG and WAV. It may need manual setup on this platform.");

  const page = (
      <section
        aria-labelledby="download-modal-title"
        className="app-page download-page"
      >
        <header className="app-page-header">
          <h1 className="app-page-title" id="download-modal-title">
            <Download aria-hidden="true" className="download-modal-icon ui-icon" size={24} strokeWidth={2.1} />
            {copy.downloadModalTitle}
          </h1>
        </header>

        <div className="download-layout">
        <div className="download-main">
        {toolsMissing ? (
          <div className="setup-screen">
            <p className="setup-screen-hint muted">
              {appLanguage === "es"
                ? "DIONYX necesita estas herramientas para descargar audio."
                : "DIONYX needs these tools to download audio."}
            </p>

            <div className="setup-tool-row">
              <span className={`setup-tool-status ${isYtdlpAvailable === null ? "checking" : isYtdlpAvailable ? "ok" : "missing"}`}>
                {isYtdlpAvailable === null ? "…" : isYtdlpAvailable ? "✓" : "✗"}
              </span>
              <div className="setup-tool-info">
                <div className="setup-tool-name-row">
                  <strong>yt-dlp</strong>
                  {isYtdlpAvailable ? (
                    <span className="setup-tool-version">{ytdlpVersion}</span>
                  ) : (
                    <button
                      className="setup-install-btn"
                      disabled={isInstallingYtdlp || isYtdlpAvailable === null}
                      onClick={onYtdlpInstall}
                      type="button"
                    >
                      {isInstallingYtdlp
                        ? (appLanguage === "es" ? "Instalando…" : "Installing…")
                        : (appLanguage === "es" ? "Instalar" : "Install")}
                    </button>
                  )}
                </div>
                {isInstallingYtdlp ? (
                  <div className="setup-progress-bar">
                    <div className="setup-progress-fill" style={{ width: `${ytdlpInstallProgress}%` }} />
                  </div>
                ) : ytdlpInstallError ? (
                  <p className="setup-tool-error">{ytdlpInstallError}</p>
                ) : !isYtdlpAvailable && isYtdlpAvailable !== null ? (
                  <p className="setup-tool-hint">
                    {ytdlpHint}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="setup-tool-row">
              <span className={`setup-tool-status ${isFfmpegAvailable === null ? "checking" : isFfmpegAvailable ? "ok" : "missing"}`}>
                {isFfmpegAvailable === null ? "…" : isFfmpegAvailable ? "✓" : "✗"}
              </span>
              <div className="setup-tool-info">
                <div className="setup-tool-name-row">
                  <strong>ffmpeg</strong>
                  {isFfmpegAvailable ? (
                    <span className="setup-tool-version">{ffmpegVersion}</span>
                  ) : (
                    <button
                      className="setup-install-btn"
                      disabled={isInstallingFfmpeg || isFfmpegAvailable === null}
                      onClick={onFfmpegInstall}
                      type="button"
                    >
                      {isInstallingFfmpeg
                        ? (appLanguage === "es" ? "Instalando…" : "Installing…")
                        : (appLanguage === "es" ? "Instalar" : "Install")}
                    </button>
                  )}
                </div>
                {isInstallingFfmpeg ? (
                  <div className="setup-progress-bar">
                    <div className="setup-progress-fill" style={{ width: `${ffmpegInstallProgress > 0 ? ffmpegInstallProgress : 30}%` }} />
                  </div>
                ) : ffmpegInstallError ? (
                  <p className="setup-tool-error">{ffmpegInstallError}</p>
                ) : !isFfmpegAvailable && isFfmpegAvailable !== null ? (
                  <p className="setup-tool-hint">
                    {ffmpegHint}
                  </p>
                ) : null}
              </div>
            </div>

            <button className="setup-recheck-btn" onClick={onRecheckDeps} type="button" style={{ alignSelf: "flex-start", marginTop: 4 }}>
              {appLanguage === "es" ? "↻ Comprobar de nuevo" : "↻ Check again"}
            </button>
          </div>
        ) : (
          <>
            <p className="muted download-modal-hint">{copy.downloadModalHint}</p>
            {!scannedPath ? (
              <p className="download-notice download-notice--warn">{copy.downloadNoFolder}</p>
            ) : null}

            <div className="download-input-row">
              <input
                className="download-url-input"
                disabled={!scannedPath || !isYtdlpAvailable}
                onChange={(e) => onDownloadUrlChange(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onAddDownload();
                }}
                placeholder={copy.downloadUrlPlaceholder}
                type="url"
                value={downloadUrl}
              />

              <div className="sort-control download-format-control" ref={downloadFormatMenuRef}>
                <button
                  aria-expanded={isDownloadFormatMenuOpen}
                  aria-haspopup="listbox"
                  className={`sort-trigger ${isDownloadFormatMenuOpen ? "open" : ""}`}
                  disabled={!scannedPath || !isYtdlpAvailable}
                  onClick={onDownloadFormatMenuToggle}
                  type="button"
                >
                  <span>{downloadFormat.toUpperCase()}</span>
                  <ChevronDown aria-hidden="true" className="sort-trigger-icon" strokeWidth={2.1} />
                </button>
                {isDownloadFormatMenuOpen ? (
                  <div className="sort-menu download-format-menu" role="listbox">
                    {AUDIO_FORMATS.map((fmt) => {
                      const isSelected = downloadFormat === fmt.id;
                      return (
                        <button
                          className={`sort-menu-item ${isSelected ? "selected" : ""}`}
                          key={fmt.id}
                          onClick={() => {
                            onDownloadFormatChange(fmt.id);
                          }}
                          role="option"
                          type="button"
                        >
                          <span>
                            {fmt.label}
                            {fmt.note ? (
                              <span className="download-format-note"> · {fmt.note}</span>
                            ) : null}
                          </span>
                          {isSelected ? (
                            <Check aria-hidden="true" className="sort-menu-check" strokeWidth={2.1} />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <button
                className="toolbar-button download-add-button"
                disabled={!downloadUrl.trim() || !scannedPath || !isYtdlpAvailable}
                onClick={onAddDownload}
                type="button"
              >
                {copy.downloadAddButton}
              </button>
            </div>

            {(isSearchingTracks || trackSearchResults) && (
              <div className="dl-search-results">
                <div className="dl-search-results-header">
                  <span className="dl-search-results-label">
                    {isSearchingTracks ? copy.downloadSearching : copy.downloadPickVersion}
                  </span>
                  {trackSearchResults && (
                    <button
                      className="dl-search-back"
                      onClick={onTrackSearchResultsClear}
                      type="button"
                    >
                      ← {copy.downloadBack}
                    </button>
                  )}
                </div>
                {isSearchingTracks ? (
                  <div className="dl-search-loading">
                    <span className="dl-search-spinner" />
                  </div>
                ) : (
                  trackSearchResults?.map((result) => (
                    <button
                      className="dl-search-result-item"
                      key={result.id}
                      onClick={() => onPickSearchResult(result)}
                      type="button"
                    >
                      <img
                        alt=""
                        className="dl-search-thumb"
                        src={`https://i.ytimg.com/vi/${result.id}/mqdefault.jpg`}
                      />
                      <div className="dl-search-result-info">
                        <span className="dl-search-result-title">{result.title}</span>
                        <span className="dl-search-result-meta">{result.channel}{result.duration ? ` · ${result.duration}` : ""}</span>
                      </div>
                      <Download aria-hidden="true" className="dl-search-result-icon ui-icon" size={15} strokeWidth={2} />
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="download-queue-section">
              <div className="download-queue-header">
                <span className="eyebrow">{copy.downloadQueueTitle}</span>
                {downloadQueue.some((it) => it.status === "done") ? (
                  <button
                    className="download-clear-button"
                    onClick={() =>
                      setDownloadQueue((q) => q.filter((it) => it.status !== "done"))
                    }
                    type="button"
                  >
                    {copy.downloadClearDone}
                  </button>
                ) : null}
              </div>

              {downloadQueue.length === 0 ? (
                <p className="muted download-queue-empty">{copy.downloadQueueEmpty}</p>
              ) : (
                <ul className="download-queue-list">
                  {downloadQueue.map((item) => (
                    <li className={`download-queue-item status-${item.status}`} key={item.id}>
                      <div className="download-queue-item-top">
                        <span className="download-item-title">{item.title}</span>
                        <span className="download-item-badge">
                          {item.status === "fetching" ? copy.downloadFetching
                            : item.status === "pending" ? copy.downloadPending
                            : item.status === "downloading"
                              ? `${Math.round(item.progress)}%`
                              : item.status === "done" ? copy.downloadDone
                                : copy.downloadError}
                        </span>
                      </div>
                      <div className="download-item-meta">
                        <span className="download-item-format">{item.format.toUpperCase()}</span>
                        {item.status === "downloading" && item.speed ? (
                          <span className="download-item-speed">
                            {item.speed}
                            {item.eta ? ` · ETA ${item.eta}` : ""}
                          </span>
                        ) : null}
                        {item.status === "error" && item.error ? (
                          <span className="download-item-error">{item.error}</span>
                        ) : null}
                      </div>
                      {item.status === "downloading" ? (
                        <div className="download-progress-bar">
                          <div
                            className="download-progress-fill"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        </div>

        <aside className="download-side">
          <section className="page-card page-card--compact" aria-labelledby="download-side-tools">
            <h2 className="page-card-title" id="download-side-tools">
              {appLanguage === "es" ? "Herramientas" : "Tools"}
            </h2>
            {[
              { name: "yt-dlp", available: isYtdlpAvailable, version: ytdlpVersion },
              { name: "ffmpeg", available: isFfmpegAvailable, version: ffmpegVersion },
            ].map((tool) => (
              <div className="download-side-row" key={tool.name}>
                <span className={`setup-tool-status ${tool.available === null ? "checking" : tool.available ? "ok" : "missing"}`}>
                  {tool.available === null ? "…" : tool.available ? "✓" : "✗"}
                </span>
                <span className="download-side-row-copy">
                  <strong>{tool.name}</strong>
                  <span>
                    {tool.available === null
                      ? (appLanguage === "es" ? "Comprobando…" : "Checking…")
                      : tool.available
                        ? (tool.version ?? (appLanguage === "es" ? "Instalado" : "Installed"))
                        : (appLanguage === "es" ? "No encontrado" : "Not found")}
                  </span>
                </span>
              </div>
            ))}
            <button className="setup-recheck-btn" onClick={onRecheckDeps} type="button">
              ↻ {appLanguage === "es" ? "Comprobar" : "Check"}
            </button>
          </section>

          <section className="page-card page-card--compact" aria-labelledby="download-side-folder">
            <h2 className="page-card-title" id="download-side-folder">
              {appLanguage === "es" ? "Dónde se guardan" : "Where files go"}
            </h2>
            <p className="download-side-path" title={scannedPath ?? undefined}>
              {scannedPath ?? copy.downloadNoFolder}
            </p>
            <p className="download-side-note">
              {appLanguage === "es"
                ? "Al terminar se vuelve a escanear la carpeta y las canciones aparecen en tu biblioteca."
                : "When a batch finishes the folder is rescanned and the songs appear in your library."}
            </p>
          </section>

          <section className="page-card page-card--compact" aria-labelledby="download-side-formats">
            <h2 className="page-card-title" id="download-side-formats">
              {appLanguage === "es" ? "Formatos" : "Formats"}
            </h2>
            <ul className="download-side-formats">
              {AUDIO_FORMATS.map((format) => (
                <li className={format.id === downloadFormat ? "selected" : undefined} key={format.id}>
                  <span className="download-item-format">{format.label}</span>
                  <span>
                    {format.note
                      ? (appLanguage === "es" ? "Necesita ffmpeg" : "Needs ffmpeg")
                      : (appLanguage === "es" ? "Directo, sin convertir" : "Direct, no conversion")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        </div>
      </section>
  );

  // Rendered as a page inside the main area (see AppMainStageHost).
  return shell.pageRoot ? createPortal(page, shell.pageRoot) : null;
}
