import type { ComponentProps } from "react";
import {
  EditMetadataModal,
  EqualizerModal,
  PersonalizationModal,
} from "./AppModals";
import { DownloadModal } from "./DownloadModal";
import {
  PlaylistModal,
  RenamePlaylistModal,
  TrackPlaylistModal,
} from "./PlaylistModals";

export type AppModalsHostProps = {
  downloadModalProps: ComponentProps<typeof DownloadModal>;
  editMetadataModalProps: ComponentProps<typeof EditMetadataModal>;
  equalizerModalProps: ComponentProps<typeof EqualizerModal>;
  personalizationModalProps: ComponentProps<typeof PersonalizationModal>;
  playlistModalProps: ComponentProps<typeof PlaylistModal>;
  renamePlaylistModalProps: ComponentProps<typeof RenamePlaylistModal>;
  trackPlaylistModalProps: ComponentProps<typeof TrackPlaylistModal>;
};

export function AppModalsHost({
  downloadModalProps,
  editMetadataModalProps,
  equalizerModalProps,
  personalizationModalProps,
  playlistModalProps,
  renamePlaylistModalProps,
  trackPlaylistModalProps,
}: AppModalsHostProps) {
  return (
    <>
      <PlaylistModal {...playlistModalProps} />
      <TrackPlaylistModal {...trackPlaylistModalProps} />
      <EditMetadataModal {...editMetadataModalProps} />
      <RenamePlaylistModal {...renamePlaylistModalProps} />
      <DownloadModal {...downloadModalProps} />
      <EqualizerModal {...equalizerModalProps} />
      <PersonalizationModal {...personalizationModalProps} />
    </>
  );
}
