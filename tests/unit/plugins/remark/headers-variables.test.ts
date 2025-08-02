/**
 * @fileoverview Unit Tests for Header Variables System
 *
 * Tests for the new header variable system with %n, %A, %a, %R, %r, %l1, %l2, etc.
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkHeaders, RemarkHeadersOptions } from '../../../../src/plugins/remark/headers';
import { remarkLegalHeadersParser } from '../../../../src/plugins/remark/legal-headers-parser';

/**
 * Helper function to process markdown with headers plugin
 */
async function processMarkdownWithHeaders(
  markdown: string,
  options: RemarkHeadersOptions
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkLegalHeadersParser)
    .use(remarkHeaders, options)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      incrementListMarker: false,
    });

  const result = await processor.process(markdown);
  return result.toString();
}

describe('Header Variables System', () => {
  describe('Basic Numeric Variables', () => {
    it('should handle %n (current number)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '%n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article 1. First Header');
      expect(result).toContain('## Section 1. Second Header');
      expect(result).toContain('### 1. Third Header');
    });
  });

  describe('Alphabetic Variables', () => {
    it('should handle %A (uppercase letters)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Part %A:',
          'level-2': 'Chapter %A:',
          'level-3': 'Section %A:'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Part A: First Header');
      expect(result).toContain('## Chapter A: Second Header');
      expect(result).toContain('### Section A: Third Header');
    });

    it('should handle %a (lowercase letters)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Section %a)',
          'level-2': 'Subsection (%a)',
          'level-3': '(%a)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Section a) First Header');
      expect(result).toContain('## Subsection (a) Second Header');
      expect(result).toContain('### (a) Third Header');
    });

    it('should handle %c (lowercase letters - alias for %a)', async () => {
      const input = `l. First Header
ll. Second Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Part %c:',
          'level-2': '(%c)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Part a: First Header');
      expect(result).toContain('## (a) Second Header');
    });
  });

  describe('Roman Numeral Variables', () => {
    it('should handle %R (uppercase roman numerals)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Part %R:',
          'level-2': 'Chapter %R:',
          'level-3': '%R.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Part I: First Header');
      expect(result).toContain('## Chapter I: Second Header');
      expect(result).toContain('### I. Third Header');
    });

    it('should handle %r (lowercase roman numerals)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Section %r:',
          'level-2': '(%r)',
          'level-3': '%r.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Section i: First Header');
      expect(result).toContain('## (i) Second Header');
      expect(result).toContain('### i. Third Header');
    });
  });

  describe('Level Reference Variables', () => {
    it('should handle %l1, %l2, %l3, etc. (specific level references)', async () => {
      const input = `l. First Level
ll. Second Level
lll. Third Level`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %l1.%n.',
          'level-3': 'Subsection %l1.%l2.%n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article 1. First Level');
      expect(result).toContain('## Section 1.1. Second Level');
      expect(result).toContain('### Subsection 1.1.1. Third Level');
    });

    it('should handle multiple instances of same level reference', async () => {
      const input = `l. First
ll. Second
lll. Third
ll. Fourth`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%n.',
          'level-2': '%l1.%n.',
          'level-3': '%l1.%l2.%n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 1. First');
      expect(result).toContain('## 1.1. Second');
      expect(result).toContain('### 1.1.1. Third');
      expect(result).toContain('## 1.2. Fourth'); // Level 2 incremented, level 3 reset
    });
  });

  describe('Default Header Patterns', () => {
    it('should use undefined templates when no metadata provided', async () => {
      const input = `l. Level One
ll. Level Two
lll. Level Three
llll. Level Four
lllll. Level Five
llllll. Level Six
lllllll. Level Seven
llllllll. Level Eight
lllllllll. Level Nine`;
      
      const options: RemarkHeadersOptions = {
        metadata: {}, // No definitions - should use undefined templates
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# {{undefined-level-1}} Level One');
      expect(result).toContain('## {{undefined-level-2}} Level Two');
      expect(result).toContain('### {{undefined-level-3}} Level Three');
      expect(result).toContain('#### {{undefined-level-4}} Level Four');
      expect(result).toContain('##### {{undefined-level-5}} Level Five');
      expect(result).toContain('###### {{undefined-level-6}} Level Six');
      // Note: Markdown only supports 6 levels (h1-h6), so levels 7-9 also use h6
      expect(result).toContain('###### {{undefined-level-7}} Level Seven'); // Capped at h6
      expect(result).toContain('###### {{undefined-level-8}} Level Eight'); // Capped at h6  
      expect(result).toContain('###### {{undefined-level-9}} Level Nine'); // Capped at h6
    });
  });

  describe('Fallback Variable %o', () => {
    it('should handle %o with fallback to %n', async () => {
      const input = `l. First Header
ll. Second Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Section %o:',
          'level-2': '(%o)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Section 1: First Header');  // %o falls back to %n
      expect(result).toContain('## (1) Second Header');       // %o falls back to %n
    });
  });

  describe('Complex Combinations', () => {
    it('should handle complex variable combinations', async () => {
      const input = `l. Contract Terms
ll. Payment Terms
lll. Late Payment
ll. Delivery Terms
lll. Shipping
llll. International Shipping`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %R:',
          'level-2': 'Section %l1.%n',
          'level-3': '(%A)',
          'level-4': '(%l1.%l2.%l3.%n)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article I: Contract Terms');
      expect(result).toContain('## Section 1.1 Payment Terms');
      expect(result).toContain('### (A) Late Payment');
      expect(result).toContain('## Section 1.2 Delivery Terms');
      expect(result).toContain('### (A) Shipping');
      expect(result).toContain('#### (1.2.1.1) International Shipping');
    });
  });

});