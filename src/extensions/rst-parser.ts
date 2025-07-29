/**
 * @fileoverview reStructuredText Parser Extension for Legal Markdown
 *
 * This module provides functionality to parse reStructuredText (.rst) documents
 * and convert them to Legal Markdown format. It uses Pandoc for robust parsing
 * with intelligent fallback to basic regex-based parsing when Pandoc is not
 * available or fails.
 *
 * Features:
 * - AST-based reStructuredText parsing using Pandoc
 * - Fallback regex-based parsing for simple documents
 * - Content type detection and validation
 * - Section header conversion to Legal Markdown syntax
 * - Text formatting preservation (emphasis, strong)
 * - Code block and literal block handling
 * - Bullet and enumerated list conversion
 * - Reference and hyperlink preservation
 *
 * @example
 * ```typescript
 * import { convertRstToLegalMarkdown, convertRstToLegalMarkdownSync } from './rst-parser';
 *
 * const rstContent = `
 * ============
 * Introduction
 * ============
 *
 * This is a sample reStructuredText document.
 *
 * Section 1
 * =========
 *
 * Some *emphasized* and **strong** text.
 * `;
 *
 * // Async conversion (preferred)
 * const legalMarkdown = await convertRstToLegalMarkdown(rstContent);
 *
 * // Sync conversion (fallback)
 * const legalMarkdownSync = convertRstToLegalMarkdownSync(rstContent);
 * ```
 */

import { ContentDetector } from './parsers/content-detector';
import { PandocFactory } from './parsers/pandoc-factory';
import { FallbackParsers } from './parsers/fallback-parsers';

/**
 * Convert RST AST node to markdown
 */
function astToMarkdown(node: any, level: number = 0): string {
  if (!node) return '';

  switch (node.type) {
    case 'document':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('\n\n') || '';

    case 'section': {
      const headerLevel = Math.min(level + 1, 5);
      const headerPrefix = 'l'.repeat(headerLevel);
      const title = node.children?.find((child: any) => child.type === 'title');
      const titleText = title ? astToMarkdown(title, level) : '';
      const content = node.children
        ?.filter((child: any) => child.type !== 'title')
        .map((child: any) => astToMarkdown(child, level + 1))
        .join('\n\n');
      return `${headerPrefix}. ${titleText}\n\n${content}`.trim();
    }

    case 'title':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';

    case 'paragraph':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';

    case 'text':
      return node.value || '';

    case 'emphasis': {
      const emContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';
      return `*${emContent}*`;
    }

    case 'strong': {
      const strongContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';
      return `**${strongContent}**`;
    }

    case 'literal':
      return `\`${node.value || ''}\``;

    case 'literal_block': {
      const code =
        node.value ||
        node.children?.map((child: any) => astToMarkdown(child, level)).join('') ||
        '';
      return '```\n' + code + '\n```';
    }

    case 'bullet_list':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('\n') || '';

    case 'enumerated_list': {
      let counter = 1;
      return (
        node.children
          ?.map((child: any) => {
            const content = astToMarkdown(child, level);
            return content.replace(/^/, `${counter++}. `);
          })
          .join('\n') || ''
      );
    }

    case 'list_item': {
      const itemContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('\n') || '';
      // Handle bullet or enumerated list items
      return node.parent?.type === 'bullet_list' ? `- ${itemContent}` : itemContent;
    }

    case 'reference': {
      const refText =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';
      const refUri = node.refuri || node.refname || '';
      return refUri ? `[${refText}](${refUri})` : refText;
    }

    case 'target':
      // Targets are usually invisible in output
      return '';

    case 'block_quote': {
      const quoteContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('\n') || '';
      return quoteContent
        .split('\n')
        .map((line: string) => `> ${line}`)
        .join('\n');
    }

    case 'note':
    case 'warning':
    case 'important': {
      const admonitionType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      const admonitionContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join('\n') || '';
      return `> **${admonitionType}:** ${admonitionContent}`;
    }

    case 'definition_list':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('\n\n') || '';

    case 'definition_list_item': {
      const term = node.children?.find((child: any) => child.type === 'term');
      const definition = node.children?.find((child: any) => child.type === 'definition');
      const termText = term ? astToMarkdown(term, level) : '';
      const defText = definition ? astToMarkdown(definition, level) : '';
      return `**${termText}**\n  ${defText}`;
    }

    case 'term':
    case 'definition':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';

    case 'footnote_reference':
      return `[^${node.refname}]`;

    case 'footnote': {
      const footnoteNum = node.names?.[0] || '';
      const footnoteContent =
        node.children?.map((child: any) => astToMarkdown(child, level)).join(' ') || '';
      return `[^${footnoteNum}]: ${footnoteContent}`;
    }

    case 'substitution_reference':
      return node.refname || '';

    case 'inline':
      return node.children?.map((child: any) => astToMarkdown(child, level)).join('') || '';

    default:
      // For unknown node types, try to extract text from children
      if (node.children) {
        return node.children.map((child: any) => astToMarkdown(child, level)).join('');
      }
      return node.value || '';
  }
}

/**
 * Converts reStructuredText content to markdown format using pandoc
 */
export async function parseRestructuredText(content: string): Promise<string> {
  try {
    const parser = await PandocFactory.createForContent(content);

    if (parser) {
      const markdown = await parser.convert(content, 'rst', 'markdown');
      return markdown.replace(/\n{3,}/g, '\n\n').trim();
    } else {
      // Use fallback parser
      return FallbackParsers.convertRstBasic(content);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error parsing RST:', error);
    }
    // Use fallback parser on error
    return FallbackParsers.convertRstBasic(content);
  }
}

/**
 * Synchronous version using fallback parser
 */
export function parseRestructuredTextSync(content: string): string {
  return FallbackParsers.convertRstBasic(content);
}

/**
 * Checks if a file appears to be reStructuredText
 */
export function isRestructuredText(content: string): boolean {
  return ContentDetector.needsRstParser(content);
}

/**
 * Converts reStructuredText content to Legal Markdown format (async version)
 *
 * This function provides robust conversion of reStructuredText documents to Legal
 * Markdown format using Pandoc when available. It automatically detects RST content
 * and only performs conversion when necessary, preserving non-RST content unchanged.
 *
 * @param {string} content - The input content that may contain reStructuredText
 * @returns {Promise<string>} A promise that resolves to Legal Markdown formatted content
 * @example
 * ```typescript
 * const rstContent = `
 * ============
 * Introduction
 * ============
 *
 * This is a sample reStructuredText document.
 * `;
 *
 * const legalMarkdown = await convertRstToLegalMarkdown(rstContent);
 * console.log(legalMarkdown);
 * // Output:
 * // l. Introduction
 * //
 * // This is a sample reStructuredText document.
 * ```
 */
export async function convertRstToLegalMarkdown(content: string): Promise<string> {
  // Only convert if it looks like RST
  if (!isRestructuredText(content)) {
    return content;
  }

  return await parseRestructuredText(content);
}

/**
 * Converts reStructuredText content to Legal Markdown format (sync version)
 *
 * This synchronous function provides fallback conversion of reStructuredText
 * documents using regex-based parsing when Pandoc is not available. It's designed
 * for environments where async operations are not suitable or when simple
 * conversion is sufficient.
 *
 * @param {string} content - The input content that may contain reStructuredText
 * @returns {string} Legal Markdown formatted content
 * @example
 * ```typescript
 * const rstContent = `
 * Section Title
 * =============
 *
 * Some **bold** and *italic* text.
 * `;
 *
 * const legalMarkdown = convertRstToLegalMarkdownSync(rstContent);
 * console.log(legalMarkdown);
 * // Output:
 * // l. Section Title
 * //
 * // Some **bold** and *italic* text.
 * ```
 */
export function convertRstToLegalMarkdownSync(content: string): string {
  // Only convert if it looks like RST
  if (!isRestructuredText(content)) {
    return content;
  }

  return parseRestructuredTextSync(content);
}
