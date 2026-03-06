import {
  _updateSectionCounters as updateSectionCounters,
  _generateSectionNumber as generateSectionNumber,
  _extractCrossReferencesFromAST as extractCrossReferencesFromAST,
  _cleanHeaderDefinitionsInAST as cleanHeaderDefinitionsInAST,
  _replaceCrossReferencesInAST as replaceCrossReferencesInAST,
  _formatMetadataValue as formatMetadataValue,
} from '@plugins/remark/cross-references';

vi.mock('@extensions/tracking/field-tracker', () => ({
  fieldTracker: {
    trackField: vi.fn(),
  },
}));

vi.mock('@extensions/tracking/field-span', () => ({
  fieldSpan: vi.fn(
    (name: string, content: string, kind: string) =>
      `<span data-field="${name}" data-kind="${kind}">${content}</span>`
  ),
}));

// ---------------------------------------------------------------------------
// Helper: create fresh section counters
// ---------------------------------------------------------------------------
function freshCounters() {
  return { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0 };
}

// ---------------------------------------------------------------------------
// Helper: create minimal mdast heading node
// ---------------------------------------------------------------------------
function heading(depth: number, text: string): any {
  return {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text }],
  };
}

// ---------------------------------------------------------------------------
// Helper: create minimal mdast root
// ---------------------------------------------------------------------------
function root(...children: any[]): any {
  return { type: 'root', children };
}

// ---------------------------------------------------------------------------
// Helper: create minimal mdast paragraph with text
// ---------------------------------------------------------------------------
function paragraph(text: string): any {
  return {
    type: 'paragraph',
    children: [{ type: 'text', value: text }],
  };
}

// ===========================================================================
// updateSectionCounters
// ===========================================================================
describe('updateSectionCounters', () => {
  it('increments level1 counter and resets lower levels', () => {
    const c = freshCounters();
    c.level2 = 3;
    c.level3 = 5;
    updateSectionCounters(c, 1);
    expect(c.level1).toBe(1);
    expect(c.level2).toBe(0);
    expect(c.level3).toBe(0);
    expect(c.level4).toBe(0);
    expect(c.level5).toBe(0);
    expect(c.level6).toBe(0);
  });

  it('increments level2 and resets levels 3-6 only', () => {
    const c = freshCounters();
    c.level1 = 2;
    c.level3 = 4;
    updateSectionCounters(c, 2);
    expect(c.level1).toBe(2); // unchanged
    expect(c.level2).toBe(1);
    expect(c.level3).toBe(0);
  });

  it('increments level3 and resets levels 4-6 only', () => {
    const c = freshCounters();
    c.level1 = 1;
    c.level2 = 2;
    c.level4 = 7;
    updateSectionCounters(c, 3);
    expect(c.level1).toBe(1);
    expect(c.level2).toBe(2);
    expect(c.level3).toBe(1);
    expect(c.level4).toBe(0);
  });

  it('increments level4 and resets levels 5-6 only', () => {
    const c = freshCounters();
    c.level3 = 3;
    updateSectionCounters(c, 4);
    expect(c.level3).toBe(3);
    expect(c.level4).toBe(1);
    expect(c.level5).toBe(0);
    expect(c.level6).toBe(0);
  });

  it('increments level5 and resets level6 only', () => {
    const c = freshCounters();
    c.level4 = 2;
    updateSectionCounters(c, 5);
    expect(c.level4).toBe(2);
    expect(c.level5).toBe(1);
    expect(c.level6).toBe(0);
  });

  it('increments level6 without resetting anything', () => {
    const c = freshCounters();
    c.level5 = 5;
    updateSectionCounters(c, 6);
    expect(c.level5).toBe(5);
    expect(c.level6).toBe(1);
  });

  it('accumulates across multiple calls', () => {
    const c = freshCounters();
    updateSectionCounters(c, 1);
    updateSectionCounters(c, 2);
    updateSectionCounters(c, 2);
    updateSectionCounters(c, 1);
    expect(c.level1).toBe(2);
    expect(c.level2).toBe(0); // reset by second level1
  });
});

// ===========================================================================
// generateSectionNumber
// ===========================================================================
describe('generateSectionNumber', () => {
  it('generates plain number with %n pattern', () => {
    const c = { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0 };
    const result = generateSectionNumber(1, c, { level1: 'Article %n.' });
    expect(result).toBe('Article 3.');
  });

  it('generates Roman numeral with %r pattern', () => {
    const c = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 4 };
    const result = generateSectionNumber(6, c, { level6: 'Annex %r -' });
    expect(result).toBe('Annex iv -');
  });

  it('generates uppercase Roman numeral with %R pattern', () => {
    const c = { level1: 5, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0 };
    const result = generateSectionNumber(1, c, { level1: 'Part %R.' });
    expect(result).toBe('Part V.');
  });

  it('generates alpha label with %c pattern', () => {
    const c = { level1: 0, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0 };
    const result = generateSectionNumber(2, c, { level2: '(%c)' });
    expect(result).toBe('(b)');
  });

  it('uses default format when level format is missing', () => {
    const c = { level1: 1, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0 };
    const result = generateSectionNumber(1, c, {});
    expect(result).toBe('Level 1.');
  });

  it('handles level4 combined %n%c pattern', () => {
    const c = { level1: 1, level2: 1, level3: 2, level4: 3, level5: 0, level6: 0 };
    const result = generateSectionNumber(4, c, { level4: '(%n%c)' });
    // %n = level3 counter (2), %c = level4 alpha (c)
    expect(result).toBe('(2c)');
  });

  it('handles level5 combined %n%c%r pattern', () => {
    const c = { level1: 1, level2: 1, level3: 2, level4: 3, level5: 4, level6: 0 };
    const result = generateSectionNumber(5, c, { level5: '(%n%c%r)' });
    // %n = level3 (2), %c = level4 alpha (c), %r = level5 roman (iv)
    expect(result).toBe('(2civ)');
  });

  it('handles level2 with %n referring to current level number', () => {
    const c = { level1: 2, level2: 5, level3: 0, level4: 0, level5: 0, level6: 0 };
    const result = generateSectionNumber(2, c, { level2: 'Section %n.' });
    expect(result).toBe('Section 5.');
  });
});

// ===========================================================================
// formatMetadataValue
// ===========================================================================
describe('formatMetadataValue', () => {
  it('returns empty string for undefined', () => {
    expect(formatMetadataValue(undefined, 'key', {})).toBe('');
  });

  it('returns "null" for null', () => {
    expect(formatMetadataValue(null, 'key', {})).toBe('null');
  });

  it('returns string values directly', () => {
    expect(formatMetadataValue('hello', 'key', {})).toBe('hello');
  });

  it('converts plain numbers to string', () => {
    expect(formatMetadataValue(42, 'count', {})).toBe('42');
  });

  it('formats number as currency when key contains "amount"', () => {
    const result = formatMetadataValue(1500, 'total_amount', { payment_currency: 'USD' });
    expect(result).toBe('$1,500.00');
  });

  it('defaults currency to USD when payment_currency is missing', () => {
    const result = formatMetadataValue(100, 'amount', {});
    expect(result).toBe('$100.00');
  });

  it('converts boolean to string', () => {
    expect(formatMetadataValue(true, 'flag', {})).toBe('true');
    expect(formatMetadataValue(false, 'active', {})).toBe('false');
  });

  it('converts array to string', () => {
    const result = formatMetadataValue([1, 2, 3] as any, 'items', {});
    expect(result).toBe('1,2,3');
  });

  it('formats Date objects as ISO date', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    expect(formatMetadataValue(date as any, 'signed_date', {})).toBe('2025-06-15');
  });
});

// ===========================================================================
// extractCrossReferencesFromAST
// ===========================================================================
describe('extractCrossReferencesFromAST', () => {
  it('extracts |key| definitions from heading text nodes', () => {
    const tree = root(heading(1, '**Introduction** |intro|'));
    const refs = extractCrossReferencesFromAST(tree, {});
    expect(refs).toHaveLength(1);
    expect(refs[0].key).toBe('intro');
    expect(refs[0].level).toBe(1);
    expect(refs[0].headerText).toBe('Introduction');
    expect(refs[0].sectionNumber).toContain('1');
  });

  it('returns empty array for headings without keys', () => {
    const tree = root(heading(1, 'Just a heading'));
    const refs = extractCrossReferencesFromAST(tree, {});
    expect(refs).toHaveLength(0);
  });

  it('handles multiple headings with different keys', () => {
    const tree = root(
      heading(1, '**Part One** |part1|'),
      heading(2, '**Details** |details|'),
      heading(1, '**Part Two** |part2|')
    );
    const refs = extractCrossReferencesFromAST(tree, {});
    expect(refs).toHaveLength(3);
    expect(refs.map(r => r.key)).toEqual(['part1', 'details', 'part2']);
  });

  it('uses custom level formats from metadata', () => {
    const tree = root(heading(1, '**Title** |t|'));
    const refs = extractCrossReferencesFromAST(tree, { level1: 'Part %R.' });
    expect(refs[0].sectionNumber).toBe('Part I.');
  });

  it('tracks section counters across headings', () => {
    const tree = root(
      heading(1, '**A** |a|'),
      heading(1, '**B** |b|'),
      heading(1, '**C** |c|')
    );
    const refs = extractCrossReferencesFromAST(tree, { level1: 'Article %n.' });
    expect(refs[0].sectionNumber).toBe('Article 1.');
    expect(refs[1].sectionNumber).toBe('Article 2.');
    expect(refs[2].sectionNumber).toBe('Article 3.');
  });

  it('handles l. prefix in heading text', () => {
    const tree = root(heading(1, 'l. **Title** |lt|'));
    const refs = extractCrossReferencesFromAST(tree, {});
    expect(refs).toHaveLength(1);
    expect(refs[0].key).toBe('lt');
  });
});

// ===========================================================================
// cleanHeaderDefinitionsInAST
// ===========================================================================
describe('cleanHeaderDefinitionsInAST', () => {
  it('removes |key| from heading text', () => {
    const tree = root(heading(1, '**Title** |mykey|'));
    const refs = [
      { key: 'mykey', level: 1, sectionNumber: 'Article 1.', sectionText: 'Article 1. Title', headerText: 'Title' },
    ];
    cleanHeaderDefinitionsInAST(tree, refs);
    expect(tree.children[0].children[0].value).toBe('**Title**');
  });

  it('preserves headings that do not define a cross-reference', () => {
    const tree = root(heading(1, 'Normal heading'));
    cleanHeaderDefinitionsInAST(tree, []);
    expect(tree.children[0].children[0].value).toBe('Normal heading');
  });

  it('only removes definition keys that were extracted', () => {
    const tree = root(heading(1, '**Title** |unknown|'));
    // No refs extracted for 'unknown'
    cleanHeaderDefinitionsInAST(tree, []);
    expect(tree.children[0].children[0].value).toBe('**Title** |unknown|');
  });
});

// ===========================================================================
// replaceCrossReferencesInAST
// ===========================================================================
describe('replaceCrossReferencesInAST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces |key| in text with section number', () => {
    const tree = root(paragraph('See |intro| for details.'));
    const refs = [
      { key: 'intro', level: 1, sectionNumber: 'Article 1.', sectionText: 'Article 1. Introduction', headerText: 'Introduction' },
    ];
    replaceCrossReferencesInAST(tree, refs, {});
    expect(tree.children[0].children[0].value).toBe('See Article 1. for details.');
  });

  it('leaves unresolved references unchanged when field tracking is disabled', () => {
    const tree = root(paragraph('See |missing| here.'));
    replaceCrossReferencesInAST(tree, [], {});
    expect(tree.children[0].children[0].value).toBe('See |missing| here.');
  });

  it('resolves references from metadata as fallback', () => {
    const tree = root(paragraph('Party: |party_name|'));
    replaceCrossReferencesInAST(tree, [], { party_name: 'Acme Corp' });
    expect(tree.children[0].children[0].value).toBe('Party: Acme Corp');
  });

  it('replaces multiple references in same text node', () => {
    const tree = root(paragraph('See |a| and |b|.'));
    const refs = [
      { key: 'a', level: 1, sectionNumber: 'Art. 1', sectionText: '', headerText: '' },
      { key: 'b', level: 2, sectionNumber: 'Sec. 1', sectionText: '', headerText: '' },
    ];
    replaceCrossReferencesInAST(tree, refs, {});
    expect(tree.children[0].children[0].value).toBe('See Art. 1 and Sec. 1.');
  });

  it('skips replacement inside heading nodes that define a cross-reference', () => {
    const tree = root(heading(1, '**Title** |mykey|'));
    const refs = [
      { key: 'mykey', level: 1, sectionNumber: 'Article 1.', sectionText: '', headerText: 'Title' },
    ];
    replaceCrossReferencesInAST(tree, refs, {});
    // Heading text should be unchanged (skipped)
    expect(tree.children[0].children[0].value).toBe('**Title** |mykey|');
  });

  it('replaces references in HTML nodes', () => {
    const tree = root({
      type: 'html',
      value: '<p>See |intro| for more.</p>',
    });
    const refs = [
      { key: 'intro', level: 1, sectionNumber: 'Article 1.', sectionText: '', headerText: '' },
    ];
    replaceCrossReferencesInAST(tree, refs, {});
    expect(tree.children[0].value).toBe('<p>See Article 1. for more.</p>');
  });
});
