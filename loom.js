/**
 * loom.js
 * -------
 * Placeholder handler for Loom embedded players.
 * Phase 1: Only logs the detection — no playback or download logic.
 *
 * Exposed globals:
 *   - handleLoom(fileName)  → void
 */

(() => {
  "use strict";

  /**
   * Handle a detected Loom player.
   *
   * @param {string} fileName - The formatted target file name
   *                            (e.g. "Hermes_Lesson_3").
   */
  function handleLoom(fileName) {
    console.log(
      `[Detected] Player Type: Loom | Target File Name: ${fileName}`
    );
  }

  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.handleLoom = handleLoom;
})();
