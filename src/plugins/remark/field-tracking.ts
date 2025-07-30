/**
 * Remark plugin for field tracking in Legal Markdown documents
 *
 * This plugin processes text nodes to track field usage for highlighting and
 * analysis purposes. It excludes code blocks and inline code to prevent
 * false positives from field-like patterns in code.
 *
 * Features:
 * - Tracks field patterns like {{field_name}} in text nodes only
 * - Excludes code and inlineCode nodes to prevent contamination
 * - Integrates with field tracker for highlighting support
 * - Supports both simple fields and complex field expressions
 * - Maintains field usage statistics and metadata
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkFieldTracking from './field-tracking';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkFieldTracking, {
 *     patterns: ['{{(.+?)}}'], // Custom field patterns
 *     trackingEnabled: true
 *   });
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, Node } from 'mdast';
import { fieldTracker } from '../../extensions/tracking/field-tracker';

/**
 * Configuration options for the field tracking plugin
 */
export interface FieldTrackingOptions {
  /** Enable/disable field tracking (default: true) */
  trackingEnabled?: boolean;

  /** Custom field patterns to track (default: ['{{(.+?)}}']) */
  patterns?: string[];

  /** Debug mode for logging field tracking operations */
  debug?: boolean;

  /** Metadata object to store tracking statistics */
  metadata?: Record<string, any>;
}

/**
 * Field tracking result information
 */
interface FieldTrackingResult {
  /** The field key/name */
  key: string;

  /** The original field pattern matched */
  originalValue: string;

  /** The resolved field value */
  value: string;

  /** Whether this field has logic/processing */
  hasLogic: boolean;

  /** Position information if available */
  position?: {
    line: number;
    column: number;
  };
}

/**
 * Default field patterns to track
 */
const DEFAULT_FIELD_PATTERNS = [
  '{{(.+?)}}', // Standard Legal Markdown fields: {{field_name}}
];

/**
 * Check if a node should be excluded from field tracking
 */
function shouldExcludeNode(node: Node, parent?: Node): boolean {
  // Exclude code blocks and inline code
  if (node.type === 'code' || node.type === 'inlineCode') {
    return true;
  }

  // Exclude text nodes that are children of code elements
  if (parent && (parent.type === 'code' || parent.type === 'inlineCode')) {
    return true;
  }

  // Allow all other text nodes
  return false;
}

/**
 * Extract field name from matched pattern
 */
function extractFieldName(match: string, pattern: string): string {
  const regex = new RegExp(pattern);
  const result = regex.exec(match);
  return result && result[1] ? result[1].trim() : match;
}

/**
 * Resolve field value from metadata or return empty string
 */
function resolveFieldValue(fieldName: string, metadata: Record<string, any>): string {
  // Try direct metadata lookup
  if (metadata[fieldName] !== undefined) {
    return String(metadata[fieldName]);
  }

  // Try nested lookup for dotted field names (e.g., 'contract.date')
  const keys = fieldName.split('.');
  let current = metadata;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return ''; // Field not found
    }
  }

  return current !== undefined ? String(current) : '';
}

/**
 * Track fields found in a text node
 */
function trackFieldsInTextNode(
  textNode: Text,
  patterns: string[],
  metadata: Record<string, any>,
  debug: boolean = false
): FieldTrackingResult[] {
  const results: FieldTrackingResult[] = [];
  const content = textNode.value;

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const originalValue = match[0];
      const fieldName = extractFieldName(originalValue, pattern);
      const resolvedValue = resolveFieldValue(fieldName, metadata);

      // Track the field with the field tracker
      fieldTracker.trackField(fieldName, {
        value: resolvedValue,
        originalValue,
        hasLogic: false, // Field tracking plugin tracks simple fields
      });

      // Create tracking result
      const result: FieldTrackingResult = {
        key: fieldName,
        originalValue,
        value: resolvedValue,
        hasLogic: false,
        position: textNode.position
          ? {
              line: textNode.position.start.line,
              column: textNode.position.start.column,
            }
          : undefined,
      };

      results.push(result);

      if (debug) {
        console.log(`📋 Tracked field: ${fieldName} = "${resolvedValue}" (${originalValue})`);
      }
    }
  }

  return results;
}

/**
 * Remark plugin for field tracking in Legal Markdown documents
 */
const remarkFieldTracking: Plugin<[FieldTrackingOptions?], Root> = (options = {}) => {
  const {
    trackingEnabled = true,
    patterns = DEFAULT_FIELD_PATTERNS,
    debug = false,
    metadata = {},
  } = options;

  return (tree: Root) => {
    if (!trackingEnabled) {
      if (debug) {
        console.log('📋 Field tracking is disabled');
      }
      return;
    }

    if (debug) {
      console.log('📋 Processing field tracking with remark plugin');
      console.log(`📋 Using patterns: ${patterns.join(', ')}`);
    }

    let totalFieldsTracked = 0;
    const trackedFields = new Set<string>();

    // Visit all text nodes, excluding code blocks
    visit(tree, 'text', (node: Text, index, parent) => {
      // Skip nodes that should be excluded
      if (shouldExcludeNode(node, parent)) {
        return;
      }

      // Track fields in this text node
      const results = trackFieldsInTextNode(node, patterns, metadata, debug);

      // Update statistics
      totalFieldsTracked += results.length;
      results.forEach(result => trackedFields.add(result.key));
    });

    // Store tracking statistics in metadata
    if (metadata) {
      metadata['_field_tracking_stats'] = {
        totalFieldsTracked,
        uniqueFieldsTracked: trackedFields.size,
        trackedFieldNames: Array.from(trackedFields),
        patterns: patterns,
      };
    }

    if (debug) {
      console.log(
        `📋 Field tracking completed: ${totalFieldsTracked} fields tracked (${trackedFields.size} unique)`
      );
    }
  };
};

export default remarkFieldTracking;
