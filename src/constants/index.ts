/**
 * @fileoverview Constants and Configuration for Legal Markdown Processing
 *
 * This module contains all the constants, regular expressions, and configuration
 * values used throughout the Legal Markdown processing system. It provides
 * centralized definitions for patterns, options, and supported formats.
 *
 * Features:
 * - Default processing options and configurations
 * - Regular expression patterns for parsing different markup elements
 * - Supported file formats and extensions
 * - Error codes for consistent error handling
 * - Constants for import, clause, and reference processing
 * - Type-safe constant definitions with 'as const' assertions
 *
 * @example
 * ```typescript
 * import { DEFAULT_OPTIONS, HEADER_PATTERNS, ERROR_CODES } from './constants';
 *
 * // Use default options
 * const options = { ...DEFAULT_OPTIONS, debug: true };
 *
 * // Use header patterns
 * const headerMatch = content.match(HEADER_PATTERNS.TRADITIONAL);
 *
 * // Use error codes
 * throw new Error(ERROR_CODES.YAML_PARSING_ERROR);
 * ```
 */

/**
 * Default options for Legal Markdown processing
 *
 * @constant {Object} DEFAULT_OPTIONS
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
 * Regular expression patterns for parsing header structures
 *
 * @constant {Object} HEADER_PATTERNS
 * @example
 * ```typescript
 * import { HEADER_PATTERNS } from './constants';
 *
 * // Match traditional headers: l. Section, ll. Subsection
 * const traditionalHeaders = content.match(HEADER_PATTERNS.TRADITIONAL);
 *
 * // Match alternative headers: l1. Section, l2. Subsection
 * const alternativeHeaders = content.match(HEADER_PATTERNS.ALTERNATIVE);
 * ```
 */
export const HEADER_PATTERNS = {
  /** Traditional header pattern: l. Section, ll. Subsection, etc. */
  TRADITIONAL: /^(l+)\.\s+(.*?)$/gm,
  /** Alternative header pattern: l1. Section, l2. Subsection, etc. */
  ALTERNATIVE: /^l(\d+)\.\s+(.*?)$/gm,
} as const;

/**
 * Regular expression patterns for parsing import statements
 *
 * @constant {Object} IMPORT_PATTERNS
 * @example
 * ```typescript
 * import { IMPORT_PATTERNS } from './constants';
 *
 * // Match partial imports: [[filename]]
 * const partialImports = content.match(IMPORT_PATTERNS.PARTIAL);
 *
 * // Match full file imports: @import filename
 * const fullImports = content.match(IMPORT_PATTERNS.FULL_FILE);
 * ```
 */
export const IMPORT_PATTERNS = {
  /** Partial import pattern: [[filename]] */
  PARTIAL: /\[\[(.*?)\]\]/g,
  /** Full file import pattern: @import filename */
  FULL_FILE: /^@import\s+(.+)$/gm,
} as const;

/**
 * Regular expression patterns for parsing optional and conditional clauses
 *
 * @constant {Object} CLAUSE_PATTERNS
 * @example
 * ```typescript
 * import { CLAUSE_PATTERNS } from './constants';
 *
 * // Match optional clauses: {{field.name}}
 * const optionalClauses = content.match(CLAUSE_PATTERNS.OPTIONAL);
 *
 * // Match conditional clauses: {{#if condition}}content{{/if}}
 * const conditionalClauses = content.match(CLAUSE_PATTERNS.CONDITIONAL);
 * ```
 */
export const CLAUSE_PATTERNS = {
  /** Optional clause pattern: {{field.name}} */
  OPTIONAL: /\{\{\s*([^}]+)\s*\}\}/g,
  /** Conditional clause pattern: {{#if condition}}content{{/if}} */
  CONDITIONAL: /\{\{\s*#if\s+([^}]+)\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g,
} as const;

/**
 * Regular expression patterns for parsing cross-references
 *
 * @constant {Object} REFERENCE_PATTERNS
 * @example
 * ```typescript
 * import { REFERENCE_PATTERNS } from './constants';
 *
 * // Match cross-references: [[reference]]
 * const crossRefs = content.match(REFERENCE_PATTERNS.CROSS_REF);
 *
 * // Match numbered references: [1], [2], etc.
 * const numberedRefs = content.match(REFERENCE_PATTERNS.NUMBERED_REF);
 * ```
 */
export const REFERENCE_PATTERNS = {
  /** Cross-reference pattern: [[reference]] */
  CROSS_REF: /\[\[([^\]]+)\]\]/g,
  /** Numbered reference pattern: [1], [2], etc. */
  NUMBERED_REF: /\[(\d+)\]/g,
} as const;

/**
 * Supported file formats for input and export operations
 *
 * @constant {Object} SUPPORTED_FORMATS
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
 *
 * @constant {Object} FILE_EXTENSIONS
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
 *
 * @constant {Object} ERROR_CODES
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
