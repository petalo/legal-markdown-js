/**
 * @fileoverview ESM utility functions for safe environment detection
 *
 * This module provides safe utilities for working with ESM modules without
 * using eval() or other potentially unsafe patterns.
 */

import { fileURLToPath } from 'url';
import * as path from 'path';

/**
 * Safely get the current directory name in both CommonJS and ESM environments
 * @param importMetaUrl - Optional import.meta.url for ESM environments
 * @returns Current directory path
 */
export function getCurrentDir(importMetaUrl?: string): string {
  // If we have import.meta.url passed explicitly, use it (safest)
  if (importMetaUrl) {
    try {
      const __filename = fileURLToPath(importMetaUrl);
      return path.dirname(__filename);
    } catch (e) {
      // Continue to other methods
    }
  }

  // Try CommonJS __dirname first
  try {
    if (typeof __dirname !== 'undefined') {
      return __dirname;
    }
  } catch (e) {
    // Not in CommonJS environment
  }

  // Skip ESM detection in TypeScript compilation for CommonJS
  // This will be handled at runtime if needed

  // Final fallback - use process.cwd()
  return process.cwd();
}

/**
 * Get the directory name from a file path
 * @param filePath - The file path to get directory from
 * @returns Directory path
 */
export function getDirFromPath(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Check if we're running in an ESM environment
 * @returns True if ESM, false if CommonJS
 */
export function isESM(): boolean {
  // Simple heuristic: if __dirname is not available, we're likely in ESM
  try {
    return typeof require === 'undefined';
  } catch {
    return true;
  }
}

/**
 * Check if we're running in a CommonJS environment
 * @returns True if CommonJS, false if ESM
 */
export function isCommonJS(): boolean {
  try {
    return typeof __dirname !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get module information safely
 * @param importMetaUrl - Optional import.meta.url
 * @returns Module information object
 */
export function getModuleInfo(importMetaUrl?: string): {
  dir: string;
  isESM: boolean;
  isCommonJS: boolean;
} {
  return {
    dir: getCurrentDir(importMetaUrl),
    isESM: isESM(),
    isCommonJS: isCommonJS(),
  };
}
