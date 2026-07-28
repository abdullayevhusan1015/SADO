import { Link } from "react-router-dom";

const PIPELINE = [
  {
    title: "Detection stays on your machine",
    body: "MediaPipe Hands is compiled to WebAssembly and runs inside the browser tab. The video element is read frame by frame and never uploaded, recorded or stored.",
  },
  {
    title: "21 points per hand",
    body: "Each detected hand becomes 21 landmarks with x, y and z values — 63 numbers describing where the joints sit relative to the frame.",
  },
  {
    title: "Normalization removes the camera",
    body: "Every point is re-measured from the wrist, then divided by the distance from wrist to middle knuckle. Position in frame and distance from the lens drop out, so only the shape of the hand remains.",
  },
  {
    title: "The classifier names it",
    body: "Those 63 normalized numbers are posted to a small FastAPI service running a random forest trained on the Uzbek manual alphabet. It answers with a letter and a confidence.",
  },
  {
    title: "Seven frames must agree",
    body: "Single-frame predictions jitter. A rolling window of the last seven confident answers is taken, and only a clear majority is written down or spoken.",
  },
];

export default function HowItWorks() {
  return (
    <div className="shell pt-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Under the hood</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">How SADO works</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          There is no magic in the pipeline, and knowing the shape of it makes the
          failures easier to read.
        </p>
      </header>

      <ol className="mt-10 space-y-4">
        {PIPELINE.map((step, i) => (
          <li key={step.title} className="card flex gap-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-sm font-semibold text-brand-300">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">What it gets wrong</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold">One signer in the training data</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every sample came from a single teaching video — one person, one room,
              one camera. Accuracy measured on that footage is far better than
              accuracy on a hand the model has never seen.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold">Letters that look alike</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Several signs differ mainly in wrist rotation or a single finger. Those
              are the ones that swap under an unfamiliar camera angle, and they drag
              the average down more than the distinctive shapes lift it.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold">Movement is not captured yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Letter recognition reads a single frame at a time. Signs defined by
              motion rather than a held shape are not handled by this model.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold">Fingerspelling, not fluent language</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This reads the manual alphabet. Sign language grammar — facial
              expression, space, movement — is a much larger problem and is not
              something this prototype attempts.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-ink-900 px-6 py-10 text-center sm:px-12">
        <h2 className="text-2xl font-bold">See it for yourself.</h2>
        <p className="mx-auto mt-3 max-w-prose text-sm text-muted">
          The honest test is your own hand in your own room.
        </p>
        <Link to="/translate" className="pill-primary mt-6">
          Open the translator
        </Link>
      </section>
    </div>
  );
}
