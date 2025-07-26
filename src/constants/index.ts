/**
 * @fileoverview Constants and Configuration for Legal Markdown Processing
 *
 * This module provides centralized access to all constants used throughout
 * the Legal Markdown processing system. It re-exports constants from
 * specialized modules for easy consumption.
 *
 * Modules:
 * - core: Default options, supported formats, file extensions, and error codes
 * - patterns: Regular expressions for parsing different markup elements
 * - pdf: PDF generation and template styling constants
 *
 * @example
 * ```typescript
 * import { DEFAULT_OPTIONS, HEADER_PATTERNS, PDF_TEMPLATE_CONSTANTS } from './constants';
 *
 * // Use default options
 * const options = { ...DEFAULT_OPTIONS, debug: true };
 *
 * // Use header patterns
 * const headerMatch = content.match(HEADER_PATTERNS.TRADITIONAL);
 *
 * // Use PDF constants
 * const logoHeight = PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT;
 * ```
 */

// Core constants: default options, formats, extensions, error codes
export { DEFAULT_OPTIONS, SUPPORTED_FORMATS, FILE_EXTENSIONS, ERROR_CODES } from './core';

// Pattern constants: regex patterns for parsing
export { HEADER_PATTERNS, IMPORT_PATTERNS, CLAUSE_PATTERNS, REFERENCE_PATTERNS } from './patterns';

// PDF constants: template styling and configuration
export { PDF_TEMPLATE_CONSTANTS } from './pdf';

// Path constants: environment-based paths
export { PATHS, RESOLVED_PATHS } from './paths';
