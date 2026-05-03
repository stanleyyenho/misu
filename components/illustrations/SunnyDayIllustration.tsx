export function SunnyDayIllustration({ size = 120 }: { size?: number }) {
  const h = Math.round(size * (100 / 104));
  return (
    <svg width={size} height={h} viewBox="0 0 104 100" fill="none" aria-hidden="true">
      <defs>
        <pattern id="sdi-dot" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#1F2024" opacity="0.12" />
        </pattern>
        <pattern id="sdi-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2024" strokeWidth="1" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="104" height="100" fill="url(#sdi-dot)" />
      <circle cx="52" cy="30" r="14" fill="#FFE93E" stroke="#1F2024" strokeWidth="2" />
      <circle cx="47" cy="26" r="4" fill="#FFFFFF" opacity="0.55" />
      <line x1="52" y1="10" x2="52" y2="5"  stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="50" x2="52" y2="55" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="30" x2="27" y2="30" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="72" y1="30" x2="77" y2="30" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="16" x2="34" y2="12" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="66" y1="16" x2="70" y2="12" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="44" x2="34" y2="48" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="66" y1="44" x2="70" y2="48" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="52" cy="100" rx="70" ry="34" fill="#F0F0F0" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="20" cy="100" rx="55" ry="28" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="20" cy="100" rx="55" ry="28" fill="url(#sdi-hatch)" />
      <ellipse cx="84" cy="100" rx="42" ry="24" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="84" cy="100" rx="42" ry="24" fill="url(#sdi-dot)" />
      <path d="M74 52 Q78 48 82 52" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M84 50 Q88 46 92 50" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
