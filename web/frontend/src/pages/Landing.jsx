import { Link } from "react-router-dom";
import Backdrop from "../components/Backdrop";
import PreviewCard from "../components/PreviewCard";
import { ALPHABET } from "../lib/alphabet";

const STEPS = [
  {
    n: "01",
    title: "Your camera finds the hand",
    body: "MediaPipe Hands runs inside the browser tab and reduces each frame to 21 points — the knuckles, joints and fingertips.",
  },
  {
    n: "02",
    title: "The points are made comparable",
    body: "Every point is measured from the wrist and divided by hand size, so sitting closer to the camera or drifting left of centre stops changing the answer.",
  },
  {
    n: "03",
    title: "A classifier names the letter",
    body: "Those 63 numbers go to the model, which returns a letter and a confidence. Seven frames have to agree before anything is shown or spoken.",
  },
];

export default function Landing() {
  return (
    <>
      <section className="relative">
        <Backdrop />

        <div className="shell relative pb-8 pt-14 text-center sm:pt-20">
          <h1 className="animate-rise mx-auto max-w-4xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Your camera reads Uzbek Sign
            <br className="hidden sm:block" /> Language, and says it out loud.
          </h1>

          <p className="animate-rise mx-auto mt-6 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
            Hold a letter up to your webcam. SADO recognises the shape of your hand,
            writes the letter down, and speaks it — and it can play the signs back
            to you the other way round.
          </p>

          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/translate" className="pill-primary w-full sm:w-auto">
              Start translating
            </Link>
            <Link to="/sign-back" className="pill-ghost w-full sm:w-auto">
              Turn words into signs
            </Link>
          </div>

          {/* Reference has a small reassurance line under the CTA. */}
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1.5l5 2v4c0 3-2.1 5.6-5 7-2.9-1.4-5-4-5-7v-4l5-2z"
                stroke="#34D399"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            Video never leaves your device — only the 63 numbers do
          </p>
        </div>

        <PreviewCard />
      </section>

      <section id="how" className="shell scroll-mt-24 pt-24">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Three steps between a hand and a spoken letter.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.n} className="card">
              <p className="text-sm font-semibold text-brand-400">{step.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="vocabulary" className="shell scroll-mt-24 pt-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              The full 33-sign alphabet.
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
              Every letter of the Uzbek manual alphabet, including the digraphs{" "}
              <span className="text-paper">Sh</span>,{" "}
              <span className="text-paper">Ch</span> and{" "}
              <span className="text-paper">Ng</span>, the apostrophed{" "}
              <span className="text-paper">O‘</span> and{" "}
              <span className="text-paper">G‘</span>, and the iotated{" "}
              <span className="text-paper">Ya</span>,{" "}
              <span className="text-paper">Yu</span>,{" "}
              <span className="text-paper">Yo</span>,{" "}
              <span className="text-paper">Ye</span>.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2">
            {ALPHABET.map((letter) => (
              <li
                key={letter}
                className="min-w-[3rem] rounded-lg border border-line bg-ink-900 px-3 py-2.5 text-center text-sm font-semibold"
              >
                {letter}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="status" className="shell scroll-mt-24 pt-24">
        <div className="card border-brand-500/25 bg-gradient-to-br from-ink-900 to-ink-850">
          <p className="eyebrow">Where it stands</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Honest about what this can and cannot do yet.
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-paper">5,428</p>
              <p className="mt-1.5 text-sm text-muted">
                hand samples extracted from a single teaching video
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-paper">82.6%</p>
              <p className="mt-1.5 text-sm text-muted">
                accuracy on held-out footage, measured without letting near-identical
                frames leak between training and test
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-paper">1</p>
              <p className="mt-1.5 text-sm text-muted">
                signer in the training data — which is the honest reason accuracy
                drops on an unfamiliar hand
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted">
            Every example the model has seen came from one person, one room and one
            camera. It reads that footage well and is far less reliable on anyone
            else. Recording more signers is the next piece of work, and it matters
            more than any change to the model itself.
          </p>
        </div>
      </section>

      <section className="shell pt-24">
        <div className="rounded-2xl border border-line bg-ink-900 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Try it with your own hand.</h2>
          <p className="mx-auto mt-3 max-w-prose text-sm text-muted">
            The camera runs locally and you can stop it at any time.
          </p>
          <Link to="/translate" className="pill-primary mt-7">
            Open the translator
          </Link>
        </div>
      </section>
    </>
  );
}
