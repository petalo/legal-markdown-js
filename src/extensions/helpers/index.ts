/**
 * @fileoverview Extensions Helpers Module - Node.js Enhancements
 *
 * This module provides advanced helper functions that extend beyond the basic
 * functionality of the original Ruby legal-markdown. These are Node.js specific
 * enhancements for complex document processing and formatting.
 *
 * Extended helpers include:
 * - Advanced date manipulation and formatting
 * - Currency and number formatting utilities
 * - String manipulation and text processing
 * - Legal document specific formatting functions
 *
 * For basic Ruby-compatible helpers, see src/core/helpers/
 *
 * @example
 * ```typescript
 * import { formatCurrency, addYears, capitalize } from '@extensions/helpers';
 *
 * // Advanced functionality not in Ruby legal-markdown
 * const price = formatCurrency(1234.56, 'USD');
 * const futureDate = addYears(new Date(), 5);
 * const title = capitalize('legal document');
 * ```
 */

// Re-export all extension helpers
export * from './advanced-date-helpers';
export * from './number-helpers';
export * from './string-helpers';

// Individual imports for convenience and registry
import { addYears, addMonths, addDays, formatDate, DateFormats } from './advanced-date-helpers';

import {
  formatInteger,
  formatPercent,
  formatCurrency,
  formatEuro,
  formatDollar,
  formatPound,
  numberToWords,
  round,
} from './number-helpers';

import {
  capitalize,
  capitalizeWords,
  upper,
  lower,
  titleCase,
  kebabCase,
  snakeCase,
  camelCase,
  pascalCase,
  truncate,
  clean,
  pluralize,
  padStart,
  padEnd,
  contains,
  replaceAll,
  initials,
} from './string-helpers';

/**
 * Registry of extension helper functions for template processing
 *
 * This object provides all the advanced helper functions that extend
 * beyond the Ruby legal-markdown capabilities. It includes the complete
 * set of Node.js specific enhancements for document processing.
 *
 * @constant {Object} extensionHelpers
 * @example
 * ```typescript
 * import { extensionHelpers } from '@extensions/helpers';
 *
 * // Use advanced helpers in template processing
 * const currency = extensionHelpers.formatCurrency(1000, 'EUR');
 * const future = extensionHelpers.addYears(new Date(), 3);
 * const title = extensionHelpers.titleCase('document title');
 * ```
 */
export const extensionHelpers = {
  // Advanced date helpers
  addYears,
  addMonths,
  addDays,
  formatDate,
  DateFormats,

  // Number helpers
  formatInteger,
  formatPercent,
  formatCurrency,
  formatEuro,
  formatDollar,
  formatPound,
  numberToWords,
  round,

  // String helpers
  capitalize,
  capitalizeWords,
  upper,
  lower,
  titleCase,
  kebabCase,
  snakeCase,
  camelCase,
  pascalCase,
  truncate,
  clean,
  pluralize,
  padStart,
  padEnd,
  contains,
  replaceAll,
  initials,
};

/**
 * Combined helpers registry including both core and extension helpers
 *
 * This provides a unified interface to all helper functions, combining
 * the Ruby-compatible core helpers with the Node.js extension helpers.
 * Extension helpers take precedence over core helpers when there are conflicts.
 *
 * @constant {Object} allHelpers
 * @example
 * ```typescript
 * import { allHelpers } from '@extensions/helpers';
 *
 * // Access any helper function through unified interface
 * const today = allHelpers.today();              // from core
 * const formatted = allHelpers.formatDate(today, 'MMMM Do, YYYY'); // from extensions
 * const currency = allHelpers.formatCurrency(100, 'USD');         // from extensions
 * ```
 */
export const allHelpers = {
  // Include all extension helpers (these take precedence)
  ...extensionHelpers,

  // Note: Core helpers should be imported separately if both core and extensions
  // versions of the same function are needed. Extensions take precedence here.
};

/**
 * Extension helper function names for validation and processing
 *
 * List of helper function names that are part of the Node.js extension
 * functionality. Used for validating template expressions and determining
 * which helpers are available in extension processing.
 *
 * @constant {string[]} EXTENSION_HELPER_NAMES
 */
export const EXTENSION_HELPER_NAMES = [
  // Advanced date helpers
  'addYears',
  'addMonths',
  'addDays',
  'formatDate',

  // Number helpers
  'formatInteger',
  'formatPercent',
  'formatCurrency',
  'formatEuro',
  'formatDollar',
  'formatPound',
  'numberToWords',
  'round',

  // String helpers
  'capitalize',
  'capitalizeWords',
  'upper',
  'lower',
  'titleCase',
  'kebabCase',
  'snakeCase',
  'camelCase',
  'pascalCase',
  'truncate',
  'clean',
  'pluralize',
  'padStart',
  'padEnd',
  'contains',
  'replaceAll',
  'initials',
] as const;

/**
 * Type definition for extension helper function names
 */
export type ExtensionHelperName = (typeof EXTENSION_HELPER_NAMES)[number];
