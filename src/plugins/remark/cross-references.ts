/**
 * Remark plugin for Legal Markdown cross-references
 *
 * This plugin processes internal cross-references in Legal Markdown documents
 * using AST-based processing to avoid text contamination issues. It handles:
 * - Header extraction with |key| syntax (l. **Title** |key|)
 * - Section numbering based on frontmatter formats
 * - Cross-reference resolution throughout the document
 * - Integration with field tracking for highlighting
 *
 * Architecture:
 * 1. First pass: Extract cross-reference definitions from headers
 * 2. Generate section numbers based on legal numbering formats
 * 3. Second pass: Replace |key| references with section numbers
 * 4. Integrate with field tracker for highlighting support
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkCrossReferences from './cross-references';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkCrossReferences, { metadata: frontmatterData });
 *
 * const result = await processor.process(content);
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { toString } from 'mdast-util-to-string';
import type { Plugin } from 'unified';
import type { Root, Heading, Text, PhrasingContent } from 'mdast';
import { fieldTracker } from '../../extensions/tracking/field-tracker';
import { getRomanNumeral, getAlphaLabel } from '../../utils/number-utilities';

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
 * Section counters for tracking hierarchical numbering
 */
interface SectionCounters {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
}

/**
 * Plugin options for cross-reference processing
 */
interface CrossReferenceOptions {
  /** Document metadata containing level formats and other data */
  metadata: Record<string, any>;
  /** Enable debug logging */
  debug?: boolean;
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
}

/**
 * Default level formats for section numbering
 */
const DEFAULT_LEVEL_FORMATS = {
  level1: 'Article %n.',
  level2: 'Section %n.',
  level3: '(%n)',
  level4: '(%n)',
  level5: '(%n%c)',
  level6: 'Annex %r -',
};

/**
 * Extract text content from a node, handling various node types
 */
function extractTextFromNode(node: PhrasingContent): string {
  if (node.type === 'text') {
    return node.value;
  }

  if ('children' in node && node.children) {
    return node.children.map(child => extractTextFromNode(child as PhrasingContent)).join('');
  }

  return toString(node);
}

/**
 * Replace text content in a text node
 */
function replaceTextInNode(node: Text, oldText: string, newText: string): void {
  node.value = node.value.replace(oldText, newText);
}

/**
 * Update section counters based on current level
 */
function updateSectionCounters(counters: SectionCounters, level: number): void {
  // Increment current level
  switch (level) {
    case 1:
      counters.level1++;
      counters.level2 = 0;
      counters.level3 = 0;
      counters.level4 = 0;
      counters.level5 = 0;
      counters.level6 = 0;
      break;
    case 2:
      counters.level2++;
      counters.level3 = 0;
      counters.level4 = 0;
      counters.level5 = 0;
      counters.level6 = 0;
      break;
    case 3:
      counters.level3++;
      counters.level4 = 0;
      counters.level5 = 0;
      counters.level6 = 0;
      break;
    case 4:
      counters.level4++;
      counters.level5 = 0;
      counters.level6 = 0;
      break;
    case 5:
      counters.level5++;
      counters.level6 = 0;
      break;
    case 6:
      counters.level6++;
      break;
  }
}

/**
 * Generate section number based on level and counters with academic format support
 */
function generateSectionNumber(
  level: number,
  counters: SectionCounters,
  levelFormats: Record<string, string>
): string {
  const format = levelFormats[`level${level}`] || `Level ${level}.`;
  const count = (counters as any)[`level${level}`];

  // Create array representation for easier access (matching header-processor logic)
  const headerNumbers = [
    counters.level1,
    counters.level2,
    counters.level3,
    counters.level4,
    counters.level5,
    counters.level6,
  ];

  let formattedHeader = format;

  // Handle special cases for levels 4 and 5 (from header-processor logic)
  if (level === 4) {
    // Level 4 format: (%n%c) where %n is level 3 number, %c is level 4 letter
    if (
      formattedHeader.includes('%n%c') &&
      !formattedHeader.includes('.%s') &&
      !formattedHeader.includes('.%t') &&
      !formattedHeader.includes('.%f')
    ) {
      formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[2].toString());
      formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[3]));
      return formattedHeader;
    }
  } else if (level === 5) {
    // Level 5 format: (%n%c%r) where %n is level 3 number, %c is level 4 letter, %r is level 5 roman
    if (formattedHeader.includes('%c%r') || formattedHeader.includes('%n%c%r')) {
      formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[2].toString());
      formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[3]));
      formattedHeader = formattedHeader.replace(/%r/g, getRomanNumeral(headerNumbers[4], true));
      return formattedHeader;
    }
  }

  // Detect academic/hierarchical formats
  const hasAcademicContext =
    (levelFormats.level3 && levelFormats.level3.includes('%n.%s.%t')) ||
    (levelFormats.level4 && levelFormats.level4.includes('%n.%s.%t.%f')) ||
    (levelFormats.level5 && levelFormats.level5.includes('%n.%s.%t.%f.%i'));

  const isAcademicHierarchical =
    (formattedHeader.includes('.%s.%t') ||
      formattedHeader.includes('.%t.%f') ||
      formattedHeader.includes('.%f.%i') ||
      (formattedHeader.includes('.%s') && hasAcademicContext)) &&
    !formattedHeader.includes('%r.') &&
    !formattedHeader.includes('%R.') &&
    !formattedHeader.includes('%c.');

  // Handle hierarchical patterns for %c and %r
  const isHierarchicalAlpha = formattedHeader.includes('%c.%n');
  const isHierarchicalRoman =
    formattedHeader.includes('%r.%n') || formattedHeader.includes('%R.%n');

  // Replace %n based on format type
  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %n typically refers to level 1 number
    formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[0].toString());
  } else {
    // In standard formats, %n refers to current level number
    formattedHeader = formattedHeader.replace(/%n/g, headerNumbers[level - 1].toString());
  }

  // Replace reference variables (%s, %t, %f, %i)
  if (isAcademicHierarchical) {
    // In academic hierarchical formats, %s refers to level 2
    formattedHeader = formattedHeader.replace(/%s/g, headerNumbers[1].toString());
  } else {
    // In simple formats like %n.%s, %s refers to level 1
    formattedHeader = formattedHeader.replace(/%s/g, headerNumbers[0].toString());
  }

  // %t = level 3 current number
  formattedHeader = formattedHeader.replace(/%t/g, headerNumbers[2].toString());

  // %f = level 4 current number
  formattedHeader = formattedHeader.replace(/%f/g, headerNumbers[3].toString());

  // %i = level 5 current number
  formattedHeader = formattedHeader.replace(/%i/g, headerNumbers[4].toString());

  // Replace %c (alphabetic)
  if (isHierarchicalAlpha && level > 1) {
    // In hierarchical formats with %c.%n pattern, %c before dot refers to level 1
    formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[0]));
  } else {
    formattedHeader = formattedHeader.replace(/%c/g, getAlphaLabel(headerNumbers[level - 1]));
  }

  // Replace %r (roman)
  if (isHierarchicalRoman && level > 1) {
    // In hierarchical formats with %r.%n pattern, %r before dot refers to level 1
    formattedHeader = formattedHeader.replace(/%r/g, getRomanNumeral(headerNumbers[0], true));
  } else {
    formattedHeader = formattedHeader.replace(
      /%r/g,
      getRomanNumeral(headerNumbers[level - 1], true)
    );
  }

  // Replace %R (uppercase roman)
  const isHierarchicalUppercaseRoman = formattedHeader.includes('%R.%n');
  if (isHierarchicalUppercaseRoman && level > 1) {
    formattedHeader = formattedHeader.replace(/%R/g, getRomanNumeral(headerNumbers[0], false));
  } else {
    formattedHeader = formattedHeader.replace(
      /%R/g,
      getRomanNumeral(headerNumbers[level - 1], false)
    );
  }

  return formattedHeader;
}

/**
 * Extract cross-reference definitions from heading nodes
 */
function extractCrossReferencesFromAST(
  root: Root,
  metadata: Record<string, any>,
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
  };

  // Support both dash-based keys (legacy compatibility) and number-based keys
  const levelFormats = {
    level1: metadata['level1'] || metadata['level-one'] || DEFAULT_LEVEL_FORMATS.level1,
    level2: metadata['level2'] || metadata['level-two'] || DEFAULT_LEVEL_FORMATS.level2,
    level3: metadata['level3'] || metadata['level-three'] || DEFAULT_LEVEL_FORMATS.level3,
    level4: metadata['level4'] || metadata['level-four'] || DEFAULT_LEVEL_FORMATS.level4,
    level5: metadata['level5'] || metadata['level-five'] || DEFAULT_LEVEL_FORMATS.level5,
    level6: metadata['level6'] || metadata['level-six'] || DEFAULT_LEVEL_FORMATS.level6,
  };

  visit(root, 'heading', (node: Heading) => {
    const headingText = toString(node);

    // Check for cross-reference key pattern: **Text** |key|
    // or more complex patterns with legal prefixes like l. **Text** |key|
    const crossRefMatch = headingText.match(/^(?:l+\.\s+)?(.+?)\s+\|([^|]+)\|$/);

    if (crossRefMatch) {
      const [, headerContent, key] = crossRefMatch;
      const level = node.depth;

      // Update section counters
      updateSectionCounters(sectionCounters, level);

      // Generate section number
      const sectionNumber = generateSectionNumber(level, sectionCounters, levelFormats);
      const cleanHeaderText = headerContent.replace(/^\*\*|\*\*$/g, '').trim();
      const sectionText = `${sectionNumber} ${cleanHeaderText}`;

      crossReferences.push({
        key: key.trim(),
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
    }
  });

  return crossReferences;
}

/**
 * Clean header definitions by removing |key| patterns from headers
 * Only removes the definition pattern at the end of headers, preserving references
 */
function cleanHeaderDefinitionsInAST(
  root: Root,
  crossReferences: CrossReferenceDefinition[]
): void {
  // Create map of defined keys to their definitions for matching
  const definitionMap = new Map<string, CrossReferenceDefinition>();
  crossReferences.forEach(ref => definitionMap.set(ref.key, ref));

  // Visit all heading nodes
  visit(root, 'heading', (node: Heading) => {
    const headingText = toString(node);

    // Check if this header defines a cross-reference (ends with |key|)
    const definitionMatch = headingText.match(/^(.+?)\s+\|([^|]+)\|$/);

    if (definitionMatch) {
      const [, headerContent, key] = definitionMatch;
      const trimmedKey = key.trim();

      // Only remove the definition if it's one we extracted
      if (definitionMap.has(trimmedKey)) {
        // Visit all text nodes within the heading to remove only the trailing definition
        visit(node, 'text', (textNode: Text) => {
          const originalValue = textNode.value;

          // Remove only the trailing |key| pattern, preserving other references
          const modifiedValue = originalValue.replace(/\s+\|([^|]+)\|$/, (match, matchedKey) => {
            const trimmedMatchedKey = matchedKey.trim();
            if (trimmedMatchedKey === trimmedKey && definitionMap.has(trimmedMatchedKey)) {
              return ''; // Remove the definition pattern
            }
            return match; // Keep if not the specific definition
          });

          // Update the text node if changes were made
          if (modifiedValue !== originalValue) {
            textNode.value = modifiedValue.trim();
          }
        });
      }
    }
  });
}

/**
 * Replace cross-reference usage in text nodes with optional field tracking
 */
function replaceCrossReferencesInAST(
  root: Root,
  crossReferences: CrossReferenceDefinition[],
  metadata: Record<string, any>,
  enableFieldTracking: boolean = false
): void {
  // Create lookup map for fast reference resolution
  const referenceMap = new Map<string, string>();
  for (const ref of crossReferences) {
    referenceMap.set(ref.key, ref.sectionNumber);
  }

  // Visit all text nodes to replace |key| patterns
  visit(root, 'text', (node: Text, index, parent) => {
    // Skip if this is inside a heading that defines a cross-reference
    if (parent && parent.type === 'heading') {
      const headingText = toString(parent);
      if (headingText.match(/\|[^|]+\|$/)) {
        return; // Skip replacement in defining headers
      }
    }

    const originalValue = node.value;
    let modifiedValue = originalValue;
    let hasReplacements = false;

    // Replace all |key| patterns
    modifiedValue = modifiedValue.replace(/\|([^|]+)\|/g, (match, key) => {
      const trimmedKey = key.trim();

      // First try internal section reference
      const sectionNumber = referenceMap.get(trimmedKey);
      if (sectionNumber) {
        // Track the cross-reference as a field for statistics
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: sectionNumber,
          originalValue: match,
          hasLogic: true,
        });

        hasReplacements = true;
        return formatCrossRefValue(sectionNumber, trimmedKey, enableFieldTracking, true);
      }

      // Fallback to metadata value (for backward compatibility)
      const metadataValue = getNestedValue(metadata, trimmedKey);
      if (metadataValue !== undefined) {
        const resolvedValue = formatMetadataValue(metadataValue, trimmedKey, metadata);

        // Track metadata-based cross-reference as a field
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: resolvedValue,
          originalValue: match,
          hasLogic: false,
        });

        hasReplacements = true;
        return formatCrossRefValue(resolvedValue, trimmedKey, enableFieldTracking, false);
      }

      // Track unresolved reference as empty
      fieldTracker.trackField(`crossref.${trimmedKey}`, {
        value: '',
        originalValue: match,
        hasLogic: false,
      });

      // Return formatted empty value if field tracking is enabled, otherwise original
      return enableFieldTracking
        ? formatCrossRefValue('', trimmedKey, enableFieldTracking, false)
        : match;
    });

    // Update node value if replacements were made
    if (hasReplacements) {
      // If we have HTML in the replacement (field tracking spans), we need to convert to HTML node
      if (enableFieldTracking && modifiedValue.includes('<span')) {
        // Replace the text node with an HTML node to preserve HTML
        if (parent && typeof index === 'number') {
          const htmlNode = {
            type: 'html',
            value: modifiedValue,
          };
          parent.children[index] = htmlNode as any;
        }
      } else {
        node.value = modifiedValue;
      }
    }
  });

  // Process HTML nodes that contain cross-references (after template field processing)
  visit(root, 'html', (node: any) => {
    if (!node.value || !node.value.includes('|')) {
      return; // Skip HTML nodes without cross-references
    }

    let modifiedValue = node.value;
    let hasReplacements = false;

    // Replace all |key| patterns in HTML content
    modifiedValue = modifiedValue.replace(/\|([^|]+)\|/g, (match: string, key: string) => {
      const trimmedKey = key.trim();

      // First try internal section reference
      const sectionNumber = referenceMap.get(trimmedKey);
      if (sectionNumber) {
        // Track the cross-reference as a field for statistics
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: sectionNumber,
          originalValue: match,
          hasLogic: true,
        });

        hasReplacements = true;
        // For HTML nodes, generate HTML span if field tracking is enabled
        if (enableFieldTracking) {
          const cssClass = getCrossRefCssClass(true, true);
          return `<span class="${cssClass}" data-field="crossref.${trimmedKey.replace(/"/g, '&quot;')}">${sectionNumber}</span>`;
        } else {
          return sectionNumber;
        }
      }

      // Fallback to metadata value (for backward compatibility)
      const metadataValue = getNestedValue(metadata, trimmedKey);
      if (metadataValue !== undefined) {
        const resolvedValue = formatMetadataValue(metadataValue, trimmedKey, metadata);

        // Track metadata-based cross-reference as a field
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: resolvedValue,
          originalValue: match,
          hasLogic: false,
        });

        hasReplacements = true;
        // For HTML nodes, generate HTML span if field tracking is enabled
        if (enableFieldTracking) {
          const cssClass = getCrossRefCssClass(true, false);
          return `<span class="${cssClass}" data-field="crossref.${trimmedKey.replace(/"/g, '&quot;')}">${resolvedValue}</span>`;
        } else {
          return resolvedValue;
        }
      }

      // Track unresolved reference as empty
      fieldTracker.trackField(`crossref.${trimmedKey}`, {
        value: '',
        originalValue: match,
        hasLogic: false,
      });

      // For HTML nodes, generate HTML span for unresolved if field tracking is enabled
      if (enableFieldTracking) {
        const cssClass = getCrossRefCssClass(false, false);
        return `<span class="${cssClass}" data-field="crossref.${trimmedKey.replace(/"/g, '&quot;')}">${match}</span>`;
      } else {
        return match;
      }
    });

    // Update HTML node value if replacements were made
    if (hasReplacements) {
      node.value = modifiedValue;
    }
  });
}

/**
 * Get CSS class for cross-reference field based on its status
 */
function getCrossRefCssClass(hasValue: boolean, hasLogic: boolean): string {
  if (!hasValue) {
    return 'legal-field missing-value';
  }
  if (hasLogic) {
    return 'legal-field highlight';
  }
  return 'legal-field imported-value';
}

/**
 * Format cross-reference value with optional field tracking wrapper
 */
function formatCrossRefValue(
  value: string,
  fieldName: string,
  enableFieldTracking: boolean = false,
  hasLogic: boolean = false
): string {
  if (!enableFieldTracking) {
    return value;
  }

  const hasValue = value !== '';
  const cssClass = getCrossRefCssClass(hasValue, hasLogic);
  return `<span class="${cssClass}" data-field="crossref.${fieldName.replace(/"/g, '&quot;')}">${value}</span>`;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * Format metadata values based on type and context
 */
function formatMetadataValue(value: any, key: string, metadata: Record<string, any>): string {
  if (value === undefined) {
    return '';
  }

  if (value === null) {
    return 'null';
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // ISO date format
  }

  // Handle currency amounts
  if (typeof value === 'number' && key.includes('amount')) {
    const currency = metadata.payment_currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  }

  // Default string conversion
  return String(value);
}

/**
 * Remark plugin for processing cross-references in Legal Markdown documents
 */
const remarkCrossReferences: Plugin<[CrossReferenceOptions], Root> = options => {
  const { metadata, debug = false, enableFieldTracking = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('🔗 Processing cross-references with remark plugin');
    }

    // First pass: Extract cross-reference definitions from headers
    const crossReferences = extractCrossReferencesFromAST(tree, metadata, debug);

    if (debug) {
      console.log(
        `Found ${crossReferences.length} cross-reference definitions:`,
        crossReferences.map(ref => `${ref.key} -> ${ref.sectionNumber}`)
      );
    }

    // Store cross-references in metadata for external access
    metadata['_cross_references'] = crossReferences.map(ref => ({
      key: ref.key,
      sectionNumber: ref.sectionNumber,
      sectionText: ref.sectionText,
    }));

    // Ensure the field is always set, even if no cross-references exist
    if (crossReferences.length === 0) {
      metadata['_cross_references'] = [];
    }

    // Second pass: Clean headers by removing |key| definitions
    cleanHeaderDefinitionsInAST(tree, crossReferences);

    // Third pass: Replace cross-reference usage with section numbers
    if (debug) {
      console.log('🔄 Starting cross-reference replacement in content...');
    }
    replaceCrossReferencesInAST(tree, crossReferences, metadata, enableFieldTracking);

    if (debug) {
      console.log('✅ Cross-reference processing completed');
    }
  };
};

export default remarkCrossReferences;
export type { CrossReferenceOptions, CrossReferenceDefinition };
