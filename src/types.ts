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
   * Enable field tracking for highlighting in HTML/PDF output
   * @deprecated Use enableFieldTrackingInMarkdown for markdown output
   */
  enableFieldTracking?: boolean;

  /**
   * Enable field tracking spans in markdown output
   * When false (default), maintains compatibility with Ruby version
   * When true, adds HTML spans for field tracking in markdown
   */
  enableFieldTrackingInMarkdown?: boolean;

  /**
   * Disable automatic frontmatter merging from imported files
   * When true, prevents frontmatter from imported files being merged into the main document's metadata
   * By default, frontmatter merging is enabled with "source always wins" strategy
   */
  disableFrontmatterMerge?: boolean;

  /**
   * Add import tracing comments to processed content
   * When true, adds HTML comments indicating the start/end of imported content
   * Useful for debugging import processing
   */
  importTracing?: boolean;

  /**
   * Validate type compatibility during frontmatter merging
   * When true, logs warnings for type conflicts between current and imported metadata
   */
  validateImportTypes?: boolean;

  /**
   * Log detailed information about frontmatter merge operations
   * When true, outputs detailed merge statistics and field tracking information
   */
  logImportOperations?: boolean;
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
   * Enable field tracking for header styling in HTML/PDF output
   * @deprecated Use enableFieldTrackingInMarkdown for markdown output
   */
  enableFieldTracking?: boolean;

  /**
   * Enable field tracking spans in markdown output for headers
   * When false (default), maintains compatibility with Ruby version
   * When true, adds HTML spans for field tracking in markdown
   */
  enableFieldTrackingInMarkdown?: boolean;
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

  /**
   * Merged metadata from all imported files
   * Available when frontmatter merging is enabled
   */
  mergedMetadata?: Record<string, any>;
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
