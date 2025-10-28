/**
 * @fileoverview Mathematical Helper Functions for Template Processing
 *
 * These helpers provide basic mathematical operations for use in templates.
 * They are designed to work with Handlebars templates and replace legacy
 * mathematical expressions.
 *
 * Migration examples:
 * - {{price * quantity}} → {{multiply price quantity}}
 * - {{total / count}} → {{divide total count}}
 * - {{a + b}} → {{add a b}}
 * - {{a - b}} → {{subtract a b}}
 *
 * @example
 * ```typescript
 * import { multiply, add } from '@extensions/helpers/math-helpers';
 *
 * const total = multiply(10, 5); // 50
 * const sum = add(10, 5); // 15
 * ```
 */

/**
 * Multiply two numbers
 *
 * @param a - First number
 * @param b - Second number
 * @returns Product of a and b, or NaN if inputs are invalid
 *
 * @example
 * ```typescript
 * multiply(10, 5); // 50
 * multiply('10', '5'); // 50 (strings are converted to numbers)
 * multiply('abc', 5); // NaN (invalid input)
 * ```
 */
export function multiply(a: number | string, b: number | string): number {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB)) {
    return NaN;
  }

  return numA * numB;
}

/**
 * Divide two numbers
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient of a divided by b, or NaN if inputs are invalid or division by zero
 *
 * @example
 * ```typescript
 * divide(10, 5); // 2
 * divide('10', '2'); // 5
 * divide(10, 0); // NaN (division by zero)
 * divide('abc', 5); // NaN (invalid input)
 * ```
 */
export function divide(a: number | string, b: number | string): number {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB) || numB === 0) {
    return NaN;
  }

  return numA / numB;
}

/**
 * Add two numbers
 *
 * @param a - First number
 * @param b - Second number
 * @returns Sum of a and b, or NaN if inputs are invalid
 *
 * @example
 * ```typescript
 * add(10, 5); // 15
 * add('10', '5'); // 15 (strings are converted to numbers)
 * add('abc', 5); // NaN (invalid input)
 * ```
 */
export function add(a: number | string, b: number | string): number {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB)) {
    return NaN;
  }

  return numA + numB;
}

/**
 * Subtract two numbers
 *
 * @param a - Minuend
 * @param b - Subtrahend
 * @returns Difference of a minus b, or NaN if inputs are invalid
 *
 * @example
 * ```typescript
 * subtract(10, 5); // 5
 * subtract('10', '3'); // 7
 * subtract('abc', 5); // NaN (invalid input)
 * ```
 */
export function subtract(a: number | string, b: number | string): number {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB)) {
    return NaN;
  }

  return numA - numB;
}

/**
 * Calculate modulo (remainder) of two numbers
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Remainder of a divided by b, or NaN if inputs are invalid or division by zero
 *
 * @example
 * ```typescript
 * modulo(10, 3); // 1
 * modulo(15, 4); // 3
 * modulo(10, 0); // NaN (division by zero)
 * modulo('abc', 3); // NaN (invalid input)
 * ```
 */
export function modulo(a: number | string, b: number | string): number {
  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB) || numB === 0) {
    return NaN;
  }

  return numA % numB;
}

/**
 * Raise a number to a power
 *
 * @param base - Base number
 * @param exponent - Exponent
 * @returns Base raised to the exponent power, or NaN if inputs are invalid
 *
 * @example
 * ```typescript
 * power(2, 3); // 8
 * power(10, 2); // 100
 * power('abc', 2); // NaN (invalid input)
 * ```
 */
export function power(base: number | string, exponent: number | string): number {
  const numBase = Number(base);
  const numExponent = Number(exponent);

  if (isNaN(numBase) || isNaN(numExponent)) {
    return NaN;
  }

  return Math.pow(numBase, numExponent);
}
