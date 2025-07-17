/**
 * @fileoverview Custom Error Classes for Legal Markdown Processing
 *
 * This module provides a comprehensive set of custom error classes for the Legal Markdown
 * processing system. All errors inherit from a base LegalMarkdownError class that provides
 * structured error handling with error codes and contextual information.
 *
 * Features:
 * - Base LegalMarkdownError class with error codes and context
 * - Specialized error classes for different failure scenarios
 * - Structured error information for debugging and user feedback
 * - Proper stack trace preservation
 * - Contextual data attachment for detailed error reporting
 * - Type-safe error handling throughout the system
 *
 * @example
 * ```typescript
 * import { YamlParsingError, FileNotFoundError, ValidationError } from './errors';
 *
 * // YAML parsing error
 * throw new YamlParsingError('Invalid YAML syntax', { line: 5, column: 12 });
 *
 * // File not found error
 * throw new FileNotFoundError('./missing-file.md', { operation: 'import' });
 *
 * // Validation error
 * throw new ValidationError('Field is required', 'client.name', { value: '' });
 * ```
 */

/**
 * Base error class for all Legal Markdown processing errors
 *
 * Provides structured error handling with error codes and contextual information.
 * All other error types in the system inherit from this base class.
 *
 * @class LegalMarkdownError
 * @extends {Error}
 * @example
 * ```typescript
 * import { LegalMarkdownError } from './errors';
 *
 * // Create a custom error with context
 * const error = new LegalMarkdownError(
 *   'Processing failed',
 *   'PROCESSING_ERROR',
 *   { file: 'contract.md', step: 'field-resolution' }
 * );
 *
 * console.log(error.code); // 'PROCESSING_ERROR'
 * console.log(error.context); // { file: 'contract.md', step: 'field-resolution' }
 * ```
 */
export class LegalMarkdownError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: string;
  /** Optional contextual data about the error */
  public readonly context?: Record<string, unknown>;

  /**
   * Creates a new LegalMarkdownError instance
   *
   * @param {string} message - Human-readable error message
   * @param {string} code - Error code for programmatic handling
   * @param {Record<string, unknown>} [context] - Optional contextual data
   * @example
   * ```typescript
   * const error = new LegalMarkdownError(
   *   'Field resolution failed',
   *   'FIELD_RESOLUTION_ERROR',
   *   { fieldName: 'client.name', value: undefined }
   * );
   * ```
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'LegalMarkdownError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LegalMarkdownError);
    }
  }
}

/**
 * Error thrown when YAML frontmatter parsing fails
 *
 * @class YamlParsingError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { YamlParsingError } from './errors';
 *
 * // YAML parsing error with context
 * throw new YamlParsingError('Invalid YAML syntax at line 5', {
 *   line: 5,
 *   column: 12,
 *   yamlContent: 'title: "Unterminated string...'
 * });
 * ```
 */
export class YamlParsingError extends LegalMarkdownError {
  /**
   * Creates a new YamlParsingError instance
   *
   * @param {string} message - Human-readable error message describing the YAML parsing issue
   * @param {Record<string, unknown>} [context] - Optional contextual data like line number, column, etc.
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'YAML_PARSING_ERROR', context);
    this.name = 'YamlParsingError';
  }
}

/**
 * Error thrown when a required file cannot be found
 *
 * @class FileNotFoundError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { FileNotFoundError } from './errors';
 *
 * // File not found during import
 * throw new FileNotFoundError('./imports/header.md', {
 *   operation: 'import',
 *   basePath: './documents'
 * });
 * ```
 */
export class FileNotFoundError extends LegalMarkdownError {
  /**
   * Creates a new FileNotFoundError instance
   *
   * @param {string} filePath - The path of the file that could not be found
   * @param {Record<string, unknown>} [context] - Optional contextual data like operation type, base path, etc.
   */
  constructor(filePath: string, context?: Record<string, unknown>) {
    super(`File not found: ${filePath}`, 'FILE_NOT_FOUND', { filePath, ...context });
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when import processing fails
 *
 * @class ImportProcessingError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { ImportProcessingError } from './errors';
 *
 * // Import processing error
 * throw new ImportProcessingError(
 *   'Circular import detected',
 *   './imports/header.md',
 *   { importChain: ['main.md', 'header.md', 'header.md'] }
 * );
 * ```
 */
export class ImportProcessingError extends LegalMarkdownError {
  /**
   * Creates a new ImportProcessingError instance
   *
   * @param {string} message - Human-readable error message describing the import processing issue
   * @param {string} [filePath] - Optional file path where the import error occurred
   * @param {Record<string, unknown>} [context] - Optional contextual data like import chain, operation details, etc.
   */
  constructor(message: string, filePath?: string, context?: Record<string, unknown>) {
    super(message, 'IMPORT_PROCESSING_ERROR', { filePath, ...context });
    this.name = 'ImportProcessingError';
  }
}

/**
 * Error thrown when metadata export operations fail
 *
 * @class MetadataExportError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { MetadataExportError } from './errors';
 *
 * // Metadata export error
 * throw new MetadataExportError(
 *   'Failed to write metadata file',
 *   './output/metadata.yaml',
 *   { format: 'yaml', permissions: 'denied' }
 * );
 * ```
 */
export class MetadataExportError extends LegalMarkdownError {
  /**
   * Creates a new MetadataExportError instance
   *
   * @param {string} message - Human-readable error message describing the metadata export issue
   * @param {string} [exportPath] - Optional path where the export was attempted
   * @param {Record<string, unknown>} [context] - Optional contextual data like export format, permissions, etc.
   */
  constructor(message: string, exportPath?: string, context?: Record<string, unknown>) {
    super(message, 'METADATA_EXPORT_ERROR', { exportPath, ...context });
    this.name = 'MetadataExportError';
  }
}

/**
 * Error thrown when document validation fails
 *
 * @class ValidationError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { ValidationError } from './errors';
 *
 * // Validation error for a specific field
 * throw new ValidationError(
 *   'Field value is required',
 *   'client.name',
 *   { value: '', required: true, type: 'string' }
 * );
 * ```
 */
export class ValidationError extends LegalMarkdownError {
  /**
   * Creates a new ValidationError instance
   *
   * @param {string} message - Human-readable error message describing the validation issue
   * @param {string} [field] - Optional field name that failed validation
   * @param {Record<string, unknown>} [context] - Optional contextual data like expected value, validation rules, etc.
   */
  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', { field, ...context });
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when general processing operations fail
 *
 * @class ProcessingError
 * @extends {LegalMarkdownError}
 * @example
 * ```typescript
 * import { ProcessingError } from './errors';
 *
 * // Processing error with processor information
 * throw new ProcessingError(
 *   'Field resolution failed',
 *   'field-processor',
 *   { fieldCount: 25, failedFields: ['client.name', 'date'] }
 * );
 * ```
 */
export class ProcessingError extends LegalMarkdownError {
  /**
   * Creates a new ProcessingError instance
   *
   * @param {string} message - Human-readable error message describing the processing issue
   * @param {string} [processor] - Optional name of the processor that failed
   * @param {Record<string, unknown>} [context] - Optional contextual data like processing stage, affected items, etc.
   */
  constructor(message: string, processor?: string, context?: Record<string, unknown>) {
    super(message, 'PROCESSING_ERROR', { processor, ...context });
    this.name = 'ProcessingError';
  }
}
