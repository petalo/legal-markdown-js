/**
 * Number Formatting Utilities
 *
 * Shared utilities for converting numbers to various formats (Roman numerals,
 * alphabetic labels), used by both header processing and cross-reference processing.
 */

/**
 * Converts a number to Roman numeral
 *
 * Generates Roman numerals for header numbering using standard Roman numeral
 * conversion rules. Supports both uppercase and lowercase formats.
 *
 * @param {number} num - Number to convert (must be positive)
 * @param {boolean} [lowercase=false] - Whether to return lowercase roman numerals
 * @returns {string} Roman numeral string
 * @example
 * ```typescript
 * console.log(getRomanNumeral(1));        // 'I'
 * console.log(getRomanNumeral(4));        // 'IV'
 * console.log(getRomanNumeral(9));        // 'IX'
 * console.log(getRomanNumeral(10));       // 'X'
 * console.log(getRomanNumeral(49));       // 'XLIX'
 * console.log(getRomanNumeral(1994));     // 'MCMXCIV'
 * console.log(getRomanNumeral(5, true));  // 'v'
 * ```
 */
export function getRomanNumeral(num: number, lowercase: boolean = false): string {
  if (num <= 0) return '';

  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' },
  ];

  let roman = '';
  let remaining = num;

  for (const { value, numeral } of romanNumerals) {
    while (remaining >= value) {
      roman += numeral;
      remaining -= value;
    }
  }

  return lowercase ? roman.toLowerCase() : roman;
}

/**
 * Converts a number to alphabetic label (a, b, c, ... z, aa, ab, ...)
 *
 * Generates alphabetic labels for header numbering using a base-26 system.
 * Supports extended sequences beyond 'z' using double letters (aa, ab, etc.).
 *
 * @param {number} num - Number to convert (1-based)
 * @returns {string} Alphabetic label in lowercase
 * @example
 * ```typescript
 * console.log(getAlphaLabel(1));  // 'a'
 * console.log(getAlphaLabel(26)); // 'z'
 * console.log(getAlphaLabel(27)); // 'aa'
 * console.log(getAlphaLabel(28)); // 'ab'
 * console.log(getAlphaLabel(52)); // 'az'
 * console.log(getAlphaLabel(53)); // 'ba'
 * ```
 */
export function getAlphaLabel(num: number): string {
  if (num <= 0) return '';

  let label = '';
  let n = num;

  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(97 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
}
