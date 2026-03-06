/**
 * @fileoverview Number Formatting and Conversion Helpers
 *
 * This module provides comprehensive number formatting utilities specifically
 * designed for legal and financial documents. It includes functions for currency
 * formatting, percentage display, number-to-words conversion, and various
 * numerical representations commonly used in legal contexts.
 *
 * Features:
 * - Currency formatting with multiple currency support (EUR, USD, GBP)
 * - Percentage formatting with customizable precision
 * - Number-to-words conversion for legal document amounts
 * - Integer formatting with thousand separators
 * - Flexible number formatting with custom separators
 * - Rounding utilities for precise calculations
 *
 * @example
 * ```typescript
 * import { formatCurrency, formatPercent, numberToWords } from './number-helpers';
 *
 * // Currency formatting
 * const amount = formatCurrency(1234.56, 'USD');  // "$1,234.56"
 *
 * // Percentage formatting
 * const rate = formatPercent(0.155, 2);           // "15.50%"
 *
 * // Number to words for legal documents
 * const words = numberToWords(1500);              // "one thousand five hundred"
 * ```
 */

import { getConfig } from '../../config';

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[,\s]/g, '');
  return parseFloat(cleaned);
}

function clampDecimals(decimals: number, fallback: number = 2): number {
  const numericDecimals = Number(decimals);
  const resolved = Number.isFinite(numericDecimals) ? numericDecimals : fallback;
  return Math.max(0, Math.min(20, Math.trunc(resolved)));
}

/**
 * Formats a number as an integer with thousand separators
 *
 * Converts a number to an integer representation with customizable thousand
 * separators. Useful for displaying whole numbers in legal documents with
 * proper formatting for readability.
 *
 * @param {number | string} value - The number to format
 * @param {string} separator - The thousand separator character (default: ',')
 * @returns {string} The formatted integer string
 *
 * @example
 * ```typescript
 * // Standard formatting
 * formatInteger(1234567);        // "1,234,567"
 * formatInteger(1234567.89);     // "1,234,567" (decimal part removed)
 *
 * // Custom separator
 * formatInteger(1234567, '.');   // "1.234.567"
 * formatInteger(1234567, ' ');   // "1 234 567"
 *
 * // String input
 * formatInteger('1234567');      // "1,234,567"
 *
 * // Invalid input handling
 * formatInteger('not a number'); // "not a number"
 * ```
 */
export function formatInteger(value: number | string, separator: string = ','): string {
  const num = parseNumber(value);
  if (isNaN(num)) return String(value);

  return Math.trunc(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Formats a number as a percentage with customizable precision
 *
 * Converts a number to percentage format with configurable decimal places
 * and optional percentage symbol. Useful for displaying rates, discounts,
 * and other percentage values in legal documents.
 *
 * @param {number | string} value - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} symbol - Whether to include the % symbol (default: true)
 * @returns {string} The formatted percentage string
 *
 * @example
 * ```typescript
 * // Standard percentage formatting
 * formatPercent(0.1556);           // "15.56%"
 * formatPercent(0.1556, 1);        // "15.6%"
 * formatPercent(0.1556, 0);        // "16%"
 *
 * // Without percentage symbol
 * formatPercent(0.1556, 2, false); // "15.56"
 *
 * // String input
 * formatPercent('0.25');           // "25.00%"
 *
 * // Values greater than 1 are treated as decimals too
 * formatPercent(1.5);              // "150.00%"
 * formatPercent(2.5);              // "250.00%"
 * ```
 */
export function formatPercent(
  value: number | string,
  decimals: number = 2,
  symbol: boolean = true
): string {
  const num = parseNumber(value);
  if (isNaN(num)) return String(value);
  const safeDecimals = clampDecimals(decimals, 2);

  // Always convert to percentage (multiply by 100)
  // Input should always be in decimal format: 0.21 = 21%, 1.5 = 150%
  const percentage = num * 100;
  const formatted = percentage.toFixed(safeDecimals);
  return symbol ? `${formatted}%` : formatted;
}

/**
 * Formats a number as currency with support for multiple currencies
 *
 * Converts a number to currency format with proper symbol placement,
 * thousand separators, and decimal precision. Supports EUR, USD, and GBP
 * with correct formatting conventions for each currency.
 *
 * @param {number | string} value - The number to format as currency
 * @param {'EUR' | 'USD' | 'GBP'} currency - The currency type (default: 'EUR')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} The formatted currency string
 *
 * @example
 * ```typescript
 * // Euro formatting (symbol after amount)
 * formatCurrency(1234.56, 'EUR');    // "1,234.56 €"
 * formatCurrency(1234.56, 'EUR', 0); // "1,235 €"
 *
 * // US Dollar formatting (symbol before amount)
 * formatCurrency(1234.56, 'USD');    // "$1,234.56"
 *
 * // British Pound formatting (symbol before amount)
 * formatCurrency(1234.56, 'GBP');    // "£1,234.56"
 *
 * // String input
 * formatCurrency('1234.56', 'USD');  // "$1,234.56"
 * ```
 */
export function formatCurrency(
  value: number | string,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR',
  decimals: number = 2,
  locale?: string
): string {
  const num = parseNumber(value);
  if (isNaN(num)) return String(value);

  const lang = locale || getConfig().processing.locale || 'en';
  const safeDecimals = clampDecimals(decimals, 2);

  if (lang.toLowerCase().startsWith('en')) {
    return manualCurrencyFormat(num, currency, safeDecimals);
  }

  try {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency,
      minimumFractionDigits: safeDecimals,
      maximumFractionDigits: safeDecimals,
    }).format(num);
  } catch {
    return manualCurrencyFormat(num, currency, safeDecimals);
  }
}

function manualCurrencyFormat(amount: number, currency: string, decimals: number): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };

  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = symbols[currency] || currency;

  // Different positioning for different currencies
  if (currency === 'EUR') {
    return `${formatted} ${symbol}`;
  } else {
    return `${symbol}${formatted}`;
  }
}

/**
 * Formats a number as Euro currency
 *
 * Convenience function for formatting numbers as Euro currency with
 * proper Euro symbol placement and formatting conventions.
 *
 * @param {number | string} value - The number to format as Euro
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} The formatted Euro currency string
 *
 * @example
 * ```typescript
 * formatEuro(1234.56);     // "1,234.56 €"
 * formatEuro(1234.56, 0);  // "1,235 €"
 * formatEuro('500');       // "500.00 €"
 * ```
 */
export function formatEuro(value: number | string, decimals: number | object = 2): string {
  // Handle Handlebars options object
  const decimalCount = typeof decimals === 'object' ? 2 : decimals;
  return formatCurrency(value, 'EUR', decimalCount);
}

/**
 * Formats a number as US Dollar currency
 *
 * Convenience function for formatting numbers as US Dollar currency with
 * proper dollar symbol placement and formatting conventions.
 *
 * @param {number | string} value - The number to format as US Dollar
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} The formatted US Dollar currency string
 *
 * @example
 * ```typescript
 * formatDollar(1234.56);     // "$1,234.56"
 * formatDollar(1234.56, 0);  // "$1,235"
 * formatDollar('500');       // "$500.00"
 * ```
 */
export function formatDollar(value: number | string, decimals: number | object = 2): string {
  // Handle Handlebars options object
  const decimalCount = typeof decimals === 'object' ? 2 : decimals;
  return formatCurrency(value, 'USD', decimalCount);
}

/**
 * Formats a number as British Pound currency
 *
 * Convenience function for formatting numbers as British Pound currency with
 * proper pound symbol placement and formatting conventions.
 *
 * @param {number | string} value - The number to format as British Pound
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} The formatted British Pound currency string
 *
 * @example
 * ```typescript
 * formatPound(1234.56);     // "£1,234.56"
 * formatPound(1234.56, 0);  // "£1,235"
 * formatPound('500');       // "£500.00"
 * ```
 */
export function formatPound(value: number | string, decimals: number | object = 2): string {
  // Handle Handlebars options object
  const decimalCount = typeof decimals === 'object' ? 2 : decimals;
  return formatCurrency(value, 'GBP', decimalCount);
}

/**
 * Converts a number to its written word representation
 *
 * Transforms numeric values into their English word equivalents, which is
 * particularly useful for legal documents where amounts are often written
 * in both numeric and word form for clarity and legal precision.
 *
 * @param {number | string} num - The number to convert to words
 * @returns {string} The number expressed in words
 *
 * Supported range: Supports numbers from 0 to 999,999,999 with decimal support
 * Decimal handling: Decimal parts are expressed as "and X cents"
 *
 * @example
 * ```typescript
 * // Whole numbers
 * numberToWords(0);        // "zero"
 * numberToWords(42);       // "forty two"
 * numberToWords(1500);     // "one thousand five hundred"
 * numberToWords(1000000);  // "one million"
 *
 * // Decimal numbers
 * numberToWords(123.45);   // "one hundred twenty three and forty five cents"
 * numberToWords(1000.50);  // "one thousand and fifty cents"
 *
 * // String input
 * numberToWords('456');    // "four hundred fifty six"
 *
 * // Negative numbers
 * numberToWords(-100);     // "negative one hundred"
 *
 * // Invalid input
 * numberToWords('invalid'); // "invalid"
 * ```
 */
export function numberToWords(num: number | string): string {
  const n = parseNumber(num);
  if (isNaN(n)) return String(num);

  if (Math.abs(n) > 999_999_999_999) {
    return n.toLocaleString('en-US');
  }

  if (n === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  const teens = [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const convertMillions = (num: number): string => {
    if (num >= 1000000) {
      return (
        convertMillions(Math.floor(num / 1000000)) + ' million ' + convertThousands(num % 1000000)
      );
    } else {
      return convertThousands(num);
    }
  };

  const convertThousands = (num: number): string => {
    if (num >= 1000) {
      return convertHundreds(Math.floor(num / 1000)) + ' thousand ' + convertHundreds(num % 1000);
    } else {
      return convertHundreds(num);
    }
  };

  const convertHundreds = (num: number): string => {
    let str = '';

    if (num > 99) {
      str += ones[Math.floor(num / 100)] + ' hundred ';
      num %= 100;
    }

    if (num > 19) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num > 9) {
      str += teens[num - 10] + ' ';
      return str.trim();
    }

    if (num > 0) {
      str += ones[num] + ' ';
    }

    return str.trim();
  };

  const isNegative = n < 0;
  const absoluteValue = Math.abs(n);
  let integerPart = Math.floor(absoluteValue);
  let decimalPart = Math.round((absoluteValue - integerPart) * 100);

  if (decimalPart === 100) {
    integerPart += 1;
    decimalPart = 0;
  }

  let result = convertMillions(integerPart);

  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + ' cents';
  }

  result = result.trim();
  return isNegative ? `negative ${result}` : result;
}

/**
 * Formats a number with custom decimal and thousand separators
 *
 * Provides flexible number formatting with customizable separators for
 * different locales and formatting requirements. Useful for international
 * legal documents that require specific number formatting conventions.
 *
 * @param {number | string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} decimalSeparator - Character for decimal separation (default: '.')
 * @param {string} thousandSeparator - Character for thousand separation (default: ',')
 * @returns {string} The formatted number string
 *
 * @example
 * ```typescript
 * // Standard US formatting
 * formatNumber(1234.56);              // "1,234.56"
 * formatNumber(1234.56, 3);           // "1,234.560"
 *
 * // European formatting (comma as decimal separator)
 * formatNumber(1234.56, 2, ',', ' '); // "1 234,56"
 * formatNumber(1234.56, 2, ',', '.'); // "1.234,56"
 *
 * // Custom formatting
 * formatNumber(1234.56, 1, ':', '|'); // "1|234:6"
 *
 * // String input
 * formatNumber('1234.56');            // "1,234.56"
 * ```
 */
export function formatNumber(
  value: number | string,
  decimals: number = 2,
  decimalSeparator: string = '.',
  thousandSeparator: string = ','
): string {
  const num = parseNumber(value);
  if (isNaN(num)) return String(value);
  const safeDecimals = clampDecimals(decimals, 2);

  const parts = num.toFixed(safeDecimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  return parts.join(decimalSeparator);
}

/**
 * Rounds a number to a specified number of decimal places
 *
 * Provides precise rounding functionality for numerical calculations in
 * legal documents. Uses standard mathematical rounding rules (0.5 rounds up).
 *
 * @param {number | string} value - The number to round
 * @param {number} decimals - Number of decimal places to round to (default: 0)
 * @returns {number} The rounded number
 *
 * @example
 * ```typescript
 * // Round to whole numbers
 * round(1234.56);        // 1235
 * round(1234.44);        // 1234
 *
 * // Round to decimal places
 * round(1234.5678, 2);   // 1234.57
 * round(1234.5678, 1);   // 1234.6
 * round(1234.5678, 3);   // 1234.568
 *
 * // String input
 * round('1234.56', 1);   // 1234.6
 *
 * // Invalid input handling
 * round('invalid');      // 0
 * ```
 */
export function round(value: number | string, decimals: number = 0): number {
  const num = parseNumber(value);
  if (isNaN(num)) return 0;

  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

const ORDINAL_RULES: Record<string, (n: number) => string> = {
  en: n => {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return n + 'st';
    if (j === 2 && k !== 12) return n + 'nd';
    if (j === 3 && k !== 13) return n + 'rd';
    return n + 'th';
  },
  es: n => n + '.º',
  fr: n => (n === 1 ? n + 'er' : n + 'e'),
  de: n => n + '.',
  pt: n => n + '.º',
  it: n => n + '°',
};

export function ordinal(n: number, locale?: string): string {
  const num = parseNumber(n);
  if (isNaN(num)) return String(n);
  const i = Math.trunc(num);
  const lang = (locale || getConfig().processing.locale || 'en').split('-')[0];
  const rule = ORDINAL_RULES[lang] || ORDINAL_RULES['en'];
  return rule(i);
}

export function abs(n: number): number {
  return Math.abs(parseNumber(n));
}

export function max(a: number, b: number): number {
  return Math.max(parseNumber(a), parseNumber(b));
}

export function min(a: number, b: number): number {
  return Math.min(parseNumber(a), parseNumber(b));
}
