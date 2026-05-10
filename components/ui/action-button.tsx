"use client";

import * as React from "react";

type Variant = "primary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs font-bold px-2.5 py-1.5",
  md: "text-sm font-bold px-4 py-2",
};

const SIZE_RADIUS: Record<Size, string> = {
  sm: "8px",
  md: "10px",
};

const SIZE_SHADOW: Record<Size, string> = {
  sm: "var(--shadow-2)",
  md: "var(--shadow-4)",
};

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--button-fill)", color: "var(--primary-foreground)" },
  outline: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  ghost: { backgroundColor: "transparent", color: "var(--foreground)", borderColor: "transparent", boxShadow: "none" },
  destructive: { backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)" },
};

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  variant?: Variant;
  size?: Size;
  style?: React.CSSProperties;
};

export function ActionButton({
  variant = "primary",
  size = "md",
  className,
  children,
  style,
  ...props
}: Props) {
  const variantStyle = VARIANT_STYLE[variant];
  const merged: React.CSSProperties = {
    borderRadius: SIZE_RADIUS[size],
    boxShadow: variant === "ghost" ? "none" : SIZE_SHADOW[size],
    ...variantStyle,
    ...style,
  };
  return (
    <button
      type="button"
      className={[
        SIZE_CLASSES[size],
        "border-2 border-foreground transition-all",
        "hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px",
        "disabled:opacity-50 disabled:pointer-events-none",
        className ?? "",
      ].join(" ")}
      style={merged}
      {...props}
    >
      {children}
    </button>
  );
}
