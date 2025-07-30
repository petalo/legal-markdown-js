/**
 * File System Utilities
 *
 * This module provides essential file system operations with proper error handling
 * and path manipulation utilities for the Legal Markdown processing system.
 *
 * Features:
 * - Safe file read/write operations with error handling
 * - Directory creation with recursive support
 * - Path resolution and manipulation
 * - File extension handling
 *
 * @example
 * ```typescript
 * import { readFileSync, writeFileSync, resolveFilePath } from './file-system';
 *
 * // Read a file safely
 * const content = readFileSync('./document.md');
 *
 * // Write with automatic directory creation
 * writeFileSync('./output/processed.md', content);
 *
 * // Resolve relative paths
 * const fullPath = resolveFilePath('./docs', 'contract.md');
 * ```
 *
 * @module
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileNotFoundError } from '../errors/index';

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
