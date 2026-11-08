import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { defaultEqualizerValues, equalizerFrequencies } from "../app/constants";

type UseEqualizerOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  equalizerValues: number[];
  isEqualizerEnabled: boolean;
};

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (
    window.AudioContext ??
    (window as Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  );
}

/**
 * Web Audio graph for the 10-band equalizer.
 *
 * An <audio> element can be attached to a MediaElementAudioSourceNode only
 * once in its lifetime, and once attached its sound only comes out through
 * that graph. So the graph is built lazily the first time the EQ is needed and
 * then kept for the lifetime of the element: disabling the EQ sets every band
 * to 0 dB instead of tearing the graph down (tearing it down left the element
 * silent and made re-enabling fail with InvalidStateError).
 *
 * All returned functions are stable across renders.
 */
export function useEqualizer({
  audioRef,
  equalizerValues,
  isEqualizerEnabled,
}: UseEqualizerOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const equalizerNodesRef = useRef<BiquadFilterNode[]>([]);
  const gainsRef = useRef({ equalizerValues, isEqualizerEnabled });
  gainsRef.current = { equalizerValues, isEqualizerEnabled };

  const isEqualizerSupported = Boolean(getAudioContextConstructor());

  const applyEqualizerGainsToNodes = useCallback(() => {
    if (equalizerNodesRef.current.length !== equalizerFrequencies.length) {
      return;
    }

    const { equalizerValues: values, isEqualizerEnabled: enabled } = gainsRef.current;
    const appliedGains = enabled ? values : defaultEqualizerValues;

    equalizerNodesRef.current.forEach((node, index) => {
      node.gain.value = appliedGains[index] ?? 0;
    });
  }, []);

  const hasEqualizerGraph = useCallback(() => audioSourceNodeRef.current !== null, []);

  // Extra elements (the crossfade "tail") already routed into the graph.
  const extraSourcesRef = useRef(new WeakSet<HTMLMediaElement>());

  /**
   * Routes another element (the end of the previous song during a crossfade)
   * through the same equalizer, so both sound alike. Without a graph both
   * elements play directly and nothing needs doing. Like the main element, an
   * element can be attached only once, which the WeakSet tracks.
   */
  const attachElementToEqualizer = useCallback(async (element: HTMLMediaElement) => {
    const context = audioContextRef.current;
    const firstFilter = equalizerNodesRef.current[0];

    if (!context || !firstFilter || !audioSourceNodeRef.current) {
      // No graph: the main element plays directly too, so this one matches it.
      return true;
    }

    try {
      if (!extraSourcesRef.current.has(element)) {
        context.createMediaElementSource(element).connect(firstFilter);
        extraSourcesRef.current.add(element);
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const ensureEqualizerGraph = useCallback(async () => {
    const audio = audioRef.current;
    const AudioContextCtor = getAudioContextConstructor();

    if (!audio || !AudioContextCtor) {
      return false;
    }

    try {
      if (!audioContextRef.current) {
        if (audioSourceNodeRef.current) {
          // The element is already bound to a previous context; it cannot be
          // re-bound. Should not happen since the graph is never closed.
          return false;
        }

        const context = new AudioContextCtor();
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
  }, [applyEqualizerGainsToNodes, audioRef]);

  /** Keeps an existing graph's context running (required for any sound). */
  const resumeEqualizerGraph = useCallback(async () => {
    if (!audioSourceNodeRef.current) {
      return true;
    }

    return ensureEqualizerGraph();
  }, [ensureEqualizerGraph]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    applyEqualizerGainsToNodes();
  }, [applyEqualizerGainsToNodes, equalizerValues, isEqualizerEnabled]);

  return {
    attachElementToEqualizer,
    ensureEqualizerGraph,
    hasEqualizerGraph,
    isEqualizerSupported,
    resumeEqualizerGraph,
  };
}
