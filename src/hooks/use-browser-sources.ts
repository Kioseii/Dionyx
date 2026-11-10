import { useRef } from "react";

/**
 * Object URLs of the files picked in browser mode (no Tauri). They are
 * revoked when a new folder replaces them. There is deliberately no revoke on
 * unmount: in dev, StrictMode runs effect cleanups an extra time while the
 * app stays mounted, which revoked URLs still in use (songs failed with a
 * format error). The page's own unload frees them anyway.
 */
export function useBrowserSources() {
  const browserSourceUrlsRef = useRef<string[]>([]);

  function revokeBrowserSources() {
    browserSourceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    browserSourceUrlsRef.current = [];
  }

  function setUpdatedBrowserSources(sources: string[]) {
    browserSourceUrlsRef.current = sources;
  }

  return {
    revokeBrowserSources,
    setUpdatedBrowserSources,
  };
}
