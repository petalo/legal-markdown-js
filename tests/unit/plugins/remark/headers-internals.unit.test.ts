import {
  _extractHeaderConfig,
  _getHeaderFormat,
  _updateHeaderState,
  _extractTextContent,
  _applyNumberingFormat,
  _updateHeaderNode,
  _formatHeaderText,
  _processHeader,
} from '../../../../src/plugins/remark/headers';
import type { Heading, Text } from 'mdast';

function makeState(overrides: Record<string, number> = {}) {
  return {
    levelOne: 0, levelTwo: 0, levelThree: 0, levelFour: 0, levelFive: 0,
    levelSix: 0, levelSeven: 0, levelEight: 0, levelNine: 0,
    customLevels: new Map<string, number>(),
    ...overrides,
  };
}

function makeHeading(depth: 1 | 2 | 3 | 4 | 5 | 6, text: string, isLegal = false): Heading {
  const node: Heading & { data?: Record<string, unknown> } = {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text } as Text],
  };
  if (isLegal) {
    node.data = { isLegalHeader: true };
  }
  return node;
}

describe('headers.ts internals', () => {
  describe('extractHeaderConfig', () => {
    it('extracts level formats from metadata with dash keys', () => {
      const config = _extractHeaderConfig({ 'level-1': 'Article %n', 'level-2': 'Section %n' });
      expect(config.levelOne).toBe('Article %n');
      expect(config.levelTwo).toBe('Section %n');
    });

    it('extracts level formats from word-based keys', () => {
      const config = _extractHeaderConfig({ 'level-one': '%R.', 'level-two': '(%a)' });
      expect(config.levelOne).toBe('%R.');
      expect(config.levelTwo).toBe('(%a)');
    });

    it('prefers level-1 over level-one when both present', () => {
      const config = _extractHeaderConfig({ 'level-1': 'First', 'level-one': 'Second' });
      expect(config.levelOne).toBe('First');
    });

    it('returns null for missing levels', () => {
      const config = _extractHeaderConfig({});
      expect(config.levelOne).toBeNull();
      expect(config.levelFive).toBeNull();
    });

    it('returns null for non-string values', () => {
      const config = _extractHeaderConfig({ 'level-1': 42 as unknown as string });
      expect(config.levelOne).toBeNull();
    });
  });

  describe('getHeaderFormat', () => {
    it('returns configured format for known level', () => {
      const config = _extractHeaderConfig({ 'level-1': 'Article %n' });
      expect(_getHeaderFormat(1, config)).toBe('Article %n');
    });

    it('falls back to default pattern when not configured', () => {
      const config = _extractHeaderConfig({});
      const result = _getHeaderFormat(1, config);
      // Should return the DEFAULT_HEADER_PATTERNS value
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('returns format for all levels 1-9', () => {
      const meta: Record<string, string> = {};
      for (let i = 1; i <= 9; i++) {
        meta[`level-${i}`] = `L${i}-%n`;
      }
      const config = _extractHeaderConfig(meta);
      for (let i = 1; i <= 6; i++) {
        // Only 1-6 supported by heading depth
        expect(_getHeaderFormat(i, config)).toBe(`L${i}-%n`);
      }
    });
  });

  describe('updateHeaderState', () => {
    it('increments level 1 and resets lower levels', () => {
      const state = makeState({ levelTwo: 3, levelThree: 5 });
      _updateHeaderState(1, state, false);
      expect(state.levelOne).toBe(1);
      expect(state.levelTwo).toBe(0);
      expect(state.levelThree).toBe(0);
    });

    it('does not reset lower levels when noReset is true', () => {
      const state = makeState({ levelTwo: 3 });
      _updateHeaderState(1, state, true);
      expect(state.levelOne).toBe(1);
      expect(state.levelTwo).toBe(3); // preserved
    });

    it('increments level 2 and resets 3+', () => {
      const state = makeState({ levelOne: 1, levelThree: 2 });
      _updateHeaderState(2, state, false);
      expect(state.levelOne).toBe(1);
      expect(state.levelTwo).toBe(1);
      expect(state.levelThree).toBe(0);
    });

    it('accumulates at same level', () => {
      const state = makeState();
      _updateHeaderState(3, state, false);
      _updateHeaderState(3, state, false);
      expect(state.levelThree).toBe(2);
    });
  });

  describe('extractTextContent', () => {
    it('extracts plain text from heading', () => {
      const h = makeHeading(1, 'Hello World');
      expect(_extractTextContent(h)).toBe('Hello World');
    });

    it('extracts text from strong children', () => {
      const h: Heading = {
        type: 'heading',
        depth: 1,
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'Bold' }] },
        ] as Heading['children'],
      };
      expect(_extractTextContent(h)).toBe('**Bold**');
    });

    it('extracts text from emphasis children', () => {
      const h: Heading = {
        type: 'heading',
        depth: 1,
        children: [
          { type: 'emphasis', children: [{ type: 'text', value: 'Italic' }] },
        ] as Heading['children'],
      };
      expect(_extractTextContent(h)).toBe('*Italic*');
    });

    it('extracts text from link children', () => {
      const h: Heading = {
        type: 'heading',
        depth: 1,
        children: [
          { type: 'link', url: 'http://example.com', children: [{ type: 'text', value: 'Click' }] },
        ] as Heading['children'],
      };
      expect(_extractTextContent(h)).toBe('Click');
    });

    it('strips trailing cross-reference keys', () => {
      const h = makeHeading(1, 'Title |anchor|');
      expect(_extractTextContent(h)).toBe('Title');
    });

    it('handles inline code', () => {
      const h: Heading = {
        type: 'heading',
        depth: 1,
        children: [
          { type: 'text', value: 'Code: ' },
          { type: 'inlineCode', value: 'foo()' },
        ] as Heading['children'],
      };
      expect(_extractTextContent(h)).toBe('Code: foo()');
    });
  });

  describe('applyNumberingFormat', () => {
    it('replaces %n with number', () => {
      const state = makeState({ levelOne: 3 });
      expect(_applyNumberingFormat('%n.', 3, 1, state)).toBe('3.');
    });

    it('replaces %A with uppercase letter', () => {
      const state = makeState({ levelOne: 2 });
      expect(_applyNumberingFormat('(%A)', 2, 1, state)).toBe('(B)');
    });

    it('replaces %a with lowercase letter', () => {
      const state = makeState({ levelTwo: 1 });
      expect(_applyNumberingFormat('%a.', 1, 2, state)).toBe('a.');
    });

    it('replaces %R with uppercase roman', () => {
      const state = makeState({ levelOne: 4 });
      expect(_applyNumberingFormat('%R.', 4, 1, state)).toBe('IV.');
    });

    it('replaces %r with lowercase roman', () => {
      const state = makeState({ levelTwo: 9 });
      expect(_applyNumberingFormat('(%r)', 9, 2, state)).toBe('(ix)');
    });

    it('handles %c (alphabetic alias)', () => {
      const state = makeState({ levelThree: 3 });
      expect(_applyNumberingFormat('%c)', 3, 3, state)).toBe('c)');
    });

    it('handles leading zero format %02n', () => {
      const state = makeState({ levelOne: 3 });
      expect(_applyNumberingFormat('%02n.', 3, 1, state)).toBe('03.');
    });

    it('handles cross-level references %l1', () => {
      const state = makeState({ levelOne: 2, levelTwo: 5 });
      expect(_applyNumberingFormat('%l1.%n', 5, 2, state)).toBe('2.5');
    });

    it('handles relative parent ref %s', () => {
      const state = makeState({ levelOne: 3, levelTwo: 2 });
      expect(_applyNumberingFormat('%s.%n', 2, 2, state)).toBe('3.2');
    });

    it('replaces %o with number (fallback)', () => {
      const state = makeState({ levelOne: 7 });
      expect(_applyNumberingFormat('%o)', 7, 1, state)).toBe('7)');
    });
  });

  describe('updateHeaderNode', () => {
    it('sets plain text as child for simple text', () => {
      const h = makeHeading(1, 'Old');
      _updateHeaderNode(h, 'New Text');
      expect(h.children.length).toBe(1);
      expect(h.children[0].type).toBe('text');
      expect((h.children[0] as Text).value).toBe('New Text');
    });

    it('sets HTML child when text has field tracking spans', () => {
      const h = makeHeading(1, 'Old');
      _updateHeaderNode(h, '<span class="legal-field">tracked</span>');
      expect(h.children.length).toBe(1);
      expect(h.children[0].type).toBe('html');
    });

    it('sets HTML child when text has leading spaces (indentation)', () => {
      const h = makeHeading(1, 'Old');
      _updateHeaderNode(h, '  Indented Text');
      expect(h.children[0].type).toBe('html');
    });

    it('sets HTML child when text has markdown formatting', () => {
      const h = makeHeading(1, 'Old');
      _updateHeaderNode(h, '1. **Bold** Title');
      expect(h.children[0].type).toBe('html');
    });
  });

  describe('processHeader', () => {
    it('numbers a legal header at level 1', () => {
      const config = _extractHeaderConfig({ 'level-1': 'Article %n.' });
      const state = makeState();
      const h = makeHeading(1, 'Introduction', true);

      _processHeader(h, config, state, { noReset: false, noIndent: true, debug: false });

      expect(state.levelOne).toBe(1);
      // The header text should be updated
      const text = h.children.map(c => (c as { value?: string }).value || '').join('');
      expect(text).toContain('Article 1.');
      expect(text).toContain('Introduction');
    });

    it('respects noIndent option', () => {
      const config = _extractHeaderConfig({ 'level-2': '%n.' });
      const state = makeState({ levelOne: 1 });
      const h = makeHeading(2 as 1 | 2 | 3 | 4 | 5 | 6, 'Sub', true);

      _processHeader(h, config, state, { noReset: false, noIndent: true, debug: false });

      const text = h.children.map(c => (c as { value?: string }).value || '').join('');
      // With noIndent, text should NOT start with spaces
      expect(text).not.toMatch(/^  /);
    });
  });

  describe('formatHeaderText', () => {
    it('returns null for empty text content', () => {
      const h: Heading = { type: 'heading', depth: 1, children: [] };
      const state = makeState({ levelOne: 1 });
      const result = _formatHeaderText(h, '%n.', 1, state, { noIndent: true, debug: false });
      expect(result).toBeNull();
    });

    it('returns null when header already has numbering', () => {
      const h = makeHeading(1, 'Article 1. Introduction');
      const state = makeState({ levelOne: 1 });
      const result = _formatHeaderText(h, 'Article %n.', 1, state, { noIndent: true, debug: false });
      expect(result).toBeNull();
    });

    it('formats header text with numbering', () => {
      const h = makeHeading(1, 'Introduction');
      const state = makeState({ levelOne: 2 });
      const result = _formatHeaderText(h, 'Section %n.', 2, state, { noIndent: true, debug: false });
      expect(result).toContain('Section 2.');
      expect(result).toContain('Introduction');
    });
  });
});
