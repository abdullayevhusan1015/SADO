const TONES = {
  info: "border-brand-500/40 bg-brand-500/10 text-brand-200",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  error: "border-red-500/45 bg-red-500/10 text-red-200",
  ok: "border-mint-500/40 bg-mint-500/10 text-mint-300",
};

/**
 * Inline status message. Errors announce themselves to screen readers, since
 * the failure modes here (no camera, no mic, backend down) all need to reach
 * someone who may not be able to hear a chime.
 */
export default function Notice({ tone = "info", title, children, action }) {
  const isAlert = tone === "error" || tone === "warn";

  return (
    <div
      role={isAlert ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${TONES[tone] ?? TONES.info}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1 opacity-90" : "opacity-90"}>{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
