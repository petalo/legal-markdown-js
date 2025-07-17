/**
 * @fileoverview Legal Markdown Helpers Module
 *
 * This module provides a comprehensive collection of utility functions for formatting
 * and manipulating dates, numbers, and strings in legal documents. It serves as the
 * central hub for all helper functions used throughout the Legal Markdown system.
 *
 * Features:
 * - Date manipulation and formatting with legal-specific formats
 * - Number formatting with currency, percentage, and word conversion
 * - String manipulation with case conversion and text processing
 * - Template helper registry for use in document processing
 * - Convenient re-exports for easy access to all helper functions
 *
 * @example
 * ```typescript
 * import { formatDate, formatCurrency, capitalize } from './helpers';
 *
 * // Date formatting
 * const date = formatDate(new Date(), 'MMMM Do, YYYY');
 *
 * // Currency formatting
 * const price = formatCurrency(1234.56, 'USD');
 *
 * // String manipulation
 * const title = capitalize('legal document');
 * ```
 */

export * from './date-helpers';
export * from './number-helpers';
export * from './string-helpers';

// Individual imports for re-export
import { addYears, addMonths, addDays, formatDate, DateFormats } from './date-helpers';

import {
  formatInteger,
  formatPercent,
  formatCurrency,
  formatEuro,
  formatDollar,
  formatPound,
  numberToWords,
} from './number-helpers';

import {
  capitalize,
  capitalizeWords,
  upper,
  lower,
  titleCase,
  clean,
  pluralize,
} from './string-helpers';

// Re-export commonly used helpers for convenience
export {
  // Date helpers
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

  // String helpers
  capitalize,
  capitalizeWords,
  upper,
  lower,
  titleCase,
  clean,
  pluralize,
};

import * as dateHelpers from './date-helpers';
import * as numberHelpers from './number-helpers';
import * as stringHelpers from './string-helpers';

/**
 * Registry of helper functions for use in template processing
 *
 * This object provides a centralized collection of all helper functions
 * organized by category for easy access during template processing and
 * document generation.
 *
 * @constant {Object} helpers
 * @example
 * ```typescript
 * import { helpers } from './helpers';
 *
 * // Use in template processing
 * const result = helpers.formatDate(new Date(), 'YYYY-MM-DD');
 * const currency = helpers.formatEuro(1234.56);
 * const title = helpers.titleCase('legal document title');
 * ```
 */
export const helpers = {
  // Date helpers
  addYears: dateHelpers.addYears,
  addMonths: dateHelpers.addMonths,
  addDays: dateHelpers.addDays,
  formatDate: dateHelpers.formatDate,

  // Number helpers
  formatInteger: numberHelpers.formatInteger,
  formatPercent: numberHelpers.formatPercent,
  formatCurrency: numberHelpers.formatCurrency,
  formatEuro: numberHelpers.formatEuro,
  formatDollar: numberHelpers.formatDollar,
  formatPound: numberHelpers.formatPound,
  numberToWords: numberHelpers.numberToWords,
  round: numberHelpers.round,

  // String helpers
  capitalize: stringHelpers.capitalize,
  capitalizeWords: stringHelpers.capitalizeWords,
  upper: stringHelpers.upper,
  lower: stringHelpers.lower,
  titleCase: stringHelpers.titleCase,
  kebabCase: stringHelpers.kebabCase,
  snakeCase: stringHelpers.snakeCase,
  camelCase: stringHelpers.camelCase,
  pascalCase: stringHelpers.pascalCase,
  truncate: stringHelpers.truncate,
  clean: stringHelpers.clean,
  pluralize: stringHelpers.pluralize,
  padStart: stringHelpers.padStart,
  padEnd: stringHelpers.padEnd,
  contains: stringHelpers.contains,
  replaceAll: stringHelpers.replaceAll,
  initials: stringHelpers.initials,
};
