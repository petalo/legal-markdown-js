/**
 * @fileoverview Object Flattening Utilities for Frontmatter Merge
 *
 * This module provides utilities to flatten hierarchical objects into dot notation
 * and reconstruct them back to nested objects. Used for granular frontmatter merging
 * where individual properties can be compared and merged independently.
 *
 * Features:
 * - Flatten nested objects to dot notation (e.g., {a: {b: 1}} → {"a.b": 1})
 * - Unflatten dot notation back to nested objects
 * - Handle arrays as atomic values
 * - Preserve null/undefined values
 * - Type-safe operations
 *
 * @example
 * ```typescript
 * import { flattenObject, unflattenObject } from './object-flattener';
 *
 * const nested = {
 *   config: {
 *     level: "high",
 *     options: {
 *       debug: true
 *     }
 *   },
 *   items: [1, 2, 3]
 * };
 *
 * const flattened = flattenObject(nested);
 * // {
 * //   "config.level": "high",
 * //   "config.options.debug": true,
 * //   "items": [1, 2, 3]
 * // }
 *
 * const restored = unflattenObject(flattened);
 * // Back to original nested structure
 * ```
 */

/**
 * Numeric typed array constructors (Issue #141)
 * These types should be treated as atomic values during flattening/merging
 */
export const NUMERIC_TYPED_ARRAY_TYPES = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
] as const;

/**
 * Checks if a value is a Buffer instance
 * Handles Node.js Buffer availability check
 *
 * @param value - Value to check
 * @returns True if value is a Buffer instance
 */
export function isBuffer(value: any): boolean {
  return typeof Buffer !== 'undefined' && value instanceof Buffer;
}

/**
 * Checks if a value is a BigInt typed array
 * Handles BigInt typed array availability and TypeScript type compatibility
 *
 * @param value - Value to check
 * @returns True if value is a BigInt typed array
 */
export function isBigIntTypedArray(value: any): boolean {
  if (typeof BigInt64Array !== 'undefined' && value instanceof BigInt64Array) {
    return true;
  }
  if (typeof BigUint64Array !== 'undefined' && value instanceof BigUint64Array) {
    return true;
  }
  return false;
}

/**
 * Checks if a value is any typed array (numeric or BigInt)
 *
 * @param value - Value to check
 * @returns True if value is a typed array
 */
export function isTypedArray(value: any): boolean {
  return NUMERIC_TYPED_ARRAY_TYPES.some(Type => value instanceof Type) || isBigIntTypedArray(value);
}

/**
 * Checks if a value should be treated as atomic (not flattened)
 *
 * Atomic values include primitives, arrays, and special object types like Date, RegExp,
 * Error, Buffer, and typed arrays. These should not be recursively flattened because
 * they have special semantics that would be lost during flattening.
 *
 * @param value - Value to check
 * @returns True if value should be treated as atomic, false if it should be flattened
 *
 * @example
 * ```typescript
 * isAtomicValue(null);           // true (primitive)
 * isAtomicValue([1, 2, 3]);      // true (array)
 * isAtomicValue(new Date());     // true (special object type)
 * isAtomicValue({ a: 1 });       // false (plain object - should flatten)
 * ```
 */
function isAtomicValue(value: any): boolean {
  // Primitives and null/undefined
  if (value === null || value === undefined) return true;
  if (typeof value !== 'object') return true; // string, number, boolean, etc.

  // Arrays are atomic
  if (Array.isArray(value)) return true;

  // Special object types that should be treated as atomic (Issue #141)
  if (value instanceof Date) return true;
  if (value instanceof RegExp) return true;
  if (value instanceof Error) return true;

  // Node.js Buffer
  if (isBuffer(value)) return true;

  // Collections
  if (value instanceof Set || value instanceof WeakSet) return true;
  if (value instanceof Map || value instanceof WeakMap) return true;

  // Typed arrays (numeric and BigInt)
  if (isTypedArray(value)) return true;

  // Regular plain object - should be flattened
  return false;
}

/**
 * Converts a hierarchical object to dot notation
 *
 * Recursively traverses object properties and creates flat keys using dot notation.
 * Arrays and special object types (Date, RegExp, Error, Buffer, etc.) are treated as
 * atomic values and not flattened.
 *
 * @param obj - Object to flatten
 * @param prefix - Current prefix for nested properties (used internally)
 * @param visited - WeakSet for circular reference detection (used internally)
 * @param startTime - Start timestamp for timeout detection (used internally)
 * @param timeoutMs - Maximum execution time in milliseconds (default: 5000ms)
 * @returns Flattened object with dot notation keys
 * @throws Error if operation times out or circular reference detected
 *
 * @example
 * ```typescript
 * const nested = {
 *   client: {
 *     name: "Acme Corp",
 *     contact: {
 *       email: "contact@acme.com"
 *     }
 *   },
 *   tags: ["legal", "contract"],
 *   created: new Date("2025-01-15")
 * };
 *
 * const result = flattenObject(nested);
 * // {
 * //   "client.name": "Acme Corp",
 * //   "client.contact.email": "contact@acme.com",
 * //   "tags": ["legal", "contract"],
 * //   "created": Date object (preserved, not flattened)
 * // }
 * ```
 */
export function flattenObject(
  obj: any,
  prefix = '',
  visited = new WeakSet(),
  startTime = Date.now(),
  timeoutMs = 5000
): Record<string, any> {
  // Timeout safety check
  if (Date.now() - startTime > timeoutMs) {
    const message =
      `Object flattening timed out after ${timeoutMs}ms. ` +
      'This may indicate a complex nested structure or circular references.';
    throw new Error(message);
  }

  if (obj === null || obj === undefined) {
    return {};
  }

  const flattened: Record<string, any> = {};

  // Handle atomic values (primitives, arrays, special types)
  if (isAtomicValue(obj)) {
    if (prefix) {
      flattened[prefix] = obj;
    }
    return flattened;
  }

  // Circular reference detection
  if (visited.has(obj)) {
    console.warn(`Circular reference detected at path '${prefix}'. Replacing with placeholder.`);
    if (prefix) {
      flattened[prefix] = '[Circular Reference]';
    }
    return flattened;
  }
  visited.add(obj);

  // Process object properties
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (isAtomicValue(value)) {
      // Treat as atomic value (includes null, undefined, primitives, arrays, Date, RegExp, etc.)
      flattened[newKey] = value;
    } else {
      // Recursively flatten nested plain objects only
      Object.assign(flattened, flattenObject(value, newKey, visited, startTime, timeoutMs));
    }
  }

  visited.delete(obj);
  return flattened;
}

/**
 * Reconstructs a hierarchical object from dot notation
 *
 * Takes a flattened object with dot notation keys and rebuilds the nested structure.
 * Handles type coercion and creates intermediate objects as needed.
 *
 * @param flattened - Flattened object with dot notation keys
 * @returns Reconstructed nested object
 *
 * @example
 * ```typescript
 * const flattened = {
 *   "config.database.host": "localhost",
 *   "config.database.port": 5432,
 *   "config.debug": true,
 *   "items": ["a", "b", "c"]
 * };
 *
 * const result = unflattenObject(flattened);
 * // {
 * //   config: {
 * //     database: {
 * //       host: "localhost",
 * //       port: 5432
 * //     },
 * //     debug: true
 * //   },
 * //   items: ["a", "b", "c"]
 * // }
 * ```
 */
export function unflattenObject(flattened: Record<string, any>): any {
  if (!flattened || typeof flattened !== 'object') {
    return flattened;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(flattened)) {
    const parts = key.split('.');
    let current = result;

    // Navigate/create the nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!(part in current)) {
        current[part] = {};
      } else if (typeof current[part] !== 'object' || Array.isArray(current[part])) {
        // If there's a conflict (primitive/array vs object), object wins
        current[part] = {};
      }

      current = current[part];
    }

    // Set the final value
    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
  }

  return result;
}

/**
 * Validates that flattening and unflattening are reversible
 *
 * Utility function for testing that ensures the flatten/unflatten operations
 * preserve the original object structure (with some limitations for arrays).
 *
 * @param original - Original object to test
 * @returns True if operations are reversible, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { a: { b: { c: 1 } } };
 * console.log(isReversible(obj)); // true
 *
 * const objWithArray = { items: [1, 2, 3], config: { debug: true } };
 * console.log(isReversible(objWithArray)); // true
 * ```
 */
export function isReversible(original: any): boolean {
  try {
    const flattened = flattenObject(original);
    const restored = unflattenObject(flattened);

    // Deep comparison (simplified for basic types)
    return JSON.stringify(original) === JSON.stringify(restored);
  } catch (error) {
    return false;
  }
}

/**
 * Gets all dot notation paths from an object
 *
 * Returns all possible dot notation paths that would be created by flattening,
 * useful for validation and debugging.
 *
 * @param obj - Object to get paths from
 * @returns Array of dot notation paths
 *
 * @example
 * ```typescript
 * const obj = {
 *   user: {
 *     profile: {
 *       name: "John"
 *     },
 *     settings: {
 *       theme: "dark"
 *     }
 *   }
 * };
 *
 * const paths = getObjectPaths(obj);
 * // ["user.profile.name", "user.settings.theme"]
 * ```
 */
export function getObjectPaths(obj: any, prefix = '', timeoutMs = 5000): string[] {
  const flattened = flattenObject(obj, prefix, new WeakSet(), Date.now(), timeoutMs);
  return Object.keys(flattened);
}
