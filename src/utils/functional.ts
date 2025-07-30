/**
 * Functional Programming Utilities
 *
 * This module provides functional programming utilities and patterns
 * for the Legal Markdown processing system.
 *
 * Features:
 * - Function debouncing for performance optimization
 * - Deep object merging for configuration handling
 * - Type guards and utility functions
 *
 * @example
 * ```typescript
 * import { debounce, deepMerge } from './functional';
 *
 * // Create debounced function
 * const debouncedSave = debounce(saveDocument, 300);
 *
 * // Merge configuration objects
 * const config = deepMerge(defaultConfig, userConfig);
 * ```
 *
 * @module
 */

/**
 * Creates a debounced version of a function that delays execution
 *
 * @param {T} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The debounced function
 * @example
 * ```typescript
 * const debouncedSave = debounce(saveDocument, 300);
 * debouncedSave(content); // Will only execute after 300ms of inactivity
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Performs a deep merge of objects, combining nested properties
 *
 * @param {T} target - The target object to merge into
 * @param {...Partial<T>} sources - The source objects to merge from
 * @returns {T} The merged object
 * @example
 * ```typescript
 * const merged = deepMerge(
 *   { a: { b: 1 } },
 *   { a: { c: 2 } }
 * );
 * // Returns: { a: { b: 1, c: 2 } }
 * ```
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, any>, source[key] as Record<string, any>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Type guard to check if an item is a plain object
 *
 * @param {any} item - The item to check
 * @returns {boolean} True if the item is a plain object, false otherwise
 */
export function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
