/**
 * @fileoverview Optional Clause Processing Module for Legal Markdown Documents
 *
 * This module provides functionality to process conditional clauses in Legal Markdown
 * documents, allowing for dynamic content inclusion based on metadata conditions.
 * It supports complex boolean logic with AND/OR operations, equality comparisons,
 * and nested value access for sophisticated document customization.
 *
 * Features:
 * - Conditional clause syntax: [content]{condition}
 * - Boolean logic with AND/OR operations
 * - Equality and inequality comparisons
 * - Nested metadata value access with dot notation
 * - Type-aware value comparison (strings, numbers, booleans)
 * - Graceful error handling for invalid conditions
 * - Support for quoted string values in conditions
 *
 * @example
 * ```typescript
 * import { processOptionalClauses } from './clause-processor';
 *
 * const content = `
 * This agreement [includes confidentiality clauses]{confidentiality}
 * [and has a termination period of {{termination_days}} days]{termination_days}
 * [with special provisions for European clients]{client.region = "EU"}.
 * `;
 *
 * const metadata = {
 *   confidentiality: true,
 *   termination_days: 30,
 *   client: { region: "EU" }
 * };
 *
 * const processed = processOptionalClauses(content, metadata);
 * console.log(processed);
 * // Output:
 * // This agreement includes confidentiality clauses
 * // and has a termination period of 30 days
 * // with special provisions for European clients.
 * ```
 */

/**
 * Processes optional clauses in a LegalMarkdown document
 *
 * Evaluates conditional clauses using the syntax [content]{condition} and includes
 * or excludes content based on metadata values. Supports complex boolean logic
 * and various comparison operators for sophisticated document customization.
 *
 * @param {string} content - The document content containing optional clauses
 * @param {Record<string, any>} metadata - Document metadata with clause conditions
 * @returns {string} Processed content with conditional clauses evaluated
 * @example
 * ```typescript
 * // Simple boolean condition
 * const content1 = '[This clause is included]{include_special}';
 * const metadata1 = { include_special: true };
 * const result1 = processOptionalClauses(content1, metadata1);
 * // Output: "This clause is included"
 *
 * // Complex condition with AND/OR logic
 * const content2 = '[Premium features available]{premium = true AND region != "restricted"}';
 * const metadata2 = { premium: true, region: "US" };
 * const result2 = processOptionalClauses(content2, metadata2);
 * // Output: "Premium features available"
 *
 * // Nested metadata access
 * const content3 = '[European compliance required]{client.location.country = "DE"}';
 * const metadata3 = { client: { location: { country: "DE" } } };
 * const result3 = processOptionalClauses(content3, metadata3);
 * // Output: "European compliance required"
 * ```
 */
export function processOptionalClauses(content: string, metadata: Record<string, any>): string {
  // Regular expression to match optional clauses
  // Format: [Optional text]{condition}
  const optionalClausePattern = /\[(.*?)\]\{(.*?)\}/gs;

  return content.replace(optionalClausePattern, (match, text, condition) => {
    // Evaluate the condition
    const shouldInclude = evaluateCondition(condition, metadata);

    // Include the text if condition is true, otherwise return empty string
    return shouldInclude ? text : '';
  });
}

/**
 * Evaluates a condition expression against metadata
 *
 * Parses and evaluates condition expressions that can include simple variable
 * references, equality/inequality comparisons, and boolean logic with AND/OR
 * operations. Supports nested metadata access using dot notation.
 *
 * @private
 * @param {string} condition - Condition expression to evaluate
 * @param {Record<string, any>} metadata - Document metadata to test against
 * @returns {boolean} True if condition evaluates to true, false otherwise
 * @example
 * ```typescript
 * const metadata = {
 *   active: true,
 *   user: { role: "admin", level: 5 },
 *   region: "US"
 * };
 *
 * console.log(evaluateCondition("active", metadata));                    // true
 * console.log(evaluateCondition("user.role = \"admin\"", metadata));      // true
 * console.log(evaluateCondition("user.level != 3", metadata));          // true
 * console.log(evaluateCondition("active AND region = \"US\"", metadata)); // true
 * console.log(evaluateCondition("active OR region = \"EU\"", metadata));  // true
 * ```
 */
function evaluateCondition(condition: string, metadata: Record<string, any>): boolean {
  // Handle empty condition (always true)
  if (!condition.trim()) {
    return true;
  }

  // Simple variable reference (e.g., "include_clause")
  if (
    !condition.includes('=') &&
    !condition.includes('!') &&
    !condition.includes('AND') &&
    !condition.includes('OR')
  ) {
    const value = getNestedValue(metadata, condition.trim());
    return Boolean(value);
  }

  // Complex conditions
  try {
    // Handle logical AND first (higher precedence in processing)
    if (condition.includes(' AND ')) {
      const subConditions = condition.split(' AND ').map(c => c.trim());
      return subConditions.every(cond => evaluateCondition(cond, metadata));
    }

    // Handle logical OR
    if (condition.includes(' OR ')) {
      const subConditions = condition.split(' OR ').map(c => c.trim());
      return subConditions.some(cond => evaluateCondition(cond, metadata));
    }

    // Handle equality/inequality (after logical operators)
    if (condition.includes('=')) {
      // Parse "key = value" or "key != value"
      const isNotEqual = condition.includes('!=');
      const parts = condition.split(isNotEqual ? '!=' : '=').map(p => p.trim());

      if (parts.length !== 2) {
        return false;
      }

      const [key, valueStr] = parts;
      const metadataValue = getNestedValue(metadata, key);

      // Parse the value string (handle quoted strings, booleans, numbers)
      let expectedValue: any = valueStr;

      if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
        expectedValue = valueStr.slice(1, -1);
      } else if (valueStr === 'true') {
        expectedValue = true;
      } else if (valueStr === 'false') {
        expectedValue = false;
      } else if (!isNaN(Number(valueStr))) {
        expectedValue = Number(valueStr);
      }

      return isNotEqual ? metadataValue !== expectedValue : metadataValue === expectedValue;
    }

    // Default to false for unknown condition formats
    return false;
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

/**
 * Gets a potentially nested value from an object
 *
 * Traverses an object using dot notation to access nested properties safely.
 * Returns undefined if any part of the path doesn't exist, preventing errors
 * when accessing deeply nested properties.
 *
 * @private
 * @param {Record<string, any>} obj - Object to extract value from
 * @param {string} path - Dot-separated path to the value (e.g., "user.profile.name")
 * @returns {any} The value at the specified path, or undefined if not found
 * @example
 * ```typescript
 * const obj = {
 *   user: {
 *     profile: {
 *       name: "John",
 *       settings: { theme: "dark" }
 *     },
 *     active: true
 *   }
 * };
 *
 * console.log(getNestedValue(obj, "user.profile.name"));           // "John"
 * console.log(getNestedValue(obj, "user.active"));                 // true
 * console.log(getNestedValue(obj, "user.profile.settings.theme")); // "dark"
 * console.log(getNestedValue(obj, "user.nonexistent"));            // undefined
 * console.log(getNestedValue(obj, "missing.path"));                // undefined
 * ```
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
