import {
  _stripOuterParentheses as stripOuterParentheses,
  _splitAtTopLevelOperator as splitAtTopLevelOperator,
  _preprocessConditionalExpression as preprocessConditionalExpression,
  _preprocessConditionalComparisons as preprocessConditionalComparisons,
  _preprocessSimpleVariableMixins as preprocessSimpleVariableMixins,
  _applyFieldTrackingToOutput as applyFieldTrackingToOutput,
  _registerVariableFallbackHelper as registerVariableFallbackHelper,
  _processWithHandlebars as processWithHandlebars,
} from '@extensions/template-loops';
import { fieldTracker } from '@extensions/tracking/field-tracker';

vi.mock('@extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// stripOuterParentheses
// ---------------------------------------------------------------------------
describe('stripOuterParentheses', () => {
  it('returns string without parens unchanged', () => {
    expect(stripOuterParentheses('a == b')).toBe('a == b');
  });

  it('strips single balanced wrapper', () => {
    expect(stripOuterParentheses('(a == b)')).toBe('a == b');
  });

  it('strips multiple layers', () => {
    expect(stripOuterParentheses('((a == b))')).toBe('a == b');
  });

  it('does NOT strip non-wrapping parens', () => {
    expect(stripOuterParentheses('(a) && (b)')).toBe('(a) && (b)');
  });

  it('handles quoted strings with parens', () => {
    expect(stripOuterParentheses("('hello')")).toBe("'hello'");
  });

  it('returns empty string for empty input', () => {
    expect(stripOuterParentheses('')).toBe('');
  });

  it('handles whitespace around parens', () => {
    expect(stripOuterParentheses('  ( x )  ')).toBe('x');
  });
});

// ---------------------------------------------------------------------------
// splitAtTopLevelOperator
// ---------------------------------------------------------------------------
describe('splitAtTopLevelOperator', () => {
  it('splits at ==', () => {
    expect(splitAtTopLevelOperator('a == b', '==')).toEqual(['a', 'b']);
  });

  it('splits at ||', () => {
    expect(splitAtTopLevelOperator('x || y', '||')).toEqual(['x', 'y']);
  });

  it('returns null when operator not found', () => {
    expect(splitAtTopLevelOperator('a + b', '==')).toBeNull();
  });

  it('returns null when left side is empty', () => {
    expect(splitAtTopLevelOperator('== b', '==')).toBeNull();
  });

  it('returns null when right side is empty', () => {
    expect(splitAtTopLevelOperator('a ==', '==')).toBeNull();
  });

  it('ignores operator inside parens', () => {
    expect(splitAtTopLevelOperator('(a == b) && c', '==')).toBeNull();
  });

  it('ignores operator inside single quotes', () => {
    const result = splitAtTopLevelOperator("'a == b' == c", '==');
    expect(result).toEqual(["'a == b'", 'c']);
  });

  it('ignores operator inside double quotes', () => {
    const result = splitAtTopLevelOperator('"a == b" == c', '==');
    expect(result).toEqual(['"a == b"', 'c']);
  });
});

// ---------------------------------------------------------------------------
// preprocessConditionalExpression
// ---------------------------------------------------------------------------
describe('preprocessConditionalExpression', () => {
  it('converts a == b', () => {
    expect(preprocessConditionalExpression('a == b')).toBe('(eq a b)');
  });

  it('converts a != b', () => {
    expect(preprocessConditionalExpression('a != b')).toBe('(neq a b)');
  });

  it('converts a > b', () => {
    expect(preprocessConditionalExpression('a > b')).toBe('(gt a b)');
  });

  it('converts a >= b', () => {
    expect(preprocessConditionalExpression('a >= b')).toBe('(gte a b)');
  });

  it('converts a < b', () => {
    expect(preprocessConditionalExpression('a < b')).toBe('(lt a b)');
  });

  it('converts a <= b', () => {
    expect(preprocessConditionalExpression('a <= b')).toBe('(lte a b)');
  });

  it('converts a || b', () => {
    expect(preprocessConditionalExpression('a || b')).toBe('(or a b)');
  });

  it('converts a && b', () => {
    expect(preprocessConditionalExpression('a && b')).toBe('(and a b)');
  });

  it('converts !flag (negation)', () => {
    expect(preprocessConditionalExpression('!flag')).toBe('(not flag)');
  });

  it('returns null for simple variable (no operator)', () => {
    expect(preprocessConditionalExpression('flag')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(preprocessConditionalExpression('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// preprocessConditionalComparisons
// ---------------------------------------------------------------------------
describe('preprocessConditionalComparisons', () => {
  it('transforms {{#if a == b}}', () => {
    expect(preprocessConditionalComparisons('{{#if a == b}}')).toBe('{{#if (eq a b)}}');
  });

  it('transforms {{#unless x > 5}}', () => {
    expect(preprocessConditionalComparisons('{{#unless x > 5}}')).toBe(
      '{{#unless (gt x 5)}}'
    );
  });

  it('leaves {{#if flag}} unchanged (no comparison)', () => {
    expect(preprocessConditionalComparisons('{{#if flag}}')).toBe('{{#if flag}}');
  });

  it('leaves already-parenthesized expressions unchanged', () => {
    expect(preprocessConditionalComparisons('{{#if (eq a b)}}')).toBe('{{#if (eq a b)}}');
  });

  it('transforms else if comparisons', () => {
    expect(preprocessConditionalComparisons('{{else if x != y}}')).toBe(
      '{{else if (neq x y)}}'
    );
  });

  it('handles multiple comparisons in one string', () => {
    const input = '{{#if a == b}}yes{{else if x > 1}}no{{/if}}';
    const result = preprocessConditionalComparisons(input);
    expect(result).toContain('{{#if (eq a b)}}');
    expect(result).toContain('{{else if (gt x 1)}}');
  });
});

// ---------------------------------------------------------------------------
// preprocessSimpleVariableMixins
// ---------------------------------------------------------------------------
describe('preprocessSimpleVariableMixins', () => {
  it('converts {{name}} to {{__lmVar "name"}}', () => {
    expect(preprocessSimpleVariableMixins('{{name}}')).toBe('{{__lmVar "name"}}');
  });

  it('converts dotted paths: {{client.name}}', () => {
    expect(preprocessSimpleVariableMixins('{{client.name}}')).toBe(
      '{{__lmVar "client.name"}}'
    );
  });

  it('skips block helpers: {{#each items}}', () => {
    expect(preprocessSimpleVariableMixins('{{#each items}}')).toBe('{{#each items}}');
  });

  it('skips closing tags: {{/each}}', () => {
    expect(preprocessSimpleVariableMixins('{{/each}}')).toBe('{{/each}}');
  });

  it('skips {{else}}', () => {
    expect(preprocessSimpleVariableMixins('{{else}}')).toBe('{{else}}');
  });

  it('skips @ prefix: {{@index}}', () => {
    expect(preprocessSimpleVariableMixins('{{@index}}')).toBe('{{@index}}');
  });

  it('skips expressions with spaces: {{helper arg}}', () => {
    expect(preprocessSimpleVariableMixins('{{helper arg}}')).toBe('{{helper arg}}');
  });

  it('converts {{this}} to {{__lmDot}} for field tracking', () => {
    expect(preprocessSimpleVariableMixins('{{this}}')).toBe('{{__lmDot}}');
  });

  it('converts {{.}} to {{__lmDot}} for field tracking', () => {
    expect(preprocessSimpleVariableMixins('{{.}}')).toBe('{{__lmDot}}');
  });

  it('skips partial syntax: {{> partial}}', () => {
    expect(preprocessSimpleVariableMixins('{{> partial}}')).toBe('{{> partial}}');
  });
});

// ---------------------------------------------------------------------------
// applyFieldTrackingToOutput
// ---------------------------------------------------------------------------
describe('applyFieldTrackingToOutput', () => {
  beforeEach(() => {
    vi.mocked(fieldTracker.trackField).mockClear();
  });

  it('calls trackField for string metadata values found in content', () => {
    applyFieldTrackingToOutput('Hello World', { greeting: 'Hello' });

    expect(fieldTracker.trackField).toHaveBeenCalledWith('greeting', {
      value: 'Hello',
      hasLogic: false,
    });
  });

  it('calls trackField for number metadata values found in content', () => {
    applyFieldTrackingToOutput('Total: 42', { amount: 42 });

    expect(fieldTracker.trackField).toHaveBeenCalledWith('amount', {
      value: 42,
      hasLogic: false,
    });
  });

  it('does not track values not present in content', () => {
    applyFieldTrackingToOutput('No match here', { missing: 'xyz' });

    expect(fieldTracker.trackField).not.toHaveBeenCalled();
  });

  it('only tracks string and number values (skips arrays, objects, booleans)', () => {
    applyFieldTrackingToOutput('true [1,2] {a:1}', {
      flag: true,
      items: [1, 2],
      nested: { a: 1 },
    });

    expect(fieldTracker.trackField).not.toHaveBeenCalled();
  });

  it('returns the content unchanged', () => {
    const content = 'Some content with Alice';
    const result = applyFieldTrackingToOutput(content, { name: 'Alice' });
    expect(result).toBe(content);
  });

  it('tracks HTML-escaped attribute values', () => {
    applyFieldTrackingToOutput('value=&quot;test&amp;co&quot;', {
      company: 'test&co',
    });

    expect(fieldTracker.trackField).toHaveBeenCalledWith('company', {
      value: 'test&co',
      hasLogic: false,
    });
  });
});

// ---------------------------------------------------------------------------
// registerVariableFallbackHelper
// ---------------------------------------------------------------------------
describe('registerVariableFallbackHelper', () => {
  it('does not throw when called multiple times (idempotent)', () => {
    expect(() => registerVariableFallbackHelper()).not.toThrow();
    expect(() => registerVariableFallbackHelper()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// processWithHandlebars
// ---------------------------------------------------------------------------
describe('processWithHandlebars', () => {
  it('renders simple variable substitution via #each context', () => {
    // Direct top-level variables go through __lmVar which preserves them when this===root.
    // Variables resolve inside #each blocks where context differs from root.
    const content = '{{#each people}}{{name}} {{/each}}';
    const result = processWithHandlebars(
      content,
      { people: [{ name: 'Alice' }, { name: 'Bob' }] },
      undefined,
      false
    );
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('renders conditional blocks', () => {
    const content = '{{#if show}}visible{{/if}}';
    const result = processWithHandlebars(content, { show: true }, undefined, false);
    expect(result).toBe('visible');
  });

  it('renders conditional comparisons', () => {
    const content = '{{#if status == "active"}}yes{{/if}}';
    const result = processWithHandlebars(content, { status: 'active' }, undefined, false);
    expect(result).toBe('yes');
  });

  it('preserves unreferenced variables as mustache tags', () => {
    const result = processWithHandlebars('Hello {{missing}}!', {}, undefined, false);
    expect(result).toBe('Hello {{missing}}!');
  });

  it('provides loop context variables (@index, @first, @last)', () => {
    const content = '{{#each items}}{{@index}}:{{this}} {{/each}}';
    const result = processWithHandlebars(
      content,
      { items: ['Apple', 'Banana'] },
      undefined,
      false
    );
    expect(result).toContain('0:Apple');
    expect(result).toContain('1:Banana');
  });
});

// ---------------------------------------------------------------------------
// processWithHandlebars - field tracking for {{.}} / {{this}} in loops
// ---------------------------------------------------------------------------
describe('processWithHandlebars – {{.}} field tracking', () => {
  it('wraps filled array items with imported-value span when tracking enabled', () => {
    const content = '{{#each items}}{{.}}{{/each}}';
    const result = processWithHandlebars(
      content,
      { items: ['Alpha', 'Beta'] },
      undefined,
      true
    );
    expect(result).toContain('class="legal-field imported-value"');
    expect(result).toContain('Alpha');
    expect(result).toContain('Beta');
  });

  it('wraps empty array items with missing-value span when tracking enabled', () => {
    const content = '{{#each items}}{{.}}{{/each}}';
    const result = processWithHandlebars(content, { items: ['', ''] }, undefined, true);
    expect(result).toContain('class="legal-field missing-value"');
  });

  it('wraps mixed empty/filled items correctly when tracking enabled', () => {
    const content = '{{#each items}}{{.}}|{{/each}}';
    const result = processWithHandlebars(
      content,
      { items: ['', 'Filled', ''] },
      undefined,
      true
    );
    expect(result).toContain('class="legal-field missing-value"');
    expect(result).toContain('class="legal-field imported-value"');
    expect(result).toContain('Filled');
  });

  it('returns raw values without spans when tracking disabled', () => {
    const content = '{{#each items}}{{.}}{{/each}}';
    const result = processWithHandlebars(
      content,
      { items: ['Alpha', ''] },
      undefined,
      false
    );
    expect(result).not.toContain('legal-field');
    expect(result).not.toContain('<span');
    expect(result).toContain('Alpha');
  });

  it('handles {{this}} the same as {{.}} when tracking enabled', () => {
    const content = '{{#each items}}{{this}}{{/each}}';
    const result = processWithHandlebars(
      content,
      { items: ['Workers compensation', ''] },
      undefined,
      true
    );
    expect(result).toContain('class="legal-field imported-value"');
    expect(result).toContain('class="legal-field missing-value"');
    expect(result).toContain('Workers compensation');
  });
});
