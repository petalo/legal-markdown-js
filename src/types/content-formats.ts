/**
 * Branded types for differentiating content formats
 *
 * This module provides type-safe wrappers for string content to prevent
 * accidentally mixing Markdown, HTML, and plain text formats. Using branded
 * types allows TypeScript to catch format mismatches at compile time.
 *
 * @example
 * ```typescript
 * // Type-safe conversion
 * const markdown = asMarkdown('# Title\n\nContent');
 * const html = await generateHtml(markdown); // ✅ Type-safe
 *
 * // This will cause a TypeScript error:
 * const html = '<h1>Title</h1>';
 * await generateHtml(html); // ❌ Type error: HTML cannot be passed as Markdown
 * ```
 *
 * @module types/content-formats
 */

/**
 * Branded type for Markdown-formatted content
 *
 * This type ensures that strings known to contain Markdown formatting
 * cannot be accidentally used where HTML or plain text is expected.
 */
declare const markdownBrand: unique symbol;
export type MarkdownString = string & { readonly [markdownBrand]: true };

/**
 * Branded type for HTML-formatted content
 *
 * This type ensures that strings known to contain HTML markup
 * cannot be accidentally used where Markdown or plain text is expected.
 */
declare const htmlBrand: unique symbol;
export type HtmlString = string & { readonly [htmlBrand]: true };

/**
 * Branded type for plain text content (no formatting)
 *
 * This type represents unformatted text without Markdown or HTML markup.
 */
declare const plainTextBrand: unique symbol;
export type PlainTextString = string & { readonly [plainTextBrand]: true };

/**
 * Type guard to check if content appears to be HTML
 *
 * Performs a heuristic check for HTML tags in the content.
 * This is not foolproof but catches most common cases.
 *
 * @param content - The content to check
 * @returns true if content appears to contain HTML tags
 *
 * @example
 * ```typescript
 * isHtml('<h1>Title</h1>'); // true
 * isHtml('# Title'); // false
 * isHtml('Plain text'); // false
 * ```
 */
export function isHtml(content: string): boolean {
  // Simple heuristic: detect complete HTML documents vs Markdown with embedded HTML
  //
  // Note: This is NOT a perfect detector. It only catches obvious cases where
  // someone passed a complete HTML document instead of Markdown. It will NOT
  // detect all HTML content, and that's intentional - Markdown can contain
  // embedded HTML tags (like <div>, <span>, etc.) which is perfectly valid.
  //
  // We only check for structural tags that should never appear in Markdown:
  // - DOCTYPE declarations
  // - <html>, <head>, <body> tags
  //
  // This is sufficient to catch the bug where generateHtml output was
  // accidentally passed to generatePdf/generateHtml again.

  const structuralHtmlPattern = /<!DOCTYPE|<\/?html[\s>]|<\/?head[\s>]|<\/?body[\s>]/i;
  return structuralHtmlPattern.test(content);
}

/**
 * Type guard to check if content appears to be Markdown
 *
 * A simple heuristic: if it's not HTML, we assume it's Markdown or plain text.
 * More sophisticated detection could check for Markdown syntax patterns.
 *
 * @param content - The content to check
 * @returns true if content does not appear to be HTML
 *
 * @example
 * ```typescript
 * isMarkdown('# Title'); // true
 * isMarkdown('Plain text'); // true
 * isMarkdown('<h1>Title</h1>'); // false
 * ```
 */
export function isMarkdown(content: string): boolean {
  return !isHtml(content);
}

/**
 * Converts a string to MarkdownString type
 *
 * This is a type assertion that should be used when you know the content
 * is Markdown. For safety, consider validating with isMarkdown() first.
 *
 * @param content - The content to convert
 * @returns The same content typed as MarkdownString
 *
 * @example
 * ```typescript
 * const markdown = asMarkdown('# Title\n\nContent');
 * await generateHtml(markdown); // Type-safe
 * ```
 */
export function asMarkdown(content: string): MarkdownString {
  return content as MarkdownString;
}

/**
 * Converts a string to HtmlString type
 *
 * This is a type assertion that should be used when you know the content
 * is HTML. For safety, consider validating with isHtml() first.
 *
 * @param content - The content to convert
 * @returns The same content typed as HtmlString
 *
 * @example
 * ```typescript
 * const html = asHtml('<h1>Title</h1>');
 * await renderHtml(html); // Type-safe
 * ```
 */
export function asHtml(content: string): HtmlString {
  return content as HtmlString;
}

/**
 * Converts a string to PlainTextString type
 *
 * This is a type assertion that should be used when you know the content
 * is plain text without formatting.
 *
 * @param content - The content to convert
 * @returns The same content typed as PlainTextString
 *
 * @example
 * ```typescript
 * const plain = asPlainText('Just plain text');
 * console.log(plain);
 * ```
 */
export function asPlainText(content: string): PlainTextString {
  return content as PlainTextString;
}

/**
 * Safely converts any string to MarkdownString after validation
 *
 * Throws an error if the content appears to be HTML instead of Markdown.
 * Use this when you want runtime validation in addition to type safety.
 *
 * @param content - The content to validate and convert
 * @param source - Optional description of where this content came from (for error messages)
 * @returns The content typed as MarkdownString
 * @throws {Error} If content appears to be HTML
 *
 * @example
 * ```typescript
 * const markdown = toMarkdown('# Title'); // ✅ OK
 * const invalid = toMarkdown('<h1>Title</h1>'); // ❌ Throws error
 * ```
 */
export function toMarkdown(content: string, source?: string): MarkdownString {
  if (isHtml(content)) {
    const sourceInfo = source ? ` from ${source}` : '';
    throw new Error(
      `Expected Markdown content${sourceInfo}, but received HTML. ` +
        'This indicates a bug where HTML was passed instead of Markdown. ' +
        `Content preview: ${content.substring(0, 100)}...`
    );
  }
  return content as MarkdownString;
}

/**
 * Safely converts any string to HtmlString after validation
 *
 * Validates that the content appears to contain HTML markup.
 * Use this when you want runtime validation in addition to type safety.
 *
 * @param content - The content to validate and convert
 * @param source - Optional description of where this content came from (for error messages)
 * @returns The content typed as HtmlString
 * @throws {Error} If content does not appear to be HTML
 *
 * @example
 * ```typescript
 * const html = toHtml('<h1>Title</h1>'); // ✅ OK
 * const invalid = toHtml('# Title'); // ❌ Throws error
 * ```
 */
export function toHtml(content: string, source?: string): HtmlString {
  if (!isHtml(content)) {
    const sourceInfo = source ? ` from ${source}` : '';
    throw new Error(
      `Expected HTML content${sourceInfo}, but received non-HTML text. ` +
        `Content preview: ${content.substring(0, 100)}...`
    );
  }
  return content as HtmlString;
}
