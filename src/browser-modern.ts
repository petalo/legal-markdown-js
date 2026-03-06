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

// Polyfill Buffer for browser environments.
// `globalThis` is typed without a `Buffer` property in browser typings, so the
// cast to `Record<string, unknown>` is required to assign it at runtime without
// a TypeScript error. The guard ensures we never overwrite a natively available
// Buffer (e.g. in Node.js or a bundler that already provides one).
import { Buffer as BufferPolyfill } from 'buffer';
const browserGlobal = globalThis as unknown as { Buffer?: unknown };
if (typeof browserGlobal.Buffer === 'undefined') {
  browserGlobal.Buffer = BufferPolyfill;
}

// Import the remark-based processor
import {
  processLegalMarkdown as processLegalMarkdownCore,
  LegalMarkdownProcessorOptions,
  LegalMarkdownProcessorResult,
} from './extensions/remark/legal-markdown-processor';

// Import shared HTML formatting utilities (browser-compatible)
import { markdownToHtmlBody, formatHtml, wrapHtmlDocument } from './utils/html-format';

import { generateDocxBuffer } from './extensions/generators/docx-browser';
export type { DocxBrowserOptions } from './extensions/generators/docx-browser';
export { generateDocxBuffer };

declare const __LEGAL_MARKDOWN_VERSION__: string;

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
export async function processLegalMarkdownAsync(
  content: string,
  options: LegalMarkdownProcessorOptions = {}
): Promise<LegalMarkdownProcessorResult> {
  return processLegalMarkdownCore(content, options);
}

export const processLegalMarkdown = processLegalMarkdownAsync;

/**
 * Default export for UMD compatibility
 *
 * Provides the modern API in a format compatible with script tags
 * and legacy module systems.
 */
const LegalMarkdown = {
  processLegalMarkdownAsync,
  processLegalMarkdown,
  process: processLegalMarkdownAsync,

  // HTML formatting utilities (shared with Node pipeline)
  markdownToHtmlBody,
  formatHtml,
  wrapHtmlDocument,
  generateDocxBuffer,

  // Version info
  version: __LEGAL_MARKDOWN_VERSION__,
  isModernBundle: true,
};

export default LegalMarkdown;
