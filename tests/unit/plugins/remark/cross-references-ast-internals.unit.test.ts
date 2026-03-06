vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: { trackField: vi.fn() },
}));
vi.mock('../../../../src/extensions/tracking/field-span', () => ({
  fieldSpan: vi.fn((_name: string, value: string) => `<span>${value}</span>`),
}));

import {
  _parseReferences,
  _extractDefinitionsFromAST,
  _updateSectionCounters,
  _generateSectionNumber,
  _toRomanNumeral,
  _resolveReferences,
  _formatMetadataValue,
} from '../../../../src/plugins/remark/cross-references-ast';
import type { Root, Heading, Text } from 'mdast';

// Helper to build a minimal Root AST
function makeRoot(...children: Root['children']): Root {
  return { type: 'root', children };
}

function makeHeading(depth: 1 | 2 | 3 | 4 | 5 | 6, text: string): Heading {
  return {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text } as Text],
  };
}

function makeParagraph(text: string) {
  return {
    type: 'paragraph' as const,
    children: [{ type: 'text' as const, value: text }],
  };
}

function makeCounters(overrides: Partial<Record<string, number>> = {}) {
  return {
    level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
    level6: 0, level7: 0, level8: 0, level9: 0,
    ...overrides,
  };
}

describe('cross-references-ast internals', () => {
  describe('toRomanNumeral', () => {
    it('converts 1 to I', () => {
      expect(_toRomanNumeral(1)).toBe('I');
    });

    it('converts 4 to IV', () => {
      expect(_toRomanNumeral(4)).toBe('IV');
    });

    it('converts 9 to IX', () => {
      expect(_toRomanNumeral(9)).toBe('IX');
    });

    it('converts 40 to XL', () => {
      expect(_toRomanNumeral(40)).toBe('XL');
    });

    it('converts 90 to XC', () => {
      expect(_toRomanNumeral(90)).toBe('XC');
    });

    it('converts 400 to CD', () => {
      expect(_toRomanNumeral(400)).toBe('CD');
    });

    it('converts 900 to CM', () => {
      expect(_toRomanNumeral(900)).toBe('CM');
    });

    it('converts 1994 to MCMXCIV', () => {
      expect(_toRomanNumeral(1994)).toBe('MCMXCIV');
    });

    it('converts 3999 to MMMCMXCIX', () => {
      expect(_toRomanNumeral(3999)).toBe('MMMCMXCIX');
    });

    it('returns empty string for 0', () => {
      expect(_toRomanNumeral(0)).toBe('');
    });
  });

  describe('updateSectionCounters', () => {
    it('increments level 1 and resets all lower levels', () => {
      const c = makeCounters({ level2: 3, level3: 5 });
      _updateSectionCounters(c, 1);
      expect(c.level1).toBe(1);
      expect(c.level2).toBe(0);
      expect(c.level3).toBe(0);
    });

    it('increments level 2 and resets levels 3+', () => {
      const c = makeCounters({ level1: 1, level3: 2 });
      _updateSectionCounters(c, 2);
      expect(c.level1).toBe(1); // unchanged
      expect(c.level2).toBe(1);
      expect(c.level3).toBe(0);
    });

    it('increments level 9 without resetting anything', () => {
      const c = makeCounters({ level1: 1, level8: 2 });
      _updateSectionCounters(c, 9);
      expect(c.level9).toBe(1);
      expect(c.level8).toBe(2); // unchanged
    });

    it('accumulates on repeated calls at same level', () => {
      const c = makeCounters();
      _updateSectionCounters(c, 3);
      _updateSectionCounters(c, 3);
      _updateSectionCounters(c, 3);
      expect(c.level3).toBe(3);
    });
  });

  describe('generateSectionNumber', () => {
    it('replaces %n with the current level counter', () => {
      const c = makeCounters({ level1: 5 });
      const formats = { level1: 'Article %n' };
      expect(_generateSectionNumber(1, c, formats)).toBe('Article 5');
    });

    it('replaces %A with uppercase letter', () => {
      const c = makeCounters({ level2: 3 });
      const formats = { level2: '(%A)' };
      expect(_generateSectionNumber(2, c, formats)).toBe('(C)');
    });

    it('replaces %a with lowercase letter', () => {
      const c = makeCounters({ level3: 1 });
      const formats = { level3: '%a.' };
      expect(_generateSectionNumber(3, c, formats)).toBe('a.');
    });

    it('replaces %R with uppercase roman numeral', () => {
      const c = makeCounters({ level1: 4 });
      const formats = { level1: '%R.' };
      expect(_generateSectionNumber(1, c, formats)).toBe('IV.');
    });

    it('replaces %r with lowercase roman numeral', () => {
      const c = makeCounters({ level2: 9 });
      const formats = { level2: '(%r)' };
      expect(_generateSectionNumber(2, c, formats)).toBe('(ix)');
    });

    it('replaces cross-level references like %l1', () => {
      const c = makeCounters({ level1: 2, level2: 3 });
      const formats = { level2: '%l1.%n' };
      expect(_generateSectionNumber(2, c, formats)).toBe('2.3');
    });

    it('returns undefined-level template for missing format', () => {
      const c = makeCounters({ level7: 1 });
      const result = _generateSectionNumber(7, c, {});
      expect(result).toContain('undefined-level-7');
    });
  });

  describe('formatMetadataValue', () => {
    it('returns empty string for undefined', () => {
      expect(_formatMetadataValue(undefined, 'key', {})).toBe('');
    });

    it('returns "null" for null', () => {
      expect(_formatMetadataValue(null, 'key', {})).toBe('null');
    });

    it('converts string values directly', () => {
      expect(_formatMetadataValue('hello', 'name', {})).toBe('hello');
    });

    it('converts number values', () => {
      expect(_formatMetadataValue(42, 'count', {})).toBe('42');
    });

    it('converts boolean values', () => {
      expect(_formatMetadataValue(true, 'active', {})).toBe('true');
    });

    it('formats Date objects as ISO date', () => {
      const date = new Date('2024-06-15T10:00:00Z');
      expect(_formatMetadataValue(date, 'start_date', {})).toBe('2024-06-15');
    });

    it('formats amount fields as currency', () => {
      const result = _formatMetadataValue(1234.5, 'total_amount', { payment_currency: 'USD' });
      expect(result).toContain('1,234.50');
    });

    it('uses USD as default currency for amount fields', () => {
      const result = _formatMetadataValue(100, 'payment_amount', {});
      expect(result).toContain('100');
    });
  });

  describe('parseReferences', () => {
    it('converts |key| in paragraph text to reference nodes', () => {
      const tree = makeRoot(makeParagraph('See |section1| for details'));
      _parseReferences(tree);

      const para = tree.children[0] as { children: { type: string; value?: string; key?: string }[] };
      // Should have 3 children: text, reference, text
      expect(para.children.length).toBe(3);
      expect(para.children[0].type).toBe('text');
      expect(para.children[0].value).toBe('See ');
      expect(para.children[1].type).toBe('reference');
      expect(para.children[1].key).toBe('section1');
      expect(para.children[2].type).toBe('text');
      expect(para.children[2].value).toBe(' for details');
    });

    it('handles multiple references in one text node', () => {
      const tree = makeRoot(makeParagraph('|a| and |b|'));
      _parseReferences(tree);

      const para = tree.children[0] as { children: { type: string }[] };
      const refs = para.children.filter(c => c.type === 'reference');
      expect(refs.length).toBe(2);
    });

    it('leaves text without pipes unchanged', () => {
      const tree = makeRoot(makeParagraph('no references here'));
      _parseReferences(tree);

      const para = tree.children[0] as { children: Text[] };
      expect(para.children.length).toBe(1);
      expect(para.children[0].value).toBe('no references here');
    });

    it('marks references in headings as definition type', () => {
      const tree = makeRoot(makeHeading(1, 'Title |anchor|'));
      _parseReferences(tree);

      const heading = tree.children[0] as { children: { type: string; referenceType?: string }[] };
      const ref = heading.children.find(c => c.type === 'reference');
      expect(ref).toBeDefined();
      expect(ref!.referenceType).toBe('definition');
    });
  });

  describe('extractDefinitionsFromAST', () => {
    it('extracts definition from heading with reference node', () => {
      // Build a tree with a heading containing a reference node
      const tree = makeRoot(makeHeading(1, 'Introduction |intro|'));
      _parseReferences(tree); // creates reference nodes

      const defs = _extractDefinitionsFromAST(tree, {});
      expect(defs.length).toBe(1);
      expect(defs[0].key).toBe('intro');
      expect(defs[0].level).toBe(1);
    });

    it('returns empty array when no definitions exist', () => {
      const tree = makeRoot(makeParagraph('Just a paragraph'));
      const defs = _extractDefinitionsFromAST(tree, {});
      expect(defs.length).toBe(0);
    });

    it('uses metadata level formats for section numbering', () => {
      const tree = makeRoot(makeHeading(1, 'Section |s1|'));
      _parseReferences(tree);

      const defs = _extractDefinitionsFromAST(tree, { 'level-1': 'Article %n' });
      expect(defs[0].sectionNumber).toBe('Article 1');
    });
  });

  describe('resolveReferences', () => {
    it('resolves usage references with section numbers', () => {
      const tree = makeRoot(
        makeHeading(1, 'Title |anchor|'),
        makeParagraph('See |anchor| above'),
      );
      _parseReferences(tree);

      const defs = _extractDefinitionsFromAST(tree, { 'level-1': 'Section %n' });
      _resolveReferences(tree, defs, {});

      // The paragraph reference should be resolved to a text node
      const para = tree.children[1] as { children: { type: string; value?: string }[] };
      const textNodes = para.children.filter(c => c.type === 'text');
      const values = textNodes.map(t => t.value).join('');
      expect(values).toContain('Section 1');
    });

    it('falls back to metadata for unknown references', () => {
      const tree = makeRoot(makeParagraph('Value: |company|'));
      _parseReferences(tree);

      _resolveReferences(tree, [], { company: 'ACME Corp' });

      const para = tree.children[0] as { children: { type: string; value?: string }[] };
      const textNodes = para.children.filter(c => c.type === 'text');
      const values = textNodes.map(t => t.value).join('');
      expect(values).toContain('ACME Corp');
    });

    it('keeps original text for unresolved references', () => {
      const tree = makeRoot(makeParagraph('See |unknown|'));
      _parseReferences(tree);

      _resolveReferences(tree, [], {});

      const para = tree.children[0] as { children: { type: string; value?: string }[] };
      const textNodes = para.children.filter(c => c.type === 'text');
      const values = textNodes.map(t => t.value).join('');
      expect(values).toContain('|unknown|');
    });

    it('creates HTML nodes with field tracking when enabled', () => {
      const tree = makeRoot(makeParagraph('See |company|'));
      _parseReferences(tree);

      _resolveReferences(tree, [], { company: 'Test Corp' }, true);

      const para = tree.children[0] as { children: { type: string; value?: string }[] };
      const htmlNode = para.children.find(c => c.type === 'html');
      expect(htmlNode).toBeDefined();
      expect(htmlNode!.value).toContain('Test Corp');
    });
  });
});
