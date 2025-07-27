/**
 * @fileoverview Core Date Helpers - Ruby Legal Markdown Compatibility
 *
 * This module provides the basic date functionality that was present in the
 * original Ruby legal-markdown gem. It focuses on core date operations that
 * maintain 1:1 compatibility with the Ruby implementation.
 *
 * Features (Ruby compatible):
 * - @today functionality for current date insertion
 * - Basic date formatting compatible with Ruby output
 * - Simple date string handling
 *
 * For advanced date manipulation (addYears, addMonths, complex formatting),
 * see src/extensions/helpers/advanced-date-helpers.ts
 *
 * @example
 * ```typescript
 * import { today, formatBasicDate } from '@core/helpers';
 *
 * // Basic @today functionality from Ruby legal-markdown
 * const currentDate = today();
 *
 * // Basic formatting compatible with Ruby output
 * const formatted = formatBasicDate(new Date(), 'YYYY-MM-DD');
 * ```
 */

/**
 * Returns the current date - implements @today functionality from Ruby legal-markdown
 *
 * This function provides the core @today substitution that was available
 * in the original Ruby implementation. When users include "date: @today" in
 * their YAML front matter or use @today in template expressions, this function
 * provides the current date.
 *
 * @returns {Date} The current date as a Date object
 *
 * @example
 * ```typescript
 * // Equivalent to Ruby's @today functionality
 * const currentDate = today();
 *
 * // Used in template processing for @today substitution
 * if (dateValue === '@today') {
 *   return today();
 * }
 * ```
 */
export function today(): Date {
  return new Date();
}

/**
 * Basic date formatting compatible with Ruby legal-markdown output
 *
 * Provides simple date formatting that matches the output format used by
 * the original Ruby legal-markdown gem. This ensures compatibility when
 * migrating documents between Ruby and Node.js versions.
 *
 * @param {Date | string} date - The date to format
 * @param {string} format - Simple format string (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 *
 * Supported formats (Ruby compatible):
 * - 'YYYY-MM-DD' - ISO format (default)
 * - 'DD/MM/YYYY' - European format
 * - 'MM/DD/YYYY' - US format
 * - 'YYYY' - Year only
 * - 'MM' - Month only (zero-padded)
 * - 'DD' - Day only (zero-padded)
 *
 * @example
 * ```typescript
 * const date = new Date('2025-07-16');
 *
 * // Ruby-compatible basic formats
 * formatBasicDate(date);                  // "2025-07-16"
 * formatBasicDate(date, 'DD/MM/YYYY');    // "16/07/2025"
 * formatBasicDate(date, 'MM/DD/YYYY');    // "07/16/2025"
 * ```
 */
export function formatBasicDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  // Basic format replacements compatible with Ruby output
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY':
      return String(year);
    case 'MM':
      return month;
    case 'DD':
      return day;
    default:
      // For any unrecognized format, return ISO format for compatibility
      return `${year}-${month}-${day}`;
  }
}

/**
 * Parse @today token and return current date
 *
 * Helper function specifically for processing the @today token that appears
 * in Ruby legal-markdown documents. This maintains exact compatibility with
 * the Ruby implementation's behavior.
 *
 * @param {string} token - The token to check (should be '@today')
 * @returns {Date | null} Current date if token is '@today', null otherwise
 *
 * @example
 * ```typescript
 * // Process @today tokens from YAML front matter or mixins
 * const result = parseToday('@today');  // Returns current Date
 * const result2 = parseToday('other');  // Returns null
 * ```
 */
export function parseToday(token: string): Date | null {
  if (token === '@today') {
    return today();
  }
  return null;
}
