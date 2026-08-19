/**
 * detectors.js
 * -----------
 * Detection engine for the Skool Video Automation extension.
 *
 * CRITICAL BUGS FIXED:
 *   - Stripe iframes (js.stripe.com) were being matched by the old generic
 *     `iframe` selector. This version uses a STRICT allowlist of known-good
 *     iframe src patterns so Stripe and other third-party frames are ignored.
 *   - YouTube iframes don't exist in the DOM until the Skool thumbnail overlay
 *     is clicked. A "Universal Click" is performed FIRST, then we poll.
 *
 * Flow:
 *   1. Click the thumbnail overlay (if present) to force-inject the player.
 *   2. setInterval poll (up to 8 s) using ONLY strict selectors.
 *   3. On match, classify by tag/src and resolve.
 *
 * Exposed globals:
 *   - detectPlayer()  → Promise<string|null>  ("mux" | "youtube" | "loom" | null)
 */

(() => {
  "use strict";

  // ── Thumbnail overlay selectors ────────────────────────────────
  // These are the Skool wrapper divs that hide the real player.
  // Clicking them causes Skool to inject the actual media element.
  const THUMBNAIL_SELECTOR =
    '.sc-da51c951-2.bsuokU, ' +
    '.sc-f3f97a9f-5.vQCTc, ' +
    '.sc-f3f97a9f-5.deKkeJ, ' +
    '[class*="vQCTc"]';

  // ── STRICT player selector ─────────────────────────────────────
  // ONLY matches real media elements. Deliberately excludes generic
  // `iframe` so Stripe / analytics / chat iframes are never caught.
  const PLAYER_SELECTOR =
    'mux-player, ' +
    'video, ' +
    'iframe[src*="youtube.com"], ' +
    'iframe[src*="youtu.be"], ' +
    'iframe[src*="loom.com"]';

  // ── Config ─────────────────────────────────────────────────────
  const MAX_POLL_MS = 8000;      // how long to poll after clicking thumbnail
  const POLL_INTERVAL_MS = 500;  // check every 500 ms

  /**
   * Click the thumbnail overlay, then poll for the media player.
   * Uses a setInterval (matching the user-specified approach) so the
   * poll can be cancelled cleanly as soon as a player is found.
   *
   * @returns {Promise<string|null>} "mux" | "youtube" | "loom" | null
   */
  function detectPlayer() {
    return new Promise((resolve) => {

      // ── Step 1: Universal Click ──────────────────────────────
      const thumb = document.querySelector(THUMBNAIL_SELECTOR);
      if (thumb) {
        thumb.click();
        console.log(
          "[Detector] 👆 Thumbnail overlay clicked — waiting for player…"
        );
      } else {
        console.log(
          "[Detector] ℹ️ No thumbnail overlay found — player may already be loaded."
        );
      }

      // ── Step 2: Strict polling via setInterval ───────────────
      let elapsed = 0;

      const poll = setInterval(() => {
        elapsed += POLL_INTERVAL_MS;

        // Only this strict selector — no generic `iframe`
        const player = document.querySelector(PLAYER_SELECTOR);

        if (player) {
          clearInterval(poll);

          const tag = player.tagName.toLowerCase();
          const src = (player.src || "").toLowerCase();

          console.log(`[Detector] 🔍 Found element: <${tag}> src="${src}"`);

          // ── Step 3: Classify ──────────────────────────────
          if (tag === "mux-player") {
            console.log("[Detector] ✅ Mux player detected.");
            return resolve("mux");
          }

          if (tag === "video") {
            // <video> inside a Mux wrapper or direct embed — treat as Mux
            console.log("[Detector] ✅ <video> element detected — treating as Mux.");
            return resolve("mux");
          }

          if (tag === "iframe") {
            if (src.includes("youtube.com") || src.includes("youtu.be")) {
              console.log("[Detector] ✅ YouTube iframe detected.");
              return resolve("youtube");
            }
            if (src.includes("loom.com")) {
              console.log("[Detector] ✅ Loom iframe detected.");
              return resolve("loom");
            }
            // Should never reach here given the strict selector,
            // but guard just in case.
            console.warn(`[Detector] ⚠️ Matched iframe with unexpected src: ${src}`);
            return resolve(null);
          }

          console.warn("[Detector] ⚠️ Unrecognised player element.");
          return resolve(null);
        }

        // ── Timeout guard ─────────────────────────────────────
        if (elapsed >= MAX_POLL_MS) {
          clearInterval(poll);
          console.warn(
            "[Detector] ⚠️ No media player found after " +
            MAX_POLL_MS / 1000 +
            " s. Stripe/payment iframes were excluded."
          );
          resolve(null);
        }
      }, POLL_INTERVAL_MS);
    });
  }

  // Expose globally so content.js can call it
  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.detectPlayer = detectPlayer;
})();
