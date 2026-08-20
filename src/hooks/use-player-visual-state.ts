import { Repeat, Repeat1, Volume1, Volume2, VolumeX } from "lucide-react";
import type { RepeatMode } from "../app/types";
import { getEqualizerPresetLabel } from "../app/utils";
import { buildThemeStyle, getFontPresetById } from "../app/utils";

type UsePlayerVisualStateOptions = {
  appLanguage: "en" | "es";
  equalizerCustomPresetLabel: string;
  fontPresetId: string;
  repeatMode: RepeatMode;
  selectedEqualizerPresetId: string;
  themeColor: string;
  volume: number;
};

export function usePlayerVisualState({
  appLanguage,
  equalizerCustomPresetLabel,
  fontPresetId,
  repeatMode,
  selectedEqualizerPresetId,
  themeColor,
  volume,
}: UsePlayerVisualStateOptions) {
  const VolumeIcon = volume <= 0.001 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const activeFontPreset = getFontPresetById(fontPresetId);
  const themeStyle = buildThemeStyle(themeColor, activeFontPreset);
  const selectedEqualizerPresetLabel =
    selectedEqualizerPresetId === "custom"
      ? equalizerCustomPresetLabel
      : getEqualizerPresetLabel(selectedEqualizerPresetId, appLanguage);

  return {
    RepeatIcon,
    VolumeIcon,
    selectedEqualizerPresetLabel,
    themeStyle,
  };
}
