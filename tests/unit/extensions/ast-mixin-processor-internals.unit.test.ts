/**
 * @fileoverview Unit Tests for AST Mixin Processor Internals
 *
 * Tests internal helper functions that are not part of the public API:
 * - findTemplateLoopRanges: regex loop block detection
 * - resolvePath: dot-notation object traversal with array indices
 * - parseArguments: comma-separated argument parsing
 * - resolveHelper: helper function dispatch
 * - resolveConditional: ternary expression evaluation
 * - parseContentToAST: content-to-AST parsing (public)
 * - processMixinAST: AST node resolution (public)
 */

import {
  parseContentToAST,
  processMixinAST,
  unescapeBracketLiteral,
  _findTemplateLoopRanges,
  _resolvePath,
  _parseArguments,
  _resolveHelper,
  _resolveConditional,
} from '../../../src/extensions/ast-mixin-processor';

import { fieldTracker } from '../../../src/extensions/tracking/field-tracker';

vi.mock('../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: vi.fn(),
    clear: vi.fn(),
  },
}));

const mockedFieldTracker = vi.mocked(fieldTracker);

// ---------- findTemplateLoopRanges ----------

describe('findTemplateLoopRanges', () => {
  it('returns empty array for content without loops', () => {
    expect(_findTemplateLoopRanges('Hello {{name}}')).toEqual([]);
  });

  it('finds a single loop range', () => {
    const content = 'before {{#items}}loop body{{/items}} after';
    const ranges = _findTemplateLoopRanges(content);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].variable).toBe('items');
  });

  it('finds multiple loop ranges', () => {
    const content = '{{#a}}x{{/a}} middle {{#b}}y{{/b}}';
    const ranges = _findTemplateLoopRanges(content);
    expect(ranges).toHaveLength(2);
    expect(ranges[0].variable).toBe('a');
    expect(ranges[1].variable).toBe('b');
  });

  it('returns correct start/end positions', () => {
    const content = 'prefix {{#items}}body{{/items}} suffix';
    const ranges = _findTemplateLoopRanges(content);
    expect(ranges).toHaveLength(1);
    const range = ranges[0];
    expect(content.slice(range.start, range.end)).toBe('{{#items}}body{{/items}}');
  });

  it('finds loops with dot-notation variable names', () => {
    const content = '{{#client.addresses}}addr{{/client.addresses}}';
    const ranges = _findTemplateLoopRanges(content);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].variable).toBe('client.addresses');
  });
});

// ---------- resolvePath ----------

describe('resolvePath', () => {
  it('resolves a simple property', () => {
    expect(_resolvePath({ name: 'John' }, 'name')).toBe('John');
  });

  it('resolves a nested property', () => {
    expect(_resolvePath({ client: { name: 'Acme' } }, 'client.name')).toBe('Acme');
  });

  it('resolves an array index', () => {
    const obj = { parties: [{ name: 'Alpha' }, { name: 'Beta' }] };
    expect(_resolvePath(obj, 'parties[0].name')).toBe('Alpha');
    expect(_resolvePath(obj, 'parties[1].name')).toBe('Beta');
  });

  it('returns undefined for a missing path', () => {
    expect(_resolvePath({ a: 1 }, 'b')).toBeUndefined();
    expect(_resolvePath({ a: { b: 1 } }, 'a.c')).toBeUndefined();
  });

  it('returns undefined for null/undefined intermediate values', () => {
    expect(_resolvePath({ a: null }, 'a.b')).toBeUndefined();
    expect(_resolvePath({}, 'x.y.z')).toBeUndefined();
  });

  it('handles the special "." path for current item in loops', () => {
    // With a plain object that has no "." key, returns undefined
    expect(_resolvePath({ name: 'X' }, '.')).toBeUndefined();
    // With an object that has a "." key
    expect(_resolvePath({ '.': 'current' }, '.')).toBe('current');
  });

  it('returns undefined when obj is a primitive', () => {
    expect(_resolvePath('hello' as unknown as Record<string, unknown>, 'length')).toBeUndefined();
  });
});

// ---------- parseArguments ----------

describe('parseArguments', () => {
  const meta = { a: 'alpha', b: 'beta', count: 42 };

  it('resolves variable references from metadata', () => {
    const result = _parseArguments('a, b', meta);
    expect(result).toEqual(['alpha', 'beta']);
  });

  it('handles quoted strings', () => {
    const result = _parseArguments('"hello", \'world\'', meta);
    expect(result).toEqual(['hello', 'world']);
  });

  it('handles numbers', () => {
    const result = _parseArguments('42, 3.14', meta);
    expect(result).toEqual([42, 3.14]);
  });

  it('handles booleans', () => {
    const result = _parseArguments('true, false', meta);
    expect(result).toEqual([true, false]);
  });

  it('handles null and undefined literals', () => {
    const result = _parseArguments('null, undefined', meta);
    expect(result).toEqual([null, undefined]);
  });

  it('handles empty string input', () => {
    expect(_parseArguments('', meta)).toEqual([]);
    expect(_parseArguments('   ', meta)).toEqual([]);
  });

  it('handles nested parentheses without splitting on inner commas', () => {
    // The inner comma should not split the outer argument
    const result = _parseArguments('"prefix", "a,b"', meta);
    expect(result).toEqual(['prefix', 'a,b']);
  });
});

// ---------- resolveHelper ----------

describe('resolveHelper', () => {
  it('returns undefined for non-function expressions', () => {
    expect(_resolveHelper('justAVariable', {})).toBeUndefined();
  });

  it('returns undefined for unknown helper names', () => {
    expect(_resolveHelper('nonExistentHelper(42)', {})).toBeUndefined();
  });

  it('calls a known helper (upper) with resolved arguments', () => {
    // `upper` is a real helper in extensionHelpers
    const result = _resolveHelper('upper("hello")', {});
    expect(result).toBe('HELLO');
  });

  it('calls a known helper (add) with numeric arguments', () => {
    const result = _resolveHelper('add(2, 3)', {});
    expect(result).toBe(5);
  });

  it('resolves variable arguments from metadata before passing to helper', () => {
    const meta = { name: 'world' };
    const result = _resolveHelper('upper(name)', meta);
    expect(result).toBe('WORLD');
  });
});

// ---------- resolveConditional ----------

describe('resolveConditional', () => {
  it('resolves truthy condition to true part', () => {
    const meta = { premium: true };
    expect(_resolveConditional("premium ? 'Yes' : 'No'", meta)).toBe('Yes');
  });

  it('resolves falsy condition to false part', () => {
    const meta = { premium: false };
    expect(_resolveConditional("premium ? 'Yes' : 'No'", meta)).toBe('No');
  });

  it('resolves undefined condition as falsy', () => {
    expect(_resolveConditional("missing ? 'A' : 'B'", {})).toBe('B');
  });

  it('returns undefined for malformed expression without ?', () => {
    expect(_resolveConditional('no ternary here', {})).toBeUndefined();
  });

  it('returns undefined for malformed expression without :', () => {
    expect(_resolveConditional('cond ? only', {})).toBeUndefined();
  });

  it('handles variable references in true/false parts', () => {
    const meta = { active: true, greeting: 'Hello', farewell: 'Bye' };
    expect(_resolveConditional('active ? greeting : farewell', meta)).toBe('Hello');
  });
});

// ---------- parseContentToAST ----------

describe('parseContentToAST', () => {
  // Use unique content strings per test to avoid cache collisions

  it('parses plain text into a single text node', () => {
    const result = parseContentToAST('just plain text here');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('text');
    expect(result.nodes[0].content).toBe('just plain text here');
    expect(result.hasErrors).toBe(false);
  });

  it('parses a variable mixin into a variable node', () => {
    const result = parseContentToAST('Hello {{clientName}}!');
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[0]).toMatchObject({ type: 'text', content: 'Hello ' });
    expect(result.nodes[1]).toMatchObject({ type: 'variable', variable: 'clientName' });
    expect(result.nodes[2]).toMatchObject({ type: 'text', content: '!' });
  });

  it('parses a helper function mixin into a helper node', () => {
    const result = parseContentToAST('Amount: {{formatCurrency(total, "EUR")}}.');
    const helperNode = result.nodes.find(n => n.type === 'helper');
    expect(helperNode).toBeDefined();
    expect(helperNode!.variable).toBe('formatCurrency(total, "EUR")');
  });

  it('parses a conditional mixin into a conditional node', () => {
    const result = parseContentToAST('Status: {{active ? "on" : "off"}} end');
    const condNode = result.nodes.find(n => n.type === 'conditional');
    expect(condNode).toBeDefined();
    expect(condNode!.variable).toBe('active ? "on" : "off"');
  });

  it('treats loop patterns as text nodes', () => {
    const result = parseContentToAST('{{#items}}item{{/items}}');
    // The whole thing is inside a loop range so inner {{}} are skipped,
    // and the outer loop tags become text
    const types = result.nodes.map(n => n.type);
    expect(types.every(t => t === 'text')).toBe(true);
  });

  it('treats empty {{}} as plain text (regex requires content inside braces)', () => {
    const result = parseContentToAST('before {{}} after empty braces');
    expect(result.hasErrors).toBe(false);
    // {{}} is not matched by the mixin regex, so it becomes part of a text node
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('text');
  });

  it('creates an error node for whitespace-only mixin {{ }}', () => {
    const result = parseContentToAST('before {{ }} after whitespace mixin');
    expect(result.hasErrors).toBe(true);
    const errorNode = result.nodes.find(n => n.hasError);
    expect(errorNode).toBeDefined();
    expect(errorNode!.errorMessage).toBe('Empty or malformed mixin');
  });

  it('produces correct node sequence for mixed content', () => {
    const result = parseContentToAST('Dear {{recipientName}}, total: {{formatCurrency(amt)}}.');
    const types = result.nodes.map(n => n.type);
    expect(types).toEqual(['text', 'variable', 'text', 'helper', 'text']);
  });

  it('records correct positions for nodes', () => {
    const content = 'A{{varX}}B';
    const result = parseContentToAST(content);
    expect(result.nodes[0]).toMatchObject({ content: 'A', position: { start: 0, end: 1 } });
    expect(result.nodes[1]).toMatchObject({ content: '{{varX}}', position: { start: 1, end: 9 } });
    expect(result.nodes[2]).toMatchObject({ content: 'B', position: { start: 9, end: 10 } });
  });
});

// ---------- processMixinAST ----------

describe('processMixinAST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes text nodes through unchanged', () => {
    const nodes = [
      { type: 'text' as const, content: 'hello world', position: { start: 0, end: 11 } },
    ];
    expect(processMixinAST(nodes, {})).toBe('hello world');
  });

  it('resolves variable nodes from metadata', () => {
    const nodes = [
      { type: 'variable' as const, content: '{{city}}', variable: 'city', position: { start: 0, end: 8 } },
    ];
    expect(processMixinAST(nodes, { city: 'Berlin' })).toBe('Berlin');
    expect(mockedFieldTracker.trackField).toHaveBeenCalledWith('city', expect.objectContaining({ value: 'Berlin' }));
  });

  it('returns original {{var}} syntax for missing values', () => {
    const nodes = [
      { type: 'variable' as const, content: '{{missing}}', variable: 'missing', position: { start: 0, end: 11 } },
    ];
    expect(processMixinAST(nodes, {})).toBe('{{missing}}');
    expect(mockedFieldTracker.trackField).toHaveBeenCalledWith('missing', expect.objectContaining({ value: undefined }));
  });

  it('returns original content when noMixins is true', () => {
    const nodes = [
      { type: 'text' as const, content: 'Dear ', position: { start: 0, end: 5 } },
      { type: 'variable' as const, content: '{{name}}', variable: 'name', position: { start: 5, end: 13 } },
    ];
    expect(processMixinAST(nodes, { name: 'Test' }, { noMixins: true })).toBe('Dear {{name}}');
  });

  it('resolves helper nodes via extensionHelpers', () => {
    const nodes = [
      {
        type: 'helper' as const,
        content: '{{upper("test")}}',
        variable: 'upper("test")',
        position: { start: 0, end: 18 },
      },
    ];
    expect(processMixinAST(nodes, {})).toBe('TEST');
  });

  it('resolves conditional nodes', () => {
    const nodes = [
      {
        type: 'conditional' as const,
        content: "{{flag ? 'yes' : 'no'}}",
        variable: "flag ? 'yes' : 'no'",
        position: { start: 0, end: 23 },
      },
    ];
    expect(processMixinAST(nodes, { flag: true })).toBe('yes');
    expect(processMixinAST(nodes, { flag: false })).toBe('no');
  });

  it('treats bracket values in metadata as missing', () => {
    const nodes = [
      { type: 'variable' as const, content: '{{company}}', variable: 'company', position: { start: 0, end: 11 } },
    ];
    expect(processMixinAST(nodes, { company: '[COMPANY NAME]' })).toBe('{{company}}');
  });

  it('wraps resolved values in spans when enableFieldTrackingInMarkdown is set', () => {
    const nodes = [
      { type: 'variable' as const, content: '{{title}}', variable: 'title', position: { start: 0, end: 9 } },
    ];
    const result = processMixinAST(nodes, { title: 'Doc' }, { enableFieldTrackingInMarkdown: true });
    expect(result).toContain('imported-value');
    expect(result).toContain('Doc');
  });
});

describe('unescapeBracketLiteral', () => {
  it('returns null for a plain string', () => {
    expect(unescapeBracketLiteral('hello')).toBeNull();
  });

  it('returns null for a bracket placeholder [value] without backslash-escaping', () => {
    expect(unescapeBracketLiteral('[MyCompany]')).toBeNull();
  });

  it('returns unescaped form for \\[value\\] pattern', () => {
    expect(unescapeBracketLiteral('\\[MyCompany\\]')).toBe('[MyCompany]');
  });

  it('preserves inner content with spaces and special chars', () => {
    expect(unescapeBracketLiteral('\\[Client Name Here\\]')).toBe('[Client Name Here]');
  });

  it('returns null when only opening bracket is escaped', () => {
    expect(unescapeBracketLiteral('\\[value]')).toBeNull();
  });

  it('returns null when only closing bracket is escaped', () => {
    expect(unescapeBracketLiteral('[value\\]')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(unescapeBracketLiteral('')).toBeNull();
  });
});
