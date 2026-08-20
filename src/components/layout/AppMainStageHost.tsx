import type { ComponentProps } from "react";
import { DiscoverPanel } from "../discover/DiscoverPanel";
import { LibraryPanel } from "../library/LibraryPanel";
import { DetailPanel } from "../player/DetailPanel";
import { LibraryStatusBanner } from "./LibraryStatusBanner";
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
  return (
    <section className="main-stage">
      <TopBar {...topBarProps} />

      <LibraryStatusBanner {...libraryStatusBannerProps} />

      {isDiscoverView ? <DiscoverPanel {...discoverPanelProps} /> : null}

      <section className="content-grid" style={isDiscoverView ? { display: "none" } : undefined}>
        <LibraryPanel {...libraryPanelProps} />
        <DetailPanel {...detailPanelProps} />
      </section>
    </section>
  );
}
