import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { defaultEqualizerValues, equalizerFrequencies } from "../app/constants";

type UseEqualizerOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  equalizerValues: number[];
  isEqualizerEnabled: boolean;
};

export function useEqualizer({
  audioRef,
  equalizerValues,
  isEqualizerEnabled,
}: UseEqualizerOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const equalizerNodesRef = useRef<BiquadFilterNode[]>([]);
  const audioContextConstructor =
    typeof window !== "undefined"
      ? window.AudioContext ??
        (
          window as Window &
            typeof globalThis & {
              webkitAudioContext?: typeof AudioContext;
            }
        ).webkitAudioContext
      : undefined;
  const isEqualizerSupported = Boolean(audioContextConstructor);

  function canUseEqualizerOnResolvedSource(source: string | null) {
    return typeof source === "string" && source.startsWith("blob:");
  }

  async function resetEqualizerGraph() {
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Ignore close errors and rebuild on demand.
      }
    }

    audioContextRef.current = null;
    audioSourceNodeRef.current = null;
    equalizerNodesRef.current = [];
  }

  function applyEqualizerGainsToNodes() {
    if (equalizerNodesRef.current.length !== equalizerFrequencies.length) {
      return;
    }

    const appliedGains = isEqualizerEnabled ? equalizerValues : defaultEqualizerValues;

    equalizerNodesRef.current.forEach((node, index) => {
      node.gain.value = appliedGains[index] ?? 0;
    });
  }

  async function ensureEqualizerGraph() {
    const audio = audioRef.current;

    if (!audio || !audioContextConstructor) {
      return false;
    }

    try {
      if (audioContextRef.current?.state === "closed") {
        audioContextRef.current = null;
        audioSourceNodeRef.current = null;
        equalizerNodesRef.current = [];
      }

      if (!audioContextRef.current) {
        const context = new audioContextConstructor();
        const sourceNode = context.createMediaElementSource(audio);
        const filterNodes = equalizerFrequencies.map((frequency, index) => {
          const filterNode = context.createBiquadFilter();

          filterNode.type =
            index === 0
              ? "lowshelf"
              : index === equalizerFrequencies.length - 1
                ? "highshelf"
                : "peaking";
          filterNode.frequency.value = frequency;
          filterNode.Q.value =
            index === 0 || index === equalizerFrequencies.length - 1 ? 0.7 : 1.41;
          filterNode.gain.value = (isEqualizerEnabled ? equalizerValues[index] : 0) ?? 0;

          return filterNode;
        });

        let previousNode: AudioNode = sourceNode;
        filterNodes.forEach((node) => {
          previousNode.connect(node);
          previousNode = node;
        });
        previousNode.connect(context.destination);

        audioContextRef.current = context;
        audioSourceNodeRef.current = sourceNode;
        equalizerNodesRef.current = filterNodes;
      }

      applyEqualizerGainsToNodes();

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    applyEqualizerGainsToNodes();
  }, [equalizerValues, isEqualizerEnabled]);

  return {
    audioContextRef,
    canUseEqualizerOnResolvedSource,
    ensureEqualizerGraph,
    isEqualizerSupported,
    resetEqualizerGraph,
  };
}
