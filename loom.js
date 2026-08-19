/**
 * loom.js
 * -------
 * Handler for Loom players. Phase 1: styled console output only.
 *
 * Exposed globals:
 *   window.__SkoolAutomation.handleLoom(fileName, link)
 */

(() => {
  "use strict";

  function handleLoom(fileName, link) {
    console.clear();
    console.log('%cPlayer = Loom', 'color: #625df5; font-size: 20px; font-weight: bold;');
    console.log('%cLink = ' + link, 'color: #2196F3; font-size: 16px; font-weight: bold;');
  }

  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.handleLoom = handleLoom;
})();
