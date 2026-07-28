import { useCallback, useEffect, useRef, useState } from "react";
import Notice from "../components/Notice";
import { drawHand, isHandPresent } from "../lib/handSkeleton";
import { canonicalise, loadSequence, loadSequenceIndex } from "../lib/sequences";
import { listenOnce, speechRecognitionSupported } from "../lib/speech";

const MIC_ERRORS = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser's address-bar permissions.",
  "service-not-allowed": "Microphone access was blocked by your browser or system settings.",
  "no-speech": "Nothing was picked up. Try again and speak a little closer to the mic.",
  "audio-capture": "No microphone was found on this device.",
  network: "Speech recognition needs a network connection and could not reach the service.",
  unsupported: "This browser does not support speech recognition. Chrome or Edge do.",
};

export default function TextToSign() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startedAtRef = useRef(0);
  const sequenceRef = useRef(null);

  const [vocabulary, setVocabulary] = useState([]);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | playing | missing | error
  const [activeWord, setActiveWord] = useState(null);
  const [frameInfo, setFrameInfo] = useState({ index: 0, total: 0 });
  const [error, setError] = useState(null);
  const [micError, setMicError] = useState(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    loadSequenceIndex()
      .then((index) => setVocabulary(index.words ?? []))
      .finally(() => setIndexLoaded(true));
  }, []);

  const paint = useCallback((frame) => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // The recorder mirrors the camera, so playback mirrors back to read naturally.
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    if (isHandPresent(frame.left)) {
      drawHand(ctx, frame.left, { width, height, color: "#6494FF", jointColor: "#BFD4FF" });
    }
    if (isHandPresent(frame.right)) {
      drawHand(ctx, frame.right, { width, height, color: "#34D399", jointColor: "#6EE7B7" });
    }

    ctx.restore();
  }, []);

  const stopPlayback = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => stopPlayback, [stopPlayback]);

  const tick = useCallback(() => {
    const sequence = sequenceRef.current;
    if (!sequence) return;

    const fps = sequence.fps > 0 ? sequence.fps : 30;
    const elapsed = (performance.now() - startedAtRef.current) / 1000;
    const total = sequence.frames.length;
    const index = Math.floor(elapsed * fps) % total;

    paint(sequence.frames[index]);
    setFrameInfo({ index: index + 1, total });

    rafRef.current = requestAnimationFrame(tick);
  }, [paint]);

  const play = useCallback(
    async (rawWord) => {
      const word = canonicalise(rawWord);
      if (!word) return;

      stopPlayback();
      setError(null);
      setStatus("loading");
      setActiveWord(word);

      try {
        const sequence = await loadSequence(word);

        if (!sequence || !sequence.frames?.length) {
          sequenceRef.current = null;
          setStatus("missing");
          return;
        }

        sequenceRef.current = sequence;
        startedAtRef.current = performance.now();
        setStatus("playing");
        rafRef.current = requestAnimationFrame(tick);
      } catch (cause) {
        sequenceRef.current = null;
        setError(cause.message);
        setStatus("error");
      }
    },
    [stopPlayback, tick]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    play(query);
  };

  const handleMic = async () => {
    setMicError(null);
    setListening(true);
    try {
      const transcript = await listenOnce();
      setQuery(transcript);
      await play(transcript);
    } catch (cause) {
      setMicError(MIC_ERRORS[cause.message] ?? `Speech recognition failed: ${cause.message}`);
    } finally {
      setListening(false);
    }
  };

  const emptyLibrary = indexLoaded && vocabulary.length === 0;

  return (
    <div className="shell pt-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Mode two</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Text and speech to sign</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Type or say a word and the recorded hand movement plays back as a moving
          skeleton, at the speed it was captured.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="word" className="sr-only">
          Word to sign
        </label>
        <input
          id="word"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a word, e.g. salom"
          autoComplete="off"
          className="w-full rounded-full border border-line bg-ink-900 px-5 py-3 text-sm text-paper placeholder:text-muted/70 focus:border-brand-500"
        />
        <div className="flex gap-3">
          <button type="submit" className="pill-primary flex-1 sm:flex-none">
            Show sign
          </button>
          <button
            type="button"
            onClick={handleMic}
            disabled={!speechRecognitionSupported || listening}
            className="pill-ghost flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            aria-label={listening ? "Listening" : "Speak a word"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="6" y="1.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M3.5 7.5a4.5 4.5 0 009 0M8 12v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {listening ? "Listening…" : "Speak"}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {!speechRecognitionSupported && (
          <Notice tone="warn" title="Voice input is unavailable in this browser">
            Typing still works. Chrome and Edge support the speech recognition API.
          </Notice>
        )}

        {micError && (
          <Notice tone="error" title="Microphone problem">
            {micError}
          </Notice>
        )}

        {emptyLibrary && (
          <Notice tone="warn" title="The sequence library is empty">
            No recordings have been added yet, so every word will come back as
            unavailable. Record some takes with{" "}
            <code className="text-paper">record_sign_sequence.py</code>, then run{" "}
            <code className="text-paper">python web/scripts/sync_sequences.py</code>{" "}
            to publish them to the site.
          </Notice>
        )}

        {status === "missing" && (
          <Notice tone="warn" title={`“${activeWord}” is not in the demo vocabulary yet`}>
            {vocabulary.length > 0
              ? "Try one of the recorded words listed below."
              : "Nothing has been recorded yet."}
          </Notice>
        )}

        {status === "error" && error && (
          <Notice tone="error" title="Could not play that recording">
            {error}
          </Notice>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-ink-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,125,255,0.10),transparent_70%)]" />
          <canvas ref={canvasRef} width={800} height={600} className="relative h-full w-full" />

          {status !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-sm text-muted">
                {status === "loading" ? "Loading recording…" : "The signed word will play here."}
              </p>
            </div>
          )}

          {status === "playing" && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-ink-950 to-transparent px-4 py-3">
              <span className="text-sm font-semibold">{activeWord}</span>
              <span className="text-xs text-muted">
                frame {frameInfo.index} / {frameInfo.total}
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <p className="eyebrow">Recorded words</p>
          {!indexLoaded ? (
            <p className="mt-3 text-sm text-muted">Checking the library…</p>
          ) : vocabulary.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing recorded yet. Once takes exist, they appear here as buttons.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {vocabulary.map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(word);
                      play(word);
                    }}
                    className="rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-200"
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center gap-4 border-t border-line/70 pt-5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-400" /> left hand
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mint-400" /> right hand
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
