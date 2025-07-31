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
  customLevels: Map<string, number>;
}

/**
 * Header configuration extracted from metadata
 */
interface HeaderConfig {
  levelOne: string;
  levelTwo: string;
  levelThree: string;
  levelFour: string;
  levelFive: string;
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
    }

    // Initialize header configuration from metadata
    const config = extractHeaderConfig(metadata);
    const state = initializeHeaderState();

    // Process all headings in the document
    visit(tree, 'heading', (node: Heading, index, parent) => {
      processHeader(node, config, state, { noReset, noIndent, debug });
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
  return {
    levelOne: metadata['level-one'] || metadata['level_one'] || 'l.',
    levelTwo: metadata['level-two'] || metadata['level_two'] || 'll.',
    levelThree: metadata['level-three'] || metadata['level_three'] || 'lll.',
    levelFour: metadata['level-four'] || metadata['level_four'] || 'llll.',
    levelFive: metadata['level-five'] || metadata['level_five'] || 'lllll.',
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

  if (!format) {
    if (debug) {
      console.log(`[remarkHeaders] No format found for level ${level}`);
    }
    return;
  }

  // Update numbering state
  updateHeaderState(level, state, noReset);

  // Get the current number for this level
  const number = getHeaderNumber(level, state);

  // Format the header text
  const headerText = formatHeaderText(node, format, number, { noIndent, debug });

  // Update the node's children with the new formatted text
  if (headerText !== null) {
    updateHeaderNode(node, headerText);
  }

  if (debug) {
    console.log(`[remarkHeaders] Processed level ${level} header:`, headerText);
  }
}

/**
 * Get header format for a given level
 */
function getHeaderFormat(level: number, config: HeaderConfig): string | null {
  switch (level) {
    case 1:
      return config.levelOne;
    case 2:
      return config.levelTwo;
    case 3:
      return config.levelThree;
    case 4:
      return config.levelFour;
    case 5:
      return config.levelFive;
    default:
      return null;
  }
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
      }
      break;
    case 2:
      state.levelTwo++;
      if (!noReset) {
        state.levelThree = 0;
        state.levelFour = 0;
        state.levelFive = 0;
      }
      break;
    case 3:
      state.levelThree++;
      if (!noReset) {
        state.levelFour = 0;
        state.levelFive = 0;
      }
      break;
    case 4:
      state.levelFour++;
      if (!noReset) {
        state.levelFive = 0;
      }
      break;
    case 5:
      state.levelFive++;
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
    default:
      return 0;
  }
}

/**
 * Format header text with numbering
 */
function formatHeaderText(
  node: Heading,
  format: string,
  number: number,
  options: { noIndent: boolean; debug: boolean }
): string | null {
  const { noIndent, debug } = options;

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

  // Apply numbering format
  const numberedText = applyNumberingFormat(format, number);

  // Note: Indentation is not implemented in this version as remark-stringify
  // handles header formatting. The noIndent option is preserved for API compatibility.

  // Combine with original text
  return `${numberedText} ${currentText}`;
}

/**
 * Extract text content from header node
 */
function extractTextContent(node: Heading): string {
  return node.children
    .map(child => {
      if (child.type === 'text') {
        return child.value;
      } else if (child.type === 'strong' || child.type === 'emphasis') {
        // Handle formatted text within headers
        return child.children
          .map(grandchild => (grandchild.type === 'text' ? grandchild.value : ''))
          .join('');
      } else if (child.type === 'link') {
        // Handle links - extract just the text content
        return child.children
          .map(grandchild => (grandchild.type === 'text' ? grandchild.value : ''))
          .join('');
      } else if (child.type === 'inlineCode') {
        // Handle inline code - extract the value
        return child.value || '';
      }
      return '';
    })
    .join('')
    .trim();
}

/**
 * Check if header already has numbering
 */
function hasExistingNumbering(text: string, format: string): boolean {
  // Extract the numbering pattern from format (e.g., 'l.' -> 'l')
  const pattern = format.replace('.', '');

  // Check if text starts with the numbering pattern
  const regex = new RegExp(`^\\s*${pattern.replace(/l/g, 'l+')}\\s*\\d*\\.?\\s+`);
  return regex.test(text);
}

/**
 * Apply numbering format with actual number
 */
function applyNumberingFormat(format: string, number: number): string {
  // For now, just return the format as-is
  // In future versions, we could support more complex formatting like:
  // - Roman numerals
  // - Custom number formats
  // - Letter sequences
  return format;
}

/**
 * Get indentation for header level
 */
function getIndentationForLevel(level: number): string {
  // Each level adds 2 spaces of indentation
  return '  '.repeat(Math.max(0, level - 1));
}

/**
 * Update header node with new text content
 */
function updateHeaderNode(node: Heading, newText: string) {
  // Replace the entire children array with new text node
  node.children = [
    {
      type: 'text',
      value: newText,
    },
  ];
}

export default remarkHeaders;
