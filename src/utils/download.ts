import { noteToText } from "@/src/lib/noteToText";
import { INote } from "@/types/INote";

/**
 * Triggers a browser file download with the given plain-text content.
 *
 * @param content  - Text content to write to the file.
 * @param filename - Suggested file name for the download dialog.
 */
function _download(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  }).click();
  URL.revokeObjectURL(url);
}

/**
 * Converts one or more notes to plain text and triggers a browser file download.
 *
 * - Single note: filename includes the first 8 characters of the note's id.
 * - Multiple notes: joined with a `---` separator under a generic filename.
 * - Silently no-ops if the array is empty or contains only null/undefined entries.
 *
 * @param notes - Notes to export. Null/undefined entries are ignored.
 */
export function download(notes: INote[]): void {
  if (!notes || notes.length === 0) return;
  let filename: string;
  let content: string;
  if (notes.length === 1 && !!notes[0]) {
    filename = `nivisok-${notes[0].id.slice(0, 8)}.txt`;
    content = noteToText(notes[0]);
  } else {
    filename = "nivisok-multiple-export.txt";
    const valid = notes.filter(Boolean);
    if (!valid.length) return;
    content = valid.map((note) => noteToText(note)).join("\n\n---\n\n");
  }
  _download(content, filename);
}
