/**
 * @fileoverview Field Tracking System for Legal Markdown Processing
 *
 * This module provides comprehensive field tracking functionality for Legal Markdown
 * documents, including field status monitoring, highlighting support, and reporting
 * capabilities. It tracks field processing state and applies appropriate CSS classes
 * for visual feedback during document review.
 *
 * Features:
 * - Field status tracking (filled, empty, logic)
 * - CSS class application for field highlighting
 * - Field processing state management
 * - Mixin usage tracking for complex field logic
 * - Reporting and analytics for field usage
 * - Singleton pattern for consistent tracking across the application
 *
 * @example
 * ```typescript
 * import { fieldTracker, FieldStatus } from './field-tracker';
 *
 * // Track a field during processing
 * fieldTracker.trackField('client.name', {
 *   value: 'Acme Corporation',
 *   status: FieldStatus.FILLED
 * });
 *
 * // Apply field tracking to content
 * const highlightedContent = fieldTracker.applyFieldTracking(processedContent);
 *
 * // Generate field report
 * const report = fieldTracker.generateReport();
 * console.log(`${report.filled} fields filled, ${report.empty} fields empty`);
 * ```
 */

import { logger } from '../utils/logger';

/**
 * Enumeration of possible field statuses during processing
 *
 * @enum {string} FieldStatus
 * @example
 * ```typescript
 * import { FieldStatus } from './field-tracker';
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
 * Interface representing a tracked field in the Legal Markdown system
 *
 * @interface TrackedField
 * @example
 * ```typescript
 * const field: TrackedField = {
 *   name: 'client.name',
 *   status: FieldStatus.FILLED,
 *   value: 'Acme Corporation',
 *   originalValue: '{{client.name}}',
 *   hasLogic: false,
 *   mixinUsed: undefined
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
 * Field tracking system for Legal Markdown processing
 *
 * Manages field tracking throughout the document processing lifecycle,
 * including status monitoring, highlighting, and reporting capabilities.
 *
 * @class FieldTracker
 * @example
 * ```typescript
 * import { FieldTracker, FieldStatus } from './field-tracker';
 *
 * const tracker = new FieldTracker();
 *
 * // Track field processing
 * tracker.trackField('client.name', {
 *   value: 'Acme Corp',
 *   originalValue: '{{client.name}}',
 *   hasLogic: false
 * });
 *
 * // Apply tracking to content
 * const highlighted = tracker.applyFieldTracking(content);
 *
 * // Generate report
 * const report = tracker.generateReport();
 * ```
 */
export class FieldTracker {
  private fields: Map<string, TrackedField> = new Map();
  private processedContent: string = '';

  /**
   * Creates a new FieldTracker instance
   *
   * @constructor
   */
  constructor() {}

  /**
   * Track a field that has been processed
   *
   * Registers a field with the tracking system, determining its status based on
   * the provided options and storing relevant metadata for later use.
   *
   * @method trackField
   * @param {string} fieldName - The name/identifier of the field to track
   * @param {Object} options - Options for field tracking
   * @param {any} [options.value] - The processed value of the field
   * @param {any} [options.originalValue] - The original unprocessed value
   * @param {boolean} [options.hasLogic=false] - Whether the field contains logical operations
   * @param {string} [options.mixinUsed] - Name of mixin used for processing
   * @returns {void}
   * @example
   * ```typescript
   * // Track a filled field
   * tracker.trackField('client.name', {
   *   value: 'Acme Corporation',
   *   originalValue: '{{client.name}}'
   * });
   *
   * // Track an empty field
   * tracker.trackField('client.address', {
   *   value: '',
   *   originalValue: '{{client.address}}'
   * });
   *
   * // Track a field with logic
   * tracker.trackField('warranty.clause', {
   *   value: 'Standard warranty applies',
   *   originalValue: '{{#if warranty.enabled}}{{warranty.text}}{{/if}}',
   *   hasLogic: true,
   *   mixinUsed: 'warranty-mixin'
   * });
   * ```
   */
  trackField(
    fieldName: string,
    options: {
      value?: any;
      originalValue?: any;
      hasLogic?: boolean;
      mixinUsed?: string;
    }
  ): void {
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
      name: fieldName,
      status,
      value,
      originalValue,
      hasLogic,
      mixinUsed,
    };

    this.fields.set(fieldName, field);
    logger.debug('Field tracked', { fieldName, status, hasLogic });
  }

  /**
   * Apply field tracking to processed content by wrapping fields with appropriate CSS classes
   */
  applyFieldTracking(content: string): string {
    let processedContent = content;

    this.fields.forEach((field, fieldName) => {
      const cssClass = this.getFieldCssClass(field.status);

      // Create regex to find field references in the content
      // This looks for {{fieldName}} patterns that haven't been processed yet
      const fieldPattern = new RegExp(`\\{\\{\\s*${fieldName}\\s*\\}\\}`, 'g');

      // If the field has a value, look for the rendered value in the content
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        const valuePattern = new RegExp(
          `(?<!<span[^>]*>)${this.escapeRegex(String(field.value))}(?!</span>)`,
          'g'
        );

        processedContent = processedContent.replace(valuePattern, match => {
          return `<span class="${cssClass}" data-field="${fieldName}">${match}</span>`;
        });
      } else {
        // For empty fields, wrap the placeholder or empty space
        processedContent = processedContent.replace(fieldPattern, match => {
          return `<span class="${cssClass}" data-field="${fieldName}">[${fieldName}]</span>`;
        });
      }
    });

    this.processedContent = processedContent;
    return processedContent;
  }

  /**
   * Get CSS class for field based on its status
   */
  private getFieldCssClass(status: FieldStatus): string {
    switch (status) {
      case FieldStatus.FILLED:
        return 'imported-value';
      case FieldStatus.EMPTY:
        return 'missing-value';
      case FieldStatus.LOGIC:
        return 'highlight';
      default:
        return '';
    }
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get all tracked fields
   */
  getFields(): Map<string, TrackedField> {
    return new Map(this.fields);
  }

  /**
   * Get fields by status
   */
  getFieldsByStatus(status: FieldStatus): TrackedField[] {
    return Array.from(this.fields.values()).filter(field => field.status === status);
  }

  /**
   * Generate a summary report of tracked fields
   */
  generateReport(): {
    total: number;
    filled: number;
    empty: number;
    logic: number;
    fields: TrackedField[];
  } {
    const fields = Array.from(this.fields.values());

    return {
      total: fields.length,
      filled: fields.filter(f => f.status === FieldStatus.FILLED).length,
      empty: fields.filter(f => f.status === FieldStatus.EMPTY).length,
      logic: fields.filter(f => f.status === FieldStatus.LOGIC).length,
      fields,
    };
  }

  /**
   * Clear all tracked fields
   */
  clear(): void {
    this.fields.clear();
    this.processedContent = '';
  }
}

// Export singleton instance
export const fieldTracker = new FieldTracker();
