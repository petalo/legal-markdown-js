/**
 * File Naming Utilities
 *
 * This module provides utilities for generating file names with suffixes,
 * handling conflicts, and managing file naming conventions used throughout
 * the Legal Markdown JS application.
 */

import * as path from 'path';

/**
 * Common file suffixes used in the application
 */
export const FILE_SUFFIXES = {
  HIGHLIGHT: 'HIGHLIGHT',
  ORIGINAL: 'ORIGINAL',
  PROCESSED: 'PROCESSED',
} as const;

/**
 * Add a suffix to a filename before the extension
 *
 * @param filePath The original file path
 * @param suffix The suffix to add (without dots)
 * @returns The new file path with suffix
 *
 * @example
 * ```typescript
 * addSuffixToFilename('document.pdf', 'HIGHLIGHT')
 * // Returns: 'document.HIGHLIGHT.pdf'
 *
 * addSuffixToFilename('/path/contract.md', 'ORIGINAL')
 * // Returns: '/path/contract.ORIGINAL.md'
 * ```
 */
export function addSuffixToFilename(filePath: string, suffix: string): string {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);

  const newFilename = `${baseName}.${suffix}${ext}`;

  // If the dirname is just '.', check if original path started with './'
  if (dirName === '.') {
    return filePath.startsWith('./') ? `./${newFilename}` : newFilename;
  }

  return path.join(dirName, newFilename);
}

/**
 * Generate paths for original and processed versions of a file
 *
 * @param filePath The base file path
 * @returns Object with original and processed file paths
 *
 * @example
 * ```typescript
 * generateArchivePaths('/archive/document.md')
 * // Returns: {
 * //   original: '/archive/document.ORIGINAL.md',
 * //   processed: '/archive/document.PROCESSED.md'
 * // }
 * ```
 */
export function generateArchivePaths(filePath: string): {
  original: string;
  processed: string;
} {
  return {
    original: addSuffixToFilename(filePath, FILE_SUFFIXES.ORIGINAL),
    processed: addSuffixToFilename(filePath, FILE_SUFFIXES.PROCESSED),
  };
}

/**
 * Generate highlight version file path
 *
 * @param filePath The original file path
 * @returns The file path with HIGHLIGHT suffix
 *
 * @example
 * ```typescript
 * generateHighlightPath('document.pdf')
 * // Returns: 'document.HIGHLIGHT.pdf'
 * ```
 */
export function generateHighlightPath(filePath: string): string {
  return addSuffixToFilename(filePath, FILE_SUFFIXES.HIGHLIGHT);
}

/**
 * Check if two file contents are identical
 *
 * @param content1 First file content
 * @param content2 Second file content
 * @returns True if contents are identical
 */
export function areContentsIdentical(content1: string, content2: string): boolean {
  // Normalize line endings and trim whitespace for comparison
  const normalize = (content: string) => content.replace(/\r\n/g, '\n').trim();
  return normalize(content1) === normalize(content2);
}
