/**
 * Remark plugin to parse legal header syntax (l., ll., lll., etc.)
 *
 * This plugin converts paragraphs that start with legal header patterns
 * into proper heading nodes in the AST, which can then be processed
 * by the headers plugin for numbering.
 *
 * @example
 * Input:
 * ```
 * l. First Level Header
 * ll. Second Level Header
 * lll. Third Level Header
 * ```
 *
 * Converts to:
 * ```
 * # First Level Header
 * ## Second Level Header
 * ### Third Level Header
 * ```
 *
 * @module
 */

import { Plugin } from 'unified';
import { Root, Paragraph, Heading } from 'mdast';
import { visit } from 'unist-util-visit';

interface LegalHeadersParserOptions {
  debug?: boolean;
}

/**
 * Pattern to match legal header syntax at the beginning of a line
 * Matches: l., ll., lll., ... up to lllllllll. followed by space and text
 */
const LEGAL_HEADER_PATTERN = /^(l{1,9})\.\s+(.+)$/;

/**
 * Convert legal header syntax to heading level
 */
function getHeadingLevel(pattern: string): number {
  return pattern.length; // 'l' = 1, 'll' = 2, etc.
}

/**
 * Check if a paragraph node contains legal header syntax
 */
function isLegalHeader(node: Paragraph): { level: number; text: string } | null {
  // A paragraph with legal header syntax should have a single text child
  if (node.children.length === 1 && node.children[0].type === 'text') {
    const textNode = node.children[0];
    const match = textNode.value.match(LEGAL_HEADER_PATTERN);

    if (match) {
      const [, levelPattern, headerText] = match;
      return {
        level: getHeadingLevel(levelPattern),
        text: headerText.trim(),
      };
    }
  }

  // Also check for multiple children where the first is the pattern
  if (node.children.length > 0 && node.children[0].type === 'text') {
    const firstChild = node.children[0];
    const match = firstChild.value.match(/^(l{1,5})\.\s*/);

    if (match) {
      const [fullMatch, levelPattern] = match;
      // Get the rest of the text from all children
      const remainingText = firstChild.value.slice(fullMatch.length);
      const otherText = node.children
        .slice(1)
        .map(child => {
          if (child.type === 'text') return child.value;
          if (child.type === 'html') return (child as any).value || '';
          // For other types, we'll need to preserve them as children
          return '';
        })
        .join('');

      return {
        level: getHeadingLevel(levelPattern),
        text: (remainingText + otherText).trim(),
      };
    }
  }

  return null;
}

/**
 * Convert a paragraph node to a heading node
 */
function convertToHeading(node: Paragraph, level: number, text: string): Heading {
  // Create a new heading node without the l. prefix
  // The headers plugin will add the proper numbering
  const heading: Heading = {
    type: 'heading',
    depth: level as 1 | 2 | 3 | 4 | 5 | 6,
    children: parseMarkdownInlineFormatting(text),
  };

  // Mark this as a legal header and initialize hProperties for CSS classes
  (heading as any).data = {
    isLegalHeader: true,
    hProperties: {}, // Initialize for remarkHeaders to add CSS classes
  };

  // If the original paragraph had HTML children (like field tracking spans),
  // we need to preserve them
  if (
    node.children.length > 1 ||
    (node.children[0].type === 'text' && node.children[0].value.includes('<span'))
  ) {
    // Complex case: rebuild children preserving HTML
    const firstChild = node.children[0];
    if (firstChild.type === 'text') {
      const match = firstChild.value.match(/^(l{1,5})\.\s*/);
      if (match) {
        const [fullMatch] = match;
        firstChild.value = firstChild.value.slice(fullMatch.length);

        // Use the original children minus the pattern
        heading.children = node.children.filter(child => {
          // Skip empty text nodes
          if (child.type === 'text' && child.value.trim() === '') {
            return false;
          }
          return true;
        });
      }
    }
  }

  return heading;
}

/**
 * Remark plugin to parse legal header syntax
 */
const remarkLegalHeadersParser: Plugin<[LegalHeadersParserOptions?], Root> = (options = {}) => {
  const { debug = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('🔍 [remarkLegalHeadersParser] Parsing legal header syntax');
    }

    let convertedCount = 0;
    const nodesToReplace: Array<{
      parent: any;
      index: number;
      newNodes: Array<Heading | Paragraph>;
    }> = [];

    // Visit all paragraph nodes
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      // Check if this paragraph contains legal headers (simple or complex)
      if (parent && typeof index === 'number') {
        // First, try simple case: single text node with newlines
        if (node.children.length === 1 && node.children[0].type === 'text') {
          const textNode = node.children[0];
          const lines = textNode.value.split('\n');

          // Check if any line starts with legal header pattern
          const hasLegalHeaders = lines.some(line => LEGAL_HEADER_PATTERN.test(line));

          if (hasLegalHeaders) {
            const newNodes: Array<Heading | Paragraph> = [];
            const nonHeaderLines: string[] = [];

            // Process each line
            for (const line of lines) {
              const match = line.match(LEGAL_HEADER_PATTERN);

              if (match) {
                // If we have accumulated non-header lines, create a paragraph for them
                if (nonHeaderLines.length > 0) {
                  newNodes.push({
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: nonHeaderLines.join('\n'),
                      },
                    ],
                  });
                  nonHeaderLines.length = 0;
                }

                const [, levelPattern, headerText] = match;
                const level = getHeadingLevel(levelPattern);

                if (debug) {
                  console.log(
                    `🔄 [remarkLegalHeadersParser] Converting "${line.substring(0, 50)}..." to level ${level} heading`
                  );
                }

                // Create heading node with markdown formatting preserved
                const headingNode: Heading = {
                  type: 'heading',
                  depth: level as 1 | 2 | 3 | 4 | 5 | 6,
                  children: parseMarkdownInlineFormatting(headerText.trim()),
                };
                // Mark this as a legal header using data attribute
                (headingNode as any).data = { isLegalHeader: true };
                newNodes.push(headingNode);

                convertedCount++;
              } else {
                // Not a legal header, accumulate for paragraph
                nonHeaderLines.push(line);
              }
            }

            // Handle any remaining non-header lines
            if (nonHeaderLines.length > 0) {
              newNodes.push({
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    value: nonHeaderLines.join('\n'),
                  },
                ],
              });
            }

            // Store replacement info
            if (newNodes.length > 0) {
              nodesToReplace.push({ parent, index, newNodes });
            }
          }
        }
        // Complex case: paragraph with multiple children (text, emphasis, strong, etc.)
        else if (node.children.length > 1) {
          // Reconstruct the full text content to check for legal headers
          let fullText = '';
          const childrenMap: Map<number, { start: number; end: number; child: any }> = new Map();

          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const start = fullText.length;

            if (child.type === 'text') {
              fullText += child.value;
            } else if (child.type === 'emphasis') {
              const emphasisText = child.children.map((c: any) => c.value || '').join('');
              fullText += `_${emphasisText}_`;
            } else if (child.type === 'strong') {
              const strongText = child.children.map((c: any) => c.value || '').join('');
              fullText += `__${strongText}__`;
            } else if (child.type === 'link') {
              // Handle links - reconstruct markdown syntax [text](url)
              const linkText = child.children.map((c: any) => c.value || '').join('');
              const url = child.url || '';
              fullText += `[${linkText}](${url})`;
            } else if (child.type === 'inlineCode') {
              // Handle inline code - reconstruct markdown syntax `code`
              fullText += `\`${child.value || ''}\``;
            } else {
              // For other node types, try to extract text or use placeholder
              fullText += (child as any).value || '';
            }

            const end = fullText.length;
            childrenMap.set(i, { start, end, child });
          }

          const lines = fullText.split('\n');
          const hasLegalHeaders = lines.some(line => LEGAL_HEADER_PATTERN.test(line));

          if (hasLegalHeaders) {
            const newNodes: Array<Heading | Paragraph> = [];
            const nonHeaderLines: string[] = [];

            // Process each line
            for (const line of lines) {
              const match = line.match(LEGAL_HEADER_PATTERN);

              if (match) {
                // If we have accumulated non-header lines, create a paragraph for them
                if (nonHeaderLines.length > 0) {
                  newNodes.push({
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: nonHeaderLines.join('\n'),
                      },
                    ],
                  });
                  nonHeaderLines.length = 0;
                }

                const [, levelPattern, headerText] = match;
                const level = getHeadingLevel(levelPattern);

                if (debug) {
                  console.log(
                    `🔄 [remarkLegalHeadersParser] Converting complex "${line.substring(0, 50)}..." to level ${level} heading`
                  );
                }

                // For complex headers, we already have the formatted text with markdown syntax
                // Parse it again to get proper AST nodes
                const headingNode: Heading = {
                  type: 'heading',
                  depth: level as 1 | 2 | 3 | 4 | 5 | 6,
                  children: parseMarkdownInlineFormatting(headerText.trim()),
                };
                // Mark this as a legal header using data attribute
                (headingNode as any).data = { isLegalHeader: true };
                newNodes.push(headingNode);

                convertedCount++;
              } else {
                // Not a legal header, accumulate for paragraph
                nonHeaderLines.push(line);
              }
            }

            // Handle any remaining non-header lines
            if (nonHeaderLines.length > 0) {
              newNodes.push({
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    value: nonHeaderLines.join('\n'),
                  },
                ],
              });
            }

            // Store replacement info
            if (newNodes.length > 0) {
              nodesToReplace.push({ parent, index, newNodes });
            }
          }
        }
      } else {
        // Handle regular single-line legal headers
        if (debug) {
          const firstChildText =
            node.children[0]?.type === 'text' ? node.children[0].value : '<non-text>';
          console.log(`🔍 [remarkLegalHeadersParser] Single-line paragraph: "${firstChildText}"`);
        }
        const headerInfo = isLegalHeader(node);

        if (headerInfo && parent && typeof index === 'number') {
          if (debug) {
            const firstChildText = node.children[0].type === 'text' ? node.children[0].value : '';
            console.log(
              `🔄 [remarkLegalHeadersParser] Converting "${firstChildText.substring(0, 50)}..." to level ${headerInfo.level} heading`
            );
          }

          // Replace the paragraph with a heading
          const heading = convertToHeading(node, headerInfo.level, headerInfo.text);
          nodesToReplace.push({ parent, index, newNodes: [heading] });

          convertedCount++;
        }
      }
    });

    // Apply replacements in reverse order to maintain correct indices
    for (let i = nodesToReplace.length - 1; i >= 0; i--) {
      const { parent, index, newNodes } = nodesToReplace[i];
      parent.children.splice(index, 1, ...newNodes);
    }

    if (debug) {
      console.log(`✅ [remarkLegalHeadersParser] Converted ${convertedCount} legal headers`);
    }
  };
};

/**
 * Parse inline markdown formatting (bold, italic) within text
 * Converts _text_ to emphasis, __text__ to strong, *text* to emphasis, **text** to strong
 */
function parseMarkdownInlineFormatting(text: string): Array<any> {
  const children: Array<any> = [];
  const currentPos = 0;

  // Patterns for markdown formatting (order matters - longer patterns first)
  const patterns = [
    { regex: /\[([^\]]+)\]\([^)]+\)/g, type: 'link' }, // [text](url) - extract just the text
    { regex: /`([^`]+)`/g, type: 'inlineCode' }, // `code`
    { regex: /\*\*(.+?)\*\*/g, type: 'strong' }, // **bold**
    { regex: /__(.+?)__/g, type: 'strong' }, // __bold__
    { regex: /\*(.+?)\*/g, type: 'emphasis' }, // *italic*
    { regex: /_(.+?)_/g, type: 'emphasis' }, // _italic_
  ];

  // Find all matches for all patterns
  const allMatches: Array<{ start: number; end: number; type: string; content: string }> = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: pattern.type,
        content: match[1],
      });
    }
  }

  // Sort matches by position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first one)
  const validMatches = [];
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      validMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Build the children array
  let pos = 0;
  for (const match of validMatches) {
    // Add text before the match
    if (pos < match.start) {
      const beforeText = text.slice(pos, match.start);
      if (beforeText) {
        children.push({
          type: 'text',
          value: beforeText,
        });
      }
    }

    // Add the formatted node
    if (match.type === 'inlineCode') {
      // Inline code nodes have a value property, not children
      children.push({
        type: 'inlineCode',
        value: match.content,
      });
    } else if (match.type === 'link') {
      // For links, we only want the text content in headers (no actual link)
      children.push({
        type: 'text',
        value: match.content,
      });
    } else {
      // For emphasis and strong, use children structure
      children.push({
        type: match.type,
        children: [
          {
            type: 'text',
            value: match.content,
          },
        ],
      });
    }

    pos = match.end;
  }

  // Add remaining text
  if (pos < text.length) {
    const remainingText = text.slice(pos);
    if (remainingText) {
      children.push({
        type: 'text',
        value: remainingText,
      });
    }
  }

  // If no formatting was found, return simple text node
  if (children.length === 0) {
    return [
      {
        type: 'text',
        value: text,
      },
    ];
  }

  return children;
}

export default remarkLegalHeadersParser;
export { remarkLegalHeadersParser };
