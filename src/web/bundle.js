/**
 * Browser bundle entry point for Legal Markdown
 * This file creates a browser-compatible version of the legal-markdown library
 */

// Import the main library
const { processLegalMarkdown } = require('../index');

// Create a browser-compatible API
window.LegalMarkdown = {
    processLegalMarkdown: processLegalMarkdown
};

// Export for CommonJS environments too
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LegalMarkdown;
}