/**
 * content.js
 * ----------
 * Main orchestrator for the Skool Video Automation extension.
 *
 * Responsibilities:
 *   1. Inject a floating "Run Automation" button into the page.
 *   2. Prompt the user for a file prefix and number of pages.
 *   3. Loop N times: detect player → route to handler → navigate via sidebar.
 *
 * Navigation uses Skool's sidebar lesson list (not generic "Next" text),
 * matching the proven approach from the original monolithic script.
 */

(() => {
  "use strict";

  const SA = window.__SkoolAutomation;

  // ── Config ─────────────────────────────────────────────────────
  const PAGE_SETTLE_MAX_MS = 8000;   // max wait for SPA page transition
  const PAGE_SETTLE_POLL_MS = 300;   // poll interval during settle
  const POST_CLICK_DELAY_MS = 1500;  // delay after clicking next lesson

  // ══════════════════════════════════════════════════════════════
  //  1. Inject Floating Button
  // ══════════════════════════════════════════════════════════════

  function injectButton() {
    if (document.getElementById("skool-auto-btn")) return;

    const btn = document.createElement("button");
    btn.id = "skool-auto-btn";
    btn.textContent = "▶ Run Automation";

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "999999",
      padding: "12px 22px",
      fontSize: "14px",
      fontWeight: "700",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#fff",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(99, 102, 241, 0.45)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.05)";
      btn.style.boxShadow = "0 6px 28px rgba(99, 102, 241, 0.6)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.45)";
    });

    btn.addEventListener("click", onRunClicked);
    document.body.appendChild(btn);
    console.log("[Automation] ✅ Floating button injected.");
  }

  // ══════════════════════════════════════════════════════════════
  //  2. User Input & Main Loop
  // ══════════════════════════════════════════════════════════════

  async function onRunClicked() {
    // ── Prompt for inputs ────────────────────────────────────────
    const prefix = prompt("Enter a File Prefix Name (e.g. Hermes):");
    if (!prefix) {
      console.log("[Automation] ❌ Cancelled — no prefix provided.");
      return;
    }

    const pagesRaw = prompt("Enter the Number of Pages to process:");
    const totalPages = parseInt(pagesRaw, 10);
    if (isNaN(totalPages) || totalPages < 1) {
      console.log("[Automation] ❌ Invalid page count.");
      return;
    }

    console.log(
      `[Automation] 🚀 Starting — Prefix: "${prefix}" | Pages: ${totalPages}`
    );

    // ── Main processing loop ─────────────────────────────────────
    for (let i = 1; i <= totalPages; i++) {
      const fileName = `${prefix}_Lesson_${i}`;
      console.log(
        `\n[Automation] ──── Page ${i} of ${totalPages} ────`
      );

      // Step B: Detect the player
      const playerType = await SA.detectPlayer();

      // Step C: Route to the appropriate handler
      if (playerType === "mux") {
        SA.handleMux(fileName);
      } else if (playerType === "youtube") {
        SA.handleYouTube(fileName);
      } else if (playerType === "loom") {
        SA.handleLoom(fileName);
      } else {
        console.warn(
          `[Automation] ⚠️ No player detected on page ${i}. Skipping handler.`
        );
      }

      // Step D: Navigate to the next page (skip on last iteration)
      if (i < totalPages) {
        const navigated = await navigateToNextLesson();
        if (!navigated) {
          console.error(
            `[Automation] ❌ Could not navigate to page ${i + 1}. Stopping.`
          );
          break;
        }
      }
    }

    console.log("[Automation] 🏁 All pages processed. Done.");
  }

  // ══════════════════════════════════════════════════════════════
  //  3. Skool Sidebar Navigation
  // ══════════════════════════════════════════════════════════════

  /**
   * Navigate to the next lesson using Skool's sidebar.
   *
   * Detection strategy:
   *   1. Query all lesson rows via the known Skool class `.sc-4fca386d-6`.
   *   2. Find the active one by its highlighted background colour
   *      (rgb(248, 212, 129)) or aria-selected="true".
   *   3. Click the next row.
   *   4. Hard-sleep 4 s — enough for React to finish its route transition
   *      and lazy-load the new lesson content.
   *
   * @returns {Promise<boolean>} true if a click was fired, false otherwise.
   */
  async function navigateToNextLesson() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // Step 1: All sidebar lesson rows
    const lessons = Array.from(
      document.querySelectorAll(".sc-4fca386d-6")
    );

    if (lessons.length === 0) {
      console.warn(
        "[Navigation] ⚠️ No sidebar lesson rows (.sc-4fca386d-6) found."
      );
      return false;
    }

    console.log(`[Navigation] 📋 ${lessons.length} sidebar rows found.`);

    // Step 2: Find the currently active lesson
    const currentIndex = lessons.findIndex((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      const isHighlighted = bg === "rgb(248, 212, 129)";
      const isAriaSelected = el.getAttribute("aria-selected") === "true";
      return isHighlighted || isAriaSelected;
    });

    if (currentIndex === -1) {
      console.warn(
        "[Navigation] ⚠️ Cannot find the active lesson row. " +
        "(No yellow background or aria-selected=true found.)"
      );
      return false;
    }

    console.log(
      `[Navigation] 📍 Active lesson index: ${currentIndex} / ${lessons.length - 1}`
    );

    if (currentIndex >= lessons.length - 1) {
      console.warn("[Navigation] ⚠️ Already at the last lesson.");
      return false;
    }

    // Step 3: Click the next lesson row
    const nextLesson = lessons[currentIndex + 1];
    console.log(
      `[Navigation] 🔗 Clicking next lesson (index ${currentIndex + 1})…`
    );
    nextLesson.click();

    // Step 4: Hard sleep — let the SPA route transition and lazy-load
    console.log("[Navigation] ⏳ Waiting 4 s for SPA to load new lesson…");
    await sleep(4000);
    console.log("[Navigation] ✅ Hard sleep done — proceeding to detection.");

    return true;
  }

  // ══════════════════════════════════════════════════════════════
  //  Boot
  // ══════════════════════════════════════════════════════════════

  injectButton();
})();
