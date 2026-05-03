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
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M 32 8 A 22 22 0 1 0 32 56 A 18 18 0 1 1 32 8 Z"
        fill="#CDEBD6"
        stroke="#1F2024"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="50" y="10" width="3" height="3" fill="#1F2024" />
      <rect x="55" y="14" width="2.5" height="2.5" fill="#1F2024" />
      <rect x="48" y="17" width="2" height="2" fill="#1F2024" />
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
            className={`px-4 py-2 text-sm font-bold transition-all border-2 ${
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
