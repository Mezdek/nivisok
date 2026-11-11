import { STORAGE_KEY } from "@/constants";
import type { INote } from "@/types/INote";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteStore } from "./store";

// Chrome mock

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
    },
  },
});

// Helpers

let uid = 0;
const makeNote = (overrides: Partial<INote> = {}): INote => ({
  id: `note-${++uid}`,
  content: "test content",
  url: null,
  createdAt: 1_700_000_000_000,
  ...overrides,
});

const storedNotes = (notes: INote[]) =>
  mockGet.mockResolvedValue({ [STORAGE_KEY]: notes });

const emptyStorage = () => mockGet.mockResolvedValue({});

/** Extracts the notes array passed to the last chrome.storage.local.set call. */
const lastWritten = (): INote[] =>
  mockSet.mock.calls[mockSet.mock.calls.length - 1][0][STORAGE_KEY];

// Tests

beforeEach(() => vi.clearAllMocks());

describe("NoteStore.get", () => {
  it("returns an empty array when storage is empty", async () => {
    emptyStorage();
    expect(await NoteStore.get()).toEqual([]);
  });

  it("returns an empty array when the key is missing", async () => {
    mockGet.mockResolvedValue({ unrelated_key: [] });
    expect(await NoteStore.get()).toEqual([]);
  });

  it("returns the stored notes array", async () => {
    const notes = [makeNote(), makeNote()];
    storedNotes(notes);
    expect(await NoteStore.get()).toEqual(notes);
  });

  it("calls chrome.storage.local.get with the correct key", async () => {
    emptyStorage();
    await NoteStore.get();
    expect(mockGet).toHaveBeenCalledWith(STORAGE_KEY);
  });
});

describe("NoteStore.save", () => {
  it("writes a single note when storage is empty", async () => {
    emptyStorage();
    const note = makeNote();
    await NoteStore.save(note);
    expect(lastWritten()).toEqual([note]);
  });

  it("prepends the new note to existing notes", async () => {
    const existing = makeNote({ content: "old" });
    storedNotes([existing]);
    const incoming = makeNote({ content: "new" });
    await NoteStore.save(incoming);
    expect(lastWritten()).toEqual([incoming, existing]);
  });

  it("does not mutate the existing notes", async () => {
    const existing = makeNote();
    storedNotes([existing]);
    const incoming = makeNote();
    await NoteStore.save(incoming);
    expect(lastWritten()[1]).toEqual(existing);
  });
});

describe("NoteStore.delete", () => {
  it("removes the note with the matching id", async () => {
    const a = makeNote();
    const b = makeNote();
    const c = makeNote();
    storedNotes([a, b, c]);
    await NoteStore.delete(b.id);
    expect(lastWritten()).toEqual([a, c]);
  });

  it("silently succeeds when the id does not exist", async () => {
    const note = makeNote();
    storedNotes([note]);
    await NoteStore.delete("nonexistent");
    expect(lastWritten()).toEqual([note]);
  });

  it("results in an empty array when the only note is deleted", async () => {
    const note = makeNote();
    storedNotes([note]);
    await NoteStore.delete(note.id);
    expect(lastWritten()).toEqual([]);
  });
});

describe("NoteStore.deleteMany", () => {
  it("removes all notes whose ids are in the list", async () => {
    const a = makeNote();
    const b = makeNote();
    const c = makeNote();
    storedNotes([a, b, c]);
    await NoteStore.deleteMany([a.id, c.id]);
    expect(lastWritten()).toEqual([b]);
  });

  it("silently ignores ids that do not exist", async () => {
    const note = makeNote();
    storedNotes([note]);
    await NoteStore.deleteMany(["ghost-1", "ghost-2"]);
    expect(lastWritten()).toEqual([note]);
  });

  it("handles an empty ids array without removing anything", async () => {
    const notes = [makeNote(), makeNote()];
    storedNotes(notes);
    await NoteStore.deleteMany([]);
    expect(lastWritten()).toEqual(notes);
  });

  it("results in an empty array when all notes are deleted", async () => {
    const a = makeNote();
    const b = makeNote();
    storedNotes([a, b]);
    await NoteStore.deleteMany([a.id, b.id]);
    expect(lastWritten()).toEqual([]);
  });
});

describe("NoteStore.update", () => {
  it("updates the content of the matching note", async () => {
    const note = makeNote({ content: "original" });
    storedNotes([note]);
    await NoteStore.update(note.id, "updated");
    expect(lastWritten()[0].content).toBe("updated");
  });

  it("stamps updatedAt with the current time", async () => {
    const note = makeNote();
    storedNotes([note]);
    const before = Date.now();
    await NoteStore.update(note.id, "new content");
    const after = Date.now();
    const { updatedAt } = lastWritten()[0];
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it("does not mutate other notes in the list", async () => {
    const a = makeNote({ content: "a" });
    const b = makeNote({ content: "b" });
    storedNotes([a, b]);
    await NoteStore.update(a.id, "a-updated");
    expect(lastWritten()[1]).toEqual(b);
  });

  it("preserves all other fields of the updated note", async () => {
    const note = makeNote({ url: "https://example.com" });
    storedNotes([note]);
    await NoteStore.update(note.id, "new");
    const updated = lastWritten()[0];
    expect(updated.id).toBe(note.id);
    expect(updated.url).toBe(note.url);
    expect(updated.createdAt).toBe(note.createdAt);
  });

  it("silently no-ops when the id does not exist", async () => {
    const note = makeNote();
    storedNotes([note]);
    await NoteStore.update("ghost", "new content");
    expect(lastWritten()[0]).toEqual(note);
    expect(lastWritten()[0].updatedAt).toBeUndefined();
  });
});
