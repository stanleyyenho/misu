export function EmptyContactsIllustration({ size = 100 }: { size?: number }) {
  const h = Math.round(size * (116 / 120));
  return (
    <svg width={size} height={h} viewBox="0 0 120 116" fill="none" aria-hidden="true">
      <defs>
        <pattern id="ec-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="#1F2024" opacity="0.16" />
        </pattern>
        <pattern id="ec-ch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2024" strokeWidth="1" opacity="0.22" />
        </pattern>
      </defs>
      <rect width="120" height="116" fill="url(#ec-dots)" />
      <rect x="22" y="20" width="76" height="80" rx="4" fill="#C4A8FF" stroke="#1F2024" strokeWidth="2.5" />
      <rect x="22" y="20" width="76" height="80" rx="4" fill="url(#ec-ch)" />
      <rect x="22" y="20" width="10" height="80" fill="#1F2024" />
      <rect x="32" y="24" width="62" height="72" rx="2" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <rect x="92" y="34" width="6" height="10" rx="1" fill="#FFE93E" stroke="#1F2024" strokeWidth="1.5" />
      <rect x="92" y="50" width="6" height="10" rx="1" fill="#BCE8DC" stroke="#1F2024" strokeWidth="1.5" />
      <rect x="92" y="66" width="6" height="10" rx="1" fill="#FF8B8B" stroke="#1F2024" strokeWidth="1.5" />
      <line x1="40" y1="38" x2="80" y2="38" stroke="#1F2024" strokeWidth="1.5" opacity="0.25" />
      <line x1="40" y1="46" x2="76" y2="46" stroke="#1F2024" strokeWidth="1.5" opacity="0.25" />
      <line x1="40" y1="54" x2="80" y2="54" stroke="#1F2024" strokeWidth="1.5" opacity="0.25" />
      <circle cx="62" cy="76" r="9" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <line x1="62" y1="72" x2="62" y2="80" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="76" x2="66" y2="76" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
