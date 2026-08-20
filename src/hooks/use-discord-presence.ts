import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RefObject } from "react";
import { isTauriRuntime } from "../app/utils";

type UseDiscordPresenceOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  getItunesCover: (query: string, entity: "musicArtist" | "song") => Promise<string | null>;
  isPlaying: boolean;
  selectedTrackArtist: string;
  selectedTrackTitle: string;
};

export function useDiscordPresence({
  audioRef,
  getItunesCover,
  isPlaying,
  selectedTrackArtist,
  selectedTrackTitle,
}: UseDiscordPresenceOptions) {
  const discordCoverUrlRef = useRef<string | null>(null);
  const discordGenRef = useRef(0);
  const discordLastTrackKeyRef = useRef("");

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const trackKey = `${selectedTrackArtist}|${selectedTrackTitle}`;
    const gen = ++discordGenRef.current;
    const delay = !isPlaying ? 0 : 800;

    const timer = setTimeout(async () => {
      if (!selectedTrackTitle && !selectedTrackArtist) {
        discordCoverUrlRef.current = null;
        discordLastTrackKeyRef.current = "";
        void invoke("clear_discord_presence").catch(() => {});
        return;
      }

      const audio = audioRef.current;
      const currentElapsed = audio?.currentTime ?? 0;
      const currentDuration = Number.isFinite(audio?.duration ?? 0) ? (audio?.duration ?? 0) : 0;

      if (!isPlaying) {
        try {
          await invoke("clear_discord_presence");
        } catch {}
        return;
      }

      void (async () => {
        try {
          if (trackKey !== discordLastTrackKeyRef.current) {
            discordLastTrackKeyRef.current = trackKey;
            discordCoverUrlRef.current =
              (await getItunesCover(`${selectedTrackArtist} ${selectedTrackTitle}`, "song").catch(
                () => "",
              )) || null;
          }

          if (gen !== discordGenRef.current) {
            return;
          }

          await invoke("update_discord_presence", {
            title: selectedTrackTitle || "Unknown",
            artist: selectedTrackArtist || "Unknown",
            coverUrl: discordCoverUrlRef.current,
            elapsedSecs: audio?.currentTime ?? currentElapsed,
            durationSecs: currentDuration,
            isPlaying: true,
          });
        } catch {}
      })();
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackTitle, selectedTrackArtist, isPlaying]);
}
