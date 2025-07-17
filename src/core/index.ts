/**
 * @fileoverview Core Legal Markdown Processing Module
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
 *
 * @example
 * ```typescript
 * import {
 *   parseYamlFrontMatter,
 *   processHeaders,
 *   processOptionalClauses,
 *   processCrossReferences
 * } from './core';
 *
 * // Use core processors in a custom pipeline
 * const { content, metadata } = parseYamlFrontMatter(rawContent);
 * const processed = processHeaders(content, metadata);
 * ```
 */

export * from './parsers/yaml-parser';
export * from './processors/header-processor';
export * from './processors/clause-processor';
export * from './processors/reference-processor';
export * from './processors/import-processor';
export * from './processors/mixin-processor';
export * from './processors/date-processor';
export * from './exporters/metadata-exporter';
