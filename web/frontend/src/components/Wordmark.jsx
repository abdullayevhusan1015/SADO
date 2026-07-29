import { Link } from "react-router-dom";

/**
 * Echoes the reference's two-tone, wide-tracked wordmark — accent half in the
 * brand colour, the rest in white.
 */
export default function Wordmark({ to = "/", size = "md" }) {
  const isLarge = size === "lg";
  const scale = isLarge ? "text-xl" : "text-base";
  const logoSize = isLarge ? "h-14 w-14" : "h-8 w-8";

  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2.5 ${isLarge ? "flex-col" : "flex-row"}`}
      aria-label="SADO — home"
    >
      <img src="/brand/logo.png" alt="" className={`${logoSize} object-contain`} />
      <span className="inline-flex flex-col items-center gap-1">
        <span className={`${scale} font-bold tracking-wordmark`}>
          <span className="text-brand-400 transition group-hover:text-brand-300">SA</span>
          <span className="text-paper">DO</span>
        </span>
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-muted">
          Imo-ishora tili
        </span>
      </span>
    </Link>
  );
}
