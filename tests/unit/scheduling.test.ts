import { describe, expect, it, vi } from "vitest";
import { computeJitteredNextDate } from "@/lib/scheduling";

const DAY = 24 * 60 * 60 * 1000;

describe("computeJitteredNextDate", () => {
  const from = new Date("2026-01-01T00:00:00Z");

  it("with zero jitter, returns exactly frequencyDays in the future", () => {
    const next = computeJitteredNextDate({ frequencyDays: 7, frequencyJitterDays: 0 }, from);
    expect(next.getTime() - from.getTime()).toBe(7 * DAY);
  });

  it("with jitter, stays within +/- jitter window", () => {
    for (let i = 0; i < 200; i++) {
      const next = computeJitteredNextDate({ frequencyDays: 30, frequencyJitterDays: 3 }, from);
      const delta = (next.getTime() - from.getTime()) / DAY;
      expect(delta).toBeGreaterThanOrEqual(27);
      expect(delta).toBeLessThanOrEqual(33);
    }
  });

  it("respects deterministic Math.random for reproducibility", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const next = computeJitteredNextDate({ frequencyDays: 10, frequencyJitterDays: 5 }, from);
    expect((next.getTime() - from.getTime()) / DAY).toBe(5);
    spy.mockRestore();
  });

  it("treats undefined jitter as 0", () => {
    const next = computeJitteredNextDate(
      { frequencyDays: 14, frequencyJitterDays: undefined as unknown as number },
      from
    );
    expect((next.getTime() - from.getTime()) / DAY).toBe(14);
  });

  it("defaults to now() when from is omitted", () => {
    const before = Date.now();
    const next = computeJitteredNextDate({ frequencyDays: 1, frequencyJitterDays: 0 });
    const after = Date.now();
    expect(next.getTime()).toBeGreaterThanOrEqual(before + DAY - 5);
    expect(next.getTime()).toBeLessThanOrEqual(after + DAY + 5);
  });
});
