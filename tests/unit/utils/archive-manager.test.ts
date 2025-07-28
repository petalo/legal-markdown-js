/**
 * @fileoverview Unit tests for ArchiveManager utility
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock modules before importing the module under test
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

// Import after mocking
import { ArchiveManager } from '../../../src/utils/archive-manager';

describe('ArchiveManager', () => {
  let archiveManager: ArchiveManager;
  const mockSourcePath = '/source/document.md';
  const mockArchiveDir = '/archive';
  const mockTargetPath = '/archive/document.md';

  beforeEach(() => {
    jest.clearAllMocks();
    archiveManager = new ArchiveManager();
  });

  describe('archiveFile', () => {
    const defaultOptions = {
      archiveDir: mockArchiveDir,
      createDirectory: true,
      conflictResolution: 'rename' as const,
    };

    it('should successfully archive a file when no conflicts exist', async () => {
      // Mock file system operations for successful archiving
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return false; // Target doesn't exist
        return false;
      });

      mockFs.statSync.mockImplementation((filePath) => {
        return { isFile: () => filePath === mockSourcePath } as any;
      });

      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(mockTargetPath);
      expect(result.error).toBeUndefined();
      expect(mockFs.renameSync).toHaveBeenCalledWith(mockSourcePath, mockTargetPath);
    });

    it('should create archive directory when it does not exist', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return false; // Archive dir doesn't exist
        if (filePath === mockTargetPath) return false; // Target doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.mkdirSync.mockImplementation(() => '' as any);
      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockArchiveDir, { recursive: true });
      expect(mockFs.renameSync).toHaveBeenCalledWith(mockSourcePath, mockTargetPath);
    });

    it('should fail when source file does not exist', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath !== mockSourcePath; // Source doesn't exist
      });

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source file does not exist');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it('should fail when source path is not a file', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: () => false } as any);

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source path is not a file');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it('should handle conflict with overwrite strategy', async () => {
      const options = { ...defaultOptions, conflictResolution: 'overwrite' as const };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return true; // Target exists (conflict)
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.archiveFile(mockSourcePath, options);

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(mockTargetPath);
      // With overwrite strategy, the file is simply overwritten by rename, no unlink needed
      expect(mockFs.renameSync).toHaveBeenCalledWith(path.resolve(mockSourcePath), mockTargetPath);
    });

    it('should handle conflict with rename strategy', async () => {
      const renamedPath = '/archive/document_1.md'; // Uses underscore, not parentheses
      const options = { ...defaultOptions, conflictResolution: 'rename' as const };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return true; // Original target exists (conflict)
        if (filePath === renamedPath) return false; // Renamed target doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.archiveFile(mockSourcePath, options);

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(renamedPath);
      expect(mockFs.renameSync).toHaveBeenCalledWith(path.resolve(mockSourcePath), renamedPath);
    });

    it('should handle conflict with skip strategy', async () => {
      const options = { ...defaultOptions, conflictResolution: 'skip' as const };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return true; // Target exists (conflict)
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = await archiveManager.archiveFile(mockSourcePath, options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File already exists and conflict resolution is set to skip');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it('should handle directory creation failure gracefully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return false; // Archive dir doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.mkdirSync.mockImplementation((() => {
        throw new Error('Permission denied');
      }) as any);

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create archive directory: /archive. Permission denied');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it('should handle file move operation failure', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return false; // Target doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disk full');
    });

    it('should not create directory when createDirectory is false', async () => {
      const options = { ...defaultOptions, createDirectory: false };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return false; // Archive dir doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = await archiveManager.archiveFile(mockSourcePath, options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ENOENT: no such file or directory');
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle multiple rename attempts when conflicts exist', async () => {
      const path1 = '/archive/document_1.md';
      const path2 = '/archive/document_2.md';
      const path3 = '/archive/document_3.md';

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return true; // Original exists
        if (filePath === path1) return false; // First rename available
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.archiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(path1); // Will use first available name
      expect(mockFs.renameSync).toHaveBeenCalledWith(path.resolve(mockSourcePath), path1);
    });
  });

  describe('smartArchiveFile', () => {
    const defaultOptions = {
      archiveDir: mockArchiveDir,
      createDirectory: true,
      conflictResolution: 'rename' as const,
      originalContent: 'Original content',
      processedContent: 'Processed content'
    };

    it('should archive only original file when contents are identical', async () => {
      const identicalOptions = {
        ...defaultOptions,
        originalContent: 'Same content',
        processedContent: 'Same content'
      };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return false; // Target doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.renameSync.mockImplementation(() => {});

      const result = await archiveManager.smartArchiveFile(mockSourcePath, identicalOptions);

      expect(result.success).toBe(true);
      expect(result.contentsIdentical).toBe(true);
      expect(result.archivedPath).toBe(mockTargetPath);
      expect(result.archivedOriginalPath).toBeUndefined();
      expect(result.archivedProcessedPath).toBeUndefined();
      expect(mockFs.renameSync).toHaveBeenCalledWith(path.resolve(mockSourcePath), mockTargetPath);
    });

    it('should archive both files with suffixes when contents are different', async () => {
      const originalPath = '/archive/document.ORIGINAL.md';
      const processedPath = '/archive/document.PROCESSED.md';

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === originalPath) return false; // Original target doesn't exist
        if (filePath === processedPath) return false; // Processed target doesn't exist
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.unlinkSync.mockImplementation(() => {});

      const result = await archiveManager.smartArchiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(true);
      expect(result.contentsIdentical).toBe(false);
      expect(result.archivedOriginalPath).toBe(originalPath);
      expect(result.archivedProcessedPath).toBe(processedPath);
      expect(result.archivedPath).toBe(processedPath); // Primary path for backward compatibility

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(originalPath, 'Original content', 'utf8');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(processedPath, 'Processed content', 'utf8');
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(path.resolve(mockSourcePath));
    });

    it('should handle conflicts in smart archiving', async () => {
      const originalPath = '/archive/document.ORIGINAL.md';
      const processedPath = '/archive/document.PROCESSED.md';
      const renamedOriginalPath = '/archive/document.ORIGINAL_1.md';
      const renamedProcessedPath = '/archive/document.PROCESSED_1.md';

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === originalPath) return true; // Original target exists (conflict)
        if (filePath === processedPath) return true; // Processed target exists (conflict)
        if (filePath === renamedOriginalPath) return false; // Renamed targets don't exist
        if (filePath === renamedProcessedPath) return false;
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.unlinkSync.mockImplementation(() => {});

      const result = await archiveManager.smartArchiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(true);
      expect(result.contentsIdentical).toBe(false);
      expect(result.archivedOriginalPath).toBe(renamedOriginalPath);
      expect(result.archivedProcessedPath).toBe(renamedProcessedPath);
    });

    it('should fail when skip strategy prevents archiving', async () => {
      const skipOptions = { ...defaultOptions, conflictResolution: 'skip' as const };

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return true; // Archive dir exists
        if (filePath === mockTargetPath) return true; // Target exists (conflict)
        return false;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = await archiveManager.smartArchiveFile(mockSourcePath, {
        ...skipOptions,
        originalContent: 'Same content',
        processedContent: 'Same content'
      });

      expect(result.success).toBe(false);
      expect(result.contentsIdentical).toBe(true);
      expect(result.error).toBe('File already exists and conflict resolution is set to skip');
    });

    it('should handle errors gracefully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockSourcePath) return true; // Source exists
        if (filePath === mockArchiveDir) return false; // Archive dir doesn't exist
        return false;
      });
      
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await archiveManager.smartArchiveFile(mockSourcePath, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.contentsIdentical).toBe(false);
      expect(result.error).toBe('Failed to create archive directory: /archive. Permission denied');
    });
  });

  describe('isValidArchiveDirectory', () => {
    it('should return true for existing directory paths', () => {
      const testPath = '/existing/directory';
      mockFs.existsSync.mockImplementation((filePath) => filePath === path.resolve(testPath));
      mockFs.statSync.mockImplementation((filePath) => {
        if (filePath === path.resolve(testPath)) {
          return { isDirectory: () => true } as any;
        }
        return { isDirectory: () => false } as any;
      });

      expect(ArchiveManager.isValidArchiveDirectory(testPath)).toBe(true);
    });

    it('should return true when parent directory exists for new directory', () => {
      const testPath = '/existing/parent/new';
      const parentPath = path.dirname(path.resolve(testPath));
      
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === path.resolve(testPath)) return false; // New directory doesn't exist
        if (filePath === parentPath) return true; // Parent exists
        return false;
      });
      
      mockFs.statSync.mockImplementation((filePath) => {
        if (filePath === parentPath) {
          return { isDirectory: () => true } as any;
        }
        return { isDirectory: () => false } as any;
      });

      expect(ArchiveManager.isValidArchiveDirectory(testPath)).toBe(true);
    });

    it('should return false when neither directory nor parent exists', () => {
      const testPath = '/nonexistent/directory';
      mockFs.existsSync.mockReturnValue(false);

      expect(ArchiveManager.isValidArchiveDirectory(testPath)).toBe(false);
    });

    it('should return false when existing path is not a directory', () => {
      const testPath = '/existing/file.txt';
      mockFs.existsSync.mockImplementation((filePath) => filePath === path.resolve(testPath));
      mockFs.statSync.mockImplementation(() => ({ isDirectory: () => false } as any));

      expect(ArchiveManager.isValidArchiveDirectory(testPath)).toBe(false);
    });

    it('should return false when file system errors occur', () => {
      const testPath = '/error/path';
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(ArchiveManager.isValidArchiveDirectory(testPath)).toBe(false);
    });
  });
});