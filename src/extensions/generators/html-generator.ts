/**
 * HTML Generation Module for Legal Markdown Documents
 *
 * This module provides functionality to convert processed Legal Markdown content
 * into well-formatted HTML documents with CSS styling, accessibility features,
 * and print optimization.
 *
 * Features:
 * - Markdown to HTML conversion using marked
 * - DOM manipulation with cheerio for enhanced formatting
 * - Custom CSS injection and styling
 * - Field highlighting for document review
 * - Print-friendly output with page break controls
 * - Responsive table handling
 * - Accessibility improvements
 *
 * @example
 * ```typescript
 * import { htmlGenerator } from './html-generator';
 *
 * const html = await htmlGenerator.generateHtml(markdownContent, {
 *   title: 'Legal Agreement',
 *   cssPath: './styles.css',
 *   includeHighlighting: true
 * });
 * ```
 *
 * @module
 */

import { marked } from 'marked';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { RESOLVED_PATHS } from '../../constants/index';
import type { MarkdownString, HtmlString } from '../../types/content-formats';
import { isHtml } from '../../types/content-formats';
import { configureMarkedForLegal, formatHtml } from '../../utils/html-format';

/**
 * Configuration options for HTML generation
 *
 * @interface HtmlGeneratorOptions
 */
export interface HtmlGeneratorOptions {
  /** Path to custom CSS file to include in the generated HTML */
  cssPath?: string;
  /** Path to highlighting CSS file for field highlighting */
  highlightCssPath?: string;
  /** Whether to include field highlighting styles */
  includeHighlighting?: boolean;
  /** Document title for the HTML page */
  title?: string;
  /** Additional metadata to include in HTML head (only primitive values are rendered as meta tags) */
  metadata?: Record<string, unknown>;
}

/**
 * HTML Generator for Legal Markdown Documents
 *
 * Converts processed Legal Markdown content into formatted HTML documents
 * with professional styling, accessibility features, and print optimization.
 *
 * @class HtmlGenerator
 * @example
 * ```typescript
 * const generator = new HtmlGenerator();
 * const html = await generator.generateHtml(content, {
 *   title: 'Contract',
 *   includeHighlighting: true
 * });
 * ```
 */
export class HtmlGenerator {
  /**
   * Creates a new HTML generator instance and configures the markdown parser
   */
  constructor() {
    this.configureMarked();
  }

  /**
   * Configures the marked markdown parser with options optimized for legal documents.
   * Uses shared configuration from html-format.ts, then adds the Node-specific
   * custom code renderer for preserving HTML spans in code blocks.
   *
   * @private
   */
  private configureMarked(): void {
    // Shared config: GFM, breaks, silent
    configureMarkedForLegal();

    // Node-specific: custom code renderer that preserves HTML spans in code blocks
    const renderer = new marked.Renderer();
    renderer.code = function (args: { text: string; lang?: string; escaped?: boolean }) {
      const { text, lang } = args;
      const language = lang || '';
      const className = language ? ` class="language-${language}"` : '';
      return `<pre><code${className}>${text}</code></pre>\n`;
    };
    marked.setOptions({ renderer });
  }

  /**
   * Removes YAML frontmatter from markdown content if present
   *
   * @private
   * @param {string} content - The markdown content that may contain YAML frontmatter
   * @returns {string} Content with YAML frontmatter removed
   * @example
   * ```typescript
   * const content = `---
   * title: Document
   * ---
   * # Content`;
   * const clean = this.removeYamlFrontmatter(content); // "# Content"
   * ```
   */
  private removeYamlFrontmatter(content: string): string {
    // Check if content starts with YAML frontmatter
    if (content.startsWith('---')) {
      // Find the closing --- delimiter (allowing for various line endings)
      const lines = content.split('\n');
      let endIndex = -1;

      // Look for the closing --- starting from line 1 (skip the opening ---)
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        // Return content after the frontmatter (skip the closing --- line)
        return lines
          .slice(endIndex + 1)
          .join('\n')
          .trim();
      }
    }
    return content;
  }

  /**
   * Generates a complete HTML document from Legal Markdown content
   *
   * This is the main method that orchestrates the conversion process:
   * 1. Removes YAML frontmatter
   * 2. Converts markdown to HTML using marked
   * 3. Applies DOM transformations for legal document formatting
   * 4. Injects custom CSS and styling
   * 5. Builds a complete HTML document
   *
   * @param {MarkdownString} markdownContent - The processed Legal Markdown content to convert (MUST be Markdown, NOT HTML)
   * @param {HtmlGeneratorOptions} [options={}] - Configuration options for HTML generation
   * @returns {Promise<HtmlString>} A promise that resolves to the complete HTML document
   * @throws {Error} When HTML generation fails due to parsing or file system errors
   * @throws {Error} When HTML content is detected instead of Markdown (indicates a bug)
   *
   * @example
   * ```typescript
   * import { asMarkdown } from '../../types/content-formats';
   *
   * // ✅ CORRECT - Pass Markdown
   * const html = await generator.generateHtml(
   *   asMarkdown('# Contract\n\nThis is a {{party.name}} agreement.'),
   *   {
   *     title: 'Service Agreement',
   *     cssPath: './contract-styles.css',
   *     includeHighlighting: true,
   *     metadata: {
   *       author: 'Legal Team',
   *       version: '1.0'
   *     }
   *   }
   * );
   *
   * // ❌ INCORRECT - Don't pass HTML
   * const html = await generator.generateHtml(
   *   '<h1>Contract</h1>', // This will throw an error!
   *   {}
   * );
   * ```
   */
  async generateHtml(
    markdownContent: MarkdownString,
    options: HtmlGeneratorOptions = {}
  ): Promise<HtmlString> {
    try {
      // Runtime validation: Ensure we're not receiving HTML instead of Markdown
      if (isHtml(markdownContent)) {
        throw new Error(
          'generateHtml expects Markdown input, but received HTML content. ' +
            'This usually indicates a bug where HTML was passed instead of Markdown. ' +
            'The format-generator should pass processedResult.content (Markdown) directly ' +
            'to pdfGenerator.generatePdf(), not pre-convert it to HTML. ' +
            `Content preview: ${markdownContent.substring(0, 200)}...`
        );
      }

      logger.debug('Generating HTML from markdown', {
        contentLength: markdownContent.length,
        options,
      });

      // Remove YAML frontmatter if present
      const contentWithoutFrontmatter = this.removeYamlFrontmatter(markdownContent);

      // Convert markdown to HTML
      let htmlContent = await marked.parse(contentWithoutFrontmatter);

      // Post-process: unescape structural HTML tags (e.g., page-break divs) that were escaped in imported content
      htmlContent = this.unescapeStructuralTags(htmlContent);

      // Load and manipulate with cheerio
      const $ = cheerio.load(htmlContent);

      // Apply DOM transformations
      this.applyDomTransformations($);

      // Add CSS if provided
      let cssContent = '';
      if (options.cssPath) {
        cssContent += await this.loadCss(options.cssPath);
      }
      if (options.includeHighlighting && options.highlightCssPath) {
        cssContent += '\n' + (await this.loadCss(options.highlightCssPath));
      }

      // Build complete HTML document
      const completeHtml = await this.buildHtmlDocument({
        body: $.html(),
        css: cssContent,
        title: options.title || 'Legal Document',
        useDefaultCss: !options.cssPath, // Only use default CSS if no custom CSS is provided
        metadata: options.metadata,
      });

      // Format the HTML using shared configuration (same as browser bundle)
      const formattedHtml = formatHtml(completeHtml);

      logger.debug('HTML generation completed', {
        htmlLength: formattedHtml.length,
      });

      return formattedHtml as HtmlString;
    } catch (error) {
      logger.error('Error generating HTML', { error });
      throw new Error(
        `Failed to generate HTML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Applies DOM transformations to enhance the HTML for legal document presentation
   *
   * Transformations include:
   * - Adding no-break classes to short lists for better print layout
   * - Wrapping tables in responsive containers
   * - Adding alt attributes to images for accessibility
   * - Adding print-friendly CSS classes
   * - Cleaning up paragraph tags in list items
   *
   * @private
   * @param {cheerio.CheerioAPI} $ - The cheerio instance with loaded HTML
   * @returns {void}
   */
  private applyDomTransformations($: cheerio.CheerioAPI): void {
    // Apply list transformations (prevent page breaks in short lists)
    const maxListItemsNoBreak = 5;
    $('ul, ol').each((_, element) => {
      const list = $(element);
      if (list.children().length < maxListItemsNoBreak) {
        list.addClass('no-break');
      }
    });

    // Clean up paragraph tags in list items (unwrap single p tags)
    $('li > p:only-child').each((_, element) => {
      const p = $(element);
      const li = p.parent();
      li.html(p.html() || '');
    });

    // Apply table responsiveness
    $('table').each((_, element) => {
      const table = $(element);
      if (!table.parent().hasClass('table-responsive')) {
        table.wrap('<div class="table-responsive"></div>');
      }
    });

    // Ensure images have alt attributes for accessibility
    $('img:not([alt])').attr('alt', '');

    // Add print-friendly classes
    $('.page-break').addClass('page-break-before');
  }

  /**
   * Loads CSS content from a file path
   *
   * @private
   * @param {string} cssPath - Path to the CSS file to load
   * @returns {Promise<string>} A promise that resolves to the CSS content, or empty string on error
   */
  private async loadCss(cssPath: string): Promise<string> {
    try {
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      logger.debug('CSS file loaded', { cssPath, size: cssContent.length });
      return cssContent;
    } catch (error) {
      logger.warn(`Failed to load CSS file: ${cssPath}`, { error });
      return '';
    }
  }

  /**
   * Builds a complete HTML document with head, body, and embedded styles
   *
   * Creates a well-formed HTML5 document with:
   * - Proper DOCTYPE and meta tags
   * - Responsive viewport configuration
   * - Embedded CSS styles (base + custom)
   * - SEO-friendly metadata
   * - Print-optimized styling
   *
   * @private
   * @param {Object} options - Configuration for building the HTML document
   * @param {string} options.body - The HTML body content
   * @param {string} options.css - Custom CSS to embed
   * @param {string} options.title - Document title
   * @param {Record<string, string>} [options.metadata] - Additional metadata for HTML head
   * @returns {string} Complete HTML document as string
   */
  private async buildHtmlDocument(options: {
    body: string;
    css: string;
    title: string;
    metadata?: Record<string, unknown>;
    useDefaultCss?: boolean;
  }): Promise<string> {
    const { body, css, title, metadata = {}, useDefaultCss = true } = options;

    // Load default CSS only if no custom CSS is provided
    let defaultCss = '';
    if (useDefaultCss) {
      const defaultCssPath = path.join(RESOLVED_PATHS.STYLES_DIR, 'default.css');
      defaultCss = await this.loadCss(defaultCssPath);
    }

    // Build metadata tags - only include primitive values (objects/arrays/Maps
    // would serialize as "[object Object]" which is useless in a meta tag)
    const metaTags = Object.entries(metadata)
      .filter(
        ([, value]) =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      )
      .map(([name, value]) => `    <meta name="${name}" content="${String(value)}">`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
${metaTags ? metaTags + '\n' : ''}    <style>
      /* Default CSS */
      ${defaultCss}

      /* Custom CSS */
      ${css}
    </style>
</head>
<body>
${body}
</body>
</html>`;
  }

  /**
   * Unescape specific structural HTML tags that were escaped in imported content
   *
   * Selectively unescapes certain structural tags that are needed for styling and page breaks.
   *
   * Tags unescaped:
   * - <div class="page-break-before"></div>
   * - <div class="page-break-after"></div>
   * - Other div/span tags with specific classes
   *
   * @param html - HTML content with potentially escaped tags
   * @returns HTML with structural tags unescaped
   * @private
   */
  private unescapeStructuralTags(html: string): string {
    let processed = html;

    // Unescape page-break divs wrapped in paragraphs
    // Pattern: <p>&lt;div class="page-break-before"&gt;&lt;/div&gt;</p>
    // Replace with: <div class="page-break-before"></div>
    processed = processed.replace(
      /<p>&lt;div class="page-break-(before|after)"&gt;&lt;\/div&gt;<\/p>/gi,
      '<div class="page-break-$1"></div>'
    );

    // Also handle cases without the wrapping <p>
    processed = processed.replace(
      /&lt;div class="page-break-(before|after)"&gt;&lt;\/div&gt;/gi,
      '<div class="page-break-$1"></div>'
    );

    // Unescape other common structural divs with classes
    processed = processed.replace(
      /<p>&lt;div class="([^"]+)"&gt;&lt;\/div&gt;<\/p>/gi,
      '<div class="$1"></div>'
    );

    return processed;
  }
}

/**
 * Singleton instance of HtmlGenerator for convenient importing
 * @example
 * ```typescript
 * import { htmlGenerator } from './html-generator';
 * const html = await htmlGenerator.generateHtml(content);
 * ```
 */
// Export singleton instance
export const htmlGenerator = new HtmlGenerator();

// Exported for testing - not part of public API
// These wrap private HtmlGenerator methods for unit test access
const _testInstance = new HtmlGenerator();
export function _removeYamlFrontmatter(content: string): string {
  return (
    _testInstance as unknown as { removeYamlFrontmatter: (c: string) => string }
  ).removeYamlFrontmatter(content);
}
export function _applyDomTransformations($: cheerio.CheerioAPI): void {
  (
    _testInstance as unknown as { applyDomTransformations: ($: cheerio.CheerioAPI) => void }
  ).applyDomTransformations($);
}
export function _buildHtmlDocument(options: {
  body: string;
  css: string;
  title: string;
  metadata?: Record<string, unknown>;
  useDefaultCss?: boolean;
}): Promise<string> {
  return (
    _testInstance as unknown as { buildHtmlDocument: (opts: typeof options) => Promise<string> }
  ).buildHtmlDocument(options);
}
export function _unescapeStructuralTags(html: string): string {
  return (
    _testInstance as unknown as { unescapeStructuralTags: (h: string) => string }
  ).unescapeStructuralTags(html);
}
