/**
 * @fileoverview Advanced Date Helpers - Node.js Extensions
 *
 * This module provides advanced date manipulation and formatting utilities
 * that extend beyond the basic functionality of the original Ruby legal-markdown.
 * These are Node.js specific enhancements for complex date operations.
 *
 * Features (Node.js extensions):
 * - Date arithmetic (add years, months, days)
 * - Advanced date formatting with multiple format options
 * - Legal-specific date formats (formal, ordinal, etc.)
 * - Complex date parsing and manipulation
 * - Comprehensive error handling for edge cases
 *
 * @example
 * ```typescript
 * import { addYears, formatDate, DateFormats } from '@extensions/helpers';
 *
 * // Advanced date arithmetic
 * const expiryDate = addYears('2025-01-01', 5);
 *
 * // Legal document formatting
 * const legalDate = formatDate(new Date(), DateFormats.LEGAL);
 * // Result: "16th day of July, 2025"
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
 * legal obligations in documents.
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
 * // Calculate a deadline
 * const deadline = addDays('2025-07-16', 14);
 *
 * // Previous dates (negative input)
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
 * Formats a date using advanced format strings
 *
 * Provides flexible date formatting with support for multiple format tokens.
 * Particularly useful for legal documents that require specific date formats.
 *
 * @param {Date | string} date - The date to format
 * @param {string} format - Format string with tokens (default: 'YYYY-MM-DD')
 * @returns {string} The formatted date string
 * @throws {Error} If the input date is invalid
 *
 * Supported format tokens:
 * - YYYY: 4-digit year (2025)
 * - YY: 2-digit year (25)
 * - MMMM: Full month name (July)
 * - MMM: Short month name (Jul)
 * - MM: 2-digit month (07)
 * - M: Month without leading zero (7)
 * - DD: 2-digit day (16)
 * - D: Day without leading zero (16)
 * - Do: Day with ordinal suffix (16th)
 * - dddd: Full day name (Wednesday)
 * - ddd: Short day name (Wed)
 *
 * @example
 * ```typescript
 * const date = new Date('2025-07-16');
 *
 * formatDate(date, 'YYYY-MM-DD');        // "2025-07-16"
 * formatDate(date, 'MM/DD/YYYY');        // "07/16/2025"
 * formatDate(date, 'DD/MM/YYYY');        // "16/07/2025"
 * formatDate(date, 'MMMM D, YYYY');      // "July 16, 2025"
 * formatDate(date, 'dddd, MMMM Do, YYYY'); // "Wednesday, July 16th, 2025"
 * formatDate(date, DateFormats.LEGAL);   // "16th day of July, 2025"
 * formatDate(date, DateFormats.FORMAL);  // "Wednesday, July 16th, 2025"
 *
 * // Custom formats
 * formatDate(date, 'MMMM Do, YYYY');     // "July 16th, 2025"
 * ```
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const dayOfWeek = d.getDay();

  // Month names
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

  // Day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Format replacements
  const replacements: Record<string, string> = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MMMM: monthNames[month],
    MMMMES: monthNamesSpanish[month],
    MMM: monthNamesShort[month],
    MM: String(month + 1).padStart(2, '0'),
    M: String(month + 1),
    DD: String(day).padStart(2, '0'),
    D: String(day),
    Do: addOrdinalSuffix(day),
    dddd: dayNames[dayOfWeek],
    ddd: dayNamesShort[dayOfWeek],
  };

  let result = format;
  // Sort tokens by length (descending) to avoid replacement conflicts
  // For example, "Do" must be processed before "D" to prevent "Do" -> "15o"
  // And "MMMMES" must be processed before "MMMM" to prevent Spanish conflicts
  const sortedTokens = Object.keys(replacements).sort((a, b) => b.length - a.length);

  // Use word boundary regex to prevent partial matches within words
  // This prevents "M" from matching inside "Monday" after replacement
  for (const token of sortedTokens) {
    const replacement = replacements[token];
    // Use word boundaries (\b) for single-character tokens to prevent partial matches
    const isShortToken = token.length <= 2;
    const regex = isShortToken 
      ? new RegExp(`\\b${token}\\b`, 'g')
      : new RegExp(token, 'g');
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Adds ordinal suffix to a number (1st, 2nd, 3rd, 4th, etc.)
 *
 * Internal helper function used by formatDate to add ordinal suffixes
 * to day numbers for legal document formatting.
 *
 * @param {number} num - The number to add ordinal suffix to
 * @returns {string} The number with ordinal suffix
 *
 * @example
 * ```typescript
 * addOrdinalSuffix(1);   // "1st"
 * addOrdinalSuffix(2);   // "2nd"
 * addOrdinalSuffix(3);   // "3rd"
 * addOrdinalSuffix(4);   // "4th"
 * addOrdinalSuffix(21);  // "21st"
 * addOrdinalSuffix(22);  // "22nd"
 * ```
 */
function addOrdinalSuffix(num: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const value = num % 100;

  // Handle special cases: 11th, 12th, 13th
  if (value >= 11 && value <= 13) {
    return num + suffix[0]; // 'th'
  }

  // Handle regular cases: 1st, 2nd, 3rd, 4th, etc.
  const lastDigit = value % 10;
  return num + (suffix[lastDigit] || suffix[0]);
}

/**
 * Predefined date formats for common legal document use cases
 *
 * These formats provide standardized date formatting for different types
 * of legal documents and jurisdictions.
 *
 * @constant {Object} DateFormats
 * @example
 * ```typescript
 * import { formatDate, DateFormats } from './advanced-date-helpers';
 *
 * const date = new Date('2025-07-16');
 *
 * formatDate(date, DateFormats.LEGAL);   // "16th day of July, 2025"
 * formatDate(date, DateFormats.FORMAL);  // "Wednesday, July 16th, 2025"
 * formatDate(date, DateFormats.US);      // "07/16/2025"
 * formatDate(date, DateFormats.EU);      // "16/07/2025"
 * formatDate(date, DateFormats.ISO);     // "2025-07-16"
 * formatDate(date, DateFormats.LONG);    // "July 16, 2025"
 * formatDate(date, DateFormats.SHORT);   // "Jul 16, 2025"
 * ```
 */
export const DateFormats = {
  /** Legal format: "16th day of July, 2025" */
  LEGAL: 'Do day of MMMM, YYYY',

  /** Formal format: "Wednesday, July 16th, 2025" */
  FORMAL: 'dddd, MMMM Do, YYYY',

  /** Spanish format: "16 de julio de 2025" */
  SPANISH: 'D de MMMMES de YYYY',

  /** US format: "07/16/2025" */
  US: 'MM/DD/YYYY',

  /** European format: "16/07/2025" */
  EU: 'DD/MM/YYYY',

  /** ISO format: "2025-07-16" */
  ISO: 'YYYY-MM-DD',

  /** Long format: "July 16, 2025" */
  LONG: 'MMMM D, YYYY',

  /** Short format: "Jul 16, 2025" */
  SHORT: 'MMM D, YYYY',

  /** Year only: "2025" */
  YEAR: 'YYYY',

  /** Month and year: "July 2025" */
  MONTH_YEAR: 'MMMM YYYY',
} as const;
