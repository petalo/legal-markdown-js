const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

import {
  _processTextNode,
  _extractMixinDirectives,
  _parseParameters,
  _parseParameterValue,
  _processMixinDirective,
  _loadMixinContent,
  _processTemplateFields,
} from '../../../../src/plugins/remark/mixins';
import type { Text } from 'mdast';

function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    depth: 0,
    maxDepth: 5,
    basePath: '/test/mixins',
    metadata: {} as Record<string, unknown>,
    debug: false,
    customMixins: {} as Record<string, string>,
    fileCache: new Map<string, string>(),
    ...overrides,
  };
}

describe('mixins.ts internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseParameterValue', () => {
    it('parses double-quoted strings', () => {
      expect(_parseParameterValue('"hello"')).toBe('hello');
    });

    it('parses single-quoted strings', () => {
      expect(_parseParameterValue("'world'")).toBe('world');
    });

    it('parses integers', () => {
      expect(_parseParameterValue('42')).toBe(42);
    });

    it('parses floats', () => {
      expect(_parseParameterValue('3.14')).toBe(3.14);
    });

    it('parses true', () => {
      expect(_parseParameterValue('true')).toBe(true);
    });

    it('parses false', () => {
      expect(_parseParameterValue('false')).toBe(false);
    });

    it('returns unquoted strings as-is', () => {
      expect(_parseParameterValue('plain')).toBe('plain');
    });
  });

  describe('parseParameters', () => {
    it('parses key: value pairs', () => {
      const result = _parseParameters('name: "Alice", age: 30');
      expect(result.name).toBe('Alice');
      expect(result.age).toBe(30);
    });

    it('returns empty object for empty string', () => {
      const result = _parseParameters('');
      expect(Object.keys(result).length).toBe(0);
    });

    it('handles boolean values', () => {
      const result = _parseParameters('active: true, deleted: false');
      expect(result.active).toBe(true);
      expect(result.deleted).toBe(false);
    });
  });

  describe('extractMixinDirectives', () => {
    it('extracts @include directive without params', () => {
      const result = _extractMixinDirectives('Before @include my_mixin after');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('my_mixin');
      expect(result[0].start).toBe(7);
    });

    it('extracts @include directive with params', () => {
      const result = _extractMixinDirectives('@include header(title: "Hello")');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('header');
      expect(result[0].parameters).toEqual({ title: 'Hello' });
    });

    it('extracts multiple directives', () => {
      const result = _extractMixinDirectives('@include a @include b');
      expect(result.length).toBe(2);
    });

    it('returns empty array for no directives', () => {
      expect(_extractMixinDirectives('no mixins here')).toEqual([]);
    });

    it('handles hyphenated mixin names', () => {
      const result = _extractMixinDirectives('@include my-mixin');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('my-mixin');
    });
  });

  describe('loadMixinContent', () => {
    it('returns custom mixin if defined', () => {
      const ctx = makeContext({ customMixins: { greeting: 'Hello {{name}}!' } });
      expect(_loadMixinContent('greeting', ctx)).toBe('Hello {{name}}!');
    });

    it('loads from file system when no custom mixin', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('File content');

      const ctx = makeContext();
      const result = _loadMixinContent('footer', ctx);
      expect(result).toBe('File content');
      expect(mockExistsSync).toHaveBeenCalled();
    });

    it('returns null when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const ctx = makeContext();
      expect(_loadMixinContent('nonexistent', ctx)).toBeNull();
    });

    it('uses cache on second call', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('Cached content');

      const ctx = makeContext();
      _loadMixinContent('cached', ctx);
      _loadMixinContent('cached', ctx);
      // readFileSync should only be called once
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('processTemplateFields', () => {
    it('replaces {{field}} with metadata value', () => {
      const result = _processTemplateFields('Hello {{name}}!', { name: 'Alice' }, false);
      expect(result).toBe('Hello Alice!');
    });

    it('handles nested dot notation', () => {
      const result = _processTemplateFields('{{client.name}}', { client: { name: 'ACME' } }, false);
      expect(result).toBe('ACME');
    });

    it('keeps original when field not found', () => {
      const result = _processTemplateFields('{{missing}}', {}, false);
      expect(result).toBe('{{missing}}');
    });

    it('replaces multiple fields', () => {
      const result = _processTemplateFields('{{a}} and {{b}}', { a: 'X', b: 'Y' }, false);
      expect(result).toBe('X and Y');
    });

    it('converts non-string values to string', () => {
      const result = _processTemplateFields('Count: {{n}}', { n: 42 }, false);
      expect(result).toBe('Count: 42');
    });
  });

  describe('processMixinDirective', () => {
    it('returns original when max depth reached', () => {
      const ctx = makeContext({ depth: 5, maxDepth: 5 });
      const directive = { name: 'test', start: 0, end: 10, fullMatch: '@include test', parameters: {} };
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(_processMixinDirective(directive, ctx)).toBe('@include test');
      spy.mockRestore();
    });

    it('returns original when mixin not found', () => {
      mockExistsSync.mockReturnValue(false);
      const ctx = makeContext();
      const directive = { name: 'missing', start: 0, end: 16, fullMatch: '@include missing', parameters: {} };
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(_processMixinDirective(directive, ctx)).toBe('@include missing');
      spy.mockRestore();
    });

    it('processes custom mixin with template fields', () => {
      const ctx = makeContext({
        customMixins: { greet: 'Hi {{name}}' },
        metadata: { name: 'Bob' },
      });
      const directive = { name: 'greet', start: 0, end: 14, fullMatch: '@include greet', parameters: {} };
      expect(_processMixinDirective(directive, ctx)).toBe('Hi Bob');
    });

    it('merges directive parameters with metadata', () => {
      const ctx = makeContext({
        customMixins: { greet: 'Hi {{name}}' },
        metadata: { name: 'Default' },
      });
      const directive = { name: 'greet', start: 0, end: 30, fullMatch: '@include greet(name: "Alice")', parameters: { name: 'Alice' } };
      expect(_processMixinDirective(directive, ctx)).toBe('Hi Alice');
    });
  });

  describe('processTextNode', () => {
    it('processes mixin directives in text node value', () => {
      const ctx = makeContext({
        customMixins: { sig: 'Signed by {{who}}' },
        metadata: { who: 'CEO' },
      });
      const node: Text = { type: 'text', value: 'Document @include sig end' };
      _processTextNode(node, ctx);
      // The regex captures "@include sig" (no trailing space), so " end" remains
      expect(node.value).toContain('Signed by CEO');
      expect(node.value).toContain('end');
    });

    it('leaves text unchanged when no directives', () => {
      const ctx = makeContext();
      const node: Text = { type: 'text', value: 'plain text' };
      _processTextNode(node, ctx);
      expect(node.value).toBe('plain text');
    });

    it('handles multiple directives in one text', () => {
      const ctx = makeContext({
        customMixins: { a: 'AAA', b: 'BBB' },
      });
      const node: Text = { type: 'text', value: '@include a and @include b' };
      _processTextNode(node, ctx);
      expect(node.value).toContain('AAA');
      expect(node.value).toContain('BBB');
    });
  });
});
