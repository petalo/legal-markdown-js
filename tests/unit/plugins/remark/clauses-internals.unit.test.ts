/**
 * Unit Tests for clauses.ts internal functions
 *
 * Tests the internal helper functions that power conditional clause processing.
 * These are exported with underscore-prefixed names for testing only.
 */

import type { Text } from 'mdast';
import {
  _processTextNode as processTextNode,
  _processHtmlNode as processHtmlNode,
  _extractConditionalBlocks as extractConditionalBlocks,
  _evaluateConditionalBlock as evaluateConditionalBlock,
  _sanitizeCondition as sanitizeCondition,
  _evaluateSimpleCondition as evaluateSimpleCondition,
  _evaluateBooleanExpression as evaluateBooleanExpression,
  _evaluateComparisonExpression as evaluateComparisonExpression,
  _processArrayLoop as processArrayLoop,
} from '../../../../src/plugins/remark/clauses';

// Mock field tracking to avoid side effects
vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: vi.fn(),
  },
}));

vi.mock('../../../../src/extensions/tracking/field-span', () => ({
  fieldSpan: vi.fn(
    (name: string, value: string, status: string) =>
      `<span class="legal-field" data-field="${name}" data-status="${status}">${value}</span>`
  ),
}));

// ---------------------------------------------------------------------------
// sanitizeCondition
// ---------------------------------------------------------------------------
describe('sanitizeCondition', () => {
  it('returns the condition string for valid input', () => {
    expect(sanitizeCondition('hasWarranty')).toBe('hasWarranty');
    expect(sanitizeCondition('jurisdiction == "US"')).toBe('jurisdiction == "US"');
    expect(sanitizeCondition('count > 5')).toBe('count > 5');
  });

  it('returns null for conditions containing HTML tags', () => {
    expect(sanitizeCondition('<script>alert(1)</script>')).toBeNull();
    expect(sanitizeCondition('foo <img src=x>')).toBeNull();
  });

  it('returns null for conditions with dangerous keywords', () => {
    expect(sanitizeCondition('eval("bad")')).toBeNull();
    expect(sanitizeCondition('constructor.prototype')).toBeNull();
    expect(sanitizeCondition('some_function_name')).toBeNull();
    expect(sanitizeCondition('Script injection')).toBeNull();
  });

  it('returns null for conditions with disallowed characters', () => {
    expect(sanitizeCondition('foo;bar')).toBeNull();
    expect(sanitizeCondition('a + b')).toBeNull();
    expect(sanitizeCondition('foo$bar')).toBeNull();
  });

  it('allows @ for context variables', () => {
    expect(sanitizeCondition('@index == 0')).toBe('@index == 0');
    expect(sanitizeCondition('@first')).toBe('@first');
  });
});

// ---------------------------------------------------------------------------
// evaluateSimpleCondition
// ---------------------------------------------------------------------------
describe('evaluateSimpleCondition', () => {
  it('returns true for truthy metadata values', () => {
    expect(evaluateSimpleCondition('hasWarranty', { hasWarranty: true })).toBe(true);
    expect(evaluateSimpleCondition('name', { name: 'Alice' })).toBe(true);
    expect(evaluateSimpleCondition('count', { count: 42 })).toBe(true);
  });

  it('returns false for falsy or missing values', () => {
    expect(evaluateSimpleCondition('hasWarranty', { hasWarranty: false })).toBe(false);
    expect(evaluateSimpleCondition('missing', {})).toBe(false);
    expect(evaluateSimpleCondition('empty', { empty: '' })).toBe(false);
    expect(evaluateSimpleCondition('zero', { zero: 0 })).toBe(false);
  });

  it('handles nested property access via dot notation', () => {
    expect(evaluateSimpleCondition('client.name', { client: { name: 'Bob' } })).toBe(true);
    expect(evaluateSimpleCondition('client.name', { client: { name: '' } })).toBe(false);
    expect(evaluateSimpleCondition('a.b.c', { a: { b: { c: true } } })).toBe(true);
  });

  it('delegates to evaluateBooleanExpression for && / ||', () => {
    expect(evaluateSimpleCondition('a && b', { a: true, b: true })).toBe(true);
    expect(evaluateSimpleCondition('a || b', { a: false, b: true })).toBe(true);
  });

  it('delegates to evaluateComparisonExpression for comparison operators', () => {
    expect(evaluateSimpleCondition('x == "yes"', { x: 'yes' })).toBe(true);
    expect(evaluateSimpleCondition('x != "no"', { x: 'yes' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluateBooleanExpression
// ---------------------------------------------------------------------------
describe('evaluateBooleanExpression', () => {
  it('evaluates AND expressions', () => {
    expect(evaluateBooleanExpression('a && b', { a: true, b: true })).toBe(true);
    expect(evaluateBooleanExpression('a && b', { a: true, b: false })).toBe(false);
    expect(evaluateBooleanExpression('a && b && c', { a: true, b: true, c: true })).toBe(true);
    expect(evaluateBooleanExpression('a && b && c', { a: true, b: true, c: false })).toBe(false);
  });

  it('evaluates OR expressions', () => {
    expect(evaluateBooleanExpression('a || b', { a: false, b: true })).toBe(true);
    expect(evaluateBooleanExpression('a || b', { a: false, b: false })).toBe(false);
  });

  it('handles mixed AND/OR with correct precedence (AND binds tighter)', () => {
    // "a || b && c" => a || (b && c)
    // a=false, b=true, c=true => false || true => true
    expect(evaluateBooleanExpression('a || b && c', { a: false, b: true, c: true })).toBe(true);
    // a=false, b=true, c=false => false || false => false
    expect(evaluateBooleanExpression('a || b && c', { a: false, b: true, c: false })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evaluateComparisonExpression
// ---------------------------------------------------------------------------
describe('evaluateComparisonExpression', () => {
  it('evaluates == operator', () => {
    expect(evaluateComparisonExpression('jurisdiction == "US"', { jurisdiction: 'US' })).toBe(true);
    expect(evaluateComparisonExpression('jurisdiction == "UK"', { jurisdiction: 'US' })).toBe(
      false
    );
  });

  it('evaluates != operator', () => {
    expect(evaluateComparisonExpression('status != "draft"', { status: 'final' })).toBe(true);
    expect(evaluateComparisonExpression('status != "final"', { status: 'final' })).toBe(false);
  });

  it('evaluates > and < operators with numbers', () => {
    expect(evaluateComparisonExpression('count > 5', { count: 10 })).toBe(true);
    expect(evaluateComparisonExpression('count > 5', { count: 3 })).toBe(false);
    expect(evaluateComparisonExpression('count < 5', { count: 3 })).toBe(true);
    expect(evaluateComparisonExpression('count < 5', { count: 10 })).toBe(false);
  });

  it('evaluates >= and <= operators', () => {
    expect(evaluateComparisonExpression('count >= 5', { count: 5 })).toBe(true);
    expect(evaluateComparisonExpression('count >= 5', { count: 4 })).toBe(false);
    expect(evaluateComparisonExpression('count <= 5', { count: 5 })).toBe(true);
    expect(evaluateComparisonExpression('count <= 5', { count: 6 })).toBe(false);
  });

  it('handles string literal comparisons with quotes', () => {
    expect(evaluateComparisonExpression("type == 'contract'", { type: 'contract' })).toBe(true);
  });

  it('handles variable-to-variable comparison', () => {
    expect(evaluateComparisonExpression('a == b', { a: 'same', b: 'same' })).toBe(true);
    expect(evaluateComparisonExpression('a == b', { a: 'x', b: 'y' })).toBe(false);
  });

  it('returns false when operator or sides are missing', () => {
    expect(evaluateComparisonExpression('', {})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractConditionalBlocks
// ---------------------------------------------------------------------------
describe('extractConditionalBlocks', () => {
  it('returns empty array for text with no conditionals', () => {
    expect(extractConditionalBlocks('Hello world')).toEqual([]);
    expect(extractConditionalBlocks('')).toEqual([]);
  });

  it('extracts simple if/endif blocks', () => {
    const text = '{{#if hasWarranty}}warranty text{{/if}}';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].condition).toBe('if hasWarranty');
    expect(blocks[0].content).toBe('warranty text');
    expect(blocks[0].elseContent).toBeUndefined();
    expect(blocks[0].start).toBe(0);
    expect(blocks[0].end).toBe(text.length);
  });

  it('extracts if/else/endif blocks', () => {
    const text = '{{#if active}}yes{{else}}no{{/if}}';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('yes');
    expect(blocks[0].elseContent).toBe('no');
  });

  it('extracts simple variable syntax {{#var}}...{{/var}}', () => {
    const text = '{{#showSection}}Section content{{/showSection}}';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].condition).toBe('showSection');
    expect(blocks[0].content).toBe('Section content');
  });

  it('extracts bracket syntax [content]{condition}', () => {
    const text = '[warranty clause]{hasWarranty}';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].condition).toBe('hasWarranty');
    expect(blocks[0].content).toBe('warranty clause');
  });

  it('extracts original bracket syntax [{{condition}}content]', () => {
    const text = '[{{hasWarranty}}warranty clause]';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].condition).toBe('hasWarranty');
    expect(blocks[0].content).toBe('warranty clause');
  });

  it('extracts multiple blocks sorted by position', () => {
    const text = '{{#if a}}A{{/if}} middle {{#if b}}B{{/if}}';
    const blocks = extractConditionalBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].content).toBe('A');
    expect(blocks[1].content).toBe('B');
    expect(blocks[0].start).toBeLessThan(blocks[1].start);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditionalBlock
// ---------------------------------------------------------------------------
describe('evaluateConditionalBlock', () => {
  it('returns content when condition is true (if syntax)', () => {
    const block = { condition: 'if hasWarranty', content: 'yes', elseContent: undefined, start: 0, end: 10 };
    expect(evaluateConditionalBlock(block, { hasWarranty: true }, false, false)).toBe('yes');
  });

  it('returns elseContent when condition is false', () => {
    const block = { condition: 'if hasWarranty', content: 'yes', elseContent: 'no', start: 0, end: 10 };
    expect(evaluateConditionalBlock(block, { hasWarranty: false }, false, false)).toBe('no');
  });

  it('returns empty string when condition is false with no else', () => {
    const block = { condition: 'if hasWarranty', content: 'yes', elseContent: undefined, start: 0, end: 10 };
    expect(evaluateConditionalBlock(block, { hasWarranty: false }, false, false)).toBe('');
  });

  it('handles bare "if" condition (empty) by returning content on error', () => {
    const block = { condition: 'if', content: 'fallback', elseContent: undefined, start: 0, end: 10 };
    // Empty condition throws, catch returns content
    expect(evaluateConditionalBlock(block, {}, false, false)).toBe('fallback');
  });

  it('processes simple variable syntax as boolean conditional', () => {
    const block = { condition: 'showIt', content: 'shown', elseContent: undefined, start: 0, end: 10 };
    expect(evaluateConditionalBlock(block, { showIt: true }, false, false)).toBe('shown');
    expect(evaluateConditionalBlock(block, { showIt: false }, false, false)).toBe('');
  });

  it('processes array value as a loop', () => {
    const block = {
      condition: 'items',
      content: '{{name}} ',
      elseContent: undefined,
      start: 0,
      end: 10,
    };
    const metadata = { items: [{ name: 'A' }, { name: 'B' }] };
    const result = evaluateConditionalBlock(block, metadata, false, false);
    expect(result).toBe('A B ');
  });
});

// ---------------------------------------------------------------------------
// processTextNode
// ---------------------------------------------------------------------------
describe('processTextNode', () => {
  it('replaces conditional block in text node value', () => {
    const node: Text = { type: 'text', value: 'Before {{#if show}}visible{{/if}} after' };
    processTextNode(node, { show: true }, false, false);
    expect(node.value).toBe('Before visible after');
  });

  it('removes conditional block when condition is false', () => {
    const node: Text = { type: 'text', value: 'Before {{#if show}}visible{{/if}} after' };
    processTextNode(node, { show: false }, false, false);
    expect(node.value).toBe('Before  after');
  });

  it('does not modify text with no conditionals', () => {
    const node: Text = { type: 'text', value: 'No conditionals here' };
    processTextNode(node, {}, false, false);
    expect(node.value).toBe('No conditionals here');
  });

  it('handles multiple conditional blocks', () => {
    const node: Text = {
      type: 'text',
      value: '{{#if a}}A{{/if}} and {{#if b}}B{{/if}}',
    };
    processTextNode(node, { a: true, b: false }, false, false);
    expect(node.value).toBe('A and ');
  });
});

// ---------------------------------------------------------------------------
// processHtmlNode
// ---------------------------------------------------------------------------
describe('processHtmlNode', () => {
  it('replaces conditional block in HTML node value', () => {
    const node = { value: '<div>{{#if show}}content{{/if}}</div>' };
    processHtmlNode(node, { show: true }, false, false);
    expect(node.value).toBe('<div>content</div>');
  });

  it('does not modify HTML with no conditionals', () => {
    const node = { value: '<p>Plain HTML</p>' };
    processHtmlNode(node, {}, false, false);
    expect(node.value).toBe('<p>Plain HTML</p>');
  });

  it('removes conditional block when condition is false', () => {
    const node = { value: '<div>{{#if show}}content{{/if}}</div>' };
    processHtmlNode(node, { show: false }, false, false);
    expect(node.value).toBe('<div></div>');
  });
});

// ---------------------------------------------------------------------------
// processArrayLoop
// ---------------------------------------------------------------------------
describe('processArrayLoop', () => {
  it('expands loop over array of objects with template variables', () => {
    const result = processArrayLoop(
      'items',
      '{{name}}: {{price}}\n',
      [
        { name: 'Widget', price: 10 },
        { name: 'Gadget', price: 20 },
      ],
      {},
      false,
      false
    );
    expect(result).toBe('Widget: 10\nGadget: 20\n');
  });

  it('returns empty string for empty array', () => {
    const result = processArrayLoop('items', '{{name}}', [], {}, false, false);
    expect(result).toBe('');
  });

  it('provides @index, @first, @last, @total special variables', () => {
    const result = processArrayLoop(
      'items',
      '{{@index}}-{{@first}}-{{@last}}-{{@total}} ',
      [{ x: 1 }, { x: 2 }, { x: 3 }],
      {},
      false,
      false
    );
    expect(result).toBe('0-true-false-3 1-false-false-3 2-false-true-3 ');
  });

  it('preserves unresolved template variables', () => {
    const result = processArrayLoop('items', '{{unknown}}', [{ a: 1 }], {}, false, false);
    expect(result).toBe('{{unknown}}');
  });

  it('can access metadata from parent scope', () => {
    const result = processArrayLoop(
      'items',
      '{{title}}: {{name}}',
      [{ name: 'A' }],
      { title: 'Doc' },
      false,
      false
    );
    expect(result).toBe('Doc: A');
  });

  it('handles primitive array items (non-object)', () => {
    // When items are primitives, they cannot be spread into metadata as properties,
    // so template variables referring to item properties remain unresolved
    const result = processArrayLoop('tags', '{{@index}} ', ['a', 'b'], {}, false, false);
    expect(result).toBe('0 1 ');
  });

  it('handles nested conditionals inside loop body', () => {
    const result = processArrayLoop(
      'items',
      '{{#if active}}YES{{/if}}',
      [{ active: true }, { active: false }],
      {},
      false,
      false
    );
    expect(result).toBe('YES');
  });
});
