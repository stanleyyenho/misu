const AVATAR_PALETTE = [
  { bg: "#FFE93E", fg: "#111111" },  // yellow
  { bg: "#5BC4F5", fg: "#111111" },  // sky blue
  { bg: "#FF6B9D", fg: "#111111" },  // pink
  { bg: "#7EE8A2", fg: "#111111" },  // mint green
  { bg: "#FFB347", fg: "#111111" },  // orange
  { bg: "#C4A8FF", fg: "#111111" },  // lavender
  { bg: "#FF8B8B", fg: "#111111" },  // soft red
  { bg: "#A8E6D9", fg: "#111111" },  // turquoise
] as const;

export function getAvatarColor(name: string) {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
