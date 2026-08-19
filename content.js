/**
 * content.js
 * ----------
 * Main orchestrator for the Skool Video Automation extension.
 *
 * Loop: detect player → route to styled handler → navigate via sidebar.
 *
 * IMPORTANT: window.__SkoolAutomation is looked up lazily (inside each
 * async call) rather than captured once at IIFE load time. This avoids
 * the race condition where content.js executes before the other scripts
 * have finished registering their functions on the global namespace.
 */

(() => {
  "use strict";

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
  }

  // ══════════════════════════════════════════════════════════════
  //  2. User Input & Main Loop
  // ══════════════════════════════════════════════════════════════

  async function onRunClicked() {
    const prefix = prompt("Enter a File Prefix Name (e.g. Hermes):");
    if (!prefix) return;

    const pagesRaw = prompt("Enter the Number of Pages to process:");
    const totalPages = parseInt(pagesRaw, 10);
    if (isNaN(totalPages) || totalPages < 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const fileName = `${prefix}_Lesson_${i}`;

      // ── Lazy lookup — safe even if scripts registered milliseconds apart
      const SA = window.__SkoolAutomation;
      if (!SA || typeof SA.detectPlayer !== "function") {
        console.error("[Automation] window.__SkoolAutomation not ready. Reload the page.");
        break;
      }

      // Detect — returns { name, link }
      const { name, link } = await SA.detectPlayer();

      // Route to the correct styled handler
      const n = name.toLowerCase();
      if (n.includes("youtube")) {
        SA.handleYouTube(fileName, link);
      } else if (n.includes("loom")) {
        SA.handleLoom(fileName, link);
      } else if (n.includes("mux")) {
        SA.handleMux(fileName, link);
      }
      // UNKNOWN: no output — console stays clean

      // Navigate (skip on last page)
      if (i < totalPages) {
        const ok = await navigateToNextLesson();
        if (!ok) break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  3. Skool Sidebar Navigation
  // ══════════════════════════════════════════════════════════════

  async function navigateToNextLesson() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const lessons = Array.from(document.querySelectorAll(".sc-4fca386d-6"));
    if (lessons.length === 0) return false;

    const currentIndex = lessons.findIndex((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      return (
        bg === "rgb(248, 212, 129)" ||
        el.getAttribute("aria-selected") === "true"
      );
    });

    if (currentIndex === -1 || currentIndex >= lessons.length - 1) return false;

    lessons[currentIndex + 1].click();
    await sleep(4000);
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  //  Boot
  // ══════════════════════════════════════════════════════════════

  injectButton();
})();
