import { useEffect, useRef } from "react";
import { drawHand } from "../lib/handSkeleton";

// A single static hand pose, used purely as landing-page art so the hero has
// something concrete to show before the camera is ever switched on.
const POSE = [
  [0.52, 0.92, 0], [0.44, 0.86, 0], [0.39, 0.77, 0], [0.36, 0.69, 0], [0.33, 0.62, 0],
  [0.46, 0.62, 0], [0.44, 0.48, 0], [0.43, 0.39, 0], [0.42, 0.32, 0],
  [0.54, 0.60, 0], [0.54, 0.44, 0], [0.54, 0.34, 0], [0.54, 0.26, 0],
  [0.62, 0.62, 0], [0.64, 0.48, 0], [0.65, 0.39, 0], [0.66, 0.31, 0],
  [0.69, 0.66, 0], [0.73, 0.56, 0], [0.75, 0.49, 0], [0.77, 0.42, 0],
];

function Skeleton() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    drawHand(ctx, POSE, {
      width,
      height,
      color: "#6494FF",
      jointColor: "#34D399",
    });
  }, []);

  return <canvas ref={canvasRef} width={260} height={300} className="h-full w-full" />;
}

/**
 * Stands in for the screenshots peeking above the fold in the reference —
 * a cropped browser frame showing the translator mid-read.
 */
export default function PreviewCard() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-2 sm:mt-20">
      <div className="overflow-hidden rounded-t-2xl border border-line border-b-0 bg-ink-900 shadow-[0_-10px_60px_-15px_rgba(59,125,255,0.35)]">
        <div className="flex items-center gap-2 border-b border-line/80 bg-ink-850 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="ml-3 text-xs text-muted">sado — sign to text</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_0.9fr] sm:p-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-ink-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(59,125,255,0.14),transparent_65%)]" />
            <div className="relative flex h-full items-center justify-center">
              <div className="h-4/5">
                <Skeleton />
              </div>
            </div>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-900/90 px-2.5 py-1 text-[0.65rem] font-medium text-mint-300">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
              hand detected
            </span>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div>
              <p className="eyebrow">Reading</p>
              <p className="mt-2 text-6xl font-bold leading-none text-paper">B</p>
            </div>
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <div className="h-full w-[86%] rounded-full bg-brand-500" />
              </div>
              <p className="mt-2 text-xs text-muted">86% across the last 7 frames</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["S", "A", "L", "O", "M"].map((letter, i) => (
                <span
                  key={`${letter}-${i}`}
                  className="rounded-md border border-line bg-ink-850 px-2 py-1 text-xs font-medium text-muted"
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fades the mock into the page, the way the reference crops its screenshots. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
