/**
 * @module lib/noteToText
 * Serialises a note to a plain-text string suitable for file export.
 */

import { formatDate } from "@/src/utils/formatDate";
import type { INote } from "@/types/INote";

/**
 * Converts a note to a human-readable plain-text representation.
 *
 * The output format is:
 * ```
 * [Jan 15, 10:30 AM]        (or [Modified: ...] if the note was edited)
 * Source: https://...         (or "Source: Self created" for typed notes)
 *
 * <note content>
 * ```
 *
 * @param note          - The note to serialise.
 * @param dateFormatter - Optional date formatter; defaults to {@link formatDate}.
 * @returns A multi-line plain-text string ready for download.
 */
export function noteToText(
  note: INote,
  dateFormatter: (ts: number) => string = formatDate,
): string {
  const displayTs = note.updatedAt ?? note.createdAt;
  const dateLabel = note.updatedAt
    ? `[Modified: ${dateFormatter(displayTs)}]`
    : `[${dateFormatter(displayTs)}]`;

  const sourceLine = note.url ? `Source: ${note.url}` : "Source: Self created";

  return [dateLabel, sourceLine, "", note.content].join("\n");
}
