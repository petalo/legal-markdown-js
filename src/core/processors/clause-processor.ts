/**
 * Processes optional clauses in a LegalMarkdown document
 * 
 * @param content - The document content
 * @param metadata - Document metadata with clause conditions
 * @returns Processed content with conditional clauses evaluated
 */
export function processOptionalClauses(
  content: string,
  metadata: Record<string, any>
): string {
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
 * @param condition - Condition expression
 * @param metadata - Document metadata
 * @returns True if condition evaluates to true, false otherwise
 */
function evaluateCondition(
  condition: string,
  metadata: Record<string, any>
): boolean {
  // Handle empty condition (always true)
  if (!condition.trim()) {
    return true;
  }
  
  // Simple variable reference (e.g., "include_clause")
  if (!condition.includes('=') && !condition.includes('!') && 
      !condition.includes('AND') && !condition.includes('OR')) {
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
 * @param obj - Object to extract value from
 * @param path - Dot-separated path to the value
 * @returns The value at the specified path
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