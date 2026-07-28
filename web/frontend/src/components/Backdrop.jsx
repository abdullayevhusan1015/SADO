/**
 * The reference art has faint concentric arcs sweeping out from behind the
 * headline. Same idea here, rendered in blue and kept low-contrast so it never
 * competes with text.
 */
export default function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-[46rem] w-[76rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,125,255,0.22),rgba(59,125,255,0)_72%)]" />
      <div className="absolute left-1/2 top-[26rem] h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.12),rgba(16,185,129,0)_70%)]" />

      <svg
        className="absolute left-1/2 top-[-16rem] h-[64rem] w-[110rem] -translate-x-1/2 animate-low"
        viewBox="0 0 1600 1000"
        fill="none"
      >
        {[300, 420, 540, 660, 780].map((r, i) => (
          <circle
            key={r}
            cx="800"
            cy="640"
            r={r}
            stroke="url(#arc)"
            strokeWidth={i === 1 ? 1.4 : 1}
            opacity={0.5 - i * 0.07}
          />
        ))}
        <defs>
          <linearGradient id="arc" x1="0" y1="0" x2="1600" y2="1000">
            <stop offset="0%" stopColor="#3B7DFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#6494FF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
