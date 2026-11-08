import { createContext, useContext } from "react";
import type { AppLanguage } from "../../app/types";
import type { uiText } from "../../app/ui";

export type DetailPanelTab = "now" | "lyrics" | "queue";

/**
 * State and actions of the app "shell" (sidebar shortcuts, right panel,
 * notices) that several distant components share. Kept in a context so these
 * cross-cutting values do not have to travel through every props builder.
 */
export type ShellContextValue = {
  activeDownloadCount: number;
  collectionName: string;
  copy: (typeof uiText)[AppLanguage];
  detailPanelOpen: boolean;
  detailPanelTab: DetailPanelTab;
  isNoticeVisible: boolean;
  isScanning: boolean;
  libraryTrackCount: number;
  onDismissNotice: () => void;
  onEnterMiniMode: () => void;
  onOpenAppearance: () => void;
  onOpenDownloads: () => void;
  onOpenEqualizer: () => void;
  onOpenSettings: () => void;
  onScanFolder: () => void;
  /** Opens the right panel on `tab`; if it already shows that tab, hides it. */
  onShowDetailPanel: (tab: DetailPanelTab) => void;
  onToggleDetailPanel: () => void;
  scannedPath: string | null;
  statusMessage: string;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export const ShellProvider = ShellContext.Provider;

export function useShell() {
  const value = useContext(ShellContext);

  if (!value) {
    throw new Error("useShell must be used inside <ShellProvider>");
  }

  return value;
}
