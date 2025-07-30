/**
 * Browser bundle entry point for Legal Markdown
 * This file creates a browser-compatible version of the legal-markdown library
 */

// Import the main library (ESM syntax)
import { processLegalMarkdown, processLegalMarkdownWithRemark, processLegalMarkdownWithRemarkSync } from '../index.js';

// Create a browser-compatible API
window.LegalMarkdown = {
    processLegalMarkdown: processLegalMarkdown,
    processLegalMarkdownWithRemark: processLegalMarkdownWithRemark,
    processLegalMarkdownWithRemarkSync: processLegalMarkdownWithRemarkSync
};

// Export for CommonJS environments too
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LegalMarkdown;
}