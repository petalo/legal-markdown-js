/**
 * Field Tracking System for Legal Markdown Processing
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

import { logger } from '../../utils/logger';
import { FieldStatus } from '../../core/tracking/field-state';
import type { TrackedField } from '../../core/tracking/field-state';

// Re-export for compatibility
export { FieldStatus };
export type { TrackedField };

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
  private totalOccurrences: number = 0;

  /**
   * Creates a new FieldTracker instance
   */
  constructor() {}

  /**
   * Track a field that has been processed
   *
   * Registers a field with the tracking system, determining its status based on
   * the provided options and storing relevant metadata for later use.
   *
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
    if (hasLogic || (mixinUsed && ['conditional', 'helper', 'loop'].includes(mixinUsed))) {
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
    this.totalOccurrences++;
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
      // Handle Markdown escaped underscores: empty_field becomes empty\_field
      const escapedFieldName = this.escapeRegex(fieldName).replace(/_/g, '\\\\_?');
      const fieldPattern = new RegExp(`\\{\\{\\s*${escapedFieldName}\\s*\\}\\}`, 'g');

      // Replace unprocessed field patterns (only if they're not already in spans)
      processedContent = processedContent.replace(fieldPattern, (match, offset, string) => {
        // Check if this match is already inside a span tag
        const beforeMatch = string.substring(0, offset);

        // Look for the last opening span tag before this match
        const lastSpanOpen = beforeMatch.lastIndexOf('<span');
        const lastSpanClose = beforeMatch.lastIndexOf('</span>');

        // If there's an unclosed span tag before this match, skip it
        if (lastSpanOpen > lastSpanClose && lastSpanOpen !== -1) {
          return match; // Keep original, don't wrap
        }

        const value =
          field.value !== undefined && field.value !== null && field.value !== ''
            ? String(field.value)
            : match; // Keep the original pattern for empty fields
        return `<span class="${cssClass}" data-field="${fieldName.replace(/"/g, '&quot;')}">${value}</span>`;
      });

      // For fields with specific values, apply highlighting based on field logic, not value characteristics
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        const fieldValue = String(field.value);

        // Apply highlighting ONLY for logic fields and cross-references
        // Do not highlight arbitrary field values in text - only processed template fields
        const shouldHighlight =
          field.status === 'logic' || // Always highlight logic fields
          fieldName.startsWith('crossref.'); // Always highlight cross-references
        // Removed: general field value highlighting to prevent false positives

        if (shouldHighlight) {
          // Split content by HTML tags to avoid highlighting inside attributes
          const parts = processedContent.split(/(<[^>]*>)/);

          for (let i = 0; i < parts.length; i++) {
            // Only process text parts (even indices), skip HTML tags (odd indices)
            if (i % 2 === 0 && parts[i] && parts[i].includes(fieldValue)) {
              const textPart = parts[i];

              // Skip if this text part is already completely inside a highlight span
              // Check if the previous tag was a highlight span and the next tag closes it
              const prevTag = i > 0 ? parts[i - 1] : '';
              const nextTag = i < parts.length - 1 ? parts[i + 1] : '';

              const isInsideHighlightSpan =
                prevTag.includes('class="highlight"') ||
                prevTag.includes('class="imported-value"') ||
                prevTag.includes('class="missing-value"');
              const isClosedBySpan = nextTag === '</span>';

              if (isInsideHighlightSpan && isClosedBySpan) {
                continue;
              }

              // Apply highlighting to this text part
              const escapedValue = this.escapeRegex(fieldValue);
              parts[i] = textPart.replace(new RegExp(escapedValue, 'g'), match => {
                return `<span class="${cssClass}" data-field="${fieldName.replace(/"/g, '&quot;')}">${match}</span>`;
              });
            }
          }

          processedContent = parts.join('');
        }
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
        return 'legal-field imported-value';
      case FieldStatus.EMPTY:
        return 'legal-field missing-value';
      case FieldStatus.LOGIC:
        return 'legal-field highlight';
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
   * Get total number of field occurrences tracked
   */
  getTotalOccurrences(): number {
    return this.totalOccurrences;
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
    // eslint-disable-next-line indent
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
    this.totalOccurrences = 0;
  }
}

// Export singleton instance
export const fieldTracker = new FieldTracker();
