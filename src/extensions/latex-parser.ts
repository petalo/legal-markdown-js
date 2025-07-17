/**
 * @fileoverview LaTeX Parser Extension for Legal Markdown
 *
 * This module provides functionality to parse LaTeX (.tex) documents and convert
 * them to Legal Markdown format. It uses Pandoc for robust parsing with intelligent
 * fallback to basic regex-based parsing when Pandoc is not available or fails.
 *
 * Features:
 * - AST-based LaTeX parsing using Pandoc
 * - Fallback regex-based parsing for simple documents
 * - Content type detection and validation
 * - Section command conversion to Legal Markdown headers
 * - Text formatting preservation (textbf, textit, emph)
 * - Environment handling (enumerate, itemize, verbatim)
 * - Macro expansion and command processing
 * - Mathematical notation preservation
 * - Reference and label handling
 *
 * @example
 * ```typescript
 * import { convertLatexToLegalMarkdown, convertLatexToLegalMarkdownSync } from './latex-parser';
 *
 * const latexContent = `
 * \\documentclass{article}
 * \\begin{document}
 *
 * \\section{Introduction}
 * This is a sample LaTeX document with \\textbf{bold} and \\textit{italic} text.
 *
 * \\subsection{Terms}
 * Some content here.
 *
 * \\end{document}
 * `;
 *
 * // Async conversion (preferred)
 * const legalMarkdown = await convertLatexToLegalMarkdown(latexContent);
 *
 * // Sync conversion (fallback)
 * const legalMarkdownSync = convertLatexToLegalMarkdownSync(latexContent);
 * ```
 */

import { ContentDetector } from '../parsers/content-detector';
import { PandocFactory } from '../parsers/pandoc-factory';
import { FallbackParsers } from '../parsers/fallback-parsers';

/**
 * Convert LaTeX AST node to markdown
 */
function astToMarkdown(node: any, sectionLevel: number = 0): string {
  // Handle string nodes
  if (typeof node === 'string') {
    return node;
  }

  // Handle nodes with content property
  if ('content' in node && Array.isArray(node.content)) {
    return node.content.map((child: any) => astToMarkdown(child, sectionLevel)).join('');
  }

  // Handle specific node types
  if ('type' in node) {
    switch (node.type) {
      case 'root':
        return node.content
          .map((child: any, index: number) => {
            const result = astToMarkdown(child, sectionLevel);
            // Check if next node is a group that should be an argument
            if (child.type === 'macro' && index + 1 < node.content.length) {
              const nextNode = node.content[index + 1];
              if (nextNode.type === 'group') {
                // This group is likely the argument for the macro
                return handleMacroWithGroup(child, nextNode, sectionLevel);
              }
            }
            return result;
          })
          .filter((_: any, index: number) => {
            // Filter out groups that were processed as arguments
            if (index > 0 && node.content[index].type === 'group') {
              const prevNode = node.content[index - 1];
              if (prevNode.type === 'macro') {
                return false;
              }
            }
            return true;
          })
          .join('');

      case 'macro':
        return handleMacro(node as any, sectionLevel);

      case 'environment':
        return handleEnvironment(node as any, sectionLevel);

      case 'parbreak':
        return '\n\n';

      case 'comment':
        return ''; // Skip comments

      case 'group':
        return astToMarkdown(node.content, sectionLevel);

      case 'inlinemath':
        return `$${astToMarkdown(node.content, sectionLevel)}$`;

      case 'displaymath':
        return `$$${astToMarkdown(node.content, sectionLevel)}$$`;

      case 'verb':
      case 'verbatim':
        return `\`${node.content}\``;

      case 'string':
        return node.content || '';

      case 'whitespace':
        return ' ';

      default:
        // For unknown types, try to extract content
        if ('content' in node) {
          return astToMarkdown(node.content, sectionLevel);
        }
        return '';
    }
  }

  return '';
}

/**
 * Handle macro with a group as argument
 */
function handleMacroWithGroup(macro: any, group: any, sectionLevel: number): string {
  const command = macro.content;
  const content = extractContent(group);

  switch (command) {
    case 'textbf':
    case 'bf':
      return `**${content}**`;
    case 'textit':
    case 'emph':
    case 'it':
      return `*${content}*`;
    case 'texttt':
      return `\`${content}\``;
    case 'underline':
      return `__${content}__`;
    default:
      return content;
  }
}

/**
 * Handle LaTeX macros (commands)
 */
function handleMacro(node: any, sectionLevel: number): string {
  const command = node.content;
  const args = node.args || [];

  switch (command) {
    // Document structure
    case 'documentclass':
    case 'usepackage':
    case 'maketitle':
      return ''; // Skip these

    case 'title': {
      const titleArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (titleArg) {
        const title = extractContent(titleArg);
        return `---\ntitle: "${title}"\n---\n`;
      }
      return '';
    }

    case 'author': {
      const authorArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (authorArg) {
        const author = extractContent(authorArg);
        return `author: "${author}"\n`;
      }
      return '';
    }

    case 'date': {
      const dateArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (dateArg) {
        const date = extractContent(dateArg);
        return `date: "${date}"\n`;
      }
      return '';
    }

    // Sections
    case 'part':
    case 'chapter':
    case 'section':
    case 'subsection':
    case 'subsubsection':
    case 'paragraph':
    case 'subparagraph':
      return handleSection(command, args, sectionLevel);

    // Text formatting
    case 'textbf':
    case 'bf': {
      // Find the first non-empty argument
      const bfArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (bfArg) {
        return `**${extractContent(bfArg)}**`;
      }
      return '';
    }

    case 'textit':
    case 'emph':
    case 'it': {
      const itArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (itArg) {
        return `*${extractContent(itArg)}*`;
      }
      return '';
    }

    case 'texttt': {
      const ttArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (ttArg) {
        return `\`${extractContent(ttArg)}\``;
      }
      return '';
    }

    case 'underline': {
      const ulArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
      if (ulArg) {
        return `__${extractContent(ulArg)}__`;
      }
      return '';
    }

    // Links
    case 'href':
      if (args[0] && args[1]) {
        const url = extractContent(args[0]);
        const text = extractContent(args[1]);
        return `[${text}](${url})`;
      }
      return '';

    case 'url':
      if (args[0]) {
        const url = extractContent(args[0]);
        return `<${url}>`;
      }
      return '';

    case 'cite':
      if (args[0]) {
        const cite = extractContent(args[0]);
        return `[${cite}]`;
      }
      return '';

    case 'ref':
      if (args[0]) {
        const ref = extractContent(args[0]);
        return `[${ref}]`;
      }
      return '';

    case 'label':
      if (args[0]) {
        const label = extractContent(args[0]);
        return `<a name="${label}"></a>`;
      }
      return '';

    case 'footnote':
      if (args[0]) {
        const footnote = extractContent(args[0]);
        return `[^${footnoteCounter++}]`;
      }
      return '';

    // Quotes
    case '`':
      return "'";
    case "'":
      return "'";
    case '``':
      return '"';
    case "''":
      return '"';

    // Line breaks and spacing
    case '\\\\':
    case 'newline':
    case 'linebreak':
      return '\n';

    case 'par':
      return '\n\n';

    // Skip these commands
    case 'newpage':
    case 'clearpage':
    case 'pagebreak':
    case 'noindent':
    case 'bigskip':
    case 'medskip':
    case 'smallskip':
    case 'vspace':
    case 'hspace':
    case 'indent':
    case 'centering':
    case 'raggedright':
    case 'raggedleft':
    case 'today':
      return '';

    default:
      // For unknown macros, try to extract content from args
      if (args[0]) {
        return extractContent(args[0]);
      }
      return '';
  }
}

/**
 * Handle LaTeX environments
 */
function handleEnvironment(node: any, sectionLevel: number): string {
  const envName = node.env;
  const content = node.content;

  switch (envName) {
    case 'document':
      return astToMarkdown(content, sectionLevel);

    case 'itemize':
      return handleItemize(content, sectionLevel);

    case 'enumerate':
      return handleEnumerate(content, sectionLevel);

    case 'description':
      return handleDescription(content, sectionLevel);

    case 'verbatim':
    case 'lstlisting':
      return '```\n' + extractRawContent(content) + '\n```';

    case 'minted': {
      const lang = node.args?.[0] ? extractContent(node.args[0]) : '';
      return '```' + lang + '\n' + extractRawContent(content) + '\n```';
    }

    case 'quote':
    case 'quotation': {
      const quoteContent = astToMarkdown(content, sectionLevel);
      return quoteContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => `> ${line}`)
        .join('\n');
    }

    default:
      // For unknown environments, just process content
      return astToMarkdown(content, sectionLevel);
  }
}

/**
 * Handle section commands
 */
function handleSection(command: string, args: any[], currentLevel: number): string {
  const sectionArg = args.find((arg: any) => arg && arg.content && arg.content.length > 0);
  if (!sectionArg) return '';

  const title = extractContent(sectionArg);
  const levelMap: Record<string, number> = {
    part: 1,
    chapter: 1,
    section: 2,
    subsection: 3,
    subsubsection: 4,
    paragraph: 5,
    subparagraph: 5,
  };

  const level = levelMap[command] || 2;
  const prefix = 'l'.repeat(level);
  return `\n${prefix}. ${title}\n`;
}

/**
 * Handle itemize (bullet list) environment
 */
function handleItemize(content: any, sectionLevel: number): string {
  const items = extractListItems(content);
  return items.map(item => `- ${astToMarkdown(item, sectionLevel)}`).join('\n');
}

/**
 * Handle enumerate (numbered list) environment
 */
function handleEnumerate(content: any, sectionLevel: number): string {
  const items = extractListItems(content);
  return items
    .map((item, index) => `${index + 1}. ${astToMarkdown(item, sectionLevel)}`)
    .join('\n');
}

/**
 * Handle description list environment
 */
function handleDescription(content: any, sectionLevel: number): string {
  const items = extractListItems(content);
  return items
    .map(item => {
      // Look for optional argument in item macro
      if (item.type === 'macro' && item.content === 'item' && item.args?.[0]) {
        const term = extractContent(item.args[0]);
        const desc = item.args[1] ? extractContent(item.args[1]) : '';
        return `**${term}**\n  ${desc}`;
      }
      return astToMarkdown(item, sectionLevel);
    })
    .join('\n\n');
}

/**
 * Extract list items from content
 */
function extractListItems(content: any): any[] {
  if (!Array.isArray(content)) {
    content = content.content || [];
  }

  const items: any[] = [];
  let currentItem: any[] = [];

  for (const node of content) {
    if (node.type === 'macro' && node.content === 'item') {
      if (currentItem.length > 0) {
        items.push(currentItem);
      }
      currentItem = [];
    } else {
      currentItem.push(node);
    }
  }

  if (currentItem.length > 0) {
    items.push(currentItem);
  }

  return items;
}

/**
 * Extract text content from AST node
 */
function extractContent(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractContent).join('');

  // Handle argument nodes
  if (node.type === 'argument' && node.content) {
    return extractContent(node.content);
  }

  // Handle string nodes
  if (node.type === 'string' && node.content) {
    return node.content;
  }

  // Handle whitespace nodes
  if (node.type === 'whitespace') {
    return ' ';
  }

  // Handle group nodes
  if (node.type === 'group' && node.content) {
    return extractContent(node.content);
  }

  // Default case
  if (node.content) return extractContent(node.content);
  return '';
}

/**
 * Extract raw content without processing
 */
function extractRawContent(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.join('');
  if (node.content) return extractRawContent(node.content);
  return '';
}

let footnoteCounter = 1;

/**
 * Converts LaTeX content to legal markdown format using pandoc
 */
export async function parseLatex(content: string): Promise<string> {
  try {
    const parser = await PandocFactory.createForContent(content);

    if (parser) {
      const markdown = await parser.convert(content, 'latex', 'markdown');
      return markdown.replace(/\n{3,}/g, '\n\n').trim();
    } else {
      // Use fallback parser
      return FallbackParsers.convertLatexBasic(content);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error parsing LaTeX:', error);
    }
    // Use fallback parser on error
    return FallbackParsers.convertLatexBasic(content);
  }
}

/**
 * Synchronous version using fallback parser
 */
export function parseLatexSync(content: string): string {
  return FallbackParsers.convertLatexBasic(content);
}

/**
 * Checks if content appears to be LaTeX
 */
export function isLatex(content: string): boolean {
  return ContentDetector.needsLatexParser(content);
}

/**
 * Converts LaTeX content to Legal Markdown format (async version)
 *
 * This function provides robust conversion of LaTeX documents to Legal Markdown
 * format using Pandoc when available. It automatically detects LaTeX content
 * and only performs conversion when necessary, preserving non-LaTeX content unchanged.
 *
 * @async
 * @param {string} content - The input content that may contain LaTeX
 * @returns {Promise<string>} A promise that resolves to Legal Markdown formatted content
 * @example
 * ```typescript
 * const latexContent = `
 * \\section{Introduction}
 * This is a sample LaTeX document with \\textbf{bold} text.
 *
 * \\subsection{Terms}
 * Some content with \\textit{italic} formatting.
 * `;
 *
 * const legalMarkdown = await convertLatexToLegalMarkdown(latexContent);
 * console.log(legalMarkdown);
 * // Output:
 * // l. Introduction
 * // This is a sample LaTeX document with **bold** text.
 * //
 * // ll. Terms
 * // Some content with *italic* formatting.
 * ```
 */
export async function convertLatexToLegalMarkdown(content: string): Promise<string> {
  // Only convert if it looks like LaTeX
  if (!isLatex(content)) {
    return content;
  }

  return await parseLatex(content);
}

/**
 * Converts LaTeX content to Legal Markdown format (sync version)
 *
 * This synchronous function provides fallback conversion of LaTeX documents
 * using regex-based parsing when Pandoc is not available. It's designed for
 * environments where async operations are not suitable or when simple
 * conversion is sufficient.
 *
 * @param {string} content - The input content that may contain LaTeX
 * @returns {string} Legal Markdown formatted content
 * @example
 * ```typescript
 * const latexContent = `
 * \\section{Terms}
 * This agreement contains \\textbf{important} terms.
 * `;
 *
 * const legalMarkdown = convertLatexToLegalMarkdownSync(latexContent);
 * console.log(legalMarkdown);
 * // Output:
 * // l. Terms
 * // This agreement contains **important** terms.
 * ```
 */
export function convertLatexToLegalMarkdownSync(content: string): string {
  // Only convert if it looks like LaTeX
  if (!isLatex(content)) {
    return content;
  }

  return parseLatexSync(content);
}
