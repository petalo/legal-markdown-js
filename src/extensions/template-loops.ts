/**
 * @fileoverview Template Loop Processing Extension for Legal Markdown
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

import { fieldTracker } from '../tracking/field-tracker';

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
interface LoopContext {
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
  const loopPattern = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

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
    processedContent = processTemplateLoops(
      processedContent,
      enhancedMetadata,
      loopContext,
      enableFieldTracking
    );

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
  // First check if it's available in current metadata
  if (Object.prototype.hasOwnProperty.call(metadata, variable)) {
    return metadata[variable];
  }

  // Then check parent context (for nested loops)
  if (
    parentContext &&
    parentContext.item &&
    Object.prototype.hasOwnProperty.call(parentContext.item, variable)
  ) {
    return parentContext.item[variable];
  }

  // Check parent context's parent (for deeper nesting)
  let ctx = parentContext;
  while (ctx && ctx.parent) {
    ctx = ctx.parent;
    if (ctx.item && Object.prototype.hasOwnProperty.call(ctx.item, variable)) {
      return ctx.item[variable];
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
  }

  // Add loop context variables
  enhanced['@index'] = context.index;
  enhanced['@total'] = context.total;
  enhanced['@first'] = context.index === 0;
  enhanced['@last'] = context.index === context.total - 1;

  return enhanced;
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
  // Use a simple regex to find and replace mixins
  const mixinPattern = /\{\{([^}]+)\}\}/g;

  return content.replace(mixinPattern, (match, variable) => {
    const trimmedVar = variable.trim();

    // Handle conditional expressions (ternary operator)
    if (trimmedVar.includes('?') && trimmedVar.includes(':')) {
      const result = processConditionalExpression(trimmedVar, metadata, enableFieldTracking);
      if (enableFieldTracking) {
        return `<span class="highlight">${result}</span>`;
      }
      return result;
    }

    // Handle simple variable substitution
    const value = resolveVariablePath(trimmedVar, metadata, context);

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

  // Choose appropriate part based on condition
  const selectedPart = conditionValue ? truePart : falsePart;

  // Remove quotes if present
  if (
    (selectedPart.startsWith('"') && selectedPart.endsWith('"')) ||
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
