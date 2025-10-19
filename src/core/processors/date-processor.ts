/**
 * Date Processing Module for Legal Markdown Documents
 *
 * This module provides comprehensive date processing functionality for Legal Markdown
 * documents, supporting the `@today` syntax with various formatting options. It handles
 * different date formats, timezones, locales, and provides specialized formatting
 * for legal documents including ordinal suffixes and custom format patterns.
 *
 * Features:
 * - `@today` syntax for current date insertion
 * - Format override support: `@today[format]`
 * - Multiple predefined formats (ISO, US, European, legal, etc.)
 * - Custom format pattern parsing (YYYY-MM-DD, etc.)
 * - Timezone and locale support
 * - Ordinal suffix generation for legal formats
 * - Graceful error handling with fallback formatting
 * - Integration with metadata for default settings
 *
 * @example
 * ```typescript
 * import { processDateReferences } from './date-processor';
 *
 * const content = `
 * This document is dated @today.
 * Contract effective date: @today[long]
 * Expiration: @today[YYYY-MM-DD]
 * Legal format: @today[legal]
 * `;
 *
 * const metadata = {
 *   'date-format': 'ISO',
 *   'timezone': 'America/New_York',
 *   'locale': 'en-US'
 * };
 *
 * const processed = processDateReferences(content, metadata);
 * console.log(processed);
 * // Output:
 * // This document is dated 2024-01-15.
 * // Contract effective date: January 15, 2024
 * // Expiration: 2024-01-15
 * // Legal format: January 15th, 2024
 * ```
 */

import { LegalMarkdownOptions } from '../../types';

/**
 * Date format options that can be specified in YAML front matter
 *
 * @interface DateFormatOptions
 */
export interface DateFormatOptions {
  /** Default date format to use (ISO, US, European, legal, long, medium, short, or custom pattern) */
  dateFormat?: string;
  /** Timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC') */
  timezone?: string;
  /** Locale identifier for formatting (e.g., 'en-US', 'en-GB', 'de-DE') */
  locale?: string;
}

/**
 * Processes special date references in legal documents
 *
 * This is the main function that processes `@today` references in Legal Markdown
 * documents. It supports format overrides and uses metadata settings for
 * default formatting, timezone, and locale preferences.
 *
 * @deprecated This function is deprecated and will be removed in v4.0.0.
 * Use `processLegalMarkdownWithRemark()` with the `remarkDates` plugin instead.
 * The remark-based approach provides better AST processing and date handling.
 * @see {@link https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md Migration Guide}
 *
 * @param {string} content - The document content containing `@today` references
 * @param {Record<string, any>} metadata - Document metadata with date formatting options
 * @returns {string} Processed content with `@today` references replaced by formatted dates
 * @example
 * ```typescript
 * // Basic usage with default format
 * const content1 = "Document dated `@today`";
 * const result1 = processDateReferences(content1, {});
 * // Output: "Document dated 2024-01-15"
 *
 * // Format override
 * const content2 = "Contract effective `@today[long]`";
 * const result2 = processDateReferences(content2, {});
 * // Output: "Contract effective January 15, 2024"
 *
 * // Using metadata settings
 * const content3 = "Generated `@today`";
 * const metadata = { 'date-format': 'legal', 'timezone': 'America/New_York' };
 * const result3 = processDateReferences(content3, metadata);
 * // Output: "Generated January 15th, 2024"
 * ```
 */
export function processDateReferences(content: string, metadata: Record<string, any>): string {
  // DEPRECATION WARNING
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    console.warn(
      '[DEPRECATION] processDateReferences() is deprecated and will be removed in v4.0.0. ' +
        'Use processLegalMarkdownWithRemark() with remarkDates plugin instead. ' +
        'See: https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md'
    );
  }

  // Extract date format options from metadata
  const dateOptions = extractDateOptions(metadata);

  // Regular expression to match `@today` references
  const todayPattern = /@today(?:\[([^\]]+)\])?/g;

  return content.replace(todayPattern, (match, formatOverride) => {
    // Use format override if provided, otherwise use metadata format, otherwise use default
    const format = formatOverride || dateOptions.dateFormat || 'YYYY-MM-DD';
    const timezone = dateOptions.timezone || 'UTC';
    const locale = dateOptions.locale || 'en-US';

    return formatDate(new Date(), format, timezone, locale);
  });
}

/**
 * Extracts date formatting options from metadata
 *
 * Parses document metadata to extract date formatting configuration,
 * supporting both hyphenated and camelCase property names for flexibility.
 *
 * @private
 * @param {Record<string, any>} metadata - Document metadata containing date options
 * @returns {DateFormatOptions} Extracted date formatting options
 * @example
 * ```typescript
 * const metadata = {
 *   'date-format': 'legal',
 *   'timezone': 'America/New_York',
 *   'locale': 'en-US'
 * };
 *
 * const options = extractDateOptions(metadata);
 * // Returns: { dateFormat: 'legal', timezone: 'America/New_York', locale: 'en-US' }
 * ```
 */
function extractDateOptions(metadata: Record<string, any>): DateFormatOptions {
  return {
    dateFormat: metadata['date-format'] || metadata.dateFormat,
    timezone: metadata['timezone'] || metadata.tz,
    locale: metadata['locale'] || metadata.lang,
  };
}

/**
 * Formats a date according to the specified format, timezone, and locale
 *
 * Converts a Date object to a formatted string using various predefined formats
 * or custom format patterns. Supports timezone conversion and locale-specific
 * formatting with fallback to ISO format on errors.
 *
 * @private
 * @param {Date} date - The date to format
 * @param {string} format - Format specification (ISO, US, European, legal, long, etc.)
 * @param {string} timezone - Timezone identifier (e.g., 'America/New_York')
 * @param {string} locale - Locale identifier (e.g., 'en-US')
 * @returns {string} Formatted date string
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 *
 * console.log(formatDate(date, 'ISO', 'UTC', 'en-US'));        // '2024-01-15'
 * console.log(formatDate(date, 'US', 'UTC', 'en-US'));         // '01/15/2024'
 * console.log(formatDate(date, 'legal', 'UTC', 'en-US'));      // 'January 15th, 2024'
 * console.log(formatDate(date, 'YYYY-MM-DD', 'UTC', 'en-US')); // '2024-01-15'
 * ```
 */
function formatDate(date: Date, format: string, timezone: string, locale: string): string {
  try {
    // Create a new date in the specified timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    // Handle different format patterns
    switch (format.toLowerCase()) {
      case 'iso':
      case 'yyyy-mm-dd':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        return new Intl.DateTimeFormat('en-CA', options).format(date);

      case 'us':
      case 'mm/dd/yyyy':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        return new Intl.DateTimeFormat('en-US', options).format(date);

      case 'european':
      case 'dd/mm/yyyy':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        return new Intl.DateTimeFormat('en-GB', options).format(date);

      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        return new Intl.DateTimeFormat(locale, options).format(date);

      case 'medium':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        return new Intl.DateTimeFormat(locale, options).format(date);

      case 'short':
        options.year = '2-digit';
        options.month = 'short';
        options.day = 'numeric';
        return new Intl.DateTimeFormat(locale, options).format(date);

      case 'legal': {
        // Legal format: "January 1st, 2024"
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        const formatted = new Intl.DateTimeFormat(locale, options).format(date);
        return addOrdinalSuffix(formatted, date.getDate());
      }

      default:
        // Try to parse custom format patterns
        try {
          return parseCustomFormat(date, format, timezone, locale);
        } catch (error) {
          // If custom format parsing fails, fallback to ISO
          return date.toISOString().split('T')[0];
        }
    }
  } catch (error) {
    // Fallback to ISO format if there's an error
    return date.toISOString().split('T')[0];
  }
}

/**
 * Adds ordinal suffix to legal format (1st, 2nd, 3rd, etc.)
 *
 * Modifies a formatted date string to include ordinal suffixes for the day,
 * used specifically in legal document formatting.
 *
 * @private
 * @param {string} formatted - The formatted date string
 * @param {number} day - The day number to add ordinal suffix to
 * @returns {string} Date string with ordinal suffix
 * @example
 * ```typescript
 * const formatted = addOrdinalSuffix('January 1, 2024', 1);
 * // Returns: 'January 1st, 2024'
 * ```
 */
function addOrdinalSuffix(formatted: string, day: number): string {
  const suffix = getOrdinalSuffix(day);
  return formatted.replace(/\b\d+\b/, `${day}${suffix}`);
}

/**
 * Gets ordinal suffix for a number
 *
 * Determines the appropriate ordinal suffix (st, nd, rd, th) for a given number
 * following English ordinal number rules.
 *
 * @private
 * @param {number} num - The number to get ordinal suffix for
 * @returns {string} The ordinal suffix (st, nd, rd, or th)
 * @example
 * ```typescript
 * console.log(getOrdinalSuffix(1));  // 'st'
 * console.log(getOrdinalSuffix(2));  // 'nd'
 * console.log(getOrdinalSuffix(3));  // 'rd'
 * console.log(getOrdinalSuffix(4));  // 'th'
 * console.log(getOrdinalSuffix(11)); // 'th'
 * console.log(getOrdinalSuffix(21)); // 'st'
 * ```
 */
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (lastDigit) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Parses custom date format patterns
 *
 * Processes custom date format strings using token replacement patterns.
 * Supports various tokens like YYYY, MM, DD, etc., and throws an error
 * for invalid or unrecognized format patterns.
 *
 * @private
 * @param {Date} date - The date to format
 * @param {string} format - Custom format pattern string
 * @param {string} timezone - Timezone identifier
 * @param {string} locale - Locale identifier
 * @returns {string} Formatted date string
 * @throws {Error} When format pattern is invalid or contains unrecognized tokens
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 *
 * console.log(parseCustomFormat(date, 'YYYY-MM-DD', 'UTC', 'en-US')); // '2024-01-15'
 * console.log(parseCustomFormat(date, 'DD/MM/YYYY', 'UTC', 'en-US')); // '15/01/2024'
 * console.log(parseCustomFormat(date, 'MMMM D, YYYY', 'UTC', 'en-US')); // 'January 15, 2024'
 * ```
 */
function parseCustomFormat(date: Date, format: string, timezone: string, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  // Define token patterns and their formatters
  const tokenPatterns = [
    {
      pattern: /YYYY/g,
      formatter: () =>
        new Intl.DateTimeFormat(locale, { ...options, year: 'numeric' }).format(date),
    },
    {
      pattern: /YY/g,
      formatter: () =>
        new Intl.DateTimeFormat(locale, { ...options, year: '2-digit' }).format(date),
    },
    {
      pattern: /MMMM/g,
      formatter: () => new Intl.DateTimeFormat(locale, { ...options, month: 'long' }).format(date),
    },
    {
      pattern: /MMM/g,
      formatter: () => new Intl.DateTimeFormat(locale, { ...options, month: 'short' }).format(date),
    },
    {
      pattern: /MM/g,
      formatter: () =>
        new Intl.DateTimeFormat(locale, { ...options, month: '2-digit' }).format(date),
    },
    {
      pattern: /\bM\b/g,
      formatter: () =>
        new Intl.DateTimeFormat(locale, { ...options, month: 'numeric' }).format(date),
    },
    {
      pattern: /DD/g,
      formatter: () => new Intl.DateTimeFormat(locale, { ...options, day: '2-digit' }).format(date),
    },
    {
      pattern: /\bD\b/g,
      formatter: () => new Intl.DateTimeFormat(locale, { ...options, day: 'numeric' }).format(date),
    },
  ];

  // Apply token replacements
  let result = format;
  for (const { pattern, formatter } of tokenPatterns) {
    result = result.replace(pattern, formatter());
  }

  // If result still contains unreplaced tokens of our pattern, it's an invalid format
  if (result.match(/\b[YMDH]+\b/) || result === format) {
    throw new Error('Invalid format pattern');
  }

  return result;
}
