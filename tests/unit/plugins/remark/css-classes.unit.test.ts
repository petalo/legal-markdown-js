/**
 * Tests for CSS class generation in legal headers
 *
 * This test verifies that legal headers get the appropriate CSS classes
 * (legal-header-level-X) added by the remarkHeaders plugin.
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkLegalHeadersParser } from '../../../../src/plugins/remark/legal-headers-parser';
import { remarkHeaders } from '../../../../src/plugins/remark/headers';

describe('CSS Class Generation', () => {
  it('should add legal-header-level-1 class to level 1 headers', async () => {
    const input = `l. First Level Header

Content here.`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: { 'level-one': 'Article %n.' },
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Should contain the CSS class
    expect(html).toContain('legal-header-level-1');
    // Should be in an h1 tag with the class
    expect(html).toMatch(/<h1[^>]*class="[^"]*legal-header-level-1[^"]*"[^>]*>/);
  });

  it('should add legal-header-level-2 class to level 2 headers', async () => {
    const input = `ll. Second Level Header\n\nContent here.`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: { 'level-two': 'Section %n.' },
        noIndent: true, // Required for HTML output to avoid HTML node conversion
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Should contain the CSS class
    expect(html).toContain('legal-header-level-2');
    // Should be in an h2 tag with the class
    expect(html).toMatch(/<h2[^>]*class="[^"]*legal-header-level-2[^"]*"[^>]*>/);
  });

  it('should add legal-header-level-3 class to level 3 headers', async () => {
    const input = `lll. Third Level Header\n\nContent here.`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: { 'level-three': 'Subsection %n.' },
        noIndent: true, // Required for HTML output to avoid HTML node conversion
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    expect(html).toContain('legal-header-level-3');
    expect(html).toMatch(/<h3[^>]*class="[^"]*legal-header-level-3[^"]*"[^>]*>/);
  });

  it('should add appropriate classes to multiple header levels', async () => {
    const input = `l. First Article\n\nll. First Section\n\nlll. First Subsection\n\nll. Second Section`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
          'level-three': 'Subsection %n.',
        },
        noIndent: true, // Required for HTML output to avoid HTML node conversion
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Should have all three class types
    expect(html).toContain('legal-header-level-1');
    expect(html).toContain('legal-header-level-2');
    expect(html).toContain('legal-header-level-3');

    // Count occurrences
    const level1Count = (html.match(/legal-header-level-1/g) || []).length;
    const level2Count = (html.match(/legal-header-level-2/g) || []).length;
    const level3Count = (html.match(/legal-header-level-3/g) || []).length;

    expect(level1Count).toBe(1); // One l. header
    expect(level2Count).toBe(2); // Two ll. headers
    expect(level3Count).toBe(1); // One lll. header
  });

  it('should preserve classes in imported headers', async () => {
    // This test verifies that CSS classes work with the AST-based import system
    const input = `l. Main Article\n\nll. Main Section`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
        },
        noIndent: true, // Required for HTML output to avoid HTML node conversion
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Verify both headers have their classes
    expect(html).toMatch(/<h1[^>]*class="[^"]*legal-header-level-1[^"]*"[^>]*>/);
    expect(html).toMatch(/<h2[^>]*class="[^"]*legal-header-level-2[^"]*"[^>]*>/);
  });

  it('should handle headers up to level 9', async () => {
    const input = `l. Level 1\n\nll. Level 2\n\nlll. Level 3\n\nllll. Level 4\n\nlllll. Level 5\n\nllllll. Level 6\n\nlllllll. Level 7\n\nllllllll. Level 8\n\nlllllllll. Level 9`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: {
          'level-one': '%n.',
          'level-two': '%n.',
          'level-three': '%n.',
          'level-four': '%n.',
          'level-five': '%n.',
          'level-six': '%n.',
          'level-seven': '%n.',
          'level-eight': '%n.',
          'level-nine': '%n.',
        },
        noIndent: true, // Required for HTML output to avoid HTML node conversion
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Should have classes for all 9 levels
    for (let i = 1; i <= 9; i++) {
      expect(html).toContain(`legal-header-level-${i}`);
    }
  });

  it('should not add classes to non-legal headers', async () => {
    const input = `# Regular Markdown Header

This is not a legal header.

l. This is a legal header`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkHeaders, {
        metadata: { 'level-one': 'Article %n.' },
      })
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const html = String(result);

    // Should only have ONE occurrence of the CSS class (for the l. header)
    const classCount = (html.match(/legal-header-level-1/g) || []).length;
    expect(classCount).toBe(1);

    // Regular markdown header should NOT have the class
    expect(html).toMatch(/<h1>Regular Markdown Header<\/h1>/);
  });
});
