import {
  configureMarkedForLegal,
  markdownToHtmlBody,
  formatHtml,
  wrapHtmlDocument,
} from '@utils/html-format';

describe('html-format utilities', () => {
  describe('configureMarkedForLegal', () => {
    it('is idempotent (safe to call multiple times)', () => {
      expect(() => {
        configureMarkedForLegal();
        configureMarkedForLegal();
      }).not.toThrow();
    });
  });

  describe('markdownToHtmlBody', () => {
    it('converts markdown to HTML', () => {
      const html = markdownToHtmlBody('# Hello\n\nWorld');
      expect(html).toContain('<h1>');
      expect(html).toContain('Hello');
      expect(html).toContain('World');
    });

    it('supports GFM tables', () => {
      const md = '| A | B |\n|---|---|\n| 1 | 2 |';
      const html = markdownToHtmlBody(md);
      expect(html).toContain('<table>');
    });
  });

  describe('formatHtml', () => {
    it('formats HTML with consistent indentation', () => {
      const raw = '<div><p>Hello</p></div>';
      const formatted = formatHtml(raw);
      expect(formatted).toContain('  <p>');
    });
  });

  describe('wrapHtmlDocument', () => {
    it('produces a complete HTML5 document', () => {
      const doc = wrapHtmlDocument('<p>Body</p>', 'body { margin: 0; }', 'Test');
      expect(doc).toContain('<!DOCTYPE html>');
      expect(doc).toContain('<title>Test</title>');
      expect(doc).toContain('body { margin: 0; }');
      expect(doc).toContain('<p>Body</p>');
    });

    it('escapes HTML in title', () => {
      const doc = wrapHtmlDocument('<p>B</p>', '', '<script>alert(1)</script>');
      expect(doc).not.toContain('<script>alert');
      expect(doc).toContain('&lt;script&gt;');
    });
  });
});
