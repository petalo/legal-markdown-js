const mockExistsSync = vi.fn();
const mockStatSync = vi.fn();
const mockMkdirSync = vi.fn();
const mockRenameSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockUnlinkSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  statSync: (...args: unknown[]) => mockStatSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  renameSync: (...args: unknown[]) => mockRenameSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
}));

const mockGenerateArchivePaths = vi.fn();
const mockAreContentsIdentical = vi.fn();

vi.mock('../../../src/utils/file-naming', () => ({
  generateArchivePaths: (...args: unknown[]) => mockGenerateArchivePaths(...args),
  areContentsIdentical: (...args: unknown[]) => mockAreContentsIdentical(...args),
}));

import { ArchiveManager } from '../../../src/utils/archive-manager';

describe('archive-manager.ts', () => {
  let manager: ArchiveManager;

  beforeEach(() => {
    vi.resetAllMocks();
    manager = new ArchiveManager();
    // Default: statSync returns isFile = true
    mockStatSync.mockReturnValue({ isFile: () => true, isDirectory: () => false });
  });

  // ── archiveFile ────────────────────────────────────────────────────

  describe('archiveFile', () => {
    it('returns error when source file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const result = await manager.archiveFile('/src/missing.md', { archiveDir: '/archive' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('returns error when source is a directory', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isFile: () => false, isDirectory: () => true });
      const result = await manager.archiveFile('/src/dir', { archiveDir: '/archive' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a file');
    });

    it('moves file successfully when no conflict', async () => {
      // First call: source exists. Second call: mkdirSync check. Third call: target does not exist
      mockExistsSync
        .mockReturnValueOnce(true) // source exists
        .mockReturnValueOnce(false) // archive dir doesn't exist (create it)
        .mockReturnValueOnce(false); // target doesn't exist (no conflict)

      const result = await manager.archiveFile('/src/file.md', { archiveDir: '/archive' });
      expect(result.success).toBe(true);
      expect(mockRenameSync).toHaveBeenCalled();
    });

    it('handles conflict with skip resolution', async () => {
      mockExistsSync.mockReturnValue(true); // all exist

      const result = await manager.archiveFile('/src/file.md', {
        archiveDir: '/archive',
        conflictResolution: 'skip',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('conflict resolution is set to skip');
    });

    it('handles conflict with overwrite resolution', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await manager.archiveFile('/src/file.md', {
        archiveDir: '/archive',
        conflictResolution: 'overwrite',
      });
      expect(result.success).toBe(true);
      expect(mockRenameSync).toHaveBeenCalled();
    });

    it('handles unexpected errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockRenameSync.mockImplementation(() => { throw new Error('permission denied'); });

      const result = await manager.archiveFile('/src/file.md', {
        archiveDir: '/archive',
        conflictResolution: 'overwrite',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('permission denied');
    });
  });

  // ── smartArchiveFile ───────────────────────────────────────────────

  describe('smartArchiveFile', () => {
    it('archives single file when contents are identical', async () => {
      mockAreContentsIdentical.mockReturnValue(true);
      // ensureDirectoryExists: dir doesn't exist -> create it
      // handleConflicts: target doesn't exist -> return path
      mockExistsSync
        .mockReturnValueOnce(false) // ensureDirectoryExists: dir doesn't exist
        .mockReturnValueOnce(false); // handleConflicts: target doesn't exist

      const result = await manager.smartArchiveFile('/src/file.md', {
        archiveDir: '/archive',
        originalContent: 'content',
        processedContent: 'content',
      });
      expect(result.success).toBe(true);
      expect(result.contentsIdentical).toBe(true);
      expect(mockRenameSync).toHaveBeenCalled();
    });

    it('archives two files when contents differ', async () => {
      mockAreContentsIdentical.mockReturnValue(false);
      mockExistsSync.mockReturnValue(false); // no conflicts
      mockGenerateArchivePaths.mockReturnValue({
        original: '/archive/file.ORIGINAL.md',
        processed: '/archive/file.PROCESSED.md',
      });

      const result = await manager.smartArchiveFile('/src/file.md', {
        archiveDir: '/archive',
        originalContent: 'original',
        processedContent: 'processed',
      });
      expect(result.success).toBe(true);
      expect(result.contentsIdentical).toBe(false);
      expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
      expect(mockUnlinkSync).toHaveBeenCalled();
    });

    it('returns error when identical contents and conflict is skip', async () => {
      mockAreContentsIdentical.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true); // conflict

      const result = await manager.smartArchiveFile('/src/file.md', {
        archiveDir: '/archive',
        originalContent: 'content',
        processedContent: 'content',
        conflictResolution: 'skip',
      });
      expect(result.success).toBe(false);
      expect(result.contentsIdentical).toBe(true);
    });

    it('handles errors gracefully', async () => {
      mockAreContentsIdentical.mockImplementation(() => { throw new Error('compare error'); });

      const result = await manager.smartArchiveFile('/src/file.md', {
        archiveDir: '/archive',
        originalContent: 'a',
        processedContent: 'b',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('compare error');
    });
  });

  // ── isValidArchiveDirectory ────────────────────────────────────────

  describe('isValidArchiveDirectory', () => {
    it('returns true for existing directory', () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => true });
      expect(ArchiveManager.isValidArchiveDirectory('/archive')).toBe(true);
    });

    it('returns false for existing file (not directory)', () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => false });
      expect(ArchiveManager.isValidArchiveDirectory('/archive')).toBe(false);
    });

    it('returns true when parent directory exists', () => {
      mockExistsSync
        .mockReturnValueOnce(false) // path doesn't exist
        .mockReturnValueOnce(true); // parent exists
      mockStatSync.mockReturnValue({ isDirectory: () => true });
      expect(ArchiveManager.isValidArchiveDirectory('/parent/archive')).toBe(true);
    });

    it('returns false when parent directory does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      expect(ArchiveManager.isValidArchiveDirectory('/nonexistent/archive')).toBe(false);
    });

    it('returns false on error', () => {
      mockExistsSync.mockImplementation(() => { throw new Error('permission denied'); });
      expect(ArchiveManager.isValidArchiveDirectory('/archive')).toBe(false);
    });
  });
});
