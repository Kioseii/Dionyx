import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { LibraryTrack } from "../app/types";
import { isTauriRuntime, removeStoredValue, writeStoredValue } from "../app/utils";
import { legacyStorageKeys, storageKeys } from "../app/constants";

type UsePersistenceSyncOptions = {
  currentTrackIndex: number;
  equalizerValues: number[];
  hideOnTray: boolean;
  isEqualizerEnabled: boolean;
  selectedEqualizerPresetId: string;
  tracks: LibraryTrack[];
  volume: number;
};

export function usePersistenceSync({
  currentTrackIndex,
  equalizerValues,
  hideOnTray,
  isEqualizerEnabled,
  selectedEqualizerPresetId,
  tracks,
  volume,
}: UsePersistenceSyncOptions) {
  useEffect(() => {
    if (isTauriRuntime()) {
      void invoke("set_hide_on_tray", { enabled: hideOnTray });
    }
  }, [hideOnTray]);

  useEffect(() => {
    writeStoredValue(storageKeys.hideOnTray, String(hideOnTray));
  }, [hideOnTray]);

  useEffect(() => {
    writeStoredValue(storageKeys.volume, String(volume));
    removeStoredValue(legacyStorageKeys.volume);
  }, [volume]);

  useEffect(() => {
    const path = tracks[currentTrackIndex]?.path;

    if (path) {
      writeStoredValue(storageKeys.lastTrackPath, path);
    }
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    writeStoredValue(storageKeys.equalizerEnabled, String(isEqualizerEnabled));
  }, [isEqualizerEnabled]);

  useEffect(() => {
    writeStoredValue(storageKeys.equalizerValues, JSON.stringify(equalizerValues));
  }, [equalizerValues]);

  useEffect(() => {
    writeStoredValue(storageKeys.equalizerPresetId, selectedEqualizerPresetId);
  }, [selectedEqualizerPresetId]);
}
