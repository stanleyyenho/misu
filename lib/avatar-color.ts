const AVATAR_PALETTE = [
  { bg: "oklch(0.88 0.09 150)", fg: "oklch(0.28 0.09 150)" },  // sage green
  { bg: "oklch(0.90 0.10 55)",  fg: "oklch(0.30 0.12 50)"  },  // warm peach
  { bg: "oklch(0.88 0.08 280)", fg: "oklch(0.28 0.10 280)" },  // soft lavender
  { bg: "oklch(0.88 0.09 170)", fg: "oklch(0.28 0.09 170)" },  // mint
  { bg: "oklch(0.88 0.10 35)",  fg: "oklch(0.28 0.12 35)"  },  // terracotta
  { bg: "oklch(0.90 0.07 95)",  fg: "oklch(0.30 0.09 90)"  },  // warm yellow
  { bg: "oklch(0.88 0.08 220)", fg: "oklch(0.28 0.09 220)" },  // dusty blue
  { bg: "oklch(0.88 0.09 15)",  fg: "oklch(0.28 0.10 15)"  },  // blush rose
] as const;

export function getAvatarColor(name: string) {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
