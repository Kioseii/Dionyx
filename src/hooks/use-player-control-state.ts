import { useState } from "react";
import {
  legacyStorageKeys,
  storageKeys,
} from "../app/constants";
import {
  readStoredValue,
  sanitizeEqualizerEnabled,
  sanitizeEqualizerPresetId,
  sanitizeEqualizerValues,
} from "../app/utils";

export function usePlayerControlState() {
  const [equalizerValues, setEqualizerValues] = useState<number[]>(() =>
    sanitizeEqualizerValues(readStoredValue(storageKeys.equalizerValues)),
  );
  const [isEqualizerEnabled, setIsEqualizerEnabled] = useState(() =>
    sanitizeEqualizerEnabled(readStoredValue(storageKeys.equalizerEnabled)),
  );
  const [selectedEqualizerPresetId, setSelectedEqualizerPresetId] = useState(() =>
    sanitizeEqualizerPresetId(readStoredValue(storageKeys.equalizerPresetId)),
  );
  const [volume, setVolume] = useState(() => {
    const storedVolume = Number(
      readStoredValue(storageKeys.volume) ?? readStoredValue(legacyStorageKeys.volume),
    );

    return Number.isFinite(storedVolume) ? Math.min(Math.max(storedVolume, 0), 1) : 0.72;
  });
  const [isEqualizerModalOpen, setIsEqualizerModalOpen] = useState(false);
  const [isEqualizerPresetMenuOpen, setIsEqualizerPresetMenuOpen] = useState(false);

  return {
    equalizerValues,
    isEqualizerEnabled,
    isEqualizerModalOpen,
    isEqualizerPresetMenuOpen,
    selectedEqualizerPresetId,
    setEqualizerValues,
    setIsEqualizerEnabled,
    setIsEqualizerModalOpen,
    setIsEqualizerPresetMenuOpen,
    setSelectedEqualizerPresetId,
    setVolume,
    volume,
  };
}
