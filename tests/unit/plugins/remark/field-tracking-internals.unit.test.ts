const mockTrackField = vi.fn();

vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: (...args: unknown[]) => mockTrackField(...args),
  },
}));

import {
  _shouldExcludeNode,
  _extractFieldName,
  _resolveFieldValue,
  _trackFieldsInTextNode,
} from '../../../../src/plugins/remark/field-tracking';
import type { Text, Node } from 'mdast';

describe('field-tracking.ts internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── shouldExcludeNode ──────────────────────────────────────────────

  describe('shouldExcludeNode', () => {
    it('excludes code nodes', () => {
      const node = { type: 'code', value: '{{field}}' } as Node;
      expect(_shouldExcludeNode(node)).toBe(true);
    });

    it('excludes inlineCode nodes', () => {
      const node = { type: 'inlineCode', value: '{{field}}' } as Node;
      expect(_shouldExcludeNode(node)).toBe(true);
    });

    it('excludes text nodes with code parent', () => {
      const node = { type: 'text', value: '{{field}}' } as Node;
      const parent = { type: 'code' } as Node;
      expect(_shouldExcludeNode(node, parent)).toBe(true);
    });

    it('excludes text nodes with inlineCode parent', () => {
      const node = { type: 'text', value: '{{field}}' } as Node;
      const parent = { type: 'inlineCode' } as Node;
      expect(_shouldExcludeNode(node, parent)).toBe(true);
    });

    it('allows text nodes', () => {
      const node = { type: 'text', value: '{{field}}' } as Node;
      expect(_shouldExcludeNode(node)).toBe(false);
    });

    it('allows text nodes with paragraph parent', () => {
      const node = { type: 'text', value: '{{field}}' } as Node;
      const parent = { type: 'paragraph' } as Node;
      expect(_shouldExcludeNode(node, parent)).toBe(false);
    });
  });

  // ── extractFieldName ───────────────────────────────────────────────

  describe('extractFieldName', () => {
    it('extracts field name from {{field}} pattern', () => {
      expect(_extractFieldName('{{name}}', '{{(.+?)}}')).toBe('name');
    });

    it('trims whitespace from extracted name', () => {
      expect(_extractFieldName('{{ name }}', '{{(.+?)}}')).toBe('name');
    });

    it('returns full match when pattern has no capture group', () => {
      expect(_extractFieldName('{{name}}', '{{.+?}}')).toBe('{{name}}');
    });

    it('handles dot notation', () => {
      expect(_extractFieldName('{{client.name}}', '{{(.+?)}}')).toBe('client.name');
    });
  });

  // ── resolveFieldValue ──────────────────────────────────────────────

  describe('resolveFieldValue', () => {
    it('resolves direct field', () => {
      expect(_resolveFieldValue('name', { name: 'Alice' })).toBe('Alice');
    });

    it('resolves nested dot notation', () => {
      expect(_resolveFieldValue('client.name', { client: { name: 'ACME' } })).toBe('ACME');
    });

    it('returns empty string for missing field', () => {
      expect(_resolveFieldValue('missing', {})).toBe('');
    });

    it('returns empty string for missing nested field', () => {
      expect(_resolveFieldValue('a.b.c', { a: { b: {} } })).toBe('');
    });

    it('converts number to string', () => {
      expect(_resolveFieldValue('count', { count: 42 })).toBe('42');
    });

    it('converts boolean to string', () => {
      expect(_resolveFieldValue('active', { active: true })).toBe('true');
    });

    it('returns empty string when traversing through non-object', () => {
      expect(_resolveFieldValue('a.b', { a: 'string' })).toBe('');
    });

    it('returns empty string when traversing through array', () => {
      expect(_resolveFieldValue('a.b', { a: [1, 2] })).toBe('');
    });

    it('returns empty string when traversing through null', () => {
      expect(_resolveFieldValue('a.b', { a: null })).toBe('');
    });
  });

  // ── trackFieldsInTextNode ──────────────────────────────────────────

  describe('trackFieldsInTextNode', () => {
    it('tracks single field in text', () => {
      const node: Text = { type: 'text', value: 'Hello {{name}}!' };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], { name: 'Alice' });
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('name');
      expect(results[0].value).toBe('Alice');
      expect(results[0].originalValue).toBe('{{name}}');
      expect(mockTrackField).toHaveBeenCalledTimes(1);
    });

    it('tracks multiple fields', () => {
      const node: Text = { type: 'text', value: '{{first}} and {{last}}' };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], { first: 'A', last: 'B' });
      expect(results.length).toBe(2);
      expect(mockTrackField).toHaveBeenCalledTimes(2);
    });

    it('returns empty array for no matches', () => {
      const node: Text = { type: 'text', value: 'plain text' };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], {});
      expect(results).toEqual([]);
    });

    it('includes position info when available', () => {
      const node: Text = {
        type: 'text',
        value: '{{name}}',
        position: { start: { line: 5, column: 3, offset: 42 }, end: { line: 5, column: 11, offset: 50 } },
      };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], {});
      expect(results[0].position).toEqual({ line: 5, column: 3 });
    });

    it('omits position when not available', () => {
      const node: Text = { type: 'text', value: '{{name}}' };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], {});
      expect(results[0].position).toBeUndefined();
    });

    it('resolves value as empty string when not in metadata', () => {
      const node: Text = { type: 'text', value: '{{missing}}' };
      const results = _trackFieldsInTextNode(node, ['{{(.+?)}}'], {});
      expect(results[0].value).toBe('');
    });

    it('tracks with hasLogic false', () => {
      const node: Text = { type: 'text', value: '{{name}}' };
      _trackFieldsInTextNode(node, ['{{(.+?)}}'], { name: 'Alice' });
      expect(mockTrackField).toHaveBeenCalledWith('name', {
        value: 'Alice',
        originalValue: '{{name}}',
        hasLogic: false,
      });
    });

    it('works with custom patterns', () => {
      const node: Text = { type: 'text', value: 'Hello <%=name%>!' };
      const results = _trackFieldsInTextNode(node, ['<%=(.+?)%>'], { name: 'Bob' });
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('name');
    });
  });
});
