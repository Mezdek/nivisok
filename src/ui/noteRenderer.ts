/**
 * @module ui/noteRenderer
 * Owns all note-card DOM construction and the main render loop.
 *
 * Exports:
 * - `render()`: fetches notes and rebuilds the list.
 * - `initBatchButtons()`: wires Delete/Export Selected buttons to callbacks.
 */

import { t } from "@/src/lib/i18n";
import { NoteStore } from "@/src/lib/store";
import { download } from "@/src/utils/download";
import { formatDate } from "@/src/utils/formatDate";
import type { INote } from "@/types/INote";
import { selectionManager } from "./selectionManager";

// DOM refs

const list = document.getElementById("notes-list") as HTMLDivElement;
const countEl = document.getElementById("count") as HTMLSpanElement;
const exportSelectedBtn = document.getElementById(
  "export-selected-btn",
) as HTMLButtonElement;
const deleteSelectedBtn = document.getElementById(
  "delete-selected-btn",
) as HTMLButtonElement;

// Batch button wiring

/**
 * Connects the batch-action buttons to their handler callbacks and wires up
 * the selection manager so the buttons are disabled when nothing is selected.
 *
 * @param onDelete - Called when "Delete selected" is clicked.
 * @param onExport - Called when "Export selected" is clicked.
 */
export function initBatchButtons(
  onDelete: () => Promise<void>,
  onExport: () => Promise<void>,
): void {
  deleteSelectedBtn.onclick = onDelete;
  exportSelectedBtn.onclick = onExport;

  selectionManager.onChange((selected) => {
    const hasSelection = selected.size > 0;
    exportSelectedBtn.disabled = !hasSelection;
    deleteSelectedBtn.disabled = !hasSelection;
  });

  // Initial disabled state
  exportSelectedBtn.disabled = true;
  deleteSelectedBtn.disabled = true;
}

// Render loop

/**
 * Fetches all notes from storage and re-renders the list.
 * Preserves existing checkbox state across renders.
 */
export async function render(): Promise<void> {
  const notes = await NoteStore.get();

  countEl.textContent =
    notes.length === 1
      ? t("notes_singular")
      : t("notes_plural", String(notes.length));

  list.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t("empty_state");
    list.appendChild(empty);
    return;
  }

  const currentSelected = selectionManager.getSelected();
  for (const note of notes) {
    list.appendChild(buildNoteEl(note, currentSelected.has(note.id)));
  }
}

// Note card builder

/**
 * Builds a complete note card element.
 *
 * @param note       - The note data to render.
 * @param isSelected - Whether the note's checkbox should start checked.
 */
function buildNoteEl(note: INote, isSelected: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = "note" + (isSelected ? " selected" : "");
  el.dataset.id = note.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "note-checkbox";
  checkbox.checked = isSelected;
  checkbox.setAttribute("aria-label", "Select note");
  checkbox.onchange = () => {
    selectionManager.toggle(note.id, checkbox.checked);
    el.classList.toggle("selected", checkbox.checked);
  };

  const meta = document.createElement("div");
  meta.className = "note-meta";

  const displayTs = note.updatedAt ?? note.createdAt;
  const time = document.createElement("time");
  time.dateTime = new Date(displayTs).toISOString();
  time.textContent = formatDate(displayTs);

  if (note.updatedAt) {
    time.classList.add("modified");
    // Show original creation date on hover
    time.title = `${t("label_created")}: ${formatDate(note.createdAt)}`;
  }
  meta.appendChild(time);

  if (note.url) {
    try {
      const a = document.createElement("a");
      a.href = note.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = new URL(note.url).hostname;
      a.title = note.url;
      meta.appendChild(a);
    } catch {
      /* skip invalid URL */
    }
  } else {
    const selfTag = document.createElement("span");
    selfTag.className = "tag-self";
    selfTag.textContent = t("label_self_created");
    meta.appendChild(selfTag);
  }

  const content = document.createElement("p");
  content.className = "note-content";
  content.textContent = note.content;

  const actions = document.createElement("div");
  actions.className = "note-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = t("btn_edit");
  editBtn.onclick = () => enterEditMode(el, note, content, editBtn, time);

  const exportBtn = document.createElement("button");
  exportBtn.textContent = t("btn_export");
  exportBtn.onclick = () => download([note]);

  const delBtn = document.createElement("button");
  delBtn.textContent = t("btn_delete");
  delBtn.className = "danger";
  delBtn.onclick = async () => {
    await NoteStore.delete(note.id);
    selectionManager.toggle(note.id, false);
    render();
  };

  actions.append(editBtn, exportBtn, delBtn);
  el.append(checkbox, meta, content, actions);
  return el;
}

// Inline edit mode

/**
 * Replaces the note content paragraph with an editable textarea in-place.
 * On save, persists the new content and stamps `updatedAt` without a full
 * re-render so the user's scroll position is preserved.
 */
function enterEditMode(
  el: HTMLElement,
  note: INote,
  contentEl: HTMLParagraphElement,
  editBtn: HTMLButtonElement,
  timeEl: HTMLTimeElement,
): void {
  // Only one edit area per note
  if (el.dataset.editing === "true") return;
  el.dataset.editing = "true";
  el.classList.add("editing");

  contentEl.style.display = "none";

  const textarea = document.createElement("textarea");
  textarea.className = "note-edit-area";
  textarea.value = note.content;
  textarea.rows = Math.min(Math.max(note.content.split("\n").length + 1, 3), 8);
  contentEl.insertAdjacentElement("afterend", textarea);
  textarea.focus();

  const saveEdit = document.createElement("button");
  saveEdit.textContent = t("btn_save");
  saveEdit.className = "primary small";

  const cancelEdit = document.createElement("button");
  cancelEdit.textContent = t("btn_cancel");
  cancelEdit.className = "small";

  const editActions = document.createElement("div");
  editActions.className = "edit-actions";
  editActions.append(saveEdit, cancelEdit);
  textarea.insertAdjacentElement("afterend", editActions);

  editBtn.disabled = true;

  const exitEdit = (): void => {
    textarea.remove();
    editActions.remove();
    contentEl.style.display = "";
    editBtn.disabled = false;
    delete el.dataset.editing;
    el.classList.remove("editing");
  };

  cancelEdit.onclick = exitEdit;

  saveEdit.onclick = async () => {
    const newContent = textarea.value.trim();
    if (!newContent || newContent === note.content) {
      exitEdit();
      return;
    }

    await NoteStore.update(note.id, newContent);
    note.content = newContent;
    note.updatedAt = Date.now();

    // Update the DOM in-place
    contentEl.textContent = newContent;
    timeEl.textContent = formatDate(note.updatedAt);
    timeEl.dateTime = new Date(note.updatedAt).toISOString();
    timeEl.classList.add("modified");
    timeEl.title = `${t("label_created")}: ${formatDate(note.createdAt)}`;

    exitEdit();
  };

  // Ctrl/Cmd+Enter shortcut inside the edit textarea
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit.click();
    if (e.key === "Escape") cancelEdit.click();
  });
}
