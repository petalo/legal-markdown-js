/**
 * Modern Browser Entry Point for Legal Markdown Processing
 *
 * This module provides a browser-optimized version that uses the full
 * remark-based processing pipeline. It requires a modern bundler (Vite)
 * that can handle ESM dependencies properly.
 *
 * Features:
 * - Full remark AST-based processing
 * - All Legal Markdown syntax support
 * - Async-only API for better performance
 * - No legacy fallbacks
 *
 * @module browser-modern
 */

// Import the remark-based processor
import {
  processLegalMarkdownWithRemark,
  LegalMarkdownProcessorOptions,
  LegalMarkdownProcessorResult,
} from './extensions/remark/legal-markdown-processor';

// Re-export the types for convenience
export type { LegalMarkdownProcessorOptions, LegalMarkdownProcessorResult };

/**
 * Process Legal Markdown content using the modern remark pipeline
 *
 * This is the primary API for browser usage. It provides full feature
 * parity with the CLI version, including all syntax features and
 * processing capabilities.
 *
 * @param content - The Legal Markdown content to process
 * @param options - Processing options
 * @returns Promise resolving to processed content and metadata
 *
 * @example
 * ```typescript
 * const result = await processLegalMarkdown(content, {
 *   enableFieldTracking: true,
 *   debug: false
 * });
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // Extracted metadata
 * ```
 */
export async function processLegalMarkdown(
  content: string,
  options: LegalMarkdownProcessorOptions = {}
): Promise<LegalMarkdownProcessorResult> {
  return processLegalMarkdownWithRemark(content, options);
}

/**
 * Legacy sync API - throws error with migration instructions
 *
 * This function exists only to provide a clear migration path for
 * users of the old synchronous API.
 *
 * @deprecated Use the async processLegalMarkdown() instead
 * @throws Error with migration instructions
 */
export function processLegalMarkdownSync(): never {
  throw new Error(
    'Synchronous processing is no longer supported in the browser version. ' +
      'Please use processLegalMarkdown() which returns a Promise:\n\n' +
      'const result = await processLegalMarkdown(content, options);\n\n' +
      'This change enables full feature parity with the CLI version.'
  );
}

/**
 * Default export for UMD compatibility
 *
 * Provides the modern API in a format compatible with script tags
 * and legacy module systems.
 */
const LegalMarkdown = {
  processLegalMarkdown,
  processLegalMarkdownSync,

  // Also export with explicit names for clarity
  processLegalMarkdownWithRemark,
  process: processLegalMarkdown,

  // Version info
  version: '2.16.3',
  isModernBundle: true,
};

// For debugging - log when bundle is loaded
if (typeof window !== 'undefined' && (window as any).DEBUG_LEGAL_MARKDOWN) {
  console.log('[Legal Markdown] Modern browser bundle loaded', {
    version: LegalMarkdown.version,
    features: [
      'remark AST processing',
      'legal headers (l., ll., lll.)',
      'template fields ({{variable}})',
      'template loops ({{#array}}...{{/array}})',
      'conditional blocks ({{#if}}...{{/if}})',
      'bracket conditionals ([text]{condition})',
      'date helpers (@today)',
      'cross-references',
      'mixins',
      'field tracking',
    ],
  });
}

export default LegalMarkdown;
