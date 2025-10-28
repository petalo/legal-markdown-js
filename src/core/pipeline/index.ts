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
  ProcessingContext,
  ProcessingOptions,
} from './context-builder';

// Phase 2: String Transformations
export {
  applyStringTransformations,
  StringTransformationOptions,
  StringTransformationResult,
} from './string-transformations';

// Phase 3: AST Processing (uses existing legal-markdown-processor)
export {
  processLegalMarkdownWithRemark,
  LegalMarkdownProcessorResult,
} from '../../extensions/remark/legal-markdown-processor';

// Phase 4: Format Generation
export {
  generateAllFormats,
  processAndGenerateFormats,
  buildFormatGenerationOptions,
  FormatGenerationOptions,
  FormatGenerationResult,
} from './format-generator';

// Pipeline Builder (Phase-based plugin ordering)
export {
  buildRemarkPipeline,
  detectValidationMode,
  groupPluginsByPhase,
  validateCapabilities,
  OrderedPipeline,
  PipelineConfig,
  ValidationOptions,
} from './pipeline-builder';

// Preprocessor Adapters (String-based processing integration)
export {
  PreprocessorAdapter,
  PreprocessorPluginOptions,
  wrapPreprocessor,
} from './preprocessor-adapter';

export { templateLoopsAdapter, remarkTemplateLoops, TemplateLoopsOptions } from './loops-adapter';
