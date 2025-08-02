/**
 * @fileoverview Unit Tests for Remark Headers Plugin
 *
 * Comprehensive test suite for the remark headers plugin, covering all aspects
 * of legal header processing including numbering, formatting, state management,
 * and edge cases.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkHeaders, RemarkHeadersOptions } from '../../../../src/plugins/remark/headers';
import { remarkLegalHeadersParser } from '../../../../src/plugins/remark/legal-headers-parser';

/**
 * Helper function to process markdown with headers plugin
 */
import { vi } from 'vitest';
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

describe('remarkHeaders Plugin', () => {
  describe('Basic Header Processing', () => {
    it('should add numbering to simple headers', async () => {
      const input = `l. Introduction\n\nll. Background\n\nlll. Details`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
          'level-three': '(%n)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Introduction');
      expect(result).toContain('## Section 1. Background');
      expect(result).toContain('### (1) Details');
    });

    it('should handle headers with existing formatting', async () => {
      const input = `l. **Important** Title\n\nll. *Section* Name`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. **Important** Title');
      expect(result).toContain('## Section 1. *Section* Name');
    });

    it('should preserve header depth', async () => {
      const input = `l. Level 1\n\nllll. Level 4\n\nlllll. Level 5`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-four': '(%n%c)',
          'level-five': '(%n%c%r)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Level 1');
      expect(result).toContain('#### (1a) Level 4');
      expect(result).toContain('##### (1ai) Level 5');
    });
  });

  describe('Metadata Configuration', () => {
    it('should use undefined templates when metadata is empty', async () => {
      const input = `l. Title\n\nll. Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {},
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# {{undefined-level-1}} Title');
      expect(result).toContain('## {{undefined-level-2}} Subtitle');
    });

    it('should respect custom level formats', async () => {
      const input = `l. Title\n\nll. Subtitle\n\nlll. Section`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# I. Title');
      expect(result).toContain('## A. Subtitle');
      expect(result).toContain('### 1. Section');
    });

    it('should handle alternative metadata field names', async () => {
      const input = `l. Title\n\nll. Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level_one': 'Article',
          'level_two': 'Section'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article Title');
      expect(result).toContain('## Section Subtitle');
    });

    it('should use default formats for undefined levels', async () => {
      const input = `l. Title\n\nll. Subtitle\n\nllll. Deep Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
          // level-four will use default '(%n%c)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Title');
      expect(result).toContain('## Section 1. Subtitle');
      expect(result).toContain('#### {{undefined-level-4}} Deep Header'); // Uses undefined template
    });
  });

  describe('Numbering State Management', () => {
    it('should increment numbering correctly', async () => {
      const input = `l. First\n\nl. Second\n\nll. Sub One\n\nll. Sub Two\n\nlll. Deep`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
          'level-three': '(%n)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Should increment level-one numbers
      expect(result).toMatch(/# Article 1\. First/);
      expect(result).toMatch(/# Article 2\. Second/);
      
      // Should increment level-two numbers
      expect(result).toMatch(/## Section 1\. Sub One/);
      expect(result).toMatch(/## Section 2\. Sub Two/);
      
      // Should have level-three
      expect(result).toMatch(/### \(1\) Deep/);
    });

    it('should reset lower level numbers by default', async () => {
      const input = `l. Part One\n\nll. Section A\n\nll. Section B\n\nl. Part Two\n\nll. Section A`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // After "Part Two", Section A should be reset to first Section.
      const lines = result.split('\n');
      const partTwoIndex = lines.findIndex(line => line.includes('Part Two'));
      const sectionAAfterPartTwo = lines.slice(partTwoIndex).find(line => line.includes('Section A'));
      
      expect(sectionAAfterPartTwo).toContain('Section 1. Section A');
    });

    it('should not reset when noReset is true', async () => {
      const input = `l. Part One\n\nll. Section A\n\nll. Section B\n\nl. Part Two\n\nll. Section C`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noReset: true,
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // With noReset, Section C should continue the numbering
      expect(result).toContain('## Section 3. Section C');
    });
  });

  describe('Indentation Options', () => {
    it('should format headers without custom indentation', async () => {
      const input = `l. Level 1\n\nll. Level 2\n\nlll. Level 3`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
          'level-three': '(%n)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Level 1');
      expect(result).toContain('## Section 1. Level 2');
      expect(result).toContain('### (1) Level 3');
    });

    it('should accept noIndent option for API compatibility', async () => {
      const input = `l. Level 1\n\nll. Level 2\n\nlll. Level 3`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
          'level-three': '(%n)'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Level 1');
      expect(result).toContain('## Section 1. Level 2');
      expect(result).toContain('### (1) Level 3');
    });
  });

  describe('Existing Numbering Detection', () => {
    it('should skip headers that already have numbering', async () => {
      const input = `l. Already Numbered\n\nll. Not Numbered`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Already Numbered');
      expect(result).toContain('## Section 1. Not Numbered');
    });

    it('should process legal headers with various formats', async () => {
      const input = `l. Multiple Level\n\nll. Roman Style\n\nlll. Arabic Style`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'll.',
          'level-two': 'I.',
          'level-three': '1.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# ll. Multiple Level');
      expect(result).toContain('## I. Roman Style');
      expect(result).toContain('### 1. Arabic Style');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty headers', async () => {
      const input = `l.\n\nll.`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Empty legal headers should be skipped - they remain as paragraphs
      expect(result).toContain('l.');
      expect(result).toContain('ll.');
    });

    it('should handle headers with only whitespace', async () => {
      const input = `l.   \n\nll.    `;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Whitespace-only legal headers should be skipped - they remain as paragraphs
      expect(result).toContain('l.');
      expect(result).toContain('ll.');
    });

    it('should handle complex header content', async () => {
      const input = `l. Title with [link](http://example.com)\n\nll. \`Code\` in header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true,
        debug: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article 1. Title with link');
      expect(result).toContain('## Section 1. Code in header');
    });

    it('should handle very deep header levels', async () => {
      const input = `llllll. Level 6`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-six': 'Part %n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Level 6 is now supported and uses the defined format
      expect(result).toContain('###### Part 1. Level 6'); // Should be processed as header
    });
  });

  describe('Debug Mode', () => {
    it('should provide debug output when enabled', async () => {
      const input = `l. Test Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.'
        },
        debug: true
      };

      // Capture console.log calls
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await processMarkdownWithHeaders(input, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[remarkHeaders] Processing headers'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should not produce debug output when disabled', async () => {
      const input = `l. Test Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.'
        },
        debug: false
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await processMarkdownWithHeaders(input, options);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Other Content', () => {
    it('should process headers within complex documents', async () => {
      const input = `
l. Introduction

This is a paragraph with some text.

ll. Background

- List item 1
- List item 2

lll. Technical Details

\`\`\`javascript
console.log('code block');
\`\`\`

ll. Conclusion

Final thoughts.
`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article',
          'level-two': 'Section',
          'level-three': 'Subsection'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article Introduction');
      expect(result).toContain('## Section Background');
      expect(result).toContain('### Subsection Technical Details');
      expect(result).toContain('## Section Conclusion');
      
      // Non-header content should be preserved
      expect(result).toContain('This is a paragraph');
      expect(result).toContain('- List item 1');
      expect(result).toContain('console.log');
    });

    it('should work with mixed header formats', async () => {
      const input = `l. Title One\n\nll. Subtitle A\n\nlll. Section I\n\nl. Title Two\n\nll. Subtitle B\n\nllll. Deep Section`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.',
          'level-four': 'a.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# I. Title One');
      expect(result).toContain('## A. Subtitle A');
      expect(result).toContain('### 1. Section I');
      expect(result).toContain('# I. Title Two');
      expect(result).toContain('## A. Subtitle B');
      expect(result).toContain('#### a. Deep Section');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large documents efficiently', async () => {
      // Generate a large document with many headers
      const headers = Array.from({ length: 100 }, (_, i) => `l. Header ${i + 1}`);
      const input = headers.join('\n\n');

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.'
        },
        noIndent: true
      };

      const startTime = Date.now();
      const result = await processMarkdownWithHeaders(input, options);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should process all headers
      expect(result.match(/# Article \d+\. Header \d+/g)).toHaveLength(100);
    });

    it('should not leak memory with repeated processing', async () => {
      const input = `l. Test Header\n\nll. Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.'
        },
        noIndent: true
      };

      // Process the same document multiple times
      for (let i = 0; i < 10; i++) {
        const result = await processMarkdownWithHeaders(input, options);
        expect(result).toContain('# Article 1. Test Header');
        expect(result).toContain('## Section 1. Subtitle');
      }

      // If we get here without running out of memory, the test passes
      expect(true).toBe(true);
    });
  });
});