/**
 * Core Legal Markdown Processing Module
 *
 * This module provides the core functionality for Legal Markdown processing,
 * maintaining parity with the original legal-markdown implementation. It exports
 * all essential parsers, processors, and exporters needed for document processing.
 *
 * Features:
 * - YAML front matter parsing
 * - Header processing and numbering
 * - Optional clause conditional processing
 * - Cross-reference resolution
 * - Import processing for partial documents
 * - Mixin system for reusable content
 * - Date processing utilities
 * - Metadata export capabilities
 * - Base processor interfaces for pipeline management
 * - Core field tracking infrastructure
 *
 * @example
 * ```typescript
 * import {
 *   parseYamlFrontMatter,
 *   processHeaders,
 *   processOptionalClauses,
 *   processCrossReferences,
 *   BaseProcessor,
 *   FieldState
 * } from './core';
 *
 * // Use core processors in a custom pipeline
 * const { content, metadata } = parseYamlFrontMatter(rawContent);
 * const processed = processHeaders(content, metadata);
 *
 * // Implement a custom processor
 * class MyProcessor implements BaseProcessor {
 *   name = 'my-processor';
 *   isEnabled(options) { return true; }
 *   process(content, metadata, options) { return content; }
 * }
 * ```
 */

// Core parsers
export * from './parsers/yaml-parser';

// Core exporters
export * from './exporters/metadata-exporter';
export {
  FieldState,
  CoreFieldState,
  FieldStatus,
  TrackedField,
  FieldTrackingOptions,
} from './tracking/field-state';

// Core helpers (Ruby compatible)
export * from './helpers/index';
