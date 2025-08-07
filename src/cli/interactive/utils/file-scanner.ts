/**
 * File scanning utilities for Interactive CLI
 *
 * This module provides functionality for discovering and categorizing files
 * within the file system, focusing on supported document formats for
 * Legal Markdown processing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileItem } from '../types';

/**
 * Supported input file extensions for Legal Markdown processing
 *
 * These extensions are recognized as valid input formats that can be
 * processed by the Legal Markdown system.
 */
const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.rst', '.tex', '.latex', '.txt'];

/**
 * Recursively scan directory for supported files
 *
 * Performs a comprehensive directory traversal to discover all files
 * with supported extensions, returning them as structured FileItem objects
 * suitable for interactive selection menus.
 *
 * @param dirPath Absolute path to the directory to scan
 * @param baseDir Optional base directory for calculating relative paths. If not provided, uses process.cwd()
 * @returns Array of FileItem objects representing discovered files and directories
 */
export function scanDirectory(dirPath: string, baseDir?: string): FileItem[] {
  const items: FileItem[] = [];
  const relativeTo = baseDir || process.cwd();

  try {
    if (!fs.existsSync(dirPath)) {
      return items;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Add subdirectory files recursively
        const subItems = scanDirectory(fullPath, baseDir);
        items.push(...subItems);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          items.push({
            name: path.relative(relativeTo, fullPath),
            path: fullPath,
            type: 'file',
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}`);
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Scan for CSS files in styles directory, excluding highlight.css
 *
 * Discovers available CSS stylesheets for HTML/PDF output styling,
 * automatically excluding the reserved highlight.css file which is
 * used internally for field highlighting functionality.
 *
 * @param stylesDir Absolute path to the styles directory to scan
 * @returns Array of CSS filenames available for user selection
 */
export function scanCssFiles(stylesDir: string): string[] {
  const cssFiles: string[] = [];

  try {
    if (!fs.existsSync(stylesDir)) {
      return cssFiles;
    }

    const entries = fs.readdirSync(stylesDir);

    for (const entry of entries) {
      if (entry.endsWith('.css') && entry !== 'highlight.css') {
        cssFiles.push(entry);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan CSS directory ${stylesDir}`);
  }

  return cssFiles.sort();
}

/**
 * Check if a file exists and is readable
 *
 * Validates that a given file path points to an accessible file,
 * useful for confirming file selections before processing.
 *
 * @param filePath Absolute path to the file to validate
 * @returns True if file exists and is accessible, false otherwise
 */
export function isValidFile(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
