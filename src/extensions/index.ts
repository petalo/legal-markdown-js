/**
 * @fileoverview Extensions Module - Enhanced Legal Markdown Functionality
 *
 * This module provides additional functionality beyond the original legal-markdown
 * specification. It includes Node.js specific enhancements, utilities, and tools
 * for extended document processing, validation, and format conversion.
 *
 * Features:
 * - Document validation and structure checking
 * - Enhanced output formatting and styling
 * - Utility functions for document analysis
 * - Batch processing capabilities for multiple files
 * - LaTeX document conversion support
 * - reStructuredText document conversion support
 * - Template loops for array iteration and conditional blocks
 * - Node.js specific enhancements and optimizations
 *
 * @example
 * ```typescript
 * import {
 *   validateDocumentStructure,
 *   formatLegalDocument,
 *   analyzeDocument,
 *   processBatch,
 *   convertLatexToLegalMarkdown,
 *   convertRstToLegalMarkdown,
 *   processTemplateLoops
 * } from './extensions';
 *
 * // Validate document structure
 * const validation = validateDocumentStructure(content);
 *
 * // Format document output
 * const formatted = formatLegalDocument(content, { lineSpacing: 'double' });
 *
 * // Analyze document statistics
 * const stats = analyzeDocument(content);
 *
 * // Process multiple files
 * const result = await processBatch({
 *   inputDir: './documents',
 *   outputDir: './output'
 * });
 * ```
 */

// Extensions - Additional functionality beyond original legal-markdown
// These are Node.js specific enhancements and utilities

export * from './validators';
export * from './formatters';
export * from './utilities';
export * from './batch-processor';
export * from './rst-parser';
export * from './latex-parser';
export * from './template-loops';
