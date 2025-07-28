/**
 * @fileoverview Frontmatter Merger for Import Processing
 *
 * This module provides the core functionality for merging YAML frontmatter from
 * imported files using the "source always wins" strategy with flattened merging.
 * It enables granular merging at the property level while maintaining predictable
 * conflict resolution.
 *
 * Features:
 * - Flattened merging for granular property-level control
 * - "Source always wins" conflict resolution strategy
 * - Type conflict detection and validation
 * - Reserved field filtering integration
 * - Comprehensive merge statistics and reporting
 *
 * @example
 * ```typescript
 * import { mergeFlattened, validateMergeCompatibility } from './frontmatter-merger';
 *
 * const current = {
 *   title: "Main Document",
 *   config: { server: "prod", port: 8080 }
 * };
 *
 * const imported = {
 *   config: { level: "high", server: "dev" }, // server conflict - current wins
 *   client: "Acme Corp"                       // new field - added
 * };
 *
 * const result = mergeFlattened(current, imported);
 * // {
 * //   title: "Main Document",
 * //   config: { server: "prod", port: 8080, level: "high" },
 * //   client: "Acme Corp"
 * // }
 * ```
 */

import { flattenObject, unflattenObject } from './object-flattener';
import { filterReservedFields, isReservedField } from './reserved-fields-filter';

/**
 * Options for frontmatter merging
 */
export interface MergeOptions {
  /** Whether to filter reserved fields from imported metadata */
  filterReserved?: boolean;
  /** Whether to validate type compatibility before merging */
  validateTypes?: boolean;
  /** Whether to log merge operations for debugging */
  logOperations?: boolean;
  /** Custom conflict resolution strategy (future extension) */
  conflictStrategy?: 'source-wins' | 'import-wins' | 'error';
  /** Whether to include merge statistics in result */
  includeStats?: boolean;
  /** Maximum execution time in milliseconds (default: 10000ms) */
  timeoutMs?: number;
}

/**
 * Result of a merge operation
 */
export interface MergeResult {
  /** Merged metadata object */
  metadata: Record<string, any>;
  /** Statistics about the merge operation */
  stats?: MergeStats;
}

/**
 * Statistics about a merge operation
 */
export interface MergeStats {
  /** Total properties in current metadata */
  currentProperties: number;
  /** Total properties in imported metadata */
  importedProperties: number;
  /** Properties added from imported metadata */
  propertiesAdded: number;
  /** Properties that had conflicts (current wins) */
  conflictsResolved: number;
  /** Reserved fields filtered out */
  reservedFieldsFiltered: number;
  /** List of fields that were added */
  addedFields: string[];
  /** List of fields that had conflicts */
  conflictedFields: string[];
  /** List of reserved fields that were filtered */
  filteredFields: string[];
}

/**
 * Error thrown when merge validation fails
 */
export class MergeValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public currentType: string,
    public importedType: string
  ) {
    super(message);
    this.name = 'MergeValidationError';
  }
}

/**
 * Merges imported frontmatter into current frontmatter using flattened strategy
 *
 * Uses the "source always wins" strategy where the current metadata takes precedence
 * over imported metadata in case of conflicts. Supports granular merging at the
 * property level using dot notation flattening.
 *
 * @param current - Current metadata (takes precedence)
 * @param imported - Imported metadata to merge
 * @param options - Merge configuration options
 * @returns Merged metadata or MergeResult with statistics
 *
 * @example
 * ```typescript
 * const current = {
 *   document: { title: "Contract", version: "1.0" },
 *   client: "Main Client"
 * };
 *
 * const imported = {
 *   document: { title: "Import Doc", author: "John Doe" }, // title conflicts - current wins
 *   metadata: { created: "@today" }                        // new field - added
 * };
 *
 * const result = mergeFlattened(current, imported, { includeStats: true });
 * // result.metadata = {
 * //   document: { title: "Contract", version: "1.0", author: "John Doe" },
 * //   client: "Main Client",
 * //   metadata: { created: "@today" }
 * // }
 * // result.stats.propertiesAdded = 2
 * // result.stats.conflictsResolved = 1
 * ```
 */
export function mergeFlattened(
  current: Record<string, any>,
  imported: Record<string, any>,
  options?: MergeOptions
): Record<string, any>;
export function mergeFlattened(
  current: Record<string, any>,
  imported: Record<string, any>,
  options: MergeOptions & { includeStats: true }
): MergeResult;
export function mergeFlattened(
  current: Record<string, any>,
  imported: Record<string, any>,
  options: MergeOptions = {}
): Record<string, any> | MergeResult {
  const {
    filterReserved = true,
    validateTypes = true,
    logOperations = false,
    conflictStrategy = 'source-wins',
    includeStats = false,
    timeoutMs = 10000,
  } = options;

  const startTime = Date.now();

  // Initialize statistics tracking
  const stats: MergeStats = {
    currentProperties: 0,
    importedProperties: 0,
    propertiesAdded: 0,
    conflictsResolved: 0,
    reservedFieldsFiltered: 0,
    addedFields: [],
    conflictedFields: [],
    filteredFields: [],
  };

  // Handle null/undefined inputs
  if (!current || typeof current !== 'object') {
    current = {};
  }
  if (!imported || typeof imported !== 'object') {
    imported = {};
  }

  // Filter reserved fields from imported metadata
  let filteredImported = imported;
  if (filterReserved) {
    const originalKeys = Object.keys(imported);
    filteredImported = filterReservedFields(imported, { logFiltered: logOperations });
    const filteredKeys = Object.keys(filteredImported);

    stats.reservedFieldsFiltered = originalKeys.length - filteredKeys.length;
    stats.filteredFields = originalKeys.filter(key => !filteredKeys.includes(key));
  }

  // Flatten both objects for granular comparison with timeout protection
  const currentFlat = flattenObject(current, '', new WeakSet(), startTime, timeoutMs);
  const importedFlat = flattenObject(filteredImported, '', new WeakSet(), Date.now(), timeoutMs);

  stats.currentProperties = Object.keys(currentFlat).length;
  stats.importedProperties = Object.keys(importedFlat).length;

  if (logOperations) {
    console.log(
      `Merging frontmatter: ${stats.currentProperties} current + ${stats.importedProperties} imported properties`
    );
  }

  // Merge using "source always wins" strategy
  const mergedFlat: Record<string, any> = { ...currentFlat };

  for (const [key, importedValue] of Object.entries(importedFlat)) {
    // Timeout safety check during merge loop
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Frontmatter merge timed out after ${timeoutMs}ms. ` +
          'This may indicate complex nested structures or circular references.'
      );
    }
    if (Object.prototype.hasOwnProperty.call(currentFlat, key)) {
      // Direct conflict: current wins
      const currentValue = currentFlat[key];

      // Validate type compatibility if requested
      if (validateTypes) {
        try {
          validateMergeCompatibility(currentValue, importedValue, key);
        } catch (error) {
          if (logOperations) {
            console.warn(
              `Type conflict for '${key}': ${error instanceof Error ? error.message : String(error)}`
            );
          }
          // Skip this field due to type conflict - current value remains unchanged
          stats.conflictsResolved++;
          stats.conflictedFields.push(key);
          continue;
        }
      }

      stats.conflictsResolved++;
      stats.conflictedFields.push(key);

      if (logOperations) {
        console.log(`Conflict for '${key}': current value kept`);
      }
    } else {
      // Check for nested conflicts in both directions
      const nestedConflictResult = validateTypes
        ? checkNestedConflicts(key, importedValue, currentFlat, logOperations)
        : { hasConflict: false, conflictedField: '' };

      if (nestedConflictResult.hasConflict) {
        stats.conflictsResolved++;
        stats.conflictedFields.push(nestedConflictResult.conflictedField);
      }

      if (!nestedConflictResult.hasConflict) {
        // No conflict: add imported value
        mergedFlat[key] = importedValue;
        stats.propertiesAdded++;
        stats.addedFields.push(key);

        if (logOperations) {
          console.log(`Added '${key}' from import`);
        }
      }
    }
  }

  // Unflatten back to hierarchical structure
  const mergedMetadata = unflattenObject(mergedFlat);

  if (includeStats) {
    return {
      metadata: mergedMetadata,
      stats,
    };
  }

  return mergedMetadata;
}

/**
 * Validates that two values are compatible for merging
 *
 * Checks if the current and imported values have compatible types.
 * Throws MergeValidationError if types are incompatible.
 *
 * @param current - Current value
 * @param imported - Imported value to merge
 * @param key - Property key for error reporting
 * @throws MergeValidationError when types are incompatible
 *
 * @example
 * ```typescript
 * // Compatible types - no error
 * validateMergeCompatibility("string", "another string", "title");
 * validateMergeCompatibility(42, 100, "count");
 *
 * // Incompatible types - throws error
 * try {
 *   validateMergeCompatibility("string", { object: true }, "config");
 * } catch (error) {
 *   console.log(error.message); // "Type conflict for 'config': current=string, imported=object"
 * }
 * ```
 */
export function validateMergeCompatibility(current: any, imported: any, key: string): void {
  const currentType = getValueType(current);
  const importedType = getValueType(imported);

  // Allow null/undefined to be compatible with anything
  if (current === null || current === undefined || imported === null || imported === undefined) {
    return;
  }

  // Check for incompatible type combinations
  if (currentType !== importedType) {
    // Special cases that are allowed
    const compatibleCombinations = [
      ['string', 'number'], // Can convert numbers to strings
      ['number', 'string'], // Can parse strings as numbers
      ['boolean', 'string'], // Can convert boolean to string
      ['string', 'boolean'], // Can parse strings as boolean
    ];

    const isCompatible = compatibleCombinations.some(
      ([type1, type2]) =>
        (currentType === type1 && importedType === type2) ||
        (currentType === type2 && importedType === type1)
    );

    if (!isCompatible) {
      throw new MergeValidationError(
        `Type conflict for '${key}': current=${currentType}, imported=${importedType}`,
        key,
        currentType,
        importedType
      );
    }
  }
}

/**
 * Gets a normalized type string for a value
 *
 * Returns a consistent type identifier for merge compatibility checking.
 *
 * @param value - Value to get type for
 * @returns Normalized type string
 */
function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Performs a dry run merge to preview results
 *
 * Simulates a merge operation without actually performing it.
 * Useful for validation and preview purposes.
 *
 * @param current - Current metadata
 * @param imported - Imported metadata
 * @param options - Merge options
 * @returns Preview of merge results
 *
 * @example
 * ```typescript
 * const preview = previewMerge(current, imported, { filterReserved: true });
 * console.log(`Would add ${preview.stats.propertiesAdded} properties`);
 * console.log(`Would resolve ${preview.stats.conflictsResolved} conflicts`);
 * console.log(`Would filter ${preview.stats.reservedFieldsFiltered} reserved fields`);
 * ```
 */
export function previewMerge(
  current: Record<string, any>,
  imported: Record<string, any>,
  options: MergeOptions = {}
): MergeResult {
  return mergeFlattened(current, imported, { ...options, includeStats: true }) as MergeResult;
}

/**
 * Merges multiple imported metadata objects sequentially
 *
 * Applies the merge operation sequentially across multiple imports,
 * where each result becomes the new "current" for the next merge.
 *
 * @param initial - Initial metadata (usually from main document)
 * @param imports - Array of imported metadata objects to merge
 * @param options - Merge options applied to all operations
 * @returns Final merged metadata with cumulative statistics
 *
 * @example
 * ```typescript
 * const initial = { title: "Main Doc" };
 * const imports = [
 *   { config: { level: "high" } },
 *   { config: { debug: true }, client: "Acme" },
 *   { metadata: { version: "1.0" } }
 * ];
 *
 * const result = mergeSequentially(initial, imports, { includeStats: true });
 * // result.metadata contains all merged properties
 * // result.stats contains cumulative statistics
 * ```
 */
export function mergeSequentially(
  initial: Record<string, any>,
  imports: Record<string, any>[],
  options: MergeOptions = {}
): MergeResult {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 15000; // Longer timeout for sequential operations
  let currentMetadata = initial;
  const cumulativeStats: MergeStats = {
    currentProperties: 0,
    importedProperties: 0,
    propertiesAdded: 0,
    conflictsResolved: 0,
    reservedFieldsFiltered: 0,
    addedFields: [],
    conflictedFields: [],
    filteredFields: [],
  };

  for (let i = 0; i < imports.length; i++) {
    // Timeout safety check during sequential merge
    if (Date.now() - startTime > timeoutMs) {
      const message =
        `Sequential merge timed out after ${timeoutMs}ms ` +
        `while processing import ${i + 1}/${imports.length}.`;
      throw new Error(message);
    }

    const importedData = imports[i];
    const remainingTime = Math.max(1000, timeoutMs - (Date.now() - startTime));
    const result = mergeFlattened(currentMetadata, importedData, {
      ...options,
      includeStats: true,
      timeoutMs: remainingTime,
    });

    currentMetadata = result.metadata;

    // Accumulate statistics
    if (result.stats) {
      cumulativeStats.importedProperties += result.stats.importedProperties;
      cumulativeStats.propertiesAdded += result.stats.propertiesAdded;
      cumulativeStats.conflictsResolved += result.stats.conflictsResolved;
      cumulativeStats.reservedFieldsFiltered += result.stats.reservedFieldsFiltered;
      cumulativeStats.addedFields.push(...result.stats.addedFields);
      cumulativeStats.conflictedFields.push(...result.stats.conflictedFields);
      cumulativeStats.filteredFields.push(...result.stats.filteredFields);
    }

    if (options.logOperations) {
      console.log(
        `Merged import ${i + 1}/${imports.length}: +${result.stats?.propertiesAdded} properties`
      );
    }
  }

  // Set final current properties count
  cumulativeStats.currentProperties = Object.keys(flattenObject(currentMetadata)).length;

  return {
    metadata: currentMetadata,
    stats: cumulativeStats,
  };
}

/**
 * Helper function to check for nested conflicts between current and imported fields
 *
 * @param key - The imported field key to check
 * @param importedValue - The value being imported
 * @param currentFlat - The flattened current metadata
 * @param logOperations - Whether to log conflict details
 * @returns Object indicating if there's a conflict and which field caused it
 */
function checkNestedConflicts(
  key: string,
  importedValue: any,
  currentFlat: Record<string, any>,
  logOperations: boolean
): { hasConflict: boolean; conflictedField: string } {
  // Case 1: current has 'config.debug' but import has 'config'
  // Import would overwrite nested structure with primitive
  for (const currentKey of Object.keys(currentFlat)) {
    if (currentKey.startsWith(key + '.')) {
      try {
        validateMergeCompatibility({}, importedValue, key);
      } catch (error) {
        if (logOperations) {
          console.warn(
            `Type conflict for '${key}': ${error instanceof Error ? error.message : String(error)}`
          );
        }
        return { hasConflict: true, conflictedField: key };
      }
    }
  }

  // Case 2: current has 'enabled' but import has 'enabled.not'
  // Import would overwrite primitive with nested structure
  const baseKey = key.split('.')[0];
  const hasBaseKey = Object.prototype.hasOwnProperty.call(currentFlat, baseKey);
  if (hasBaseKey && baseKey !== key) {
    const currentValue = currentFlat[baseKey];
    try {
      validateMergeCompatibility(currentValue, {}, baseKey);
    } catch (error) {
      if (logOperations) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Type conflict for '${baseKey}': ${message}`);
      }
      return { hasConflict: true, conflictedField: baseKey };
    }
  }

  return { hasConflict: false, conflictedField: '' };
}
