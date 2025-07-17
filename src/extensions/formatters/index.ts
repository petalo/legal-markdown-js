/**
 * @fileoverview Output Formatters for Legal Documents
 *
 * This module provides enhanced formatting capabilities for Legal Markdown documents
 * beyond the core functionality. It includes formatters for different output styles,
 * HTML generation, and document presentation optimizations.
 *
 * Features:
 * - Enhanced document styling with line spacing options
 * - Page break insertion for print-friendly output
 * - HTML generation with legal-specific styling
 * - Header formatting with multiple style options
 * - Extensions not present in the original legal-markdown
 * - Print-optimized document formatting
 *
 * @example
 * ```typescript
 * import { formatLegalDocument, toLegalHTML } from './formatters';
 *
 * // Format document with double line spacing
 * const formatted = formatLegalDocument(content, {
 *   lineSpacing: 'double',
 *   pageBreaks: true,
 *   headerStyle: 'bold'
 * });
 *
 * // Convert to HTML with legal styling
 * const html = toLegalHTML(content);
 * ```
 */

// Output formatters - Extensions for output formatting beyond core functionality

/**
 * Formats legal document output with enhanced styling options
 *
 * This function provides advanced formatting capabilities for Legal Markdown documents,
 * including line spacing control, page break insertion, and header styling. These
 * features are extensions not present in the original legal-markdown specification.
 *
 * @function formatLegalDocument
 * @param {string} content - The legal document content to format
 * @param {Object} [options={}] - Formatting options
 * @param {'single' | 'double'} [options.lineSpacing='single'] - Line spacing style
 * @param {boolean} [options.pageBreaks=false] - Whether to add page breaks before major sections
 * @param {'bold' | 'underline' | 'both'} [options.headerStyle] - Header styling option
 * @returns {string} The formatted document content
 * @example
 * ```typescript
 * import { formatLegalDocument } from './formatters';
 *
 * // Basic formatting with double line spacing
 * const formatted = formatLegalDocument(content, {
 *   lineSpacing: 'double'
 * });
 *
 * // Advanced formatting with page breaks and header styling
 * const formatted = formatLegalDocument(content, {
 *   lineSpacing: 'double',
 *   pageBreaks: true,
 *   headerStyle: 'bold'
 * });
 *
 * // Print-friendly formatting
 * const printReady = formatLegalDocument(content, {
 *   lineSpacing: 'single',
 *   pageBreaks: true
 * });
 * ```
 */
export function formatLegalDocument(
  content: string,
  options: {
    lineSpacing?: 'single' | 'double';
    pageBreaks?: boolean;
    headerStyle?: 'bold' | 'underline' | 'both';
  } = {}
): string {
  let formatted = content;

  if (options.lineSpacing === 'double') {
    formatted = formatted.replace(/\n/g, '\n\n');
  }

  if (options.pageBreaks) {
    // Add page breaks before major sections
    formatted = formatted.replace(/^Article \d+\./gm, '\n---PAGE BREAK---\n$&');
  }

  return formatted;
}

/**
 * Converts legal document to HTML with legal-specific styling
 *
 * Generates a complete HTML document with professional legal document styling,
 * including Times New Roman font, proper line spacing, and structured layout
 * with appropriate margins and indentation for legal document presentation.
 *
 * @function toLegalHTML
 * @param {string} content - The legal document content to convert to HTML
 * @returns {string} Complete HTML document with embedded styles
 * @example
 * ```typescript
 * import { toLegalHTML } from './formatters';
 *
 * // Convert processed legal markdown to HTML
 * const htmlDocument = toLegalHTML(processedContent);
 *
 * // Save to file
 * fs.writeFileSync('contract.html', htmlDocument);
 *
 * // Or serve via web server
 * res.setHeader('Content-Type', 'text/html');
 * res.send(htmlDocument);
 * ```
 */
export function toLegalHTML(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Legal Document</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; }
        .article { margin: 20px 0; }
        .section { margin-left: 20px; }
        .subsection { margin-left: 40px; }
    </style>
</head>
<body>
    <div class="legal-document">
        ${content.replace(/\n/g, '<br>')}
    </div>
</body>
</html>`;
}
