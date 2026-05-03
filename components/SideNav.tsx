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
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#111111" />
      <circle cx="19" cy="10" r="10" fill="#FFE93E" />
      <circle cx="19" cy="10" r="10" stroke="#111111" strokeWidth="2" fill="#FFE93E" />
      <circle cx="10" cy="10" r="10" stroke="#111111" strokeWidth="2" fill="#111111" />
    </svg>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r-2 border-[var(--shadow-hard)] bg-sidebar flex-col py-6 px-4 gap-1">
      <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
        <MisuMark />
        <span className="text-2xl font-bold tracking-tight font-heading">misu</span>
      </Link>
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all border-2 ${
              active
                ? "bg-accent text-accent-foreground border-[var(--shadow-hard)] shadow-[2px_2px_0_var(--shadow-hard)]"
                : "text-foreground border-transparent hover:border-[var(--shadow-hard)] hover:bg-accent/40"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}
