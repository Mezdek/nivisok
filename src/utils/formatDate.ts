/**
 * @module utils/formatDate
 * Locale-aware date/time formatting for note timestamps.
 */

/**
 * Formats a Unix timestamp into a short, locale-aware date/time string.
 *
 * Defaults to the browser's UI language rather than a hardcoded locale,
 * so dates render in the format the user expects.
 *
 * @param ts     - Unix timestamp in milliseconds.
 * @param locale - BCP 47 locale string; defaults to the browser UI language.
 * @returns A human-readable string such as "15 Jan, 10:30".
 */
export function formatDate(
  ts: number,
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "en-GB",
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
