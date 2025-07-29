/**
 * Core constants for Legal Markdown processing
 *
 * This module contains fundamental constants for document processing,
 * including default options, supported formats, and error codes.
 */

/**
 * Default options for Legal Markdown processing
 * @example
 * ```typescript
 * import { DEFAULT_OPTIONS } from './constants';
 *
 * // Use default options
 * const options = { ...DEFAULT_OPTIONS, debug: true };
 *
 * // Override specific options
 * const customOptions = {
 *   ...DEFAULT_OPTIONS,
 *   yamlOnly: true,
 *   exportMetadata: true,
 *   exportFormat: 'json' as const
 * };
 * ```
 */
export const DEFAULT_OPTIONS = {
  /** Process only YAML frontmatter, skip content processing */
  yamlOnly: false,
  /** Skip processing of header structures */
  noHeaders: false,
  /** Skip processing of optional clauses */
  noClauses: false,
  /** Skip processing of cross-references */
  noReferences: false,
  /** Skip processing of import statements */
  noImports: false,
  /** Export metadata to external files */
  exportMetadata: false,
  /** Format for metadata export */
  exportFormat: 'yaml' as const,
  /** Enable debug logging */
  debug: false,
  /** Throw errors on YAML parsing failures */
  throwOnYamlError: false,
};

/**
 * Supported file formats for input and export operations
 * @example
 * ```typescript
 * import { SUPPORTED_FORMATS } from './constants';
 *
 * // Check if format is supported for export
 * const isExportSupported = SUPPORTED_FORMATS.EXPORT.includes('yaml');
 *
 * // Check if input format is supported
 * const isInputSupported = SUPPORTED_FORMATS.INPUT.includes('md');
 * ```
 */
export const SUPPORTED_FORMATS = {
  /** Supported export formats */
  EXPORT: ['yaml', 'json'] as const,
  /** Supported input formats */
  INPUT: ['md', 'markdown'] as const,
} as const;

/**
 * File extensions for different document types
 * @example
 * ```typescript
 * import { FILE_EXTENSIONS } from './constants';
 *
 * // Check if file is markdown
 * const isMarkdown = FILE_EXTENSIONS.MARKDOWN.includes(path.extname(filename));
 *
 * // Check if file is YAML
 * const isYaml = FILE_EXTENSIONS.YAML.includes(path.extname(filename));
 * ```
 */
export const FILE_EXTENSIONS = {
  /** Markdown file extensions */
  MARKDOWN: ['.md', '.markdown'],
  /** YAML file extensions */
  YAML: ['.yml', '.yaml'],
  /** JSON file extensions */
  JSON: ['.json'],
} as const;

/**
 * Error codes for consistent error handling throughout the system
 * @example
 * ```typescript
 * import { ERROR_CODES } from './constants';
 *
 * // Use error codes in custom errors
 * throw new Error(ERROR_CODES.YAML_PARSING_ERROR);
 *
 * // Check error codes in error handling
 * if (error.code === ERROR_CODES.FILE_NOT_FOUND) {
 *   // Handle file not found error
 * }
 * ```
 */
export const ERROR_CODES = {
  /** YAML parsing error code */
  YAML_PARSING_ERROR: 'YAML_PARSING_ERROR',
  /** File not found error code */
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  /** Import processing error code */
  IMPORT_PROCESSING_ERROR: 'IMPORT_PROCESSING_ERROR',
  /** Metadata export error code */
  METADATA_EXPORT_ERROR: 'METADATA_EXPORT_ERROR',
  /** Validation error code */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** General processing error code */
  PROCESSING_ERROR: 'PROCESSING_ERROR',
} as const;
