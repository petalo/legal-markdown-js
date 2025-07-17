/**
 * @fileoverview Tests for batch processor functionality
 * 
 * Tests the batch processor which handles:
 * - Bulk processing of legal markdown files across directories
 * - Recursive directory traversal with configurable depth
 * - File filtering by extension and exclusion patterns
 * - Concurrent processing with configurable concurrency limits
 * - Progress tracking and error handling with callbacks
 * - Output structure preservation or flattening
 * - Processing statistics and performance metrics
 */

import { processBatch, getProcessingStats } from '../../../src/extensions/batch-processor';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

/**
 * Helper functions for async file operations
 */
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rmdir = promisify(fs.rmdir);

describe('Batch Processor', () => {
  const testDir = path.join(__dirname, 'batch-test-temp');
  const inputDir = path.join(testDir, 'input');
  const outputDir = path.join(testDir, 'output');

  beforeEach(async () => {
    // Create test directories
    await mkdir(testDir, { recursive: true });
    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      await rmdir(testDir, { recursive: true });
    }
  });

  describe('processBatch', () => {
    it('should process multiple markdown files', async () => {
      // Create test files
      await writeFile(path.join(inputDir, 'test1.md'), `---
title: Test 1
---

l. First header
ll. Second header`);

      await writeFile(path.join(inputDir, 'test2.md'), `---
title: Test 2
---

l. Another header
ll. Another second header`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        recursive: false,
        preserveStructure: true,
        concurrency: 2,
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.totalErrors).toBe(0);
      expect(result.successfulFiles).toHaveLength(2);
      expect(result.failedFiles).toHaveLength(0);

      // Check if output files were created
      expect(fs.existsSync(path.join(outputDir, 'test1.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'test2.md'))).toBe(true);

      // Check processed content
      const output1 = await readFile(path.join(outputDir, 'test1.md'), 'utf8');
      const output2 = await readFile(path.join(outputDir, 'test2.md'), 'utf8');

      expect(output1).toContain('Article 1. First header');
      expect(output1).toContain('Section 1. Second header');
      expect(output2).toContain('Article 1. Another header');
      expect(output2).toContain('Section 1. Another second header');
    });

    it('should handle recursive directory processing', async () => {
      // Create subdirectory with files
      const subDir = path.join(inputDir, 'subdir');
      await mkdir(subDir, { recursive: true });

      await writeFile(path.join(inputDir, 'root.md'), `l. Root file`);
      await writeFile(path.join(subDir, 'sub.md'), `l. Sub file`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        recursive: true,
        preserveStructure: true,
        concurrency: 2,
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.totalErrors).toBe(0);

      // Check if output files were created with preserved structure
      expect(fs.existsSync(path.join(outputDir, 'root.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'subdir', 'sub.md'))).toBe(true);
    });

    it('should handle different file extensions', async () => {
      await writeFile(path.join(inputDir, 'test.md'), `l. Markdown file`);
      await writeFile(path.join(inputDir, 'test.txt'), `l. Text file`);
      await writeFile(path.join(inputDir, 'test.doc'), `l. Doc file`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md', '.txt'],
        recursive: false,
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.totalErrors).toBe(0);

      // Only .md and .txt files should be processed
      expect(fs.existsSync(path.join(outputDir, 'test.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'test.txt'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'test.doc'))).toBe(false);
    });

    it('should exclude specified files and directories', async () => {
      await writeFile(path.join(inputDir, 'include.md'), `l. Include this`);
      await writeFile(path.join(inputDir, 'exclude.md'), `l. Exclude this`);
      await writeFile(path.join(inputDir, 'temp.md'), `l. Temp file`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        exclude: ['exclude', 'temp'],
        recursive: false,
      });

      expect(result.totalProcessed).toBe(1);
      expect(result.totalErrors).toBe(0);

      expect(fs.existsSync(path.join(outputDir, 'include.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'exclude.md'))).toBe(false);
      expect(fs.existsSync(path.join(outputDir, 'temp.md'))).toBe(false);
    });

    it('should handle processing options', async () => {
      await writeFile(path.join(inputDir, 'test.md'), `l. First level
ll. Second level
l. Another first level
ll. Another second level`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        noReset: true,
        noIndent: true,
        recursive: false,
      });

      expect(result.totalProcessed).toBe(1);
      expect(result.totalErrors).toBe(0);

      const output = await readFile(path.join(outputDir, 'test.md'), 'utf8');
      const lines = output.split('\n');

      // Check continuous numbering (noReset flag prevents resetting counters)
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('Section 1. Second level');
      expect(lines[2]).toBe('Article 2. Another first level');
      expect(lines[3]).toBe('Section 2. Another second level');

      // Check no indentation (noIndent flag removes hierarchical indentation)
      expect(lines[1]).not.toMatch(/^\s+Section/);
    });

    it('should handle errors gracefully', async () => {
      await writeFile(path.join(inputDir, 'valid.md'), `l. Valid file`);
      await writeFile(path.join(inputDir, 'invalid.md'), `---
invalid: [unclosed array
---

l. Invalid YAML`);

      const errors: Array<{ file: string; error: Error }> = [];
      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        throwOnYamlError: true,
        recursive: false,
        onError: (file, error) => {
          // Collect errors for validation without stopping the batch
          errors.push({ file, error });
        },
      });

      expect(result.totalProcessed).toBe(1);
      expect(result.totalErrors).toBe(1);
      expect(result.failedFiles).toHaveLength(1);
      expect(errors).toHaveLength(1);

      expect(fs.existsSync(path.join(outputDir, 'valid.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'invalid.md'))).toBe(false);
    });

    it('should call progress callback', async () => {
      await writeFile(path.join(inputDir, 'test1.md'), `l. Test 1`);
      await writeFile(path.join(inputDir, 'test2.md'), `l. Test 2`);

      const progressUpdates: Array<{ processed: number; total: number; file: string }> = [];
      
      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        recursive: false,
        onProgress: (processed, total, currentFile) => {
          progressUpdates.push({ processed, total, file: currentFile });
        },
      });

      expect(result.totalProcessed).toBe(2);
      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0].processed).toBe(1);
      expect(progressUpdates[1].processed).toBe(2);
    });

    it('should handle flat structure output', async () => {
      const subDir = path.join(inputDir, 'subdir');
      await mkdir(subDir, { recursive: true });

      await writeFile(path.join(inputDir, 'root.md'), `l. Root file`);
      await writeFile(path.join(subDir, 'sub.md'), `l. Sub file`);

      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        recursive: true,
        preserveStructure: false,
        concurrency: 2,
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.totalErrors).toBe(0);

      // Check if output files were created in flat structure
      expect(fs.existsSync(path.join(outputDir, 'root.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'sub.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'subdir', 'sub.md'))).toBe(false);
    });

    it('should handle empty input directory', async () => {
      const result = await processBatch({
        inputDir,
        outputDir,
        extensions: ['.md'],
        recursive: false,
      });

      expect(result.totalProcessed).toBe(0);
      expect(result.totalErrors).toBe(0);
      expect(result.successfulFiles).toHaveLength(0);
      expect(result.failedFiles).toHaveLength(0);
    });

    it('should throw error for non-existent input directory', async () => {
      await expect(processBatch({
        inputDir: '/non/existent/directory',
        outputDir,
        extensions: ['.md'],
        recursive: false,
      })).rejects.toThrow('Input directory does not exist');
    });
  });

  describe('getProcessingStats', () => {
    it('should calculate processing statistics', () => {
      const result = {
        totalProcessed: 8,
        totalErrors: 2,
        successfulFiles: [],
        failedFiles: [],
        processingTime: 1000,
      };

      const stats = getProcessingStats(result);

      expect(stats.successRate).toBe(80); // 8/10 * 100
      expect(stats.averageTimePerFile).toBe(100); // 1000/10
      expect(stats.filesPerSecond).toBe(10); // 10/1000 * 1000
    });

    it('should handle zero files', () => {
      const result = {
        totalProcessed: 0,
        totalErrors: 0,
        successfulFiles: [],
        failedFiles: [],
        processingTime: 1000,
      };

      const stats = getProcessingStats(result);

      expect(stats.successRate).toBe(0);
      expect(stats.averageTimePerFile).toBe(0);
      expect(stats.filesPerSecond).toBe(0);
    });

    it('should handle zero processing time', () => {
      const result = {
        totalProcessed: 5,
        totalErrors: 0,
        successfulFiles: [],
        failedFiles: [],
        processingTime: 0,
      };

      const stats = getProcessingStats(result);

      expect(stats.successRate).toBe(100);
      expect(stats.averageTimePerFile).toBe(0);
      expect(stats.filesPerSecond).toBe(0);
    });
  });
});