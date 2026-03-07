/**
 * Enhanced Remark plugin for Legal Markdown cross-references using custom AST nodes
 *
 * This plugin creates custom 'reference' AST nodes for |key| patterns, enabling:
 * - Single-pass AST processing for better performance
 * - More extensible architecture with custom node types
 * - Support for additional attributes (type, format) on references
 * - Independent from complex regex patterns
 * - Better integration with other remark plugins
 *
 * Architecture:
 * 1. Parse phase: Convert |key| patterns into custom 'reference' nodes
 * 2. Collection phase: Extract definitions from headers in single pass
 * 3. Resolution phase: Resolve all reference nodes in single pass
 * 4. Cleanup phase: Remove definition markers from headers
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { remarkCrossReferencesAST } from './cross-references-ast';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkCrossReferencesAST, { metadata: frontmatterData });
 *
 * const result = await processor.process(content);
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Heading, Text, PhrasingContent, Node } from 'mdast';
import { fieldTracker } from '../../extensions/tracking/field-tracker';
import { fieldSpan } from '../../extensions/tracking/field-span';
import { DEFAULT_HEADER_PATTERNS } from '../../constants/headers';
import type { YamlValue } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Custom AST node type for cross-references
 */
interface ReferenceNode extends Node {
  type: 'reference';
  /** The reference key */
  key: string;
  /** Reference type: 'definition' for |key| in headers, 'usage' for |key| in content */
  referenceType: 'definition' | 'usage';
  /** Optional reference format/style */
  format?: string;
  /** Optional reference category */
  category?: string;
  /** Resolved value (set during processing) */
  resolvedValue?: string;
  /** Whether this reference has been resolved */
  resolved?: boolean;
  /** Original text that was replaced */
  originalText: string;
}

/**
 * Cross-reference definition extracted from headers
 */
interface CrossReferenceDefinition {
  key: string;
  level: number;
  sectionNumber: string;
  sectionText: string;
  headerText: string;
  position?: {
    line: number;
    column: number;
  };
}

/**
 * Section counters for hierarchical numbering (extended to 9 levels)
 */
interface SectionCounters {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

/**
 * Plugin options for enhanced cross-reference processing
 */
interface CrossReferenceASTOptions {
  /** Document metadata containing level formats and other data */
  metadata: Record<string, YamlValue>;
  /** Enable debug logging */
  debug?: boolean;
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
}

/**
 * Default level formats for section numbering (extended to 9 levels)
 */
// Removed: local DEFAULT_LEVEL_FORMATS was dead code (never referenced).
// All defaults now come from DEFAULT_HEADER_PATTERNS in src/constants/headers.ts.

/**
 * Parse |key| patterns and convert them to custom reference nodes
 * This happens in a single pass during the initial AST traversal
 */
function parseReferences(tree: Root): void {
  visit(tree, 'text', (node: Text, index, parent) => {
    if (!parent || typeof index === 'undefined') return;

    // Find all |key| patterns in the text
    const text = node.value;
    const referencePattern = /\|([^|]+)\|/g;
    const matches = Array.from(text.matchAll(referencePattern));

    if (matches.length === 0) return;

    // Split the text node into multiple nodes, replacing |key| with reference nodes
    const newNodes: (Text | ReferenceNode)[] = [];
    let lastIndex = 0;

    for (const match of matches) {
      const [fullMatch, key] = match;
      const matchStart = match.index!;
      const matchEnd = matchStart + fullMatch.length;

      // Add text before the match
      if (matchStart > lastIndex) {
        const beforeText = text.slice(lastIndex, matchStart);
        if (beforeText) {
          newNodes.push({
            type: 'text',
            value: beforeText,
          });
        }
      }

      // Determine reference type based on context
      const isInHeader = parent.type === 'heading';
      const isDefinition = isInHeader && matchStart > text.length - fullMatch.length - 10; // Rough heuristic for end of header

      // Create reference node
      const referenceNode: ReferenceNode = {
        type: 'reference',
        key: key.trim(),
        referenceType: isDefinition ? 'definition' : 'usage',
        originalText: fullMatch,
        resolved: false,
      };

      newNodes.push(referenceNode);
      lastIndex = matchEnd;
    }

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      if (afterText) {
        newNodes.push({
          type: 'text',
          value: afterText,
        });
      }
    }

    // Replace the original text node with the new nodes
    parent.children.splice(index, 1, ...(newNodes as PhrasingContent[]));
  });
}

/**
 * Extract cross-reference definitions from reference nodes in headers
 * Single pass collection of all definitions
 */
function extractDefinitionsFromAST(
  root: Root,
  metadata: Record<string, YamlValue>,
  debug: boolean = false
): CrossReferenceDefinition[] {
  const crossReferences: CrossReferenceDefinition[] = [];
  const sectionCounters: SectionCounters = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0,
    level7: 0,
    level8: 0,
    level9: 0,
  };

  // Get level formats from metadata (supporting expanded system)
  const mStr = (keys: string[], fallback: string): string => {
    for (const k of keys) {
      const v = metadata[k];
      if (typeof v === 'string') return v;
    }
    return fallback;
  };
  const levelFormats: Record<string, string> = {
    level1: mStr(['level-1', 'level-one', 'level_one'], DEFAULT_HEADER_PATTERNS['level-1']),
    level2: mStr(['level-2', 'level-two', 'level_two'], DEFAULT_HEADER_PATTERNS['level-2']),
    level3: mStr(['level-3', 'level-three', 'level_three'], DEFAULT_HEADER_PATTERNS['level-3']),
    level4: mStr(['level-4', 'level-four', 'level_four'], DEFAULT_HEADER_PATTERNS['level-4']),
    level5: mStr(['level-5', 'level-five', 'level_five'], DEFAULT_HEADER_PATTERNS['level-5']),
    level6: mStr(['level-6', 'level-six', 'level_six'], DEFAULT_HEADER_PATTERNS['level-6']),
    level7: mStr(['level-7', 'level-seven', 'level_seven'], DEFAULT_HEADER_PATTERNS['level-7']),
    level8: mStr(['level-8', 'level-eight', 'level_eight'], DEFAULT_HEADER_PATTERNS['level-8']),
    level9: mStr(['level-9', 'level-nine', 'level_nine'], DEFAULT_HEADER_PATTERNS['level-9']),
  };

  visit(root, 'heading', (node: Heading) => {
    // Look for reference nodes in the heading
    let definitionKey: string | null = null;
    let headerText = '';

    // Extract text and find definition reference
    visit(node, child => {
      if (child.type === 'text') {
        headerText += child.value;
      } else if ((child as unknown as { type: string }).type === 'reference') {
        const refNode = child as unknown as ReferenceNode;
        if (refNode.referenceType === 'definition') {
          definitionKey = refNode.key;
        }
      }
    });

    if (definitionKey) {
      const level = Math.min(node.depth, 9); // Cap at 9 levels

      // Update section counters
      updateSectionCounters(sectionCounters, level);

      // Generate section number using the new header system logic
      const sectionNumber = generateSectionNumber(level, sectionCounters, levelFormats);
      const cleanHeaderText = headerText.trim();
      const sectionText = `${sectionNumber} ${cleanHeaderText}`;

      crossReferences.push({
        key: definitionKey,
        level,
        sectionNumber,
        sectionText: sectionText.trim(),
        headerText: cleanHeaderText,
        position: node.position
          ? {
              line: node.position.start.line,
              column: node.position.start.column,
            }
          : undefined,
      });

      if (debug) {
        logger.debug(`Found definition: ${definitionKey} -> ${sectionNumber}`);
      }
    }
  });

  return crossReferences;
}

/**
 * Update section counters based on current level (expanded to 9 levels)
 */
function updateSectionCounters(counters: SectionCounters, level: number): void {
  // Increment current level
  switch (level) {
    case 1:
      counters.level1++;
      counters.level2 = counters.level3 = counters.level4 = counters.level5 = 0;
      counters.level6 = counters.level7 = counters.level8 = counters.level9 = 0;
      break;
    case 2:
      counters.level2++;
      counters.level3 = counters.level4 = counters.level5 = 0;
      counters.level6 = counters.level7 = counters.level8 = counters.level9 = 0;
      break;
    case 3:
      counters.level3++;
      counters.level4 = counters.level5 = counters.level6 = 0;
      counters.level7 = counters.level8 = counters.level9 = 0;
      break;
    case 4:
      counters.level4++;
      counters.level5 = counters.level6 = counters.level7 = 0;
      counters.level8 = counters.level9 = 0;
      break;
    case 5:
      counters.level5++;
      counters.level6 = counters.level7 = counters.level8 = counters.level9 = 0;
      break;
    case 6:
      counters.level6++;
      counters.level7 = counters.level8 = counters.level9 = 0;
      break;
    case 7:
      counters.level7++;
      counters.level8 = counters.level9 = 0;
      break;
    case 8:
      counters.level8++;
      counters.level9 = 0;
      break;
    case 9:
      counters.level9++;
      break;
  }
}

/**
 * Generate section number using the enhanced header variable system
 */
function generateSectionNumber(
  level: number,
  counters: SectionCounters,
  levelFormats: Record<string, string>
): string {
  const format = levelFormats[`level${level}`] || `{{undefined-level-${level}}}`;
  const number = (counters as unknown as Record<string, number>)[`level${level}`];

  // If format is an undefined template, return it as-is
  if (format.startsWith('{{undefined-level-')) {
    return format;
  }

  // Use the same logic as the enhanced header system from Task 4
  let result = format.replace(/%n/g, number.toString());

  // Replace level-specific references (%l1, %l2, etc.)
  result = result.replace(/%l1/g, counters.level1.toString());
  result = result.replace(/%l2/g, counters.level2.toString());
  result = result.replace(/%l3/g, counters.level3.toString());
  result = result.replace(/%l4/g, counters.level4.toString());
  result = result.replace(/%l5/g, counters.level5.toString());
  result = result.replace(/%l6/g, counters.level6.toString());
  result = result.replace(/%l7/g, counters.level7.toString());
  result = result.replace(/%l8/g, counters.level8.toString());
  result = result.replace(/%l9/g, counters.level9.toString());

  // Replace alphabetic variables
  if (format.includes('%A')) {
    const alphaLabel = String.fromCharCode(64 + number); // 65 = 'A'
    result = result.replace(/%A/g, alphaLabel);
  }

  if (format.includes('%a')) {
    const alphaLabel = String.fromCharCode(96 + number); // 97 = 'a'
    result = result.replace(/%a/g, alphaLabel);
  }

  // Replace roman numeral variables
  if (format.includes('%R')) {
    const romanNumeral = toRomanNumeral(number);
    result = result.replace(/%R/g, romanNumeral);
  }

  if (format.includes('%r')) {
    const romanNumeral = toRomanNumeral(number).toLowerCase();
    result = result.replace(/%r/g, romanNumeral);
  }

  // Replace %o with fallback to %n
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
 * Resolve all reference nodes in a single pass
 */
function resolveReferences(
  root: Root,
  crossReferences: CrossReferenceDefinition[],
  metadata: Record<string, YamlValue>,
  enableFieldTracking: boolean = false,
  debug: boolean = false
): void {
  // Create lookup map for fast resolution
  const referenceMap = new Map<string, string>();
  for (const ref of crossReferences) {
    referenceMap.set(ref.key, ref.sectionNumber);
  }

  // Single pass to resolve all reference nodes
  visit(root, 'reference', (node: ReferenceNode, index, parent) => {
    if (!parent || typeof index === 'undefined') return;

    // Skip definition references (they get cleaned up separately)
    if (node.referenceType === 'definition') {
      return;
    }

    const key = node.key;
    let resolvedValue: string | undefined;
    let hasLogic = false;

    // Try internal section reference first
    resolvedValue = referenceMap.get(key);
    if (resolvedValue) {
      hasLogic = true;
    } else {
      // Fallback to metadata value
      const rawMetaValue = getNestedValue(metadata, key);
      if (rawMetaValue !== undefined) {
        resolvedValue = formatMetadataValue(rawMetaValue, key, metadata);
      }
    }

    // Track the field
    fieldTracker.trackField(`crossref.${key}`, {
      value: resolvedValue || '',
      originalValue: node.originalText,
      hasLogic,
    });

    if (debug) {
      logger.debug(`Resolving ${key} -> ${resolvedValue || 'UNRESOLVED'}`);
    }

    // Create replacement node
    let replacementNode: Text | { type: 'html'; value: string };

    if (enableFieldTracking) {
      // Create HTML node with field tracking
      const hasValue = resolvedValue !== undefined && resolvedValue !== '';
      const displayValue = resolvedValue || node.originalText;
      const kind = hasValue ? (hasLogic ? 'crossref' : 'imported') : 'missing';

      replacementNode = {
        type: 'html',
        value: fieldSpan(`crossref.${key}`, displayValue, kind),
      };
    } else {
      // Create simple text node
      replacementNode = {
        type: 'text',
        value: resolvedValue || node.originalText,
      };
    }

    // Replace the reference node
    (parent as unknown as { children: unknown[] }).children[index] = replacementNode;

    // Mark as resolved
    node.resolved = true;
    node.resolvedValue = resolvedValue;
  });
}

/**
 * Clean up definition reference nodes from headers
 */
function cleanupDefinitions(root: Root): void {
  visit(root, 'reference', (node: ReferenceNode, index, parent) => {
    if (!parent || typeof index === 'undefined') return;

    if (node.referenceType === 'definition') {
      // Remove the definition reference node
      (parent as unknown as { children: unknown[] }).children.splice(index as number, 1);
    }
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, YamlValue>, path: string): YamlValue | undefined {
  const keys = path.split('.');
  let value: YamlValue = obj;

  for (const key of keys) {
    if (
      value === undefined ||
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return undefined;
    }
    value = (value as Record<string, YamlValue>)[key];
  }

  return value;
}

/**
 * Format metadata values based on type and context
 */
function formatMetadataValue(
  value: YamlValue | undefined,
  key: string,
  metadata: Record<string, YamlValue>
): string {
  if (value === undefined) return '';
  if (value === null) return 'null';

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // ISO date format
  }

  // Handle currency amounts
  if (typeof value === 'number' && key.includes('amount')) {
    const rawCurrency = metadata.payment_currency;
    const currency = typeof rawCurrency === 'string' ? rawCurrency : 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  }

  // Default string conversion
  return String(value);
}

/**
 * Enhanced remark plugin for processing cross-references using custom AST nodes
 */
export const remarkCrossReferencesAST: Plugin<[CrossReferenceASTOptions], Root> = options => {
  const { metadata, debug = false, enableFieldTracking = false } = options;

  return (tree: Root) => {
    if (debug) {
      logger.debug('Starting enhanced cross-reference processing');
    }

    // Phase 1: Parse |key| patterns into custom reference nodes
    parseReferences(tree);

    // Phase 2: Extract definitions from headers (single pass)
    const crossReferences = extractDefinitionsFromAST(tree, metadata, debug);

    if (debug) {
      logger.debug(
        `Found ${crossReferences.length} definitions:`,
        crossReferences.map(ref => `${ref.key} -> ${ref.sectionNumber}`)
      );
    }

    // Store cross-references in metadata for external access
    metadata['_cross_references'] = crossReferences.map(ref => ({
      key: ref.key,
      sectionNumber: ref.sectionNumber,
      sectionText: ref.sectionText,
    }));

    // Phase 3: Resolve all reference nodes (single pass)
    resolveReferences(tree, crossReferences, metadata, enableFieldTracking, debug);

    // Phase 4: Clean up definition markers from headers
    cleanupDefinitions(tree);

    if (debug) {
      logger.debug('Enhanced cross-reference processing completed');
    }
  };
};

export type { CrossReferenceASTOptions, CrossReferenceDefinition };

// Exported for testing - not part of public API
export {
  parseReferences as _parseReferences,
  extractDefinitionsFromAST as _extractDefinitionsFromAST,
  updateSectionCounters as _updateSectionCounters,
  generateSectionNumber as _generateSectionNumber,
  toRomanNumeral as _toRomanNumeral,
  resolveReferences as _resolveReferences,
  formatMetadataValue as _formatMetadataValue,
};
