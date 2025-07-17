/**
 * @fileoverview Utility Library for Legal Markdown Processing
 *
 * This module provides essential utility functions for file operations,
 * path handling, data manipulation, and common programming patterns used
 * throughout the Legal Markdown processing system.
 *
 * Features:
 * - File system operations with error handling
 * - Path resolution and manipulation utilities
 * - Data transformation and merging functions
 * - Input validation and sanitization
 * - Performance optimization utilities (debounce)
 * - URL validation and file extension handling
 *
 * @example
 * ```typescript
 * import {
 *   readFileSync,
 *   writeFileSync,
 *   resolveFilePath,
 *   deepMerge,
 *   sanitizeFileName
 * } from './lib';
 *
 * // Read a file safely
 * const content = readFileSync('./document.md');
 *
 * // Resolve relative paths
 * const fullPath = resolveFilePath('./docs', 'contract.md');
 *
 * // Merge configuration objects
 * const config = deepMerge(defaultConfig, userConfig);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileNotFoundError } from '@errors';

/**
 * Ensures that a directory exists, creating it recursively if necessary
 *
 * @param {string} dirPath - The directory path to ensure exists
 * @returns {void}
 * @example
 * ```typescript
 * ensureDirectoryExists('./output/documents');
 * ```
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Reads a file synchronously with proper error handling
 *
 * @param {string} filePath - The path to the file to read
 * @returns {string} The file content as UTF-8 string
 * @throws {FileNotFoundError} When the file does not exist
 * @throws {Error} For other file system errors
 * @example
 * ```typescript
 * const content = readFileSync('./document.md');
 * ```
 */
export function readFileSync(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw error;
  }
}

/**
 * Writes content to a file synchronously, creating directories as needed
 *
 * @param {string} filePath - The path where the file will be written
 * @param {string} content - The content to write to the file
 * @returns {void}
 * @example
 * ```typescript
 * writeFileSync('./output/document.md', processedContent);
 * ```
 */
export function writeFileSync(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Resolves a file path relative to a base directory
 *
 * @param {string | undefined} basePath - The base directory path (defaults to cwd)
 * @param {string} filePath - The file path to resolve
 * @returns {string} The resolved absolute path
 * @example
 * ```typescript
 * const fullPath = resolveFilePath('./docs', 'contract.md');
 * // Returns: '/path/to/docs/contract.md'
 * ```
 */
export function resolveFilePath(basePath: string | undefined, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const base = basePath || process.cwd();
  return path.resolve(base, filePath);
}

/**
 * Gets the file extension from a file path in lowercase
 *
 * @param {string} filePath - The file path to extract extension from
 * @returns {string} The file extension in lowercase (including the dot)
 * @example
 * ```typescript
 * const ext = getFileExtension('document.MD');
 * // Returns: '.md'
 * ```
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Validates if a string is a valid URL
 *
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is a valid URL, false otherwise
 * @example
 * ```typescript
 * const isValid = isValidUrl('https://example.com');
 * // Returns: true
 * ```
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a file name by replacing invalid characters with underscores
 *
 * @param {string} fileName - The file name to sanitize
 * @returns {string} The sanitized file name
 * @example
 * ```typescript
 * const safe = sanitizeFileName('My Document!.pdf');
 * // Returns: 'My_Document_.pdf'
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9.-]/gi, '_');
}

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
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
