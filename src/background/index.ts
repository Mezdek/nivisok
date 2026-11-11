/**
 * @module background/index
 * MV3 service worker: the extension's single background entry point.
 *
 * Responsibilities:
 * - Register the "Create note" context menu on installation.
 * - Handle context menu clicks: build an {@link INote} from the selected text
 *   and tab URL, then persist it via {@link NoteStore}.
 * - Open the side panel when the toolbar action icon is clicked.
 */

import { t } from "@/src/lib/i18n";
import { NoteStore } from "@/src/lib/store";
import type { INote } from "@/types/INote";

const CTX_MENU_ID = "NIVISOK";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CTX_MENU_ID,
    title: t("context_menu_create"),
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CTX_MENU_ID || !info.selectionText) return;

  const note: INote = {
    id: crypto.randomUUID(),
    content: info.selectionText.trim(),
    url: tab?.url ?? null,
    createdAt: Date.now(),
  };

  try {
    await NoteStore.save(note);
  } catch (err) {
    console.error("Nivisok: failed to save note", err);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id });
});
