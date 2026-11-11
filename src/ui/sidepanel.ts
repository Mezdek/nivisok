/**
 * @module ui/sidepanel
 * Entry point for the Nivisok side panel UI.
 *
 * Wires up top-level interactions (compose area, batch actions, live sync)
 * and delegates everything else to dedicated modules. No note-card DOM
 * building lives here.
 */

import { SITE, STORAGE_KEY } from "@/constants";
import { applyDirection, t } from "@/src/lib/i18n";
import { NoteStore } from "@/src/lib/store";
import { download } from "@/src/utils/download";
import type { INote } from "@/types/INote";
import { initAboutDialog } from "./aboutDialog";
import { initBatchButtons, render } from "./noteRenderer";
import { selectionManager } from "./selectionManager";

// DOM refs

const input = document.getElementById("input") as HTMLTextAreaElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const hintEl = document.getElementById("hint-save") as HTMLSpanElement;
const exportSelectedBtn = document.getElementById(
  "export-selected-btn",
) as HTMLButtonElement;
const deleteSelectedBtn = document.getElementById(
  "delete-selected-btn",
) as HTMLButtonElement;

// Initialisation

/** Apply locale direction and populate all static translated strings. */

function initI18n(): void {
  applyDirection();

  input.placeholder = t("placeholder_write");
  hintEl.textContent = t("hint_save");
  saveBtn.textContent = t("btn_save");
  exportSelectedBtn.textContent = t("btn_export_selected");
  deleteSelectedBtn.textContent = t("btn_delete_selected");
  deleteSelectedBtn.classList.add("danger");

  (document.getElementById("meta-description") as HTMLMetaElement).content =
    t("ext_description");
  (document.getElementById("meta-keywords") as HTMLMetaElement).content =
    SITE.keywords;
  (document.getElementById("meta-author") as HTMLMetaElement).content =
    SITE.author;

  const aboutBtn = document.getElementById("about-btn") as HTMLButtonElement;
  aboutBtn.setAttribute("aria-label", t("about_aria_label"));
  aboutBtn.setAttribute("title", t("about_aria_label"));

  (document.getElementById("about-close") as HTMLButtonElement).setAttribute(
    "aria-label",
    t("about_close_aria"),
  );

  (
    document.getElementById("about-description") as HTMLParagraphElement
  ).textContent = t("about_description");

  (document.getElementById("about-label-version") as HTMLElement).textContent =
    t("about_label_version");
  (document.getElementById("about-value-version") as HTMLElement).textContent =
    SITE.version;

  (document.getElementById("about-label-author") as HTMLElement).textContent =
    t("about_label_author");
  (document.getElementById("about-value-author") as HTMLElement).textContent =
    SITE.author;

  const contactLink = document.getElementById(
    "about-link-contact",
  ) as HTMLAnchorElement;
  contactLink.href = `mailto:${SITE.email}`;
  contactLink.querySelector("span")!.textContent = t("about_link_contact");

  const githubLink = document.getElementById(
    "about-link-github",
  ) as HTMLAnchorElement;
  githubLink.href = SITE.repoUrl;
  githubLink.querySelector("span")!.textContent = t("about_link_github");

  const coffeeLink = document.getElementById(
    "about-link-coffee",
  ) as HTMLAnchorElement;
  coffeeLink.href = SITE.coffeeUrl;
  coffeeLink.querySelector("span")!.textContent = t("about_link_coffee");
}

// Compose

/**
 * Saves a typed note. The URL is always `null`, so these notes display a
 * "Self created" label rather than a page source.
 */

saveBtn.onclick = async () => {
  const content = input.value.trim();
  if (!content) return;

  const note: INote = {
    id: crypto.randomUUID(),
    content,
    url: null,
    createdAt: Date.now(),
  };

  await NoteStore.save(note);
  input.value = "";
  render();
};

/** Keyboard shortcut: Ctrl/Cmd + Enter submits the compose area. */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveBtn.click();
});

// Batch operations

async function handleDeleteSelected(): Promise<void> {
  const ids = [...selectionManager.getSelected()];
  if (!ids.length) return;
  await NoteStore.deleteMany(ids);
  selectionManager.clear();
  render();
}

async function handleExportSelected(): Promise<void> {
  const ids = selectionManager.getSelected();
  if (!ids.size) return;
  const notes = await NoteStore.get();
  const selected = notes.filter((n) => ids.has(n.id));
  download(selected);
}

// Live sync

/**
 * Re-render when storage changes so notes clipped via the context menu
 * appear in the panel instantly without requiring a manual refresh.
 */
chrome.storage.onChanged.addListener((changes) => {
  if (STORAGE_KEY in changes) render();
});

// Bootstrap

initI18n();
initBatchButtons(handleDeleteSelected, handleExportSelected);
initAboutDialog();
render();
