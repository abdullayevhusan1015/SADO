import { Link } from "react-router-dom";

/**
 * Echoes the reference's two-tone, wide-tracked wordmark — accent half in the
 * brand colour, the rest in white.
 */
export default function Wordmark({ to = "/", size = "md" }) {
  const scale = size === "lg" ? "text-xl" : "text-base";

  return (
    <Link
      to={to}
      className="group inline-flex flex-col items-center gap-1"
      aria-label="SADO — home"
    >
      <span className={`${scale} font-bold tracking-wordmark`}>
        <span className="text-brand-400 transition group-hover:text-brand-300">SA</span>
        <span className="text-paper">DO</span>
      </span>
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-muted">
        Imo-ishora tili
      </span>
    </Link>
  );
}
