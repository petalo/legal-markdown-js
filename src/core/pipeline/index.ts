/**
 * Pipeline Architecture - 4-Phase Processing System
 *
 * This module provides a modern, incremental processing pipeline for Legal Markdown
 * that eliminates duplicate processing and improves performance.
 *
 * Architecture:
 * - **Phase 1 (Context Building)**: Parse document, resolve force-commands, create context
 * - **Phase 2 (String Transformations)**: Apply string-level transformations before AST parsing
 * - **Phase 3 (AST Processing)**: Run remark pipeline once, cache result
 * - **Phase 4 (Format Generation)**: Generate all output formats from cached result
 *
 * Benefits:
 * - Single pipeline run regardless of output formats
 * - ~75% reduction in processing time for multi-format output
 * - Clean separation of concerns
 * - Better error handling and debugging
 * - Compatible with existing force-commands feature
 *
 * @see docs/architecture/03_processing_pipeline.md
 * @see docs/architecture/string-transformations.md
 * @module core/pipeline
 */

// Phase 1: Context Building
export {
  buildProcessingContext,
  mergeMetadata,
  validateProcessingContext,
} from './context-builder';
export type { ProcessingContext, ProcessingOptions } from '../../types';

// Phase 2: String Transformations
export { applyStringTransformations } from './string-transformations';

// Phase 3: AST Processing (uses existing legal-markdown-processor)
export { processLegalMarkdown } from '../../extensions/remark/legal-markdown-processor';
export type { LegalMarkdownProcessorResult } from '../../extensions/remark/legal-markdown-processor';

// Phase 4: Format Generation
export { generateAllFormats, buildFormatGenerationOptions } from './format-generator';
export type { FormatGenerationOptions, FormatGenerationResult } from './format-generator';
