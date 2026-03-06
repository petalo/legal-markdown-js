/**
 * Unit tests for internal functions in string-transformations.ts
 *
 * Tests normalizeFieldPatterns and preprocessOptionalClauses directly.
 */

import {
  _normalizeFieldPatterns as normalizeFieldPatterns,
  _preprocessOptionalClauses as preprocessOptionalClauses,
} from '../../../../src/core/pipeline/string-transformations';

// ---------------------------------------------------------------------------
// normalizeFieldPatterns
// ---------------------------------------------------------------------------
describe('normalizeFieldPatterns', () => {
  it('returns content unchanged when no field patterns are provided', () => {
    const { content, mappings } = normalizeFieldPatterns('Hello {{name}}', []);
    expect(content).toBe('Hello {{name}}');
    expect(mappings.size).toBe(0);
  });

  it('returns content unchanged for empty input', () => {
    const { content, mappings } = normalizeFieldPatterns('', []);
    expect(content).toBe('');
    expect(mappings.size).toBe(0);
  });

  it('normalizes <<field>> patterns to {{field}}', () => {
    const { content, mappings } = normalizeFieldPatterns(
      'Hello <<name>>, welcome to <<place>>',
      ['<<(.+?)>>']
    );
    expect(content).toBe('Hello {{name}}, welcome to {{place}}');
    expect(mappings.size).toBe(2);
    expect(mappings.get('{{name}}')).toBe('<<name>>');
    expect(mappings.get('{{place}}')).toBe('<<place>>');
  });

  it('normalizes |field| patterns to {{field}}', () => {
    const { content, mappings } = normalizeFieldPatterns('Dear |recipient|', [
      '\\|(.+?)\\|',
    ]);
    expect(content).toBe('Dear {{recipient}}');
    expect(mappings.size).toBe(1);
  });

  it('skips the default {{(.+?)}} pattern', () => {
    const { content, mappings } = normalizeFieldPatterns('Hello {{name}}', [
      '{{(.+?)}}',
    ]);
    expect(content).toBe('Hello {{name}}');
    expect(mappings.size).toBe(0);
  });

  it('handles multiple custom patterns at once', () => {
    const { content } = normalizeFieldPatterns(
      '<<a>> and |b| and {{c}}',
      ['<<(.+?)>>', '\\|(.+?)\\|']
    );
    expect(content).toBe('{{a}} and {{b}} and {{c}}');
  });

  it('handles content with no matching patterns', () => {
    const { content, mappings } = normalizeFieldPatterns(
      'No patterns here',
      ['<<(.+?)>>']
    );
    expect(content).toBe('No patterns here');
    expect(mappings.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// preprocessOptionalClauses
// ---------------------------------------------------------------------------
describe('preprocessOptionalClauses', () => {
  it('includes clause content when condition is truthy', () => {
    const result = preprocessOptionalClauses(
      '[Optional content]{showThis}',
      { showThis: true }
    );
    expect(result).toBe('Optional content');
  });

  it('removes clause when condition is falsy', () => {
    const result = preprocessOptionalClauses(
      '[Optional content]{showThis}',
      { showThis: false }
    );
    expect(result).toBe('');
  });

  it('removes clause when condition key is missing from metadata', () => {
    const result = preprocessOptionalClauses(
      '[Optional content]{missingKey}',
      {}
    );
    expect(result).toBe('');
  });

  it('handles multiple clauses in the same content', () => {
    const result = preprocessOptionalClauses(
      '[First]{a} and [Second]{b}',
      { a: true, b: false }
    );
    expect(result).toBe('First and ');
  });

  it('handles multi-line clause content', () => {
    const input = '[Line one\nLine two]{include}';
    const result = preprocessOptionalClauses(input, { include: true });
    expect(result).toBe('Line one\nLine two');
  });

  it('preserves surrounding content', () => {
    const result = preprocessOptionalClauses(
      'Before [clause]{show} after',
      { show: true }
    );
    expect(result).toBe('Before clause after');
  });

  it('treats truthy string values as included', () => {
    const result = preprocessOptionalClauses(
      '[Content]{flag}',
      { flag: 'yes' }
    );
    expect(result).toBe('Content');
  });

  it('treats empty string as falsy (removed)', () => {
    const result = preprocessOptionalClauses(
      '[Content]{flag}',
      { flag: '' }
    );
    expect(result).toBe('');
  });

  it('treats zero as falsy (removed)', () => {
    const result = preprocessOptionalClauses(
      '[Content]{flag}',
      { flag: 0 }
    );
    expect(result).toBe('');
  });

  it('returns content unchanged when no clauses are present', () => {
    const result = preprocessOptionalClauses(
      'Just plain text',
      { something: true }
    );
    expect(result).toBe('Just plain text');
  });

  it('returns empty string for empty input', () => {
    const result = preprocessOptionalClauses('', {});
    expect(result).toBe('');
  });

  it('trims whitespace from condition names', () => {
    const result = preprocessOptionalClauses(
      '[Content]{ flag }',
      { flag: true }
    );
    expect(result).toBe('Content');
  });
});
