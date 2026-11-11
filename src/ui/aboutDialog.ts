/**
 * @module ui/aboutDialog
 * Controls the About / Contact modal overlay.
 *
 * The modal HTML lives in `sidepanel.html`. This module wires up open and
 * close interactions so the logic doesn't pollute the entry point.
 */

/** Shows the about modal. */
function showAbout(): void {
  document.getElementById("about-overlay")?.classList.add("visible");
}

/** Hides the about modal. */
function hideAbout(): void {
  document.getElementById("about-overlay")?.classList.remove("visible");
}

/**
 * Attaches event listeners to the about button, close button,
 * and backdrop click. Call once during panel initialisation.
 */
export function initAboutDialog(): void {
  document.getElementById("about-btn")?.addEventListener("click", showAbout);
  document.getElementById("about-close")?.addEventListener("click", hideAbout);

  // Close on backdrop click (clicking the overlay itself, not the card)
  document.getElementById("about-overlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) hideAbout();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideAbout();
  });
}
