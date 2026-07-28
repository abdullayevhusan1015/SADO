import { useState } from "react";
import { NavLink } from "react-router-dom";
import Wordmark from "./Wordmark";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/translate", label: "Sign → Text" },
  { to: "/sign-back", label: "Text → Sign" },
  { to: "/how-it-works", label: "How it works" },
];

function linkClass({ isActive }) {
  return [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-ink-800 text-paper"
      : "text-muted hover:bg-ink-850 hover:text-paper",
  ].join(" ");
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20 pt-6">
      <div className="shell">
        {/* Reference puts the nav row above a centred wordmark — kept here. */}
        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 hidden justify-center md:flex">
          <Wordmark size="lg" />
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between md:hidden">
          <Wordmark />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-line p-2 text-paper"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" className="mt-4 flex flex-col gap-1 md:hidden" aria-label="Main">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
