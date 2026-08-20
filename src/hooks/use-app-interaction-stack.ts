import { useAppAsyncActions } from "./use-app-async-actions";
import { useEqualizerModalActions } from "./use-equalizer-modal-actions";
import { usePlaylistModalHandlers } from "./use-playlist-modal-handlers";

type UseAppInteractionStackOptions = {
  appAsyncActionsOptions: Parameters<typeof useAppAsyncActions>[0];
  equalizerModalActionsOptions: Parameters<typeof useEqualizerModalActions>[0];
  playlistModalHandlersOptions: Parameters<typeof usePlaylistModalHandlers>[0];
};

export function useAppInteractionStack({
  appAsyncActionsOptions,
  equalizerModalActionsOptions,
  playlistModalHandlersOptions,
}: UseAppInteractionStackOptions) {
  const playlistModalHandlers = usePlaylistModalHandlers(playlistModalHandlersOptions);
  const equalizerModalActions = useEqualizerModalActions(equalizerModalActionsOptions);
  const appAsyncActions = useAppAsyncActions(appAsyncActionsOptions);

  return {
    ...playlistModalHandlers,
    ...equalizerModalActions,
    ...appAsyncActions,
  };
}
