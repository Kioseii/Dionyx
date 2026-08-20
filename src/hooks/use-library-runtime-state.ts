import { useState } from "react";
import type { LibraryTrack } from "../app/types";

type UseLibraryRuntimeStateOptions = {
  defaultCollectionName: string;
  initialStatus: string;
};

export function useLibraryRuntimeState({
  defaultCollectionName,
  initialStatus,
}: UseLibraryRuntimeStateOptions) {
  const [collectionName, setCollectionName] = useState<string>(() => defaultCollectionName);
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [scannedPath, setScannedPath] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(() => initialStatus);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [activeDuration, setActiveDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  return {
    activeDuration,
    collectionName,
    currentTrackIndex,
    isBannerVisible,
    isPlaying,
    isScanning,
    playbackTime,
    scanError,
    scannedPath,
    searchQuery,
    setActiveDuration,
    setCollectionName,
    setCurrentTrackIndex,
    setIsBannerVisible,
    setIsPlaying,
    setIsScanning,
    setPlaybackTime,
    setScanError,
    setScannedPath,
    setSearchQuery,
    setStatusMessage,
    setTracks,
    statusMessage,
    tracks,
  };
}
