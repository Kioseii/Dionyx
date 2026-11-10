import { UpdateNotice } from "./UpdateNotice";
import type { ComponentProps } from "react";
import { DiscoverPanel } from "../discover/DiscoverPanel";
import { LibraryPanel } from "../library/LibraryPanel";
import { DetailPanel } from "../player/DetailPanel";
import { LibraryStatusBanner } from "./LibraryStatusBanner";
import { HomePage } from "../pages/HomePage";
import { useShell } from "./ShellContext";
import { TopBar } from "./TopBar";

export type AppMainStageHostProps = {
  detailPanelProps: ComponentProps<typeof DetailPanel>;
  discoverPanelProps: ComponentProps<typeof DiscoverPanel>;
  isDiscoverView: boolean;
  libraryPanelProps: ComponentProps<typeof LibraryPanel>;
  libraryStatusBannerProps: ComponentProps<typeof LibraryStatusBanner>;
  topBarProps: ComponentProps<typeof TopBar>;
};

export function AppMainStageHost({
  detailPanelProps,
  discoverPanelProps,
  isDiscoverView,
  libraryPanelProps,
  libraryStatusBannerProps,
  topBarProps,
}: AppMainStageHostProps) {
  const { activePage, detailPanelOpen, onPageRootChange } = useShell();

  return (
    <section className="main-stage">
      <TopBar {...topBarProps} />

      <UpdateNotice />

      <LibraryStatusBanner {...libraryStatusBannerProps} />

      {/* Pages (Home, Downloads, Appearance, Settings) render here; the
          download and personalization screens arrive through portals. */}
      {activePage ? (
        <div className="shell-page-root" ref={onPageRootChange}>
          {activePage === "home" ? <HomePage /> : null}
        </div>
      ) : null}

      {isDiscoverView && !activePage ? <DiscoverPanel {...discoverPanelProps} /> : null}

      <section
        className={`content-grid${detailPanelOpen ? "" : " content-grid--no-detail"}`}
        style={isDiscoverView || activePage ? { display: "none" } : undefined}
      >
        <LibraryPanel {...libraryPanelProps} />
        {detailPanelOpen ? <DetailPanel {...detailPanelProps} /> : null}
      </section>
    </section>
  );
}
