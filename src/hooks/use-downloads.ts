import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ask } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import { storageKeys } from "../app/constants";
import type {
  AppLanguage,
  AudioDownloadFormat,
  DownloadItem,
  DownloadStatus,
  TrackSearchResult,
  ToolingSupport,
} from "../app/types";
import {
  generateId,
  isTauriRuntime,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from "../app/utils";

type DownloadCopy = {
  downloadFetching: string;
};

type UseDownloadsOptions = {
  appLanguage: AppLanguage;
  copy: DownloadCopy;
  onBatchFinished: (folderPath: string) => Promise<void> | void;
  scannedPath: string | null;
  setStatusMessage: (value: string) => void;
};

const defaultToolingSupport: ToolingSupport = {
  platform: "unknown",
  ffmpegInstallMethod: "manual",
  ytdlpInstallMethod: "manual",
  supportsAutomaticFfmpegInstall: false,
  supportsAutomaticYtdlpInstall: false,
};

export function useDownloads({
  appLanguage,
  copy,
  onBatchFinished,
  scannedPath,
  setStatusMessage,
}: UseDownloadsOptions) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<AudioDownloadFormat>("mp3");
  const [isDownloadFormatMenuOpen, setIsDownloadFormatMenuOpen] = useState(false);
  const [downloadQueue, setDownloadQueue] = useState<DownloadItem[]>([]);
  const toolsAlreadyConfirmed = readStoredValue(storageKeys.toolsReady) === "true";
  const [isYtdlpAvailable, setIsYtdlpAvailable] = useState<boolean | null>(toolsAlreadyConfirmed ? true : null);
  const [ytdlpVersion, setYtdlpVersion] = useState<string | null>(null);
  const [isFfmpegAvailable, setIsFfmpegAvailable] = useState<boolean | null>(toolsAlreadyConfirmed ? true : null);
  const [ffmpegVersion, setFfmpegVersion] = useState<string | null>(null);
  const [isInstallingYtdlp, setIsInstallingYtdlp] = useState(false);
  const [isInstallingFfmpeg, setIsInstallingFfmpeg] = useState(false);
  const [ytdlpInstallProgress, setYtdlpInstallProgress] = useState(0);
  const [ffmpegInstallProgress, setFfmpegInstallProgress] = useState(0);
  const [ytdlpInstallError, setYtdlpInstallError] = useState<string | null>(null);
  const [ffmpegInstallError, setFfmpegInstallError] = useState<string | null>(null);
  const [toolingSupport, setToolingSupport] = useState<ToolingSupport>(defaultToolingSupport);
  const [hasLoadedToolingSupport, setHasLoadedToolingSupport] = useState(!isTauriRuntime());
  const [hasRequestedInitialToolsCheck, setHasRequestedInitialToolsCheck] = useState(toolsAlreadyConfirmed);
  const [hasShownMissingToolsHint, setHasShownMissingToolsHint] = useState(false);
  const [trackSearchResults, setTrackSearchResults] = useState<TrackSearchResult[] | null>(null);
  const [isSearchingTracks, setIsSearchingTracks] = useState(false);
  const downloadFormatMenuRef = useRef<HTMLDivElement | null>(null);
  const scannedPathRef = useRef<string | null>(scannedPath);
  const onBatchFinishedRef = useRef(onBatchFinished);

  const hadActiveDownloadsRef = useRef(false);
  const hasCompletedDownloadInBatchRef = useRef(false);

  scannedPathRef.current = scannedPath;
  onBatchFinishedRef.current = onBatchFinished;

  // Rescan once per batch: when the queue goes from "something active" to
  // "nothing active" and at least one download finished successfully. Derived
  // from committed state, so it also fires when the last item of a batch fails.
  useEffect(() => {
    const hasActiveDownloads = downloadQueue.some(
      (item) =>
        item.status === "pending" ||
        item.status === "downloading" ||
        item.status === "fetching",
    );

    if (hadActiveDownloadsRef.current && !hasActiveDownloads && hasCompletedDownloadInBatchRef.current) {
      hasCompletedDownloadInBatchRef.current = false;
      const currentPath = scannedPathRef.current;

      if (currentPath) {
        void onBatchFinishedRef.current(currentPath);
      }
    }

    hadActiveDownloadsRef.current = hasActiveDownloads;
  }, [downloadQueue]);

  function openDownloadModal() {
    setIsDownloadModalOpen(true);
  }

  function openDownloadModalWithQuery(query: string) {
    setIsDownloadModalOpen(true);
    setDownloadUrl(query);
  }

  function closeDownloadModal() {
    setIsDownloadFormatMenuOpen(false);
    setIsDownloadModalOpen(false);
    setTrackSearchResults(null);
  }

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    invoke<ToolingSupport>("get_tooling_support")
      .then((support) => {
        setToolingSupport(support);
      })
      .catch(() => {
        setToolingSupport(defaultToolingSupport);
      })
      .finally(() => {
        setHasLoadedToolingSupport(true);
      });
  }, []);

  function checkYtdlp() {
    invoke<string>("check_ytdlp")
      .then((version) => {
        setIsYtdlpAvailable(true);
        setYtdlpVersion(version);
      })
      .catch(() => {
        setIsYtdlpAvailable(false);
      });
  }

  function recheckDeps() {
    removeStoredValue(storageKeys.toolsReady);
    setIsYtdlpAvailable(null);
    setIsFfmpegAvailable(null);
    setYtdlpVersion(null);
    setFfmpegVersion(null);
    checkYtdlp();
    invoke<string>("check_ffmpeg")
      .then((version) => {
        setIsFfmpegAvailable(true);
        setFfmpegVersion(version);
      })
      .catch(() => {
        setIsFfmpegAvailable(false);
      });
  }

  useEffect(() => {
    if (isYtdlpAvailable === true && isFfmpegAvailable === true) {
      writeStoredValue(storageKeys.toolsReady, "true");
    }
  }, [isFfmpegAvailable, isYtdlpAvailable]);

  async function runInstallYtdlp() {
    setIsInstallingYtdlp(true);
    setYtdlpInstallProgress(0);
    setYtdlpInstallError(null);
    return invoke("install_ytdlp").catch((error: unknown) => {
      setIsInstallingYtdlp(false);
      setYtdlpInstallError(String(error));
      throw error;
    });
  }

  function startInstallYtdlp() {
    // Verify the freshly installed binary actually runs (only yt-dlp, so a stale
    // PATH does not flip an already-detected ffmpeg back to "missing").
    void runInstallYtdlp()
      .then(() => checkYtdlp())
      .catch(() => {});
  }

  async function runInstallFfmpeg() {
    setIsInstallingFfmpeg(true);
    setFfmpegInstallProgress(0);
    setFfmpegInstallError(null);
    return invoke("install_ffmpeg").catch((error: unknown) => {
      setIsInstallingFfmpeg(false);
      setFfmpegInstallError(String(error));
      throw error;
    });
  }

  async function startInstallFfmpeg() {
    if (toolingSupport.ffmpegInstallMethod === "winget" || toolingSupport.ffmpegInstallMethod === "homebrew") {
      const manager = toolingSupport.ffmpegInstallMethod === "winget" ? "winget" : "Homebrew";
      const confirmed = await ask(
        appLanguage === "es"
          ? `DIONYX instalara ffmpeg en tu sistema usando ${manager}${manager === "winget" ? " y aceptara los acuerdos del paquete Gyan.FFmpeg" : ""}. ¿Continuar?`
          : `DIONYX will install ffmpeg on your system using ${manager}${manager === "winget" ? " and accept the Gyan.FFmpeg package agreements" : ""}. Continue?`,
        { kind: "warning", title: "ffmpeg" },
      ).catch(() => false);

      if (!confirmed) {
        return;
      }
    }

    // No recheck here: on Windows the running process keeps its old PATH, so a
    // fresh check right after winget would wrongly report ffmpeg as missing.
    await runInstallFfmpeg().catch(() => {});
  }

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    if (readStoredValue(storageKeys.toolsReady) === "true") {
      return;
    }

    if (hasRequestedInitialToolsCheck) {
      return;
    }

    setHasRequestedInitialToolsCheck(true);
    recheckDeps();
  }, [hasRequestedInitialToolsCheck]);

  // Tools are never installed without an explicit click: on first launch we only
  // tell the user what is missing and where to install it.
  useEffect(() => {
    if (!hasLoadedToolingSupport || !hasRequestedInitialToolsCheck || hasShownMissingToolsHint) {
      return;
    }

    if (isYtdlpAvailable === null || isFfmpegAvailable === null) {
      return;
    }

    if (isYtdlpAvailable === true && isFfmpegAvailable === true) {
      return;
    }

    setHasShownMissingToolsHint(true);
    setStatusMessage(
      appLanguage === "es"
        ? "Faltan herramientas para descargar audio (yt-dlp o ffmpeg). Puedes instalarlas desde Descargas."
        : "Some tools for audio downloads are missing (yt-dlp or ffmpeg). You can install them from Downloads.",
    );
  }, [
    appLanguage,
    hasLoadedToolingSupport,
    hasRequestedInitialToolsCheck,
    hasShownMissingToolsHint,
    isFfmpegAvailable,
    isYtdlpAvailable,
  ]);

  useEffect(() => {
    if (!isDownloadModalOpen) {
      return;
    }

    if (readStoredValue(storageKeys.toolsReady) === "true") {
      return;
    }

    if (isYtdlpAvailable !== null) {
      return;
    }

    recheckDeps();
  }, [isDownloadModalOpen, isYtdlpAvailable]);

  useEffect(() => {
    type ProgressPayload = { downloadId: string; percent: number; speed: string; eta: string };
    type DonePayload = { downloadId: string };
    type FailedPayload = { downloadId: string; message: string };
    type ToolProgressPayload = { tool: string; percent: number };
    type ToolDonePayload = { tool: string };
    type ToolFailedPayload = { tool: string; message: string };

    const unlistenProgress = listen<ProgressPayload>("download-progress", (event) => {
      setDownloadQueue((queue) =>
        queue.map((item) =>
          item.id === event.payload.downloadId
            ? {
                ...item,
                status: "downloading" as DownloadStatus,
                progress: event.payload.percent,
                speed: event.payload.speed,
                eta: event.payload.eta,
              }
            : item,
        ),
      );
    });

    const unlistenDone = listen<DonePayload>("download-done", (event) => {
      hasCompletedDownloadInBatchRef.current = true;
      setDownloadQueue((queue) =>
        queue.map((item) =>
          item.id === event.payload.downloadId
            ? { ...item, status: "done" as DownloadStatus, progress: 100 }
            : item,
        ),
      );
    });

    const unlistenFailed = listen<FailedPayload>("download-failed", (event) => {
      setDownloadQueue((queue) =>
        queue.map((item) =>
          item.id === event.payload.downloadId
            ? { ...item, status: "error" as DownloadStatus, error: event.payload.message }
            : item,
        ),
      );
    });

    const unlistenToolProgress = listen<ToolProgressPayload>("tool-progress", (event) => {
      if (event.payload.tool === "ytdlp") {
        setYtdlpInstallProgress(event.payload.percent);
      }
      if (event.payload.tool === "ffmpeg") {
        setFfmpegInstallProgress(event.payload.percent);
      }
    });

    const unlistenToolDone = listen<ToolDonePayload>("tool-done", (event) => {
      if (event.payload.tool === "ytdlp") {
        setIsInstallingYtdlp(false);
        setYtdlpInstallProgress(100);
        setIsYtdlpAvailable(true);
      }
      if (event.payload.tool === "ffmpeg") {
        setIsInstallingFfmpeg(false);
        setFfmpegInstallProgress(100);
        setIsFfmpegAvailable(true);
      }
    });

    const unlistenToolFailed = listen<ToolFailedPayload>("tool-failed", (event) => {
      if (event.payload.tool === "ytdlp") {
        setIsInstallingYtdlp(false);
        setYtdlpInstallError(event.payload.message);
      }
      if (event.payload.tool === "ffmpeg") {
        setIsInstallingFfmpeg(false);
        setFfmpegInstallError(event.payload.message);
      }
    });

    return () => {
      void unlistenProgress.then((fn) => fn());
      void unlistenDone.then((fn) => fn());
      void unlistenFailed.then((fn) => fn());
      void unlistenToolProgress.then((fn) => fn());
      void unlistenToolDone.then((fn) => fn());
      void unlistenToolFailed.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (!isDownloadFormatMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        downloadFormatMenuRef.current &&
        event.target instanceof Node &&
        !downloadFormatMenuRef.current.contains(event.target)
      ) {
        setIsDownloadFormatMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDownloadFormatMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isDownloadFormatMenuOpen]);

  async function handleAddDownload(resolvedUrl?: string) {
    const url = (resolvedUrl ?? downloadUrl).trim();

    if (!url || !scannedPath) {
      return;
    }

    const isUrl = url.startsWith("http://") || url.startsWith("https://");
    if (!isUrl && !resolvedUrl) {
      setIsSearchingTracks(true);
      try {
        const results = await invoke<TrackSearchResult[]>("search_tracks", { query: url });
        setTrackSearchResults(results.length > 0 ? results : null);
      } catch {
        setTrackSearchResults(null);
      } finally {
        setIsSearchingTracks(false);
      }
      return;
    }

    const id = generateId();
    const item: DownloadItem = {
      id,
      url,
      title: copy.downloadFetching,
      format: downloadFormat,
      status: "fetching",
      progress: 0,
      speed: "",
      eta: "",
    };

    setDownloadQueue((queue) => [item, ...queue]);
    setDownloadUrl("");
    setTrackSearchResults(null);

    try {
      const title = await invoke<string>("get_video_info", { url });
      setDownloadQueue((queue) =>
        queue.map((entry) =>
          entry.id === id ? { ...entry, title, status: "pending" as DownloadStatus } : entry,
        ),
      );

      await invoke("download_audio", {
        downloadId: id,
        url,
        format: downloadFormat,
        outputDir: scannedPath,
      });
    } catch (error) {
      setDownloadQueue((queue) =>
        queue.map((entry) =>
          entry.id === id
            ? { ...entry, status: "error" as DownloadStatus, error: String(error) }
            : entry,
        ),
      );
    }
  }

  function handlePickSearchResult(result: TrackSearchResult) {
    const musicUrl = `https://music.youtube.com/watch?v=${result.id}`;
    void handleAddDownload(musicUrl);
  }

  return {
    closeDownloadModal,
    downloadFormat,
    downloadFormatMenuRef,
    downloadQueue,
    downloadUrl,
    ffmpegInstallError,
    ffmpegInstallProgress,
    ffmpegVersion,
    handleAddDownload,
    handlePickSearchResult,
    isDownloadFormatMenuOpen,
    isDownloadModalOpen,
    isFfmpegAvailable,
    isInstallingFfmpeg,
    isInstallingYtdlp,
    isSearchingTracks,
    isYtdlpAvailable,
    openDownloadModal,
    openDownloadModalWithQuery,
    recheckDeps,
    setDownloadFormat: (format: AudioDownloadFormat) => {
      setDownloadFormat(format);
      setIsDownloadFormatMenuOpen(false);
    },
    setDownloadQueue,
    setDownloadUrl,
    setIsDownloadFormatMenuOpen,
    setTrackSearchResults,
    startInstallFfmpeg,
    startInstallYtdlp,
    trackSearchResults,
    toolingSupport,
    ytdlpInstallError,
    ytdlpInstallProgress,
    ytdlpVersion,
  };
}
