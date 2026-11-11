// @vitest-environment jsdom

import type { INote } from "@/types/INote";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { download } from "./download";

// Setup

const MOCK_BLOB_URL = "blob:mock://test-url";

beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue(MOCK_BLOB_URL);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Fixtures

let uid = 0;
const makeNote = (overrides: Partial<INote> = {}): INote => ({
  id: `abcd1234-0000-0000-0000-00000000000${++uid}`,
  content: "test content",
  url: null,
  createdAt: 1_700_000_000_000,
  ...overrides,
});

// Helpers

function mockAnchorElement(): {
  href: string;
  download: string;
  click: ReturnType<typeof vi.fn>;
} {
  const anchor = { href: "", download: "", click: vi.fn() };
  vi.spyOn(document, "createElement").mockReturnValue(
    anchor as unknown as HTMLElement,
  );
  return anchor;
}

// Guard clause

describe("download: guard clause", () => {
  it("does nothing when passed an empty array", () => {
    const anchor = mockAnchorElement();
    download([]);
    expect(anchor.click).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("does nothing when notes is [undefined]", () => {
    const anchor = mockAnchorElement();
    download([undefined as unknown as INote]);
    expect(anchor.click).not.toHaveBeenCalled();
  });

  it("does nothing when notes is [null]", () => {
    const anchor = mockAnchorElement();
    download([null as unknown as INote]);
    expect(anchor.click).not.toHaveBeenCalled();
  });
});

// Single note

describe("download: single note", () => {
  it("uses the first 8 chars of the note id in the filename", () => {
    const anchor = mockAnchorElement();
    const note = makeNote();
    download([note]);
    expect(anchor.download).toBe(`nivisok-${note.id.slice(0, 8)}.txt`);
  });

  it("triggers a click", () => {
    const anchor = mockAnchorElement();
    download([makeNote()]);
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("creates a Blob with text/plain MIME type", () => {
    const BlobSpy = vi.spyOn(globalThis, "Blob");
    mockAnchorElement();
    download([makeNote()]);
    expect(BlobSpy).toHaveBeenCalledWith(expect.any(Array), {
      type: "text/plain",
    });
  });

  it("revokes the object URL after clicking", () => {
    mockAnchorElement();
    download([makeNote()]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(MOCK_BLOB_URL);
  });
});

// Multiple notes

describe("download: multiple notes", () => {
  it("uses the generic export filename", () => {
    const anchor = mockAnchorElement();
    download([makeNote(), makeNote()]);
    expect(anchor.download).toBe("nivisok-multiple-export.txt");
  });

  it("joins notes with a separator", () => {
    const BlobSpy = vi.spyOn(globalThis, "Blob");
    mockAnchorElement();
    download([makeNote(), makeNote()]);
    const blobContent = BlobSpy.mock.calls[0][0]?.[0] as string;
    expect(blobContent).toContain("\n\n---\n\n");
  });

  it("triggers a click", () => {
    const anchor = mockAnchorElement();
    download([makeNote(), makeNote()]);
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("revokes the object URL after clicking", () => {
    mockAnchorElement();
    download([makeNote(), makeNote()]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(MOCK_BLOB_URL);
  });

  it("skips null/undefined entries in a mixed array", () => {
    const anchor = mockAnchorElement();
    const note = makeNote();
    download([note, null as unknown as INote]);
    // Falls to else branch (length > 1), filter(Boolean) skips null
    expect(anchor.click).toHaveBeenCalled();
  });
});
