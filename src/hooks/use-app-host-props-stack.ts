import { useAppModalProps } from "./use-app-modal-props";
import { useMainStageProps } from "./use-main-stage-props";
import { usePlayerChromeProps } from "./use-player-chrome-props";
import { useSidebarProps } from "./use-sidebar-props";

type UseAppHostPropsStackOptions = {
  appModalPropsOptions: Parameters<typeof useAppModalProps>[0];
  mainStagePropsOptions: Parameters<typeof useMainStageProps>[0];
  playerChromePropsOptions: Parameters<typeof usePlayerChromeProps>[0];
  sidebarPropsOptions: Parameters<typeof useSidebarProps>[0];
};

export function useAppHostPropsStack({
  appModalPropsOptions,
  mainStagePropsOptions,
  playerChromePropsOptions,
  sidebarPropsOptions,
}: UseAppHostPropsStackOptions) {
  const appModalsHostProps = useAppModalProps(appModalPropsOptions);
  const sidebarProps = useSidebarProps(sidebarPropsOptions);
  const { audioNodesProps, miniPlayerOverlayProps, playerBarProps } =
    usePlayerChromeProps(playerChromePropsOptions);
  const mainStageProps = useMainStageProps(mainStagePropsOptions);

  return {
    appModalsHostProps,
    audioNodesProps,
    mainStageProps,
    miniPlayerOverlayProps,
    playerBarProps,
    sidebarProps,
  };
}
