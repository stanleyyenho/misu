"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, MonitorIcon, type LucideIcon } from "lucide-react";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "light", Icon: SunIcon },
  { value: "dark", label: "dark", Icon: MoonIcon },
  { value: "system", label: "system", Icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted ? theme : undefined) as Choice | undefined;

  return (
    <div
      role="radiogroup"
      aria-label="appearance"
      className="inline-flex items-center gap-1 rounded-[8px] border-2 border-foreground bg-card p-1"
      style={{ boxShadow: "var(--shadow-2)" }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-xs font-bold transition-colors"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-foreground)" : "var(--foreground)",
            }}
            suppressHydrationWarning
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
