import { brandName } from "../app/constants";
import { useAppHostPropsStack } from "./use-app-host-props-stack";

type HostStackOptions = Parameters<typeof useAppHostPropsStack>[0];
type SidebarOptions = HostStackOptions["sidebarPropsOptions"];

type UseSidebarHostOptionsInput = {
  activePlaylistId: SidebarOptions["sidebarProps"]["activePlaylistId"];
  isDiscoverView: SidebarOptions["sidebarProps"]["isDiscoverView"];
  logoMarkup: SidebarOptions["sidebarProps"]["logoMarkup"];
  onCreatePlaylist: SidebarOptions["sidebarProps"]["onCreatePlaylist"];
  onDeletePlaylist: SidebarOptions["sidebarProps"]["onDeletePlaylist"];
  onOpenDiscover: SidebarOptions["sidebarProps"]["onOpenDiscover"];
  onOpenLibrary: SidebarOptions["sidebarProps"]["onOpenLibrary"];
  onOpenPlaylistEditor: SidebarOptions["sidebarProps"]["onOpenPlaylistEditor"];
  onOpenPlaylistRename: SidebarOptions["sidebarProps"]["onOpenPlaylistRename"];
  onPlayPlaylistShuffled: SidebarOptions["sidebarProps"]["onPlayPlaylistShuffled"];
  onPlaylistMenuToggle: SidebarOptions["sidebarProps"]["onPlaylistMenuToggle"];
  onSelectPlaylist: SidebarOptions["sidebarProps"]["onSelectPlaylist"];
  openPlaylistMenuId: SidebarOptions["sidebarProps"]["openPlaylistMenuId"];
  savedPlaylists: SidebarOptions["sidebarProps"]["savedPlaylists"];
  sidebarOpen: SidebarOptions["sidebarProps"]["sidebarOpen"];
  copy: SidebarOptions["copy"];
};

export function useSidebarHostOptions({
  activePlaylistId,
  copy,
  isDiscoverView,
  logoMarkup,
  onCreatePlaylist,
  onDeletePlaylist,
  onOpenDiscover,
  onOpenLibrary,
  onOpenPlaylistEditor,
  onOpenPlaylistRename,
  onPlayPlaylistShuffled,
  onPlaylistMenuToggle,
  onSelectPlaylist,
  openPlaylistMenuId,
  savedPlaylists,
  sidebarOpen,
}: UseSidebarHostOptionsInput): SidebarOptions {
  return {
    copy,
    sidebarProps: {
      activePlaylistId,
      brandName,
      isDiscoverView,
      logoMarkup,
      onCreatePlaylist,
      onDeletePlaylist,
      onOpenDiscover,
      onOpenLibrary,
      onOpenPlaylistEditor,
      onOpenPlaylistRename,
      onPlayPlaylistShuffled,
      onPlaylistMenuToggle,
      onSelectPlaylist,
      openPlaylistMenuId,
      savedPlaylists,
      sidebarOpen,
    },
  };
}
