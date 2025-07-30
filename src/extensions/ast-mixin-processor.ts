/**
 * AST-based Mixin Processor for Legal Markdown Documents
 *
 * This module provides a completely rewritten mixin processing system that uses
 * Abstract Syntax Tree (AST) parsing to avoid text contamination issues present
 * in the original string-replacement approach.
 *
 * Key improvements:
 * - AST-based parsing prevents variable values from contaminating other text
 * - Isolated node processing ensures clean variable substitution
 * - Maintains full compatibility with existing field tracking and highlighting
 * - Supports all existing mixin types: variables, helpers, conditionals
 * - Detects [bracket values] in frontmatter as missing values automatically
 *
 * Architecture:
 * 1. Parse content into AST nodes (text, variable, helper, conditional)
 * 2. Process each mixin node independently with isolated context
 * 3. Reconstruct document with resolved values
 * 4. Integrate with field tracking for highlighting and validation
 *
 * @example
 * ```typescript
 * import { processMixins } from './ast-mixin-processor';
 *
 * const content = `
 * Client: {{client.name}}
 * Amount: {{formatCurrency(amount, "EUR")}}
 * {{premium ? "Premium service included" : ""}}
 * `;
 *
 * const metadata = {
 *   client: { name: "Acme Corp" },
 *   amount: 50000,
 *   premium: true
 * };
 *
 * const result = processMixins(content, metadata);
 * // No text contamination - each mixin processed independently
 * ```
 *
 * @module
 */

import { LegalMarkdownOptions } from '../types';
import { fieldTracker } from './tracking/field-tracker';
import { extensionHelpers as helpers } from './helpers/index';

/**
 * Represents a single node in the parsed AST
 */
export interface MixinNode {
  /** Type of the node content */
  type: 'text' | 'variable' | 'helper' | 'conditional';

  /** Original content from the document */
  content: string;

  /** Extracted variable/expression (without {{}} brackets) */
  variable?: string;

  /** Position in the original document */
  position: {
    start: number;
    end: number;
  };

  /** Resolved value after processing (set during resolution phase) */
  resolved?: any;

  /** Whether this node had processing errors */
  hasError?: boolean;

  /** Error message if processing failed */
  errorMessage?: string;
}

/**
 * Result of parsing content into AST
 */
export interface ParseResult {
  /** Array of parsed nodes in document order */
  nodes: MixinNode[];

  /** Whether any parsing errors occurred */
  hasErrors: boolean;

  /** Detailed error information */
  errors: Array<{
    node: MixinNode;
    message: string;
    position: { start: number; end: number };
  }>;
}

/**
 * Cache entry for parsed AST to improve performance
 */
interface ParseCache {
  content: string;
  hash: string;
  nodes: MixinNode[];
  timestamp: number;
}

// Simple LRU cache for parsed ASTs
const parseCache = new Map<string, ParseCache>();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generates a simple hash for content caching
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Interface for template loop ranges
 */
interface TemplateLoopRange {
  start: number;
  end: number;
  variable: string;
}

/**
 * Finds all template loop blocks in content and returns their ranges
 */
function findTemplateLoopRanges(content: string): TemplateLoopRange[] {
  const ranges: TemplateLoopRange[] = [];
  const loopPattern = /\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  let match;
  while ((match = loopPattern.exec(content)) !== null) {
    const [fullMatch, variable] = match;
    ranges.push({
      start: match.index,
      end: match.index + fullMatch.length,
      variable,
    });
  }

  return ranges;
}

/**
 * Checks if a position range is inside any template loop block
 */
function isInsideTemplateLoop(
  start: number,
  end: number,
  templateLoopRanges: TemplateLoopRange[]
): boolean {
  for (const range of templateLoopRanges) {
    if (start >= range.start && end <= range.end) {
      return true;
    }
  }
  return false;
}

/**
 * Cleans expired entries from parse cache
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of parseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      parseCache.delete(key);
    }
  }
}

/**
 * Classifies a mixin variable by its content to determine processing type
 *
 * @param variable - The variable content (without {{}} brackets)
 * @returns The classified type
 *
 * @example
 * ```typescript
 * classifyMixinType("client.name")                    // → "variable"
 * classifyMixinType("formatDate(@today, 'DD/MM')")   // → "helper"
 * classifyMixinType("premium ? 'Yes' : 'No'")        // → "conditional"
 * ```
 */
export function classifyMixinType(variable: string): 'variable' | 'helper' | 'conditional' {
  const trimmed = variable.trim();

  // Check for conditional (ternary) expressions
  if (trimmed.includes('?') && trimmed.includes(':')) {
    return 'conditional';
  }

  // Check for helper function calls (contains parentheses)
  if (trimmed.includes('(') && trimmed.includes(')')) {
    return 'helper';
  }

  // Default to simple variable
  return 'variable';
}

/**
 * Parses document content into an AST of mixin nodes
 *
 * This function identifies all mixin patterns in the content and creates
 * a structured representation that can be processed without text contamination.
 *
 * @param content - Document content to parse
 * @returns Parsed AST with nodes and any errors encountered
 *
 * @example
 * ```typescript
 * const content = "Hello {{name}}, amount: {{formatCurrency(total, 'EUR')}}";
 * const result = parseContentToAST(content);
 *
 * // result.nodes:
 * // [
 * //   { type: 'text', content: 'Hello ', position: { start: 0, end: 6 } },
 * //   { type: 'variable', content: '{{name}}', variable: 'name', position: { start: 6, end: 14 } },
 * //   { type: 'text', content: ', amount: ', position: { start: 14, end: 25 } },
 * //   { type: 'helper', content: '{{formatCurrency(total, \'EUR\')}}', variable: 'formatCurrency(total, \'EUR\')', position: { start: 25, end: 56 } }
 * // ]
 * ```
 */
export function parseContentToAST(content: string): ParseResult {
  // Check cache first
  const hash = generateHash(content);
  const cached = parseCache.get(hash);

  if (cached && cached.content === content) {
    return {
      nodes: [...cached.nodes], // Return copy to prevent mutation
      hasErrors: false,
      errors: [],
    };
  }

  // Clean cache periodically
  if (parseCache.size > MAX_CACHE_SIZE) {
    cleanCache();
  }

  const nodes: MixinNode[] = [];
  const errors: ParseResult['errors'] = [];

  // First, find all template loop blocks and mark their ranges to exclude
  const templateLoopRanges = findTemplateLoopRanges(content);

  // Regular expression to match {{variable}} patterns, but exclude template loops
  const mixinPattern = /\{\{([^}]+)\}\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mixinPattern.exec(content)) !== null) {
    const [fullMatch, variable] = match;
    const start = match.index;
    const end = start + fullMatch.length;

    // Skip mixins that are inside template loop blocks
    if (isInsideTemplateLoop(start, end, templateLoopRanges)) {
      continue;
    }

    // Add text node before this mixin (if any)
    if (start > lastIndex) {
      nodes.push({
        type: 'text',
        content: content.slice(lastIndex, start),
        position: { start: lastIndex, end: start },
      });
    }

    // Check for template loops and skip them (they're handled by template-loops processor)
    const trimmedVar = variable.trim();
    if (trimmedVar.startsWith('#') || trimmedVar.startsWith('/') || trimmedVar === '.') {
      // This is a template loop pattern, add as text node to preserve it
      nodes.push({
        type: 'text',
        content: fullMatch,
        position: { start, end },
      });
    } else if (!variable || variable.trim() === '') {
      // Check for malformed mixin (unclosed)
      const errorNode: MixinNode = {
        type: 'variable',
        content: fullMatch,
        variable: variable,
        position: { start, end },
        hasError: true,
        errorMessage: 'Empty or malformed mixin',
      };

      nodes.push(errorNode);
      errors.push({
        node: errorNode,
        message: 'Empty or malformed mixin',
        position: { start, end },
      });
    } else {
      // Classify and create appropriate node
      const type = classifyMixinType(variable);

      nodes.push({
        type,
        content: fullMatch,
        variable: variable.trim(),
        position: { start, end },
      });
    }

    lastIndex = end;
  }

  // Add remaining text after last mixin
  if (lastIndex < content.length) {
    nodes.push({
      type: 'text',
      content: content.slice(lastIndex),
      position: { start: lastIndex, end: content.length },
    });
  }

  // Cache the result
  parseCache.set(hash, {
    content,
    hash,
    nodes: [...nodes], // Store copy
    timestamp: Date.now(),
  });

  return {
    nodes,
    hasErrors: errors.length > 0,
    errors,
  };
}

/**
 * Escapes HTML attribute values to prevent breaking HTML structure
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
 * Detects values in frontmatter that are wrapped in [brackets] and should be treated as missing values
 *
 * @param metadata - The frontmatter metadata object
 * @returns Set of field paths that contain bracket values
 *
 * @example
 * ```typescript
 * const metadata = {
 *   client: { name: "[CLIENT NAME]" },
 *   amount: 50000,
 *   description: "[PROJECT DESCRIPTION]"
 * };
 *
 * const bracketFields = detectBracketValues(metadata);
 * // Returns: Set(["client.name", "description"])
 * ```
 */
export function detectBracketValues(metadata: Record<string, any>, prefix = ''): Set<string> {
  const bracketFields = new Set<string>();

  function traverse(obj: any, currentPath: string): void {
    if (typeof obj === 'string') {
      // Check if the string value is wrapped in brackets
      if (obj.match(/^\[.*\]$/)) {
        bracketFields.add(currentPath);
      }
    } else if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      // Recursively traverse object properties
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        traverse(value, newPath);
      }
    } else if (Array.isArray(obj)) {
      // Handle arrays
      obj.forEach((item, index) => {
        const newPath = `${currentPath}[${index}]`;
        traverse(item, newPath);
      });
    }
  }

  traverse(metadata, prefix);
  return bracketFields;
}

/**
 * Resolves a dot-notation path in an object, with support for array indices
 *
 * @param obj - The object to traverse
 * @param path - Dot-notation path with optional array indices
 * @returns The resolved value or undefined if not found
 *
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
    // Handle array indices like parties[0].name
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      const [, key, index] = match;
      return current?.[key]?.[parseInt(index, 10)];
    }
    return current?.[part];
  }, obj);
}

/**
 * Parses comma-separated arguments from a helper function call
 *
 * @param argsString - The arguments string to parse
 * @param metadata - Metadata context for variable resolution
 * @returns Array of parsed arguments
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
    // eslint-disable-next-line quotes
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
 * @param arg - The argument string to parse
 * @param metadata - Metadata context for variable resolution
 * @returns The parsed argument value
 */
function parseArgument(arg: string, metadata: Record<string, any>): any {
  // Handle quoted strings
  // eslint-disable-next-line quotes
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
    return new Date();
  }

  // Handle nested helper function calls
  if (arg.includes('(') && arg.includes(')')) {
    const result = resolveHelper(arg, metadata);
    if (result !== undefined) {
      return result;
    }
  }

  // Handle variable references
  return resolvePath(metadata, arg);
}

/**
 * Resolves a simple variable reference
 *
 * @param variable - Variable path to resolve
 * @param metadata - Metadata context
 * @returns Resolved value or undefined
 */
function resolveVariable(variable: string, metadata: Record<string, any>): any {
  return resolvePath(metadata, variable);
}

/**
 * Resolves a helper function expression
 *
 * @param expression - Helper function expression (e.g., "formatDate(@today, 'long')")
 * @param metadata - Metadata context for argument resolution
 * @returns The result of the helper function call, or undefined if invalid
 */
function resolveHelper(expression: string, metadata: Record<string, any>): any {
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
 * Resolves a conditional expression (ternary operator)
 *
 * @param expression - Conditional expression (e.g., "premium ? 'Yes' : 'No'")
 * @param metadata - Metadata context for condition evaluation
 * @returns The result of the conditional expression
 */
function resolveConditional(expression: string, metadata: Record<string, any>): any {
  try {
    const questionIndex = expression.indexOf('?');
    const colonIndex = expression.indexOf(':', questionIndex);

    if (questionIndex === -1 || colonIndex === -1) {
      return undefined;
    }

    const condition = expression.substring(0, questionIndex).trim();
    const truePart = expression.substring(questionIndex + 1, colonIndex).trim();
    const falsePart = expression.substring(colonIndex + 1).trim();

    const conditionValue = resolvePath(metadata, condition);
    const selectedPart = conditionValue ? truePart : falsePart;

    // Parse the selected part as an argument (could be string, variable, etc.)
    return parseArgument(selectedPart, metadata);
  } catch (error) {
    console.warn(`Error evaluating conditional expression: ${expression}`, error);
    return undefined;
  }
}

/**
 * Processes parsed AST nodes and resolves all mixin values
 *
 * This is the core processing function that takes parsed nodes and resolves
 * each mixin independently, preventing text contamination.
 *
 * @param nodes - Parsed AST nodes to process
 * @param metadata - Document metadata for variable resolution
 * @param options - Processing options
 * @returns Processed document content with resolved mixins
 */
export function processMixinAST(
  nodes: MixinNode[],
  metadata: Record<string, any>,
  options: LegalMarkdownOptions = {}
): string {
  if (options.noMixins) {
    // If mixins are disabled, just return the original content
    return nodes.map(node => node.content).join('');
  }

  // Detect bracket values in metadata for automatic missing value tracking
  const bracketFields = detectBracketValues(metadata);

  // Process each node independently
  const processedNodes = nodes.map(node => {
    if (node.type === 'text') {
      // Text nodes are returned as-is
      return node.content;
    }

    if (node.hasError || !node.variable) {
      // Handle malformed mixins
      if (options.enableFieldTrackingInMarkdown) {
        // eslint-disable-next-line max-len
        return `<span class="highlight"><span class="missing-value" data-field="${escapeHtmlAttribute(node.content)}">{{${node.variable || 'malformed'}}}</span></span>`;
      }
      return node.content; // Return original malformed content
    }

    let resolvedValue: any;
    let hasLogic = false;
    let mixinType = 'variable';

    // Resolve based on node type
    switch (node.type) {
      case 'variable':
        resolvedValue = resolveVariable(node.variable, metadata);
        mixinType = 'variable';
        break;

      case 'helper':
        resolvedValue = resolveHelper(node.variable, metadata);
        hasLogic = true;
        mixinType = 'helper';
        break;

      case 'conditional':
        resolvedValue = resolveConditional(node.variable, metadata);
        hasLogic = true;
        mixinType = 'conditional';
        break;

      default:
        resolvedValue = undefined;
    }

    // Check if this field is marked as a bracket value (missing)
    const isBracketValue = bracketFields.has(node.variable);
    const isValueMissing = resolvedValue === undefined || resolvedValue === null || isBracketValue;

    // Track field for highlighting/validation
    fieldTracker.trackField(node.variable, {
      value: isValueMissing ? undefined : resolvedValue,
      hasLogic,
      mixinUsed: mixinType as any,
    });

    if (isValueMissing) {
      // Handle missing values
      if (options.enableFieldTrackingInMarkdown) {
        // eslint-disable-next-line max-len
        return `<span class="missing-value" data-field="${escapeHtmlAttribute(node.variable)}">{{${node.variable}}}</span>`;
      }
      return node.content; // Return original mixin syntax
    }

    // Handle successful resolution
    const stringValue = String(resolvedValue);

    if (options.enableFieldTrackingInMarkdown) {
      if (hasLogic) {
        // eslint-disable-next-line max-len
        return `<span class="highlight" data-field="${escapeHtmlAttribute(node.variable)}">${stringValue}</span>`;
      } else {
        // eslint-disable-next-line max-len
        return `<span class="imported-value" data-field="${escapeHtmlAttribute(node.variable)}">${stringValue}</span>`;
      }
    }

    return stringValue;
  });

  return processedNodes.join('');
}

/**
 * Main entry point for mixin processing with AST-based approach
 *
 * This function provides complete API compatibility with the original processMixins
 * while using the new AST-based processing to prevent text contamination.
 *
 * @param content - The document content containing mixin references
 * @param metadata - Document metadata with variable values
 * @param options - Processing options
 * @returns Processed content with mixins resolved
 *
 * @example
 * ```typescript
 * // API identical to original processMixins
 * const content = `
 * Client: {{client.name}}
 * Amount: {{formatCurrency(amount, "EUR")}}
 * {{premium ? "Premium service" : "Standard service"}}
 * `;
 *
 * const metadata = {
 *   client: { name: "Acme Corp" },
 *   amount: 50000,
 *   premium: true
 * };
 *
 * const result = processMixins(content, metadata, { enableFieldTrackingInMarkdown: true });
 * // Clean output without text contamination
 * ```
 */
export function processMixins(
  content: string,
  metadata: Record<string, any>,
  options: LegalMarkdownOptions = {}
): string {
  try {
    // Parse content into AST
    const parseResult = parseContentToAST(content);

    // Log any parsing errors for debugging
    if (parseResult.hasErrors) {
      console.warn('Mixin parsing errors detected:', parseResult.errors);
    }

    // Process the AST and return resolved content
    return processMixinAST(parseResult.nodes, metadata, options);
  } catch (error) {
    console.error(
      'Critical error in AST mixin processing, falling back to original content:',
      error
    );

    // Fallback: return original content if AST processing fails completely
    return content;
  }
}
