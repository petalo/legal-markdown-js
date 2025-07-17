/**
 * @fileoverview Browser-Specific Entry Point for Legal Markdown Processing
 *
 * This module provides a browser-compatible version of the Legal Markdown
 * processing library that excludes Node.js-specific features like file system
 * operations and PDF generation. It's optimized for web environments and
 * client-side processing.
 *
 * Features:
 * - YAML front matter parsing and metadata extraction
 * - Cross-reference processing and resolution
 * - Optional clause conditional rendering
 * - Mixin system for reusable content blocks
 * - Header numbering and formatting
 * - Field tracking for document highlighting
 * - RST and LaTeX preprocessing support
 * - UMD build compatibility for script tag usage
 *
 * @example
 * ```typescript
 * import { processLegalMarkdown } from 'legal-markdown-js/browser';
 *
 * // Browser-compatible document processing
 * const result = processLegalMarkdown(content, {
 *   enableFieldTracking: true,
 *   noClauses: false
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // YAML front matter
 * ```
 */

import { parseYamlFrontMatter } from '@core/parsers/yaml-parser';
import { processHeaders } from '@core/processors/header-processor';
import { processOptionalClauses } from '@core/processors/clause-processor';
import { processCrossReferences } from '@core/processors/reference-processor';
import { processMixins } from '@core/processors/mixin-processor';
// Import with fallback for browser environments
let convertRstToLegalMarkdownSync: (content: string) => string;
let convertLatexToLegalMarkdownSync: (content: string) => string;

try {
  const rstParser = require('@extensions/rst-parser');
  convertRstToLegalMarkdownSync = rstParser.convertRstToLegalMarkdownSync;
} catch (error) {
  // Fallback for browser environments without pandoc-wasm
  convertRstToLegalMarkdownSync = (content: string) => content;
}

try {
  const latexParser = require('@extensions/latex-parser');
  convertLatexToLegalMarkdownSync = latexParser.convertLatexToLegalMarkdownSync;
} catch (error) {
  // Fallback for browser environments without pandoc-wasm
  convertLatexToLegalMarkdownSync = (content: string) => content;
}
import { fieldTracker } from './tracking/field-tracker';
import { LegalMarkdownOptions } from '@types';

/**
 * Browser-compatible version of Legal Markdown processing
 *
 * This function provides the core Legal Markdown processing functionality
 * optimized for browser environments. It excludes Node.js-specific features
 * like file system operations while maintaining full compatibility with
 * YAML parsing, content processing, and field tracking.
 *
 * @param {string} content - The raw Legal Markdown content to process
 * @param {Omit<LegalMarkdownOptions, 'basePath' | 'exportPath'>} [options={}] - Browser-compatible configuration options
 * @returns {Object} Processing result containing processed content, metadata, and reports
 * @returns {string} returns.content - The processed document content
 * @returns {Record<string, any>} [returns.metadata] - Extracted YAML metadata
 * @returns {Object} [returns.fieldReport] - Field tracking report if enabled
 * @example
 * ```typescript
 * const result = processLegalMarkdown(content, {
 *   enableFieldTracking: true,
 *   noClauses: false,
 *   noReferences: false
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // YAML front matter
 * console.log(result.fieldReport); // Field usage report
 * ```
 */
export function processLegalMarkdown(
  content: string,
  options: Omit<LegalMarkdownOptions, 'basePath' | 'exportPath'> = {}
): {
  content: string;
  metadata?: Record<string, any>;
  fieldReport?: ReturnType<typeof fieldTracker.generateReport>;
} {
  // Clear field tracker for new document
  fieldTracker.clear();

  // Convert RST or LaTeX to legal markdown if needed (before YAML parsing)
  let preprocessedContent = convertRstToLegalMarkdownSync(content);
  preprocessedContent = convertLatexToLegalMarkdownSync(preprocessedContent);

  // Parse YAML Front Matter
  const { content: contentWithoutYaml, metadata } = parseYamlFrontMatter(
    preprocessedContent,
    options.throwOnYamlError
  );

  // If only processing YAML, return early
  if (options.yamlOnly) {
    return { content: contentWithoutYaml, metadata };
  }

  let processedContent = contentWithoutYaml;

  // Process optional clauses
  if (!options.noClauses) {
    processedContent = processOptionalClauses(processedContent, metadata);
  }

  // Process cross references
  if (!options.noReferences) {
    processedContent = processCrossReferences(processedContent, metadata);
  }

  // Process mixins
  if (!options.noMixins) {
    processedContent = processMixins(processedContent, metadata, options);
  }

  // Process headers (numbering, etc)
  if (!options.noHeaders) {
    processedContent = processHeaders(processedContent, metadata, {
      noReset: options.noReset,
      noIndent: options.noIndent,
      enableFieldTracking: options.enableFieldTracking,
    });
  }

  // Apply field tracking to content if highlighting is enabled
  if (options.enableFieldTracking) {
    processedContent = fieldTracker.applyFieldTracking(processedContent);
  }

  return {
    content: processedContent,
    metadata,
    fieldReport: options.enableFieldTracking ? fieldTracker.generateReport() : undefined,
  };
}

/**
 * UMD-compatible export object for browser environments
 *
 * This constant provides a namespace object that can be used in UMD builds
 * and script tag implementations, making the library accessible through
 * global window object or module systems.
 *
 * @constant {Object} LegalMarkdown
 * @example
 * ```typescript
 * // ES6 import
 * import { LegalMarkdown } from 'legal-markdown-js/browser';
 *
 * // UMD/Script tag usage
 * const result = window.LegalMarkdown.processLegalMarkdown(content);
 * ```
 */
export const LegalMarkdown = {
  processLegalMarkdown,
};

// Create global window object for script tag usage
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  (window as any).LegalMarkdown = LegalMarkdown;
}
