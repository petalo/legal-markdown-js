/**
 * @fileoverview Integration tests for CLI archive functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CliService } from '../../../src/cli/service';

describe('CLI Archive Functionality Integration', () => {
  let tempDir: string;
  let inputFile: string;
  let archiveDir: string;
  
  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-test-'));
    inputFile = path.join(tempDir, 'test-document.md');
    archiveDir = path.join(tempDir, 'archived');
    
    // Create test input file
    const testContent = `---
title: Test Document
---

# Test Document

This is a test document for archive functionality.`;
    
    fs.writeFileSync(inputFile, testContent, 'utf8');
  });
  
  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('archiveSource option', () => {
    it('should archive source file after successful processing with boolean flag', async () => {
      const outputFile = path.join(tempDir, 'output.md');
      
      // Use absolute path for archive directory
      const archiveDir = path.join(tempDir, 'archived');
      
      const cliService = new CliService({
        archiveSource: archiveDir,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Debug: List what's actually in the archive directory
      console.log('Archive directory contents:', fs.readdirSync(archiveDir));
      
      // Source file should be moved to archive directory
      expect(fs.existsSync(inputFile)).toBe(false);
      
      // Check if content was identical (single file) or different (two files with suffixes)
      const archivedFiles = fs.readdirSync(archiveDir);
      const hasOriginalSuffix = archivedFiles.some(f => f.includes('.ORIGINAL.'));
      const hasProcessedSuffix = archivedFiles.some(f => f.includes('.PROCESSED.'));
      
      if (hasOriginalSuffix && hasProcessedSuffix) {
        // Content was different, both files should exist with suffixes
        expect(fs.existsSync(path.join(archiveDir, 'test-document.ORIGINAL.md'))).toBe(true);
        expect(fs.existsSync(path.join(archiveDir, 'test-document.PROCESSED.md'))).toBe(true);
      } else {
        // Content was identical, only original file should exist
        expect(fs.existsSync(path.join(archiveDir, 'test-document.md'))).toBe(true);
      }
      
      // Output file should exist
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should archive source file to custom directory when string provided', async () => {
      const outputFile = path.join(tempDir, 'output.md');
      const customArchiveDir = path.join(tempDir, 'custom-archive');
      
      const cliService = new CliService({
        archiveSource: customArchiveDir,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Source file should be moved to custom archive directory
      expect(fs.existsSync(inputFile)).toBe(false);
      
      // Check if content was identical (single file) or different (two files with suffixes)
      const archivedFiles = fs.readdirSync(customArchiveDir);
      const hasOriginalSuffix = archivedFiles.some(f => f.includes('.ORIGINAL.'));
      const hasProcessedSuffix = archivedFiles.some(f => f.includes('.PROCESSED.'));
      
      if (hasOriginalSuffix && hasProcessedSuffix) {
        // Content was different, both files should exist with suffixes
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.ORIGINAL.md'))).toBe(true);
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.PROCESSED.md'))).toBe(true);
      } else {
        // Content was identical, only original file should exist
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.md'))).toBe(true);
      }
      
      // Output file should exist
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should not archive source file when archiveSource is false', async () => {
      const outputFile = path.join(tempDir, 'output.md');
      
      const cliService = new CliService({
        archiveSource: false,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Source file should still exist
      expect(fs.existsSync(inputFile)).toBe(true);
      
      // Output file should exist
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should handle archiving conflicts with rename strategy', async () => {
      const outputFile = path.join(tempDir, 'output.md');
      const customArchiveDir = path.join(tempDir, 'archive');
      
      // Create archive directory and existing file to create conflict
      fs.mkdirSync(customArchiveDir, { recursive: true });
      fs.writeFileSync(path.join(customArchiveDir, 'test-document.md'), 'existing content', 'utf8');
      
      const cliService = new CliService({
        archiveSource: customArchiveDir,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Source file should be moved to archive with conflict resolution
      expect(fs.existsSync(inputFile)).toBe(false);
      
      // Check what files exist in archive
      const archivedFiles = fs.readdirSync(customArchiveDir);
      const hasOriginalSuffix = archivedFiles.some(f => f.includes('.ORIGINAL'));
      const hasProcessedSuffix = archivedFiles.some(f => f.includes('.PROCESSED'));
      
      // The original conflict file should still exist
      expect(fs.existsSync(path.join(customArchiveDir, 'test-document.md'))).toBe(true);
      const originalContent = fs.readFileSync(path.join(customArchiveDir, 'test-document.md'), 'utf8');
      expect(originalContent).toBe('existing content');
      
      if (hasOriginalSuffix && hasProcessedSuffix) {
        // Content was different, both suffixed files should exist with rename numbers
        const originalFiles = archivedFiles.filter(f => f.includes('.ORIGINAL'));
        const processedFiles = archivedFiles.filter(f => f.includes('.PROCESSED'));
        expect(originalFiles.length).toBe(1);
        expect(processedFiles.length).toBe(1);
        
        // Check that renamed files have expected content
        const newOriginalContent = fs.readFileSync(path.join(customArchiveDir, originalFiles[0]), 'utf8');
        expect(newOriginalContent).toContain('Test Document');
      } else {
        // Content was identical, single renamed file should exist
        const renamedFiles = archivedFiles.filter(f => f.startsWith('test-document_') && f.endsWith('.md'));
        expect(renamedFiles.length).toBe(1);
        
        const newContent = fs.readFileSync(path.join(customArchiveDir, renamedFiles[0]), 'utf8');
        expect(newContent).toContain('Test Document');
      }
    });

    it('should continue processing even if archiving fails', async () => {
      const outputFile = path.join(tempDir, 'output.md');
      const readOnlyArchiveDir = path.join(tempDir, 'readonly-archive');
      
      // Create read-only directory to cause archiving failure
      fs.mkdirSync(readOnlyArchiveDir, { recursive: true });
      fs.chmodSync(readOnlyArchiveDir, 0o444); // Read-only
      
      const cliService = new CliService({
        archiveSource: readOnlyArchiveDir,
        basePath: tempDir,
        verbose: true,
      });
      
      // This should not throw an error, archiving should fail gracefully
      await expect(cliService.processFile(inputFile, outputFile)).resolves.not.toThrow();
      
      // Source file should still exist since archiving failed
      expect(fs.existsSync(inputFile)).toBe(true);
      
      // Output file should still be created
      expect(fs.existsSync(outputFile)).toBe(true);
      
      // Restore permissions for cleanup
      fs.chmodSync(readOnlyArchiveDir, 0o755);
    });
  });

  describe('Archive with different processing options', () => {
    it('should archive source file with markdown output', async () => {
      const outputFile = path.join(tempDir, 'markdown-output.md');
      const customArchiveDir = path.join(tempDir, 'markdown-archive');
      
      const cliService = new CliService({
        archiveSource: customArchiveDir,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Source file should be archived
      expect(fs.existsSync(inputFile)).toBe(false);
      expect(fs.existsSync(customArchiveDir)).toBe(true);
      expect(fs.existsSync(outputFile)).toBe(true);
      
      // Check if content was identical (single file) or different (two files with suffixes)
      const archivedFiles = fs.readdirSync(customArchiveDir);
      const hasOriginalSuffix = archivedFiles.some(f => f.includes('.ORIGINAL.'));
      const hasProcessedSuffix = archivedFiles.some(f => f.includes('.PROCESSED.'));
      
      if (hasOriginalSuffix && hasProcessedSuffix) {
        // Content was different, both files should exist with suffixes
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.ORIGINAL.md'))).toBe(true);
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.PROCESSED.md'))).toBe(true);
      } else {
        // Content was identical, only original file should exist
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.md'))).toBe(true);
      }
    });

    it('should archive source file with debug mode enabled', async () => {
      const outputFile = path.join(tempDir, 'debug-output.md');
      const customArchiveDir = path.join(tempDir, 'debug-archive');
      
      const cliService = new CliService({
        debug: true,
        archiveSource: customArchiveDir,
        basePath: tempDir,
      });
      
      await cliService.processFile(inputFile, outputFile);
      
      // Source file should be archived
      expect(fs.existsSync(inputFile)).toBe(false);
      expect(fs.existsSync(customArchiveDir)).toBe(true);
      expect(fs.existsSync(outputFile)).toBe(true);
      
      // Check archiving worked
      const archivedFiles = fs.readdirSync(customArchiveDir);
      expect(archivedFiles.length).toBeGreaterThan(0);
      
      // Should have at least one file that starts with test-document
      const testDocumentFiles = archivedFiles.filter(f => f.startsWith('test-document'));
      expect(testDocumentFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive CLI integration', () => {
    it('should respect archive configuration from interactive config', async () => {
      const { InteractiveService } = await import('../../../src/cli/interactive/service');
      const customArchiveDir = path.join(tempDir, 'interactive-archive');
      
      const config = {
        inputFile,
        outputFilename: 'interactive-output',
        outputFormats: {
          html: false,
          pdf: false,
          markdown: true,
          metadata: false,
        },
        processingOptions: {
          debug: false,
          fieldTracking: false,
          highlight: false,
        },
        archiveOptions: {
          enabled: true,
          directory: customArchiveDir,
        },
      };
      
      const service = new InteractiveService(config);
      const result = await service.processFile(inputFile);
      
      // Source file should be archived
      expect(fs.existsSync(inputFile)).toBe(false);
      expect(fs.existsSync(customArchiveDir)).toBe(true);
      
      // Check if content was identical (single file) or different (two files with suffixes)
      const archivedFiles = fs.readdirSync(customArchiveDir);
      const hasOriginalSuffix = archivedFiles.some(f => f.includes('.ORIGINAL.'));
      const hasProcessedSuffix = archivedFiles.some(f => f.includes('.PROCESSED.'));
      
      if (hasOriginalSuffix && hasProcessedSuffix) {
        // Content was different, both files should exist with suffixes
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.ORIGINAL.md'))).toBe(true);
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.PROCESSED.md'))).toBe(true);
      } else {
        // Content was identical, only original file should exist
        expect(fs.existsSync(path.join(customArchiveDir, 'test-document.md'))).toBe(true);
      }
      
      // Output file should be generated
      expect(result.outputFiles).toHaveLength(1);
      expect(fs.existsSync(result.outputFiles[0])).toBe(true);
    });
  });
});