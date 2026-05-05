"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Dashboard",
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Contacts",
    exact: false,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    exact: false,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    exact: false,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-[#1F2024]">
      {/* Content row — fixed height, never overlaps the home indicator */}
      <div className="flex items-center pt-3 pb-2">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex items-center justify-center w-11 h-8 transition-all border-2 ${
                  active
                    ? "bg-accent border-[#1F2024] shadow-[2px_2px_0_#1F2024]"
                    : "border-transparent"
                }`}
                style={{ borderRadius: "8px" }}
              >
                {tab.icon(active)}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
      {/* Safe-area spacer — pure background, no content, no gesture conflict */}
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
