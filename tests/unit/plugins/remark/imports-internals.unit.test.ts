const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockRealpathSyncNative = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  realpathSync: Object.assign(
    (...args: unknown[]) => mockRealpathSyncNative(...args),
    { native: (...args: unknown[]) => mockRealpathSyncNative(...args) }
  ),
}));

vi.mock('../../../../src/core/parsers/yaml-parser', () => ({
  parseYamlFrontMatter: vi.fn(() => ({ content: '', metadata: {} })),
}));

vi.mock('../../../../src/core/utils/frontmatter-merger', () => ({
  mergeSequentially: vi.fn(() => ({ metadata: {}, stats: undefined })),
}));

vi.mock('unified', () => ({
  unified: vi.fn(() => ({
    use: vi.fn().mockReturnThis(),
    parse: vi.fn(() => ({ type: 'root', children: [] })),
  })),
}));

vi.mock('remark-parse', () => ({ default: vi.fn() }));

import {
  _extractImportDirectives,
  _loadFileContent,
  _getCanonicalImportPath,
  _extractSection,
} from '../../../../src/plugins/remark/imports';

describe('imports.ts internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── extractImportDirectives ────────────────────────────────────────

  describe('extractImportDirectives', () => {
    it('extracts simple @import directive', () => {
      const directives = _extractImportDirectives('@import header.md');
      expect(directives.length).toBe(1);
      expect(directives[0].filePath).toBe('header.md');
      expect(directives[0].section).toBeUndefined();
    });

    it('extracts quoted path with spaces', () => {
      const directives = _extractImportDirectives('@import "path/to file.md"');
      expect(directives.length).toBe(1);
      expect(directives[0].filePath).toBe('path/to file.md');
    });

    it('extracts directive with section anchor', () => {
      const directives = _extractImportDirectives('@import doc.md#introduction');
      expect(directives.length).toBe(1);
      expect(directives[0].filePath).toBe('doc.md');
      expect(directives[0].section).toBe('introduction');
    });

    it('extracts multiple directives', () => {
      const text = '@import header.md\n@import footer.md';
      const directives = _extractImportDirectives(text);
      expect(directives.length).toBe(2);
      expect(directives[0].filePath).toBe('header.md');
      expect(directives[1].filePath).toBe('footer.md');
    });

    it('returns empty array for no directives', () => {
      expect(_extractImportDirectives('no imports here')).toEqual([]);
    });

    it('captures fullMatch text', () => {
      const directives = _extractImportDirectives('@import header.md');
      expect(directives[0].fullMatch).toBe('@import header.md');
    });

    it('captures start and end positions', () => {
      const directives = _extractImportDirectives('Before @import file.md after');
      expect(directives[0].start).toBe(7);
      expect(directives[0].end).toBe(7 + '@import file.md'.length);
    });

    it('handles path with subdirectories', () => {
      const directives = _extractImportDirectives('@import templates/header.md');
      expect(directives[0].filePath).toBe('templates/header.md');
    });
  });

  // ── loadFileContent ────────────────────────────────────────────────

  describe('loadFileContent', () => {
    function makeContext(overrides: Record<string, unknown> = {}) {
      return {
        depth: 0,
        maxDepth: 10,
        basePath: '/test',
        mergeMetadata: true,
        debug: false,
        startTime: Date.now(),
        timeoutMs: 30000,
        filterReserved: true,
        validateTypes: true,
        logImportOperations: false,
        importTracing: false,
        importStack: [] as string[],
        contentCache: new Map<string, string>(),
        importedMetadataList: [] as { metadata: Record<string, unknown>; source: string }[],
        importedFiles: [] as string[],
        accumulatedMetadata: {} as Record<string, unknown>,
        ...overrides,
      };
    }

    it('returns cached content on second call', () => {
      const ctx = makeContext();
      ctx.contentCache.set('/test/file.md', 'cached content');
      expect(_loadFileContent('/test/file.md', ctx)).toBe('cached content');
      expect(mockExistsSync).not.toHaveBeenCalled();
    });

    it('loads from filesystem and caches', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('file content');
      const ctx = makeContext();
      const result = _loadFileContent('/test/file.md', ctx);
      expect(result).toBe('file content');
      expect(ctx.contentCache.get('/test/file.md')).toBe('file content');
    });

    it('returns null when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const ctx = makeContext();
      expect(_loadFileContent('/test/missing.md', ctx)).toBeNull();
    });

    it('returns null and handles read errors gracefully', () => {
      mockExistsSync.mockImplementation(() => { throw new Error('read error'); });
      const ctx = makeContext();
      expect(_loadFileContent('/test/error.md', ctx)).toBeNull();
    });
  });

  // ── getCanonicalImportPath ─────────────────────────────────────────

  describe('getCanonicalImportPath', () => {
    it('returns normalized path when realpath succeeds', () => {
      mockRealpathSyncNative.mockReturnValue('/resolved/real/path.md');
      const result = _getCanonicalImportPath('/some/path.md');
      expect(result).toContain('path.md');
    });

    it('falls back to normalized path when realpath throws', () => {
      mockRealpathSyncNative.mockImplementation(() => { throw new Error('ENOENT'); });
      const result = _getCanonicalImportPath('/some/../test/path.md');
      // Should still return a normalized path (no ..)
      expect(result).not.toContain('..');
    });
  });

  // ── extractSection ─────────────────────────────────────────────────

  describe('extractSection', () => {
    const content = [
      '# Introduction',
      'Intro text here.',
      '',
      '## Details',
      'Detail text here.',
      'More details.',
      '',
      '## Conclusion',
      'Conclusion text.',
    ].join('\n');

    it('extracts section by name (case-insensitive)', () => {
      const result = _extractSection(content, 'details', false);
      expect(result).toContain('Detail text here.');
      expect(result).toContain('More details.');
    });

    it('does not include content from next section of same level', () => {
      const result = _extractSection(content, 'details', false);
      expect(result).not.toContain('Conclusion text.');
    });

    it('returns full content when section not found', () => {
      const result = _extractSection(content, 'nonexistent', false);
      expect(result).toBe(content);
    });

    it('handles nested sections (extracts until same or higher level)', () => {
      const nested = [
        '# Main',
        '## Sub1',
        'Sub1 content.',
        '### Sub1.1',
        'Sub1.1 content.',
        '## Sub2',
        'Sub2 content.',
      ].join('\n');
      const result = _extractSection(nested, 'Sub1', false);
      expect(result).toContain('Sub1 content.');
      expect(result).toContain('Sub1.1 content.');
      expect(result).not.toContain('Sub2 content.');
    });

    it('extracts last section to end of content', () => {
      const result = _extractSection(content, 'conclusion', false);
      expect(result).toContain('Conclusion text.');
    });

    it('trims whitespace from extracted section', () => {
      const result = _extractSection(content, 'conclusion', false);
      expect(result).toBe('Conclusion text.');
    });
  });
});
