/**
 * @fileoverview Tests for HTML generator functionality
 * 
 * Tests the HTML generator which converts legal markdown to HTML with:
 * - Markdown-to-HTML conversion with legal document structure
 * - CSS integration (custom styles and field highlighting)
 * - DOM transformations (responsive tables, list formatting)
 * - Metadata embedding (author, description, title)
 * - Accessibility features (proper alt tags, semantic markup)
 */

import { htmlGenerator } from '../../../../src/extensions/generators/html-generator';
import * as fs from 'fs/promises';
import { vi, Mocked } from 'vitest';

vi.mock('fs/promises');

describe('HTML Generator', () => {
  const mockedFs = fs as Mocked<typeof fs>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateHtml', () => {
    it('should convert basic markdown to HTML', async () => {
      const markdown = '# Title\n\nThis is a paragraph.';
      const result = await htmlGenerator.generateHtml(markdown);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<!DOCTYPE html>');
    });

    it('should include custom CSS when provided', async () => {
      const markdown = '# Test';
      const cssContent = 'body { color: red; }';
      mockedFs.readFile.mockResolvedValue(cssContent);

      const result = await htmlGenerator.generateHtml(markdown, {
        cssPath: '/path/to/style.css'
      });

      expect(result).toContain(cssContent);
      expect(mockedFs.readFile).toHaveBeenCalledWith('/path/to/style.css', 'utf-8');
    });

    it('should include highlighting CSS when enabled', async () => {
      const markdown = '# Test';
      const highlightCss = '.imported-value { color: blue; }';
      mockedFs.readFile.mockResolvedValue(highlightCss);

      const result = await htmlGenerator.generateHtml(markdown, {
        includeHighlighting: true,
        highlightCssPath: '/path/to/highlight.css'
      });

      expect(result).toContain(highlightCss);
    });

    it('should apply DOM transformations', async () => {
      const markdown = '- Item 1\n- Item 2\n\n| Header |\n|--------|\n| Cell |';
      const result = await htmlGenerator.generateHtml(markdown);

      // Check list transformation (adds no-break class for legal formatting)
      expect(result).toContain('class="no-break"');
      
      // Check table responsiveness (wraps tables for mobile viewing)
      expect(result).toContain('class="table-responsive"');
    });

    it('should convert headings properly', async () => {
      const markdown = '# Main Title\n## Sub Section\n### Another Section';
      const result = await htmlGenerator.generateHtml(markdown);

      expect(result).toContain('<h1>Main Title</h1>');
      expect(result).toContain('<h2>Sub Section</h2>');
      expect(result).toContain('<h3>Another Section</h3>');
    });

    it('should handle metadata in HTML generation', async () => {
      const markdown = '# Document';
      const metadata = {
        author: 'John Doe',
        description: 'Test document'
      };

      const result = await htmlGenerator.generateHtml(markdown, {
        metadata,
        title: 'Test Document'
      });

      expect(result).toContain('<title>Test Document</title>');
      expect(result).toContain('<meta name="author" content="John Doe">');
      expect(result).toContain('<meta name="description" content="Test document">');
    });

    it('should handle empty CSS file gracefully', async () => {
      const markdown = '# Test';
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await htmlGenerator.generateHtml(markdown, {
        cssPath: '/nonexistent.css'
      });

      expect(result).toContain('<h1');
      expect(result).not.toContain('File not found');
    });

    it('should preserve code blocks', async () => {
      const markdown = '```javascript\nconst x = 42;\n```';
      const result = await htmlGenerator.generateHtml(markdown);

      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
      expect(result).toContain('const x = 42;');
    });

    it('should handle inline code', async () => {
      const markdown = 'Use `npm install` to install dependencies.';
      const result = await htmlGenerator.generateHtml(markdown);

      expect(result).toContain('<code>npm install</code>');
    });

    it('should ensure images have alt attributes', async () => {
      const markdown = '![](image.png)\n![Alt text](image2.png)';
      const result = await htmlGenerator.generateHtml(markdown);

      // All images should have alt attributes for accessibility compliance
      const imgMatches = result.match(/<img[^>]*>/g) || [];
      imgMatches.forEach(img => {
        expect(img).toMatch(/alt="/);
      });
    });
  });
});