/**
 * @fileoverview Type Definitions for Legal Markdown Processing
 *
 * This module contains TypeScript interface definitions and type declarations
 * for the Legal Markdown processing system. It defines the structure for
 * configuration options, processing results, and internal data structures.
 *
 * Features:
 * - Processing configuration interfaces
 * - YAML front matter parsing result types
 * - Header processing option structures
 * - Import and export result definitions
 * - Metadata handling type definitions
 *
 * @example
 * ```typescript
 * import { LegalMarkdownOptions, YamlParsingResult } from './types';
 *
 * const options: LegalMarkdownOptions = {
 *   basePath: './documents',
 *   enableFieldTracking: true,
 *   exportFormat: 'yaml'
 * };
 *
 * const result: YamlParsingResult = {
 *   content: 'processed content',
 *   metadata: { title: 'Document Title' }
 * };
 * ```
 */

/**
 * Configuration options for processing Legal Markdown documents
 *
 * @interface LegalMarkdownOptions
 */
export interface LegalMarkdownOptions {
  /**
   * Base path for resolving imports
   */
  basePath?: string;

  /**
   * Process only YAML front matter
   */
  yamlOnly?: boolean;

  /**
   * Skip processing headers
   */
  noHeaders?: boolean;

  /**
   * Skip processing optional clauses
   */
  noClauses?: boolean;

  /**
   * Skip processing cross references
   */
  noReferences?: boolean;

  /**
   * Skip processing imports
   */
  noImports?: boolean;

  /**
   * Skip processing mixins
   */
  noMixins?: boolean;

  /**
   * Convert output to markdown format
   */
  toMarkdown?: boolean;

  /**
   * Export metadata to a file
   */
  exportMetadata?: boolean;

  /**
   * Format for metadata export (yaml or json)
   */
  exportFormat?: 'yaml' | 'json';

  /**
   * Path for metadata export
   */
  exportPath?: string;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Throw errors on invalid YAML instead of handling gracefully
   */
  throwOnYamlError?: boolean;

  /**
   * Disable header numbering reset (continuous numbering)
   */
  noReset?: boolean;

  /**
   * Disable header indentation (flat formatting)
   */
  noIndent?: boolean;

  /**
   * Enable field tracking for highlighting
   */
  enableFieldTracking?: boolean;
}

/**
 * Structure for YAML Front Matter parsing result
 *
 * @interface YamlParsingResult
 */
export interface YamlParsingResult {
  /**
   * Content without the YAML front matter
   */
  content: string;

  /**
   * Parsed metadata from YAML front matter
   */
  metadata: Record<string, any>;
}

/**
 * Structure for header processing options from metadata
 *
 * @interface HeaderOptions
 */
export interface HeaderOptions {
  /**
   * Format for level one headers
   */
  levelOne?: string;

  /**
   * Format for level two headers
   */
  levelTwo?: string;

  /**
   * Format for level three headers
   */
  levelThree?: string;

  /**
   * Format for level four headers
   */
  levelFour?: string;

  /**
   * Format for level five headers
   */
  levelFive?: string;

  /**
   * Indentation level for headers
   */
  levelIndent?: number;

  /**
   * Disable header numbering reset (continuous numbering)
   */
  noReset?: boolean;

  /**
   * Disable header indentation (flat formatting)
   */
  noIndent?: boolean;

  /**
   * Enable field tracking for header styling
   */
  enableFieldTracking?: boolean;
}

/**
 * Structure for import processing result
 *
 * @interface ImportProcessingResult
 */
export interface ImportProcessingResult {
  /**
   * Content with imports processed
   */
  content: string;

  /**
   * List of imported files
   */
  importedFiles: string[];
}

/**
 * Structure for metadata export result
 *
 * @interface MetadataExportResult
 */
export interface MetadataExportResult {
  /**
   * List of exported files
   */
  exportedFiles: string[];
}
