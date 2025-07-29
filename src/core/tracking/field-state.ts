/**
 * Core Field State Management for Legal Markdown Processing
 *
 * This module provides the fundamental field tracking interfaces and basic implementation
 * that form the foundation for field tracking throughout the Legal Markdown processing
 * pipeline. It defines the core contracts for tracking field usage, status, and metadata.
 *
 * Features:
 * - Basic field state interface compatible with existing field-tracker
 * - Core field tracking functionality
 * - Portable implementation suitable for any Legal Markdown implementation
 * - Foundation for extended field tracking in extensions
 * - Backward compatibility with existing field tracking systems
 *
 * @example
 * ```typescript
 * import { CoreFieldState, FieldTrackingOptions } from './field-state';
 *
 * const fieldState = new CoreFieldState();
 * fieldState.trackField('client.name', {
 *   value: 'Acme Corporation',
 *   hasLogic: false
 * });
 *
 * const fields = fieldState.getFields();
 * console.log(`Tracked ${fields.size} fields`);
 * ```
 */

/**
 * Enumeration of possible field statuses during processing
 *
 * @example
 * ```typescript
 * import { FieldStatus } from './field-state';
 *
 * // Check field status
 * if (field.status === FieldStatus.FILLED) {
 *   console.log('Field has a value');
 * } else if (field.status === FieldStatus.EMPTY) {
 *   console.log('Field needs a value');
 * } else if (field.status === FieldStatus.LOGIC) {
 *   console.log('Field uses conditional logic');
 * }
 * ```
 */
export enum FieldStatus {
  /** Field has been filled with a value */
  FILLED = 'filled',
  /** Field is empty or missing a value */
  EMPTY = 'empty',
  /** Field contains logic or uses mixins */
  LOGIC = 'logic',
}

/**
 * Options for tracking a field in the system
 * @example
 * ```typescript
 * const options: FieldTrackingOptions = {
 *   value: 'Acme Corporation',
 *   originalValue: '{{client.name}}',
 *   hasLogic: false,
 *   mixinUsed: 'simple-substitution'
 * };
 * ```
 */
export interface FieldTrackingOptions {
  /** The processed value of the field */
  value?: any;
  /** The original unprocessed value of the field */
  originalValue?: any;
  /** Whether the field contains logical operations */
  hasLogic?: boolean;
  /** Name of mixin used for processing this field */
  mixinUsed?: string;
}

/**
 * Interface representing a tracked field in the Legal Markdown system
 * @example
 * ```typescript
 * const field: TrackedField = {
 *   name: 'client.name',
 *   status: FieldStatus.FILLED,
 *   value: 'Acme Corporation',
 *   originalValue: '{{client.name}}',
 *   hasLogic: false,
 *   mixinUsed: 'simple-substitution'
 * };
 * ```
 */
export interface TrackedField {
  /** The name/identifier of the field */
  name: string;
  /** The current status of the field */
  status: FieldStatus;
  /** The processed value of the field */
  value?: any;
  /** The original unprocessed value of the field */
  originalValue?: any;
  /** Whether the field contains logical operations */
  hasLogic: boolean;
  /** Name of mixin used for processing this field */
  mixinUsed?: string;
}

/**
 * Core interface for field state management in Legal Markdown processing
 *
 * This interface defines the fundamental operations for tracking field usage,
 * status, and metadata throughout the document processing pipeline.
 *
 * @interface FieldState
 * @example
 * ```typescript
 * class MyFieldTracker implements FieldState {
 *   private fields = new Map<string, TrackedField>();
 *
 *   trackField(name: string, options: FieldTrackingOptions): void {
 *     // Implementation for tracking fields
 *   }
 *
 *   getFields(): Map<string, TrackedField> {
 *     return new Map(this.fields);
 *   }
 *
 *   clear(): void {
 *     this.fields.clear();
 *   }
 * }
 * ```
 */
export interface FieldState {
  /** Map of all tracked fields by field name */
  readonly fields: Map<string, TrackedField>;

  /**
   * Track a field that has been processed
   *
   * Registers a field with the tracking system, determining its status based on
   * the provided options and storing relevant metadata for later use.
   *
   * @param name - The name/identifier of the field to track
   * @param options - Options for field tracking
   * @returns void
   * @example
   * ```typescript
   * // Track a filled field
   * fieldState.trackField('client.name', {
   *   value: 'Acme Corporation',
   *   originalValue: '{{client.name}}'
   * });
   *
   * // Track an empty field
   * fieldState.trackField('client.address', {
   *   value: '',
   *   originalValue: '{{client.address}}'
   * });
   *
   * // Track a field with logic
   * fieldState.trackField('warranty.clause', {
   *   value: 'Standard warranty applies',
   *   originalValue: '{{#if warranty.enabled}}{{warranty.text}}{{/if}}',
   *   hasLogic: true,
   *   mixinUsed: 'warranty-mixin'
   * });
   * ```
   */
  trackField(name: string, options: FieldTrackingOptions): void;

  /**
   * Get all tracked fields
   *
   * @returns A copy of the tracked fields map
   * @example
   * ```typescript
   * const fields = fieldState.getFields();
   * for (const [name, field] of fields) {
   *   console.log(`Field ${name}: ${field.status}`);
   * }
   * ```
   */
  getFields(): Map<string, TrackedField>;

  /**
   * Get fields filtered by status
   *
   * @param status - The status to filter by
   * @returns Array of fields with the specified status
   * @example
   * ```typescript
   * const emptyFields = fieldState.getFieldsByStatus(FieldStatus.EMPTY);
   * console.log(`Found ${emptyFields.length} empty fields`);
   * ```
   */
  getFieldsByStatus(status: FieldStatus): TrackedField[];

  /**
   * Clear all tracked fields
   *
   * Resets the field tracking state, typically called at the start of
   * processing a new document.
   *
   * @returns void
   * @example
   * ```typescript
   * // Clear state before processing new document
   * fieldState.clear();
   * ```
   */
  clear(): void;
}

/**
 * Core implementation of field state management
 *
 * This class provides a basic, portable implementation of field tracking
 * that can be used as a foundation for more advanced field tracking systems.
 *
 * @class CoreFieldState
 * @example
 * ```typescript
 * const fieldState = new CoreFieldState();
 *
 * // Track field processing
 * fieldState.trackField('client.name', {
 *   value: 'Acme Corp',
 *   originalValue: '{{client.name}}',
 *   hasLogic: false
 * });
 *
 * // Get tracking report
 * const fields = fieldState.getFields();
 * const emptyFields = fieldState.getFieldsByStatus(FieldStatus.EMPTY);
 * ```
 */
export class CoreFieldState implements FieldState {
  private _fields: Map<string, TrackedField> = new Map();

  /**
   * Get the internal fields map (read-only access)
   */
  get fields(): Map<string, TrackedField> {
    return this._fields;
  }

  /**
   * Track a field that has been processed
   *
   * @param name - The name/identifier of the field to track
   * @param options - Options for field tracking
   */
  trackField(name: string, options: FieldTrackingOptions): void {
    const { value, originalValue, hasLogic = false, mixinUsed } = options;

    let status: FieldStatus;
    if (hasLogic || mixinUsed) {
      status = FieldStatus.LOGIC;
    } else if (value === undefined || value === null || value === '') {
      status = FieldStatus.EMPTY;
    } else {
      status = FieldStatus.FILLED;
    }

    const field: TrackedField = {
      name,
      status,
      value,
      originalValue,
      hasLogic,
      mixinUsed,
    };

    this._fields.set(name, field);
  }

  /**
   * Get all tracked fields
   *
   * @returns A copy of the tracked fields map
   */
  getFields(): Map<string, TrackedField> {
    return new Map(this._fields);
  }

  /**
   * Get fields filtered by status
   *
   * @param status - The status to filter by
   * @returns Array of fields with the specified status
   */
  getFieldsByStatus(status: FieldStatus): TrackedField[] {
    return Array.from(this._fields.values()).filter(field => field.status === status);
  }

  /**
   * Clear all tracked fields
   */
  clear(): void {
    this._fields.clear();
  }

  /**
   * Generate a summary report of tracked fields
   *
   * @returns Summary statistics of field tracking
   * @example
   * ```typescript
   * const report = fieldState.generateReport();
   * console.log(`Total: ${report.total}, Filled: ${report.filled}, Empty: ${report.empty}`);
   * ```
   */
  generateReport(): {
    total: number;
    filled: number;
    empty: number;
    logic: number;
    fields: TrackedField[];
  } {
    const fields = Array.from(this._fields.values());

    return {
      total: fields.length,
      filled: fields.filter(f => f.status === FieldStatus.FILLED).length,
      empty: fields.filter(f => f.status === FieldStatus.EMPTY).length,
      logic: fields.filter(f => f.status === FieldStatus.LOGIC).length,
      fields,
    };
  }
}
