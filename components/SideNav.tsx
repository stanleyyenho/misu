"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/contacts", label: "Contacts", exact: false },
  { href: "/calendar", label: "Calendar", exact: false },
  { href: "/settings", label: "Settings", exact: false },
];

function MisuMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" rx="24" fill="#BCE8DC"/>
      <g transform="translate(27.25, 25) scale(0.75)">
        <rect x="46" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="106" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="118" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="106" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="118" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="142" y="22" width="24" height="24" fill="#1F2024"/>
        <rect x="166" y="46" width="18" height="18" fill="#1F2024"/>
        <rect x="142" y="70" width="12" height="12" fill="#1F2024"/>
      </g>
    </svg>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r-2 border-[#1F2024] bg-sidebar flex-col py-6 px-4 gap-1">
      <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
        <MisuMark />
        <span
          className="text-2xl tracking-tight"
          style={{ fontFamily: "var(--font-silkscreen)", letterSpacing: "0.02em" }}
        >
          misu
        </span>
      </Link>
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`px-4 py-1.5 text-sm font-bold transition-all border-2 ${
              active
                ? "bg-accent text-accent-foreground border-[#1F2024] shadow-[2px_2px_0_#1F2024]"
                : "text-foreground border-transparent hover:border-[#1F2024] hover:bg-accent/40"
            }`}
            style={{ borderRadius: "8px" }}
          >
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}
