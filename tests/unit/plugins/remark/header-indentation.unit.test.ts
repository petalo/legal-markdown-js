/**
 * @fileoverview Unit Tests for Header Indentation Behavior
 *
 * Tests the noIndent option behavior for different output formats:
 * - noIndent: false for final markdown output (preserves indentation like original library)
 * - noIndent: true for HTML/PDF output (prevents indentation being interpreted as code)
 *
 * IMPORTANT NOTE: When using remark-stringify, leading spaces in header text are
 * preserved as regular spaces. This creates proper markdown indentation hierarchy.
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

describe('Header Indentation Behavior', () => {
  const testInput = `l. First Level Header

ll. Second Level Header

lll. Third Level Header`;

  const testOptions: RemarkHeadersOptions = {
    metadata: {
      'level-one': 'Article %n.',
      'level-two': 'Section %n.',
      'level-three': '(%n)'
    }
  };

  describe('Markdown Final Output (noIndent: false)', () => {
    it('should preserve indentation for markdown output like original library', async () => {
      const result = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: false
      });

      // Should contain indentation before level 2 and 3 headers
      // Note: remark-stringify preserves leading spaces as regular spaces
      expect(result).toContain('# Article 1. First Level Header');
      expect(result).toContain('##   Section 1. Second Level Header'); // 2 spaces
      expect(result).toContain('###     (1) Third Level Header'); // 4 spaces
    });

    it('should create proper markdown hierarchy with indentation', async () => {
      const result = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: false
      });

      const lines = result.split('\n').filter(line => line.trim().startsWith('#'));
      
      // Verify indentation pattern (remark-stringify preserves leading spaces)
      expect(lines[0]).toMatch(/^# Article 1\. First Level Header$/);
      expect(lines[1]).toMatch(/^##\s+Section 1\. Second Level Header$/); // Regular spaces
      expect(lines[2]).toMatch(/^###\s+\(1\) Third Level Header$/); // Regular spaces
    });
  });

  describe('HTML/PDF Final Output (noIndent: true)', () => {
    it('should not add indentation for HTML/PDF processing', async () => {
      const result = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: true
      });

      // Should NOT contain extra spaces (only standard markdown header syntax)
      expect(result).toContain('# Article 1. First Level Header');
      expect(result).toContain('## Section 1. Second Level Header');
      expect(result).toContain('### (1) Third Level Header');
      
      // Verify NO extra indentation spaces
      expect(result).not.toMatch(/##\s{2,}Section/);
      expect(result).not.toMatch(/###\s{2,}\(1\)/);
    });

    it('should create clean markdown suitable for HTML processing', async () => {
      const result = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: true
      });

      const lines = result.split('\n').filter(line => line.trim().startsWith('#'));
      
      // Verify clean markdown without indentation
      expect(lines[0]).toBe('# Article 1. First Level Header');
      expect(lines[1]).toBe('## Section 1. Second Level Header');
      expect(lines[2]).toBe('### (1) Third Level Header');
    });
  });

  describe('Default Behavior', () => {
    it('should default to noIndent: false when not specified', async () => {
      const result = await processMarkdownWithHeaders(testInput, testOptions);

      // Default should behave like noIndent: false (preserve indentation)
      // Note: remark-stringify preserves leading spaces as regular spaces
      expect(result).toContain('##   Section 1. Second Level Header'); // Should have indentation
      expect(result).toContain('###     (1) Third Level Header'); // Should have indentation
    });

    it('should be explicit about undefined noIndent behavior', async () => {
      const resultUndefined = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: undefined
      });

      const resultFalse = await processMarkdownWithHeaders(testInput, {
        ...testOptions,
        noIndent: false
      });

      // undefined should behave the same as false
      expect(resultUndefined).toBe(resultFalse);
    });
  });

  describe('Complex Document Structure', () => {
    const complexInput = `l. Introduction

This is some content.

ll. Background Information

More content here.

lll. Technical Details

Code example:
\`\`\`
console.log('test');
\`\`\`

ll. Conclusion

Final thoughts.`;

    it('should handle complex documents with noIndent: false', async () => {
      const result = await processMarkdownWithHeaders(complexInput, {
        ...testOptions,
        noIndent: false
      });

      // Content should be preserved
      expect(result).toContain('This is some content.');
      expect(result).toContain('console.log(\'test\');');
      
      // Headers should be indented (remark-stringify preserves leading spaces)
      expect(result).toMatch(/##\s+Section \d+\. Background Information/);
      expect(result).toMatch(/###\s+\(\d+\) Technical Details/);
      expect(result).toMatch(/##\s+Section \d+\. Conclusion/);
    });

    it('should handle complex documents with noIndent: true', async () => {
      const result = await processMarkdownWithHeaders(complexInput, {
        ...testOptions,
        noIndent: true
      });

      // Content should be preserved
      expect(result).toContain('This is some content.');
      expect(result).toContain('console.log(\'test\');');
      
      // Headers should NOT be indented
      expect(result).toMatch(/^## Section \d+\. Background Information$/m);
      expect(result).toMatch(/^### \(\d+\) Technical Details$/m);
      expect(result).toMatch(/^## Section \d+\. Conclusion$/m);
    });
  });

  describe('Integration with Full Processor', () => {
    it('should document the expected usage patterns', () => {
      // This test documents the expected usage patterns:
      
      // For CLI markdown output:
      // processLegalMarkdownWithRemark(input, { noIndent: false }) or default
      
      // For CLI HTML/PDF output:
      // processLegalMarkdownWithRemark(input, { noIndent: true })
      
      // For web playground:
      // - Markdown preview: { noIndent: false }
      // - HTML preview: { noIndent: true }
      
      // For unit tests reading/writing markdown:
      // processLegalMarkdownWithRemark(input, { noIndent: true })
      
      expect(true).toBe(true); // Documentation test
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested headers with both modes', async () => {
      const deepInput = `l. Level 1
ll. Level 2
lll. Level 3
llll. Level 4
lllll. Level 5`;

      const resultWithIndent = await processMarkdownWithHeaders(deepInput, {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.',
          'level-four': 'a.',
          'level-five': 'i.'
        },
        noIndent: false
      });

      const resultNoIndent = await processMarkdownWithHeaders(deepInput, {
        metadata: {
          'level-one': 'I.',
          'level-two': 'A.',
          'level-three': '1.',
          'level-four': 'a.',
          'level-five': 'i.'
        },
        noIndent: true
      });

      // With indentation (remark-stringify preserves leading spaces)
      expect(resultWithIndent).toMatch(/####\s+a\. Level 4/);
      expect(resultWithIndent).toMatch(/#####\s+i\. Level 5/);

      // Without indentation
      expect(resultNoIndent).toMatch(/^#### a\. Level 4$/m);
      expect(resultNoIndent).toMatch(/^##### i\. Level 5$/m);
    });

    it('should not affect non-header content', async () => {
      const mixedInput = `l. Header

This is a paragraph.

- List item 1
- List item 2

ll. Another Header

More content.`;

      const resultWithIndent = await processMarkdownWithHeaders(mixedInput, {
        ...testOptions,
        noIndent: false
      });

      const resultNoIndent = await processMarkdownWithHeaders(mixedInput, {
        ...testOptions,
        noIndent: true
      });

      // Non-header content should be identical
      expect(resultWithIndent).toContain('This is a paragraph.');
      expect(resultWithIndent).toContain('- List item 1');
      expect(resultNoIndent).toContain('This is a paragraph.');
      expect(resultNoIndent).toContain('- List item 1');
    });
  });
});