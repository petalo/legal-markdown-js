/**
 * @fileoverview Comprehensive tests for legal-headers-parser remark plugin
 *
 * This file provides test coverage for legal-headers-parser.ts, which is
 * important for converting legal header syntax (l., ll., lll.) to proper
 * markdown headings in legal documents.
 *
 * Test Coverage:
 * - Single-level headers (l.)
 * - Multi-level headers (ll., lll., llll., etc.)
 * - Headers with markdown formatting (bold, italic)
 * - Headers with template fields {{name}}
 * - Headers with HTML content (field tracking spans)
 * - Multi-line paragraphs with legal headers
 * - Complex paragraphs with mixed content
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkLegalHeadersParser from '../../../../src/plugins/remark/legal-headers-parser';

describe('Legal Headers Parser Plugin', () => {
  // ==========================================================================
  // SINGLE-LEVEL HEADERS
  // ==========================================================================

  describe('Single-level headers', () => {
    it('should convert l. to level 1 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. First Level Header');
      expect(result.toString()).toContain('# First Level Header');
    });

    it('should preserve heading text exactly', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Introduction');
      expect(result.toString()).toContain('Introduction');
    });

    it('should handle headers with extra whitespace', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l.    Header with spaces');
      expect(result.toString()).toContain('# Header with spaces');
    });

    it('should handle headers at different positions in document', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `
Some intro text.

l. First Header

Some content.

l. Second Header
`;

      const result = await processor.process(markdown);
      expect(result.toString()).toContain('# First Header');
      expect(result.toString()).toContain('# Second Header');
    });
  });

  // ==========================================================================
  // MULTI-LEVEL HEADERS
  // ==========================================================================

  describe('Multi-level headers', () => {
    it('should convert ll. to level 2 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('ll. Second Level Header');
      expect(result.toString()).toContain('## Second Level Header');
    });

    it('should convert lll. to level 3 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('lll. Third Level Header');
      expect(result.toString()).toContain('### Third Level Header');
    });

    it('should convert llll. to level 4 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('llll. Fourth Level Header');
      expect(result.toString()).toContain('#### Fourth Level Header');
    });

    it('should convert lllll. to level 5 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('lllll. Fifth Level Header');
      expect(result.toString()).toContain('##### Fifth Level Header');
    });

    it('should convert llllll. to level 6 heading', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('llllll. Sixth Level Header');
      expect(result.toString()).toContain('###### Sixth Level Header');
    });

    it('should handle mixed header levels in same document', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `
l. Title
ll. Subtitle
lll. Section
ll. Another Subtitle
`;

      const result = await processor.process(markdown);
      expect(result.toString()).toContain('# Title');
      expect(result.toString()).toContain('## Subtitle');
      expect(result.toString()).toContain('### Section');
      expect(result.toString()).toContain('## Another Subtitle');
    });
  });

  // ==========================================================================
  // HEADERS WITH MARKDOWN FORMATTING
  // ==========================================================================

  describe('Headers with markdown formatting', () => {
    it('should preserve bold text in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with **bold** text');
      expect(result.toString()).toContain('# Header with **bold** text');
    });

    it('should preserve italic text in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with *italic* text');
      expect(result.toString()).toContain('# Header with *italic* text');
    });

    it('should preserve inline code in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with `code` snippet');
      expect(result.toString()).toContain('# Header with `code` snippet');
    });

    it('should handle mixed formatting in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with **bold** and *italic*');
      expect(result.toString()).toContain('bold');
      expect(result.toString()).toContain('italic');
    });
  });

  // ==========================================================================
  // HEADERS WITH TEMPLATE FIELDS
  // ==========================================================================

  describe('Headers with template fields', () => {
    it('should preserve template field patterns in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Contract for {{client_name}}');
      expect(result.toString()).toContain('# Contract for {{client_name}}');
    });

    it('should handle multiple template fields in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. {{party_a}} and {{party_b}}');
      expect(result.toString()).toContain('{{party_a}}');
      expect(result.toString()).toContain('{{party_b}}');
    });

    it('should preserve template fields with underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('ll. Party {{counterparty.legal_name}}');
      expect(result.toString()).toContain('{{counterparty.legal_name}}');
    });
  });

  // ==========================================================================
  // HEADERS WITH HTML CONTENT
  // ==========================================================================

  describe('Headers with HTML content', () => {
    it('should preserve HTML spans in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. <span class="legal-field">Client</span>');
      expect(result.toString()).toContain('# <span class="legal-field">Client</span>');
    });

    it('should handle field tracking spans', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process(
        'l. <span class="legal-field imported-value" data-field="name">John Doe</span>'
      );
      expect(result.toString()).toContain('data-field="name"');
      expect(result.toString()).toContain('John Doe');
    });
  });

  // ==========================================================================
  // MULTI-LINE PARAGRAPHS WITH LEGAL HEADERS
  // ==========================================================================

  describe('Multi-line paragraphs with legal headers', () => {
    it('should split paragraphs containing multiple headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `l. First Header
ll. Second Header`;

      const result = await processor.process(markdown);
      expect(result.toString()).toContain('# First Header');
      expect(result.toString()).toContain('## Second Header');
    });

    it('should preserve non-header lines in multi-line paragraphs', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `Some text
l. Header
More text`;

      const result = await processor.process(markdown);
      expect(result.toString()).toContain('Some text');
      expect(result.toString()).toContain('# Header');
      expect(result.toString()).toContain('More text');
    });
  });

  // ==========================================================================
  // COMPLEX PARAGRAPHS
  // ==========================================================================

  describe('Complex paragraphs', () => {
    it('should handle paragraphs with multiple children', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with **emphasis** and _italic_');
      expect(result.toString()).toContain('Header with');
    });

    it('should handle headers with links', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with [link](http://example.com)');
      expect(result.toString()).toContain('# Header with');
      expect(result.toString()).toContain('link');
    });
  });

  // ==========================================================================
  // NEGATIVE CASES - SHOULD NOT CONVERT
  // ==========================================================================

  describe('Negative cases', () => {
    it('should not convert text without l. prefix', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('This is not a header');
      expect(result.toString()).not.toContain('#');
      expect(result.toString()).toContain('This is not a header');
    });

    it('should not convert l. in the middle of text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('This has l. in the middle');
      expect(result.toString()).not.toContain('# This has');
      expect(result.toString()).toContain('l. in the middle');
    });

    it('should not convert l without dot', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l Not a header');
      expect(result.toString()).not.toContain('#');
      expect(result.toString()).toContain('l Not a header');
    });

    it('should not convert ll without dot', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('ll Not a header');
      expect(result.toString()).not.toContain('##');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge cases', () => {
    it('should handle empty header text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. ');
      // Should create heading even if empty
      expect(result.toString()).toContain('#');
    });

    it('should handle very long header text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const longText = 'A'.repeat(200);
      const result = await processor.process(`l. ${longText}`);
      expect(result.toString()).toContain(longText);
    });

    it('should handle headers with special characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with @#$%^&*() characters');
      expect(result.toString()).toContain('# Header with @#$%^&*() characters');
    });

    it('should handle headers with Unicode characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Header with 中文 and émojis 🎉');
      expect(result.toString()).toContain('中文');
      expect(result.toString()).toContain('🎉');
    });

    it('should handle headers with numbers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const result = await processor.process('l. Section 1.2.3');
      expect(result.toString()).toContain('# Section 1.2.3');
    });
  });

  // ==========================================================================
  // INTEGRATION WITH DOCUMENT STRUCTURE
  // ==========================================================================

  describe('Integration with document structure', () => {
    it('should work with complete legal document', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `
l. Contract Agreement

This is the introduction paragraph.

ll. Definitions

Some definitions here.

lll. Term Definition 1

Definition text.

lll. Term Definition 2

More definition text.

ll. Terms and Conditions

The terms.
`;

      const result = await processor.process(markdown);

      expect(result.toString()).toContain('# Contract Agreement');
      expect(result.toString()).toContain('## Definitions');
      expect(result.toString()).toContain('### Term Definition 1');
      expect(result.toString()).toContain('### Term Definition 2');
      expect(result.toString()).toContain('## Terms and Conditions');
      expect(result.toString()).toContain('introduction paragraph');
    });

    it('should preserve regular markdown headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const markdown = `
# Regular Markdown Header

l. Legal Header

## Another Regular Header
`;

      const result = await processor.process(markdown);

      expect(result.toString()).toContain('# Regular Markdown Header');
      expect(result.toString()).toContain('# Legal Header');
      expect(result.toString()).toContain('## Another Regular Header');
    });
  });

  // ==========================================================================
  // DEBUG MODE
  // ==========================================================================

  describe('Debug mode', () => {
    it('should accept debug option', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser, { debug: true })
        .use(remarkStringify);

      const result = await processor.process('l. Test Header');
      expect(result.toString()).toContain('# Test Header');
    });

    it('should work without debug option', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser, { debug: false })
        .use(remarkStringify);

      const result = await processor.process('l. Test Header');
      expect(result.toString()).toContain('# Test Header');
    });
  });

  // ==========================================================================
  // AST NODE MARKING
  // ==========================================================================

  describe('AST node marking', () => {
    it('should mark converted headers in AST', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser);

      const tree = processor.parse('l. Test Header');
      const result = await processor.run(tree);

      // Find the heading node
      const heading = result.children.find((node: any) => node.type === 'heading');

      expect(heading).toBeDefined();
      expect(heading.data).toBeDefined();
      expect(heading.data.isLegalHeader).toBe(true);
    });

    it('should set correct heading depth', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser);

      const tree = processor.parse('lll. Test Header');
      const result = await processor.run(tree);

      const heading = result.children.find((node: any) => node.type === 'heading');

      expect(heading).toBeDefined();
      expect(heading.depth).toBe(3);
    });
  });

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  describe('Performance', () => {
    it('should handle documents with many headers efficiently', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      // Generate document with 100 headers
      const headers = Array.from({ length: 100 }, (_, i) =>
        `l${'l'.repeat(i % 5)}. Header ${i + 1}`
      ).join('\n\n');

      const start = Date.now();
      const result = await processor.process(headers);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(result.toString()).toContain('# Header 1');
      expect(result.toString()).toContain('Header 100');
    });
  });
});
