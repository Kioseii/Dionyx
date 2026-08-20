import type { ComponentProps } from "react";
import type { AppModalsHostProps } from "../components/modals/AppModalsHost";
import {
  EditMetadataModal,
  EqualizerModal,
  PersonalizationModal,
} from "../components/modals/AppModals";
import { DownloadModal } from "../components/modals/DownloadModal";
import {
  PlaylistModal,
  RenamePlaylistModal,
  TrackPlaylistModal,
} from "../components/modals/PlaylistModals";

type DownloadModalProps = ComponentProps<typeof DownloadModal>;
type EditMetadataModalProps = ComponentProps<typeof EditMetadataModal>;
type EqualizerModalProps = ComponentProps<typeof EqualizerModal>;
type PersonalizationModalProps = ComponentProps<typeof PersonalizationModal>;
type PlaylistModalProps = ComponentProps<typeof PlaylistModal>;
type RenamePlaylistModalProps = ComponentProps<typeof RenamePlaylistModal>;
type TrackPlaylistModalProps = ComponentProps<typeof TrackPlaylistModal>;

type SharedCopy =
  & DownloadModalProps["copy"]
  & EditMetadataModalProps["copy"]
  & EqualizerModalProps["copy"]
  & PersonalizationModalProps["copy"]
  & PlaylistModalProps["copy"];

type ToolsCopy = PersonalizationModalProps["toolsCopy"];

type UseAppModalPropsOptions = {
  copy: SharedCopy;
  downloadModalProps: Omit<DownloadModalProps, "copy">;
  editMetadataModalProps: Omit<EditMetadataModalProps, "copy">;
  equalizerModalProps: Omit<EqualizerModalProps, "copy">;
  personalizationModalProps: Omit<PersonalizationModalProps, "copy" | "toolsCopy">;
  playlistModalProps: Omit<PlaylistModalProps, "copy">;
  renamePlaylistModalProps: Omit<RenamePlaylistModalProps, "copy">;
  toolsCopy: ToolsCopy;
  trackPlaylistModalProps: Omit<TrackPlaylistModalProps, "copy">;
};

export function useAppModalProps({
  copy,
  downloadModalProps,
  editMetadataModalProps,
  equalizerModalProps,
  personalizationModalProps,
  playlistModalProps,
  renamePlaylistModalProps,
  toolsCopy,
  trackPlaylistModalProps,
}: UseAppModalPropsOptions): AppModalsHostProps {
  return {
    downloadModalProps: {
      copy,
      ...downloadModalProps,
    },
    editMetadataModalProps: {
      copy,
      ...editMetadataModalProps,
    },
    equalizerModalProps: {
      copy,
      ...equalizerModalProps,
    },
    personalizationModalProps: {
      copy,
      toolsCopy,
      ...personalizationModalProps,
    },
    playlistModalProps: {
      copy,
      ...playlistModalProps,
    },
    renamePlaylistModalProps: {
      copy,
      ...renamePlaylistModalProps,
    },
    trackPlaylistModalProps: {
      copy,
      ...trackPlaylistModalProps,
    },
  };
}
