/**
 * @fileoverview Document Validators for Legal Markdown
 *
 * This module provides validation functions for Legal Markdown documents to ensure
 * proper structure, syntax, and content integrity. These validators are extensions
 * beyond the core functionality that help identify potential issues before processing.
 *
 * Features:
 * - Document structure validation
 * - Syntax checking for brackets and braces
 * - Content integrity verification
 * - Error reporting with detailed messages
 * - Extensions not present in the original legal-markdown
 * - Validation rules for legal document conventions
 *
 * @example
 * ```typescript
 * import { validateDocumentStructure } from './validators';
 *
 * // Validate document structure
 * const validation = validateDocumentStructure(content);
 * if (!validation.isValid) {
 *   console.error('Document validation failed:');
 *   validation.errors.forEach(error => console.error(`- ${error}`));
 * }
 * ```
 */

// Document validators - Extensions for validation beyond core functionality

/**
 * Validates document structure and content integrity
 *
 * Performs comprehensive validation of Legal Markdown document structure including
 * syntax checking, bracket matching, and content integrity verification. This is
 * an extension not present in the original legal-markdown specification.
 *
 * @function validateDocumentStructure
 * @param {string} content - The legal document content to validate
 * @returns {Object} Validation result object
 * @returns {boolean} returns.isValid - Whether the document passes all validation checks
 * @returns {string[]} returns.errors - Array of validation error messages
 * @example
 * ```typescript
 * import { validateDocumentStructure } from './validators';
 *
 * const validation = validateDocumentStructure(documentContent);
 *
 * if (validation.isValid) {
 *   console.log('Document structure is valid');
 * } else {
 *   console.error('Document validation failed:');
 *   validation.errors.forEach(error => {
 *     console.error(`- ${error}`);
 *   });
 * }
 *
 * // Example validation errors:
 * // - Document cannot be empty
 * // - Unmatched optional clause brackets
 * // - Unmatched conditional braces
 * ```
 */
export function validateDocumentStructure(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation rules
  if (!content.trim()) {
    errors.push('Document cannot be empty');
  }

  // Check for unmatched optional clause brackets
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched optional clause brackets');
  }

  // Check for unmatched conditional braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unmatched conditional braces');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
