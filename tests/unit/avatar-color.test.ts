import { describe, expect, it } from "vitest";
import { getAvatarColor } from "@/lib/avatar-color";

describe("getAvatarColor", () => {
  it("returns the same color for the same name (deterministic)", () => {
    expect(getAvatarColor("Stanley")).toEqual(getAvatarColor("Stanley"));
  });

  it("returns a palette entry with bg and fg hex strings", () => {
    const color = getAvatarColor("Alice");
    expect(color.bg).toMatch(/^#[0-9A-F]{6}$/i);
    expect(color.fg).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("handles empty string without crashing", () => {
    expect(() => getAvatarColor("")).not.toThrow();
  });

  it("distributes across the palette for varied names", () => {
    const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const bgs = new Set(names.map((n) => getAvatarColor(n).bg));
    expect(bgs.size).toBeGreaterThan(1);
  });
});
