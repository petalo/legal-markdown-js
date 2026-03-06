/**
 * Shared HTML Formatting Utilities
 *
 * Browser-compatible module that provides the single source of truth for:
 * - Markdown → HTML conversion (marked.js configuration)
 * - HTML beautification (js-beautify configuration)
 * - Full HTML document wrapper
 *
 * Used by both the Node pipeline (html-generator.ts) and the browser bundle
 * (browser-modern.ts / playground). This ensures identical output regardless
 * of the execution environment.
 *
 * @module utils/html-format
 */

import { marked } from 'marked';
import beautify from 'js-beautify';

const { html: beautifyHtml } = beautify;

// ============================================================================
// MARKED CONFIGURATION
// ============================================================================

let markedConfigured = false;

/**
 * Configure marked.js for legal document rendering.
 *
 * Call once at startup. Idempotent - safe to call multiple times.
 * Applies the same settings used by the Node HTML generator so that
 * browser and server produce identical HTML from the same markdown.
 */
export function configureMarkedForLegal(): void {
  if (markedConfigured) return;

  marked.use({
    gfm: true, // GitHub Flavored Markdown (tables, strikethrough, etc.)
    breaks: false, // Soft line breaks are spaces; use \ or two trailing spaces for hard breaks
    silent: true, // Don't throw on edge-case markdown
  });

  markedConfigured = true;
}

// ============================================================================
// JS-BEAUTIFY CONFIGURATION
// ============================================================================

/**
 * Shared js-beautify options for legal HTML output.
 *
 * Key design decisions:
 * - `unformatted` keeps inline elements on one line - critical for
 *   `<span class="legal-field">` wrappers and other phrasing content.
 * - `wrap_line_length: 0` prevents line wrapping in long paragraphs
 *   that contain multiple spans (common in legal docs).
 * - `content_unformatted` preserves whitespace in pre/code/style blocks.
 */
const BEAUTIFY_OPTIONS: beautify.HTMLBeautifyOptions = {
  indent_size: 2,
  indent_char: ' ',
  max_preserve_newlines: 1,
  preserve_newlines: true,
  end_with_newline: true,
  wrap_line_length: 0,
  indent_inner_html: true,
  indent_scripts: 'normal' as const,
  unformatted: ['span', 'a', 'strong', 'em', 'b', 'i', 'code', 'abbr', 'sub', 'sup'],
  content_unformatted: ['pre', 'code', 'script', 'style'],
  extra_liners: ['head', 'body', '/html'],
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Convert a markdown string to an HTML body fragment.
 *
 * Uses the shared marked configuration (GFM, breaks, legal renderer).
 * The output is a raw HTML string - call {@link formatHtml} to prettify.
 *
 * @param markdown - Processed legal markdown (after template substitution)
 * @returns HTML body fragment (no `<html>`/`<head>` wrapper)
 */
export function markdownToHtmlBody(markdown: string): string {
  configureMarkedForLegal();
  return marked.parse(markdown) as string;
}

/**
 * Prettify an HTML string using the shared js-beautify configuration.
 *
 * Safe for both fragments and full documents.
 *
 * @param html - Raw HTML string
 * @returns Formatted HTML with consistent indentation
 */
export function formatHtml(html: string): string {
  return beautifyHtml(html, BEAUTIFY_OPTIONS);
}

/**
 * Wrap an HTML body fragment in a complete HTML5 document.
 *
 * Produces a self-contained document that can be opened directly in a
 * browser or used for PDF generation.
 *
 * @param body    - HTML body content
 * @param css     - CSS to embed in `<style>` (empty string for no styles)
 * @param title   - Document `<title>` value
 * @returns Complete HTML document string, formatted with js-beautify
 */
export function wrapHtmlDocument(body: string, css: string, title: string): string {
  const raw = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtmlText(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${body}
</body>
</html>`;

  return formatHtml(raw);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
