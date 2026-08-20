import type { ComponentProps } from "react";
import type { AppMainStageHostProps } from "../components/layout/AppMainStageHost";
import { DiscoverPanel } from "../components/discover/DiscoverPanel";
import { LibraryPanel } from "../components/library/LibraryPanel";
import { LibraryStatusBanner } from "../components/layout/LibraryStatusBanner";
import { TopBar } from "../components/layout/TopBar";
import { DetailPanel } from "../components/player/DetailPanel";

type TopBarProps = ComponentProps<typeof TopBar>;
type LibraryStatusBannerProps = ComponentProps<typeof LibraryStatusBanner>;
type DiscoverPanelProps = ComponentProps<typeof DiscoverPanel>;
type LibraryPanelProps = ComponentProps<typeof LibraryPanel>;
type DetailPanelProps = ComponentProps<typeof DetailPanel>;

type SharedCopy =
  & TopBarProps["copy"]
  & LibraryStatusBannerProps["copy"]
  & DiscoverPanelProps["copy"]
  & LibraryPanelProps["copy"]
  & DetailPanelProps["copy"];

type UseMainStagePropsOptions = {
  copy: SharedCopy;
  detailPanelProps: Omit<DetailPanelProps, "copy">;
  discoverPanelProps: Omit<DiscoverPanelProps, "copy">;
  isDiscoverView: boolean;
  libraryPanelProps: Omit<LibraryPanelProps, "copy">;
  libraryStatusBannerProps: Omit<LibraryStatusBannerProps, "copy">;
  topBarProps: Omit<TopBarProps, "copy">;
};

export function useMainStageProps({
  copy,
  detailPanelProps,
  discoverPanelProps,
  isDiscoverView,
  libraryPanelProps,
  libraryStatusBannerProps,
  topBarProps,
}: UseMainStagePropsOptions): AppMainStageHostProps {
  return {
    detailPanelProps: {
      copy,
      ...detailPanelProps,
    },
    discoverPanelProps: {
      copy,
      ...discoverPanelProps,
    },
    isDiscoverView,
    libraryPanelProps: {
      copy,
      ...libraryPanelProps,
    },
    libraryStatusBannerProps: {
      copy,
      ...libraryStatusBannerProps,
    },
    topBarProps: {
      copy,
      ...topBarProps,
    },
  };
}
