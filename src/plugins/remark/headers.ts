/**
 * Remark Plugin for Legal Header Processing
 *
 * This plugin processes legal headers and numbering in markdown documents using
 * the remark AST. It provides automatic numbering, formatting, and section
 * management for legal document structure.
 *
 * Features:
 * - Automatic header numbering (l., ll., lll., etc.)
 * - Section references and cross-referencing
 * - Customizable numbering formats
 * - Reset and continuation options
 * - Indentation management
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkStringify from 'remark-stringify';
 * import { remarkHeaders } from './headers';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkHeaders, {
 *     metadata: { 'level-one': 'l', 'level-two': 'll' },
 *     noReset: false,
 *     noIndent: false
 *   })
 *   .use(remarkStringify);
 * ```
 *
 * @module
 */

import { Plugin } from 'unified';
import { Root, Heading } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Options for the remark headers plugin
 * @interface RemarkHeadersOptions
 */
export interface RemarkHeadersOptions {
  /** Document metadata containing header configurations */
  metadata: Record<string, any>;

  /** Disable automatic numbering reset */
  noReset?: boolean;

  /** Disable automatic indentation */
  noIndent?: boolean;

  /** Custom header patterns */
  headerPatterns?: Record<string, string>;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Header numbering state
 */
interface HeaderState {
  levelOne: number;
  levelTwo: number;
  levelThree: number;
  levelFour: number;
  levelFive: number;
  levelSix: number;
  levelSeven: number;
  levelEight: number;
  levelNine: number;
  customLevels: Map<string, number>;
}

/**
 * Header configuration extracted from metadata
 */
interface HeaderConfig {
  levelOne: string | null;
  levelTwo: string | null;
  levelThree: string | null;
  levelFour: string | null;
  levelFive: string | null;
  levelSix: string | null;
  levelSeven: string | null;
  levelEight: string | null;
  levelNine: string | null;
  customFormats: Map<string, string>;
}

/**
 * Remark plugin for processing legal headers
 *
 * This plugin transforms markdown headers into properly numbered legal headers
 * according to legal document conventions. It supports multiple numbering
 * formats and can maintain state across the document.
 *
 * @param options - Configuration options for header processing
 * @returns Remark plugin transformer function
 */
export const remarkHeaders: Plugin<[RemarkHeadersOptions], Root> = options => {
  const { metadata = {}, noReset = false, noIndent = false, debug = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('[remarkHeaders] Processing headers with options:', options);
      console.log('[remarkHeaders] Metadata:', metadata);
    }

    // Initialize header configuration from metadata
    const config = extractHeaderConfig(metadata);
    const state = initializeHeaderState();

    // Count legal headings first
    let headingCount = 0;
    visit(tree, 'heading', (node: Heading) => {
      if ((node as any).data?.isLegalHeader) {
        headingCount++;
      }
    });

    if (debug) {
      console.log(`[remarkHeaders] Found ${headingCount} legal headings in document`);
    }

    // Process only headings that come from legal header syntax
    visit(tree, 'heading', (node: Heading, index, parent) => {
      if ((node as any).data?.isLegalHeader) {
        if (debug) {
          console.log(
            `[remarkHeaders] Processing legal heading at depth ${node.depth}:`,
            extractTextContent(node)
          );
        }
        processHeader(node, config, state, { noReset, noIndent, debug });
      }
    });

    // Second pass: Replace heading nodes marked for HTML replacement
    visit(tree, 'heading', (node: Heading, index, parent) => {
      if ((node as any).__needsHtmlReplacement && parent && typeof index === 'number') {
        if (debug) {
          console.log('[remarkHeaders] Replacing heading with HTML node to preserve indentation');
        }

        // Replace the heading node with an HTML node
        const htmlNode = {
          type: 'html',
          value: (node as any).__htmlContent,
        };

        parent.children[index] = htmlNode as any;
      }
    });

    if (debug) {
      console.log('[remarkHeaders] Final header state:', state);
    }
  };
};

/**
 * Extract header configuration from document metadata
 */
function extractHeaderConfig(metadata: Record<string, any>): HeaderConfig {
  // Helper to get first defined value (including empty strings)
  const getFirstDefined = (...keys: string[]): string | null => {
    for (const key of keys) {
      if (key in metadata) {
        return metadata[key];
      }
    }
    return null;
  };

  return {
    levelOne: getFirstDefined('level-1', 'level-one', 'level_one'),
    levelTwo: getFirstDefined('level-2', 'level-two', 'level_two'),
    levelThree: getFirstDefined('level-3', 'level-three', 'level_three'),
    levelFour: getFirstDefined('level-4', 'level-four', 'level_four'),
    levelFive: getFirstDefined('level-5', 'level-five', 'level_five'),
    levelSix: getFirstDefined('level-6', 'level-six', 'level_six'),
    levelSeven: getFirstDefined('level-7', 'level-seven', 'level_seven'),
    levelEight: getFirstDefined('level-8', 'level-eight', 'level_eight'),
    levelNine: getFirstDefined('level-9', 'level-nine', 'level_nine'),
    customFormats: new Map(),
  };
}

/**
 * Initialize header numbering state
 */
function initializeHeaderState(): HeaderState {
  return {
    levelOne: 0,
    levelTwo: 0,
    levelThree: 0,
    levelFour: 0,
    levelFive: 0,
    levelSix: 0,
    levelSeven: 0,
    levelEight: 0,
    levelNine: 0,
    customLevels: new Map(),
  };
}

/**
 * Process a single header node
 */
function processHeader(
  node: Heading,
  config: HeaderConfig,
  state: HeaderState,
  options: { noReset: boolean; noIndent: boolean; debug: boolean }
) {
  const { noReset, noIndent, debug } = options;

  // Determine header level and format
  const level = node.depth;
  const format = getHeaderFormat(level, config);

  // Update numbering state
  updateHeaderState(level, state, noReset);

  // Get the current number for this level
  const number = getHeaderNumber(level, state);

  // Format the header text
  const headerText = formatHeaderText(node, format, number, state, { noIndent, debug });

  // Update the node's children with the new formatted text
  if (headerText !== null) {
    // Check if we need to replace with HTML node due to indentation
    const hasIndentation = headerText.startsWith('  ');

    if (hasIndentation) {
      // We need to return this information to the main processor
      // to replace the heading node with an HTML node
      (node as any).__needsHtmlReplacement = true;
      (node as any).__htmlContent = `${'#'.repeat(level)} ${headerText}`;
    }

    updateHeaderNode(node, headerText);
  }

  if (debug) {
    console.log(`[remarkHeaders] Processed level ${level} header:`, headerText);
  }
}

/**
 * Get header format for a given level
 */
function getHeaderFormat(level: number, config: HeaderConfig): string {
  let format: string | null = null;

  switch (level) {
    case 1:
      format = config.levelOne;
      break;
    case 2:
      format = config.levelTwo;
      break;
    case 3:
      format = config.levelThree;
      break;
    case 4:
      format = config.levelFour;
      break;
    case 5:
      format = config.levelFive;
      break;
    case 6:
      format = config.levelSix;
      break;
    case 7:
      format = config.levelSeven;
      break;
    case 8:
      format = config.levelEight;
      break;
    case 9:
      format = config.levelNine;
      break;
    default:
      format = null;
  }

  // If no format is defined, return undefined template
  if (format === null || format === undefined) {
    return `{{undefined-level-${level}}}`;
  }

  return format;
}

/**
 * Update header numbering state based on current level
 */
function updateHeaderState(level: number, state: HeaderState, noReset: boolean) {
  switch (level) {
    case 1:
      state.levelOne++;
      if (!noReset) {
        state.levelTwo = 0;
        state.levelThree = 0;
        state.levelFour = 0;
        state.levelFive = 0;
        state.levelSix = 0;
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 2:
      state.levelTwo++;
      if (!noReset) {
        state.levelThree = 0;
        state.levelFour = 0;
        state.levelFive = 0;
        state.levelSix = 0;
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 3:
      state.levelThree++;
      if (!noReset) {
        state.levelFour = 0;
        state.levelFive = 0;
        state.levelSix = 0;
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 4:
      state.levelFour++;
      if (!noReset) {
        state.levelFive = 0;
        state.levelSix = 0;
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 5:
      state.levelFive++;
      if (!noReset) {
        state.levelSix = 0;
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 6:
      state.levelSix++;
      if (!noReset) {
        state.levelSeven = 0;
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 7:
      state.levelSeven++;
      if (!noReset) {
        state.levelEight = 0;
        state.levelNine = 0;
      }
      break;
    case 8:
      state.levelEight++;
      if (!noReset) {
        state.levelNine = 0;
      }
      break;
    case 9:
      state.levelNine++;
      break;
  }
}

/**
 * Get the current number for a header level
 */
function getHeaderNumber(level: number, state: HeaderState): number {
  switch (level) {
    case 1:
      return state.levelOne;
    case 2:
      return state.levelTwo;
    case 3:
      return state.levelThree;
    case 4:
      return state.levelFour;
    case 5:
      return state.levelFive;
    case 6:
      return state.levelSix;
    case 7:
      return state.levelSeven;
    case 8:
      return state.levelEight;
    case 9:
      return state.levelNine;
    default:
      return 0;
  }
}

/**
 * Get the value for a specific level (helper for leading zero formatting)
 */
function getLevelValue(level: number, state: HeaderState): number {
  return getHeaderNumber(level, state);
}

/**
 * Format header text with numbering
 */
function formatHeaderText(
  node: Heading,
  format: string,
  number: number,
  state: HeaderState,
  options: { noIndent: boolean; debug: boolean }
): string | null {
  const { noIndent, debug } = options;
  const level = node.depth;

  // Extract current text content
  const currentText = extractTextContent(node);

  if (!currentText) {
    if (debug) {
      console.log('[remarkHeaders] No text content found in header');
    }
    return null;
  }

  // Check if header already has numbering
  if (hasExistingNumbering(currentText, format)) {
    if (debug) {
      console.log('[remarkHeaders] Header already has numbering, skipping');
    }
    return null;
  }

  // Apply numbering format with full state
  const numberedText = applyNumberingFormat(format, number, node.depth, state);

  // Apply indentation if not disabled
  const indentation = noIndent ? '' : '  '.repeat(Math.max(0, level - 1));

  // Combine with original text
  return `${indentation}${numberedText} ${currentText}`;
}

/**
 * Extract text content from header node
 */
function extractTextContent(node: Heading): string {
  const result = node.children
    .map(child => {
      if (child.type === 'text') {
        return child.value;
      } else if (child.type === 'html') {
        // Handle HTML nodes (e.g., field tracking spans) - preserve the HTML
        return child.value || '';
      } else if (child.type === 'strong' || child.type === 'emphasis') {
        // Handle formatted text within headers - preserve formatting
        const innerText = child.children
          .map(grandchild => (grandchild.type === 'text' ? grandchild.value : ''))
          .join('');

        // Convert to markdown syntax (use asterisks for consistency)
        if (child.type === 'strong') {
          return `**${innerText}**`;
        } else if (child.type === 'emphasis') {
          return `*${innerText}*`;
        }
        return innerText;
      } else if (child.type === 'link') {
        // Handle links - extract just the text content
        const linkText = child.children
          .map(grandchild => (grandchild.type === 'text' ? grandchild.value : ''))
          .join('');
        return linkText;
      } else if (child.type === 'inlineCode') {
        // Handle inline code - extract the value
        return child.value || '';
      }
      return '';
    })
    .join('')
    .trim();

  return result;
}

/**
 * Check if header already has numbering
 */
function hasExistingNumbering(text: string, format: string): boolean {
  // Check if text already starts with a numbering pattern
  // Common patterns: "Article 1.", "Section 2.", "(1)", "1.", "1.1", etc.
  const numberingPatterns = [
    /^Article\s+\d+\.?\s*/i,
    /^Section\s+\d+\.?\s*/i,
    /^Chapter\s+\d+\.?\s*/i,
    /^\(\d+\)\s*/,
    /^\d+\.\s*/,
    /^\d+\.\d+\.?\s*/,
    /^[a-z]\.\s*/i,
    /^\([a-z]\)\s*/i,
    /^[ivxlcdm]+\.\s*/i,
    /^\([ivxlcdm]+\)\s*/i,
  ];

  return numberingPatterns.some(pattern => pattern.test(text));
}

/**
 * Apply numbering format with actual number
 */
function applyNumberingFormat(
  format: string,
  number: number,
  level: number,
  state: HeaderState
): string {
  // Handle special leading zero formats first (e.g., %02n, %03n)
  let result = format;

  // Handle %0Xn format (leading zero numbers for current level)
  const leadingZeroPattern = /%0(\d+)n/g;
  result = result.replace(leadingZeroPattern, (match, digits) => {
    return number.toString().padStart(parseInt(digits), '0');
  });

  // Handle leading zero formats for direct level references (%0Xl1, %0Xl2, etc.)
  for (let i = 1; i <= 9; i++) {
    const leadingZeroLevelPattern = new RegExp(`%0(\\d+)l${i}`, 'g');
    result = result.replace(leadingZeroLevelPattern, (match, digits) => {
      const levelValue = getLevelValue(i, state);
      return levelValue.toString().padStart(parseInt(digits), '0');
    });
  }

  // Replace %n with the actual number (non-leading-zero version)
  result = result.replace(/%n/g, number.toString());

  // Replace level-specific references (%l1, %l2, %l3, %l4, %l5, %l6, %l7, %l8, %l9)
  result = result.replace(/%l1/g, state.levelOne.toString());
  result = result.replace(/%l2/g, state.levelTwo.toString());
  result = result.replace(/%l3/g, state.levelThree.toString());
  result = result.replace(/%l4/g, state.levelFour.toString());
  result = result.replace(/%l5/g, state.levelFive.toString());
  result = result.replace(/%l6/g, state.levelSix.toString());
  result = result.replace(/%l7/g, state.levelSeven.toString());
  result = result.replace(/%l8/g, state.levelEight.toString());
  result = result.replace(/%l9/g, state.levelNine.toString());

  // Replace alphabetic variables
  // %A = uppercase letters (A, B, C, ...)
  if (format.includes('%A')) {
    const alphaNumber = level === 4 && format.includes('%n%A') ? state.levelFour : number;
    const alphaLabel = String.fromCharCode(64 + alphaNumber); // 65 = 'A'
    result = result.replace(/%A/g, alphaLabel);
  }

  // %a = lowercase letters (a, b, c, ...) - alias for %c
  if (format.includes('%a')) {
    const alphaNumber = level === 4 && format.includes('%n%a') ? state.levelFour : number;
    const alphaLabel = String.fromCharCode(96 + alphaNumber); // 97 = 'a'
    result = result.replace(/%a/g, alphaLabel);
  }

  // Replace %c with alphabetic label (a, b, c, ...)
  if (format.includes('%c')) {
    // For level 4 formats like (%n%c), use level 4 number
    // For other formats, use current level number
    const alphaNumber = level === 4 && format.includes('%n%c') ? state.levelFour : number;
    const alphaLabel = String.fromCharCode(96 + alphaNumber); // 97 = 'a'
    result = result.replace(/%c/g, alphaLabel);
  }

  // Replace %r with lowercase roman numerals
  if (format.includes('%r')) {
    // For level 5 formats like (%n%c%r), use level 5 number
    // For other formats, use current level number
    const romanNumber =
      level === 5 && (format.includes('%c%r') || format.includes('%n%c%r'))
        ? state.levelFive
        : number;
    const romanNumeral = toRomanNumeral(romanNumber).toLowerCase();
    result = result.replace(/%r/g, romanNumeral);
  }

  // Replace %R with uppercase roman numerals
  if (format.includes('%R')) {
    const romanNumeral = toRomanNumeral(number);
    result = result.replace(/%R/g, romanNumeral);
  }

  // Replace %o with fallback to %n (placeholder for future extension)
  // Currently just falls back to numeric representation
  if (format.includes('%o')) {
    result = result.replace(/%o/g, number.toString());
  }

  return result;
}

/**
 * Convert number to Roman numeral
 */
function toRomanNumeral(num: number): string {
  const romanNumerals: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

/**
 * Get indentation for header level
 */
function getIndentationForLevel(level: number): string {
  // Each level adds 2 spaces of indentation
  return '  '.repeat(Math.max(0, level - 1));
}

/**
 * Checks if text contains field tracking spans
 * @param text - The text to check
 * @returns True if text contains field tracking HTML spans
 */
function containsFieldTrackingSpans(text: string): boolean {
  return (
    text.includes('<span class="legal-field') ||
    text.includes('<span class="imported-value') ||
    text.includes('<span class="missing-value') ||
    text.includes('<span class="highlight')
  );
}

/**
 * Update header node with new text content
 */
/**
 * Preserve original formatting while adding numbering prefix
 * @param node - The heading node with original formatting
 * @param newText - The complete new text with numbering
 * @returns Array of children nodes or null if preservation not possible
 */
function preserveFormattingInHeader(node: Heading, newText: string): any[] | null {
  // Extract the original text content to find where the numbering ends
  const originalText = extractTextContent(node);
  if (!originalText) return null;

  // Find the numbering part by comparing newText with originalText
  const numberingIndex = newText.lastIndexOf(originalText);
  if (numberingIndex === -1) return null;

  const numberingPrefix = newText.substring(0, numberingIndex);

  // Create new children array: numbering prefix + original formatted children
  const newChildren: any[] = [];

  // Add numbering prefix as text node
  if (numberingPrefix) {
    newChildren.push({
      type: 'text',
      value: numberingPrefix,
    });
  }

  // Add all original children (which contain the formatting)
  newChildren.push(...node.children);

  return newChildren;
}

function updateHeaderNode(node: Heading, newText: string) {
  // Check if the new text contains HTML spans (field tracking) or leading spaces (indentation)
  // If so, create an HTML node instead of a text node to prevent escaping
  const hasFieldTracking = containsFieldTrackingSpans(newText);
  const hasLeadingSpaces = newText.startsWith('  ');
  const hasMarkdownFormatting = newText.includes('*') || newText.includes('_');

  if (hasFieldTracking || hasLeadingSpaces || hasMarkdownFormatting) {
    // Replace the entire children array with new HTML node
    node.children = [
      {
        type: 'html',
        value: newText,
      } as any,
    ];
  } else {
    // For headers, always use plain text to ensure clean, consistent formatting
    // This flattens all inline formatting (links, inline code, emphasis, strong)
    node.children = [
      {
        type: 'text',
        value: newText,
      },
    ];
  }
}

export default remarkHeaders;
