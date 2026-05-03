// Two friends facing each other with a heart between them
export function FriendsIllustration({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
    >
      {/* Background disc */}
      <circle cx="48" cy="48" r="44" fill="oklch(0.93 0.04 55 / 40%)" />

      {/* Left figure — sage */}
      <circle cx="28" cy="32" r="9" fill="oklch(0.68 0.09 150)" />
      <rect x="18" y="44" width="20" height="22" rx="8" fill="oklch(0.68 0.09 150)" />
      {/* Left waving arm */}
      <path d="M38 50 Q50 40 52 33" stroke="oklch(0.68 0.09 150)" strokeWidth="5" strokeLinecap="round" />

      {/* Right figure — peach */}
      <circle cx="68" cy="32" r="9" fill="oklch(0.72 0.10 55)" />
      <rect x="58" y="44" width="20" height="22" rx="8" fill="oklch(0.72 0.10 55)" />
      {/* Right waving arm */}
      <path d="M58 50 Q46 40 44 33" stroke="oklch(0.72 0.10 55)" strokeWidth="5" strokeLinecap="round" />

      {/* Heart between them */}
      <path
        d="M48 62 C48 62 38 55 38 49 C38 45.5 41 43 44 44 C46 44.5 48 46 48 46 C48 46 50 44.5 52 44 C55 43 58 45.5 58 49 C58 55 48 62 48 62Z"
        fill="oklch(0.66 0.10 35)"
      />
    </svg>
  );
}
