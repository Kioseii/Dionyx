import { useEffect, useState } from "react";
import { defaultThemeColor, storageKeys } from "../app/constants";
import type { AppLanguage, LibrarySortKey, PersonalizationView } from "../app/types";
import type { DetailPanelTab } from "../components/layout/ShellContext";
import {
  readStoredValue,
  sanitizeAppLanguage,
  sanitizeFontPresetId,
  sanitizeHexColor,
  sanitizeLibrarySortKey,
  writeStoredValue,
} from "../app/utils";
import { sanitizeCrossfadeSeconds } from "../app/transitions";
import { sanitizeNormalizationMode, sanitizePreampDb, type NormalizationMode } from "../app/normalization";

export function useAppPreferences() {
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() =>
    sanitizeAppLanguage(readStoredValue(storageKeys.language)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    readStoredValue(storageKeys.sidebarOpen) !== "false",
  );
  const [hideOnTray, setHideOnTray] = useState(() =>
    readStoredValue(storageKeys.hideOnTray) === "true",
  );
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(() =>
    sanitizeHexColor(readStoredValue(storageKeys.themeColor)),
  );
  const [gapless, setGapless] = useState(() => readStoredValue(storageKeys.gapless) === "true");
  const [normalizationMode, setNormalizationMode] = useState<NormalizationMode>(() =>
    sanitizeNormalizationMode(readStoredValue(storageKeys.normalization)),
  );
  const [normalizationPreamp, setNormalizationPreamp] = useState(() =>
    sanitizePreampDb(readStoredValue(storageKeys.normalizationPreamp) ?? 0),
  );
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(() =>
    sanitizeCrossfadeSeconds(readStoredValue(storageKeys.crossfadeSeconds) ?? 0),
  );
  const [accentFromArtwork, setAccentFromArtwork] = useState(() =>
    readStoredValue(storageKeys.accentFromArtwork) === "true",
  );
  const [themeHexDraft, setThemeHexDraft] = useState(() =>
    sanitizeHexColor(readStoredValue(storageKeys.themeColor)),
  );
  const [personalizationView, setPersonalizationView] = useState<PersonalizationView>("theme");
  const [fontPresetId, setFontPresetId] = useState(() =>
    sanitizeFontPresetId(readStoredValue(storageKeys.fontPreset)),
  );
  const [librarySortKey, setLibrarySortKey] = useState<LibrarySortKey>(() =>
    sanitizeLibrarySortKey(readStoredValue(storageKeys.librarySort)),
  );
  const [isLibrarySortMenuOpen, setIsLibrarySortMenuOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(() =>
    readStoredValue(storageKeys.detailPanelOpen) !== "false",
  );
  const [detailPanelTab, setDetailPanelTab] = useState<DetailPanelTab>(() => {
    const stored = readStoredValue(storageKeys.detailPanelTab);
    return stored === "lyrics" || stored === "queue" ? stored : "now";
  });

  useEffect(() => {
    writeStoredValue(storageKeys.detailPanelOpen, String(detailPanelOpen));
  }, [detailPanelOpen]);

  useEffect(() => {
    writeStoredValue(storageKeys.detailPanelTab, detailPanelTab);
  }, [detailPanelTab]);

  useEffect(() => {
    writeStoredValue(storageKeys.themeColor, themeColor || defaultThemeColor);
  }, [themeColor]);

  useEffect(() => {
    writeStoredValue(storageKeys.gapless, String(gapless));
  }, [gapless]);

  useEffect(() => {
    writeStoredValue(storageKeys.normalization, normalizationMode);
    writeStoredValue(storageKeys.normalizationPreamp, String(normalizationPreamp));
  }, [normalizationMode, normalizationPreamp]);

  useEffect(() => {
    writeStoredValue(storageKeys.crossfadeSeconds, String(crossfadeSeconds));
  }, [crossfadeSeconds]);

  useEffect(() => {
    writeStoredValue(storageKeys.accentFromArtwork, String(accentFromArtwork));
  }, [accentFromArtwork]);

  useEffect(() => {
    writeStoredValue(storageKeys.fontPreset, fontPresetId);
  }, [fontPresetId]);

  useEffect(() => {
    writeStoredValue(storageKeys.librarySort, librarySortKey);
  }, [librarySortKey]);

  useEffect(() => {
    writeStoredValue(storageKeys.language, appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    writeStoredValue(storageKeys.sidebarOpen, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    writeStoredValue(storageKeys.hideOnTray, String(hideOnTray));
  }, [hideOnTray]);

  return {
    accentFromArtwork,
    crossfadeSeconds,
    gapless,
    normalizationMode,
    normalizationPreamp,
    setCrossfadeSeconds,
    setGapless,
    setNormalizationMode,
    setNormalizationPreamp,
    appLanguage,
    detailPanelOpen,
    detailPanelTab,
    setDetailPanelOpen,
    setDetailPanelTab,
    fontPresetId,
    hideOnTray,
    isLibrarySortMenuOpen,
    isThemeModalOpen,
    librarySortKey,
    personalizationView,
    setAccentFromArtwork,
    setAppLanguage,
    setFontPresetId,
    setHideOnTray,
    setIsLibrarySortMenuOpen,
    setIsThemeModalOpen,
    setLibrarySortKey,
    setPersonalizationView,
    setSidebarOpen,
    setThemeColor,
    setThemeHexDraft,
    sidebarOpen,
    themeColor,
    themeHexDraft,
  };
}
