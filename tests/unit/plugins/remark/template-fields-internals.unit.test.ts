const mockFieldSpan = vi.fn(
  (name: string, content: string, _kind: string) =>
    `<span class="legal-field" data-field="${name}">${content}</span>`
);

const mockTrackField = vi.fn();

const mockDetectBracketValues = vi.fn(() => new Set<string>());

// Mock helpers with a few real-ish helpers for testing
const mockFormatDate = vi.fn((..._args: unknown[]) => '2025-01-15');
const mockAddYears = vi.fn((date: Date, years: number) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
});

vi.mock('../../../../src/extensions/tracking/field-span', () => ({
  fieldSpan: (...args: unknown[]) => mockFieldSpan(...(args as [string, string, string])),
}));

vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: (...args: unknown[]) => mockTrackField(...args),
  },
}));

vi.mock('../../../../src/extensions/ast-mixin-processor', () => ({
  detectBracketValues: (...args: unknown[]) => mockDetectBracketValues(...(args as [Record<string, unknown>])),
  unescapeBracketLiteral: (value: string) => {
    if (value.startsWith('\\[') && value.endsWith('\\]')) {
      return '[' + value.slice(2, -2) + ']';
    }
    return null;
  },
}));

vi.mock('../../../../src/extensions/helpers/index', () => ({
  extensionHelpers: {
    formatDate: (...args: unknown[]) => mockFormatDate(...args),
    addYears: (...args: unknown[]) => mockAddYears(...(args as [Date, number])),
  },
}));

import {
  _isInsideLoopOrConditional,
  _extractTemplateFields,
  _resolveFieldValue,
  _resolveNestedValue,
  _formatFieldValue,
  _isInsideFieldTrackingSpan,
  _smartSplitArguments,
  _parseHelperArguments,
  _parseHandlebarsArguments,
} from '../../../../src/plugins/remark/template-fields';

describe('template-fields.ts internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectBracketValues.mockReturnValue(new Set<string>());
  });

  // ── isInsideLoopOrConditional ──────────────────────────────────────

  describe('isInsideLoopOrConditional', () => {
    it('returns false for text without blocks', () => {
      expect(_isInsideLoopOrConditional('Hello {{name}}', 6)).toBe(false);
    });

    it('returns true for position inside {{#block}}...{{/block}}', () => {
      const text = '{{#items}}{{name}}{{/items}}';
      // position 10 is inside the block (at the start of {{name}})
      expect(_isInsideLoopOrConditional(text, 10)).toBe(true);
    });

    it('returns false for position outside block', () => {
      const text = 'Before {{#items}}inside{{/items}} After';
      // position 34 is in " After"
      expect(_isInsideLoopOrConditional(text, 34)).toBe(false);
    });

    it('returns true for position inside {{#if}} block', () => {
      const text = '{{#if active}}content{{/if}}';
      expect(_isInsideLoopOrConditional(text, 14)).toBe(true);
    });

    it('returns false at exact block boundary (start)', () => {
      const text = '{{#items}}inside{{/items}}';
      // position 0 is AT the block start, not inside (> blockStart required)
      expect(_isInsideLoopOrConditional(text, 0)).toBe(false);
    });

    it('handles blocks with underscored variable names', () => {
      const text = '{{#line_items}}{{name}}{{/line_items}}';
      expect(_isInsideLoopOrConditional(text, 15)).toBe(true);
    });

    it('returns true for position inside {{#each ...}} block', () => {
      const text = '{{#each items}}{{name}}{{/each}}';
      const position = text.indexOf('{{name}}');
      expect(_isInsideLoopOrConditional(text, position)).toBe(true);
    });

    it('returns true for position inside {{#unless ...}} block', () => {
      const text = '{{#unless active}}{{name}}{{/unless}}';
      const position = text.indexOf('{{name}}');
      expect(_isInsideLoopOrConditional(text, position)).toBe(true);
    });
  });

  // ── extractTemplateFields ──────────────────────────────────────────

  describe('extractTemplateFields', () => {
    it('extracts simple {{field}} patterns', () => {
      const fields = _extractTemplateFields('Hello {{name}}!', []);
      expect(fields.length).toBe(1);
      expect(fields[0].fieldName).toBe('name');
      expect(fields[0].pattern).toBe('{{name}}');
    });

    it('extracts multiple fields', () => {
      const fields = _extractTemplateFields('{{first}} and {{last}}', []);
      expect(fields.length).toBe(2);
      // Fields are sorted in reverse order (for replacement)
      expect(fields[0].fieldName).toBe('last');
      expect(fields[1].fieldName).toBe('first');
    });

    it('skips loop/conditional patterns (#, /, else)', () => {
      const text = '{{#if active}}{{name}}{{/if}}{{else}}';
      const fields = _extractTemplateFields(text, []);
      // Only {{name}} should be extracted - but it's inside a conditional block
      // The isInsideLoopOrConditional check should filter it out too
      // Let's verify: #if, /if, else are all skipped
      const names = fields.map(f => f.fieldName);
      expect(names).not.toContain('#if active');
      expect(names).not.toContain('/if');
      expect(names).not.toContain('else');
    });

    it('unescapes backslash-underscores in field names', () => {
      const fields = _extractTemplateFields('{{legal\\_name}}', []);
      expect(fields.length).toBe(1);
      expect(fields[0].fieldName).toBe('legal_name');
    });

    it('does not extract bare @today outside template braces', () => {
      const fields = _extractTemplateFields('Date: @today', []);
      expect(fields.length).toBe(0);
    });

    it('does not extract bare @today with format specifier outside template braces', () => {
      const fields = _extractTemplateFields('Date: @today[long]', []);
      expect(fields.length).toBe(0);
    });

    it('does not extract @today that is inside a {{}} block', () => {
      const fields = _extractTemplateFields('{{formatDate @today "YYYY"}}', []);
      // Should extract the outer {{}} field, but @today inside should NOT be separate
      const todayFields = fields.filter(f => f.fieldName === '@today');
      expect(todayFields.length).toBe(0);
    });

    it('returns empty array for text without fields', () => {
      expect(_extractTemplateFields('plain text', [])).toEqual([]);
    });

    it('uses custom regex patterns when provided', () => {
      const fields = _extractTemplateFields('Hello <%=name%>!', ['<%=\\s*([^%]+)\\s*%>']);
      expect(fields.length).toBe(1);
      expect(fields[0].fieldName).toBe('name');
    });

    it('handles dot notation in field names', () => {
      const fields = _extractTemplateFields('{{client.name}}', []);
      expect(fields.length).toBe(1);
      expect(fields[0].fieldName).toBe('client.name');
    });

    it('skips fields that are inside #each blocks', () => {
      const fields = _extractTemplateFields('{{#each items}}{{name}}{{/each}}', []);
      expect(fields).toEqual([]);
    });

    it('skips fields that are inside #unless blocks', () => {
      const fields = _extractTemplateFields('{{#unless active}}{{name}}{{/unless}}', []);
      expect(fields).toEqual([]);
    });
  });

  // ── resolveFieldValue ──────────────────────────────────────────────

  describe('resolveFieldValue', () => {
    it('resolves simple variable', () => {
      const result = _resolveFieldValue('name', { name: 'Alice' });
      expect(result.value).toBe('Alice');
      expect(result.hasLogic).toBe(false);
    });

    it('resolves nested dot notation', () => {
      const result = _resolveFieldValue('client.name', { client: { name: 'ACME' } });
      expect(result.value).toBe('ACME');
    });

    it('returns undefined for missing field', () => {
      const result = _resolveFieldValue('missing', {});
      expect(result.value).toBeUndefined();
    });

    it('handles @today default format', () => {
      const result = _resolveFieldValue('@today', {});
      expect(result.hasLogic).toBe(true);
      expect(result.mixinType).toBe('helper');
      // Should be YYYY-MM-DD format
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles @today with metadata override', () => {
      const result = _resolveFieldValue('@today', { '@today': '2025-06-15' });
      expect(result.value).toBe('2025-06-15');
    });

    it('handles @today[long] format', () => {
      const result = _resolveFieldValue('@today[long]', { '@today': '2025-01-15' });
      expect(result.hasLogic).toBe(true);
      // Should contain the month name
      expect(typeof result.value).toBe('string');
      expect((result.value as string).length).toBeGreaterThan(5);
    });

    it('handles @today[iso] format', () => {
      const result = _resolveFieldValue('@today[iso]', { '@today': '2025-01-15' });
      expect(result.value).toBe('2025-01-15');
    });

    it('handles @today[european] format', () => {
      const result = _resolveFieldValue('@today[european]', { '@today': '2025-01-15' });
      expect(result.hasLogic).toBe(true);
      expect(typeof result.value).toBe('string');
    });

    it('handles @today[medium] format', () => {
      const result = _resolveFieldValue('@today[medium]', { '@today': '2025-06-15' });
      expect(result.hasLogic).toBe(true);
      expect(typeof result.value).toBe('string');
    });

    it('handles @today with unknown format (falls back to ISO)', () => {
      const result = _resolveFieldValue('@today[custom_xyz]', { '@today': '2025-01-15' });
      expect(result.value).toBe('2025-01-15');
    });

    it('resolves Handlebars helper syntax (space-separated)', () => {
      mockFormatDate.mockReturnValue('January 15, 2025');
      const result = _resolveFieldValue('formatDate date "MMMM Do, YYYY"', { date: new Date('2025-01-15') });
      expect(result.hasLogic).toBe(true);
      expect(result.mixinType).toBe('helper');
      expect(mockFormatDate).toHaveBeenCalled();
    });

    it('resolves parenthesized helper syntax', () => {
      mockFormatDate.mockReturnValue('2025-01-15');
      const result = _resolveFieldValue('formatDate(@today, "YYYY-MM-DD")', { '@today': '2025-01-15' });
      expect(result.hasLogic).toBe(true);
      expect(result.mixinType).toBe('helper');
    });

    it('returns undefined value for unknown helper', () => {
      const result = _resolveFieldValue('unknownHelper(arg1)', {});
      expect(result.value).toBeUndefined();
      expect(result.hasLogic).toBe(true);
    });

    it('handles conditional/ternary expression', () => {
      const result = _resolveFieldValue('active ? "Yes" : "No"', { active: true });
      expect(result.value).toBe('Yes');
      expect(result.hasLogic).toBe(true);
      expect(result.mixinType).toBe('conditional');
    });

    it('handles conditional with falsy value', () => {
      const result = _resolveFieldValue('active ? "Yes" : "No"', { active: false });
      expect(result.value).toBe('No');
    });

    it('tracks empty condition for field tracking', () => {
      const result = _resolveFieldValue('missing ? "A" : "B"', {});
      expect(result.isEmptyCondition).toBe(true);
    });

    it('treats bracket values as missing', () => {
      mockDetectBracketValues.mockReturnValue(new Set(['special']));
      const result = _resolveFieldValue('special', { special: '[value]' });
      expect(result.value).toBeUndefined();
    });

    it('handles helper that throws error gracefully', () => {
      mockFormatDate.mockImplementation(() => { throw new Error('helper error'); });
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = _resolveFieldValue('formatDate date "bad"', { date: 'not-a-date' });
      expect(result.value).toBeUndefined();
      expect(result.hasLogic).toBe(true);
      spy.mockRestore();
    });

    it('handles parenthesized helper that throws error', () => {
      mockFormatDate.mockImplementation(() => { throw new Error('helper error'); });
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = _resolveFieldValue('formatDate("bad")', {});
      expect(result.value).toBeUndefined();
      spy.mockRestore();
    });
  });

  // ── resolveNestedValue ─────────────────────────────────────────────

  describe('resolveNestedValue', () => {
    it('resolves top-level key', () => {
      expect(_resolveNestedValue({ name: 'Alice' }, 'name')).toBe('Alice');
    });

    it('resolves nested key with dot notation', () => {
      expect(_resolveNestedValue({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
    });

    it('returns undefined for missing path', () => {
      expect(_resolveNestedValue({ a: 1 }, 'b')).toBeUndefined();
    });

    it('returns undefined when traversing through null', () => {
      expect(_resolveNestedValue({ a: null }, 'a.b')).toBeUndefined();
    });

    it('returns undefined when traversing through a primitive', () => {
      expect(_resolveNestedValue({ a: 'hello' }, 'a.b')).toBeUndefined();
    });

    it('handles array access with bracket notation', () => {
      expect(_resolveNestedValue({ items: ['zero', 'one', 'two'] }, 'items[1]')).toBe('one');
    });

    it('handles nested array access', () => {
      const meta = { parties: [{ name: 'Alice' }, { name: 'Bob' }] };
      expect(_resolveNestedValue(meta, 'parties[0].name')).toBe('Alice');
    });

    it('returns undefined for array access on non-array', () => {
      expect(_resolveNestedValue({ items: 'not-array' }, 'items[0]')).toBeUndefined();
    });

    it('returns undefined for array access on non-object parent', () => {
      expect(_resolveNestedValue({ items: 42 }, 'items[0]')).toBeUndefined();
    });

    it('returns undefined when traversing through Date', () => {
      expect(_resolveNestedValue({ d: new Date() }, 'd.year')).toBeUndefined();
    });

    it('returns undefined when traversing through array (non-bracket access)', () => {
      expect(_resolveNestedValue({ items: [1, 2] }, 'items.length')).toBeUndefined();
    });

    it('handles asterisk replacement in keys', () => {
      // Keys with leading/trailing * are replaced with _
      expect(_resolveNestedValue({ _bold_: 'val' }, '*bold*')).toBe('val');
    });

    it('resolves array element via dot notation numeric index', () => {
      const meta = { parties: [{ name: 'Alice' }, { name: 'Bob' }] };
      expect(_resolveNestedValue(meta, 'parties.0.name')).toBe('Alice');
      expect(_resolveNestedValue(meta, 'parties.1.name')).toBe('Bob');
    });

    it('resolves primitive array element via dot notation numeric index', () => {
      expect(_resolveNestedValue({ items: ['zero', 'one', 'two'] }, 'items.2')).toBe('two');
    });

    it('returns undefined for out-of-bounds dot notation numeric index', () => {
      expect(_resolveNestedValue({ items: ['a'] }, 'items.5')).toBeUndefined();
    });
  });

  // ── formatFieldValue ───────────────────────────────────────────────

  describe('formatFieldValue', () => {
    it('returns original pattern for undefined value', () => {
      expect(_formatFieldValue(undefined, 'name', false, false, false)).toBe('{{name}}');
    });

    it('returns original pattern for null value', () => {
      expect(_formatFieldValue(null, 'name', false, false, false)).toBe('{{name}}');
    });

    it('returns original pattern for empty string', () => {
      expect(_formatFieldValue('', 'name', false, false, false)).toBe('{{name}}');
    });

    it('formats string value', () => {
      expect(_formatFieldValue('Alice', 'name', false, false, false)).toBe('Alice');
    });

    it('formats boolean value', () => {
      expect(_formatFieldValue(true, 'active', false, false, false)).toBe('true');
      expect(_formatFieldValue(false, 'active', false, false, false)).toBe('false');
    });

    it('formats number value', () => {
      expect(_formatFieldValue(42, 'count', false, false, false)).toBe('42');
    });

    it('formats Date value as YYYY-MM-DD', () => {
      const date = new Date('2025-06-15T00:00:00Z');
      expect(_formatFieldValue(date, 'date', false, false, false)).toBe('2025-06-15');
    });

    it('wraps with field tracking span when enabled (filled)', () => {
      _formatFieldValue('Alice', 'name', true, false, false);
      expect(mockFieldSpan).toHaveBeenCalledWith('name', 'Alice', 'imported');
    });

    it('wraps with highlight span when hasLogic is true', () => {
      _formatFieldValue('Yes', 'cond', true, true, false);
      expect(mockFieldSpan).toHaveBeenCalledWith('cond', 'Yes', 'highlight');
    });

    it('wraps with missing span when isEmptyField is true', () => {
      _formatFieldValue(undefined, 'name', true, false, true);
      expect(mockFieldSpan).toHaveBeenCalledWith('name', '{{name}}', 'missing');
    });

    it('empty field overrides logic for field tracking', () => {
      // isEmptyField=true should take priority over hasLogic=true
      _formatFieldValue('value', 'name', true, true, true);
      expect(mockFieldSpan).toHaveBeenCalledWith('name', 'value', 'missing');
    });
  });

  // ── isInsideFieldTrackingSpan ──────────────────────────────────────

  describe('isInsideFieldTrackingSpan', () => {
    it('returns false when parent is not a paragraph', () => {
      const node = { type: 'text', value: 'hello' };
      const parent = { type: 'heading', children: [node] };
      expect(_isInsideFieldTrackingSpan(node, parent)).toBe(false);
    });

    it('returns false when parent is null', () => {
      expect(_isInsideFieldTrackingSpan({}, null)).toBe(false);
    });

    it('returns false when node is not in parent children', () => {
      const node = { type: 'text', value: 'hello' };
      const parent = { type: 'paragraph', children: [{ type: 'text', value: 'other' }] };
      expect(_isInsideFieldTrackingSpan(node, parent)).toBe(false);
    });

    it('returns true when between opening and closing field spans', () => {
      const openSpan = { type: 'html', value: '<span class="legal-field imported-value" data-field="name">' };
      const textNode = { type: 'text', value: 'Alice' };
      const closeSpan = { type: 'html', value: '</span>' };
      const parent = { type: 'paragraph', children: [openSpan, textNode, closeSpan] };
      expect(_isInsideFieldTrackingSpan(textNode, parent)).toBe(true);
    });

    it('returns false when no opening span before node', () => {
      const textNode = { type: 'text', value: 'Alice' };
      const closeSpan = { type: 'html', value: '</span>' };
      const parent = { type: 'paragraph', children: [textNode, closeSpan] };
      expect(_isInsideFieldTrackingSpan(textNode, parent)).toBe(false);
    });

    it('returns false when no closing span after node', () => {
      const openSpan = { type: 'html', value: '<span class="legal-field imported-value" data-field="name">' };
      const textNode = { type: 'text', value: 'Alice' };
      const parent = { type: 'paragraph', children: [openSpan, textNode] };
      expect(_isInsideFieldTrackingSpan(textNode, parent)).toBe(false);
    });

    it('returns false when adjacent complete spans surround text node (not inside either span)', () => {
      // Phase 2 produces complete <span>content</span> html nodes. When two such spans
      // are adjacent to a text node (e.g. ", {{field}}, "), the text is NOT inside
      // either span — isInsideFieldTrackingSpan must not return a false positive here.
      const spanBefore = { type: 'html', value: '<span class="legal-field highlight" data-field="titleCase">Eleanor Voss</span>' };
      const textNode = { type: 'text', value: ', {{provider.address}}, ' };
      const spanAfter = { type: 'html', value: '<span class="legal-field highlight" data-field="lower">evoss@meridiancg.com</span>' };
      const parent = { type: 'paragraph', children: [spanBefore, textNode, spanAfter] };
      expect(_isInsideFieldTrackingSpan(textNode, parent)).toBe(false);
    });
  });

  // ── smartSplitArguments ────────────────────────────────────────────

  describe('smartSplitArguments', () => {
    it('splits simple comma-separated values', () => {
      expect(_smartSplitArguments('a, b, c')).toEqual(['a', ' b', ' c']);
    });

    it('preserves commas inside double quotes', () => {
      const result = _smartSplitArguments('arg1, "arg with, comma", arg3');
      expect(result.length).toBe(3);
      expect(result[1]).toContain('arg with, comma');
    });

    it('preserves commas inside single quotes', () => {
      const result = _smartSplitArguments("arg1, 'arg, with comma'");
      expect(result.length).toBe(2);
      expect(result[1]).toContain('arg, with comma');
    });

    it('preserves commas inside parentheses', () => {
      const result = _smartSplitArguments('addYears(@today, 5), "YYYY-MM-DD"');
      expect(result.length).toBe(2);
      expect(result[0]).toBe('addYears(@today, 5)');
    });

    it('handles nested parentheses', () => {
      const result = _smartSplitArguments('outer(inner(a, b), c), d');
      expect(result.length).toBe(2);
      expect(result[0]).toBe('outer(inner(a, b), c)');
    });

    it('returns single element for no commas', () => {
      expect(_smartSplitArguments('single')).toEqual(['single']);
    });

    it('returns empty array for empty string', () => {
      expect(_smartSplitArguments('')).toEqual([]);
    });
  });

  // ── parseHelperArguments ───────────────────────────────────────────

  describe('parseHelperArguments', () => {
    it('returns empty array for empty string', () => {
      expect(_parseHelperArguments('', {})).toEqual([]);
    });

    it('parses string literals (double quotes)', () => {
      const result = _parseHelperArguments('"hello"', {});
      expect(result).toEqual(['hello']);
    });

    it('parses string literals (single quotes)', () => {
      const result = _parseHelperArguments("'world'", {});
      expect(result).toEqual(['world']);
    });

    it('parses number literals', () => {
      const result = _parseHelperArguments('42', {});
      expect(result).toEqual([42]);
    });

    it('parses negative numbers', () => {
      const result = _parseHelperArguments('-3.14', {});
      expect(result).toEqual([-3.14]);
    });

    it('parses boolean true', () => {
      expect(_parseHelperArguments('true', {})).toEqual([true]);
    });

    it('parses boolean false', () => {
      expect(_parseHelperArguments('false', {})).toEqual([false]);
    });

    it('parses null literal', () => {
      expect(_parseHelperArguments('null', {})).toEqual([null]);
    });

    it('parses undefined literal', () => {
      expect(_parseHelperArguments('undefined', {})).toEqual([undefined]);
    });

    it('resolves metadata references', () => {
      const result = _parseHelperArguments('name', { name: 'Alice' });
      expect(result).toEqual(['Alice']);
    });

    it('handles @today special case', () => {
      const result = _parseHelperArguments('@today', { '@today': '2025-01-15' });
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Date);
    });

    it('handles nested helper calls', () => {
      mockAddYears.mockReturnValue(new Date('2027-01-15'));
      const result = _parseHelperArguments('addYears(@today, 2), "YYYY"', { '@today': '2025-01-15' });
      expect(result.length).toBe(2);
      expect(mockAddYears).toHaveBeenCalled();
      expect(result[1]).toBe('YYYY');
    });

    it('handles mixed argument types', () => {
      const result = _parseHelperArguments('amount, "USD", true', { amount: 1500 });
      expect(result).toEqual([1500, 'USD', true]);
    });

    it('skips empty parts', () => {
      const result = _parseHelperArguments(', ,', {});
      expect(result).toEqual([]);
    });
  });

  // ── parseHandlebarsArguments ───────────────────────────────────────

  describe('parseHandlebarsArguments', () => {
    it('returns empty array for empty string', () => {
      expect(_parseHandlebarsArguments('', {})).toEqual([]);
    });

    it('parses double-quoted string', () => {
      const result = _parseHandlebarsArguments('"hello world"', {});
      expect(result).toEqual(['hello world']);
    });

    it('parses single-quoted string', () => {
      const result = _parseHandlebarsArguments("'hello'", {});
      expect(result).toEqual(['hello']);
    });

    it('handles escaped quotes inside strings', () => {
      const result = _parseHandlebarsArguments('"say \\"hi\\""', {});
      expect(result).toEqual(['say "hi"']);
    });

    it('parses number tokens', () => {
      expect(_parseHandlebarsArguments('42', {})).toEqual([42]);
    });

    it('parses negative numbers', () => {
      expect(_parseHandlebarsArguments('-5', {})).toEqual([-5]);
    });

    it('parses boolean tokens', () => {
      expect(_parseHandlebarsArguments('true false', {})).toEqual([true, false]);
    });

    it('parses null and undefined tokens', () => {
      expect(_parseHandlebarsArguments('null undefined', {})).toEqual([null, undefined]);
    });

    it('resolves metadata variables', () => {
      const result = _parseHandlebarsArguments('name', { name: 'Alice' });
      expect(result).toEqual(['Alice']);
    });

    it('parses space-separated mixed arguments', () => {
      const result = _parseHandlebarsArguments('amount "USD"', { amount: 1500 });
      expect(result).toEqual([1500, 'USD']);
    });

    it('handles @today token', () => {
      const result = _parseHandlebarsArguments('@today', { '@today': '2025-01-15' });
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Date);
    });

    it('handles today alias token', () => {
      const result = _parseHandlebarsArguments('today', { today: '2025-01-15' });
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Date);
    });

    it('handles subexpressions with parentheses', () => {
      mockAddYears.mockReturnValue(new Date('2027-01-15'));
      const result = _parseHandlebarsArguments('(addYears @today 2) "YYYY"', { '@today': '2025-01-15' });
      expect(result.length).toBe(2);
      expect(mockAddYears).toHaveBeenCalled();
      expect(result[1]).toBe('YYYY');
    });

    it('handles unknown subexpression helper gracefully', () => {
      const result = _parseHandlebarsArguments('(unknownHelper arg)', {});
      expect(result).toEqual([undefined]);
    });

    it('handles subexpression helper that throws', () => {
      mockFormatDate.mockImplementation(() => { throw new Error('fail'); });
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = _parseHandlebarsArguments('(formatDate @today "bad")', { '@today': '2025-01-15' });
      expect(result).toEqual([undefined]);
      spy.mockRestore();
    });

    it('skips whitespace between arguments', () => {
      const result = _parseHandlebarsArguments('  42   "text"  ', {});
      expect(result).toEqual([42, 'text']);
    });

    it('handles unclosed quote gracefully', () => {
      // Should not throw, just consume to end
      const result = _parseHandlebarsArguments('"unclosed', {});
      expect(result.length).toBe(1);
      expect(result[0]).toBe('unclosed');
    });
  });
});
