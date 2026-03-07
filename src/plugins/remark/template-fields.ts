/**
 * Remark plugin for Legal Markdown template field processing
 *
 * This plugin processes template fields like {{field_name}} in Legal Markdown documents
 * using AST-based processing. It handles:
 * - Simple variables: {{client.name}}
 * - Nested object access: {{client.contact.email}}
 * - Helper functions: {{formatDate date "YYYY-MM-DD"}}
 * - Parenthesized helper syntax: {{formatDate(@today, "YYYY-MM-DD")}}
 * - Subexpressions: {{formatDate (addYears today 2) "YYYY-MM-DD"}}
 * - Conditional expressions: {{active ? "Active" : "Inactive"}}
 * - Field tracking integration for highlighting
 *
 * Syntax Support (Issue #142):
 * - **Space-separated syntax** (standard): {{helper arg1 arg2}}
 * - **Parenthesized syntax**: {{helper(arg1, arg2)}}
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
 * // Handlebars syntax (current)
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkTemplateFields, {
 *     metadata: {
 *       client_name: 'ACME Corp',
 *       date: new Date('2025-01-15')
 *     }
 *   });
 *
 * const result = await processor.process('Hello {{client_name}}! Date: {{formatDate date "MMMM Do, YYYY"}}');
 * // Output: Hello ACME Corp! Date: January 15th, 2025
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { logger } from '../../utils/logger';
import { fieldTracker } from '../../extensions/tracking/field-tracker';
import { fieldSpan } from '../../extensions/tracking/field-span';
import { extensionHelpers as helpers } from '../../extensions/helpers/index';
import { detectBracketValues, unescapeBracketLiteral } from '../../extensions/ast-mixin-processor';
import type { YamlValue } from '../../types';

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
  metadata: Record<string, YamlValue>;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom field patterns (defaults to {{field}} syntax) */
  fieldPatterns?: string[];
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
  /** Use AST-first field tracking tokens */
  astFieldTracking?: boolean;
  /** Highlight winner branches for conditionals */
  logicBranchHighlighting?: boolean;
}

interface MutableTemplateNode {
  type: 'text' | 'html' | 'code' | 'inlineCode';
  value: string;
}

/**
 * Default template field pattern
 */
const DEFAULT_FIELD_PATTERN = /\{\{\s*([^}]+)\s*\}\}/g;

const GENERATED_TRACKING_MARKER = 'data-lm-generated="1"';

/**
 * Check if a position is inside a loop or conditional block
 */
function isInsideLoopOrConditional(text: string, position: number): boolean {
  // Match block helpers with optional arguments:
  // {{#each items}}...{{/each}}, {{#if cond}}...{{/if}}, {{#unless cond}}...{{/unless}}
  // and custom blocks like {{#line_items}}...{{/line_items}}.
  const blockPattern = /\{\{#([\w_]+)(?:\s+[^}]*)?\}\}[\s\S]*?\{\{\/\1\}\}/g;

  let match;
  while ((match = blockPattern.exec(text)) !== null) {
    const blockStart = match.index;
    const blockEnd = match.index + match[0].length;

    // Check if position is inside this block
    if (position > blockStart && position < blockEnd) {
      return true;
    }
  }

  return false;
}

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
      const trimmedExpression = fieldExpression.trim();

      // Skip loop/conditional patterns that should be handled by the clauses plugin
      // These include: {{#if ...}}, {{#variableName}}, {{/if}}, {{/variableName}}, {{else}}
      if (
        trimmedExpression.startsWith('#') ||
        trimmedExpression.startsWith('/') ||
        trimmedExpression === 'else'
      ) {
        continue;
      }

      // Skip fields that are inside loop/conditional blocks
      if (isInsideLoopOrConditional(text, match.index)) {
        continue;
      }

      // Unescape underscores that were escaped by escapeTemplateUnderscores()
      // in src/extensions/remark/legal-markdown-processor.ts
      //
      // Issue #139: Field names with underscores (e.g., "counterparty.legal_name")
      // are escaped to "counterparty.legal\_name" before markdown parsing to prevent
      // the underscore from being interpreted as an emphasis delimiter.
      //
      // We need to unescape them here so the field path matches the metadata keys.
      // Example: "counterparty.legal\_name" → "counterparty.legal_name"
      //
      // @see https://github.com/petalo/legal-markdown-js/issues/139
      // @see src/extensions/remark/legal-markdown-processor.ts - escapeTemplateUnderscores()
      const unescapedExpression = trimmedExpression.replace(/\\_/g, '_');

      fields.push({
        pattern: fullMatch,
        fieldName: unescapedExpression,
        expression: unescapedExpression,
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
  metadata: Record<string, YamlValue>
): {
  value: YamlValue | undefined;
  hasLogic: boolean;
  mixinType?: string;
  isEmptyCondition?: boolean;
} {
  // Check if this field path has a bracket value (should be treated as missing)
  const bracketFields = detectBracketValues(metadata);
  const isBracketValue = bracketFields.has(fieldName);
  // Handle @today with format specifiers
  if (fieldName === '@today' || fieldName.startsWith('@today[')) {
    // Check if @today is defined in metadata first, otherwise use current date
    const todayRaw = metadata['@today'];
    const today = todayRaw ? new Date(todayRaw as string | number | Date) : new Date();
    let formattedDate: string;

    if (fieldName === '@today') {
      // Default format: YYYY-MM-DD
      formattedDate = today.toISOString().split('T')[0];
    } else {
      // Extract format specifier from @today[format]
      const formatMatch = fieldName.match(/@today\[([^\]]+)\]/);
      const format = formatMatch ? formatMatch[1] : '';

      switch (format.toLowerCase()) {
        case 'iso':
          formattedDate = today.toISOString().split('T')[0];
          break;
        case 'long':
          formattedDate = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          break;
        case 'european':
          formattedDate = today.toLocaleDateString('en-GB');
          break;
        case 'legal':
          formattedDate = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          break;
        case 'medium':
          formattedDate = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          break;
        default:
          // Try to use the format as a custom date format
          // For now, fall back to ISO format
          formattedDate = today.toISOString().split('T')[0];
          break;
      }
    }

    return {
      value: formattedDate,
      hasLogic: true,
      mixinType: 'helper',
    };
  }

  // ============================================================================
  // DUAL SYNTAX SUPPORT
  // ============================================================================
  // Both syntaxes are supported:
  // - Space-separated: {{helper arg1 arg2}}
  // - Parenthesized:   {{helper(arg1, arg2)}}
  // ============================================================================

  // Check for Handlebars helper pattern (current standard syntax)
  // Format: helperName arg1 arg2 arg3
  // Example: formatDate date "MMMM Do, YYYY"
  const handlebarsMatch = fieldName.match(/^(\w+)\s+(.+)$/);
  if (handlebarsMatch) {
    const [, helperName, argsString] = handlebarsMatch;
    const helper = helpers[helperName as keyof typeof helpers];

    if (helper && typeof helper === 'function') {
      try {
        // Parse Handlebars-style space-separated arguments
        const args = parseHandlebarsArguments(argsString, metadata);

        // Call the helper function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- external helper function with unknown signature
        const result = (helper as any)(...args) as YamlValue;

        return {
          value: result,
          hasLogic: true,
          mixinType: 'helper',
        };
      } catch (error) {
        logger.warn(
          `Error calling Handlebars helper '${helperName}':`,
          error instanceof Error ? error.message : String(error)
        );
        return {
          value: undefined,
          hasLogic: true,
          mixinType: 'helper',
        };
      }
    }
    // If helper not found, fall through to check legacy syntax
  }

  // ============================================================================
  // PARENTHESIZED HELPER SYNTAX
  // ============================================================================
  // Check for parenthesized helper function pattern: helperName(arg1, arg2)
  const helperMatch = fieldName.match(/^(\w+)\((.*)?\)$/);
  if (helperMatch) {
    const [, helperName, argsString] = helperMatch;
    const helper = helpers[helperName as keyof typeof helpers];

    if (helper && typeof helper === 'function') {
      try {
        // Parse arguments (legacy comma-separated)
        const args = parseHelperArguments(argsString || '', metadata);

        // Call the helper function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- external helper function with unknown signature
        const result = (helper as any)(...args) as YamlValue;

        return {
          value: result,
          hasLogic: true,
          mixinType: 'helper',
        };
      } catch (error) {
        logger.warn(
          `Error calling helper '${helperName}':`,
          error instanceof Error ? error.message : String(error)
        );
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

    // Check if the condition variable itself is empty (for proper field tracking)
    const isConditionEmpty = isEmptyValue(conditionResult);

    return {
      value: cleanResult,
      hasLogic: true,
      mixinType: 'conditional',
      isEmptyCondition: isConditionEmpty, // Track if the original field was empty
    };
  }

  // Simple variable access with dot notation
  const value = resolveNestedValue(metadata, fieldName);

  // If this is a bracket value, treat it as missing (return undefined)
  if (isBracketValue) {
    return {
      value: undefined,
      hasLogic: false,
      mixinType: 'variable',
    };
  }

  const normalizedValue =
    typeof value === 'string' ? (unescapeBracketLiteral(value) ?? value) : value;

  return {
    value: normalizedValue,
    hasLogic: false,
    mixinType: 'variable',
  };
}

/**
 * Resolve nested value from metadata using dot notation
 */
function resolveNestedValue(
  metadata: Record<string, YamlValue>,
  path: string
): YamlValue | undefined {
  const keys = path.split('.').map(key => key.replace(/^\*/g, '_').replace(/\*$/g, '_'));
  let current: YamlValue | undefined = metadata;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array access like parties[0]
    const arrayMatch = key.match(/^(.+?)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, YamlValue>)[arrayName];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else if (Array.isArray(current)) {
      // Numeric key in dot notation: parties.1.name -> parties[1].name
      const arrayIndex = parseInt(key, 10);
      if (!isNaN(arrayIndex) && String(arrayIndex) === key) {
        current = (current as YamlValue[])[arrayIndex];
      } else {
        return undefined; // Non-numeric key on an array
      }
    } else {
      if (typeof current !== 'object' || current instanceof Date) {
        return undefined;
      }
      current = (current as Record<string, YamlValue>)[key];
    }
  }

  return current;
}

/**
 * Check if value is considered empty for field tracking purposes
 */
function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Format value for display with optional field tracking
 */
function formatFieldValue(
  value: YamlValue | undefined,
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
    // Priority: empty > logic > filled
    // This ensures empty fields are marked as missing even if they have conditional logic
    const status = isEmptyField ? 'empty' : hasLogic ? 'logic' : 'filled';
    const kind = status === 'empty' ? 'missing' : status === 'logic' ? 'highlight' : 'imported';
    return fieldSpan(fieldName, formattedValue, kind);
  }

  return formattedValue;
}

/**
 * Check if text contains existing field tracking spans
 */
function hasExistingFieldSpans(text: string): boolean {
  return text.includes('class="legal-field') && text.includes('data-field="');
}

function isTrackedFieldSpanOpenTag(tag: string): boolean {
  return (
    /<span\b[^>]*class=(?:"[^"]*\blegal-field\b[^"]*"|'[^']*\blegal-field\b[^']*')[^>]*data-field=(?:"[^"]*"|'[^']*')[^>]*>/i.test(
      tag
    ) && !tag.includes(GENERATED_TRACKING_MARKER)
  );
}

function stripGeneratedTrackingMarkers(text: string): string {
  return text.replace(/\sdata-lm-generated="1"/g, '');
}

/**
 * Masks {{...}} patterns inside existing legal-field spans while preserving
 * string length so extracted indices stay aligned with the original text.
 */
function maskTemplateFieldsInsideTrackedSpans(text: string): string {
  const spanTagRegex = /<\/?span\b[^>]*>/gi;
  const templateRegex = /\{\{[^}]+\}\}/g;
  const spanStack: boolean[] = [];

  let output = '';
  let cursor = 0;
  let match: RegExpExecArray | null;

  const maskSegment = (segment: string, insideTrackedSpan: boolean): string => {
    if (!insideTrackedSpan) return segment;
    return segment.replace(templateRegex, found => ' '.repeat(found.length));
  };

  while ((match = spanTagRegex.exec(text)) !== null) {
    const tag = match[0];
    const start = match.index;
    const insideTrackedSpan = spanStack.includes(true);

    output += maskSegment(text.slice(cursor, start), insideTrackedSpan);
    output += tag;

    if (tag.startsWith('</')) {
      if (spanStack.length > 0) {
        spanStack.pop();
      }
    } else {
      spanStack.push(isTrackedFieldSpanOpenTag(tag));
    }

    cursor = start + tag.length;
  }

  output += maskSegment(text.slice(cursor), spanStack.includes(true));
  return output;
}

/**
 * Check if a text node is inside existing field tracking spans by examining sibling HTML nodes
 */
function isInsideFieldTrackingSpan(node: unknown, parent: unknown): boolean {
  if (
    !parent ||
    typeof parent !== 'object' ||
    (parent as Record<string, unknown>)['type'] !== 'paragraph' ||
    !Array.isArray((parent as Record<string, unknown>)['children'])
  ) {
    return false;
  }

  const children = (parent as Record<string, unknown[]>)['children'];
  const nodeIndex = children.indexOf(node);
  if (nodeIndex === -1) {
    return false;
  }

  const countFieldSpanOpenTags = (html: string): number => {
    const matches = html.match(/<span\b[^>]*>/g) ?? [];
    return matches.filter(isTrackedFieldSpanOpenTag).length;
  };

  const countSpanCloseTags = (html: string): number => {
    const matches = html.match(/<\/span>/g);
    return matches ? matches.length : 0;
  };

  // Track net field-span depth before this node.
  // A node is "inside" only if there is an unmatched opening field span before it.
  let depthBeforeNode = 0;
  for (let i = 0; i < nodeIndex; i++) {
    const sibling = children[i] as Record<string, unknown>;
    if (sibling['type'] !== 'html' || typeof sibling['value'] !== 'string') continue;
    const value = sibling['value'];
    depthBeforeNode += countFieldSpanOpenTags(value);
    depthBeforeNode -= countSpanCloseTags(value);
    if (depthBeforeNode < 0) depthBeforeNode = 0;
  }

  if (depthBeforeNode <= 0) {
    return false;
  }

  // Confirm there is a closing span after this node so we only skip nodes that are
  // actually enclosed by a bounded span region.
  let remainingDepth = depthBeforeNode;
  for (let i = nodeIndex + 1; i < children.length; i++) {
    const sibling = children[i] as Record<string, unknown>;
    if (sibling['type'] !== 'html' || typeof sibling['value'] !== 'string') continue;
    const value = sibling['value'];
    remainingDepth += countFieldSpanOpenTags(value);
    remainingDepth -= countSpanCloseTags(value);
    if (remainingDepth <= 0) {
      return true;
    }
  }

  return false;
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
function parseHelperArguments(
  argsString: string,
  metadata: Record<string, YamlValue>
): (YamlValue | undefined)[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: (YamlValue | undefined)[] = [];
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- external helper function with unknown signature
          const nestedResult = (helper as any)(...nestedArgs) as YamlValue;
          args.push(nestedResult);
          continue;
        } catch (error) {
          logger.warn(
            `Error calling nested helper '${helperName}':`,
            error instanceof Error ? error.message : String(error)
          );
          // Fall through to treat as metadata reference
        }
      }
    }

    // Handle @today special case
    if (trimmed === '@today' || trimmed.startsWith('@today[')) {
      // Check if @today is defined in metadata first, otherwise use current date
      const todayRaw = metadata['@today'];
      const todayValue = todayRaw ? new Date(todayRaw as string | number | Date) : new Date();
      args.push(todayValue);
      continue;
    }

    // Metadata reference (including other variables)
    const value = resolveNestedValue(metadata, trimmed);
    args.push(value);
  }

  return args;
}

/**
 * Parse Handlebars-style space-separated arguments from a helper function call
 *
 * Parses Handlebars helper arguments (space-separated instead of comma-separated),
 * resolving metadata references, handling string literals, numbers, booleans,
 * subexpressions, and nested helper function calls.
 *
 * @param argsString - Raw arguments string from Handlebars helper call
 * @param metadata - Metadata object for resolving references
 * @returns Array of parsed argument values
 *
 * @example
 * ```typescript
 * parseHandlebarsArguments('date "MMMM Do, YYYY"', { date: new Date() })
 * // Returns: [Date, 'MMMM Do, YYYY']
 *
 * parseHandlebarsArguments('(addYears today 5) "YYYY-MM-DD"', { today: new Date() })
 * // Returns: [Date (5 years added), 'YYYY-MM-DD']
 *
 * parseHandlebarsArguments('amount "USD"', { amount: 1500 })
 * // Returns: [1500, 'USD']
 *
 * parseHandlebarsArguments('price quantity', { price: 10, quantity: 5 })
 * // Returns: [10, 5]
 * ```
 */
function parseHandlebarsArguments(
  argsString: string,
  metadata: Record<string, YamlValue>
): (YamlValue | undefined)[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: (YamlValue | undefined)[] = [];
  let i = 0;

  while (i < argsString.length) {
    // Skip whitespace
    while (i < argsString.length && /\s/.test(argsString[i])) {
      i++;
    }

    if (i >= argsString.length) {
      break;
    }

    // Handle string literals (double or single quotes)
    if (argsString[i] === '"' || argsString[i] === "'") {
      const quoteChar = argsString[i];
      i++; // Skip opening quote
      let stringValue = '';

      while (i < argsString.length && argsString[i] !== quoteChar) {
        // Handle escaped quotes
        if (
          argsString[i] === '\\' &&
          i + 1 < argsString.length &&
          argsString[i + 1] === quoteChar
        ) {
          stringValue += quoteChar;
          i += 2;
        } else {
          stringValue += argsString[i];
          i++;
        }
      }

      if (i < argsString.length) {
        i++; // Skip closing quote
      }

      args.push(stringValue);
      continue;
    }

    // Handle subexpressions (parentheses): (helperName arg1 arg2)
    if (argsString[i] === '(') {
      i++; // Skip opening paren
      let parenDepth = 1;
      let subexpr = '';

      while (i < argsString.length && parenDepth > 0) {
        if (argsString[i] === '(') {
          parenDepth++;
        } else if (argsString[i] === ')') {
          parenDepth--;
          if (parenDepth === 0) {
            break;
          }
        }
        subexpr += argsString[i];
        i++;
      }

      if (i < argsString.length) {
        i++; // Skip closing paren
      }

      // Parse the subexpression
      const subexprMatch = subexpr.trim().match(/^(\w+)\s+(.+)$/);
      if (subexprMatch) {
        const [, helperName, nestedArgsString] = subexprMatch;
        const helper = helpers[helperName as keyof typeof helpers];

        if (helper && typeof helper === 'function') {
          try {
            // Recursively parse nested arguments
            const nestedArgs = parseHandlebarsArguments(nestedArgsString, metadata);

            // Call the nested helper function
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- external helper function with unknown signature
            const nestedResult = (helper as any)(...nestedArgs) as YamlValue;
            args.push(nestedResult);
            continue;
          } catch (error) {
            logger.warn(
              `Error calling Handlebars subexpression helper '${helperName}':`,
              error instanceof Error ? error.message : String(error)
            );
            args.push(undefined);
            continue;
          }
        }
      }

      // If we couldn't parse the subexpression as a helper, treat it as undefined
      args.push(undefined);
      continue;
    }

    // Handle other tokens (numbers, booleans, variables)
    let token = '';
    while (i < argsString.length && !/\s/.test(argsString[i]) && argsString[i] !== ')') {
      token += argsString[i];
      i++;
    }

    if (!token) {
      continue;
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      args.push(parseFloat(token));
      continue;
    }

    // Boolean literal
    if (token === 'true') {
      args.push(true);
      continue;
    }
    if (token === 'false') {
      args.push(false);
      continue;
    }

    // Null/undefined literal
    if (token === 'null') {
      args.push(null);
      continue;
    }
    if (token === 'undefined') {
      args.push(undefined);
      continue;
    }

    // Handle @today special case
    if (token === '@today' || token.startsWith('@today[')) {
      // Check if @today is defined in metadata first, otherwise use current date
      const todayRaw = metadata['@today'];
      const todayValue = todayRaw ? new Date(todayRaw as string | number | Date) : new Date();
      args.push(todayValue);
      continue;
    }

    // Handle 'today' variable (alias for @today in Handlebars context)
    if (token === 'today') {
      const todayRaw2 = metadata['today'] || metadata['@today'];
      const todayValue = todayRaw2 ? new Date(todayRaw2 as string | number | Date) : new Date();
      args.push(todayValue);
      continue;
    }

    // Metadata reference
    const value = resolveNestedValue(metadata, token);
    args.push(value);
  }

  return args;
}

/**
 * Process template fields in text nodes
 */
function processTemplateFieldsInAST(
  root: Root,
  metadata: Record<string, YamlValue>,
  fieldPatterns: string[],
  enableFieldTracking: boolean = false,
  astFieldTracking: boolean = false,
  debug: boolean = false
): void {
  function toFieldMappingsMap(value: unknown): Map<string, string> {
    if (value instanceof Map) {
      return value as Map<string, string>;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return new Map(
        Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => [k, v as string])
      );
    }

    return new Map();
  }

  // Get field mappings from metadata if available
  const fieldMappings = toFieldMappingsMap(metadata['_field_mappings']);

  // Process text, HTML, code, and inlineCode nodes
  visit(root, (node, _index, parent) => {
    void _index;

    // Process text, HTML, code, and inlineCode nodes
    if (
      (node.type === 'text' ||
        node.type === 'html' ||
        node.type === 'code' ||
        node.type === 'inlineCode') &&
      'value' in node &&
      typeof node.value === 'string'
    ) {
      const mutableNode = node as MutableTemplateNode;
      const originalValue = node.value;
      let workingValue = originalValue;
      let transformedByAstTokens = false;

      if (astFieldTracking) {
        let transformedValue = workingValue;
        let transformed = false;

        transformedValue = transformedValue.replace(
          /<lm-field\b([^>]*)>/g,
          (_full, attrs: string) => {
            const fieldMatch = attrs.match(/data-field=(?:"([^"]*)"|'([^']*)')/);
            const kindMatch = attrs.match(/data-kind=(?:"([^"]*)"|'([^']*)')/);
            const fieldName = (fieldMatch?.[1] || fieldMatch?.[2] || '').replace(/&quot;/g, '"');
            const kind = kindMatch?.[1] || kindMatch?.[2] || 'imported';
            const cls =
              kind === 'missing'
                ? 'legal-field missing-value'
                : kind === 'highlight' || kind === 'crossref'
                  ? 'legal-field highlight'
                  : 'legal-field imported-value';
            transformed = true;
            return `<span class="${cls}" data-field="${fieldName}" ${GENERATED_TRACKING_MARKER}>`;
          }
        );
        transformedValue = transformedValue.replace(/<\/lm-field>/g, () => {
          transformed = true;
          return '</span>';
        });

        transformedValue = transformedValue.replace(
          /<lm-logic-start\b([^>]*)>/g,
          (_full, attrs: string) => {
            const fieldMatch = attrs.match(/data-field=(?:"([^"]*)"|'([^']*)')/);
            const helperMatch = attrs.match(/data-logic-helper=(?:"([^"]*)"|'([^']*)')/);
            const resultMatch = attrs.match(/data-logic-result=(?:"([^"]*)"|'([^']*)')/);
            const fieldName = fieldMatch?.[1] || fieldMatch?.[2] || '';
            const helperName = helperMatch?.[1] || helperMatch?.[2] || 'if';
            const logicResult = resultMatch?.[1] || resultMatch?.[2] || 'false';
            transformed = true;
            return `<span class="legal-field highlight" data-field="${fieldName}" data-logic-helper="${helperName}" data-logic-result="${logicResult}" ${GENERATED_TRACKING_MARKER}>`;
          }
        );
        transformedValue = transformedValue.replace(/<\/lm-logic-start>/g, () => {
          transformed = true;
          return '';
        });
        transformedValue = transformedValue.replace(/<lm-logic-end>/g, () => {
          transformed = true;
          return '</span>';
        });
        transformedValue = transformedValue.replace(/<\/lm-logic-end>/g, () => {
          transformed = true;
          return '';
        });

        if (transformed) {
          transformedByAstTokens = true;
          workingValue = transformedValue;
          if (
            enableFieldTracking &&
            node.type === 'text' &&
            workingValue.includes('<span class="legal-field')
          ) {
            mutableNode.type = 'html';
          }
          if (!/\{\{[^}]+\}\}/.test(workingValue)) {
            mutableNode.value = stripGeneratedTrackingMarkers(workingValue);
            return;
          }
        }
      }

      // Skip processing if this HTML already contains field tracking spans AND
      // there are no remaining {{...}} template fields to resolve.
      // Nodes converted by remarkDates may have spans for @today but still
      // contain unprocessed {{variable}} patterns that must not be skipped.
      if (!astFieldTracking && node.type === 'html' && hasExistingFieldSpans(workingValue)) {
        const hasUnresolvedFields = /\{\{[^}]+\}\}/.test(workingValue);
        if (!hasUnresolvedFields) {
          if (debug) {
            logger.debug(
              `Skipping HTML node with existing field spans: "${workingValue.substring(0, 100)}..."`
            );
          }
          return;
        }
      }

      // Skip processing if this text node is inside existing field tracking spans
      if (node.type === 'text' && isInsideFieldTrackingSpan(node, parent)) {
        if (debug) {
          logger.debug(`Skipping text node inside existing field spans: "${originalValue}"`);
        }
        return;
      }
      // Normalize escaped underscores from remark-parse (\_  back to _)
      // This happens when underscores are in bold/italic contexts
      const normalizedValue = workingValue.replace(/\\_/g, '_');
      const valueForFieldExtraction =
        node.type === 'html' && hasExistingFieldSpans(normalizedValue)
          ? maskTemplateFieldsInsideTrackedSpans(normalizedValue)
          : normalizedValue;

      const templateFields = extractTemplateFields(valueForFieldExtraction, fieldPatterns);

      if (templateFields.length === 0) {
        if (transformedByAstTokens) {
          mutableNode.value = stripGeneratedTrackingMarkers(workingValue);
        }
        return; // No template fields found
      }

      if (debug) {
        logger.debug(
          `Found ${templateFields.length} template fields in ${node.type}: "${normalizedValue}"`
        );
      }

      let processedText = normalizedValue;

      // Process fields in reverse order to maintain string indices
      for (const field of templateFields) {
        const resolved = resolveFieldValue(field.fieldName, metadata);
        const { value, hasLogic, mixinType } = resolved;
        // For conditionals, check if the original condition was empty
        const isEmptyCondition = resolved.isEmptyCondition;
        const isEmptyField =
          isEmptyCondition !== undefined ? isEmptyCondition : isEmptyValue(value);

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
          logger.debug(
            `Replaced ${field.pattern} with "${formattedValue}" (original: ${originalPattern})`
          );
        }
      }

      // Update the node value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mutating mdast node value in-place
      (node as any).value = stripGeneratedTrackingMarkers(processedText);

      // If we added field tracking HTML and this is a text node, convert it to HTML node
      // to prevent remark-stringify from escaping the HTML
      if (
        enableFieldTracking &&
        node.type === 'text' &&
        processedText.includes('<span class="legal-field')
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mutating mdast node type in-place
        (node as any).type = 'html';
      }
    }
  });
}

/**
 * Remark plugin for processing template fields in Legal Markdown documents
 */
const remarkTemplateFields: Plugin<[TemplateFieldOptions], Root> = options => {
  const {
    metadata,
    debug = false,
    fieldPatterns = [],
    enableFieldTracking = false,
    astFieldTracking,
  } = options;

  return (tree: Root) => {
    if (debug) {
      logger.debug('Processing template fields with remark plugin');
      logger.debug('Metadata:', metadata);
      logger.debug('Field patterns:', fieldPatterns);
      if (enableFieldTracking) {
        logger.debug('Field tracking highlighting enabled');
      }
      logger.debug('Code block processing enabled by default');
    }

    // Process all template fields in the AST with optional field tracking
    processTemplateFieldsInAST(
      tree,
      metadata,
      fieldPatterns,
      enableFieldTracking,
      astFieldTracking ?? false,
      debug
    );

    if (debug) {
      logger.debug('Template field processing completed');
    }
  };
};

export default remarkTemplateFields;
export type { TemplateFieldOptions, TemplateField };

// Exported for testing - not part of public API
export {
  isInsideLoopOrConditional as _isInsideLoopOrConditional,
  extractTemplateFields as _extractTemplateFields,
  resolveFieldValue as _resolveFieldValue,
  resolveNestedValue as _resolveNestedValue,
  formatFieldValue as _formatFieldValue,
  isInsideFieldTrackingSpan as _isInsideFieldTrackingSpan,
  smartSplitArguments as _smartSplitArguments,
  parseHelperArguments as _parseHelperArguments,
  parseHandlebarsArguments as _parseHandlebarsArguments,
};
