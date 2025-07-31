/**
 * Validation Utilities
 *
 * This module provides validation functions for various input types
 * used throughout the Legal Markdown processing system.
 *
 * Features:
 * - URL validation
 * - File name sanitization
 * - Input validation and cleaning
 *
 * @example
 * ```typescript
 * import { isValidUrl, sanitizeFileName } from './validation';
 *
 * // Validate URLs
 * const isValid = isValidUrl('https://example.com');
 *
 * // Sanitize file names
 * const safe = sanitizeFileName('My Document!.pdf');
 * ```
 *
 * @module
 */

/**
 * Validates if a string is a valid URL
 *
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is a valid URL, false otherwise
 * @example
 * ```typescript
 * const isValid = isValidUrl('https://example.com');
 * // Returns: true
 * ```
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a file name by replacing invalid characters with underscores
 *
 * @param {string} fileName - The file name to sanitize
 * @returns {string} The sanitized file name
 * @example
 * ```typescript
 * const safe = sanitizeFileName('My Document!.pdf');
 * // Returns: 'My_Document_.pdf'
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9.-]/gi, '_');
}
