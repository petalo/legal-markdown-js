/**
 * @fileoverview Unit tests for file scanner utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { scanDirectory, scanCssFiles, isValidFile } from '../../../../../src/cli/interactive/utils/file-scanner';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('File Scanner Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanDirectory', () => {
    it('should return empty array for non-existent directory', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = scanDirectory('/non/existent/path');

      expect(result).toEqual([]);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/non/existent/path');
    });

    it('should scan directory and return supported files', () => {
      const mockDirEntries = [
        { name: 'document.md', isDirectory: () => false, isFile: () => true },
        { name: 'contract.rst', isDirectory: () => false, isFile: () => true },
        { name: 'legal.tex', isDirectory: () => false, isFile: () => true },
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true },
        { name: 'image.png', isDirectory: () => false, isFile: () => true }, // Should be ignored
        { name: 'subdirectory', isDirectory: () => true, isFile: () => false },
      ];

      const subDirEntries = [
        { name: 'nested.latex', isDirectory: () => false, isFile: () => true },
        { name: 'another.markdown', isDirectory: () => false, isFile: () => true },
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync
        .mockReturnValueOnce(mockDirEntries as any)
        .mockReturnValueOnce(subDirEntries as any);

      // Mock process.cwd() for relative path calculation
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => '/base/path');

      const result = scanDirectory('/test/path');

      expect(result).toHaveLength(6); // 4 files + 2 nested files
      
      // Check that all expected files are present
      const fileNames = result.map(item => item.name);
      expect(fileNames).toEqual(expect.arrayContaining([
        expect.stringContaining('another.markdown'),
        expect.stringContaining('contract.rst'),
        expect.stringContaining('document.md'),
        expect.stringContaining('legal.tex'),
        expect.stringContaining('nested.latex'),
        expect.stringContaining('readme.txt'),
      ]));

      // Check that all items have the correct structure
      result.forEach(item => {
        expect(item).toMatchObject({
          name: expect.any(String),
          path: expect.any(String),
          type: 'file',
        });
      });

      // Restore process.cwd
      process.cwd = originalCwd;
    });

    it('should handle directory read errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = scanDirectory('/test/path');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Warning: Could not scan directory /test/path');

      consoleSpy.mockRestore();
    });
  });

  describe('scanCssFiles', () => {
    it('should return empty array for non-existent directory', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = scanCssFiles('/non/existent/styles');

      expect(result).toEqual([]);
    });

    it('should return CSS files excluding highlight.css', () => {
      const mockFiles = [
        'default.css',
        'contract.petalo.css',
        'headers.css',
        'highlight.css', // Should be excluded
        'modern.css',
        'readme.md', // Should be ignored
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = scanCssFiles('/test/styles');

      expect(result).toEqual([
        'contract.petalo.css',
        'default.css',
        'headers.css',
        'modern.css',
      ]);
      expect(result).not.toContain('highlight.css');
    });

    it('should handle directory read errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = scanCssFiles('/test/styles');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Warning: Could not scan CSS directory /test/styles');

      consoleSpy.mockRestore();
    });
  });

  describe('isValidFile', () => {
    it('should return true for existing file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = isValidFile('/test/file.md');

      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.md');
      expect(mockFs.statSync).toHaveBeenCalledWith('/test/file.md');
    });

    it('should return false for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = isValidFile('/test/nonexistent.md');

      expect(result).toBe(false);
    });

    it('should return false for directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: () => false } as any);

      const result = isValidFile('/test/directory');

      expect(result).toBe(false);
    });

    it('should return false on error', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = isValidFile('/test/file.md');

      expect(result).toBe(false);
    });
  });
});