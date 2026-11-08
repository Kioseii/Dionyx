import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime, removeStoredValue, writeStoredValue } from "../app/utils";
import { legacyStorageKeys, storageKeys } from "../app/constants";

type UsePersistenceSyncOptions = {
  equalizerValues: number[];
  hideOnTray: boolean;
  isEqualizerEnabled: boolean;
  selectedEqualizerPresetId: string;
  selectedTrackPath: string;
  volume: number;
};

export function usePersistenceSync({
  equalizerValues,
  hideOnTray,
  isEqualizerEnabled,
  selectedEqualizerPresetId,
  selectedTrackPath,
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

  // The track that is actually current (library or playlist).
  useEffect(() => {
    if (selectedTrackPath) {
      writeStoredValue(storageKeys.lastTrackPath, selectedTrackPath);
    }
  }, [selectedTrackPath]);

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
