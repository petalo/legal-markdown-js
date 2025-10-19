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
import { ImportProcessingResult, LegalMarkdownOptions } from '../../types';
import { parseYamlFrontMatter } from '../parsers/yaml-parser';
import { mergeSequentially, MergeOptions } from '../utils/frontmatter-merger';

/**
 * Processes partial imports in a LegalMarkdown document
 *
 * This is the main function that processes import statements using the @import syntax.
 * It recursively resolves and includes external files, tracking all imported files
 * and handling errors gracefully when files cannot be found or loaded.
 *
 * By default, it also extracts YAML frontmatter from imported files and merges it using
 * the "source always wins" strategy with flattened granular merging. This can be disabled
 * with the disableFrontmatterMerge option.
 *
 * @deprecated This function is deprecated and will be removed in v4.0.0.
 * Use `processLegalMarkdownWithRemark()` with the `remarkImports` plugin instead.
 * The remark-based approach inserts content as AST nodes and provides better error handling.
 * @see {@link https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md Migration Guide}
 *
 * @param {string} content - The document content containing import statements
 * @param {string} [basePath] - Optional base path for resolving relative imports
 * @param {Record<string, any>} [currentMetadata] - Current document metadata for merging
 * @param {LegalMarkdownOptions} [options] - Processing options including frontmatter merge settings
 * @returns {ImportProcessingResult} Object containing processed content, list of imported files, and merged metadata
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
export function processPartialImports(
  content: string,
  basePath?: string,
  currentMetadata?: Record<string, any>,
  options?: LegalMarkdownOptions
): ImportProcessingResult {
  // DEPRECATION WARNING
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    console.warn(
      '[DEPRECATION] processPartialImports() is deprecated and will be removed in v4.0.0. ' +
        'Use processLegalMarkdownWithRemark() with remarkImports plugin instead. ' +
        'See: https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md'
    );
  }

  const startTime = Date.now();
  const timeoutMs = 30000; // 30 seconds for complete import processing
  // Regular expression to match import statements
  // Format: @import [filename]
  const importPattern = /@import\s+(.+?)(?:\s|$)/g;

  const importedFiles: string[] = [];
  const importedMetadataList: Record<string, any>[] = [];

  // Configure merge options based on processing options
  const mergeOptions: MergeOptions = {
    filterReserved: true,
    validateTypes: options?.validateImportTypes ?? true,
    logOperations: options?.logImportOperations ?? false,
    includeStats: options?.logImportOperations ?? false,
    timeoutMs: Math.max(2000, timeoutMs - (Date.now() - startTime)), // Allocate remaining time for merge
  };

  const processedContent = content.replace(importPattern, (match, filename) => {
    // Timeout safety check during import processing
    if (Date.now() - startTime > timeoutMs) {
      const message =
        `Import processing timed out after ${timeoutMs}ms. ` +
        'This may indicate complex nested imports or circular references.';
      throw new Error(message);
    }

    // Clean up filename (remove quotes, etc.)
    const cleanFilename = filename.trim().replace(/['"]/g, '');

    try {
      // Resolve the import path
      const importPath = resolveImportPath(cleanFilename, basePath);

      // Read the imported file
      const importedContent = fs.readFileSync(importPath, 'utf8');

      // Track imported files
      importedFiles.push(importPath);

      let processedImportContent = importedContent;
      let importedMetadata: Record<string, any> = {};

      // Extract frontmatter unless merging is explicitly disabled
      if (options?.disableFrontmatterMerge !== true) {
        const yamlResult = parseYamlFrontMatter(importedContent, false);
        processedImportContent = yamlResult.content;
        importedMetadata = yamlResult.metadata;

        // Store metadata for later merging
        if (Object.keys(importedMetadata).length > 0) {
          importedMetadataList.push(importedMetadata);

          if (options?.logImportOperations) {
            const fieldCount = Object.keys(importedMetadata).length;
            console.log(`Extracted ${fieldCount} metadata fields from ${cleanFilename}`);
          }
        }
      }

      // Process nested imports (pass along metadata and options)
      const nestedResult = processPartialImports(
        processedImportContent,
        path.dirname(importPath),
        importedMetadata,
        options
      );

      importedFiles.push(...nestedResult.importedFiles);

      // Collect nested metadata if available
      if (nestedResult.mergedMetadata && Object.keys(nestedResult.mergedMetadata).length > 0) {
        importedMetadataList.push(nestedResult.mergedMetadata);
      }

      // Add import tracing comments if enabled
      let tracedContent = nestedResult.content;
      if (options?.importTracing) {
        const relativeImportPath = path.relative(basePath || process.cwd(), importPath);
        const startComment = `<!-- start import: ${relativeImportPath} -->`;
        const endComment = `<!-- end import: ${relativeImportPath} -->`;
        tracedContent = `${startComment}\n${tracedContent}\n${endComment}`;
      }

      return tracedContent;
    } catch (error) {
      // Handle import errors gracefully without logging to stderr
      return `<!-- Error importing ${cleanFilename} -->`;
    }
  });

  // Merge all collected metadata unless explicitly disabled
  let mergedMetadata: Record<string, any> | undefined;
  const shouldMerge = options?.disableFrontmatterMerge !== true && importedMetadataList.length > 0;
  if (shouldMerge) {
    const initialMetadata = currentMetadata || {};

    if (options?.logImportOperations) {
      const currentFieldCount = Object.keys(initialMetadata).length;
      console.log(
        `Merging metadata from ${importedMetadataList.length} imports with ${currentFieldCount} current fields`
      );
    }

    // Calculate remaining time and allocate granular timeouts
    const remainingTime = timeoutMs - (Date.now() - startTime);
    if (remainingTime < 1000) {
      throw new Error('Insufficient time remaining for metadata merging.');
    }

    const perImportTimeout = Math.max(500, Math.floor(remainingTime / importedMetadataList.length));
    const mergeResult = mergeSequentially(initialMetadata, importedMetadataList, {
      ...mergeOptions,
      timeoutMs: perImportTimeout,
    });
    mergedMetadata = mergeResult.metadata;

    if (options?.logImportOperations && mergeResult.stats) {
      console.log('Frontmatter merge completed:');
      console.log(`  - Properties added: ${mergeResult.stats.propertiesAdded}`);
      console.log(`  - Conflicts resolved: ${mergeResult.stats.conflictsResolved}`);
      console.log(`  - Reserved fields filtered: ${mergeResult.stats.reservedFieldsFiltered}`);
      if (mergeResult.stats.addedFields.length > 0) {
        console.log(`  - Added fields: ${mergeResult.stats.addedFields.join(', ')}`);
      }
      if (mergeResult.stats.conflictedFields.length > 0) {
        console.log(
          `  - Conflicted fields (source wins): ${mergeResult.stats.conflictedFields.join(', ')}`
        );
      }
    }
  }

  return {
    content: processedContent,
    importedFiles,
    mergedMetadata,
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
 * @deprecated This function is deprecated and will be removed in v4.0.0.
 * Use `processLegalMarkdownWithRemark()` with the `remarkImports` plugin instead.
 * The remark-based approach handles validation automatically during import processing.
 * @see {@link https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md Migration Guide}
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
  // DEPRECATION WARNING
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    console.warn(
      '[DEPRECATION] validateImports() is deprecated and will be removed in v4.0.0. ' +
        'Use processLegalMarkdownWithRemark() with remarkImports plugin instead. ' +
        'See: https://github.com/yourrepo/legal-markdown-js/blob/main/docs/migration-guide.md'
    );
  }

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
