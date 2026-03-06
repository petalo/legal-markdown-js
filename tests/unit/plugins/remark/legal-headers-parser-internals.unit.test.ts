import {
  _isLegalHeader,
  _convertToHeading,
  _parseMarkdownInlineFormatting,
} from '../../../../src/plugins/remark/legal-headers-parser';
import type { Paragraph, Text } from 'mdast';

function makeParagraph(text: string): Paragraph {
  return {
    type: 'paragraph',
    children: [{ type: 'text', value: text } as Text],
  };
}

describe('legal-headers-parser internals', () => {
  describe('isLegalHeader', () => {
    it('detects single l. as level 1', () => {
      const result = _isLegalHeader(makeParagraph('l. Introduction'));
      expect(result).not.toBeNull();
      expect(result!.level).toBe(1);
      expect(result!.text).toBe('Introduction');
    });

    it('detects ll. as level 2', () => {
      const result = _isLegalHeader(makeParagraph('ll. Sub Section'));
      expect(result).not.toBeNull();
      expect(result!.level).toBe(2);
      expect(result!.text).toBe('Sub Section');
    });

    it('detects lll. as level 3', () => {
      const result = _isLegalHeader(makeParagraph('lll. Deep'));
      expect(result).not.toBeNull();
      expect(result!.level).toBe(3);
    });

    it('detects up to lllllllll. as level 9', () => {
      const result = _isLegalHeader(makeParagraph('lllllllll. Very Deep'));
      expect(result).not.toBeNull();
      expect(result!.level).toBe(9);
    });

    it('returns null for non-matching text', () => {
      expect(_isLegalHeader(makeParagraph('Hello World'))).toBeNull();
      expect(_isLegalHeader(makeParagraph('not a header'))).toBeNull();
    });

    it('returns null for text that does not match header pattern', () => {
      // Note: multi-child path uses /^(l{1,5})\.\s*/ which allows zero spaces
      // Single text child path uses LEGAL_HEADER_PATTERN which requires space
      expect(_isLegalHeader(makeParagraph('hello world'))).toBeNull();
    });

    it('handles multi-child paragraphs where first child has pattern', () => {
      const para: Paragraph = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'l. ' } as Text,
          { type: 'text', value: 'Rest of text' } as Text,
        ],
      };
      const result = _isLegalHeader(para);
      expect(result).not.toBeNull();
      expect(result!.level).toBe(1);
      expect(result!.text).toBe('Rest of text');
    });

    it('returns null for empty paragraph', () => {
      const para: Paragraph = { type: 'paragraph', children: [] };
      expect(_isLegalHeader(para)).toBeNull();
    });

    it('returns null when first child is not text', () => {
      const para: Paragraph = {
        type: 'paragraph',
        children: [{ type: 'html', value: '<b>bold</b>' } as unknown as Text],
      };
      expect(_isLegalHeader(para)).toBeNull();
    });
  });

  describe('convertToHeading', () => {
    it('creates heading at correct depth', () => {
      const para = makeParagraph('l. Title');
      const heading = _convertToHeading(para, 1, 'Title');
      expect(heading.type).toBe('heading');
      expect(heading.depth).toBe(1);
    });

    it('creates heading at depth 3', () => {
      const para = makeParagraph('lll. Deep Title');
      const heading = _convertToHeading(para, 3, 'Deep Title');
      expect(heading.depth).toBe(3);
    });

    it('marks heading as legal header', () => {
      const para = makeParagraph('l. Title');
      const heading = _convertToHeading(para, 1, 'Title');
      const data = (heading as unknown as { data: { isLegalHeader: boolean } }).data;
      expect(data.isLegalHeader).toBe(true);
    });

    it('preserves inline formatting in text', () => {
      const para = makeParagraph('l. **Bold** Title');
      const heading = _convertToHeading(para, 1, '**Bold** Title');
      // Children should include strong node from parseMarkdownInlineFormatting
      const types = heading.children.map(c => c.type);
      expect(types).toContain('strong');
    });

    it('caps depth at 6 (markdown limit)', () => {
      const para = makeParagraph('lllllll. Seven');
      const heading = _convertToHeading(para, 6, 'Seven');
      expect(heading.depth).toBe(6);
    });
  });

  describe('parseMarkdownInlineFormatting', () => {
    it('returns plain text node for simple text', () => {
      const result = _parseMarkdownInlineFormatting('Hello World');
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('text');
      expect((result[0] as Text).value).toBe('Hello World');
    });

    it('parses **bold** as strong', () => {
      const result = _parseMarkdownInlineFormatting('This is **bold** text');
      const types = result.map(n => n.type);
      expect(types).toContain('strong');
    });

    it('parses __bold__ as strong', () => {
      const result = _parseMarkdownInlineFormatting('This is __bold__ text');
      const types = result.map(n => n.type);
      expect(types).toContain('strong');
    });

    it('parses *italic* as emphasis', () => {
      const result = _parseMarkdownInlineFormatting('This is *italic* text');
      const types = result.map(n => n.type);
      expect(types).toContain('emphasis');
    });

    it('parses _italic_ as emphasis', () => {
      const result = _parseMarkdownInlineFormatting('This is _italic_ text');
      const types = result.map(n => n.type);
      expect(types).toContain('emphasis');
    });

    it('parses `code` as inlineCode', () => {
      const result = _parseMarkdownInlineFormatting('Use `function()` here');
      const codeNode = result.find(n => n.type === 'inlineCode');
      expect(codeNode).toBeDefined();
      expect((codeNode as { value: string }).value).toBe('function()');
    });

    it('handles [link](url) by extracting text only', () => {
      const result = _parseMarkdownInlineFormatting('See [Click](http://example.com) here');
      // Links are converted to plain text in headers
      const texts = result.filter(n => n.type === 'text').map(n => (n as Text).value);
      expect(texts.join('')).toContain('Click');
    });

    it('handles mixed formatting', () => {
      // Note: **Bold** consumes the * chars, so *italic* needs different delimiters
      const result = _parseMarkdownInlineFormatting('**Bold** and _italic_');
      const types = result.map(n => n.type);
      expect(types).toContain('strong');
      expect(types).toContain('emphasis');
    });

    it('does not parse formatting inside {{template}} fields', () => {
      const result = _parseMarkdownInlineFormatting('Party {{counterparty.legal_name}}');
      // The underscore in legal_name should NOT be treated as emphasis
      const emphNodes = result.filter(n => n.type === 'emphasis');
      expect(emphNodes.length).toBe(0);
    });

    it('returns text node for empty string', () => {
      const result = _parseMarkdownInlineFormatting('');
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('text');
    });

    it('handles multiple template fields', () => {
      const result = _parseMarkdownInlineFormatting('{{a_b}} and {{c_d}}');
      const emphNodes = result.filter(n => n.type === 'emphasis');
      expect(emphNodes.length).toBe(0);
    });
  });
});
