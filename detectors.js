/**
 * detectors.js
 * ------------
 * Universal video detector for the Skool Video Automation extension.
 *
 * Flow:
 *   A — Click the thumbnail overlay (forces Skool to inject the player).
 *   B — Hard 3-second wait for DOM hydration.
 *   C — Iframe pass: scan all iframes, match src against known domains.
 *   D — Mux/Video pass: check for <mux-player> or <video>.
 *   E — Fallback: { name: 'UNKNOWN', link: '' }
 *
 * Returns: { name: string, link: string }
 *
 * Exposed globals:
 *   window.__SkoolAutomation.detectPlayer()  → Promise<{name, link}>
 */

(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════════
  //  PLAYERS_CONFIG
  // ══════════════════════════════════════════════════════════════
  const PLAYERS_CONFIG = [
    {
      name: "YouTube",
      type: "iframe",
      domains: ["youtube.com", "youtu.be"],
      extractLink(src) {
        const match = src.match(
          /(?:youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
        );
        return match ? `https://youtu.be/${match[1]}` : src;
      },
    },
    {
      name: "Loom",
      type: "iframe",
      domains: ["loom.com"],
      extractLink(src) {
        return src.replace("/embed/", "/share/").split("?")[0];
      },
    },
    {
      name: "Mux Video",
      type: "native",
      domains: [],
      extractLink(el) {
        const playbackId =
          el.getAttribute("playback-id") ||
          el.getAttribute("data-playback-id");
        if (playbackId) return `https://stream.mux.com/${playbackId}.m3u8`;
        return el.src || el.getAttribute("src") || "";
      },
    },
  ];

  // ── Overlay selectors ──────────────────────────────────────────
  const OVERLAY_SELECTOR = [
    ".sc-da51c951-2.bsuokU",
    ".sc-f3f97a9f-5.vQCTc",
    ".sc-f3f97a9f-5.deKkeJ",
    '[class*="vQCTc"]',
  ].join(", ");

  // ══════════════════════════════════════════════════════════════
  //  detectPlayer
  // ══════════════════════════════════════════════════════════════
  async function detectPlayer() {
    // A — Universal auto-click
    document.querySelector(OVERLAY_SELECTOR)?.click();

    // B — Wait for DOM hydration
    await new Promise((res) => setTimeout(res, 3000));

    // C — Iframe pass (strict domains only — ignores Stripe / analytics)
    const iframes = Array.from(document.querySelectorAll("iframe"));
    for (const iframe of iframes) {
      const src = (iframe.src || "").toLowerCase();
      if (!src) continue;
      for (const config of PLAYERS_CONFIG) {
        if (config.type !== "iframe") continue;
        if (config.domains.some((d) => src.includes(d))) {
          const link = config.extractLink(iframe.src);
          return { name: config.name, link };
        }
      }
    }

    // D — Mux / native video pass
    const muxConfig = PLAYERS_CONFIG.find((c) => c.name === "Mux Video");
    const nativeEl = document.querySelector("mux-player, video");
    if (nativeEl) {
      return { name: "Mux Video", link: muxConfig.extractLink(nativeEl) };
    }

    // E — Fallback
    return { name: "UNKNOWN", link: "" };
  }

  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.detectPlayer = detectPlayer;
})();
