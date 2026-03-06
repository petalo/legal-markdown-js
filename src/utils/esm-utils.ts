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
    } catch {
      // Continue to other methods
    }
  }

  // Try CommonJS __dirname first
  try {
    if (typeof __dirname !== 'undefined') {
      return __dirname;
    }
  } catch {
    // Not in CommonJS environment
  }

  // Skip ESM detection in TypeScript compilation for CommonJS
  // This will be handled at runtime if needed

  // Final fallback - use process.cwd()
  return process.cwd();
}

