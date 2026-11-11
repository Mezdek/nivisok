/**
 * @module i18n
 * Thin wrapper around the Chrome i18n API with RTL language detection.
 * Centralises all locale access so the rest of the codebase never calls
 * `chrome.i18n` directly.
 */

/**
 * Languages whose scripts run right-to-left.
 */
const RTL_LANGS = ["ar", "fa", "ur", "ckb"];

/**
 * Returns the localised string for the given message key.
 * Falls back to the key itself if the message is not found,
 * so missing translations are visible rather than silent.
 *
 * @param key           - The message key defined in `_locales/messages.json`.
 * @param substitutions - Optional placeholder substitution(s).
 * @returns The localised string.
 */
export function t(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * Returns `true` if the current browser UI language runs right-to-left.
 */
export function isRTL(): boolean {
  const lang = chrome.i18n.getUILanguage();
  return RTL_LANGS.some((l) => lang.startsWith(l));
}

/**
 * Applies `dir` and `lang` attributes to `<html>` based on the browser locale.
 * Call once at panel initialisation before rendering any content.
 */
export function applyDirection(): void {
  const lang = chrome.i18n.getUILanguage();
  document.documentElement.dir = isRTL() ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}
