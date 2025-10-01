/**
 * Remark plugin for signature lines
 *
 * Detects long sequences of underscores (10 or more consecutive) and wraps them
 * in HTML spans with a CSS class for styling. This is commonly used in legal
 * documents to indicate signature lines.
 *
 * @example
 * Input:  "Signature: __________________________"
 * Output: "Signature: <span class=\"signature-line\">__________________________</span>"
 *
 * @module plugins/remark/signature-lines
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, HTML } from 'mdast';

/**
 * Options for the signature lines plugin
 */
export interface SignatureLinesOptions {
  /**
   * Minimum number of consecutive underscores to treat as a signature line
   * @default 10
   */
  minUnderscores?: number;

  /**
   * Whether to add CSS class to signature lines
   * @default true
   */
  addCssClass?: boolean;

  /**
   * Custom CSS class name for signature lines
   * @default "signature-line"
   */
  cssClassName?: string;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Default options for the plugin
 */
const DEFAULT_OPTIONS: Required<SignatureLinesOptions> = {
  minUnderscores: 10,
  addCssClass: true,
  cssClassName: 'signature-line',
  debug: false,
};

/**
 * Sanitize CSS class name to prevent XSS vulnerabilities
 *
 * Ensures the class name only contains valid CSS identifier characters:
 * - Letters (a-z, A-Z)
 * - Digits (0-9)
 * - Hyphens (-)
 * - Underscores (_)
 *
 * @param className - The class name to sanitize
 * @returns Sanitized class name, or default if invalid
 */
function sanitizeCssClassName(className: string): string {
  // Valid CSS identifier pattern: starts with letter/underscore, followed by letters/digits/hyphens/underscores
  const validPattern = /^[a-zA-Z_][\w-]*$/;

  if (!className || !validPattern.test(className)) {
    console.warn(
      `[signature-lines] Invalid CSS class name "${className}", using default "signature-line"`
    );
    return 'signature-line';
  }

  return className;
}

/**
 * Remark plugin that detects and marks signature lines
 *
 * This plugin processes text nodes in the markdown AST and identifies sequences
 * of underscores that are likely signature lines (by default, 10 or more consecutive
 * underscores). When found, it wraps them in HTML span elements with a CSS class
 * for styling.
 *
 * @param options - Configuration options for the plugin
 * @returns A unified transformer function
 *
 * @example
 * ```typescript
 * unified()
 *   .use(remarkParse)
 *   .use(remarkSignatureLines, { minUnderscores: 15 })
 *   .use(remarkStringify)
 * ```
 */
const remarkSignatureLines: Plugin<[SignatureLinesOptions?], Root> = (options = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Sanitize CSS class name to prevent XSS
  const safeCssClassName = sanitizeCssClassName(config.cssClassName);

  return (tree: Root) => {
    if (config.debug) {
      console.log('[signature-lines] Processing tree...');
    }

    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent) return;

      const text = node.value;

      // Create regex pattern for detecting long underscore sequences
      const underscorePattern = new RegExp(`_{${config.minUnderscores},}`, 'g');

      // Check if text contains signature lines
      if (!underscorePattern.test(text)) {
        return; // No signature lines found, skip this node
      }

      if (config.debug) {
        console.log('[signature-lines] Found signature line in text:', text);
      }

      // If we're not adding CSS classes, leave the text as-is
      if (!config.addCssClass) {
        return;
      }

      // Process the text and wrap signature lines in HTML spans
      const processedText = text.replace(underscorePattern, match => {
        if (config.debug) {
          console.log(`[signature-lines] Wrapping ${match.length} underscores`);
        }
        return `<span class="${safeCssClassName}">${match}</span>`;
      });

      // Replace the text node with an HTML node containing the wrapped signature lines
      const htmlNode: HTML = {
        type: 'html',
        value: processedText,
      };

      // Replace the text node with the new HTML node
      parent.children[index] = htmlNode;
    });

    if (config.debug) {
      console.log('[signature-lines] Processing complete');
    }
  };
};

export default remarkSignatureLines;
