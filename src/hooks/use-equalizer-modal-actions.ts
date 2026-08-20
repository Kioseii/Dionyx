type UseEqualizerModalActionsOptions = {
  applyEqualizerPreset: (presetId: string) => Promise<void> | void;
  handleEqualizerToggle: (nextEnabled: boolean) => Promise<void> | void;
  setIsEqualizerModalOpen: (value: boolean) => void;
  setIsEqualizerPresetMenuOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  updateEqualizerBand: (index: number, nextValue: number) => Promise<void> | void;
};

export function useEqualizerModalActions({
  applyEqualizerPreset,
  handleEqualizerToggle,
  setIsEqualizerModalOpen,
  setIsEqualizerPresetMenuOpen,
  updateEqualizerBand,
}: UseEqualizerModalActionsOptions) {
  function handleOpenEqualizerModal() {
    setIsEqualizerModalOpen(true);
  }

  function handleCloseEqualizerModal() {
    setIsEqualizerPresetMenuOpen(false);
    setIsEqualizerModalOpen(false);
  }

  function handleEqualizerPresetMenuClose() {
    setIsEqualizerPresetMenuOpen(false);
  }

  function handleEqualizerPresetMenuToggle() {
    setIsEqualizerPresetMenuOpen((currentValue) => !currentValue);
  }

  function handleEqualizerPresetSelect(presetId: string) {
    void applyEqualizerPreset(presetId);
  }

  function handleEqualizerBandChange(index: number, nextValue: number) {
    void updateEqualizerBand(index, nextValue);
  }

  function handleEqualizerEnabledChange(nextEnabled: boolean) {
    void handleEqualizerToggle(nextEnabled);
  }

  return {
    handleCloseEqualizerModal,
    handleEqualizerBandChange,
    handleEqualizerEnabledChange,
    handleEqualizerPresetMenuClose,
    handleEqualizerPresetMenuToggle,
    handleEqualizerPresetSelect,
    handleOpenEqualizerModal,
  };
}
