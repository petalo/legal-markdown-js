/**
 * Batch Processing Module for Legal Markdown Documents
 *
 * This module provides functionality for processing multiple Legal Markdown files
 * in batch operations. It supports recursive directory processing, concurrent
 * file operations, progress tracking, and error handling.
 *
 * Features:
 * - Batch processing of multiple Legal Markdown files
 * - Recursive directory traversal with pattern matching
 * - Concurrent processing with configurable concurrency limits
 * - Progress tracking and error reporting callbacks
 * - Directory structure preservation in output
 * - File extension filtering and exclusion patterns
 * - Metadata export support for batch operations
 * - Statistics and performance tracking
 *
 * @example
 * ```typescript
 * import { processBatch } from './batch-processor';
 *
 * // Basic batch processing
 * const result = await processBatch({
 *   inputDir: './legal-docs',
 *   outputDir: './output',
 *   extensions: ['.md'],
 *   recursive: true
 * });
 *
 * // Advanced batch processing with callbacks
 * const result = await processBatch({
 *   inputDir: './contracts',
 *   outputDir: './processed-contracts',
 *   extensions: ['.md', '.txt'],
 *   recursive: true,
 *   concurrency: 3,
 *   exclude: ['temp', 'backup'],
 *   onProgress: (processed, total, currentFile) => {
 *     console.log(`Progress: ${processed}/${total} - ${currentFile}`);
 *   },
 *   onError: (file, error) => {
 *     console.error(`Error processing ${file}:`, error.message);
 *   }
 * });
 * ```
 *
 * @module
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { LegalMarkdownOptions } from '../types';
import { processLegalMarkdown } from '../index';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Configuration options for batch processing operations
 *
 * Extends LegalMarkdownOptions to include batch-specific settings like
 * directory paths, concurrency control, and progress callbacks.
 *
 * @interface BatchProcessingOptions
 * @extends {LegalMarkdownOptions}
 * @example
 * ```typescript
 * const options: BatchProcessingOptions = {
 *   inputDir: './legal-documents',
 *   outputDir: './processed-documents',
 *   extensions: ['.md', '.txt'],
 *   recursive: true,
 *   preserveStructure: true,
 *   exclude: ['temp', 'backup'],
 *   concurrency: 5,
 *   onProgress: (processed, total, currentFile) => {
 *     console.log(`Processing: ${currentFile} (${processed}/${total})`);
 *   }
 * };
 * ```
 */
export interface BatchProcessingOptions extends LegalMarkdownOptions {
  /** Input directory containing files to process */
  inputDir: string;

  /** Output directory for processed files */
  outputDir: string;

  /** File extensions to process (defaults to ['.md', '.txt']) */
  extensions?: string[];

  /** Whether to process subdirectories recursively */
  recursive?: boolean;

  /** Whether to preserve directory structure in output */
  preserveStructure?: boolean;

  /** Pattern to exclude files/directories */
  exclude?: string[];

  /** Maximum number of concurrent file processing operations */
  concurrency?: number;

  /** Callback for progress updates during batch processing */
  onProgress?: (processed: number, total: number, currentFile: string) => void;

  /** Callback for handling errors during file processing */
  onError?: (file: string, error: Error) => void;
}

/**
 * Result of batch processing operation
 *
 * Contains statistics and details about the batch processing operation,
 * including success/failure counts, file lists, and timing information.
 *
 * @interface BatchProcessingResult
 * @example
 * ```typescript
 * const result = await processBatch(options);
 *
 * console.log(`Successfully processed: ${result.totalProcessed} files`);
 * console.log(`Failed: ${result.totalErrors} files`);
 * console.log(`Processing time: ${result.processingTime}ms`);
 *
 * // List failed files
 * result.failedFiles.forEach(({ file, error }) => {
 *   console.error(`Failed to process ${file}: ${error}`);
 * });
 * ```
 */
export interface BatchProcessingResult {
  /** Total number of files successfully processed */
  totalProcessed: number;

  /** Number of files that failed processing */
  totalErrors: number;

  /** List of successfully processed file paths */
  successfulFiles: string[];

  /** List of failed files with error messages */
  failedFiles: Array<{ file: string; error: string }>;

  /** Total processing time in milliseconds */
  processingTime: number;
}

/**
 * Processes multiple legal markdown files in batch
 *
 * This function performs batch processing of Legal Markdown files with support
 * for recursive directory traversal, concurrent processing, and progress tracking.
 * It automatically handles file discovery, directory creation, and error management.
 *
 * @function processBatch
 * @param {BatchProcessingOptions} options - Configuration options for batch processing
 * @returns {Promise<BatchProcessingResult>} A promise that resolves to the processing result
 * @throws {Error} When input directory doesn't exist or other setup errors occur
 * @example
 * ```typescript
 * import { processBatch } from './batch-processor';
 *
 * // Process all .md files in a directory
 * const result = await processBatch({
 *   inputDir: './legal-documents',
 *   outputDir: './processed-documents',
 *   extensions: ['.md'],
 *   recursive: true,
 *   preserveStructure: true,
 *   concurrency: 3,
 *   onProgress: (processed, total, currentFile) => {
 *     console.log(`Progress: ${processed}/${total} - ${path.basename(currentFile)}`);
 *   },
 *   onError: (file, error) => {
 *     console.error(`Error processing ${file}:`, error.message);
 *   }
 * });
 *
 * console.log(`Processed ${result.totalProcessed} files successfully`);
 * console.log(`${result.totalErrors} files failed processing`);
 * ```
 */
export async function processBatch(
  options: BatchProcessingOptions
): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const {
    inputDir,
    outputDir,
    extensions = ['.md', '.txt'],
    recursive = false,
    preserveStructure = true,
    exclude = [],
    concurrency = 5,
    onProgress,
    onError,
    ...processingOptions
  } = options;

  // Validate input directory
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all files to process
  const filesToProcess = await findFilesToProcess(inputDir, extensions, recursive, exclude);

  if (filesToProcess.length === 0) {
    return {
      totalProcessed: 0,
      totalErrors: 0,
      successfulFiles: [],
      failedFiles: [],
      processingTime: Date.now() - startTime,
    };
  }

  const result: BatchProcessingResult = {
    totalProcessed: 0,
    totalErrors: 0,
    successfulFiles: [],
    failedFiles: [],
    processingTime: 0,
  };

  // Process files in batches with concurrency control
  const semaphore = new Semaphore(concurrency);
  const promises = filesToProcess.map(async filePath => {
    await semaphore.acquire();
    try {
      await processFile(
        filePath,
        inputDir,
        outputDir,
        preserveStructure,
        processingOptions,
        result,
        onProgress,
        onError
      );
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(promises);

  result.processingTime = Date.now() - startTime;
  return result;
}

/**
 * Finds all files to process in the given directory
 *
 * Recursively searches through directories to find files matching the specified
 * extensions while respecting exclusion patterns and recursive settings.
 *
 * @function findFilesToProcess
 * @param {string} dir - Directory to search in
 * @param {string[]} extensions - File extensions to include (e.g., ['.md', '.txt'])
 * @param {boolean} recursive - Whether to search subdirectories recursively
 * @param {string[]} exclude - Patterns to exclude from search
 * @returns {Promise<string[]>} Array of file paths matching the criteria
 * @private
 */
async function findFilesToProcess(
  dir: string,
  extensions: string[],
  recursive: boolean,
  exclude: string[]
): Promise<string[]> {
  const files: string[] = [];

  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    // Skip excluded files/directories
    if (exclude.some(pattern => entry.includes(pattern))) {
      continue;
    }

    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      if (recursive) {
        const subFiles = await findFilesToProcess(fullPath, extensions, recursive, exclude);
        files.push(...subFiles);
      }
    } else if (stats.isFile()) {
      const ext = path.extname(entry);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Processes a single file and writes the output
 *
 * Handles the processing of an individual Legal Markdown file, including reading
 * the source file, processing it through the Legal Markdown system, determining
 * the output path, and writing the processed content and any exported files.
 *
 * @function processFile
 * @param {string} filePath - Path to the input file to process
 * @param {string} inputDir - Base input directory path
 * @param {string} outputDir - Base output directory path
 * @param {boolean} preserveStructure - Whether to preserve directory structure in output
 * @param {LegalMarkdownOptions} processingOptions - Options for Legal Markdown processing
 * @param {BatchProcessingResult} result - Result object to update with processing outcome
 * @param {Function} [onProgress] - Optional callback for progress updates
 * @param {Function} [onError] - Optional callback for error handling
 * @returns {Promise<void>} Promise that resolves when processing is complete
 * @private
 */
async function processFile(
  filePath: string,
  inputDir: string,
  outputDir: string,
  preserveStructure: boolean,
  processingOptions: LegalMarkdownOptions,
  result: BatchProcessingResult,
  onProgress?: (processed: number, total: number, currentFile: string) => void,
  onError?: (file: string, error: Error) => void
): Promise<void> {
  try {
    // Read file content
    const content = await readFile(filePath, 'utf8');

    // Process the content
    const processedResult = processLegalMarkdown(content, {
      ...processingOptions,
      basePath: path.dirname(filePath),
    });

    // Determine output file path
    const relativePath = path.relative(inputDir, filePath);
    const outputFilePath = preserveStructure
      ? path.join(outputDir, relativePath)
      : path.join(outputDir, path.basename(filePath));

    // Create output directory if needed
    const outputFileDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputFileDir)) {
      fs.mkdirSync(outputFileDir, { recursive: true });
    }

    // Write processed content
    await writeFile(outputFilePath, processedResult.content);

    // Export metadata if generated
    if (processedResult.exportedFiles && processedResult.exportedFiles.length > 0) {
      // Handle exported metadata files
      for (const exportedFile of processedResult.exportedFiles) {
        const exportedOutputPath = preserveStructure
          ? path.join(outputDir, path.relative(inputDir, exportedFile))
          : path.join(outputDir, path.basename(exportedFile));

        // Copy exported file to output directory
        if (fs.existsSync(exportedFile)) {
          const exportedContent = await readFile(exportedFile, 'utf8');
          await writeFile(exportedOutputPath, exportedContent);
        }
      }
    }

    result.totalProcessed++;
    result.successfulFiles.push(filePath);

    if (onProgress) {
      onProgress(result.totalProcessed + result.totalErrors, -1, filePath);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.totalErrors++;
    result.failedFiles.push({
      file: filePath,
      error: errorMessage,
    });

    if (onError) {
      onError(filePath, error instanceof Error ? error : new Error(String(error)));
    }

    if (onProgress) {
      onProgress(result.totalProcessed + result.totalErrors, -1, filePath);
    }
  }
}

/**
 * Simple semaphore for controlling concurrency
 *
 * Provides a mechanism to limit the number of concurrent operations by using
 * a permit-based system. Useful for controlling resource usage during batch processing.
 *
 * @class Semaphore
 * @private
 * @example
 * ```typescript
 * const semaphore = new Semaphore(3); // Allow max 3 concurrent operations
 *
 * async function performOperation() {
 *   await semaphore.acquire();
 *   try {
 *     // Perform the operation
 *     await someAsyncOperation();
 *   } finally {
 *     semaphore.release();
 *   }
 * }
 * ```
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  /**
   * Creates a new Semaphore instance
   *
   * @param {number} permits - Maximum number of concurrent operations allowed
   */
  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquires a permit, waiting if necessary
   *
   * acquire
   * @returns {Promise<void>} Promise that resolves when a permit is acquired
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Releases a permit, allowing waiting operations to proceed
   *
   * release
   * @returns {void}
   */
  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}

/**
 * Utility function to get processing statistics from batch processing results
 *
 * Calculates useful statistics about the batch processing operation including
 * success rate, average processing time per file, and throughput metrics.
 *
 * @function getProcessingStats
 * @param {BatchProcessingResult} result - The batch processing result to analyze
 * @returns {Object} Object containing processing statistics
 * @returns {number} returns.successRate - Success rate as a percentage (0-100)
 * @returns {number} returns.averageTimePerFile - Average processing time per file in milliseconds
 * @returns {number} returns.filesPerSecond - Processing throughput in files per second
 * @example
 * ```typescript
 * import { processBatch, getProcessingStats } from './batch-processor';
 *
 * const result = await processBatch({
 *   inputDir: './documents',
 *   outputDir: './output'
 * });
 *
 * const stats = getProcessingStats(result);
 * console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
 * console.log(`Average time per file: ${stats.averageTimePerFile.toFixed(2)}ms`);
 * console.log(`Throughput: ${stats.filesPerSecond.toFixed(2)} files/second`);
 * ```
 */
export function getProcessingStats(result: BatchProcessingResult): {
  successRate: number;
  averageTimePerFile: number;
  filesPerSecond: number;
} {
  const totalFiles = result.totalProcessed + result.totalErrors;
  const successRate = totalFiles > 0 ? (result.totalProcessed / totalFiles) * 100 : 0;
  const averageTimePerFile = totalFiles > 0 ? result.processingTime / totalFiles : 0;
  const filesPerSecond =
    result.processingTime > 0 ? (totalFiles / result.processingTime) * 1000 : 0;

  return {
    successRate,
    averageTimePerFile,
    filesPerSecond,
  };
}
