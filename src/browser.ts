/**
 * Browser-Specific Entry Point for Legal Markdown Processing
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
 *
 * @module
 */

import { parseYamlFrontMatter } from './core/parsers/yaml-parser';
import { processHeaders } from './core/processors/header-processor';
import { processOptionalClauses } from './core/processors/clause-processor';
import { processCrossReferences } from './core/processors/reference-processor';
import { processMixins } from './extensions/ast-mixin-processor';
import { processTemplateLoops } from './extensions/template-loops';
// Import with fallback for browser environments
let convertRstToLegalMarkdownSync: (content: string) => string;
let convertLatexToLegalMarkdownSync: (content: string) => string;

// Browser-safe fallback implementations
// These are set as fallbacks since pandoc-wasm may not be available in all browser environments
convertRstToLegalMarkdownSync = (content: string) => {
  // In browser environments, RST parsing requires pandoc-wasm which may not be available
  // Return content unchanged as fallback
  return content;
};

convertLatexToLegalMarkdownSync = (content: string) => {
  // In browser environments, LaTeX parsing requires pandoc-wasm which may not be available
  // Return content unchanged as fallback
  return content;
};

// Try to load parsers if available (Node.js or bundled environments)
if (typeof window === 'undefined') {
  // Node.js environment - try to load actual parsers
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rstParser = require('./extensions/rst-parser');
    convertRstToLegalMarkdownSync = rstParser.convertRstToLegalMarkdownSync;
  } catch (error) {
    // Keep fallback
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const latexParser = require('./extensions/latex-parser');
    convertLatexToLegalMarkdownSync = latexParser.convertLatexToLegalMarkdownSync;
  } catch (error) {
    // Keep fallback
  }
}
import { fieldTracker } from './extensions/tracking/field-tracker';
import { logger } from './utils/logger';
import { LegalMarkdownOptions } from './types';
// Placeholder functions for Remark processing - will be replaced with actual implementations
// These are fallback implementations that use the basic processor
function processLegalMarkdownWithRemark(content: string, options: any = {}): Promise<any> {
  console.warn(
    'Using fallback processor - Remark functions not fully implemented in browser bundle'
  );
  return Promise.resolve(processLegalMarkdown(content, options));
}

function processLegalMarkdownWithRemarkSync(content: string, options: any = {}): any {
  console.warn(
    'Using fallback processor - Remark functions not fully implemented in browser bundle'
  );
  return processLegalMarkdown(content, options);
}

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
  // Configure debug logging
  if (options.debug) {
    logger.setDebugEnabled(true);
    logger.debug('Debug mode enabled for Legal Markdown processing', { options });
  } else {
    logger.setDebugEnabled(false);
  }

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
  logger.debug('YAML front matter parsed', {
    metadata,
    yamlVariables: Object.keys(metadata || {}).length,
  });

  // If only processing YAML, return early
  if (options.yamlOnly) {
    logger.debug('YAML-only processing mode: returning content without variable substitution');
    return { content: contentWithoutYaml, metadata };
  }

  let processedContent = contentWithoutYaml;
  logger.debug('Starting content processing', { contentLength: processedContent.length });

  // Process optional clauses
  if (!options.noClauses) {
    logger.debug('Processing optional clauses');
    processedContent = processOptionalClauses(processedContent, metadata);
  } else {
    logger.debug('Skipping optional clauses processing');
  }

  // Process cross references
  if (!options.noReferences) {
    logger.debug('Processing cross references');
    processedContent = processCrossReferences(processedContent, metadata);
  } else {
    logger.debug('Skipping cross references processing');
  }

  // Process mixins (using improved AST-based processor)
  if (!options.noMixins) {
    logger.debug('Processing mixins and template variables with AST-based processor');
    processedContent = processMixins(processedContent, metadata, options);
  } else {
    logger.debug('Skipping mixins processing');
  }

  // Process template loops (using improved processor)
  logger.debug('Processing template loops');
  processedContent = processTemplateLoops(
    processedContent,
    metadata,
    undefined,
    options.enableFieldTrackingInMarkdown || false
  );

  // Process headers (numbering, etc)
  if (!options.noHeaders) {
    logger.debug('Processing headers and numbering');
    processedContent = processHeaders(processedContent, metadata, {
      noReset: options.noReset,
      noIndent: options.noIndent,
      enableFieldTrackingInMarkdown: options.enableFieldTrackingInMarkdown,
    });
  } else {
    logger.debug('Skipping headers processing');
  }

  // Apply field tracking to content if highlighting is enabled
  if (options.enableFieldTracking) {
    logger.debug('Applying field tracking to content');
    processedContent = fieldTracker.applyFieldTracking(processedContent);
  }

  const fieldReport = options.enableFieldTracking ? fieldTracker.generateReport() : undefined;
  logger.debug('Legal Markdown processing completed', {
    outputLength: processedContent.length,
    fieldsTracked: fieldReport?.total || 0,
    yamlVariables: Object.keys(metadata || {}).length,
  });

  return {
    content: processedContent,
    metadata,
    fieldReport,
  };
}

/**
 * UMD-compatible export object for browser environments
 *
 * This object will be automatically exported by webpack as UMD.
 * No manual window assignment needed - webpack handles this.
 *
 * @example
 * ```typescript
 * // UMD/Script tag usage
 * const result = window.LegalMarkdown.processLegalMarkdown(content);
 * ```
 */
const LegalMarkdown = {
  processLegalMarkdown,
  processLegalMarkdownWithRemark,
  processLegalMarkdownWithRemarkSync,
};

// Export as default for webpack UMD to handle
export default LegalMarkdown;
