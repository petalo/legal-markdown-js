/**
 * @fileoverview Reserved Fields Filter for Frontmatter Merge
 *
 * This module provides functionality to filter out reserved fields from imported
 * frontmatter during the merge process. Reserved fields are system-level configuration
 * that should only be controlled by the main document, not by imported files.
 *
 * Features:
 * - Filter reserved fields from imported metadata
 * - Support for multiple naming conventions
 * - Security filtering for force commands
 * - Configurable field lists
 * - Detailed logging of filtered fields
 *
 * @example
 * ```typescript
 * import { filterReservedFields, isReservedField } from './reserved-fields-filter';
 *
 * const importedMetadata = {
 *   'level-one': 'HACKED',        // Reserved - will be filtered
 *   'force_commands': '--rm -rf /', // Reserved - will be filtered
 *   'client': 'Acme Corp',        // Normal field - will be kept
 *   'date': '@today'              // Normal field - will be kept
 * };
 *
 * const filtered = filterReservedFields(importedMetadata);
 * // { client: 'Acme Corp', date: '@today' }
 * ```
 */

/**
 * Complete list of reserved field names that should not be imported
 *
 * These fields control system behavior, document structure, and security settings.
 * They should only be defined in the main document's frontmatter.
 */
export const RESERVED_FIELDS = [
  // Document structure configuration
  'level-one',
  'level-two',
  'level-three',
  'level-four',
  'level-five',
  'level-six',
  'level-indent',
  'no-reset',
  'no-indent',

  // Metadata export configuration
  'meta-yaml-output',
  'meta-json-output',
  'meta-output-path',
  'meta-include-original',

  // Date and localization configuration
  'date-format',
  'dateFormat',
  'timezone',
  'tz',
  'locale',
  'lang',

  // Force commands - CRITICAL for security
  'force_commands',
  'force-commands',
  'forceCommands',
  'commands',

  // Import configuration (current and future)
  'import-tracing',
  'import-tracing-format',
  'disable-frontmatter-merge',

  // Pipeline configuration
  'pipeline-config',
  'pipeline-steps',
  'processing-options',

  // Field tracking configuration
  'enable-field-tracking',
  'field-tracking-mode',
] as const;

/**
 * Type for reserved field names
 */
export type ReservedField = (typeof RESERVED_FIELDS)[number];

/**
 * Options for filtering reserved fields
 */
export interface FilterOptions {
  /** Whether to log filtered fields for debugging */
  logFiltered?: boolean;
  /** Custom list of additional fields to filter */
  additionalReserved?: string[];
  /** Whether to use strict filtering (case-sensitive) */
  strictMode?: boolean;
}

/**
 * Filters reserved fields from imported metadata
 *
 * Removes all reserved fields from the provided metadata object, ensuring that
 * imported files cannot override system configuration or security settings.
 *
 * @param metadata - Metadata object to filter
 * @param options - Filtering options
 * @returns Filtered metadata object with reserved fields removed
 *
 * @example
 * ```typescript
 * const importedData = {
 *   'level-one': 'ARTICLE %n.',     // Reserved - filtered out
 *   'force_commands': '--pdf',      // Reserved - filtered out
 *   'client_name': 'Acme Corp',     // Normal - kept
 *   'contract_date': '@today'       // Normal - kept
 * };
 *
 * const filtered = filterReservedFields(importedData, { logFiltered: true });
 * // Console: "Reserved field 'level-one' ignored from import"
 * // Console: "Reserved field 'force_commands' ignored from import"
 * // Returns: { client_name: 'Acme Corp', contract_date: '@today' }
 * ```
 */
export function filterReservedFields(
  metadata: Record<string, any>,
  options: FilterOptions = {}
): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const { logFiltered = false, additionalReserved = [], strictMode = false } = options;

  const filtered: Record<string, any> = {};
  const allReservedFields = [...RESERVED_FIELDS, ...additionalReserved];

  for (const [key, value] of Object.entries(metadata)) {
    if (isReservedField(key, { additionalReserved, strictMode })) {
      if (logFiltered) {
        console.warn(`Reserved field '${key}' ignored from import`);
      }
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Checks if a field name is reserved
 *
 * Determines whether a given field name should be filtered out during
 * frontmatter merging. Supports case-insensitive matching by default.
 *
 * @param fieldName - Field name to check
 * @param options - Check options
 * @returns True if field is reserved, false otherwise
 *
 * @example
 * ```typescript
 * console.log(isReservedField('level-one'));     // true
 * console.log(isReservedField('LEVEL-ONE'));     // true (case-insensitive)
 * console.log(isReservedField('client_name'));   // false
 * console.log(isReservedField('force_commands')); // true
 *
 * // Strict mode (case-sensitive)
 * console.log(isReservedField('LEVEL-ONE', { strictMode: true })); // false
 * ```
 */
export function isReservedField(
  fieldName: string,
  options: Pick<FilterOptions, 'additionalReserved' | 'strictMode'> = {}
): boolean {
  if (!fieldName || typeof fieldName !== 'string') {
    return false;
  }

  const { additionalReserved = [], strictMode = false } = options;
  const allReservedFields = [...RESERVED_FIELDS, ...additionalReserved];

  if (strictMode) {
    return allReservedFields.includes(fieldName as ReservedField);
  } else {
    // Case-insensitive comparison
    const lowerFieldName = fieldName.toLowerCase();
    return allReservedFields.some(reserved => reserved.toLowerCase() === lowerFieldName);
  }
}

/**
 * Gets list of reserved fields by category
 *
 * Returns reserved fields grouped by their purpose, useful for documentation
 * and debugging purposes.
 *
 * @returns Object with reserved fields grouped by category
 *
 * @example
 * ```typescript
 * const categories = getReservedFieldsByCategory();
 * console.log(categories.structure);  // ['level-one', 'level-two', ...]
 * console.log(categories.security);   // ['force_commands', 'force-commands', ...]
 * ```
 */
export function getReservedFieldsByCategory(): Record<string, string[]> {
  return {
    structure: [
      'level-one',
      'level-two',
      'level-three',
      'level-four',
      'level-five',
      'level-six',
      'level-indent',
      'no-reset',
      'no-indent',
    ],
    metadata: ['meta-yaml-output', 'meta-json-output', 'meta-output-path', 'meta-include-original'],
    localization: ['date-format', 'dateFormat', 'timezone', 'tz', 'locale', 'lang'],
    security: ['force_commands', 'force-commands', 'forceCommands', 'commands'],
    imports: ['import-tracing', 'import-tracing-format', 'disable-frontmatter-merge'],
    system: [
      'pipeline-config',
      'pipeline-steps',
      'processing-options',
      'enable-field-tracking',
      'field-tracking-mode',
    ],
  };
}

/**
 * Validates that a metadata object doesn't contain reserved fields
 *
 * Useful for validation before processing or for testing purposes.
 * Returns validation result with details about any found reserved fields.
 *
 * @param metadata - Metadata object to validate
 * @param options - Validation options
 * @returns Validation result with found reserved fields
 *
 * @example
 * ```typescript
 * const metadata = {
 *   'client': 'Acme Corp',
 *   'level-one': 'ARTICLE %n.',
 *   'force_commands': '--pdf'
 * };
 *
 * const validation = validateNoReservedFields(metadata);
 * // {
 * //   isValid: false,
 * //   reservedFields: ['level-one', 'force_commands'],
 * //   message: 'Found 2 reserved fields: level-one, force_commands'
 * // }
 * ```
 */
export function validateNoReservedFields(
  metadata: Record<string, any>,
  options: FilterOptions = {}
): {
  isValid: boolean;
  reservedFields: string[];
  message: string;
} {
  if (!metadata || typeof metadata !== 'object') {
    return {
      isValid: true,
      reservedFields: [],
      message: 'No metadata to validate',
    };
  }

  const reservedFields: string[] = [];

  for (const key of Object.keys(metadata)) {
    if (isReservedField(key, options)) {
      reservedFields.push(key);
    }
  }

  const isValid = reservedFields.length === 0;
  const message = isValid
    ? 'No reserved fields found'
    : `Found ${reservedFields.length} reserved fields: ${reservedFields.join(', ')}`;

  return {
    isValid,
    reservedFields,
    message,
  };
}

/**
 * Creates a filter function with specific options
 *
 * Returns a configured filter function that can be reused with the same options.
 * Useful for consistent filtering across multiple imports.
 *
 * @param options - Filter configuration
 * @returns Configured filter function
 *
 * @example
 * ```typescript
 * const filter = createFieldFilter({
 *   logFiltered: true,
 *   additionalReserved: ['custom-field']
 * });
 *
 * const filtered1 = filter(import1Metadata);
 * const filtered2 = filter(import2Metadata);
 * // Both use the same filtering configuration
 * ```
 */
export function createFieldFilter(options: FilterOptions = {}) {
  return (metadata: Record<string, any>) => filterReservedFields(metadata, options);
}
