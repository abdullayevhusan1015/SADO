import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 py-10">
      <div className="shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-sm text-muted">
          SADO is a student project building an open Uzbek Sign Language translator.
          It is a research prototype, not a substitute for a qualified interpreter.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <Link to="/translate" className="text-muted hover:text-paper">
            Sign → Text
          </Link>
          <Link to="/sign-back" className="text-muted hover:text-paper">
            Text → Sign
          </Link>
          <Link to="/how-it-works" className="text-muted hover:text-paper">
            How it works
          </Link>
        </nav>
      </div>
    </footer>
  );
}
