/**
 * Remark plugin for Legal Markdown template field processing
 *
 * This plugin processes template fields like {{field_name}} in Legal Markdown documents
 * using AST-based processing. It handles:
 * - Simple variables: {{client.name}}
 * - Nested object access: {{client.contact.email}}
 * - Helper functions: {{formatDate(@today, "YYYY-MM-DD")}}
 * - Conditional expressions: {{active ? "Active" : "Inactive"}}
 * - Field tracking integration for highlighting
 *
 * Architecture:
 * 1. Parse template field patterns in text nodes
 * 2. Resolve field values from metadata
 * 3. Replace patterns with resolved values
 * 4. Track fields for highlighting support
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkTemplateFields from './template-fields';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkTemplateFields, { metadata: { client_name: 'ACME Corp' } });
 *
 * const result = await processor.process('Hello {{client_name}}!');
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, HTML } from 'mdast';
import { fieldTracker } from '../../extensions/tracking/field-tracker';
import { extensionHelpers as helpers } from '../../extensions/helpers/index';

/**
 * Template field definition extracted from text
 */
interface TemplateField {
  pattern: string;
  fieldName: string;
  expression: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Plugin options for template field processing
 */
interface TemplateFieldOptions {
  /** Document metadata containing field values */
  metadata: Record<string, any>;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom field patterns (defaults to {{field}} syntax) */
  fieldPatterns?: string[];
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
}

/**
 * Default template field pattern
 */
const DEFAULT_FIELD_PATTERN = /\{\{\s*([^}]+)\s*\}\}/g;

/**
 * Extract template fields from text content
 */
function extractTemplateFields(text: string, patterns: string[]): TemplateField[] {
  const fields: TemplateField[] = [];

  // Use default pattern if none provided
  const regexPatterns =
    patterns.length > 0 ? patterns.map(p => new RegExp(p, 'g')) : [DEFAULT_FIELD_PATTERN];

  for (const regex of regexPatterns) {
    let match;
    regex.lastIndex = 0; // Reset regex state

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, fieldExpression] = match;

      fields.push({
        pattern: fullMatch,
        fieldName: fieldExpression.trim(),
        expression: fieldExpression.trim(),
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
      });
    }
  }

  // Sort by start index for proper replacement order (reverse to avoid index shifting)
  return fields.sort((a, b) => b.startIndex - a.startIndex);
}

/**
 * Resolve template field value from metadata
 */
function resolveFieldValue(
  fieldName: string,
  metadata: Record<string, any>
): { value: any; hasLogic: boolean; mixinType?: string } {
  // Handle special values
  if (fieldName === '@today') {
    return {
      value: new Date().toISOString().split('T')[0],
      hasLogic: true,
      mixinType: 'helper',
    };
  }

  // Check for helper function pattern
  const helperMatch = fieldName.match(/^(\w+)\((.*)?\)$/);
  if (helperMatch) {
    const [, helperName, argsString] = helperMatch;
    const helper = helpers[helperName as keyof typeof helpers];

    if (helper && typeof helper === 'function') {
      try {
        // Parse arguments
        const args = parseHelperArguments(argsString || '', metadata);

        // Call the helper function
        const result = (helper as any)(...args);

        return {
          value: result,
          hasLogic: true,
          mixinType: 'helper',
        };
      } catch (error) {
        console.warn(`Error calling helper '${helperName}':`, error);
        return {
          value: undefined,
          hasLogic: true,
          mixinType: 'helper',
        };
      }
    } else {
      // Helper not found
      return {
        value: undefined,
        hasLogic: true,
        mixinType: 'helper',
      };
    }
  }

  // Check for conditional/ternary pattern
  const conditionalMatch = fieldName.match(/(.+?)\s*\?\s*(.+?)\s*:\s*(.+)/);
  if (conditionalMatch) {
    const [, condition, trueValue, falseValue] = conditionalMatch;
    const conditionResult = resolveNestedValue(metadata, condition.trim());
    const result = conditionResult ? trueValue.trim() : falseValue.trim();

    // Remove quotes from string literals
    const cleanResult = result.replace(/^["']|["']$/g, '');

    return {
      value: cleanResult,
      hasLogic: true,
      mixinType: 'conditional',
    };
  }

  // Simple variable access with dot notation
  const value = resolveNestedValue(metadata, fieldName);

  return {
    value,
    hasLogic: false,
    mixinType: 'variable',
  };
}

/**
 * Resolve nested value from metadata using dot notation
 */
function resolveNestedValue(metadata: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = metadata;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array access like parties[0]
    const arrayMatch = key.match(/^(.+?)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[key];
    }
  }

  return current;
}

/**
 * Check if value is considered empty for field tracking purposes
 */
function isEmptyValue(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Get CSS class for field based on its status
 */
function getFieldCssClass(status: string): string {
  switch (status) {
    case 'filled':
      return 'legal-field imported-value';
    case 'empty':
      return 'legal-field missing-value';
    case 'logic':
      return 'legal-field highlight';
    default:
      return 'legal-field imported-value';
  }
}

/**
 * Format value for display with optional field tracking
 */
function formatFieldValue(
  value: any,
  fieldName: string,
  enableFieldTracking: boolean = false,
  hasLogic: boolean = false,
  isEmptyField: boolean = false
): string {
  const formattedValue = (() => {
    if (isEmptyValue(value)) {
      return `{{${fieldName}}}`;
    }

    // Handle different value types
    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    return String(value);
  })();

  // Apply field tracking wrapper if enabled
  if (enableFieldTracking) {
    const status = hasLogic ? 'logic' : isEmptyField ? 'empty' : 'filled';
    const cssClass = getFieldCssClass(status);
    return `<span class="${cssClass}" data-field="${fieldName.replace(/"/g, '&quot;')}">${formattedValue}</span>`;
  }

  return formattedValue;
}

/**
 * Check if text contains existing field tracking spans
 */
function hasExistingFieldSpans(text: string): boolean {
  return text.includes('class="legal-field') && text.includes('data-field="');
}

/**
 * Check if a text node is inside existing field tracking spans by examining sibling HTML nodes
 */
function isInsideFieldTrackingSpan(node: any, parent: any): boolean {
  if (!parent || parent.type !== 'paragraph' || !parent.children) {
    return false;
  }

  const nodeIndex = parent.children.indexOf(node);
  if (nodeIndex === -1) {
    return false;
  }

  // Look for opening field tracking span before this node
  let hasOpeningSpan = false;
  for (let i = nodeIndex - 1; i >= 0; i--) {
    const prevNode = parent.children[i];
    if (
      prevNode.type === 'html' &&
      prevNode.value.includes('class="legal-field') &&
      prevNode.value.includes('data-field="')
    ) {
      hasOpeningSpan = true;
      break;
    }
  }

  // Look for closing span after this node
  let hasClosingSpan = false;
  for (let i = nodeIndex + 1; i < parent.children.length; i++) {
    const nextNode = parent.children[i];
    if (nextNode.type === 'html' && nextNode.value.includes('</span>')) {
      hasClosingSpan = true;
      break;
    }
  }

  return hasOpeningSpan && hasClosingSpan;
}

/**
 * Smart split function that respects quoted strings and parentheses
 *
 * Splits a string on commas while preserving commas inside quoted strings
 * and nested parentheses (for helper function calls).
 * Handles both single and double quotes.
 *
 * @param str - String to split
 * @returns Array of split parts
 *
 * @example
 * ```typescript
 * smartSplitArguments('arg1, "arg with, comma", arg3')
 * // Returns: ['arg1', '"arg with, comma"', 'arg3']
 *
 * smartSplitArguments('addYears(@today, 5), "YYYY-MM-DD"')
 * // Returns: ['addYears(@today, 5)', '"YYYY-MM-DD"']
 * ```
 */
function smartSplitArguments(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      // Start of quoted string
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === quoteChar && inQuotes) {
      // End of quoted string
      inQuotes = false;
      quoteChar = '';
      current += char;
    } else if (char === '(' && !inQuotes) {
      // Opening parenthesis outside quotes
      parenDepth++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      // Closing parenthesis outside quotes
      parenDepth--;
      current += char;
    } else if (char === ',' && !inQuotes && parenDepth === 0) {
      // Comma outside quotes and parentheses - split here
      parts.push(current);
      current = '';
    } else {
      // Regular character
      current += char;
    }
  }

  // Add the last part
  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Parse comma-separated arguments from a helper function call with support for nested calls
 *
 * Parses helper function arguments, resolving metadata references, handling
 * string literals, numbers, booleans, and nested helper function calls.
 *
 * @param argsString - Raw arguments string from helper call
 * @param metadata - Metadata object for resolving references
 * @returns Array of parsed argument values
 *
 * @example
 * ```typescript
 * parseHelperArguments("@today, 'YYYY-MM-DD'", { today: new Date() })
 * // Returns: [Date, 'YYYY-MM-DD']
 *
 * parseHelperArguments("addYears(@today, 5), 'YYYY-MM-DD'", { '@today': new Date() })
 * // Returns: [Date (5 years added), 'YYYY-MM-DD']
 *
 * parseHelperArguments("amount, 'USD'", { amount: 1500 })
 * // Returns: [1500, 'USD']
 * ```
 */
function parseHelperArguments(argsString: string, metadata: Record<string, any>): any[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: any[] = [];
  const parts = smartSplitArguments(argsString);

  for (const part of parts) {
    const trimmed = part.trim();

    if (!trimmed) {
      continue;
    }

    // String literal
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      args.push(trimmed.slice(1, -1));
      continue;
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      args.push(parseFloat(trimmed));
      continue;
    }

    // Boolean literal
    if (trimmed === 'true') {
      args.push(true);
      continue;
    }
    if (trimmed === 'false') {
      args.push(false);
      continue;
    }

    // Null/undefined literal
    if (trimmed === 'null') {
      args.push(null);
      continue;
    }
    if (trimmed === 'undefined') {
      args.push(undefined);
      continue;
    }

    // Check for nested helper function call
    const nestedHelperMatch = trimmed.match(/^(\w+)\((.*)\)$/);
    if (nestedHelperMatch) {
      const [, helperName, nestedArgsString] = nestedHelperMatch;
      const helper = helpers[helperName as keyof typeof helpers];

      if (helper && typeof helper === 'function') {
        try {
          // Recursively parse nested arguments
          const nestedArgs = parseHelperArguments(nestedArgsString, metadata);

          // Call the nested helper function
          const nestedResult = (helper as any)(...nestedArgs);
          args.push(nestedResult);
          continue;
        } catch (error) {
          console.warn(`Error calling nested helper '${helperName}':`, error);
          // Fall through to treat as metadata reference
        }
      }
    }

    // Metadata reference (including @today, etc.)
    const value = resolveNestedValue(metadata, trimmed);
    args.push(value);
  }

  return args;
}

/**
 * Process template fields in text nodes
 */
function processTemplateFieldsInAST(
  root: Root,
  metadata: Record<string, any>,
  fieldPatterns: string[],
  enableFieldTracking: boolean = false,
  debug: boolean = false
): void {
  // Get field mappings from metadata if available
  const fieldMappings = (metadata['_field_mappings'] as Map<string, string>) || new Map();

  // Process both text and HTML nodes
  visit(root, (node, index, parent) => {
    // Only process text and HTML nodes that have a value property
    if (
      (node.type === 'text' || node.type === 'html') &&
      'value' in node &&
      typeof node.value === 'string'
    ) {
      const originalValue = node.value;

      // Skip processing if this HTML already contains field tracking spans
      if (node.type === 'html' && hasExistingFieldSpans(originalValue)) {
        if (debug) {
          console.log(
            `⏭️ Skipping HTML node with existing field spans: "${originalValue.substring(0, 100)}..."`
          );
        }
        return;
      }

      // Skip processing if this text node is inside existing field tracking spans
      if (node.type === 'text' && isInsideFieldTrackingSpan(node, parent)) {
        if (debug) {
          console.log(`⏭️ Skipping text node inside existing field spans: "${originalValue}"`);
        }
        return;
      }
      const templateFields = extractTemplateFields(originalValue, fieldPatterns);

      if (templateFields.length === 0) {
        return; // No template fields found
      }

      if (debug) {
        console.log(
          `📋 Found ${templateFields.length} template fields in ${node.type}: "${originalValue}"`
        );
      }

      let processedText = originalValue;

      // Process fields in reverse order to maintain string indices
      for (const field of templateFields) {
        const { value, hasLogic, mixinType } = resolveFieldValue(field.fieldName, metadata);
        const isEmptyField = isEmptyValue(value);

        // Format value with field tracking applied during AST processing
        const formattedValue = formatFieldValue(
          value,
          field.fieldName,
          enableFieldTracking,
          hasLogic,
          isEmptyField
        );

        // Get the original pattern if this was normalized from a custom pattern
        const originalPattern = fieldMappings.get(field.pattern) || field.pattern;

        // Always track the field for statistics (regardless of highlighting)
        fieldTracker.trackField(field.fieldName, {
          value: value, // Pass the original value, not the formatted one
          originalValue: originalPattern,
          hasLogic,
          mixinUsed: mixinType,
        });

        // Replace the field pattern with the formatted value (potentially wrapped with highlighting)
        processedText =
          processedText.substring(0, field.startIndex) +
          formattedValue +
          processedText.substring(field.endIndex);

        if (debug) {
          console.log(
            `🔄 Replaced ${field.pattern} with "${formattedValue}" (original: ${originalPattern})`
          );
        }
      }

      // Update the node value
      (node as any).value = processedText;
    }
  });
}

/**
 * Remark plugin for processing template fields in Legal Markdown documents
 */
const remarkTemplateFields: Plugin<[TemplateFieldOptions], Root> = options => {
  const { metadata, debug = false, fieldPatterns = [], enableFieldTracking = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('📝 Processing template fields with remark plugin');
      if (enableFieldTracking) {
        console.log('🎯 Field tracking highlighting enabled');
      }
    }

    // Process all template fields in the AST with optional field tracking
    processTemplateFieldsInAST(tree, metadata, fieldPatterns, enableFieldTracking, debug);

    if (debug) {
      console.log('✅ Template field processing completed');
    }
  };
};

export default remarkTemplateFields;
export type { TemplateFieldOptions, TemplateField };
