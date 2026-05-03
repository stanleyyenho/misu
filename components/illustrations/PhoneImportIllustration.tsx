// Phone with contact cards floating out — for the import drop zone
export function PhoneImportIllustration({ size = 64 }: { size?: number }) {
  const w = Math.round(size * 0.75);
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 48 64"
      fill="none"
      aria-hidden="true"
    >
      {/* Phone body */}
      <rect x="8" y="12" width="32" height="48" rx="7" fill="oklch(0.68 0.09 150)" />
      <rect x="11" y="16" width="26" height="38" rx="4" fill="oklch(0.93 0.04 55)" />
      {/* Home indicator */}
      <rect x="19" y="56" width="10" height="2" rx="1" fill="oklch(0.55 0.08 150)" />

      {/* Floating contact cards */}
      {/* Card 1 — peach, top-right */}
      <rect x="28" y="2" width="18" height="12" rx="4" fill="oklch(0.90 0.10 55)" opacity="0.9" />
      <circle cx="33" cy="8" r="3" fill="oklch(0.72 0.10 55)" />
      <rect x="38" y="6" width="6" height="2" rx="1" fill="oklch(0.60 0.10 55)" />
      <rect x="38" y="9" width="4" height="1.5" rx="0.75" fill="oklch(0.72 0.10 55)" />

      {/* Card 2 — lavender, far right */}
      <rect x="34" y="18" width="14" height="10" rx="3.5" fill="oklch(0.88 0.08 280)" opacity="0.85" />
      <circle cx="38.5" cy="23" r="2.5" fill="oklch(0.68 0.08 280)" />
      <rect x="43" y="21.5" width="4" height="1.5" rx="0.75" fill="oklch(0.55 0.08 280)" />
      <rect x="43" y="24" width="3" height="1.5" rx="0.75" fill="oklch(0.68 0.08 280)" />

      {/* Upload arrow */}
      <path
        d="M24 10 L24 3 M21 6 L24 3 L27 6"
        stroke="oklch(0.88 0.12 90)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
