/**
 * @fileoverview Unit tests for HtmlGenerator private/internal methods
 *
 * Tests the internal helper methods exported for testing:
 * - removeYamlFrontmatter: strips YAML frontmatter from content
 * - applyDomTransformations: applies cheerio-based DOM changes
 * - buildHtmlDocument: assembles a complete HTML5 document
 * - unescapeStructuralTags: unescapes structural HTML tags
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import { vi } from 'vitest';
import {
  _removeYamlFrontmatter,
  _applyDomTransformations,
  _buildHtmlDocument,
  _unescapeStructuralTags,
} from '../../../../src/extensions/generators/html-generator';

vi.mock('fs/promises');
vi.mock('../../../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockedFs = fs as vi.Mocked<typeof fs>;

describe('HtmlGenerator internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // removeYamlFrontmatter
  // ---------------------------------------------------------------------------
  describe('removeYamlFrontmatter', () => {
    it('should remove YAML frontmatter and return remaining content', () => {
      const input = '---\ntitle: Test\nauthor: Alice\n---\n# Content\n\nBody text';
      const result = _removeYamlFrontmatter(input);
      expect(result).toBe('# Content\n\nBody text');
    });

    it('should return content unchanged when no frontmatter is present', () => {
      const input = '# No Frontmatter\n\nJust text.';
      const result = _removeYamlFrontmatter(input);
      expect(result).toBe(input);
    });

    it('should return empty string when frontmatter has no content after it', () => {
      const input = '---\ntitle: Test\n---';
      const result = _removeYamlFrontmatter(input);
      expect(result).toBe('');
    });

    it('should return content unchanged when frontmatter is unclosed', () => {
      const input = '---\ntitle: Test\nno closing delimiter';
      const result = _removeYamlFrontmatter(input);
      expect(result).toBe(input);
    });

    it('should handle frontmatter with blank lines inside', () => {
      const input = '---\ntitle: Test\n\ndescription: Multi\n---\n# After';
      const result = _removeYamlFrontmatter(input);
      expect(result).toBe('# After');
    });
  });

  // ---------------------------------------------------------------------------
  // applyDomTransformations
  // ---------------------------------------------------------------------------
  describe('applyDomTransformations', () => {
    it('should add no-break class to short lists (< 5 items)', () => {
      const $ = cheerio.load('<ul><li>A</li><li>B</li></ul>');
      _applyDomTransformations($);
      expect($('ul').hasClass('no-break')).toBe(true);
    });

    it('should NOT add no-break class to lists with 5 or more items', () => {
      const items = Array.from({ length: 5 }, (_, i) => `<li>${i}</li>`).join('');
      const $ = cheerio.load(`<ul>${items}</ul>`);
      _applyDomTransformations($);
      expect($('ul').hasClass('no-break')).toBe(false);
    });

    it('should wrap tables in a responsive div', () => {
      const $ = cheerio.load('<table><tr><td>Cell</td></tr></table>');
      _applyDomTransformations($);
      expect($('div.table-responsive').length).toBe(1);
      expect($('div.table-responsive > table').length).toBe(1);
    });

    it('should NOT double-wrap tables already in a responsive div', () => {
      const $ = cheerio.load(
        '<div class="table-responsive"><table><tr><td>Cell</td></tr></table></div>'
      );
      _applyDomTransformations($);
      expect($('div.table-responsive').length).toBe(1);
    });

    it('should add empty alt attribute to images without alt', () => {
      const $ = cheerio.load('<img src="photo.jpg">');
      _applyDomTransformations($);
      expect($('img').attr('alt')).toBe('');
    });

    it('should not overwrite existing alt attributes', () => {
      const $ = cheerio.load('<img src="photo.jpg" alt="A photo">');
      _applyDomTransformations($);
      expect($('img').attr('alt')).toBe('A photo');
    });

    it('should unwrap a single <p> child inside <li>', () => {
      const $ = cheerio.load('<ul><li><p>Text</p></li></ul>');
      _applyDomTransformations($);
      // The li should contain text directly, not wrapped in p
      expect($('li').html()).toBe('Text');
      expect($('li > p').length).toBe(0);
    });

    it('should add page-break-before class to .page-break elements', () => {
      const $ = cheerio.load('<div class="page-break"></div>');
      _applyDomTransformations($);
      expect($('.page-break').hasClass('page-break-before')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // buildHtmlDocument
  // ---------------------------------------------------------------------------
  describe('buildHtmlDocument', () => {
    beforeEach(() => {
      // Mock loadCss (called via fs.readFile) to return empty string by default
      mockedFs.readFile.mockResolvedValue('');
    });

    it('should produce a valid HTML5 document structure', async () => {
      const result = await _buildHtmlDocument({
        body: '<p>Hello</p>',
        css: '',
        title: 'Test Doc',
        useDefaultCss: false,
      });
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<head>');
      expect(result).toContain('</head>');
      expect(result).toContain('<body>');
      expect(result).toContain('</body>');
      expect(result).toContain('</html>');
    });

    it('should include the title in the head', async () => {
      const result = await _buildHtmlDocument({
        body: '',
        css: '',
        title: 'My Legal Doc',
        useDefaultCss: false,
      });
      expect(result).toContain('<title>My Legal Doc</title>');
    });

    it('should embed custom CSS in a style tag', async () => {
      const result = await _buildHtmlDocument({
        body: '',
        css: 'body { color: navy; }',
        title: 'Doc',
        useDefaultCss: false,
      });
      expect(result).toContain('body { color: navy; }');
      expect(result).toContain('<style>');
    });

    it('should include primitive metadata as meta tags', async () => {
      const result = await _buildHtmlDocument({
        body: '',
        css: '',
        title: 'Doc',
        metadata: { author: 'Alice', version: 2, draft: true },
        useDefaultCss: false,
      });
      expect(result).toContain('<meta name="author" content="Alice">');
      expect(result).toContain('<meta name="version" content="2">');
      expect(result).toContain('<meta name="draft" content="true">');
    });

    it('should skip object and array metadata values', async () => {
      const result = await _buildHtmlDocument({
        body: '',
        css: '',
        title: 'Doc',
        metadata: {
          author: 'Bob',
          nested: { key: 'val' },
          tags: ['a', 'b'],
        },
        useDefaultCss: false,
      });
      expect(result).toContain('<meta name="author" content="Bob">');
      expect(result).not.toContain('nested');
      expect(result).not.toContain('tags');
    });

    it('should load default CSS when useDefaultCss is true', async () => {
      mockedFs.readFile.mockResolvedValue('/* default styles */');
      const result = await _buildHtmlDocument({
        body: '',
        css: '',
        title: 'Doc',
        useDefaultCss: true,
      });
      expect(result).toContain('/* default styles */');
      expect(mockedFs.readFile).toHaveBeenCalled();
    });

    it('should include body content', async () => {
      const result = await _buildHtmlDocument({
        body: '<h1>Contract</h1><p>Terms here.</p>',
        css: '',
        title: 'Doc',
        useDefaultCss: false,
      });
      expect(result).toContain('<h1>Contract</h1><p>Terms here.</p>');
    });
  });

  // ---------------------------------------------------------------------------
  // unescapeStructuralTags
  // ---------------------------------------------------------------------------
  describe('unescapeStructuralTags', () => {
    it('should unescape page-break-before div wrapped in <p>', () => {
      const input = '<p>&lt;div class="page-break-before"&gt;&lt;/div&gt;</p>';
      const result = _unescapeStructuralTags(input);
      expect(result).toBe('<div class="page-break-before"></div>');
    });

    it('should unescape page-break-after div wrapped in <p>', () => {
      const input = '<p>&lt;div class="page-break-after"&gt;&lt;/div&gt;</p>';
      const result = _unescapeStructuralTags(input);
      expect(result).toBe('<div class="page-break-after"></div>');
    });

    it('should unescape page-break div without <p> wrapper', () => {
      const input = '&lt;div class="page-break-before"&gt;&lt;/div&gt;';
      const result = _unescapeStructuralTags(input);
      expect(result).toBe('<div class="page-break-before"></div>');
    });

    it('should unescape divs with other classes wrapped in <p>', () => {
      const input = '<p>&lt;div class="custom-section"&gt;&lt;/div&gt;</p>';
      const result = _unescapeStructuralTags(input);
      expect(result).toBe('<div class="custom-section"></div>');
    });

    it('should leave already-unescaped HTML unchanged', () => {
      const input = '<div class="page-break-before"></div>';
      const result = _unescapeStructuralTags(input);
      expect(result).toBe('<div class="page-break-before"></div>');
    });

    it('should handle mixed content with escaped and normal tags', () => {
      const input =
        '<h1>Title</h1>\n<p>&lt;div class="page-break-before"&gt;&lt;/div&gt;</p>\n<p>Next section</p>';
      const result = _unescapeStructuralTags(input);
      expect(result).toContain('<div class="page-break-before"></div>');
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Next section</p>');
    });
  });
});
