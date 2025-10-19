/**
 * Contract tests for HTML Generator
 *
 * These tests verify the contractual behavior of the HtmlGenerator,
 * specifically that it:
 * 1. Only accepts Markdown input (not HTML)
 * 2. Produces HTML output
 * 3. Fails with descriptive errors when contracts are violated
 *
 * These are separate from functional tests to clearly document
 * the expected input/output types and catch type mismatches.
 *
 * @module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HtmlGenerator } from '../../../../src/extensions/generators/html-generator';
import { asMarkdown, type MarkdownString } from '../../../../src/types/content-formats';

describe('HtmlGenerator - Contract Tests', () => {
  let generator: HtmlGenerator;

  beforeEach(() => {
    generator = new HtmlGenerator();
  });

  describe('Input Contract: Must receive Markdown', () => {
    it('should accept valid Markdown input', async () => {
      const markdownInput: MarkdownString = asMarkdown('# Title\n\nParagraph with **bold** text.');

      const result = await generator.generateHtml(markdownInput, {});

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Paragraph with <strong>bold</strong> text.</p>');
    });

    it('should reject HTML document input', async () => {
      const htmlInput = '<html><body><h1>Title</h1></body></html>';

      await expect(
        generator.generateHtml(htmlInput as MarkdownString, {})
      ).rejects.toThrow(/expects Markdown input, but received HTML/);
    });

    it('should accept Markdown with embedded HTML tags (valid)', async () => {
      // Markdown can contain HTML tags - this is valid and should be accepted
      const markdownWithHtml = asMarkdown('<div class="container">\n\n# Title\n\nContent</div>');

      const result = await generator.generateHtml(markdownWithHtml, {});

      // Should process the Markdown and preserve the HTML
      expect(result).toContain('container');
      expect(result).toContain('Title');
    });

    it('should provide helpful error message with content preview', async () => {
      const htmlInput = '<html><body>This is a long HTML document with lots of content...</body></html>';

      try {
        await generator.generateHtml(htmlInput as MarkdownString, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('expects Markdown input');
          expect(error.message).toContain('Content preview:');
          expect(error.message).toContain('format-generator should pass processedResult.content');
        }
      }
    });

    it('should accept Markdown with inline code that looks like HTML', async () => {
      // This is valid Markdown with backtick-escaped code, not actual HTML
      const markdownInput = asMarkdown('Use `<div>` tags in your HTML.');

      const result = await generator.generateHtml(markdownInput, {});

      expect(result).toContain('<code>');
      expect(result).toContain('&lt;div&gt;'); // Should be escaped inside code tags
    });

    it('should accept Markdown with code blocks containing HTML', async () => {
      const markdownWithCodeBlock = asMarkdown(
        '```html\n<div class="example">\n  <p>Example</p>\n</div>\n```'
      );

      const result = await generator.generateHtml(markdownWithCodeBlock, {});

      // Code block content should be preserved
      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
    });
  });

  describe('Output Contract: Must produce HTML', () => {
    it('should return complete HTML document structure', async () => {
      const markdown = asMarkdown('# Test Document\n\nContent here.');

      const result = await generator.generateHtml(markdown, {
        title: 'Test Document',
      });

      // Verify HTML document structure
      expect(result).toMatch(/<!DOCTYPE html>/i);
      expect(result).toContain('<html');
      expect(result).toContain('<head>');
      expect(result).toContain('<body>');
      expect(result).toContain('</html>');
    });

    it('should include title in HTML head', async () => {
      const markdown = asMarkdown('# Content');

      const result = await generator.generateHtml(markdown, {
        title: 'Custom Title',
      });

      expect(result).toContain('<title>Custom Title</title>');
    });

    it('should produce well-formed HTML', async () => {
      const markdown = asMarkdown('# Heading\n\nParagraph\n\n- Item 1\n- Item 2');

      const result = await generator.generateHtml(markdown, {});

      // Check for well-formed tags
      expect(result).toContain('<h1>Heading</h1>');
      expect(result).toContain('<p>Paragraph</p>');
      expect(result).toMatch(/<ul(?:\s+class="[^"]*")?>/);
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('</ul>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Markdown string', async () => {
      const emptyMarkdown = asMarkdown('');

      const result = await generator.generateHtml(emptyMarkdown, {});

      // Should still produce valid HTML document
      expect(result).toContain('<!DOCTYPE');
      expect(result).toContain('<html');
    });

    it('should handle Markdown with only YAML frontmatter', async () => {
      const yamlOnly = asMarkdown('---\ntitle: Document\n---\n');

      const result = await generator.generateHtml(yamlOnly, {});

      // YAML should be removed, leaving empty body
      expect(result).not.toContain('---');
      expect(result).toContain('<body>');
    });

    it('should handle very long Markdown documents', async () => {
      const longMarkdown = asMarkdown('# Title\n\n' + 'Paragraph. '.repeat(1000));

      const result = await generator.generateHtml(longMarkdown, {});

      expect(result).toContain('<h1>Title</h1>');
      expect(result.length).toBeGreaterThan(1000);
    });
  });

  describe('HTML Entity Handling', () => {
    it('should distinguish between HTML entities and actual tags', async () => {
      // &lt; and &gt; are HTML entities, not tags, so this is valid Markdown
      const markdownWithEntities = asMarkdown('Use &lt;div&gt; tags.');

      const result = await generator.generateHtml(markdownWithEntities, {});

      // Entities should be preserved in output
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should reject full HTML documents even when containing entities', async () => {
      const fullHtml = '<html><body>Content with &nbsp; entity</body></html>';

      await expect(
        generator.generateHtml(fullHtml as MarkdownString, {})
      ).rejects.toThrow(/expects Markdown input/);
    });
  });
});
