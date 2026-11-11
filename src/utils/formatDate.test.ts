import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("returns a non-empty string for any timestamp", () => {
    expect(formatDate(Date.now()).length).toBeGreaterThan(0);
  });

  it("returns a string for the epoch (0)", () => {
    expect(typeof formatDate(0)).toBe("string");
  });

  it("produces different strings for different timestamps", () => {
    const a = formatDate(1_000_000_000_000);
    const b = formatDate(1_700_000_000_000);
    expect(a).not.toBe(b);
  });
});
