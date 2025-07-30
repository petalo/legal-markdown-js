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

/**
 * Options for the remark clauses plugin
 * @interface RemarkClausesOptions
 */
export interface RemarkClausesOptions {
  /** Document metadata for condition evaluation */
  metadata: Record<string, any>;

  /** Enable debug logging */
  debug?: boolean;
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
  const { metadata = {}, debug = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('[remarkClauses] Processing clauses with metadata:', Object.keys(metadata));
    }

    // Process all text nodes that might contain conditional blocks
    visit(tree, node => {
      if (node.type === 'text') {
        processTextNode(node as Text, metadata, debug);
      } else if (node.type === 'paragraph') {
        processParagraphNode(node as Paragraph, metadata, debug);
      }
    });
  };
};

/**
 * Process a text node for conditional blocks
 */
function processTextNode(node: Text, metadata: Record<string, any>, debug: boolean) {
  const originalText = node.value;
  const conditionalBlocks = extractConditionalBlocks(originalText);

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
    const result = evaluateConditionalBlock(block, metadata, debug);

    // Replace the conditional block with the result
    processedText =
      processedText.substring(0, block.start) + result + processedText.substring(block.end);
  }

  node.value = processedText;
}

/**
 * Process a paragraph node for conditional blocks
 */
function processParagraphNode(node: Paragraph, metadata: Record<string, any>, debug: boolean) {
  // Process each text child in the paragraph
  node.children.forEach(child => {
    if (child.type === 'text') {
      processTextNode(child as Text, metadata, debug);
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
  const conditionalRegex =
    /\{\{#if\s+([^}]+)\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*?)(?:\{\{else\}\}((?:(?!\{\{\/if\}\}).)*?))?\{\{\/if\}\}/gs;

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

  return blocks;
}

/**
 * Evaluate a conditional block against metadata
 */
function evaluateConditionalBlock(
  block: ConditionalBlock,
  metadata: Record<string, any>,
  debug: boolean
): string {
  const { condition, content, elseContent } = block;

  try {
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

  // Allow only safe characters: letters, numbers, dots, spaces, comparison operators, and boolean operators
  const safePattern = /^[a-zA-Z0-9._\s==!=<>!&|()'"]+$/;

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

export default remarkClauses;
