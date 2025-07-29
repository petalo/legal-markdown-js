/**
 * @fileoverview Cross-Reference Processing Module for Legal Markdown Documents
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
  if (crossReferences.length > 0) {
    metadata['_cross_references'] = crossReferences.map(ref => ({
      key: ref.key,
      sectionNumber: ref.sectionNumber,
      sectionText: ref.sectionText,
    }));
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

  // Track section counters for each level
  const sectionCounters = { level1: 0, level2: 0, level3: 0 };

  // Get level formats from metadata
  const levelFormats = {
    level1: metadata['level-one'] || 'Article %n.',
    level2: metadata['level-two'] || 'Section %n.',
    level3: metadata['level-three'] || '(%n)',
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for header lines with cross-reference keys
    const headerMatch = trimmedLine.match(/^(l{1,3})\.\s+(.+?)\s+\|(\w+)\|$/);
    if (headerMatch) {
      const [, levelMarker, headerText, key] = headerMatch;
      const level = levelMarker.length;

      // Update section counters
      if (level === 1) {
        sectionCounters.level1++;
        sectionCounters.level2 = 0; // Reset level 2 counter
        sectionCounters.level3 = 0; // Reset level 3 counter
      } else if (level === 2) {
        sectionCounters.level2++;
        sectionCounters.level3 = 0; // Reset level 3 counter
      } else if (level === 3) {
        sectionCounters.level3++;
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
      } else {
        sectionNumber = levelFormats.level3.replace(/%n/g, sectionCounters.level3.toString());
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
    if (trimmedLine.match(/^(l{1,3})\.\s+(.+?)\s+\|(\w+)\|$/)) {
      return line;
    }

    // Process cross-reference usage in content lines
    return line.replace(/\|([^|]+)\|/g, (match, key) => {
      const trimmedKey = key.trim();

      // First try internal section reference
      const sectionNumber = referenceMap.get(trimmedKey);
      if (sectionNumber) {
        return sectionNumber;
      }

      // Fallback to metadata value
      const metadataValue = getNestedValue(metadata, trimmedKey);
      if (metadataValue !== undefined) {
        return formatMetadataValue(metadataValue, trimmedKey, metadata);
      }

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
