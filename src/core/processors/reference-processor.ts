/**
 * Cross-Reference Processing Module for Legal Markdown Documents
 *
 * This module provides functionality to process internal cross-references in Legal Markdown
 * documents, allowing sections to reference other sections by their keys.
 * Based on the original Ruby Legal Markdown specification.
 *
 * Features:
 * - Internal cross-reference syntax: |reference_key|
 * - Automatic section numbering and reference resolution
 * - Reference capture from headers with |key| syntax
 * - Section reference replacement throughout the document
 * - Compatible with legal document numbering (l., ll., lll.)
 *
 * @example
 * ```typescript
 * import { processCrossReferences } from './reference-processor';
 *
 * const content = `
 * l. **Definitions** |definitions|
 *
 * Terms defined in |definitions| apply throughout this agreement.
 *
 * l. **Payment Terms** |payment|
 *
 * As outlined in |payment|, payment is due within 30 days.
 * Reference to |definitions| for term meanings.
 * `;
 *
 * const processed = processCrossReferences(content, {});
 * console.log(processed);
 * // Output:
 * // Article 1. **Definitions**
 * //
 * // Terms defined in Article 1 apply throughout this agreement.
 * //
 * // Article 2. **Payment Terms**
 * //
 * // As outlined in Article 2, payment is due within 30 days.
 * // Reference to Article 1 for term meanings.
 * ```
 */

import { getRomanNumeral, getAlphaLabel } from '../../utils/number-utilities';
import { fieldTracker } from '../../extensions/tracking/field-tracker';

/**
 * Internal structure to track cross-references and their section numbers
 */
interface CrossReference {
  key: string;
  sectionNumber: string;
  sectionText: string;
}

/**
 * Processes internal cross-references in a Legal Markdown document
 *
 * This function implements a hybrid approach:
 * 1. First tries to resolve |key| as internal section references (Ruby spec)
 * 2. Falls back to metadata values for backward compatibility
 *
 * @param {string} content - The document content containing cross-references
 * @param {Record<string, any>} metadata - Document metadata (used for level formatting and fallback)
 * @returns {string} Processed content with internal references resolved
 * @example
 * ```typescript
 * const content = `
 * l. **Contract Terms** |terms|
 *
 * As specified in |terms|, this agreement is binding.
 * Reference to |client_name| from metadata.
 * `;
 *
 * const metadata = { client_name: "ACME Corp" };
 * const result = processCrossReferences(content, metadata);
 * // |terms| -> "Article 1." (internal reference)
 * // |client_name| -> "ACME Corp" (metadata fallback)
 * ```
 */
export function processCrossReferences(content: string, metadata: Record<string, any>): string {
  // First, extract all cross-reference definitions from headers
  const crossReferences = extractCrossReferences(content, metadata);

  // Store cross-references metadata in protected field
  metadata['_cross_references'] = crossReferences.map(ref => ({
    key: ref.key,
    sectionNumber: ref.sectionNumber,
    sectionText: ref.sectionText,
  }));

  // Ensure the field is always set, even if no cross-references exist
  if (crossReferences.length === 0) {
    metadata['_cross_references'] = [];
  }

  // Then replace all cross-reference usage with section numbers or metadata
  return replaceCrossReferences(content, crossReferences, metadata);
}

/**
 * Extracts cross-reference definitions from headers in the document
 *
 * Scans the document for headers containing |key| syntax and captures
 * their section numbers after header processing. This creates a mapping
 * of reference keys to their section identifiers.
 *
 * @private
 * @param {string} content - Document content to scan for cross-references
 * @param {Record<string, any>} metadata - Metadata for level formatting
 * @returns {CrossReference[]} Array of cross-reference mappings
 */
function extractCrossReferences(content: string, metadata: Record<string, any>): CrossReference[] {
  const crossReferences: CrossReference[] = [];
  const lines = content.split('\n');

  // Track section counters for each level (up to 6 levels)
  const sectionCounters = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0 };

  // Get level formats from metadata
  const levelFormats = {
    level1: metadata['level-one'] || 'Article %n.',
    level2: metadata['level-two'] || 'Section %n.',
    level3: metadata['level-three'] || '(%n)',
    level4: metadata['level-four'] || '(%n)',
    level5: metadata['level-five'] || '(%n%c)',
    level6: metadata['level-six'] || 'Annex %r -',
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for header lines with cross-reference keys
    // Support both traditional (l., ll., lll.) and alternative (l1., l2., l3.) formats
    const traditionalMatch = trimmedLine.match(/^(l+)\. (.+) \|([\w.-]+)\|$/);
    const alternativeMatch = trimmedLine.match(/^l(\d+)\. (.+) \|([\w.-]+)\|$/);

    const headerMatch = traditionalMatch || alternativeMatch;
    if (headerMatch) {
      let level: number;
      let headerText: string;
      let key: string;

      if (traditionalMatch) {
        const [, levelMarker, text, keyName] = traditionalMatch;
        level = levelMarker.length;
        headerText = text;
        key = keyName;
      } else {
        const [, levelNumber, text, keyName] = alternativeMatch!;
        level = parseInt(levelNumber, 10);
        headerText = text;
        key = keyName;
      }

      // Update section counters
      if (level === 1) {
        sectionCounters.level1++;
        sectionCounters.level2 = 0;
        sectionCounters.level3 = 0;
        sectionCounters.level4 = 0;
        sectionCounters.level5 = 0;
        sectionCounters.level6 = 0;
      } else if (level === 2) {
        sectionCounters.level2++;
        sectionCounters.level3 = 0;
        sectionCounters.level4 = 0;
        sectionCounters.level5 = 0;
        sectionCounters.level6 = 0;
      } else if (level === 3) {
        sectionCounters.level3++;
        sectionCounters.level4 = 0;
        sectionCounters.level5 = 0;
        sectionCounters.level6 = 0;
      } else if (level === 4) {
        sectionCounters.level4++;
        sectionCounters.level5 = 0;
        sectionCounters.level6 = 0;
      } else if (level === 5) {
        sectionCounters.level5++;
        sectionCounters.level6 = 0;
      } else if (level === 6) {
        sectionCounters.level6++;
      }

      // Generate section number based on level
      let sectionNumber: string;
      let sectionText: string;

      if (level === 1) {
        sectionNumber = levelFormats.level1.replace(/%n/g, sectionCounters.level1.toString());
        sectionText = `${sectionNumber} ${headerText}`;
      } else if (level === 2) {
        sectionNumber = levelFormats.level2.replace(/%n/g, sectionCounters.level2.toString());
        sectionText = `${sectionNumber} ${headerText}`;
      } else if (level === 3) {
        sectionNumber = levelFormats.level3.replace(/%n/g, sectionCounters.level3.toString());
        sectionText = `${sectionNumber} ${headerText}`;
      } else if (level === 4) {
        sectionNumber = levelFormats.level4
          .replace(/%n/g, sectionCounters.level4.toString())
          .replace(/%c/g, getAlphaLabel(sectionCounters.level4))
          .replace(/%r/g, getRomanNumeral(sectionCounters.level4, true))
          .replace(/%R/g, getRomanNumeral(sectionCounters.level4, false));
        sectionText = `${sectionNumber} ${headerText}`;
      } else if (level === 5) {
        sectionNumber = levelFormats.level5
          .replace(/%n/g, sectionCounters.level5.toString())
          .replace(/%c/g, getAlphaLabel(sectionCounters.level5))
          .replace(/%r/g, getRomanNumeral(sectionCounters.level5, true))
          .replace(/%R/g, getRomanNumeral(sectionCounters.level5, false));
        sectionText = `${sectionNumber} ${headerText}`;
      } else if (level === 6) {
        sectionNumber = levelFormats.level6
          .replace(/%n/g, sectionCounters.level6.toString())
          .replace(/%r/g, getRomanNumeral(sectionCounters.level6, true))
          .replace(/%R/g, getRomanNumeral(sectionCounters.level6, false));
        sectionText = `${sectionNumber} ${headerText}`;
      } else {
        // Fallback for unknown levels
        sectionNumber = `Level ${level}.`;
        sectionText = `${sectionNumber} ${headerText}`;
      }

      crossReferences.push({
        key,
        sectionNumber: sectionNumber.trim(),
        sectionText: sectionText.trim(),
      });
    }
  }

  return crossReferences;
}

/**
 * Replaces cross-reference usage throughout the document
 *
 * Scans the document for |key| references and replaces them with:
 * 1. Section numbers from internal cross-references (priority)
 * 2. Metadata values as fallback for backward compatibility
 * 3. Original reference if neither is found
 *
 * @private
 * @param {string} content - Document content to process
 * @param {CrossReference[]} crossReferences - Map of keys to section numbers
 * @param {Record<string, any>} metadata - Metadata for fallback resolution
 * @returns {string} Document with cross-references replaced
 */
function replaceCrossReferences(
  content: string,
  crossReferences: CrossReference[],
  metadata: Record<string, any>
): string {
  // Create a map for quick lookups
  const referenceMap = new Map<string, string>();
  for (const ref of crossReferences) {
    referenceMap.set(ref.key, ref.sectionNumber);
  }

  // Replace all |key| references (except those in headers which define them)
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();

    // Skip lines that define cross-references (headers with |key| syntax)
    // Support both traditional (l., ll., lll.) and alternative (l1., l2., l3.) formats
    if (
      trimmedLine.match(/^(l+)\. (.+) \|([\w.-]+)\|$/) ||
      trimmedLine.match(/^l(\d+)\. (.+) \|([\w.-]+)\|$/)
    ) {
      return line;
    }

    // Process cross-reference usage in content lines
    return line.replace(/\|([^|]+)\|/g, (match, key) => {
      const trimmedKey = key.trim();

      // First try internal section reference
      const sectionNumber = referenceMap.get(trimmedKey);
      if (sectionNumber) {
        // Track the cross-reference as a field for highlighting
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: sectionNumber,
          originalValue: match,
          hasLogic: true,
        });
        return sectionNumber;
      }

      // Fallback to metadata value
      const metadataValue = getNestedValue(metadata, trimmedKey);
      if (metadataValue !== undefined) {
        const resolvedValue = formatMetadataValue(metadataValue, trimmedKey, metadata);
        // Track metadata-based cross-reference as a field
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: resolvedValue,
          originalValue: match,
          hasLogic: false,
        });
        return resolvedValue;
      }

      // Track unresolved reference as empty
      fieldTracker.trackField(`crossref.${trimmedKey}`, {
        value: '',
        originalValue: match,
        hasLogic: false,
      });

      // Return original if no reference found
      return match;
    });
  });

  return processedLines.join('\n');
}

/**
 * Gets a potentially nested value from an object using dot notation
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
 * Formats metadata values based on type and context
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
