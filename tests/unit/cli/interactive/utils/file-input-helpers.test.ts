/**
 * @fileoverview Tests for file-input-helpers CLI utilities
 *
 * Tests for interactive CLI file input helper functions including
 * folder browsing and manual file path entry.
 *
 * Note: These tests mock the inquirer prompts as they require user interaction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}));

// Mock fs
vi.mock('fs');

// Mock file-scanner
vi.mock('../../../../../src/cli/interactive/utils/file-scanner', () => ({
  scanDirectory: vi.fn(),
  isValidFile: vi.fn(),
}));

// Mock format-helpers
vi.mock('../../../../../src/cli/interactive/utils/format-helpers', () => ({
  formatWarningMessage: vi.fn((msg: string) => msg),
}));

import { handleBrowseFolder, handleManualInput } from '../../../../../src/cli/interactive/utils/file-input-helpers';
import { select, input } from '@inquirer/prompts';
import { scanDirectory, isValidFile } from '../../../../../src/cli/interactive/utils/file-scanner';

describe('File Input Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // HANDLE MANUAL INPUT
  // ==========================================================================

  describe('handleManualInput', () => {
    it('should accept valid markdown file path', async () => {
      const testPath = '/test/file.md';
      const resolvedPath = path.resolve(testPath);

      vi.mocked(input).mockResolvedValue(testPath);
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleManualInput();

      expect(result).toBe(resolvedPath);
      expect(input).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Enter file path:',
        })
      );
    });

    it('should accept valid rst file path', async () => {
      const testPath = '/test/file.rst';
      const resolvedPath = path.resolve(testPath);

      vi.mocked(input).mockResolvedValue(testPath);
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleManualInput();

      expect(result).toBe(resolvedPath);
    });

    it('should accept valid tex file path', async () => {
      const testPath = '/test/file.tex';
      const resolvedPath = path.resolve(testPath);

      vi.mocked(input).mockResolvedValue(testPath);
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleManualInput();

      expect(result).toBe(resolvedPath);
    });

    it('should resolve relative paths to absolute', async () => {
      const relativePath = './test.md';
      const absolutePath = path.resolve(relativePath);

      vi.mocked(input).mockResolvedValue(relativePath);
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleManualInput();

      expect(result).toBe(absolutePath);
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should trim whitespace from input', async () => {
      const testPath = '  /test/file.md  ';
      const trimmedPath = testPath.trim();
      const resolvedPath = path.resolve(trimmedPath);

      vi.mocked(input).mockResolvedValue(testPath);
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleManualInput();

      expect(result).toBe(resolvedPath);
    });

    it('should validate with inquirer validation function', async () => {
      let validationFn: any;

      vi.mocked(input).mockImplementation(async (config: any) => {
        validationFn = config.validate;
        return '/test/file.md';
      });
      vi.mocked(isValidFile).mockReturnValue(true);

      await handleManualInput();

      expect(validationFn).toBeDefined();

      // Test validation function
      vi.mocked(isValidFile).mockReturnValue(true);
      expect(validationFn('/test/file.md')).toBe(true);

      vi.mocked(isValidFile).mockReturnValue(false);
      expect(validationFn('/invalid/file.md')).toContain('does not exist');
    });

    it('should reject empty paths', async () => {
      let validationFn: any;

      vi.mocked(input).mockImplementation(async (config: any) => {
        validationFn = config.validate;
        return '/test/file.md';
      });
      vi.mocked(isValidFile).mockReturnValue(true);

      await handleManualInput();

      expect(validationFn('')).toBe('File path is required');
      expect(validationFn('  ')).toBe('File path is required');
    });

    it('should reject unsupported file extensions', async () => {
      let validationFn: any;

      vi.mocked(input).mockImplementation(async (config: any) => {
        validationFn = config.validate;
        return '/test/file.md';
      });
      vi.mocked(isValidFile).mockReturnValue(true);

      await handleManualInput();

      vi.mocked(isValidFile).mockReturnValue(true);
      const result = validationFn('/test/file.pdf');
      expect(result).toContain('Unsupported file type');
      expect(result).toContain('.md');
      expect(result).toContain('.rst');
    });

    it('should accept all supported extensions', async () => {
      let validationFn: any;

      vi.mocked(input).mockImplementation(async (config: any) => {
        validationFn = config.validate;
        return '/test/file.md';
      });
      vi.mocked(isValidFile).mockReturnValue(true);

      await handleManualInput();

      vi.mocked(isValidFile).mockReturnValue(true);

      expect(validationFn('/test/file.md')).toBe(true);
      expect(validationFn('/test/file.markdown')).toBe(true);
      expect(validationFn('/test/file.rst')).toBe(true);
      expect(validationFn('/test/file.tex')).toBe(true);
      expect(validationFn('/test/file.latex')).toBe(true);
      expect(validationFn('/test/file.txt')).toBe(true);
    });
  });

  // ==========================================================================
  // HANDLE BROWSE FOLDER
  // ==========================================================================

  describe('handleBrowseFolder', () => {
    beforeEach(() => {
      // Mock fs for folder validation
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    });

    it('should browse folder and return selected file', async () => {
      const testFolder = '/test/folder';
      const testFile = '/test/folder/file.md';

      // Mock folder input
      vi.mocked(input).mockResolvedValue(testFolder);

      // Mock file scanning
      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: testFile },
      ] as any);

      // Mock file selection
      vi.mocked(select).mockResolvedValue(testFile);

      const result = await handleBrowseFolder();

      expect(result).toBe(testFile);
      expect(scanDirectory).toHaveBeenCalledWith(
        path.resolve(testFolder),
        path.resolve(testFolder)
      );
    });

    it('should show manual option when browsing', async () => {
      const testFolder = '/test/folder';

      vi.mocked(input).mockResolvedValue(testFolder);
      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: '/test/file.md' },
      ] as any);
      vi.mocked(select).mockResolvedValue('/test/file.md');

      await handleBrowseFolder();

      expect(select).toHaveBeenCalledWith(
        expect.objectContaining({
          choices: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining('Enter path manually'),
            }),
          ]),
        })
      );
    });

    it('should show exit option when browsing', async () => {
      const testFolder = '/test/folder';

      vi.mocked(input).mockResolvedValue(testFolder);
      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: '/test/file.md' },
      ] as any);
      vi.mocked(select).mockResolvedValue('/test/file.md');

      await handleBrowseFolder();

      expect(select).toHaveBeenCalledWith(
        expect.objectContaining({
          choices: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining('Exit'),
            }),
          ]),
        })
      );
    });

    it('should call handleManualInput when manual option selected', async () => {
      const testFolder = '/test/folder';
      const manualPath = '/manual/file.md';

      vi.mocked(input)
        .mockResolvedValueOnce(testFolder) // Folder browse
        .mockResolvedValueOnce(manualPath); // Manual input

      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: '/test/file.md' },
      ] as any);

      // Select manual option
      vi.mocked(select).mockResolvedValue('📝 Enter path manually...');
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleBrowseFolder();

      expect(result).toBe(path.resolve(manualPath));
    });

    it('should exit when exit option selected', async () => {
      const testFolder = '/test/folder';
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      vi.mocked(input).mockResolvedValue(testFolder);
      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: '/test/file.md' },
      ] as any);

      vi.mocked(select).mockResolvedValue('❌ Exit');

      await handleBrowseFolder();

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('should fallback to manual input when no files found', async () => {
      const testFolder = '/test/empty';
      const manualPath = '/manual/file.md';

      vi.mocked(input)
        .mockResolvedValueOnce(testFolder) // Folder browse
        .mockResolvedValueOnce(manualPath); // Manual input

      vi.mocked(scanDirectory).mockReturnValue([]); // No files
      vi.mocked(isValidFile).mockReturnValue(true);

      const result = await handleBrowseFolder();

      expect(result).toBe(path.resolve(manualPath));
    });

    it.skip('should validate folder path exists', async () => {
      let validationFn: any;

      vi.mocked(input).mockImplementation(async (config: any) => {
        validationFn = config.validate;
        return '/test/folder';
      });
      vi.mocked(scanDirectory).mockReturnValue([]);
      vi.mocked(isValidFile).mockReturnValue(true);

      await handleBrowseFolder();

      expect(validationFn).toBeDefined();

      // Test validation function
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(validationFn('/nonexistent')).toBe('Folder does not exist');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      expect(validationFn('/test/file.md')).toBe('Path is not a directory');

      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      expect(validationFn('/test/folder')).toBe(true);
    });

    it('should use process.cwd as default folder', async () => {
      vi.mocked(input).mockImplementation(async (config: any) => {
        expect(config.default).toBe(process.cwd());
        return '/test/folder';
      });
      vi.mocked(scanDirectory).mockReturnValue([
        { name: 'file.md', path: '/test/file.md' },
      ] as any);
      vi.mocked(select).mockResolvedValue('/test/file.md');

      await handleBrowseFolder();
    });
  });
});
