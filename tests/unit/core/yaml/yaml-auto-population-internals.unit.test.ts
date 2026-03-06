import {
  _createEnhancedMetadata as createEnhancedMetadata,
  _analyzeDocumentStructure as analyzeDocumentStructure,
  _formatEnhancedYaml as formatEnhancedYaml,
} from '../../../../src/core/yaml/yaml-auto-population';

// ---------------------------------------------------------------------------
// createEnhancedMetadata
// ---------------------------------------------------------------------------
describe('createEnhancedMetadata', () => {
  it('returns default levels and properties when given empty metadata', () => {
    const result = createEnhancedMetadata({}, true, true);

    // Should have structured headers comment
    expect(result['# Structured Headers']).toBeNull();

    // All 9 default levels should be present (inferred)
    for (let i = 1; i <= 9; i++) {
      expect(result[`level-${i}`]).toBe('%n.');
    }

    // Properties section should be present
    expect(result['# Properties']).toBeNull();
    expect(result['no-indent']).toBe('');
    expect(result['no-reset']).toBe('');
    expect(result['level-style']).toBe('');
  });

  it('preserves existing level definitions and fills missing ones', () => {
    const existing = { 'level-1': 'Article %n.', 'level-3': 'Section %n.' };
    const result = createEnhancedMetadata(existing, false, true);

    expect(result['level-1']).toBe('Article %n.');
    expect(result['level-2']).toBe('%n.'); // inferred default
    expect(result['level-3']).toBe('Section %n.');
  });

  it('does not infer missing levels when inferMissingLevels is false', () => {
    const existing = { 'level-1': 'Article %n.' };
    const result = createEnhancedMetadata(existing, false, false);

    expect(result['level-1']).toBe('Article %n.');
    expect(result['level-2']).toBeUndefined();
  });

  it('omits properties section when includeProperties is false', () => {
    const result = createEnhancedMetadata({}, false, true);

    expect(result['# Properties']).toBeUndefined();
    expect(result['no-indent']).toBeUndefined();
  });

  it('preserves non-level metadata keys', () => {
    const existing = { title: 'My Document', 'level-1': 'Art %n.' };
    const result = createEnhancedMetadata(existing, false, false);

    expect(result['title']).toBe('My Document');
    expect(result['level-1']).toBe('Art %n.');
  });

  it('uses existing property values instead of defaults', () => {
    const existing = { 'no-indent': 'l., ll.', 'no-reset': 'lll.' };
    const result = createEnhancedMetadata(existing, true, false);

    expect(result['no-indent']).toBe('l., ll.');
    expect(result['no-reset']).toBe('lll.');
    expect(result['level-style']).toBe(''); // default since not in existing
  });
});

// ---------------------------------------------------------------------------
// analyzeDocumentStructure
// ---------------------------------------------------------------------------
describe('analyzeDocumentStructure', () => {
  it('detects traditional syntax levels (l., ll., lll.)', () => {
    const content = [
      'l. First heading',
      'Some text here.',
      'll. Sub heading',
      'lll. Sub sub heading',
    ].join('\n');

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([1, 2, 3]);
    expect(result.hasAlternativeSyntax).toBe(false);
    expect(result.noIndentPattern).toBe('l., ll., lll.');
  });

  it('detects alternative syntax (l2., l3.)', () => {
    const content = ['l2. Second level', 'l5. Fifth level'].join('\n');

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([2, 5]);
    expect(result.hasAlternativeSyntax).toBe(true);
    expect(result.noIndentPattern).toBe('l2., l5.');
  });

  it('returns empty results for content with no heading markers', () => {
    const content = 'Just a plain paragraph.\nNo headings here.';

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([]);
    expect(result.noIndentPattern).toBe('');
    expect(result.hasAlternativeSyntax).toBe(false);
  });

  it('handles mixed traditional and alternative syntax', () => {
    const content = ['l. Traditional', 'l3. Alternative'].join('\n');

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([1, 3]);
    expect(result.hasAlternativeSyntax).toBe(true);
  });

  it('deduplicates levels when same level appears multiple times', () => {
    const content = ['l. First', 'l. Second', 'l. Third'].join('\n');

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([1]);
  });

  it('sorts levels numerically', () => {
    const content = ['lll. Third', 'l. First', 'll. Second'].join('\n');

    const result = analyzeDocumentStructure(content);

    expect(result.usedLevels).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// formatEnhancedYaml
// ---------------------------------------------------------------------------
describe('formatEnhancedYaml', () => {
  it('formats comment keys as bare lines', () => {
    const metadata = { '# Structured Headers': null };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('# Structured Headers\n');
  });

  it('quotes unquoted string values', () => {
    const metadata = { 'level-1': 'Article %n.' };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('level-1: "Article %n."\n');
  });

  it('preserves already-quoted string values', () => {
    const metadata = { 'level-1': '"Article %n."' };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('level-1: "Article %n."\n');
  });

  it('formats empty strings as empty double quotes', () => {
    const metadata = { 'no-indent': '' };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('no-indent: ""\n');
  });

  it('skips null/undefined non-comment entries', () => {
    const metadata: Record<string, unknown> = {
      'level-1': 'Art %n.',
      removed: null,
      also_removed: undefined,
    };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('level-1: "Art %n."\n');
  });

  it('formats non-string level values with quotes', () => {
    const metadata = { 'level-1': 42 };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('level-1: "42"\n');
  });

  it('JSON-stringifies non-string, non-level values', () => {
    const metadata = { 'some-flag': true };
    const result = formatEnhancedYaml(metadata);

    expect(result).toBe('some-flag: true\n');
  });

  it('produces a complete YAML block with comments and levels', () => {
    const metadata: Record<string, unknown> = {
      '# Structured Headers': null,
      'level-1': 'Article %n.',
      'level-2': 'Section %n.',
      '# Properties': null,
      'no-indent': '',
    };
    const result = formatEnhancedYaml(metadata);

    const expected = [
      '# Structured Headers',
      'level-1: "Article %n."',
      'level-2: "Section %n."',
      '# Properties',
      'no-indent: ""',
      '',
    ].join('\n');

    expect(result).toBe(expected);
  });
});
