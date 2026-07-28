import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_PATH = "/models/hand_landmarker.task";

/**
 * Loads the MediaPipe Hands task once and keeps it for the component lifetime.
 * Detection itself stays on this device — only the numbers we derive from a
 * frame are ever sent anywhere.
 */
export function useHandLandmarker() {
  const landmarkerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let created = null;

    async function load() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
        created = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.7,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) {
          created.close();
          return;
        }

        landmarkerRef.current = created;
        setReady(true);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause
              : new Error("Failed to load the hand detection model.")
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  return { landmarkerRef, ready, error };
}
