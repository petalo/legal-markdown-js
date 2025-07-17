/**
 * @fileoverview Import Processing Module for Legal Markdown Documents
 *
 * This module provides functionality to process partial imports in Legal Markdown
 * documents, allowing for modular document construction by including external
 * files. It supports both absolute and relative import paths, recursive import
 * processing, and comprehensive error handling for missing files.
 *
 * Features:
 * - Import syntax: @import filename
 * - Relative and absolute path resolution
 * - Recursive import processing (nested imports)
 * - Import tracking and cycle detection
 * - Error handling with fallback content
 * - Base path resolution for project organization
 * - Import validation and file existence checking
 *
 * @example
 * ```typescript
 * import { processPartialImports } from './import-processor';
 *
 * // Main document content
 * const content = `
 * # Service Agreement
 *
 * @import ./clauses/standard-terms.md
 *
 * ## Specific Terms
 * @import ./clauses/payment-terms.md
 * @import ./clauses/termination.md
 *
 * @import ./signatures/signature-block.md
 * `;
 *
 * const result = processPartialImports(content, './contracts');
 * console.log(result.content);      // Processed content with imports resolved
 * console.log(result.importedFiles); // Array of imported file paths
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { ImportProcessingResult } from '@types';

/**
 * Processes partial imports in a LegalMarkdown document
 *
 * This is the main function that processes import statements using the @import syntax.
 * It recursively resolves and includes external files, tracking all imported files
 * and handling errors gracefully when files cannot be found or loaded.
 *
 * @param {string} content - The document content containing import statements
 * @param {string} [basePath] - Optional base path for resolving relative imports
 * @returns {ImportProcessingResult} Object containing processed content and list of imported files
 * @example
 * ```typescript
 * // Basic import processing
 * const content = `
 * # Main Document
 * @import ./introduction.md
 * @import ./body.md
 * @import ./conclusion.md
 * `;
 *
 * const result = processPartialImports(content, './documents');
 * console.log(result.content);      // Content with imports resolved
 * console.log(result.importedFiles); // ['./documents/introduction.md', './documents/body.md', './documents/conclusion.md']
 *
 * // Nested imports example
 * // main.md: @import ./sections/terms.md
 * // terms.md: @import ./subsections/payment.md
 * // Result will include content from all three files
 *
 * // Error handling
 * const contentWithMissingFile = `
 * # Document
 * @import ./existing.md
 * @import ./missing.md
 * `;
 *
 * const result2 = processPartialImports(contentWithMissingFile);
 * // Result will include content from existing.md and error comment for missing.md
 * ```
 */
export function processPartialImports(content: string, basePath?: string): ImportProcessingResult {
  // Regular expression to match import statements
  // Format: @import [filename]
  const importPattern = /@import\s+(.+?)(?:\s|$)/g;

  const importedFiles: string[] = [];
  const processedContent = content.replace(importPattern, (match, filename) => {
    // Clean up filename (remove quotes, etc.)
    const cleanFilename = filename.trim().replace(/['"]/g, '');

    try {
      // Resolve the import path
      const importPath = resolveImportPath(cleanFilename, basePath);

      // Read the imported file
      const importedContent = fs.readFileSync(importPath, 'utf8');

      // Track imported files
      importedFiles.push(importPath);

      // Process nested imports
      const nestedResult = processPartialImports(importedContent, path.dirname(importPath));
      importedFiles.push(...nestedResult.importedFiles);

      return nestedResult.content;
    } catch (error) {
      console.error(`Error importing file ${cleanFilename}:`, error);
      return `<!-- Error importing ${cleanFilename} -->`;
    }
  });

  return {
    content: processedContent,
    importedFiles,
  };
}

/**
 * Resolves the absolute path of an import
 *
 * Converts relative import paths to absolute paths using the provided base path
 * or current working directory. Handles both relative and absolute paths correctly.
 *
 * @private
 * @param {string} importPath - Relative or absolute import path to resolve
 * @param {string} [basePath] - Base path for resolving relative imports
 * @returns {string} Absolute path to the imported file
 * @example
 * ```typescript
 * // Relative path resolution
 * const absolutePath = resolveImportPath("./clauses/terms.md", "/contracts");
 * // Returns: "/contracts/clauses/terms.md"
 *
 * // Absolute path (unchanged)
 * const absolutePath2 = resolveImportPath("/full/path/to/file.md");
 * // Returns: "/full/path/to/file.md"
 *
 * // Relative to current directory
 * const absolutePath3 = resolveImportPath("./local-file.md");
 * // Returns: "/current/working/directory/local-file.md"
 * ```
 */
function resolveImportPath(importPath: string, basePath?: string): string {
  // If the import path is absolute, use it directly
  if (path.isAbsolute(importPath)) {
    return importPath;
  }

  // If no base path provided, use current working directory
  const base = basePath || process.cwd();

  // Resolve relative to base path
  return path.resolve(base, importPath);
}

/**
 * Validates that all import paths in a document exist
 *
 * Checks all import statements in a document to ensure the referenced files exist
 * on the filesystem. Returns an array of error messages for any missing files,
 * or an empty array if all imports are valid.
 *
 * @param {string} content - The document content containing import statements to validate
 * @param {string} [basePath] - Optional base path for resolving relative imports
 * @returns {string[]} Array of validation errors, empty if all imports are valid
 * @example
 * ```typescript
 * const content = `
 * # Document
 * @import ./existing-file.md
 * @import ./missing-file.md
 * @import /absolute/path/to/file.md
 * `;
 *
 * const errors = validateImports(content, './documents');
 * console.log(errors);
 * // Output (if files are missing):
 * // [
 * //   "Import file not found: ./documents/missing-file.md",
 * //   "Import file not found: /absolute/path/to/file.md"
 * // ]
 *
 * // For valid imports
 * const validContent = `@import ./existing-file.md`;
 * const noErrors = validateImports(validContent, './documents');
 * console.log(noErrors); // [] (empty array)
 * ```
 */
export function validateImports(content: string, basePath?: string): string[] {
  const importPattern = /@import\s+(.+?)(?:\s|$)/g;
  const errors: string[] = [];

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const filename = match[1].trim().replace(/['"]/g, '');

    try {
      const importPath = resolveImportPath(filename, basePath);

      // Check if file exists
      if (!fs.existsSync(importPath)) {
        errors.push(`Import file not found: ${importPath}`);
      }
    } catch (error) {
      errors.push(`Error resolving import: ${filename}`);
    }
  }

  return errors;
}
