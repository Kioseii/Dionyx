import { useMiniPlayerDrag } from "./use-mini-player-drag";
import { usePlayerVisualState } from "./use-player-visual-state";
import { useWindowState } from "./use-window-state";

type UsePlayerShellStackOptions = {
  playerVisualStateOptions: Parameters<typeof usePlayerVisualState>[0];
  windowStateOptions: Parameters<typeof useWindowState>[0];
};

export function usePlayerShellStack({
  playerVisualStateOptions,
  windowStateOptions,
}: UsePlayerShellStackOptions) {
  const playerVisualState = usePlayerVisualState(playerVisualStateOptions);
  const windowState = useWindowState(windowStateOptions);
  const { handleMiniPlayerMouseDown } = useMiniPlayerDrag();

  return {
    ...playerVisualState,
    ...windowState,
    handleMiniPlayerMouseDown,
  };
}
