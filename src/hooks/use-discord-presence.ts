import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RefObject } from "react";
import type { AppLanguage } from "../app/types";
import { isTauriRuntime } from "../app/utils";

/** Backend error meaning "Discord is not open": normal, never shown. */
const DISCORD_NOT_RUNNING = "discord-not-running";

type UseDiscordPresenceOptions = {
  activeDuration: number;
  appLanguage: AppLanguage;
  audioRef: RefObject<HTMLAudioElement | null>;
  getItunesCover: (query: string, entity: "musicArtist" | "song") => Promise<string | null>;
  isPlaying: boolean;
  selectedTrackArtist: string;
  selectedTrackTitle: string;
  setStatusMessage: (value: string) => void;
};

export function useDiscordPresence({
  activeDuration,
  appLanguage,
  audioRef,
  getItunesCover,
  isPlaying,
  selectedTrackArtist,
  selectedTrackTitle,
  setStatusMessage,
}: UseDiscordPresenceOptions) {
  const discordCoverUrlRef = useRef<string | null>(null);
  const discordGenRef = useRef(0);
  const discordLastTrackKeyRef = useRef("");
  const lastReportedErrorRef = useRef<string | null>(null);
  const [seekTick, setSeekTick] = useState(0);
  // Whole seconds: the element's duration arrives after loadedmetadata, so the
  // presence is re-sent with the real end time of *this* track.
  const durationSeconds = activeDuration > 0 && Number.isFinite(activeDuration) ? Math.round(activeDuration) : 0;

  // Seeking moves the elapsed/remaining time shown in Discord.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !isTauriRuntime()) {
      return;
    }

    const handleSeeked = () => setSeekTick((tick) => tick + 1);
    audio.addEventListener("seeked", handleSeeked);

    return () => {
      audio.removeEventListener("seeked", handleSeeked);
    };
  }, [audioRef]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    const trackKey = `${selectedTrackArtist}|${selectedTrackTitle}`;
    const gen = ++discordGenRef.current;
    const delay = !isPlaying ? 0 : 800;

    const reportResult = (error: unknown) => {
      const message = typeof error === "string" ? error : error instanceof Error ? error.message : "";

      if (!message || message === DISCORD_NOT_RUNNING) {
        lastReportedErrorRef.current = null;
        return;
      }

      // Show each distinct rejection once, not on every track change.
      if (message !== lastReportedErrorRef.current) {
        lastReportedErrorRef.current = message;
        setStatusMessage(
          appLanguage === "es"
            ? `Discord rechazo la presencia: ${message}`
            : `Discord rejected the presence: ${message}`,
        );
      }
    };

    const timer = setTimeout(async () => {
      if (!selectedTrackTitle && !selectedTrackArtist) {
        discordCoverUrlRef.current = null;
        discordLastTrackKeyRef.current = "";
        void invoke("clear_discord_presence").catch(() => {});
        return;
      }

      if (!isPlaying) {
        try {
          await invoke("clear_discord_presence");
        } catch {}
        return;
      }

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
          elapsedSecs: audioRef.current?.currentTime ?? 0,
          durationSecs: durationSeconds,
          isPlaying: true,
        });
        lastReportedErrorRef.current = null;
      } catch (error) {
        if (gen === discordGenRef.current) {
          reportResult(error);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackTitle, selectedTrackArtist, isPlaying, durationSeconds, seekTick]);
}
