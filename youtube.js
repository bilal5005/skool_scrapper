/**
 * youtube.js
 * ----------
 * Handler for YouTube players. Phase 1: styled console output only.
 *
 * Exposed globals:
 *   window.__SkoolAutomation.handleYouTube(fileName, link)
 */

(() => {
  "use strict";

  function handleYouTube(fileName, link) {
    console.clear();
    console.log('%cPlayer = YouTube', 'color: #ff0000; font-size: 20px; font-weight: bold;');
    console.log('%cLink = ' + link,   'color: #2196F3; font-size: 16px; font-weight: bold;');
  }

  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.handleYouTube = handleYouTube;
})();
