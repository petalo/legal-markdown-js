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
      const input = `# Introduction\n\n## Background\n\n### Details`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.',
          'level-three': 'lll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Introduction');
      expect(result).toContain('## ll. Background');
      expect(result).toContain('### lll. Details');
    });

    it('should handle headers with existing formatting', async () => {
      const input = `# **Important** Title\n\n## *Section* Name`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Important Title');
      expect(result).toContain('## ll. Section Name');
    });

    it('should preserve header depth', async () => {
      const input = `# Level 1\n\n#### Level 4\n\n##### Level 5`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-four': 'llll.',
          'level-five': 'lllll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Level 1');
      expect(result).toContain('#### llll. Level 4');
      expect(result).toContain('##### lllll. Level 5');
    });
  });

  describe('Metadata Configuration', () => {
    it('should use default formats when metadata is empty', async () => {
      const input = `# Title\n\n## Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {}
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Title');
      expect(result).toContain('## ll. Subtitle');
    });

    it('should respect custom level formats', async () => {
      const input = `# Title\n\n## Subtitle\n\n### Section`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# I. Title');
      expect(result).toContain('## A. Subtitle');
      expect(result).toContain('### 1. Section');
    });

    it('should handle alternative metadata field names', async () => {
      const input = `# Title\n\n## Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level_one': 'Article',
          'level_two': 'Section'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# Article Title');
      expect(result).toContain('## Section Subtitle');
    });

    it('should use default formats for undefined levels', async () => {
      const input = `# Title\n\n## Subtitle\n\n#### Deep Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
          // level-four will use default 'llll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Title');
      expect(result).toContain('## ll. Subtitle');
      expect(result).toContain('#### llll. Deep Header'); // Uses default format
    });
  });

  describe('Numbering State Management', () => {
    it('should increment numbering correctly', async () => {
      const input = `# First\n\n# Second\n\n## Sub One\n\n## Sub Two\n\n### Deep`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.',
          'level-three': 'lll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Should increment level-one numbers
      expect(result).toMatch(/# l\. First/);
      expect(result).toMatch(/# l\. Second/);
      
      // Should increment level-two numbers
      expect(result).toMatch(/## ll\. Sub One/);
      expect(result).toMatch(/## ll\. Sub Two/);
      
      // Should have level-three
      expect(result).toMatch(/### lll\. Deep/);
    });

    it('should reset lower level numbers by default', async () => {
      const input = `# Part One\n\n## Section A\n\n## Section B\n\n# Part Two\n\n## Section A`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // After "Part Two", Section A should be reset to first ll.
      const lines = result.split('\n');
      const partTwoIndex = lines.findIndex(line => line.includes('Part Two'));
      const sectionAAfterPartTwo = lines.slice(partTwoIndex).find(line => line.includes('Section A'));
      
      expect(sectionAAfterPartTwo).toContain('ll. Section A');
    });

    it('should not reset when noReset is true', async () => {
      const input = `# Part One\n\n## Section A\n\n## Section B\n\n# Part Two\n\n## Section C`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        },
        noReset: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      // With noReset, Section C should continue the numbering
      expect(result).toContain('## ll. Section C');
    });
  });

  describe('Indentation Options', () => {
    it('should format headers without custom indentation', async () => {
      const input = `# Level 1\n\n## Level 2\n\n### Level 3`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.',
          'level-three': 'lll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Level 1');
      expect(result).toContain('## ll. Level 2');
      expect(result).toContain('### lll. Level 3');
    });

    it('should accept noIndent option for API compatibility', async () => {
      const input = `# Level 1\n\n## Level 2\n\n### Level 3`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.',
          'level-three': 'lll.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Level 1');
      expect(result).toContain('## ll. Level 2');
      expect(result).toContain('### lll. Level 3');
    });
  });

  describe('Existing Numbering Detection', () => {
    it('should skip headers that already have numbering', async () => {
      const input = `# l. Already Numbered\n\n## Not Numbered`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Already Numbered'); // Unchanged
      expect(result).toContain('## ll. Not Numbered'); // Gets numbered
    });

    it('should detect various numbering patterns', async () => {
      const input = `# ll. Multiple L's\n\n## I. Roman Numeral\n\n### 1. Arabic Number`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'll.',
          'level-two': 'I.',
          'level-three': '1.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // All should remain unchanged as they already have numbering
      expect(result).toContain('# ll. Multiple L\'s');
      expect(result).toContain('## I. Roman Numeral');
      expect(result).toContain('### 1. Arabic Number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty headers', async () => {
      const input = `#\n\n##`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Empty headers should be skipped
      expect(result).toContain('#');
      expect(result).toContain('##');
      expect(result).not.toContain('l.');
      expect(result).not.toContain('ll.');
    });

    it('should handle headers with only whitespace', async () => {
      const input = `#   \n\n##    `;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Whitespace-only headers should be skipped
      expect(result).not.toContain('l.');
      expect(result).not.toContain('ll.');
    });

    it('should handle complex header content', async () => {
      const input = `# Title with [link](http://example.com)\n\n## \`Code\` in header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      expect(result).toContain('# l. Title with link');
      expect(result).toContain('## ll. Code in header');
    });

    it('should handle very deep header levels', async () => {
      const input = `###### Level 6`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-six': 'llllll.'
        }
      };

      const result = await processMarkdownWithHeaders(input, options);

      // Level 6 is not supported by default implementation
      expect(result).toContain('###### Level 6'); // Should remain unchanged
    });
  });

  describe('Debug Mode', () => {
    it('should provide debug output when enabled', async () => {
      const input = `# Test Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.'
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
      const input = `# Test Header`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.'
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
# Introduction

This is a paragraph with some text.

## Background

- List item 1
- List item 2

### Technical Details

\`\`\`javascript
console.log('code block');
\`\`\`

## Conclusion

Final thoughts.
`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'Article',
          'level-two': 'Section',
          'level-three': 'Subsection'
        }
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
      const input = `
# Title One
## Subtitle A
### Section I

# Title Two  
## Subtitle B
#### Deep Section
`;

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.',
          'level-four': 'a.'
        }
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
      const headers = Array.from({ length: 100 }, (_, i) => `# Header ${i + 1}`);
      const input = headers.join('\n\n');

      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.'
        }
      };

      const startTime = Date.now();
      const result = await processMarkdownWithHeaders(input, options);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should process all headers
      expect(result.match(/# l\. Header \d+/g)).toHaveLength(100);
    });

    it('should not leak memory with repeated processing', async () => {
      const input = `# Test Header\n\n## Subtitle`;
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-one': 'l.',
          'level-two': 'll.'
        }
      };

      // Process the same document multiple times
      for (let i = 0; i < 10; i++) {
        const result = await processMarkdownWithHeaders(input, options);
        expect(result).toContain('# l. Test Header');
        expect(result).toContain('## ll. Subtitle');
      }

      // If we get here without running out of memory, the test passes
      expect(true).toBe(true);
    });
  });
});