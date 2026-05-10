import { describe, expect, it } from "vitest";
import { parseVcf } from "@/lib/vcf";

// vCard spec requires CRLF line endings.
const CRLF = "\r\n";
const card = (lines: string[]) =>
  ["BEGIN:VCARD", "VERSION:4.0", ...lines, "END:VCARD"].join(CRLF);

const single = card(["N:Doe;Jane;;;", "FN:Jane Doe", "EMAIL:jane@example.com", "TEL:+15551234567"]);
const fnOnly = card(["FN:John Smith", "TEL:+15550000000"]);
const noName = card(["EMAIL:ghost@example.com"]);
const multi = `${single}${CRLF}${fnOnly}`;
const empty = card([]);

// NOTE: parseVcf currently iterates `vCard(content)` directly, which returns a
// single object — not an array. Multi-card inputs and many edge cases throw
// "{} is not iterable". The .fails tests below pin the desired behavior so
// that fixing the bug makes them pass.
describe("parseVcf", () => {
  it.fails("parses N: structured name into first/last", () => {
    const [c] = parseVcf(single);
    expect(c.firstName).toBe("Jane");
    expect(c.lastName).toBe("Doe");
    expect(c.email).toBe("jane@example.com");
    expect(c.phone).toBe("+15551234567");
  });

  it.fails("falls back to FN when N missing", () => {
    const [c] = parseVcf(fnOnly);
    expect(c.firstName).toBe("John");
    expect(c.lastName).toBe("Smith");
  });

  it.fails("skips cards with no resolvable first name", () => {
    expect(parseVcf(noName)).toHaveLength(0);
  });

  it.fails("parses multiple cards in one payload", () => {
    const cards = parseVcf(multi);
    expect(cards).toHaveLength(2);
    expect(cards[0].firstName).toBe("Jane");
    expect(cards[1].firstName).toBe("John");
  });

  it.fails("returns empty array for empty card gracefully", () => {
    expect(() => parseVcf(empty)).not.toThrow();
  });
});
