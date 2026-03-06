/**
 * @fileoverview Unit tests for batch-processor internal functions
 *
 * Tests the internal helper functions:
 * - findFilesToProcess: recursive file discovery with filtering
 * - processFile: single file processing through Legal Markdown pipeline
 *
 * All fs operations and processLegalMarkdown are mocked.
 */

import * as path from 'path';
import type { BatchProcessingResult } from '../../../src/extensions/batch-processor';

// ---- fs mock (callback-style for promisify compatibility) ----

const mockFs = vi.hoisted(() => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('fs', () => ({
  readdir: mockFs.readdir,
  stat: mockFs.stat,
  readFile: mockFs.readFile,
  writeFile: mockFs.writeFile,
  existsSync: mockFs.existsSync,
  mkdirSync: mockFs.mkdirSync,
  default: {
    readdir: mockFs.readdir,
    stat: mockFs.stat,
    readFile: mockFs.readFile,
    writeFile: mockFs.writeFile,
    existsSync: mockFs.existsSync,
    mkdirSync: mockFs.mkdirSync,
  },
}));

// ---- processLegalMarkdown mock ----

const mockIndex = vi.hoisted(() => ({
  processLegalMarkdown: vi.fn(),
}));

vi.mock('../../../src/index', () => ({
  processLegalMarkdown: mockIndex.processLegalMarkdown,
}));

import {
  _findFilesToProcess,
  _processFile,
} from '../../../src/extensions/batch-processor';

// ---------- helpers ----------

function statFile() {
  return { isDirectory: () => false, isFile: () => true };
}

function statDir() {
  return { isDirectory: () => true, isFile: () => false };
}

/** Configure mockFs.readdir to return entries for a given directory */
function setupReaddir(mapping: Record<string, string[]>) {
  mockFs.readdir.mockImplementation((dir: string, cb: (err: unknown, files?: string[]) => void) => {
    const entries = mapping[dir];
    if (entries) {
      cb(null, entries);
    } else {
      cb(new Error(`ENOENT: no such directory '${dir}'`));
    }
  });
}

/** Configure mockFs.stat based on a set of directory paths */
function setupStat(directories: Set<string>) {
  mockFs.stat.mockImplementation((p: string, cb: (err: unknown, stats?: unknown) => void) => {
    if (directories.has(p)) {
      cb(null, statDir());
    } else {
      cb(null, statFile());
    }
  });
}

// ---------- tests ----------

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.existsSync.mockReturnValue(true);
  mockIndex.processLegalMarkdown.mockResolvedValue({
    content: '<p>processed</p>',
    exportedFiles: [],
  });
});

describe('findFilesToProcess', () => {
  it('finds .md files in a flat directory', async () => {
    setupReaddir({ '/docs': ['readme.md', 'notes.md'] });
    setupStat(new Set());

    const result = await _findFilesToProcess('/docs', ['.md'], false, []);
    expect(result).toEqual([
      path.join('/docs', 'readme.md'),
      path.join('/docs', 'notes.md'),
    ]);
  });

  it('filters by extension and ignores non-matching files', async () => {
    setupReaddir({ '/docs': ['readme.md', 'image.png', 'data.json', 'contract.txt'] });
    setupStat(new Set());

    const result = await _findFilesToProcess('/docs', ['.md', '.txt'], false, []);
    expect(result).toEqual([
      path.join('/docs', 'readme.md'),
      path.join('/docs', 'contract.txt'),
    ]);
  });

  it('excludes files matching exclude patterns', async () => {
    setupReaddir({ '/docs': ['readme.md', 'temp-draft.md', 'backup.md'] });
    setupStat(new Set());

    const result = await _findFilesToProcess('/docs', ['.md'], false, ['temp', 'backup']);
    expect(result).toEqual([path.join('/docs', 'readme.md')]);
  });

  it('recurses into subdirectories when recursive=true', async () => {
    const subdir = path.join('/docs', 'sub');
    setupReaddir({
      '/docs': ['file1.md', 'sub'],
      [subdir]: ['file2.md'],
    });
    setupStat(new Set([subdir]));

    const result = await _findFilesToProcess('/docs', ['.md'], true, []);
    expect(result).toEqual([
      path.join('/docs', 'file1.md'),
      path.join(subdir, 'file2.md'),
    ]);
  });

  it('does not recurse when recursive=false', async () => {
    const subdir = path.join('/docs', 'sub');
    setupReaddir({
      '/docs': ['file1.md', 'sub'],
      [subdir]: ['file2.md'],
    });
    setupStat(new Set([subdir]));

    const result = await _findFilesToProcess('/docs', ['.md'], false, []);
    expect(result).toEqual([path.join('/docs', 'file1.md')]);
  });

  it('returns empty array for empty directory', async () => {
    setupReaddir({ '/empty': [] });
    setupStat(new Set());

    const result = await _findFilesToProcess('/empty', ['.md'], true, []);
    expect(result).toEqual([]);
  });

  it('excludes directories matching exclude patterns', async () => {
    const nodeModules = path.join('/project', 'node_modules');
    setupReaddir({
      '/project': ['file.md', 'node_modules'],
      [nodeModules]: ['hidden.md'],
    });
    setupStat(new Set([nodeModules]));

    const result = await _findFilesToProcess('/project', ['.md'], true, ['node_modules']);
    expect(result).toEqual([path.join('/project', 'file.md')]);
  });
});

describe('processFile', () => {
  function makeResult(): BatchProcessingResult {
    return {
      totalProcessed: 0,
      totalErrors: 0,
      successfulFiles: [],
      failedFiles: [],
      processingTime: 0,
    };
  }

  beforeEach(() => {
    mockFs.readFile.mockImplementation(
      (filePath: string, _enc: string, cb: (err: unknown, data?: string) => void) => {
        cb(null, '---\ntitle: Test\n---\n# Hello');
      }
    );
    mockFs.writeFile.mockImplementation(
      (_filePath: string, _data: string, cb: (err: unknown) => void) => {
        cb(null);
      }
    );
  });

  it('reads file, processes it, and writes output', async () => {
    const result = makeResult();
    await _processFile('/input/doc.md', '/input', '/output', true, {}, result);

    // readFile called with the file path
    expect(mockFs.readFile).toHaveBeenCalledWith('/input/doc.md', 'utf8', expect.any(Function));
    // processLegalMarkdown called with file content
    expect(mockIndex.processLegalMarkdown).toHaveBeenCalledWith(
      '---\ntitle: Test\n---\n# Hello',
      expect.objectContaining({ basePath: '/input' })
    );
    // writeFile called with output path
    expect(mockFs.writeFile).toHaveBeenCalledWith('/output/doc.md', '<p>processed</p>', expect.any(Function));
  });

  it('creates output directory if it does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = makeResult();
    await _processFile('/input/doc.md', '/input', '/output', true, {}, result);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/output', { recursive: true });
  });

  it('preserves directory structure when preserveStructure=true', async () => {
    const result = makeResult();
    await _processFile('/input/sub/doc.md', '/input', '/output', true, {}, result);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      path.join('/output', 'sub', 'doc.md'),
      '<p>processed</p>',
      expect.any(Function)
    );
  });

  it('flattens to outputDir when preserveStructure=false', async () => {
    const result = makeResult();
    await _processFile('/input/sub/deep/doc.md', '/input', '/output', false, {}, result);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      path.join('/output', 'doc.md'),
      '<p>processed</p>',
      expect.any(Function)
    );
  });

  it('increments result.totalProcessed on success', async () => {
    const result = makeResult();
    await _processFile('/input/doc.md', '/input', '/output', true, {}, result);

    expect(result.totalProcessed).toBe(1);
    expect(result.totalErrors).toBe(0);
    expect(result.successfulFiles).toEqual(['/input/doc.md']);
  });

  it('increments result.totalErrors on failure', async () => {
    mockIndex.processLegalMarkdown.mockRejectedValueOnce(new Error('parse error'));
    const result = makeResult();
    await _processFile('/input/bad.md', '/input', '/output', true, {}, result);

    expect(result.totalErrors).toBe(1);
    expect(result.totalProcessed).toBe(0);
    expect(result.failedFiles).toEqual([{ file: '/input/bad.md', error: 'parse error' }]);
  });

  it('calls onProgress callback on success', async () => {
    const onProgress = vi.fn();
    const result = makeResult();
    await _processFile('/input/doc.md', '/input', '/output', true, {}, result, onProgress);

    expect(onProgress).toHaveBeenCalledWith(1, -1, '/input/doc.md');
  });

  it('calls onError callback on failure', async () => {
    mockIndex.processLegalMarkdown.mockRejectedValueOnce(new Error('fail'));
    const onError = vi.fn();
    const result = makeResult();
    await _processFile('/input/doc.md', '/input', '/output', true, {}, result, undefined, onError);

    expect(onError).toHaveBeenCalledWith('/input/doc.md', expect.any(Error));
    expect(onError.mock.calls[0][1].message).toBe('fail');
  });
});
