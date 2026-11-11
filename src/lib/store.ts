/**
 * @module lib/store
 * Persistence layer for Nivisok notes.
 *
 * All operations go through `chrome.storage.local`.
 * The store is stateless: each call reads the full array, mutates it, and writes it back.
 * This keeps the store service-worker-friendly: no in-memory state is assumed to
 * survive between invocations.
 */

import { STORAGE_KEY } from "@/constants";
import type { INote } from "@/types/INote";

export const NoteStore = {
  /**
   * Retrieves all saved notes in insertion order (newest first).
   *
   * @returns A promise resolving to the stored notes array, or `[]` if empty.
   */
  get: async function (): Promise<INote[]> {
    const r = await chrome.storage.local.get(STORAGE_KEY);
    return (r[STORAGE_KEY] as INote[]) ?? [];
  },

  /**
   * Prepends a new note to the stored list.
   *
   * @param note - The fully constructed note to persist.
   */
  save: async function (note: INote): Promise<void> {
    const notes = await this.get();
    await chrome.storage.local.set({ [STORAGE_KEY]: [note, ...notes] });
  },

  /**
   * Removes a single note by its unique identifier.
   * Silently succeeds if no note with that id exists.
   *
   * @param id - The UUID of the note to remove.
   */
  delete: async function (id: string): Promise<void> {
    const notes = await this.get();
    await chrome.storage.local.set({
      [STORAGE_KEY]: notes.filter((n) => n.id !== id),
    });
  },

  /**
   * Removes multiple notes in a single storage write.
   * Silently ignores ids that don't exist.
   *
   * @param ids - Array of UUIDs to remove.
   */
  deleteMany: async function (ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    const notes = await this.get();
    await chrome.storage.local.set({
      [STORAGE_KEY]: notes.filter((n) => !idSet.has(n.id)),
    });
  },

  /**
   * Updates the content of an existing note and stamps `updatedAt`.
   * Silently no-ops if the id is not found.
   *
   * @param id      - The UUID of the note to edit.
   * @param content - The new text content to persist.
   */
  update: async function (id: string, content: string): Promise<void> {
    const notes = await this.get();
    await chrome.storage.local.set({
      [STORAGE_KEY]: notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n,
      ),
    });
  },
};
