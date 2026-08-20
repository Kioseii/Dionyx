import { useEffect, useRef } from "react";

export function useBrowserSources() {
  const browserSourceUrlsRef = useRef<string[]>([]);

  function revokeBrowserSources() {
    browserSourceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    browserSourceUrlsRef.current = [];
  }

  function setUpdatedBrowserSources(sources: string[]) {
    browserSourceUrlsRef.current = sources;
  }

  useEffect(() => {
    return () => {
      revokeBrowserSources();
    };
  }, []);

  return {
    revokeBrowserSources,
    setUpdatedBrowserSources,
  };
}
