/**
 * @fileoverview Date Manipulation and Formatting Helpers
 *
 * This module provides comprehensive date manipulation and formatting utilities
 * specifically designed for legal documents. It includes functions for date
 * arithmetic, parsing, and formatting with legal-specific date formats.
 *
 * Features:
 * - Date arithmetic (add years, months, days)
 * - Flexible date formatting with multiple format options
 * - Legal-specific date formats (formal, ordinal, etc.)
 * - Date parsing with format detection
 * - Comprehensive error handling for invalid dates
 *
 * @example
 * ```typescript
 * import { formatDate, addYears, DateFormats } from './date-helpers';
 *
 * // Format a date for legal documents
 * const legalDate = formatDate(new Date(), DateFormats.LEGAL);
 * // Result: "16th day of July, 2025"
 *
 * // Add years to a contract date
 * const expiryDate = addYears('2025-01-01', 5);
 * ```
 */

/**
 * Adds a specified number of years to a date
 *
 * This function handles both Date objects and ISO date strings, making it
 * useful for contract calculations and legal document date processing.
 *
 * @param {Date | string} date - The base date as a Date object or ISO string
 * @param {number} years - The number of years to add (can be negative)
 * @returns {Date} A new Date object with the years added
 * @throws {Error} If the input date is invalid
 *
 * @example
 * ```typescript
 * // Add 5 years to a contract start date
 * const startDate = new Date('2025-01-01');
 * const endDate = addYears(startDate, 5);
 * // Result: Date object for 2030-01-01
 *
 * // Using with string input
 * const futureDate = addYears('2025-07-16', 2);
 * // Result: Date object for 2027-07-16
 *
 * // Subtract years (negative input)
 * const pastDate = addYears(new Date(), -3);
 * ```
 */
export function addYears(date: Date | string, years: number): Date {
  if (!date) {
    throw new Error('Date is required for addYears');
  }
  const d = typeof date === 'string' ? new Date(date) : new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Adds a specified number of days to a date
 *
 * Useful for calculating deadlines, notice periods, and other time-sensitive
 * legal requirements in contracts and legal documents.
 *
 * @param {Date | string} date - The base date as a Date object or ISO string
 * @param {number} days - The number of days to add (can be negative)
 * @returns {Date} A new Date object with the days added
 * @throws {Error} If the input date is invalid
 *
 * @example
 * ```typescript
 * // Add 30 days for a notice period
 * const noticeDate = addDays(new Date(), 30);
 *
 * // Calculate deadline from string date
 * const deadline = addDays('2025-07-16', 14);
 * // Result: Date object for 2025-07-30
 *
 * // Go back in time (negative days)
 * const pastDate = addDays(new Date(), -7);
 * ```
 */
export function addDays(date: Date | string, days: number): Date {
  if (!date) {
    throw new Error('Date is required for addDays');
  }
  const d = typeof date === 'string' ? new Date(date) : new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Adds a specified number of months to a date
 *
 * Handles month boundaries intelligently, useful for calculating quarterly
 * reports, monthly payments, and other periodic legal obligations.
 *
 * @param {Date | string} date - The base date as a Date object or ISO string
 * @param {number} months - The number of months to add (can be negative)
 * @returns {Date} A new Date object with the months added
 * @throws {Error} If the input date is invalid
 *
 * @example
 * ```typescript
 * // Add 6 months for a review period
 * const reviewDate = addMonths(new Date('2025-01-31'), 6);
 * // Result: Date object for 2025-07-31
 *
 * // Calculate quarterly dates
 * const quarterlyDate = addMonths('2025-01-01', 3);
 * // Result: Date object for 2025-04-01
 *
 * // Previous months (negative input)
 * const previousQuarter = addMonths(new Date(), -3);
 * ```
 */
export function addMonths(date: Date | string, months: number): Date {
  if (!date) {
    throw new Error('Date is required for addMonths');
  }
  const d = typeof date === 'string' ? new Date(date) : new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Formats a date using customizable format strings
 *
 * Provides flexible date formatting with support for multiple format tokens.
 * Particularly useful for legal documents that require specific date formats
 * for different jurisdictions and document types.
 *
 * @param {Date | string} date - The date to format as a Date object or ISO string
 * @param {string} format - The format string (default: 'YYYY-MM-DD')
 * @returns {string} The formatted date string
 * @throws {Error} If the input date is invalid
 *
 * Format tokens:
 * - YYYY: 4-digit year (2025)
 * - YY: 2-digit year (25)
 * - MMMM: Full month name (January)
 * - MMM: Abbreviated month name (Jan)
 * - MM: 2-digit month (01)
 * - M: Month number (1)
 * - DD: 2-digit day (01)
 * - D: Day number (1)
 * - Do: Ordinal day (1st, 2nd, 3rd)
 * - dddd: Full day name (Monday)
 * - ddd: Abbreviated day name (Mon)
 *
 * @example
 * ```typescript
 * const date = new Date('2025-07-16');
 *
 * // Standard formats
 * formatDate(date, 'YYYY-MM-DD');        // "2025-07-16"
 * formatDate(date, 'MM/DD/YYYY');        // "07/16/2025"
 * formatDate(date, 'DD/MM/YYYY');        // "16/07/2025"
 *
 * // Legal document formats
 * formatDate(date, DateFormats.LEGAL);   // "16th day of July, 2025"
 * formatDate(date, DateFormats.FORMAL);  // "Wednesday, July 16th, 2025"
 * formatDate(date, DateFormats.SPANISH); // "16 de julio de 2025"
 *
 * // Custom format
 * formatDate(date, 'MMMM Do, YYYY');     // "July 16th, 2025"
 * ```
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  if (!date) {
    throw new Error('Date is required for formatting');
  }
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthNamesShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthNamesSpanish = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Common date format replacements
  const replacements: Record<string, string> = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MM: month,
    M: String(d.getMonth() + 1),
    DD: day,
    D: String(d.getDate()),
    MMMM: monthNames[d.getMonth()],
    MMMMES: monthNamesSpanish[d.getMonth()],
    MMM: monthNamesShort[d.getMonth()],
    dddd: dayNames[d.getDay()],
    ddd: dayNamesShort[d.getDay()],
    Do: day + getOrdinalSuffix(d.getDate()),
  };

  // Replace tokens in order of length (longest first) to avoid partial replacements
  // Use a single pass approach where we process tokens by length to prevent overlaps
  let formatted = format;

  // Helper function to check if a token is standalone (not part of a longer token)
  function isStandaloneToken(str: string, token: string): boolean {
    let pos = 0;
    while (pos <= str.length - token.length) {
      const idx = str.indexOf(token, pos);
      if (idx === -1) break;

      // Check if this occurrence is standalone (not part of a longer token)
      const beforeChar = idx > 0 ? str[idx - 1] : '';
      const afterChar = idx + token.length < str.length ? str[idx + token.length] : '';

      // For format tokens, check if it's surrounded by non-token characters
      if (beforeChar !== token[0] && afterChar !== token[0]) {
        return true;
      }

      pos = idx + 1;
    }
    return false;
  }

  // Define tokens in explicit order of replacement to avoid conflicts
  const orderedTokens = [
    'dddd',
    'ddd', // Day names (must come before DD/D)
    'MMMMES', // Spanish month names (must come before MMMM)
    'MMMM',
    'MMM', // Month names (must come before MM/M)
    'YYYY',
    'YY', // Years
    'Do', // Ordinal days (must come before DD/D)
    'DD',
    'MM', // Two-digit day/month
    'D',
    'M', // Single-digit day/month (must come last)
  ];

  for (const token of orderedTokens) {
    if (replacements[token] && isStandaloneToken(format, token)) {
      // Replace all occurrences of this token at once
      formatted = formatted.split(token).join(replacements[token]);
    }
  }

  return formatted;
}

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 *
 * Internal helper function used by formatDate to add ordinal suffixes
 * to day numbers in formatted dates.
 *
 * @private
 * @param {number} n - The number to get the ordinal suffix for
 * @returns {string} The ordinal suffix ('st', 'nd', 'rd', or 'th')
 *
 * @example
 * ```typescript
 * getOrdinalSuffix(1);  // 'st'
 * getOrdinalSuffix(2);  // 'nd'
 * getOrdinalSuffix(3);  // 'rd'
 * getOrdinalSuffix(4);  // 'th'
 * getOrdinalSuffix(21); // 'st'
 * ```
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Predefined date format constants for common legal document formats
 *
 * This object provides commonly used date formats in legal documents,
 * making it easy to maintain consistency across different document types.
 *
 * @constant {Object} DateFormats
 * @example
 * ```typescript
 * import { formatDate, DateFormats } from './date-helpers';
 *
 * const date = new Date('2025-07-16');
 *
 * // Use predefined formats
 * formatDate(date, DateFormats.LEGAL);   // "16th day of July, 2025"
 * formatDate(date, DateFormats.FORMAL);  // "Wednesday, July 16th, 2025"
 * formatDate(date, DateFormats.US);      // "07/16/2025"
 * formatDate(date, DateFormats.EU);      // "16/07/2025"
 * formatDate(date, DateFormats.SPANISH); // "16 de julio de 2025"
 * ```
 */
export const DateFormats = {
  ISO: 'YYYY-MM-DD',
  US: 'MM/DD/YYYY',
  EU: 'DD/MM/YYYY',
  UK: 'DD/MM/YYYY',
  FULL: 'MMMM Do, YYYY',
  FULL_US: 'MMMM D, YYYY',
  SHORT: 'MMM D, YYYY',
  LEGAL: 'Do day of MMMM, YYYY',
  FORMAL: 'dddd, MMMM Do, YYYY',
  SPANISH: 'D de MMMMES de YYYY',
} as const;

/**
 * Parses date strings in various formats and returns a Date object
 *
 * Attempts to parse date strings in multiple common formats with intelligent
 * format detection. Useful for processing user input or parsing dates from
 * various document formats.
 *
 * @param {string} dateStr - The date string to parse
 * @returns {Date | null} The parsed Date object, or null if parsing fails
 *
 * Supported formats:
 * - ISO format: YYYY-MM-DD
 * - US format: MM/DD/YYYY
 * - European format: DD/MM/YYYY
 * - Alternative separators: MM-DD-YYYY, DD-MM-YYYY
 * - Natural language formats (via Date constructor)
 *
 * @example
 * ```typescript
 * // ISO format
 * const date1 = parseDate('2025-07-16');
 * // Result: Date object for July 16, 2025
 *
 * // US format (MM/DD/YYYY)
 * const date2 = parseDate('07/16/2025');
 * // Result: Date object for July 16, 2025
 *
 * // European format (DD/MM/YYYY)
 * const date3 = parseDate('16/07/2025');
 * // Result: Date object for July 16, 2025
 *
 * // Invalid date
 * const invalid = parseDate('not a date');
 * // Result: null
 * ```
 */
export function parseDate(dateStr: string): Date | null {
  // Try various formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
  ];

  // Direct parsing attempt
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Try parsing with format detection
  if (formats[0].test(dateStr)) {
    return new Date(dateStr);
  }

  if (formats[1].test(dateStr) || formats[2].test(dateStr)) {
    const separator = dateStr.includes('/') ? '/' : '-';
    const parts = dateStr.split(separator).map(Number);

    // Assume MM/DD/YYYY for US format if month <= 12
    if (parts[0] <= 12) {
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    // Otherwise assume DD/MM/YYYY
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  return null;
}
