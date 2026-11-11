import type { INote } from "@/types/INote";
import { describe, expect, it } from "vitest";
import { noteToText } from "./noteToText";

// Fixtures

const BASE_TS = 1_700_000_000_000;
const UPDATED_TS = 1_700_000_999_000;

const base: INote = {
  id: "test-id",
  content: "Hello world",
  url: null,
  createdAt: BASE_TS,
};

/** Deterministic formatter to decouple tests from locale/timezone. */
const fmt = (ts: number) => `DATE(${ts})`;

// Structure

describe("noteToText: output structure", () => {
  it("produces exactly 4 lines for a single-line note", () => {
    const lines = noteToText(base, fmt).split("\n");
    // [date label, source line, blank line, content]
    expect(lines).toHaveLength(4);
  });

  it("has a blank line between the source and the content", () => {
    const lines = noteToText(base, fmt).split("\n");
    expect(lines[2]).toBe("");
  });

  it("content is on the last line for a single-line note", () => {
    const lines = noteToText(base, fmt).split("\n");
    expect(lines[3]).toBe("Hello world");
  });

  it("preserves multiline content after the blank separator", () => {
    const note = { ...base, content: "line1\nline2\nline3" };
    const result = noteToText(note, fmt);
    const body = result.split("\n").slice(3).join("\n");
    expect(body).toBe("line1\nline2\nline3");
  });
});

// Date label

describe("noteToText: date label", () => {
  it("uses createdAt when the note has never been edited", () => {
    const result = noteToText(base, fmt);
    expect(result.startsWith(`[DATE(${BASE_TS})]`)).toBe(true);
  });

  it("uses updatedAt when the note has been edited", () => {
    const note = { ...base, updatedAt: UPDATED_TS };
    const result = noteToText(note, fmt);
    expect(result.startsWith(`[Modified: DATE(${UPDATED_TS})]`)).toBe(true);
  });

  it("does not include createdAt in the label when updatedAt is set", () => {
    const note = { ...base, updatedAt: UPDATED_TS };
    const label = noteToText(note, fmt).split("\n")[0];
    expect(label).not.toContain(`DATE(${BASE_TS})`);
  });

  it("uses the custom dateFormatter for the timestamp", () => {
    const customFmt = (ts: number) => `CUSTOM(${ts})`;
    const result = noteToText(base, customFmt);
    expect(result).toContain(`CUSTOM(${BASE_TS})`);
  });
});

// Source line

describe("noteToText: source line", () => {
  it("shows the URL when the note has one", () => {
    const note = { ...base, url: "https://example.com/page" };
    const lines = noteToText(note, fmt).split("\n");
    expect(lines[1]).toBe("Source: https://example.com/page");
  });

  it("shows 'Self created' when url is null", () => {
    const lines = noteToText(base, fmt).split("\n");
    expect(lines[1]).toBe("Source: Self created");
  });
});

// Content

describe("noteToText: content", () => {
  it("includes the note content in the output", () => {
    expect(noteToText(base, fmt)).toContain("Hello world");
  });

  it("handles empty content gracefully", () => {
    const note = { ...base, content: "" };
    const result = noteToText(note, fmt);
    expect(result).toBeDefined();
    expect(result.split("\n")).toHaveLength(4);
  });

  it("handles content with special characters", () => {
    const note = { ...base, content: "Tabs\there\nNewlines & <symbols>" };
    expect(noteToText(note, fmt)).toContain(note.content);
  });
});
