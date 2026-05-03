// Sunny day with rolling hills — "all caught up!" empty state
export function SunnyDayIllustration({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 0.75);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 120 90"
      fill="none"
      aria-hidden="true"
    >
      {/* Sky background */}
      <rect width="120" height="90" rx="16" fill="oklch(0.93 0.04 220 / 30%)" />

      {/* Sun */}
      <circle cx="60" cy="28" r="14" fill="oklch(0.88 0.12 90)" />
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 18 * Math.cos(rad);
        const y1 = 28 + 18 * Math.sin(rad);
        const x2 = 60 + 24 * Math.cos(rad);
        const y2 = 28 + 24 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="oklch(0.88 0.12 90)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}

      {/* Back hill — lightest sage */}
      <ellipse cx="60" cy="90" rx="75" ry="32" fill="oklch(0.82 0.07 150)" />
      {/* Mid hill — medium sage */}
      <ellipse cx="30" cy="90" rx="55" ry="26" fill="oklch(0.72 0.09 150)" />
      {/* Front hill — richest sage */}
      <ellipse cx="85" cy="90" rx="50" ry="24" fill="oklch(0.62 0.09 150)" />

      {/* Small bird (two arcs) */}
      <path d="M82 18 Q86 14 90 18" stroke="oklch(0.52 0.09 150)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M94 20 Q98 16 102 20" stroke="oklch(0.52 0.09 150)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
