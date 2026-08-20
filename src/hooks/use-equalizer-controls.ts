import { useEffect } from "react";
import { equalizerPresets } from "../app/constants";

type UseEqualizerControlsOptions = {
  canUseEqualizerOnResolvedSource: (source: string | null) => boolean;
  ensureEqualizerGraph: () => Promise<boolean>;
  isEqualizerEnabled: boolean;
  resolvedTrackSource: string | null;
  setEqualizerValues: (value: number[] | ((currentValue: number[]) => number[])) => void;
  setIsEqualizerEnabled: (value: boolean) => void;
  setIsEqualizerPresetMenuOpen: (value: boolean) => void;
  setSelectedEqualizerPresetId: (value: string) => void;
  setStatusMessage: (value: string) => void;
  unavailableMessage: string;
};

export function useEqualizerControls({
  canUseEqualizerOnResolvedSource,
  ensureEqualizerGraph,
  isEqualizerEnabled,
  resolvedTrackSource,
  setEqualizerValues,
  setIsEqualizerEnabled,
  setIsEqualizerPresetMenuOpen,
  setSelectedEqualizerPresetId,
  setStatusMessage,
  unavailableMessage,
}: UseEqualizerControlsOptions) {
  useEffect(() => {
    if (!isEqualizerEnabled || !canUseEqualizerOnResolvedSource(resolvedTrackSource)) {
      return;
    }

    void ensureEqualizerGraph().then((graphReady) => {
      if (!graphReady) {
        setIsEqualizerEnabled(false);
        setStatusMessage(unavailableMessage);
      }
    });
  }, [
    canUseEqualizerOnResolvedSource,
    ensureEqualizerGraph,
    isEqualizerEnabled,
    resolvedTrackSource,
    setIsEqualizerEnabled,
    setStatusMessage,
    unavailableMessage,
  ]);

  async function updateEqualizerBand(index: number, nextValue: number) {
    if (isEqualizerEnabled && canUseEqualizerOnResolvedSource(resolvedTrackSource)) {
      const graphReady = await ensureEqualizerGraph();

      if (!graphReady) {
        setStatusMessage(unavailableMessage);
        return;
      }
    }

    setEqualizerValues((currentValue) =>
      currentValue.map((bandValue, bandIndex) => (bandIndex === index ? nextValue : bandValue)),
    );
    setSelectedEqualizerPresetId("custom");
  }

  async function applyEqualizerPreset(presetId: string) {
    const preset = equalizerPresets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    if (isEqualizerEnabled && canUseEqualizerOnResolvedSource(resolvedTrackSource)) {
      const graphReady = await ensureEqualizerGraph();

      if (!graphReady) {
        setStatusMessage(unavailableMessage);
        return;
      }
    }

    setEqualizerValues([...preset.values]);
    setSelectedEqualizerPresetId(preset.id);
    setIsEqualizerPresetMenuOpen(false);
  }

  async function handleEqualizerToggle(nextEnabled: boolean) {
    if (!nextEnabled) {
      setIsEqualizerEnabled(false);
      return;
    }

    setIsEqualizerEnabled(true);
  }

  return {
    applyEqualizerPreset,
    handleEqualizerToggle,
    updateEqualizerBand,
  };
}
