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
 * @returns Product of a and b
 *
 * @example
 * ```typescript
 * multiply(10, 5); // 50
 * multiply('10', '5'); // 50 (strings are converted to numbers)
 * ```
 */
export function multiply(a: number | string, b: number | string): number {
  return Number(a) * Number(b);
}

/**
 * Divide two numbers
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient of a divided by b
 *
 * @example
 * ```typescript
 * divide(10, 5); // 2
 * divide('10', '2'); // 5
 * ```
 */
export function divide(a: number | string, b: number | string): number {
  return Number(a) / Number(b);
}

/**
 * Add two numbers
 *
 * @param a - First number
 * @param b - Second number
 * @returns Sum of a and b
 *
 * @example
 * ```typescript
 * add(10, 5); // 15
 * add('10', '5'); // 15 (strings are converted to numbers)
 * ```
 */
export function add(a: number | string, b: number | string): number {
  return Number(a) + Number(b);
}

/**
 * Subtract two numbers
 *
 * @param a - Minuend
 * @param b - Subtrahend
 * @returns Difference of a minus b
 *
 * @example
 * ```typescript
 * subtract(10, 5); // 5
 * subtract('10', '3'); // 7
 * ```
 */
export function subtract(a: number | string, b: number | string): number {
  return Number(a) - Number(b);
}

/**
 * Calculate modulo (remainder) of two numbers
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Remainder of a divided by b
 *
 * @example
 * ```typescript
 * modulo(10, 3); // 1
 * modulo(15, 4); // 3
 * ```
 */
export function modulo(a: number | string, b: number | string): number {
  return Number(a) % Number(b);
}

/**
 * Raise a number to a power
 *
 * @param base - Base number
 * @param exponent - Exponent
 * @returns Base raised to the exponent power
 *
 * @example
 * ```typescript
 * power(2, 3); // 8
 * power(10, 2); // 100
 * ```
 */
export function power(base: number | string, exponent: number | string): number {
  return Math.pow(Number(base), Number(exponent));
}
