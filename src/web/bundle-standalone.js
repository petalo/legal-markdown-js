/**
 * Standalone bundle entry point for Legal Markdown
 * This creates a browser-compatible bundle that can be used without a server
 */

// Import the main library
const { processLegalMarkdown } = require('../index');

// Create a self-contained bundle for browsers
(function() {
    // Convert the async function to work in browser context
    window.LegalMarkdown = {
        processLegalMarkdown: async function(content, options = {}) {
            try {
                // Use the actual library
                return await processLegalMarkdown(content, options);
            } catch (error) {
                console.error('Legal Markdown processing error:', error);
                throw error;
            }
        }
    };
    
    // Also export for CommonJS if available
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.LegalMarkdown;
    }
})();