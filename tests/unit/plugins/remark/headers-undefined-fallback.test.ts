/**
 * @fileoverview Unit Tests for Headers Undefined Fallback
 *
 * Tests for the new behavior where undefined header levels render as {{undefined-level-n}} 
 * instead of hardcoded fallback values.
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

describe('Headers Undefined Fallback', () => {
  describe('Basic Undefined Fallback Behavior', () => {
    it('should render {{undefined-level-n}} for undefined header levels', async () => {
      const input = `l. Defined Level
ll. Undefined Level
lll. Another Undefined Level`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.'
          // level-2 and level-3 not defined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article 1. Defined Level');
      expect(result).toContain('## {{undefined-level-2}} Undefined Level');
      expect(result).toContain('### {{undefined-level-3}} Another Undefined Level');
    });

    it('should handle mixed defined and undefined levels', async () => {
      const input = `l. Level One

ll. Level Two  

lll. Level Three

llll. Level Four

lllll. Level Five`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Chapter %n:',
          'level-3': 'Section %n.',
          'level-5': '(%A)'
          // level-2 and level-4 not defined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Chapter 1: Level One');
      expect(result).toContain('## {{undefined-level-2}} Level Two');
      expect(result).toContain('### Section 1. Level Three');
      expect(result).toContain('#### {{undefined-level-4}} Level Four');
      expect(result).toContain('##### (A) Level Five');
    });

    it('should handle all undefined levels', async () => {
      const input = `l. Level One
ll. Level Two
lll. Level Three`;

      const options: RemarkHeadersOptions = {
        metadata: {
          // No level definitions
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# {{undefined-level-1}} Level One');
      expect(result).toContain('## {{undefined-level-2}} Level Two');
      expect(result).toContain('### {{undefined-level-3}} Level Three');
    });
  });

  describe('Extended Level Support (1-9)', () => {
    it('should handle undefined levels up to level 9', async () => {
      const input = `l. Level 1
ll. Level 2
lll. Level 3
llll. Level 4
lllll. Level 5
llllll. Level 6
lllllll. Level 7
llllllll. Level 8
lllllllll. Level 9`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.',
          'level-5': '(%A)',
          'level-9': 'Appendix %n.'
          // Other levels undefined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article 1. Level 1');
      expect(result).toContain('## {{undefined-level-2}} Level 2');
      expect(result).toContain('### {{undefined-level-3}} Level 3');
      expect(result).toContain('#### {{undefined-level-4}} Level 4');
      expect(result).toContain('##### (A) Level 5');
      expect(result).toContain('###### {{undefined-level-6}} Level 6');
      expect(result).toContain('###### {{undefined-level-7}} Level 7'); // Capped at h6
      expect(result).toContain('###### {{undefined-level-8}} Level 8'); // Capped at h6
      expect(result).toContain('###### Appendix 1. Level 9'); // Capped at h6
    });
  });

  describe('Legacy Compatibility', () => {
    it('should handle alternative metadata field names', async () => {
      const input = `l. Test One
ll. Test Two
lll. Test Three`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level_one': 'Part %n:',
          'level-three': 'Subsection %n.'
          // level-two undefined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Part 1: Test One');
      expect(result).toContain('## {{undefined-level-2}} Test Two');
      expect(result).toContain('### Subsection 1. Test Three');
    });

    it('should prioritize dash-based keys over underscore keys', async () => {
      const input = `l. Priority Test
ll. Priority Test Two`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Dash-Based %n.',
          'level_one': 'Underscore-Based %n.',
          // level-2 undefined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Dash-Based 1. Priority Test');
      expect(result).toContain('## {{undefined-level-2}} Priority Test Two');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle numbering state with undefined levels', async () => {
      const input = `l. First Main
ll. Sub One
ll. Sub Two
l. Second Main
ll. Sub Three`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.'
          // level-2 undefined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      // Should still track state correctly even with undefined formats
      expect(result).toContain('# Article 1. First Main');
      expect(result).toContain('## {{undefined-level-2}} Sub One');
      expect(result).toContain('## {{undefined-level-2}} Sub Two');
      expect(result).toContain('# Article 2. Second Main');
      expect(result).toContain('## {{undefined-level-2}} Sub Three');
    });

    it('should handle undefined levels with noReset option', async () => {
      const input = `l. First Main
ll. Sub One
ll. Sub Two
l. Second Main
ll. Sub Three`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.'
          // level-2 undefined
        },
        noReset: true,
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      // With noReset, level-2 should continue numbering
      expect(result).toContain('# Article 1. First Main');
      expect(result).toContain('## {{undefined-level-2}} Sub One');
      expect(result).toContain('## {{undefined-level-2}} Sub Two');
      expect(result).toContain('# Article 2. Second Main');
      expect(result).toContain('## {{undefined-level-2}} Sub Three');
    });

    it('should work with header variables in defined levels mixed with undefined', async () => {
      const input = `l. Main Section
ll. Undefined Sub
lll. Defined Sub with Variables`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Chapter %n:',
          'level-3': '%l1.%n.%A'
          // level-2 undefined
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Chapter 1: Main Section');
      expect(result).toContain('## {{undefined-level-2}} Undefined Sub');
      expect(result).toContain('### 1.1.A Defined Sub with Variables');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metadata object', async () => {
      const input = `l. Header One`;

      const options: RemarkHeadersOptions = {
        metadata: {},
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# {{undefined-level-1}} Header One');
    });

    it('should handle headers that bypass legal syntax', async () => {
      // Regular markdown headers are not processed by the legal headers plugin
      const input = `l. Legal Header`;

      const options: RemarkHeadersOptions = {
        metadata: {},
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# {{undefined-level-1}} Legal Header');
    });

    it('should handle whitespace in header text with undefined levels', async () => {
      const input = `l.   Spaced Header   

ll.    Another Spaced Header    `;

      const options: RemarkHeadersOptions = {
        metadata: {},
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# {{undefined-level-1}} Spaced Header');
      expect(result).toContain('## {{undefined-level-2}} Another Spaced Header');
    });
  });
});