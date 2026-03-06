/**
 * Runtime loader for the pre-built Legal Markdown browser bundle.
 * This file lives in /public so it is served as-is (bypassing Vite's
 * import-analysis restrictions). The browser resolves all relative
 * chunk imports natively via HTTP.
 *
 * Note: Buffer polyfill is handled inside the library bundle itself
 * (src/browser-modern.ts), so no manual polyfill is needed here.
 */

import * as lib from '/legal-markdown-browser.js';
window.LegalMarkdown = lib.default ?? lib;
