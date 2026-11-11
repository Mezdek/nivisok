declare const __APP_VERSION__: string;
/** Storage key under which the notes array is persisted. */
export const STORAGE_KEY = "NIVISOK";

/** Static site/extension metadata used across the UI. */
export const SITE = {
  version: __APP_VERSION__,
  author: "Mezdek",
  email: "hello@mezdek.net",
  repoUrl: "https://github.com/mezdek/nivisok",
  coffeeUrl: "https://buymeacoffee.com/mezdek",
  keywords: "notes, quick notes, side panel, clip, browser extension, nivisok",
} as const;
