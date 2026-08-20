import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { type ChangeEvent, type RefObject, useEffect, useRef } from "react";
import { brandName, legacyStorageKeys, storageKeys, supportedAudioAccept } from "../app/constants";
import type { AppLanguage, LibraryScan, LibraryTrack, SavedPlaylist } from "../app/types";
import {
  findMatchingTrackIndex,
  isTauriRuntime,
  readStoredValue,
  reconcilePlaylistsWithLibrary,
  removeStoredValue,
  sanitizeTrack,
  trackFromBrowserFile,
  writeStoredValue,
} from "../app/utils";

type LibraryScanCopy = {
  defaultCollectionName: string;
  initialStatus: string;
};

type UseLibraryScanOptions = {
  activePlaylistId: string | null;
  appLanguage: AppLanguage;
  copy: LibraryScanCopy;
  collectionName: string;
  currentTrackIndex: number;
  emptyTrack: LibraryTrack;
  isPlaying: boolean;
  playbackPlaylistId: string | null;
  revokeBrowserSources: () => void;
  savedPlaylists: SavedPlaylist[];
  setActiveDuration: (value: number) => void;
  setActivePlaylistId: (value: string | null) => void;
  setCollectionName: (value: string) => void;
  setCurrentTrackIndex: (value: number) => void;
  setIsBannerVisible: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  setIsScanning: (value: boolean) => void;
  setPlaybackPlaylistId: (value: string | null) => void;
  setPlaybackTime: (value: number) => void;
  setScanError: (value: string | null) => void;
  setScannedPath: (value: string | null) => void;
  setSavedPlaylists: (
    value: SavedPlaylist[] | ((previousPlaylists: SavedPlaylist[]) => SavedPlaylist[]),
  ) => void;
  setTracks: (
    value: LibraryTrack[] | ((previousTracks: LibraryTrack[]) => LibraryTrack[]),
  ) => void;
  setStatusMessage: (value: string) => void;
  setUpdatedBrowserSources: (sources: string[]) => void;
  statusMessage: string;
  tracks: LibraryTrack[];
};

export function useLibraryScan({
  activePlaylistId,
  appLanguage,
  copy,
  collectionName,
  currentTrackIndex,
  emptyTrack,
  isPlaying,
  playbackPlaylistId,
  revokeBrowserSources,
  savedPlaylists,
  setActiveDuration,
  setActivePlaylistId,
  setCollectionName,
  setCurrentTrackIndex,
  setIsBannerVisible,
  setIsPlaying,
  setIsScanning,
  setPlaybackPlaylistId,
  setPlaybackTime,
  setScanError,
  setScannedPath,
  setSavedPlaylists,
  setTracks,
  setStatusMessage,
  setUpdatedBrowserSources,
  statusMessage,
  tracks,
}: UseLibraryScanOptions) {
  const scannedPathRef = useRef<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanFolderPathRef = useRef<
    (folderPath: string, mode?: "manual" | "restore", preservePlayback?: boolean) => Promise<void>
  >(async () => {});

  useEffect(() => {
    scannedPathRef.current = readStoredValue(storageKeys.lastFolderPath);
  }, []);

  function applyScanResult(result: LibraryScan, preservePlayback = false) {
    if (!isTauriRuntime()) {
      revokeBrowserSources();
      setUpdatedBrowserSources(
        result.tracks
          .map((track) => track.source)
          .filter((source): source is string => Boolean(source)),
      );
    }

    const sanitizedTracks = result.tracks.map(sanitizeTrack);
    const reconciledPlaylists = reconcilePlaylistsWithLibrary(savedPlaylists, sanitizedTracks);
    const nextActivePlaylist =
      activePlaylistId !== null
        ? reconciledPlaylists.find((playlist) => playlist.id === activePlaylistId) ?? null
        : null;
    const nextPlaybackPlaylist =
      playbackPlaylistId !== null
        ? reconciledPlaylists.find((playlist) => playlist.id === playbackPlaylistId) ?? null
        : null;
    const nextPlaybackTracks = nextPlaybackPlaylist ? nextPlaybackPlaylist.tracks : sanitizedTracks;
    const currentSelectedTrack = tracks[currentTrackIndex] ?? emptyTrack;
    const searchTrack =
      currentSelectedTrack.path || currentSelectedTrack.title !== emptyTrack.title
        ? currentSelectedTrack
        : (() => {
            const savedPath = readStoredValue(storageKeys.lastTrackPath);
            return savedPath ? { ...emptyTrack, path: savedPath } : null;
          })();
    const nextPlaybackIndex = searchTrack
      ? findMatchingTrackIndex(searchTrack, nextPlaybackTracks)
      : -1;

    setCollectionName(result.collectionName);
    setTracks(sanitizedTracks);
    setSavedPlaylists(reconciledPlaylists);
    setScannedPath(result.scannedPath);
    scannedPathRef.current = result.scannedPath;
    setActivePlaylistId(nextActivePlaylist?.id ?? null);
    setPlaybackPlaylistId(nextPlaybackPlaylist?.id ?? null);

    if (preservePlayback && nextPlaybackIndex >= 0) {
      if (nextPlaybackIndex !== currentTrackIndex) {
        setCurrentTrackIndex(nextPlaybackIndex);
      }
    } else {
      setCurrentTrackIndex(nextPlaybackIndex >= 0 ? nextPlaybackIndex : 0);
      setPlaybackTime(0);
      setActiveDuration(0);
      setIsPlaying(nextPlaybackIndex >= 0 ? isPlaying : false);
    }
  }

  async function scanFolderPath(
    folderPath: string,
    mode: "manual" | "restore" = "manual",
    preservePlayback = false,
  ) {
    const result = await invoke<LibraryScan>("scan_music_folder", {
      folderPath,
    });

    applyScanResult(result, preservePlayback);
    writeStoredValue(storageKeys.lastFolderPath, folderPath);
    setStatusMessage(
      result.trackCount > 0
        ? mode === "restore"
          ? appLanguage === "es"
            ? `Biblioteca restaurada con ${result.trackCount} archivos compatibles.`
            : `Library restored with ${result.trackCount} compatible files.`
          : appLanguage === "es"
            ? `Se cargaron ${result.trackCount} archivos compatibles desde tu carpeta.`
            : `${result.trackCount} compatible files were loaded from your folder.`
        : mode === "restore"
          ? appLanguage === "es"
            ? "Se restauro la carpeta, pero no encontre archivos de audio compatibles."
            : "The folder was restored, but I could not find compatible audio files."
          : appLanguage === "es"
            ? "No encontre archivos de audio compatibles en esa carpeta."
            : "I could not find compatible audio files in that folder.",
    );
  }

  function handleBrowserFolderSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setStatusMessage(
        appLanguage === "es"
          ? "No se selecciono ninguna carpeta."
          : "No folder was selected.",
      );
      return;
    }

    const relativeRoot =
      "webkitRelativePath" in files[0] && files[0].webkitRelativePath
        ? files[0].webkitRelativePath.split("/")[0]
        : collectionName || copy.defaultCollectionName;

    const browserTracks = files
      .filter((file) => {
        const extension = (file.name.split(".").pop() ?? "").toLowerCase();
        return supportedAudioAccept.includes(`.${extension}`);
      })
      .map((file) => trackFromBrowserFile(file, relativeRoot))
      .sort((left, right) => left.title.localeCompare(right.title));

    applyScanResult({
      collectionName: relativeRoot,
      scannedPath: relativeRoot,
      trackCount: browserTracks.length,
      tracks: browserTracks,
    });

    setStatusMessage(
      browserTracks.length > 0
        ? appLanguage === "es"
          ? `Se cargaron ${browserTracks.length} archivos desde el selector del navegador.`
          : `${browserTracks.length} files were loaded from the browser picker.`
        : appLanguage === "es"
          ? "La carpeta elegida no tenia formatos compatibles."
          : "The selected folder did not contain compatible formats.",
    );

    event.target.value = "";
  }

  async function handleScanFolder(directoryInputRef: RefObject<HTMLInputElement | null>) {
    setIsScanning(true);
    setScanError(null);
    setStatusMessage(
      appLanguage === "es"
        ? `Selecciona una carpeta con tu musica para que ${brandName} la lea.`
        : `Choose a folder with your music so ${brandName} can read it.`,
    );

    try {
      if (!isTauriRuntime()) {
        directoryInputRef.current?.click();
        return;
      }

      const selectedPath = await open({
        directory: true,
        multiple: false,
        title:
          appLanguage === "es" ? "Selecciona tu carpeta de musica" : "Select your music folder",
      });

      if (!selectedPath) {
        setStatusMessage(
          appLanguage === "es"
            ? "Escaneo cancelado. Tu biblioteca actual sigue intacta."
            : "Scan cancelled. Your current library is still intact.",
        );
        return;
      }

      const folderPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;

      if (!folderPath) {
        setStatusMessage(
          appLanguage === "es"
            ? "No se recibio una carpeta valida."
            : "No valid folder was received.",
        );
        return;
      }

      await scanFolderPath(folderPath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : appLanguage === "es"
            ? "No se pudo escanear la carpeta."
            : "The folder could not be scanned.";

      setScanError(message);
      setStatusMessage(
        appLanguage === "es"
          ? "El escaneo fallo. Revisa la carpeta e intentalo de nuevo."
          : "The scan failed. Check the folder and try again.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => {
    if (bannerTimerRef.current !== null) {
      clearTimeout(bannerTimerRef.current);
    }

    setIsBannerVisible(true);

    bannerTimerRef.current = setTimeout(() => {
      setIsBannerVisible(false);
      bannerTimerRef.current = null;
    }, 10000);

    return () => {
      if (bannerTimerRef.current !== null) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [statusMessage]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const lastFolderPath =
      readStoredValue(storageKeys.lastFolderPath) ??
      readStoredValue(legacyStorageKeys.lastFolderPath);

    if (!lastFolderPath) {
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setStatusMessage(
      appLanguage === "es"
        ? "Restaurando tu ultima biblioteca..."
        : "Restoring your last library...",
    );

    void scanFolderPath(lastFolderPath, "restore")
      .catch(() => {
        removeStoredValue(storageKeys.lastFolderPath);
        removeStoredValue(legacyStorageKeys.lastFolderPath);
        setScanError(
          appLanguage === "es"
            ? "No pude restaurar la carpeta anterior. Puedes volver a elegirla con Scan folders."
            : "I could not restore the previous folder. You can choose it again with Scan folders.",
        );
        setStatusMessage(
          appLanguage === "es"
            ? "No se pudo restaurar la biblioteca anterior."
            : "I could not restore the previous library.",
        );
      })
      .finally(() => {
        setIsScanning(false);
      });
  }, []);

  scanFolderPathRef.current = scanFolderPath;

  return {
    handleBrowserFolderSelection,
    handleScanFolder,
    scanFolderPathRef,
    scannedPathRef,
  };
}
