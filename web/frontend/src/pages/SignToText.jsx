import { useCallback, useEffect, useRef, useState } from "react";
import Notice from "../components/Notice";
import { useHandLandmarker } from "../lib/useHandLandmarker";
import { landmarksToFlat, normalizeHand } from "../lib/normalize";
import { drawHand } from "../lib/handSkeleton";
import { API_BASE, API_CONFIGURED, fetchHealth, predict } from "../lib/api";

// Matches WINDOW_SIZE / the 0.50 gate in live_test_letters.py.
const WINDOW_SIZE = 7;
const CONFIDENCE_GATE = 0.5;
const PREDICT_INTERVAL_MS = 120;

function majority(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return { label: best, share: bestCount / values.length };
}

export default function SignToText() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const windowRef = useRef([]);
  const lastSentRef = useRef(0);
  const lastSpokenRef = useRef(null);
  const inFlightRef = useRef(false);
  const startingRef = useRef(false);

  const { landmarkerRef, ready: modelReady, error: modelError } = useHandLandmarker();

  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [health, setHealth] = useState(null);
  const [handVisible, setHandVisible] = useState(false);
  const [result, setResult] = useState(null);
  const [transcript, setTranscript] = useState([]);

  // Surface a dead or model-less backend before the user tries to sign at it.
  useEffect(() => {
    let cancelled = false;
    if (!API_CONFIGURED) return undefined;

    fetchHealth()
      .then((data) => !cancelled && setHealth(data))
      .catch((error) => !cancelled && setBackendError(error.message));

    return () => {
      cancelled = true;
    };
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    windowRef.current = [];
    setRunning(false);
    setHandVisible(false);
    setResult(null);
  }, []);

  useEffect(() => stop, [stop]);

  const loop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    let detection = null;
    try {
      detection = landmarker.detectForVideo(video, performance.now());
    } catch {
      // A dropped frame is not worth tearing the session down for.
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hand = detection?.landmarks?.[0];
    setHandVisible(Boolean(hand));

    if (hand) {
      drawHand(
        ctx,
        hand.map((p) => [p.x, p.y, p.z]),
        { width: canvas.width, height: canvas.height, color: "#6494FF", jointColor: "#34D399" }
      );

      const now = performance.now();
      if (!inFlightRef.current && now - lastSentRef.current > PREDICT_INTERVAL_MS) {
        lastSentRef.current = now;
        inFlightRef.current = true;

        // Same normalization the training rows went through.
        const features = normalizeHand(landmarksToFlat(hand));

        predict(features)
          .then(({ label, confidence }) => {
            setBackendError(null);

            if (confidence >= CONFIDENCE_GATE) {
              windowRef.current = [...windowRef.current, label].slice(-WINDOW_SIZE);
            }

            if (windowRef.current.length > 0) {
              const { label: voted, share } = majority(windowRef.current);
              setResult({ label: voted, share });

              const settled = windowRef.current.length === WINDOW_SIZE && share >= 0.7;
              if (settled && voted !== lastSpokenRef.current) {
                lastSpokenRef.current = voted;
                setTranscript((prev) => [...prev, voted].slice(-40));
              }
            }
          })
          .catch((error) => setBackendError(error.message))
          .finally(() => {
            inFlightRef.current = false;
          });
      }
    } else {
      windowRef.current = [];
      lastSpokenRef.current = null;
      setResult(null);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [landmarkerRef]);

  const start = useCallback(async () => {
    // Guards against a double-click firing two concurrent getUserMedia calls,
    // which race to set srcObject and abort each other's pending play().
    if (startingRef.current || running) return;
    startingRef.current = true;
    setStarting(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
      const missing = error?.name === "NotFoundError";
      setCameraError(
        denied
          ? "Camera access was blocked. Allow it in your browser's address-bar permissions, then try again."
          : missing
            ? "No camera was found on this device."
            : `The camera could not be started: ${error?.message ?? "unknown error"}`
      );
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [loop, running]);

  const modelMissing = health && health.status !== "ok";

  return (
    <div className="shell pt-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Mode one</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Sign to text and speech</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Hold one hand up to the camera and keep the shape still for a moment.
          Seven frames have to agree before a letter is committed, which keeps the
          reading from flickering between neighbours.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        {!API_CONFIGURED && (
          <Notice tone="error" title="Backend URL is not configured">
            Copy <code className="text-paper">.env.example</code> to{" "}
            <code className="text-paper">.env</code> in{" "}
            <code className="text-paper">web/frontend</code>, set{" "}
            <code className="text-paper">VITE_API_URL</code>, and restart the dev server.
          </Notice>
        )}

        {backendError && (
          <Notice tone="error" title="Backend unreachable">
            {backendError}
          </Notice>
        )}

        {modelMissing && (
          <Notice tone="error" title="The backend is running but has no model loaded">
            {health.error ?? "Check SADO_MODEL_PATH on the server."}
          </Notice>
        )}

        {modelError && (
          <Notice tone="error" title="Hand detection failed to load">
            {modelError.message}
          </Notice>
        )}

        {cameraError && (
          <Notice tone="error" title="Camera problem">
            {cameraError}
          </Notice>
        )}

      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-ink-900">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />

            {!running && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950/85 px-6 text-center">
                <p className="text-sm text-muted">
                  {modelReady
                    ? "The camera is off. Nothing is recorded or uploaded."
                    : "Loading the hand detection model…"}
                </p>
                <button
                  type="button"
                  onClick={start}
                  disabled={!modelReady || starting}
                  className="pill-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? "Starting…" : modelReady ? "Turn on camera" : "Preparing…"}
                </button>
              </div>
            )}

            {running && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/85 px-3 py-1.5 text-xs font-medium">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${handVisible ? "bg-mint-400" : "bg-ink-600"}`}
                />
                <span className={handVisible ? "text-mint-300" : "text-muted"}>
                  {handVisible ? "hand detected" : "no hand in frame"}
                </span>
              </span>
            )}
          </div>

          {running && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={stop} className="pill-ghost">
                Stop camera
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <p className="eyebrow">Current reading</p>
            <p className="mt-3 text-7xl font-bold leading-none">
              {result?.label ?? <span className="text-ink-600">—</span>}
            </p>

            <div className="mt-5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-150"
                  style={{ width: `${Math.round((result?.share ?? 0) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {result
                  ? `${Math.round(result.share * 100)}% agreement across the last ${WINDOW_SIZE} frames`
                  : "Waiting for a steady hand shape"}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Transcript</p>
              {transcript.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTranscript([])}
                  className="text-xs text-muted hover:text-paper"
                >
                  Clear
                </button>
              )}
            </div>

            {transcript.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Committed letters will collect here.
              </p>
            ) : (
              <p className="mt-3 break-words text-2xl font-semibold leading-relaxed">
                {transcript.join(" ")}
              </p>
            )}
          </div>

          {API_CONFIGURED && (
            <p className="text-xs text-muted">
              Sending landmarks to <code>{API_BASE}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
