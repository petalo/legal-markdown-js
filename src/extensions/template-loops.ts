/**
 * Template Loop Processing Extension for Legal Markdown
 *
 * This extension adds support for template loops and conditional blocks using
 * the {{#variable}}...{{/variable}} syntax. It enables iteration over arrays
 * and conditional rendering of template sections.
 *
 * Features:
 * - Array iteration: {{#items}}...{{/items}}
 * - Conditional blocks: {{#loyaltyMember}}...{{/loyaltyMember}}
 * - Nested loops support
 * - Context management for loop variables
 * - Integration with field tracking
 *
 * @example
 * ```typescript
 * import { processTemplateLoops } from './template-loops';
 *
 * const content = `
 * {{#items}}
 * - {{name}} {{onSale ? "(ON SALE!)" : ""}} - ${{price}}
 * {{/items}}
 * `;
 *
 * const metadata = {
 *   items: [
 *     { name: "Product A", price: 10.99, onSale: true },
 *     { name: "Product B", price: 15.50, onSale: false }
 *   ]
 * };
 *
 * const result = processTemplateLoops(content, metadata);
 * ```
 */

import { fieldTracker } from './tracking/field-tracker';
import { extensionHelpers as helpers } from './helpers';

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
 * Interface for loop context during template processing
 */
export interface LoopContext {
  /** Current loop variable name */
  variable: string;
  /** Current item being processed */
  item: any;
  /** Current index in the array */
  index: number;
  /** Total number of items */
  total: number;
  /** Parent context for nested loops */
  parent?: LoopContext;
}

/**
 * Result of parsing a template loop block
 */
interface LoopBlock {
  /** The loop variable name (e.g., 'items') */
  variable: string;
  /** The content inside the loop */
  content: string;
  /** Starting position of the loop block */
  start: number;
  /** Ending position of the loop block */
  end: number;
  /** Full match including opening and closing tags */
  fullMatch: string;
}

/**
 * Processes template loops and conditional blocks in content
 *
 * @param content - The template content containing loop patterns
 * @param metadata - The metadata object containing loop data
 * @param context - Current loop context for nested loops
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Processed content with loops expanded
 */
export function processTemplateLoops(
  content: string,
  metadata: Record<string, any>,
  context?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  // Template loops now run before AST processor, so no need to skip based on spans

  // Find all loop blocks in the content
  const loopBlocks = findLoopBlocks(content);

  if (loopBlocks.length === 0) {
    return content;
  }

  // Process loop blocks from last to first to avoid position shifting
  let processedContent = content;

  for (let i = loopBlocks.length - 1; i >= 0; i--) {
    const loopBlock = loopBlocks[i];
    const expandedContent = expandLoopBlock(loopBlock, metadata, context, enableFieldTracking);

    // Replace the loop block with expanded content
    processedContent =
      processedContent.slice(0, loopBlock.start) +
      expandedContent +
      processedContent.slice(loopBlock.end);
  }

  return processedContent;
}

/**
 * Finds all loop blocks in the content using regex pattern matching
 *
 * @param content - The content to search for loop blocks
 * @returns Array of parsed loop blocks
 */
function findLoopBlocks(content: string): LoopBlock[] {
  const loopBlocks: LoopBlock[] = [];
  const loopPattern = /\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  let match;
  while ((match = loopPattern.exec(content)) !== null) {
    const [fullMatch, variable, loopContent] = match;

    loopBlocks.push({
      variable,
      content: loopContent,
      start: match.index,
      end: match.index + fullMatch.length,
      fullMatch,
    });
  }

  return loopBlocks;
}

/**
 * Expands a single loop block into its final content
 *
 * @param loopBlock - The loop block to expand
 * @param metadata - The metadata object containing loop data
 * @param parentContext - Parent loop context for nested loops
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Expanded content string
 */
function expandLoopBlock(
  loopBlock: LoopBlock,
  metadata: Record<string, any>,
  parentContext?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  const { variable, content } = loopBlock;

  // Resolve the loop variable value from metadata or parent context
  const loopValue = resolveLoopVariable(variable, metadata, parentContext);

  // Track field usage
  fieldTracker.trackField(variable, {
    value: loopValue,
    hasLogic: true,
    mixinUsed: 'loop',
  });

  // Handle different types of loop values
  if (Array.isArray(loopValue)) {
    return expandArrayLoop(
      variable,
      content,
      loopValue,
      metadata,
      parentContext,
      enableFieldTracking
    );
  } else if (loopValue) {
    // Conditional block - render if truthy
    return expandConditionalBlock(
      variable,
      content,
      loopValue,
      metadata,
      parentContext,
      enableFieldTracking
    );
  } else {
    // Falsy value - don't render
    return '';
  }
}

/**
 * Expands an array loop, iterating over each item
 *
 * @param variable - The loop variable name
 * @param content - The loop content template
 * @param items - The array to iterate over
 * @param metadata - The metadata object
 * @param parentContext - Parent loop context
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Expanded content for all array items
 */
function expandArrayLoop(
  variable: string,
  content: string,
  items: any[],
  metadata: Record<string, any>,
  parentContext?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  const expandedParts: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Create loop context for this iteration
    const loopContext: LoopContext = {
      variable,
      item,
      index: i,
      total: items.length,
      parent: parentContext,
    };

    // Create enhanced metadata with current item properties
    const enhancedMetadata = createEnhancedMetadata(metadata, item, loopContext);

    // Process the content with the enhanced metadata
    let processedContent = content;

    // First, process any nested loops
    if (process.env.NODE_ENV === 'development') {
      console.log(`Before nested loops processing: "${processedContent}"`);
    }
    processedContent = processTemplateLoops(
      processedContent,
      enhancedMetadata,
      loopContext,
      enableFieldTracking
    );
    if (process.env.NODE_ENV === 'development') {
      console.log(`After nested loops processing: "${processedContent}"`);
    }

    // Then process regular mixins in the content
    processedContent = processItemMixins(
      processedContent,
      enhancedMetadata,
      loopContext,
      enableFieldTracking
    );

    // Convert markdown list items to HTML li elements if content starts with -
    processedContent = convertMarkdownListToHtml(processedContent);

    expandedParts.push(processedContent);
  }

  return expandedParts.join('\n');
}

/**
 * Expands a conditional block if the condition is truthy
 *
 * @param variable - The condition variable name
 * @param content - The conditional content template
 * @param value - The condition value
 * @param metadata - The metadata object
 * @param parentContext - Parent loop context
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Expanded content if condition is truthy, empty string otherwise
 */
function expandConditionalBlock(
  variable: string,
  content: string,
  value: any,
  metadata: Record<string, any>,
  parentContext?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  // Create enhanced metadata with the condition value
  const enhancedMetadata = {
    ...metadata,
    [variable]: value,
  };

  // Process any nested loops first
  let processedContent = processTemplateLoops(
    content,
    enhancedMetadata,
    parentContext,
    enableFieldTracking
  );

  // Then process regular mixins
  processedContent = processItemMixins(
    processedContent,
    enhancedMetadata,
    parentContext,
    enableFieldTracking
  );

  return processedContent;
}

/**
 * Resolves a loop variable from metadata or parent context
 *
 * @param variable - The variable name to resolve
 * @param metadata - The metadata object
 * @param parentContext - Parent loop context
 * @returns The resolved variable value
 */
function resolveLoopVariable(
  variable: string,
  metadata: Record<string, any>,
  parentContext?: LoopContext
): any {
  // First try to resolve using dot notation from metadata
  const resolvedFromMetadata = resolvePath(metadata, variable);
  if (resolvedFromMetadata !== undefined) {
    return resolvedFromMetadata;
  }

  // Then check parent context (for nested loops)
  if (parentContext && parentContext.item) {
    const resolvedFromContext = resolvePath(parentContext.item, variable);
    if (resolvedFromContext !== undefined) {
      return resolvedFromContext;
    }
  }

  // Check parent context's parent (for deeper nesting)
  let ctx = parentContext;
  while (ctx && ctx.parent) {
    ctx = ctx.parent;
    if (ctx.item) {
      const resolvedFromNestedContext = resolvePath(ctx.item, variable);
      if (resolvedFromNestedContext !== undefined) {
        return resolvedFromNestedContext;
      }
    }
  }

  return undefined;
}

/**
 * Creates enhanced metadata by merging current item properties
 *
 * @param metadata - Original metadata
 * @param item - Current loop item
 * @param context - Loop context
 * @returns Enhanced metadata object
 */
function createEnhancedMetadata(
  metadata: Record<string, any>,
  item: any,
  context: LoopContext
): Record<string, any> {
  const enhanced = { ...metadata };

  // Add current item properties if it's an object
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    Object.assign(enhanced, item);
    // Debug: log enhanced metadata for template loops
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line max-len
      console.log(
        'Template loops enhanced metadata for item:',
        JSON.stringify({ item, enhanced }, null, 2)
      );
    }
  }

  // Add special dot notation for current item value
  enhanced['.'] = item;

  // Add loop context variables
  enhanced['@index'] = context.index;
  enhanced['@total'] = context.total;
  enhanced['@first'] = context.index === 0;
  enhanced['@last'] = context.index === context.total - 1;

  return enhanced;
}

/**
 * Evaluates a helper function expression with arguments
 *
 * @param expression - The helper function expression (e.g., "formatDate(@today, 'long')")
 * @param metadata - Metadata context for argument resolution
 * @returns The result of the helper function call, or undefined if invalid
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
    const args = argsString ? parseHelperArguments(argsString, metadata) : [];

    // Call the helper function
    return (helper as any)(...args);
  } catch (error) {
    console.error(`Error evaluating helper expression: ${expression}`, error);
    return undefined;
  }
}

/**
 * Parses helper function arguments, handling nested calls and variable references
 */
function parseHelperArguments(argsString: string, metadata: Record<string, any>): any[] {
  const args: any[] = [];
  let currentArg = '';
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    // eslint-disable-next-line quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      currentArg += char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      currentArg += char;
    } else if (char === '(' && !inQuotes) {
      parenDepth++;
      currentArg += char;
    } else if (char === ')' && !inQuotes) {
      parenDepth--;
      currentArg += char;
    } else if (char === ',' && parenDepth === 0 && !inQuotes) {
      args.push(resolveHelperArgument(currentArg.trim(), metadata));
      currentArg = '';
    } else {
      currentArg += char;
    }
  }

  // Add the last argument
  if (currentArg.trim()) {
    args.push(resolveHelperArgument(currentArg.trim(), metadata));
  }

  return args;
}

/**
 * Resolves a single helper argument, handling different types
 */
function resolveHelperArgument(arg: string, metadata: Record<string, any>): any {
  // Handle quoted strings
  // eslint-disable-next-line quotes
  if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
    return arg.slice(1, -1);
  }

  // Handle boolean values
  if (arg === 'true') return true;
  if (arg === 'false') return false;

  // Handle numbers
  if (/^\d+$/.test(arg)) {
    return parseInt(arg, 10);
  }
  if (/^\d+\.\d+$/.test(arg)) {
    return parseFloat(arg);
  }

  // Handle @today special case
  if (arg === '@today') {
    return new Date();
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
 * Resolves a nested path in metadata (e.g., "client.name")
 */
function resolvePath(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Processes mixins within loop content with enhanced metadata
 *
 * @param content - The content to process
 * @param metadata - Enhanced metadata with loop context
 * @param context - Loop context
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Processed content with mixins resolved
 */
function processItemMixins(
  content: string,
  metadata: Record<string, any>,
  context?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  // Template loops now run before AST processor, so no need to skip based on spans

  if (process.env.NODE_ENV === 'development') {
    console.log(`processItemMixins called with content: "${content}"`);
  }

  // Use a simple regex to find and replace mixins
  const mixinPattern = /\{\{([^}]+)\}\}/g;

  return content.replace(mixinPattern, (match, variable) => {
    const trimmedVar = variable.trim();

    // Debug: log each mixin being processed
    if (process.env.NODE_ENV === 'development') {
      console.log(`Processing mixin: "${trimmedVar}" with metadata keys:`, Object.keys(metadata));
    }

    // Handle conditional expressions (ternary operator)
    if (trimmedVar.includes('?') && trimmedVar.includes(':')) {
      const result = processConditionalExpression(trimmedVar, metadata, enableFieldTracking);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Conditional result for "${trimmedVar}":`, result);
      }
      if (enableFieldTracking) {
        return `<span class="highlight">${result}</span>`;
      }
      return result;
    }

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
        if (enableFieldTracking) {
          const escapedField = escapeHtmlAttribute(trimmedVar);
          const stringResult = String(result);
          return (
            '<span class="highlight">' +
            `<span class="imported-value" data-field="${escapedField}">${stringResult}</span>` +
            '</span>'
          );
        }
        return String(result);
      }
      // If helper evaluation failed, fall through to missing value handling
    }

    // Handle simple variable substitution
    const value = resolveVariablePath(trimmedVar, metadata, context);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Simple variable "${trimmedVar}" resolved to:`, value);
    }

    if (value === undefined || value === null) {
      if (enableFieldTracking) {
        return (
          `<span class="missing-value" data-field="${escapeHtmlAttribute(trimmedVar)}">` +
          `[[${trimmedVar}]]</span>`
        );
      }
      return `{{${trimmedVar}}}`;
    }

    if (enableFieldTracking) {
      return (
        `<span class="imported-value" data-field="${escapeHtmlAttribute(trimmedVar)}">` +
        `${String(value)}</span>`
      );
    }
    return String(value);
  });
}

/**
 * Processes conditional expressions (ternary operator)
 *
 * @param expression - The conditional expression
 * @param metadata - The metadata object
 * @param enableFieldTracking - Whether to enable field tracking HTML spans
 * @returns Resolved conditional value
 */
function processConditionalExpression(
  expression: string,
  metadata: Record<string, any>,
  enableFieldTracking: boolean = true
): string {
  // Find the question mark and colon, but be careful about quoted strings
  const questionIndex = findOperatorIndex(expression, '?');
  const colonIndex = findOperatorIndex(expression, ':', questionIndex);

  if (questionIndex === -1 || colonIndex === -1) {
    return expression; // Invalid ternary, return as-is
  }

  const condition = expression.substring(0, questionIndex).trim();
  const truePart = expression.substring(questionIndex + 1, colonIndex).trim();
  const falsePart = expression.substring(colonIndex + 1).trim();

  // Resolve condition value
  const conditionValue = resolveVariablePath(condition, metadata);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Condition "${condition}" resolved to:`, conditionValue);
    console.log(
      // eslint-disable-next-line max-len
      `Selected part: ${conditionValue ? 'truePart' : 'falsePart'} = "${conditionValue ? truePart : falsePart}"`
    );
  }

  // Choose appropriate part based on condition
  const selectedPart = conditionValue ? truePart : falsePart;

  // Remove quotes if present
  if (
    (selectedPart.startsWith('"') && selectedPart.endsWith('"')) ||
    // eslint-disable-next-line quotes
    (selectedPart.startsWith("'") && selectedPart.endsWith("'"))
  ) {
    const unquotedValue = selectedPart.slice(1, -1);
    if (enableFieldTracking) {
      return (
        `<span class="imported-value" data-field="${escapeHtmlAttribute(expression)}">` +
        `${unquotedValue}</span>`
      );
    }
    return unquotedValue;
  }

  // Process as expression (might contain variables or concatenation)
  const processedValue = processExpression(selectedPart, metadata);
  if (enableFieldTracking) {
    return (
      `<span class="imported-value" data-field="${escapeHtmlAttribute(expression)}">` +
      `${processedValue}</span>`
    );
  }
  return processedValue;
}

/**
 * Finds the index of an operator outside of quoted strings
 *
 * @param expression - The expression to search
 * @param operator - The operator to find
 * @param startIndex - Starting index for the search
 * @returns The index of the operator or -1 if not found
 */
function findOperatorIndex(expression: string, operator: string, startIndex: number = 0): number {
  let inQuotes = false;
  let quoteChar = '';

  for (let i = startIndex; i < expression.length; i++) {
    const char = expression[i];

    // eslint-disable-next-line quotes
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && char === operator) {
      return i;
    }
  }

  return -1;
}

/**
 * Processes expressions that might contain variables or concatenation
 *
 * @param expression - The expression to process
 * @param metadata - The metadata object
 * @returns Processed expression result
 */
function processExpression(expression: string, metadata: Record<string, any>): string {
  // Handle concatenation with +
  if (expression.includes('+')) {
    return expression
      .split('+')
      .map(part => {
        const trimmed = part.trim();

        // Handle quoted strings
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          // eslint-disable-next-line quotes
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          return trimmed.slice(1, -1);
        }

        // Handle variables
        const value = resolveVariablePath(trimmed, metadata);
        return value !== undefined ? String(value) : trimmed;
      })
      .join('');
  }

  // Handle single variable
  const value = resolveVariablePath(expression, metadata);
  return value !== undefined ? String(value) : expression;
}

/**
 * Resolves a variable path with dot notation support
 *
 * @param path - The variable path (e.g., 'item.name')
 * @param metadata - The metadata object
 * @param context - Loop context
 * @returns Resolved variable value
 */
function resolveVariablePath(
  path: string,
  metadata: Record<string, any>,
  context?: LoopContext
): any {
  // Handle special case for current item in template loops
  if (path === '.') {
    return metadata['.'];
  }

  // Split path by dots
  const parts = path.split('.');
  let current = metadata;

  for (const part of parts) {
    if (
      current &&
      typeof current === 'object' &&
      Object.prototype.hasOwnProperty.call(current, part)
    ) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Converts markdown list items to HTML li elements
 *
 * @param content - The content to convert
 * @returns Content with markdown list items converted to HTML li elements
 */
function convertMarkdownListToHtml(content: string): string {
  // Check if content starts with markdown list item syntax
  const trimmedContent = content.trim();
  if (trimmedContent.startsWith('- ')) {
    // Convert "- content" to "<li>content</li>"
    const listItemContent = trimmedContent.substring(2).trim();
    return `<li>${listItemContent}</li>`;
  }

  return content;
}
