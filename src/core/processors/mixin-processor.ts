/**
 * Mixin Processing Module for Legal Markdown Documents
 *
 * This module provides comprehensive mixin processing functionality for Legal Markdown
 * documents, supporting variable substitution, helper functions, conditional logic,
 * and nested value access. It integrates with the field tracking system to monitor
 * variable usage and provides robust error handling for complex document templates.
 *
 * Features:
 * - Variable substitution syntax: {{variable}}
 * - Helper function calls: {{helperName(arg1, arg2)}}
 * - Conditional mixins: {{condition ? trueValue : falseValue}}
 * - Nested metadata access with dot notation
 * - Array access with bracket notation: {{parties[0].name}}
 * - Recursive mixin processing for nested substitutions
 * - Field tracking integration for highlighting and validation
 * - Special value handling (@today, booleans, numbers, strings)
 * - Graceful error handling and fallback behavior
 *
 * @example
 * ```typescript
 * import { processMixins } from './mixin-processor';
 *
 * const content = `
 * This agreement is between {{client.name}} and {{provider.name}}.
 * {{confidentiality ? "This includes confidentiality provisions." : ""}}
 * Total amount: {{formatCurrency(contract.amount, "USD")}}
 * Generated on: {{formatDate(@today, "long")}}
 * `;
 *
 * const metadata = {
 *   client: { name: "Acme Corp" },
 *   provider: { name: "Service Ltd" },
 *   confidentiality: true,
 *   contract: { amount: 25000 }
 * };
 *
 * const processed = processMixins(content, metadata);
 * console.log(processed);
 * // Output:
 * // This agreement is between Acme Corp and Service Ltd.
 * // This includes confidentiality provisions.
 * // Total amount: $25,000.00
 * // Generated on: January 15, 2024
 * ```
 *
 * @module
 */

import { LegalMarkdownOptions } from '../../types';
import { fieldTracker } from '../../extensions/tracking/field-tracker';
import { extensionHelpers as helpers } from '../../extensions/helpers/index';
import { processTemplateLoops } from '../../extensions/template-loops';

/**
 * Escapes HTML attribute values to prevent breaking HTML structure
 * @param value - The value to escape
 * @returns Escaped value safe for HTML attributes
 */
function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Processes mixin references in legal documents
 *
 * This is the main function that processes mixin references using the {{variable}}
 * syntax. It supports variable substitution, helper functions, conditional logic,
 * and integrates with field tracking for document validation and highlighting.
 *
 * @param {string} content - The document content containing mixin references
 * @param {Record<string, any>} metadata - Document metadata with variable values
 * @param {LegalMarkdownOptions} [options={}] - Processing options
 * @returns {string} Processed content with mixins resolved
 * @example
 * ```typescript
 * // Basic variable substitution
 * const content1 = "Hello {{user.name}}, welcome to {{company.name}}!";
 * const metadata1 = {
 *   user: { name: "John" },
 *   company: { name: "Acme Corp" }
 * };
 * const result1 = processMixins(content1, metadata1);
 * // Output: "Hello John, welcome to Acme Corp!"
 *
 * // Helper function usage
 * const content2 = "Today is {{formatDate(@today, 'long')}}";
 * const result2 = processMixins(content2, {});
 * // Output: "Today is January 15, 2024"
 *
 * // Conditional mixins
 * const content3 = "{{premium ? 'Premium features enabled' : 'Standard features'}}";
 * const metadata3 = { premium: true };
 * const result3 = processMixins(content3, metadata3);
 * // Output: "Premium features enabled"
 *
 * // Array access
 * const content4 = "Primary contact: {{contacts[0].name}} ({{contacts[0].email}})";
 * const metadata4 = {
 *   contacts: [
 *     { name: "Jane Doe", email: "jane@example.com" }
 *   ]
 * };
 * const result4 = processMixins(content4, metadata4);
 * // Output: "Primary contact: Jane Doe (jane@example.com)"
 * ```
 */
export function processMixins(
  content: string,
  metadata: Record<string, any>,
  options: LegalMarkdownOptions = {}
): string {
  if (options.noMixins) {
    return content;
  }

  // Regular expression to match {{variable}} patterns
  const mixinPattern = /\{\{([^}]+)\}\}/g;

  /**
   * Resolves a dot-notation path in an object, with support for array indices
   *
   * @private
   * @param {any} obj - The object to traverse
   * @param {string} path - Dot-notation path with optional array indices
   * @returns {any} The resolved value or undefined if not found
   * @example
   * ```typescript
   * const obj = {
   *   parties: [
   *     { name: "Company A", contact: { email: "a@example.com" } },
   *     { name: "Company B", contact: { email: "b@example.com" } }
   *   ]
   * };
   *
   * console.log(resolvePath(obj, "parties[0].name"));           // "Company A"
   * console.log(resolvePath(obj, "parties[1].contact.email"));  // "b@example.com"
   * ```
   */
  function resolvePath(obj: any, path: string): any {
    // Handle special case for current item in template loops
    if (path === '.') {
      return obj?.['.'];
    }

    return path.split('.').reduce((current, part) => {
      // Handle array indices like parties.0.name
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, key, index] = match;
        return current?.[key]?.[parseInt(index, 10)];
      }
      return current?.[part];
    }, obj);
  }

  /**
   * Evaluates a helper function expression with arguments
   *
   * @private
   * @param {string} expression - The helper function expression (e.g., "formatDate(@today, 'long')")
   * @param {Record<string, any>} metadata - Metadata context for argument resolution
   * @returns {any} The result of the helper function call, or undefined if invalid
   * @example
   * ```typescript
   * const result1 = evaluateHelperExpression("formatDate(@today, 'long')", {});
   * const result2 = evaluateHelperExpression("formatCurrency(amount, 'USD')", { amount: 1500 });
   * ```
   */
  function evaluateHelperExpression(expression: string, metadata: Record<string, any>): any {
    try {
      // Parse helper function call: helperName(arg1, arg2, ...)
      const match = expression.match(/^(\w+)\((.*)\)$/);
      if (!match) return undefined;

      const [, helperName, argsString] = match;
      const helper = helpers[helperName as keyof typeof helpers];

      if (!helper || typeof helper !== 'function') {
        return undefined;
      }

      // Parse arguments
      const args = parseArguments(argsString, metadata);

      // Call the helper function
      return (helper as any)(...args);
    } catch (error) {
      console.warn(`Error evaluating helper expression: ${expression}`, error);
      return undefined;
    }
  }

  /**
   * Parses comma-separated arguments from a helper function call
   *
   * @private
   * @param {string} argsString - The arguments string to parse
   * @param {Record<string, any>} metadata - Metadata context for variable resolution
   * @returns {any[]} Array of parsed arguments
   * @example
   * ```typescript
   * const args = parseArguments("'USD', amount, true", { amount: 1500 });
   * // Returns: ["USD", 1500, true]
   * ```
   */
  function parseArguments(argsString: string, metadata: Record<string, any>): any[] {
    if (!argsString.trim()) return [];

    // Advanced argument parsing - split by comma but handle quoted strings and nested parentheses
    const args: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
        continue;
      }

      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        current += char;
        continue;
      }

      if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
        continue;
      }

      if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
        continue;
      }

      if (!inQuotes && char === ',' && parenDepth === 0) {
        args.push(parseArgument(current.trim(), metadata));
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      args.push(parseArgument(current.trim(), metadata));
    }

    return args;
  }

  /**
   * Parses a single argument, handling different data types and special values
   *
   * @private
   * @param {string} arg - The argument string to parse
   * @param {Record<string, any>} metadata - Metadata context for variable resolution
   * @returns {any} The parsed argument value
   * @example
   * ```typescript
   * console.log(parseArgument("'hello'", {}));     // "hello"
   * console.log(parseArgument("123", {}));        // 123
   * console.log(parseArgument("true", {}));       // true
   * console.log(parseArgument("@today", {}));     // Date object
   * console.log(parseArgument("user.name", { user: { name: "John" } })); // "John"
   * ```
   */
  function parseArgument(arg: string, metadata: Record<string, any>): any {
    // Handle quoted strings
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(arg)) {
      return parseFloat(arg);
    }

    // Handle booleans
    if (arg === 'true') return true;
    if (arg === 'false') return false;

    // Handle null/undefined
    if (arg === 'null') return null;
    if (arg === 'undefined') return undefined;

    // Handle @today special value
    if (arg === '@today') {
      // Check if @today is defined in metadata first, otherwise use current date
      return metadata['@today'] ? new Date(metadata['@today']) : new Date();
    }

    // Handle nested helper function calls
    if (arg.includes('(') && arg.includes(')')) {
      const result = evaluateHelperExpression(arg, metadata);
      if (result !== undefined) {
        return result;
      }
    }

    // Handle variable references
    return resolvePath(metadata, arg);
  }

  /**
   * Evaluates simple JavaScript expressions containing variables and basic operations
   *
   * @private
   * @param {string} expression - Expression to evaluate (e.g., '"$" + price', 'quantity * rate')
   * @param {Record<string, any>} metadata - Variables available for evaluation
   * @returns {string} Evaluated result or original expression if evaluation fails
   * @example
   * ```typescript
   * const result = evaluateExpression('"$" + price', { price: 10.99 });
   * // Returns: "$10.99"
   * ```
   */
  function evaluateExpression(expression: string, metadata: Record<string, any>): string {
    try {
      // Remove quotes from the expression for processing
      let cleanExpression = expression.trim();

      // Handle string literals and variable substitution
      // Replace variable names with their values
      const variables = Object.keys(metadata);
      variables.forEach(varName => {
        const value = metadata[varName];
        // Create a regex that matches the variable name as a whole word
        const regex = new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

        if (typeof value === 'string') {
          cleanExpression = cleanExpression.replace(regex, `"${value}"`);
        } else if (typeof value === 'number') {
          cleanExpression = cleanExpression.replace(regex, String(value));
        } else if (value === null || value === undefined) {
          cleanExpression = cleanExpression.replace(regex, 'null');
        } else {
          cleanExpression = cleanExpression.replace(regex, JSON.stringify(value));
        }
      });

      // Safely evaluate simple expressions (string concatenation, basic math)
      if (cleanExpression.includes('+') && cleanExpression.includes('"')) {
        // Handle string concatenation like '"$" + 10.99'
        const result = Function(`"use strict"; return (${cleanExpression})`)();
        return String(result);
      } else if (/^[\d\s+\-*/().]+$/.test(cleanExpression)) {
        // Handle simple math expressions
        const result = Function(`"use strict"; return (${cleanExpression})`)();
        return String(result);
      }

      // If we can't safely evaluate, return the original expression
      return expression;
    } catch (error) {
      // If evaluation fails, return the original expression
      return expression;
    }
  }

  /**
   * Recursively replaces mixins in text with their resolved values
   *
   * @private
   * @param {string} text - The text containing mixins to replace
   * @param {number} [depth=0] - Current recursion depth to prevent infinite loops
   * @returns {string} Text with mixins replaced by their values
   * @example
   * ```typescript
   * const text = "Hello {{user.name}}, {{greeting ? 'Good morning' : 'Hello'}}";
   * const result = replaceMixins(text, 0);
   * // Processes all mixins and returns resolved text
   * ```
   */
  function replaceMixins(text: string, depth: number = 0): string {
    // Prevent infinite recursion
    if (depth > 10) {
      return text;
    }

    return text.replace(mixinPattern, (match, variable) => {
      const trimmedVar = variable.trim();

      // Check if it's a helper function call
      if (trimmedVar.includes('(') && trimmedVar.includes(')')) {
        const result = evaluateHelperExpression(trimmedVar, metadata);
        if (result !== undefined) {
          // Track field with helper
          fieldTracker.trackField(trimmedVar, {
            value: result,
            hasLogic: true,
            mixinUsed: 'helper',
          });
          if (options.enableFieldTrackingInMarkdown) {
            return `<span class="highlight"><span class="imported-value" data-field="${escapeHtmlAttribute(trimmedVar)}">${String(result)}</span></span>`;
          }
          return String(result);
        }
        // Helper failed - treat as missing value
        if (options.enableFieldTrackingInMarkdown) {
          return `<span class="highlight"><span class="missing-value" data-field="${escapeHtmlAttribute(trimmedVar)}">[[${trimmedVar}]]</span></span>`;
        }
        return `{{${trimmedVar}}}`;
      }

      // Check if it's a conditional mixin
      if (trimmedVar.includes('?')) {
        const questionIndex = trimmedVar.indexOf('?');
        const colonIndex = trimmedVar.indexOf(':', questionIndex);

        if (colonIndex !== -1) {
          const condition = trimmedVar.substring(0, questionIndex).trim();
          const truePart = trimmedVar.substring(questionIndex + 1, colonIndex).trim();
          const falsePart = trimmedVar.substring(colonIndex + 1).trim();

          const conditionValue = resolvePath(metadata, condition);
          const selectedPart = conditionValue ? truePart : falsePart;

          // Track field with logic
          fieldTracker.trackField(condition, {
            value: conditionValue,
            hasLogic: true,
            mixinUsed: 'conditional',
          });

          if (selectedPart) {
            // Try to evaluate as an expression first, then fall back to regular mixin processing
            let processedPart: string;
            if (
              selectedPart.includes('+') ||
              selectedPart.includes('*') ||
              selectedPart.includes('-') ||
              selectedPart.includes('/')
            ) {
              // Looks like an expression, try to evaluate it
              processedPart = evaluateExpression(selectedPart, metadata);
              // If evaluation didn't change anything, try mixin replacement
              if (processedPart === selectedPart) {
                processedPart = replaceMixins(selectedPart, depth + 1);
              }
            } else {
              // Regular mixin processing
              processedPart = replaceMixins(selectedPart, depth + 1);
            }

            if (options.enableFieldTrackingInMarkdown) {
              return `<span class="highlight"><span class="imported-value" data-field="${escapeHtmlAttribute(trimmedVar)}">${processedPart}</span></span>`;
            }
            return processedPart;
          }
        }
        if (options.enableFieldTrackingInMarkdown) {
          return `<span class="highlight"><span class="missing-value" data-field="${escapeHtmlAttribute(trimmedVar)}">[[${trimmedVar}]]</span></span>`;
        }
        return `{{${trimmedVar}}}`;
      }

      // Regular variable substitution
      const value = resolvePath(metadata, trimmedVar);

      if (value === undefined || value === null) {
        // Track empty field
        fieldTracker.trackField(trimmedVar, {
          value: undefined,
          hasLogic: false,
        });
        // Return wrapped missing value or original mixin
        if (options.enableFieldTrackingInMarkdown) {
          return `<span class="missing-value" data-field="${escapeHtmlAttribute(trimmedVar)}">[[${trimmedVar}]]</span>`;
        }
        return `{{${trimmedVar}}}`;
      }

      // Track filled field
      fieldTracker.trackField(trimmedVar, {
        value: value,
        hasLogic: false,
      });

      // Convert value to string
      const stringValue = String(value);

      // Check if the result contains more mixins (nested mixins)
      if (mixinPattern.test(stringValue)) {
        const nestedResult = replaceMixins(stringValue, depth + 1);
        if (options.enableFieldTrackingInMarkdown) {
          return `<span class="imported-value" data-field="${escapeHtmlAttribute(trimmedVar)}">${nestedResult}</span>`;
        }
        return nestedResult;
      }

      if (options.enableFieldTrackingInMarkdown) {
        return `<span class="imported-value" data-field="${escapeHtmlAttribute(trimmedVar)}">${stringValue}</span>`;
      }
      return stringValue;
    });
  }

  // First process template loops, then regular mixins
  const loopProcessedContent = processTemplateLoops(
    content,
    metadata,
    undefined,
    options.enableFieldTrackingInMarkdown || false
  );
  return replaceMixins(loopProcessedContent);
}
