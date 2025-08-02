/**
 * Remark Plugin for Optional Clause Processing
 *
 * This plugin processes optional clauses in legal documents using conditional
 * syntax. It evaluates conditions based on metadata values and includes or
 * excludes content blocks accordingly.
 *
 * Features:
 * - Conditional content inclusion/exclusion
 * - Complex boolean expressions
 * - Nested conditional blocks
 * - Multiple condition operators
 * - Variable-based conditions
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkStringify from 'remark-stringify';
 * import { remarkClauses } from './clauses';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkClauses, {
 *     metadata: { jurisdiction: 'US', hasWarranty: true }
 *   })
 *   .use(remarkStringify);
 * ```
 *
 * @module
 */

import { Plugin } from 'unified';
import { Root, Paragraph, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { fieldTracker } from '../../extensions/tracking/field-tracker';

/**
 * Options for the remark clauses plugin
 * @interface RemarkClausesOptions
 */
export interface RemarkClausesOptions {
  /** Document metadata for condition evaluation */
  metadata: Record<string, any>;

  /** Enable debug logging */
  debug?: boolean;
  
  /** Enable field tracking (to coordinate with template fields plugin) */
  enableFieldTracking?: boolean;
}

/**
 * Conditional block information
 */
interface ConditionalBlock {
  /** The condition expression */
  condition: string;

  /** Content to include if condition is true */
  content: string;

  /** Alternative content if condition is false */
  elseContent?: string;

  /** Start and end positions in the text */
  start: number;
  end: number;
}

/**
 * Remark plugin for processing optional clauses
 *
 * This plugin identifies and processes conditional blocks in markdown text,
 * evaluating conditions against document metadata and including or excluding
 * content based on the results.
 *
 * @param options - Configuration options for clause processing
 * @returns Remark plugin transformer function
 */
export const remarkClauses: Plugin<[RemarkClausesOptions], Root> = options => {
  const { metadata = {}, debug = false, enableFieldTracking = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('[remarkClauses] Processing clauses with metadata:', Object.keys(metadata));
    }

    // Process all text nodes that might contain conditional blocks
    visit(tree, node => {
      if (node.type === 'text') {
        processTextNode(node as Text, metadata, debug, enableFieldTracking);
      } else if (node.type === 'html' && 'value' in node) {
        // Also process HTML nodes that might contain conditional blocks
        processHtmlNode(node as any, metadata, debug, enableFieldTracking);
      } else if (node.type === 'paragraph') {
        processParagraphNode(node as Paragraph, metadata, debug, enableFieldTracking);
      }
    });
  };
};

/**
 * Process a text node for conditional blocks
 */
function processTextNode(node: Text, metadata: Record<string, any>, debug: boolean, enableFieldTracking: boolean) {
  const originalText = node.value;
  const conditionalBlocks = extractConditionalBlocks(originalText);

  if (debug && originalText.includes('{{#')) {
    console.log(`[remarkClauses] DEBUG - Text node content: "${originalText}"`);
    console.log(`[remarkClauses] DEBUG - Found ${conditionalBlocks.length} conditional blocks`);
  }

  if (conditionalBlocks.length === 0) {
    return;
  }

  if (debug) {
    console.log(
      `[remarkClauses] Found ${conditionalBlocks.length} conditional blocks in text node`
    );
  }

  // Process blocks in reverse order to maintain correct positions
  let processedText = originalText;
  for (let i = conditionalBlocks.length - 1; i >= 0; i--) {
    const block = conditionalBlocks[i];
    const result = evaluateConditionalBlock(block, metadata, debug, enableFieldTracking);

    // Replace the conditional block with the result
    processedText =
      processedText.substring(0, block.start) + result + processedText.substring(block.end);
  }

  node.value = processedText;
  
  // If we processed any loops/conditionals and field tracking is enabled,
  // we need to mark this as HTML to prevent escaping
  if (conditionalBlocks.length > 0 && processedText.includes('<span class="legal-field')) {
    (node as any).type = 'html';
  }
}

/**
 * Process an HTML node for conditional blocks
 */
function processHtmlNode(node: any, metadata: Record<string, any>, debug: boolean, enableFieldTracking: boolean) {
  const originalHtml = node.value;
  const conditionalBlocks = extractConditionalBlocks(originalHtml);

  if (conditionalBlocks.length === 0) {
    return;
  }

  if (debug) {
    console.log(
      `[remarkClauses] Found ${conditionalBlocks.length} conditional blocks in HTML node`
    );
  }

  // Process blocks in reverse order to maintain correct positions
  let processedHtml = originalHtml;
  for (let i = conditionalBlocks.length - 1; i >= 0; i--) {
    const block = conditionalBlocks[i];
    const result = evaluateConditionalBlock(block, metadata, debug, enableFieldTracking);

    // Replace the conditional block with the result
    processedHtml =
      processedHtml.substring(0, block.start) + result + processedHtml.substring(block.end);
  }

  node.value = processedHtml;
}

/**
 * Process a paragraph node for conditional blocks
 */
function processParagraphNode(node: Paragraph, metadata: Record<string, any>, debug: boolean, enableFieldTracking: boolean) {
  // Process each text child in the paragraph
  node.children.forEach(child => {
    if (child.type === 'text') {
      processTextNode(child as Text, metadata, debug, enableFieldTracking);
    }
  });
}

/**
 * Extract conditional blocks from text
 */
function extractConditionalBlocks(text: string): ConditionalBlock[] {
  const blocks: ConditionalBlock[] = [];

  // Regex to match conditional blocks: {{#if condition}}content{{/if}}
  // Also supports {{#if condition}}content{{else}}alternative{{/if}}
  // Note: Captures "if condition" as the full condition including the "if" keyword
  // Allows empty conditions for error handling: {{#if}}
  const conditionalRegex =
    /\{\{#(if(?:\s+[^}]*)?)\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*?)(?:\{\{else\}\}((?:(?!\{\{\/if\}\}).)*?))?\{\{\/if\}\}/gs;

  let match;
  while ((match = conditionalRegex.exec(text)) !== null) {
    const [fullMatch, condition, content, elseContent] = match;

    blocks.push({
      condition: condition.trim(),
      content: content || '',
      elseContent: elseContent || undefined,
      start: match.index,
      end: match.index + fullMatch.length,
    });
  }

  // Also support simpler syntax: {{#variable}}content{{/variable}}
  // This handles both loops and simple conditionals (including underscores in names)
  const simpleConditionalRegex = /\{\{#([\w._]+)\}\}((?:(?!\{\{\/\1\}\}).)*?)\{\{\/\1\}\}/gs;
  
  while ((match = simpleConditionalRegex.exec(text)) !== null) {
    const [fullMatch, variable, content] = match;

    blocks.push({
      condition: variable.trim(),
      content: content || '',
      elseContent: undefined,
      start: match.index,
      end: match.index + fullMatch.length,
    });
  }

  // Also support bracket syntax: [content]{condition}
  const bracketConditionalRegex = /\[([^[\]]*(?:\[[^\]]*\][^[\]]*)*?)\]\{([^{}]*?)\}/g;
  
  while ((match = bracketConditionalRegex.exec(text)) !== null) {
    const [fullMatch, content, condition] = match;

    blocks.push({
      condition: condition.trim(),
      content: content || '',
      elseContent: undefined,
      start: match.index,
      end: match.index + fullMatch.length,
    });
  }

  // Also support original Legal Markdown bracket syntax: [{{condition}}content]
  // Need to handle nested brackets in content by using a more sophisticated pattern
  const originalBracketRegex = /\[\{\{([^{}]*?)\}\}([^[\]]*(?:\[[^\]]*\][^[\]]*)*?)\]/g;
  
  while ((match = originalBracketRegex.exec(text)) !== null) {
    const [fullMatch, condition, content] = match;

    // Skip empty conditions in original bracket syntax
    if (!condition.trim()) {
      continue;
    }

    blocks.push({
      condition: condition.trim(),
      content: content || '',
      elseContent: undefined,
      start: match.index,
      end: match.index + fullMatch.length,
    });
  }

  // Sort blocks by start position to process them in order
  return blocks.sort((a, b) => a.start - b.start);
}

/**
 * Evaluate a conditional block against metadata
 */
function evaluateConditionalBlock(
  block: ConditionalBlock,
  metadata: Record<string, any>,
  debug: boolean,
  enableFieldTracking: boolean
): string {
  const { condition, content, elseContent } = block;

  try {
    // Handle {{#if condition}} syntax - always process as conditional
    if (condition.startsWith('if ') || condition === 'if') {
      const actualCondition = condition === 'if' ? '' : condition.substring(3).trim(); // Remove 'if ' or handle empty 'if'
      const result = evaluateCondition(actualCondition, metadata);
      
      if (debug) {
        console.log(`[remarkClauses] Conditional "if ${actualCondition}" evaluated to:`, result);
      }
      
      if (result) {
        return content;
      } else if (elseContent !== undefined) {
        return elseContent;
      } else {
        return '';
      }
    }
    
    // For simple {{#variable}} syntax, check if it's an array that should be processed as a loop
    const value = getNestedValue(metadata, condition);
    
    if (Array.isArray(value)) {
      if (debug) {
        console.log(`[remarkClauses] Array condition "${condition}" with ${value.length} items - processing as loop`);
      }
      // Process as array loop
      return processArrayLoop(condition, content, value, metadata, debug, enableFieldTracking);
    }
    
    // Otherwise evaluate as a simple boolean condition
    const result = evaluateCondition(condition, metadata);

    if (debug) {
      console.log(`[remarkClauses] Condition "${condition}" evaluated to:`, result);
    }

    if (result) {
      return content;
    } else if (elseContent !== undefined) {
      return elseContent;
    } else {
      return '';
    }
  } catch (error) {
    if (debug) {
      console.warn(`[remarkClauses] Error evaluating condition "${condition}":`, error);
    }
    // On error, include the content by default (safe behavior)
    return content;
  }
}

/**
 * Evaluate a condition expression against metadata
 */
function evaluateCondition(condition: string, metadata: Record<string, any>): boolean {
  // Check for empty condition first - this should be treated as an error
  if (!condition.trim()) {
    throw new Error('Empty condition provided');
  }

  // Sanitize the condition to prevent code injection
  const sanitizedCondition = sanitizeCondition(condition);

  if (!sanitizedCondition) {
    return false;
  }

  // Simple condition evaluation
  return evaluateSimpleCondition(sanitizedCondition, metadata);
}

/**
 * Sanitize condition to prevent code injection
 */
function sanitizeCondition(condition: string): string | null {
  // Check for HTML tags (dangerous)
  if (/<[^>]*>/.test(condition)) {
    console.warn('[remarkClauses] Unsafe condition detected, skipping:', condition);
    return null;
  }

  // Check for script-related keywords
  const dangerousKeywords = ['script', 'eval', 'function', 'constructor', 'prototype'];
  const lowerCondition = condition.toLowerCase();
  for (const keyword of dangerousKeywords) {
    if (lowerCondition.includes(keyword)) {
      console.warn('[remarkClauses] Unsafe condition detected, skipping:', condition);
      return null;
    }
  }

  // Allow only safe characters: letters, numbers, underscores, dots, spaces, comparison operators, boolean operators, and @ for context variables
  const safePattern = /^[a-zA-Z0-9_.\s==!=<>!&|()'"@]+$/;

  if (!safePattern.test(condition)) {
    console.warn('[remarkClauses] Unsafe condition detected, skipping:', condition);
    return null;
  }

  return condition;
}

/**
 * Evaluate simple condition expressions
 */
function evaluateSimpleCondition(condition: string, metadata: Record<string, any>): boolean {
  // Handle boolean operators
  if (condition.includes('&&') || condition.includes('||')) {
    return evaluateBooleanExpression(condition, metadata);
  }

  // Handle comparison operators
  if (
    condition.includes('==') ||
    condition.includes('!=') ||
    condition.includes('>') ||
    condition.includes('<')
  ) {
    return evaluateComparisonExpression(condition, metadata);
  }

  // Handle simple variable existence check
  if (condition.includes('.')) {
    return evaluateNestedVariable(condition, metadata);
  }

  // Simple variable check
  const value = metadata[condition.trim()];
  return isTruthy(value);
}

/**
 * Evaluate boolean expressions (&&, ||)
 */
function evaluateBooleanExpression(condition: string, metadata: Record<string, any>): boolean {
  // Split by OR operators first (lower precedence)
  const orParts = condition.split('||');

  for (const orPart of orParts) {
    // Split by AND operators (higher precedence)
    const andParts = orPart.split('&&');
    let allAndTrue = true;

    for (const andPart of andParts) {
      if (!evaluateSimpleCondition(andPart.trim(), metadata)) {
        allAndTrue = false;
        break;
      }
    }

    if (allAndTrue) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluate comparison expressions (==, !=, >, <)
 */
function evaluateComparisonExpression(condition: string, metadata: Record<string, any>): boolean {
  // Find the comparison operator
  let operator = '';
  let leftSide = '';
  let rightSide = '';

  if (condition.includes('==')) {
    [leftSide, rightSide] = condition.split('==');
    operator = '==';
  } else if (condition.includes('!=')) {
    [leftSide, rightSide] = condition.split('!=');
    operator = '!=';
  } else if (condition.includes('>=')) {
    [leftSide, rightSide] = condition.split('>=');
    operator = '>=';
  } else if (condition.includes('<=')) {
    [leftSide, rightSide] = condition.split('<=');
    operator = '<=';
  } else if (condition.includes('>')) {
    [leftSide, rightSide] = condition.split('>');
    operator = '>';
  } else if (condition.includes('<')) {
    [leftSide, rightSide] = condition.split('<');
    operator = '<';
  }

  if (!operator || !leftSide || !rightSide) {
    return false;
  }

  // Get values
  const leftValue = getVariableValue(leftSide.trim(), metadata);
  const rightValue = parseValue(rightSide.trim(), metadata);

  // Perform comparison
  switch (operator) {
    case '==':
      return leftValue == rightValue;
    case '!=':
      return leftValue != rightValue;
    case '>':
      return Number(leftValue) > Number(rightValue);
    case '<':
      return Number(leftValue) < Number(rightValue);
    case '>=':
      return Number(leftValue) >= Number(rightValue);
    case '<=':
      return Number(leftValue) <= Number(rightValue);
    default:
      return false;
  }
}

/**
 * Evaluate nested variable access (e.g., client.name)
 */
function evaluateNestedVariable(condition: string, metadata: Record<string, any>): boolean {
  const value = getNestedValue(metadata, condition.trim());
  return isTruthy(value);
}

/**
 * Get variable value from metadata
 */
function getVariableValue(variable: string, metadata: Record<string, any>): any {
  if (variable.includes('.')) {
    return getNestedValue(metadata, variable);
  }
  return metadata[variable];
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Parse a value (could be a variable reference or a literal)
 */
function parseValue(value: string, metadata: Record<string, any>): any {
  // Remove quotes if it's a string literal
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Check if it's a number
  if (/^\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Check if it's a boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Otherwise, treat it as a variable reference
  return getVariableValue(value, metadata);
}

/**
 * Check if a value is truthy in the context of conditional evaluation
 */
function isTruthy(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * Process an array loop, iterating over each item
 */
function processArrayLoop(
  variable: string,
  content: string,
  items: any[],
  metadata: Record<string, any>,
  debug: boolean,
  enableFieldTracking: boolean
): string {
  const results: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Create enhanced metadata with current item properties
    const enhancedMetadata = { ...metadata };
    
    // Add item properties if it's an object
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(enhancedMetadata, item);
    }
    
    // Add special variables
    enhancedMetadata['@index'] = i;
    enhancedMetadata['@first'] = i === 0;
    enhancedMetadata['@last'] = i === items.length - 1;
    enhancedMetadata['@total'] = items.length;
    
    // Process the content with enhanced metadata
    let processedContent = content;
    
    // First, process any nested conditional blocks (including nested loops)
    const nestedBlocks = extractConditionalBlocks(processedContent);
    if (nestedBlocks.length > 0) {
      // Process blocks in reverse order to maintain correct positions
      for (let j = nestedBlocks.length - 1; j >= 0; j--) {
        const nestedBlock = nestedBlocks[j];
        const nestedResult = evaluateConditionalBlock(nestedBlock, enhancedMetadata, debug, enableFieldTracking);
        
        // Replace the nested block with the result
        processedContent =
          processedContent.substring(0, nestedBlock.start) + 
          nestedResult + 
          processedContent.substring(nestedBlock.end);
      }
    }
    
    // Then replace field references {{fieldname}}
    processedContent = processedContent.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      const trimmedField = field.trim();
      
      // Skip loop/conditional markers
      if (trimmedField.startsWith('#') || trimmedField.startsWith('/') || trimmedField === 'else') {
        return match;
      }
      
      const value = getNestedValue(enhancedMetadata, trimmedField);
      
      if (debug) {
        console.log(`[remarkClauses] Loop field "${trimmedField}" resolved to:`, value);
      }
      
      // Apply field tracking if enabled
      if (enableFieldTracking) {
        const isEmptyValue = value === undefined || value === null || value === '' || 
                           (typeof value === 'string' && value.trim() === '');
        const cssClass = isEmptyValue ? 'legal-field missing-value' : 'legal-field imported-value';
        const formattedValue = value !== undefined ? String(value) : match;
        
        // Track the field
        fieldTracker.trackField(trimmedField, {
          value: value,
          originalValue: match,
          hasLogic: false,
          mixinUsed: 'loop',
        });
        
        return `<span class="${cssClass}" data-field="${trimmedField.replace(/"/g, '&quot;')}">${formattedValue}</span>`;
      }
      
      return value !== undefined ? String(value) : match;
    });
    
    results.push(processedContent);
  }
  
  return results.join('');
}

export default remarkClauses;
