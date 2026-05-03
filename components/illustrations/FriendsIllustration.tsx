export function FriendsIllustration({ size = 96 }: { size?: number }) {
  const h = Math.round(size * (100 / 104));
  return (
    <svg width={size} height={h} viewBox="0 0 104 100" fill="none" aria-hidden="true">
      <defs>
        <pattern id="fi-dot" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="#1F2024" opacity="0.18" />
        </pattern>
        <pattern id="fi-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2024" strokeWidth="1" opacity="0.22" />
        </pattern>
      </defs>
      <rect width="104" height="100" fill="url(#fi-dot)" />
      <circle cx="26" cy="22" r="12" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <circle cx="22" cy="21" r="1.8" fill="#1F2024" />
      <circle cx="30" cy="21" r="1.8" fill="#1F2024" />
      <path d="M22 26 Q26 29 30 26" stroke="#1F2024" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="16" y="36" width="20" height="24" rx="4" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <rect x="16" y="36" width="20" height="24" rx="4" fill="url(#fi-hatch)" />
      <rect x="18" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <rect x="27" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <path d="M36 44 Q50 38 54 34" stroke="#1F2024" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="22" r="12" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <circle cx="74" cy="21" r="1.8" fill="#1F2024" />
      <circle cx="82" cy="21" r="1.8" fill="#1F2024" />
      <path d="M74 26 Q78 29 82 26" stroke="#1F2024" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="68" y="36" width="20" height="24" rx="4" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <rect x="68" y="36" width="20" height="24" rx="4" fill="url(#fi-hatch)" />
      <rect x="70" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <rect x="79" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <path d="M68 44 Q54 38 50 34" stroke="#1F2024" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M52 56 C52 56 40 48 40 41 C40 36.5 44 34 48 36 C50 37 52 39 52 39 C52 39 54 37 56 36 C60 34 64 36.5 64 41 C64 48 52 56 52 56Z"
        fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" strokeLinejoin="round"
      />
      <circle cx="46" cy="40" r="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}
