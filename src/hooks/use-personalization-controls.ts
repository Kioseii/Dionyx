import {
  defaultFontPresetId,
  defaultThemeColor,
} from "../app/constants";
import type { AppLanguage, PersonalizationView } from "../app/types";
import { sanitizeHexColor, sanitizeHexDraft } from "../app/utils";
import { uiText } from "../app/ui";

type UsePersonalizationControlsOptions = {
  isFfmpegAvailable: boolean | null;
  isYtdlpAvailable: boolean | null;
  personalizationView: PersonalizationView;
  recheckDeps: () => void;
  setAppLanguage: (value: AppLanguage) => void;
  setFontPresetId: (value: string) => void;
  setIsThemeModalOpen: (value: boolean) => void;
  setPersonalizationView: (value: PersonalizationView) => void;
  setStatusMessage: (value: string) => void;
  setThemeColor: (value: string) => void;
  setThemeHexDraft: (value: string) => void;
  themeColor: string;
};

export function usePersonalizationControls({
  isFfmpegAvailable,
  isYtdlpAvailable,
  personalizationView,
  recheckDeps,
  setAppLanguage,
  setFontPresetId,
  setIsThemeModalOpen,
  setPersonalizationView,
  setStatusMessage,
  setThemeColor,
  setThemeHexDraft,
  themeColor,
}: UsePersonalizationControlsOptions) {
  function handleClosePersonalization() {
    setIsThemeModalOpen(false);
  }

  function handleDonePersonalization() {
    setIsThemeModalOpen(false);
  }

  function handleLanguageChange(language: AppLanguage) {
    setAppLanguage(language);
    setStatusMessage(uiText[language].languageChanged);
  }

  function handleOpenSettingsTab() {
    setPersonalizationView("settings");

    if (isYtdlpAvailable === null || isFfmpegAvailable === null) {
      recheckDeps();
    }
  }

  function handleResetPersonalization() {
    if (personalizationView === "theme") {
      setThemeColor(defaultThemeColor);
      setThemeHexDraft(defaultThemeColor);
      return;
    }

    if (personalizationView === "settings") {
      setAppLanguage("es");
      setStatusMessage(uiText.es.languageChanged);
      return;
    }

    setFontPresetId(defaultFontPresetId);
  }

  function handleThemeColorChange(value: string) {
    const nextColor = sanitizeHexColor(value);
    setThemeColor(nextColor);
    setThemeHexDraft(nextColor);
  }

  function handleThemeHexBlur() {
    setThemeHexDraft(themeColor);
  }

  function handleThemeHexDraftChange(value: string) {
    const nextDraft = sanitizeHexDraft(value);
    setThemeHexDraft(nextDraft);

    if (/^#[0-9a-fA-F]{6}$/.test(nextDraft)) {
      setThemeColor(nextDraft);
    }
  }

  return {
    handleClosePersonalization,
    handleDonePersonalization,
    handleLanguageChange,
    handleOpenSettingsTab,
    handleResetPersonalization,
    handleThemeColorChange,
    handleThemeHexBlur,
    handleThemeHexDraftChange,
  };
}
