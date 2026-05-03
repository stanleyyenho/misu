"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Calendar" },
  { href: "/contacts", label: "Contacts" },
  { href: "/settings", label: "Settings" },
];

function MisuMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      {/* Two overlapping circles — people connecting */}
      <circle cx="9" cy="9" r="9" fill="oklch(0.68 0.09 150)" opacity="0.9" />
      <circle cx="16" cy="9" r="9" fill="oklch(0.72 0.10 55)" opacity="0.9" />
    </svg>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r bg-sidebar flex-col py-6 px-4 gap-1">
      <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
        <MisuMark />
        <span className="text-xl font-extrabold tracking-tight">misu</span>
      </Link>
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}
