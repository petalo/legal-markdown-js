/**
 * Template Loop Processing - Phase 2 String Transformation Module
 *
 * ⚠️ IMPORTANT: This is NOT a remark plugin!
 * This module runs in Phase 2 (String Transformations) BEFORE remark AST parsing.
 *
 * Why String-Level Processing?
 * ────────────────────────────
 * Template loops with Handlebars blocks ({{#each}}, {{#if}}) can span multiple lines
 * and contain markdown formatting. When remark parses markdown into an AST, it fragments
 * these patterns across multiple nodes, making it impossible for an AST plugin to match
 * complete loop structures.
 *
 * This module supports DUAL SYNTAX (Handlebars + Legacy):
 *
 * HANDLEBARS SYNTAX (Recommended - Standard):
 * - Helper calls: {{helper arg1 arg2}}
 * - Loops: {{#each items}}...{{/each}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Subexpressions: {{formatDate (addYears date 2) "legal"}}
 *
 * LEGACY SYNTAX (Deprecated - Will be removed in v4.0.0):
 * - Helper calls: {{helper(arg1, arg2)}}
 * - Math expressions: {{price * quantity}}
 * - String concat: {{"$" + price}}
 *
 * Features:
 * - Array iteration: {{#items}}...{{/items}}
 * - Conditional blocks: {{#loyaltyMember}}...{{/loyaltyMember}}
 * - Nested loops support
 * - Context management for loop variables
 * - Integration with field tracking
 * - Automatic syntax detection
 *
 * @example
 * ```typescript
 * import { processTemplateLoops } from './template-loops';
 *
 * // Handlebars syntax (recommended)
 * const content = `
 * {{#each items}}
 * - {{name}} - {{formatCurrency price "USD"}}
 * {{/each}}
 * `;
 *
 * // Legacy syntax (deprecated)
 * const legacyContent = `
 * {{#items}}
 * - {{name}} - {{formatCurrency(price, "USD")}}
 * {{/items}}
 * `;
 *
 * const metadata = {
 *   items: [
 *     { name: "Product A", price: 10.99 },
 *     { name: "Product B", price: 15.50 }
 *   ]
 * };
 *
 * const result = processTemplateLoops(content, metadata);
 * ```
 *
 * @module
 * @see docs/architecture/string-transformations.md
 * @see Issue #149 - https://github.com/petalo/legal-markdown-js/issues/149
 */

import { fieldTracker } from './tracking/field-tracker';
import { extensionHelpers as helpers } from './helpers/index';
import { compileHandlebarsTemplate } from './handlebars-engine';

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

// ============================================================================
// SYNTAX DETECTION - Automatic detection of Handlebars vs Legacy syntax
// ============================================================================

/**
 * Detects which template syntax is used in the content
 *
 * @param content - The template content to analyze
 * @returns 'handlebars' | 'legacy' | 'mixed'
 */
export function detectSyntaxType(content: string): 'legacy' | 'handlebars' | 'mixed' {
  // Pattern for LEGACY syntax: helper calls with parentheses like helper(arg1, arg2)
  const legacyPattern = /\{\{[^}]*\w+\([^)]*\)[^}]*\}\}/;

  // Pattern for HANDLEBARS syntax:
  // 1. Helper calls without parentheses: helper arg1 arg2
  // 2. Handlebars blocks: {{#each}}, {{#if}}, etc.
  // 3. Block closings: {{/each}}, {{/if}}
  // Excludes: @special variables, simple variables
  const handlebarsHelperPattern = /\{\{(?!#|\/|@)\w+\s+[^}]+\}\}/;
  const handlebarsBlockPattern = /\{\{#(each|if|unless|with)\b/;
  const handlebarsClosingPattern = /\{\{\/(each|if|unless|with)\}\}/;

  const hasLegacy = legacyPattern.test(content);
  const hasHandlebars =
    handlebarsHelperPattern.test(content) ||
    handlebarsBlockPattern.test(content) ||
    handlebarsClosingPattern.test(content);

  if (hasLegacy && hasHandlebars) return 'mixed';
  if (hasHandlebars) return 'handlebars';
  return 'legacy'; // Default to legacy for backward compatibility
}

/**
 * Collects all legacy syntax patterns found in content for migration hints
 *
 * @param content - The template content to analyze
 * @returns Array of legacy patterns with suggested replacements
 */
function collectLegacySyntaxPatterns(content: string): Array<{
  legacy: string;
  suggestion: string;
  line: number;
}> {
  const patterns: Array<{ legacy: string; suggestion: string; line: number }> = [];

  // Split content into lines for line numbers
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match helper calls with parentheses: {{helper(arg1, arg2)}}
    const helperMatches = line.matchAll(/\{\{([^}]*\w+)\(([^)]*)\)([^}]*)\}\}/g);
    for (const match of helperMatches) {
      const fullMatch = match[0];
      const helperName = match[1].trim();
      const args = match[2];

      // Convert args: remove commas between arguments
      const handlebarsArgs = args.replace(/,\s*/g, ' ');
      const suggestion = `{{${helperName} ${handlebarsArgs}}}`;

      patterns.push({
        legacy: fullMatch,
        suggestion,
        line: index + 1,
      });
    }

    // Match mathematical expressions: {{a * b}}, {{a + b}}, etc.
    const mathMatches = line.matchAll(/\{\{([^}]*[*/+-][^}]*)\}\}/g);
    for (const match of mathMatches) {
      const fullMatch = match[0];
      const expression = match[1].trim();

      // Try to convert to helper syntax
      if (expression.includes('*')) {
        const [a, b] = expression.split('*').map(s => s.trim());
        patterns.push({
          legacy: fullMatch,
          suggestion: `{{multiply ${a} ${b}}}`,
          line: index + 1,
        });
      } else if (expression.includes('+') && !expression.includes('"')) {
        const [a, b] = expression.split('+').map(s => s.trim());
        patterns.push({
          legacy: fullMatch,
          suggestion: `{{add ${a} ${b}}}`,
          line: index + 1,
        });
      }
    }

    // Match string concatenation: {{"text" + variable}}
    const concatMatches = line.matchAll(/\{\{["']([^"']+)["']\s*\+\s*(\w+)\}\}/g);
    for (const match of concatMatches) {
      const fullMatch = match[0];
      const text = match[1];
      const variable = match[2];

      patterns.push({
        legacy: fullMatch,
        suggestion: `{{concat "${text}" ${variable}}}`,
        line: index + 1,
      });
    }
  });

  return patterns;
}

/**
 * Logs detailed migration hints for legacy syntax
 *
 * @param patterns - Array of detected legacy patterns
 * @param documentPath - Optional document path for context
 */
function logLegacySyntaxMigrationHints(
  patterns: Array<{ legacy: string; suggestion: string; line: number }>,
  documentPath?: string
): void {
  if (patterns.length === 0) return;

  const location = documentPath ? ` in ${documentPath}` : '';

  console.warn(`
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  DEPRECATED: Legacy Template Syntax Detected${location.padEnd(28)}║
╚════════════════════════════════════════════════════════════════════════════╝

Found ${patterns.length} legacy syntax pattern(s) that should be migrated to Handlebars:
`);

  patterns.forEach((pattern, index) => {
    console.warn(`
${index + 1}. Line ${pattern.line}:
   ❌ Legacy:     ${pattern.legacy}
   ✅ Handlebars: ${pattern.suggestion}
`);
  });

  console.warn(`
Migration Guide: https://github.com/petalo/legal-markdown-js/blob/main/docs/handlebars-migration.md

Legacy syntax will be REMOVED in v4.0.0
Please update your templates to use Handlebars syntax.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// ============================================================================
// HANDLEBARS PROCESSING - New standard way (keeps in v4.0.0+)
// ============================================================================

/**
 * Processes templates using Handlebars engine
 *
 * @param content - The template content
 * @param metadata - The data context
 * @param context - Optional loop context
 * @param enableFieldTracking - Whether to track field usage
 * @returns Processed content
 */
function processWithHandlebars(
  content: string,
  metadata: Record<string, any>,
  context?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  try {
    // Prepare Handlebars data context
    const handlebarsData: Record<string, any> = {
      ...metadata,
    };

    // Add loop context variables if present
    if (context) {
      handlebarsData['@index'] = context.index;
      handlebarsData['@total'] = context.total;
      handlebarsData['@first'] = context.index === 0;
      handlebarsData['@last'] = context.index === context.total - 1;

      // For parent context access
      if (context.parent) {
        handlebarsData['@parent'] = {
          ...metadata,
          '@index': context.parent.index,
          '@total': context.parent.total,
        };
      }
    }

    // Compile and render with Handlebars
    const result = compileHandlebarsTemplate(content, handlebarsData);

    // Apply field tracking if enabled
    if (enableFieldTracking) {
      return applyFieldTrackingToOutput(result, metadata);
    }

    return result;
  } catch (error) {
    console.error('Error processing Handlebars template:', error);
    console.warn('Falling back to legacy processing...');
    // Fallback to legacy on error
    return processWithLegacy(content, metadata, context, enableFieldTracking);
  }
}

/**
 * Applies field tracking to Handlebars output
 *
 * @param content - Rendered content
 * @param metadata - Metadata used
 * @returns Content with field tracking applied
 */
function applyFieldTrackingToOutput(content: string, metadata: Record<string, any>): string {
  // Track fields that appear in the output
  Object.keys(metadata).forEach(key => {
    const value = metadata[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const valueStr = String(value);
      if (content.includes(valueStr)) {
        fieldTracker.trackField(key, { value, hasLogic: false });
      }
    }
  });

  return content;
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
 * ⚠️ RUNS IN PHASE 2 (String Transformations) - BEFORE remark AST parsing
 *
 * DUAL SYNTAX SUPPORT:
 * - Automatically detects Handlebars vs Legacy syntax
 * - Routes to appropriate processor
 * - Logs migration hints for legacy syntax
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
  // STEP 1: Detect syntax type
  const syntaxType = detectSyntaxType(content);

  // STEP 2: Log migration hints for legacy syntax
  if (syntaxType === 'legacy' || syntaxType === 'mixed') {
    const patterns = collectLegacySyntaxPatterns(content);
    logLegacySyntaxMigrationHints(patterns);

    if (syntaxType === 'mixed') {
      console.error(`
❌ ERROR: Mixed template syntax detected!
   Your document contains BOTH legacy and Handlebars syntax.
   Please use one syntax consistently throughout the document.

   Falling back to legacy processing...
`);
    }
  }

  // STEP 3: Route to appropriate processor
  if (syntaxType === 'handlebars') {
    // Use Handlebars engine (modern, standard)
    return processWithHandlebars(content, metadata, context, enableFieldTracking);
  } else {
    // Use legacy processor (deprecated, will be removed in v4.0.0)
    return processWithLegacy(content, metadata, context, enableFieldTracking);
  }
}

// ============================================================================
// ⚠️ LEGACY PROCESSING - DEPRECATED - TO BE REMOVED IN v4.0.0
// ============================================================================
// Everything below this line is legacy code that will be removed in version 4.0.0
// This code is kept for backward compatibility with old template syntax.
//
// LEGACY SYNTAX (Deprecated):
// - {{helper(arg1, arg2)}}  ← Function-style helper calls
// - {{price * quantity}}     ← Mathematical expressions
// - {{"$" + price}}          ← String concatenation
//
// Please migrate to Handlebars syntax:
// - {{helper arg1 arg2}}     ← Standard Handlebars
// - {{multiply price quantity}} ← Helper functions
// - {{concat "$" price}}     ← concat helper
// ============================================================================

/**
 * @deprecated Use processWithHandlebars instead. Will be removed in v4.0.0
 *
 * Processes template loops using legacy custom parsing logic
 *
 * @param content - The template content
 * @param metadata - The metadata object
 * @param context - Current loop context
 * @param enableFieldTracking - Whether to enable field tracking
 * @returns Processed content
 */
function processWithLegacy(
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
 * @deprecated Legacy function. Will be removed in v4.0.0. Use Handlebars instead.
 *
 * Finds all loop blocks in the content using regex pattern matching
 *
 * @param content - The content to search for loop blocks
 * @returns Array of parsed loop blocks
 */
function findLoopBlocks(content: string): LoopBlock[] {
  const loopBlocks: LoopBlock[] = [];

  // Pattern for array loops: {{#variable}}...{{/variable}}
  const loopPattern = /\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  // Pattern for conditionals: {{#if condition}}...{{/if}} (with optional {{else}})
  const conditionalPattern = /\{\{#if\s*([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  let match;

  // Find array loops
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

  // Find conditional blocks
  while ((match = conditionalPattern.exec(content)) !== null) {
    const [fullMatch, condition, conditionalContent] = match;

    loopBlocks.push({
      variable: `if ${condition}`, // Mark as conditional
      content: conditionalContent,
      start: match.index,
      end: match.index + fullMatch.length,
      fullMatch,
    });
  }

  return loopBlocks;
}

/**
 * @deprecated Legacy function. Will be removed in v4.0.0. Use Handlebars instead.
 *
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

  // Handle conditional blocks ({{#if condition}})
  if (variable.startsWith('if ')) {
    const condition = variable.substring(3).trim(); // Remove 'if '
    const conditionValue = evaluateCondition(condition, metadata);

    // Track field usage for conditional
    fieldTracker.trackField(`if ${condition}`, {
      value: conditionValue,
      hasLogic: true,
      mixinUsed: 'conditional',
    });

    // Check if content contains {{else}} clause
    const elseIndex = content.indexOf('{{else}}');

    if (elseIndex !== -1) {
      // Split content into "if" and "else" parts
      const ifContent = content.substring(0, elseIndex);
      const elseContent = content.substring(elseIndex + 8); // 8 = length of '{{else}}'

      const selectedContent = conditionValue ? ifContent : elseContent;
      return processTemplateContent(selectedContent, metadata, parentContext, enableFieldTracking);
    } else {
      // No {{else}} clause, use original behavior
      if (conditionValue) {
        return processTemplateContent(content, metadata, parentContext, enableFieldTracking);
      } else {
        return ''; // Condition false, return empty
      }
    }
  }

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
export function processItemMixins(
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

    // Check for missing values: undefined or null
    // Note: Empty strings ('') are considered valid values and will be returned as-is
    if (value === undefined || value === null) {
      if (enableFieldTracking) {
        return (
          `<span class="legal-field missing-value" data-field="${escapeHtmlAttribute(trimmedVar)}">` +
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
  // Handle string concatenation (if expression has quotes and +)

  // eslint-disable-next-line quotes
  if (expression.includes('+') && (expression.includes('"') || expression.includes("'"))) {
    return evaluateStringConcatenation(expression, metadata);
  }

  // Handle mathematical operations (*, /, +, -)
  if (
    expression.includes('*') ||
    expression.includes('/') ||
    expression.includes('+') ||
    expression.includes('-')
  ) {
    return evaluateMathematicalExpression(expression, metadata);
  }

  // Handle single variable
  const value = resolveVariablePath(expression, metadata);
  return value !== undefined ? String(value) : expression;
}

/**
 * Evaluates string concatenation expressions with variables
 * @param expression - The concatenation expression (e.g., '"$" + price')
 * @param metadata - The metadata object
 * @returns The concatenated result as string
 */
function evaluateStringConcatenation(expression: string, metadata: Record<string, any>): string {
  try {
    // Replace variables in the expression with their values
    let processedExpression = expression.trim();

    // Find all variable names (alphanumeric + underscores + dots, but not inside quotes)
    const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_.]*\b/g;
    const variables = new Set<string>();
    let match;

    // Only capture variables that are not inside quoted strings
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      // eslint-disable-next-line quotes
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    // Reset and find variables outside quotes
    while ((match = variablePattern.exec(expression)) !== null) {
      // Check if this match is inside quotes
      const beforeMatch = expression.substring(0, match.index);
      const openQuotes = (beforeMatch.match(/"/g) || []).length;
      const openSingleQuotes = (beforeMatch.match(/'/g) || []).length;

      // If even number of quotes before this match, we're outside quotes
      if (openQuotes % 2 === 0 && openSingleQuotes % 2 === 0) {
        variables.add(match[0]);
      }
    }

    // Replace each variable with its value
    for (const variable of variables) {
      const value = resolveVariablePath(variable, metadata);
      if (value !== undefined) {
        const regex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        if (typeof value === 'string') {
          processedExpression = processedExpression.replace(regex, `"${value}"`);
        } else {
          processedExpression = processedExpression.replace(regex, String(value));
        }
      } else {
        // If any variable is undefined, return original expression
        return expression;
      }
    }

    // Safely evaluate the string concatenation expression
    // Use Function constructor for safe evaluation
    const result = new Function(`"use strict"; return (${processedExpression})`)();

    return String(result);
  } catch (error) {
    // If evaluation fails, return original expression
    return expression;
  }
}

/**
 * Evaluates mathematical expressions with variables
 * @param expression - The mathematical expression (e.g., "hours * rate")
 * @param metadata - The metadata object
 * @returns The calculated result as string
 */
function evaluateMathematicalExpression(expression: string, metadata: Record<string, any>): string {
  try {
    // Replace variables in the expression with their values
    let processedExpression = expression;

    // Find all variable names (alphanumeric + underscores + dots)
    const variablePattern = /[a-zA-Z_][a-zA-Z0-9_.]*(?![a-zA-Z0-9_.])/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(expression)) !== null) {
      variables.add(match[0]);
    }

    // Replace each variable with its value
    for (const variable of variables) {
      const value = resolveVariablePath(variable, metadata);
      if (value !== undefined && !isNaN(Number(value))) {
        const regex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, String(value));
      } else {
        // If any variable is undefined or not a number, return original expression
        return expression;
      }
    }

    // Evaluate the mathematical expression safely
    // Only allow numbers, operators, parentheses, and whitespace
    if (!/^[\d\s+\-*/().]+$/.test(processedExpression)) {
      return expression;
    }

    // Use Function constructor for safe evaluation (no access to global scope)
    const result = new Function(`"use strict"; return (${processedExpression})`)();

    return typeof result === 'number' && !isNaN(result) ? String(result) : expression;
  } catch (error) {
    // If evaluation fails, return original expression
    return expression;
  }
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Evaluates a conditional expression
 * @param condition - The condition to evaluate (e.g., "includeSupport", "client.active")
 * @param metadata - The metadata object
 * @returns Boolean result of the condition
 */
function evaluateCondition(condition: string, metadata: Record<string, any>): boolean {
  // Handle boolean expressions (&&, ||)
  if (condition.includes('&&') || condition.includes('||')) {
    return evaluateBooleanExpression(condition, metadata);
  }

  // Handle comparison operators (==, !=, >, <, >=, <=)
  if (
    condition.includes('==') ||
    condition.includes('!=') ||
    condition.includes('>=') ||
    condition.includes('<=') ||
    condition.includes('>') ||
    condition.includes('<')
  ) {
    return evaluateComparisonExpression(condition, metadata);
  }

  // Simple variable truthiness check
  const value = resolveVariablePath(condition, metadata);

  // Consider truthy values: non-empty strings, non-zero numbers, true, non-empty arrays, non-empty objects
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;

  return Boolean(value);
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
 * Evaluate a simple condition (no && or ||)
 */
function evaluateSimpleCondition(condition: string, metadata: Record<string, any>): boolean {
  // Handle comparison operators
  if (
    condition.includes('==') ||
    condition.includes('!=') ||
    condition.includes('>=') ||
    condition.includes('<=') ||
    condition.includes('>') ||
    condition.includes('<')
  ) {
    return evaluateComparisonExpression(condition, metadata);
  }

  // Simple variable truthiness check
  const value = resolveVariablePath(condition, metadata);
  return isTruthy(value);
}

/**
 * Evaluate comparison expressions (==, !=, >, <, >=, <=)
 */
function evaluateComparisonExpression(condition: string, metadata: Record<string, any>): boolean {
  // Find the comparison operator (check >= and <= before > and < to avoid partial matches)
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

  // Get values - left side is usually a variable, right side can be literal or variable
  const leftValue = resolveVariablePath(leftSide.trim(), metadata);
  const rightValue = parseComparisonValue(rightSide.trim(), metadata);

  // Perform comparison
  switch (operator) {
    case '==':
      // eslint-disable-next-line eqeqeq
      return leftValue == rightValue;
    case '!=':
      // eslint-disable-next-line eqeqeq
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
 * Parse a value in a comparison (could be a variable reference or a literal)
 */
function parseComparisonValue(value: string, metadata: Record<string, any>): any {
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
  if (value === 'null') return null;

  // Otherwise, treat it as a variable reference
  return resolveVariablePath(value, metadata);
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
 * Processes template content with field substitution
 * @param content - The content to process
 * @param metadata - The metadata object
 * @param context - Current loop context
 * @param enableFieldTracking - Whether to enable field tracking
 * @returns Processed content with fields substituted
 */
function processTemplateContent(
  content: string,
  metadata: Record<string, any>,
  context?: LoopContext,
  enableFieldTracking: boolean = true
): string {
  // Process any nested template loops first
  let processedContent = processTemplateLoops(content, metadata, context, enableFieldTracking);

  // Process field substitutions {{variable}}
  processedContent = processedContent.replace(/\{\{([^#/][^}]*)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const value = resolveVariablePath(trimmedVar, metadata, context);

    if (value !== undefined) {
      if (enableFieldTracking) {
        const isEmptyValue =
          value === null || value === '' || (typeof value === 'string' && value.trim() === '');
        const cssClass = isEmptyValue ? 'legal-field missing-value' : 'legal-field imported-value';

        fieldTracker.trackField(trimmedVar, {
          value: value,
          originalValue: match,
          hasLogic: false,
        });

        return `<span class="${cssClass}" data-field="${escapeHtmlAttribute(trimmedVar)}">${String(value)}</span>`;
      }
      return String(value);
    }

    return match; // Keep original if not found
  });

  return processedContent;
}
