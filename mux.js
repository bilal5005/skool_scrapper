/**
 * mux.js
 * ------
 * Handler for Mux Video players. Phase 1: styled console output only.
 *
 * Exposed globals:
 *   window.__SkoolAutomation.handleMux(fileName, link)
 */

(() => {
  "use strict";

  function handleMux(fileName, link) {
    console.clear();
    console.log('%cPlayer = Mux Video', 'color: #fb3b41; font-size: 20px; font-weight: bold;');
    console.log('%cLink = ' + link,     'color: #2196F3; font-size: 16px; font-weight: bold;');
    console.log('%cyt-dlp Command:',    'color: #4CAF50; font-weight: bold; margin-top: 10px;');
    console.log('yt-dlp "' + link + '"');
  }

  window.__SkoolAutomation = window.__SkoolAutomation || {};
  window.__SkoolAutomation.handleMux = handleMux;
})();
