/**
 * Remark Plugin: Template Loops (AST-Native)
 *
 * This plugin processes template loops and conditionals directly on the AST,
 * preserving node metadata (like data.isLegalHeader) that would be lost with
 * string-based preprocessing.
 *
 * Supported syntax:
 * - Array loops: {{#items}}...{{/items}}
 * - Conditionals: {{#if condition}}...{{else}}...{{/if}}
 * - Nested loops: {{#outer}}{{#inner}}...{{/inner}}{{/outer}}
 *
 * @module
 */

import { Plugin } from 'unified';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Root, Parent, Node, Paragraph, Text, RootContent } from 'mdast';
import { visit, SKIP, CONTINUE } from 'unist-util-visit';
import { processTemplateLoops } from '../../extensions/template-loops';

/**
 * Options for the template loops plugin
 */
export interface TemplateLoopsOptions {
  /** Document metadata containing loop data */
  metadata: Record<string, unknown>;

  /** Enable field tracking HTML spans */
  enableFieldTracking?: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Represents a template marker found in the AST
 */
interface TemplateMarker {
  /** Type of marker */
  type: 'loop-start' | 'loop-end' | 'if-start' | 'if-end' | 'else';

  /** Variable name for loops, condition for if statements */
  value: string;

  /** Parent node containing this marker */
  parent: Parent;

  /** Index in parent's children array */
  index: number;

  /** The paragraph node containing the marker */
  node: Paragraph;

  /** Original text value */
  text: string;
}

/**
 * Represents a matched block (loop or conditional)
 */
interface TemplateBlock {
  /** Block type */
  type: 'loop' | 'conditional';

  /** Variable name (for loops) or condition (for conditionals) */
  variable: string;

  /** Start marker */
  startMarker: TemplateMarker;

  /** End marker */
  endMarker: TemplateMarker;

  /** Else marker (for conditionals) */
  elseMarker?: TemplateMarker;

  /** Content nodes between start and end */
  contentNodes: Node[];

  /** Content nodes in else block (for conditionals) */
  elseNodes?: Node[];
}

/**
 * Remark plugin for processing template loops on AST
 */
export const remarkTemplateLoopsAST: Plugin<[TemplateLoopsOptions], Root> = options => {
  const { metadata = {}, enableFieldTracking = true, debug = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('[remarkTemplateLoopsAST] Processing template loops on AST');
    }

    // Step 1: Find all template markers in the tree
    const markers = findTemplateMarkers(tree, debug);

    if (markers.length === 0) {
      if (debug) {
        console.log('[remarkTemplateLoopsAST] No template markers found');
      }
      return;
    }

    if (debug) {
      console.log(`[remarkTemplateLoopsAST] Found ${markers.length} markers`);
    }

    // Step 2: Match opening/closing pairs to form blocks
    const blocks = matchMarkerPairs(markers, debug);

    if (blocks.length === 0) {
      if (debug) {
        console.log('[remarkTemplateLoopsAST] No matching blocks found');
      }
      return;
    }

    if (debug) {
      console.log(`[remarkTemplateLoopsAST] Matched ${blocks.length} blocks`);
    }

    // Step 3: Process blocks from innermost to outermost (for nested loops)
    // Sort by depth (innermost first) and position (last to first to avoid index shifts)
    const sortedBlocks = sortBlocksByDepth(blocks);

    for (const block of sortedBlocks) {
      if (block.type === 'loop') {
        processLoopBlock(block, metadata, enableFieldTracking, debug);
      } else {
        processConditionalBlock(block, metadata, enableFieldTracking, debug);
      }
    }

    if (debug) {
      console.log('[remarkTemplateLoopsAST] Processing complete');
    }
  };
};

/**
 * Find all template markers in the AST
 */
function findTemplateMarkers(tree: Root, debug: boolean): TemplateMarker[] {
  const markers: TemplateMarker[] = [];

  // Patterns for template markers
  const loopStartPattern = /^\s*\{\{#([\w.]+)\}\}\s*$/;
  const loopEndPattern = /^\s*\{\{\/([\w.]+)\}\}\s*$/;
  const ifStartPattern = /^\s*\{\{#if\s+([^}]+)\}\}\s*$/;
  const ifEndPattern = /^\s*\{\{\/if\}\}\s*$/;
  const elsePattern = /^\s*\{\{else\}\}\s*$/;

  // Visit all paragraph nodes to find markers
  visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
    if (!parent || index === undefined) return;

    // Check if paragraph contains only a single text node with a marker
    if (node.children.length === 1 && node.children[0].type === 'text') {
      const textNode = node.children[0] as Text;
      const text = textNode.value;

      let match;

      // Check for loop start
      if ((match = text.match(loopStartPattern))) {
        markers.push({
          type: 'loop-start',
          value: match[1],
          parent,
          index,
          node,
          text,
        });
        if (debug) console.log(`  Found loop-start: {{#${match[1]}}}`);
      }
      // Check for loop end
      else if ((match = text.match(loopEndPattern))) {
        markers.push({
          type: 'loop-end',
          value: match[1],
          parent,
          index,
          node,
          text,
        });
        if (debug) console.log(`  Found loop-end: {{/${match[1]}}}`);
      }
      // Check for if start
      else if ((match = text.match(ifStartPattern))) {
        markers.push({
          type: 'if-start',
          value: match[1],
          parent,
          index,
          node,
          text,
        });
        if (debug) console.log(`  Found if-start: {{#if ${match[1]}}}`);
      }
      // Check for if end
      else if (text.match(ifEndPattern)) {
        markers.push({
          type: 'if-end',
          value: '',
          parent,
          index,
          node,
          text,
        });
        if (debug) console.log(`  Found if-end: {{/if}}`);
      }
      // Check for else
      else if (text.match(elsePattern)) {
        markers.push({
          type: 'else',
          value: '',
          parent,
          index,
          node,
          text,
        });
        if (debug) console.log(`  Found else: {{else}}`);
      }
    }
  });

  return markers;
}

/**
 * Match opening and closing markers to form blocks
 */
function matchMarkerPairs(markers: TemplateMarker[], debug: boolean): TemplateBlock[] {
  const blocks: TemplateBlock[] = [];
  const stack: TemplateMarker[] = [];

  for (const marker of markers) {
    if (marker.type === 'loop-start' || marker.type === 'if-start') {
      stack.push(marker);
    } else if (marker.type === 'loop-end') {
      // Find matching loop start
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].type === 'loop-start' && stack[i].value === marker.value) {
          const startMarker = stack.splice(i, 1)[0];

          // Extract content nodes between start and end
          const contentNodes = extractNodesBetween(startMarker, marker);

          blocks.push({
            type: 'loop',
            variable: marker.value,
            startMarker,
            endMarker: marker,
            contentNodes,
          });

          if (debug) {
            console.log(
              `  Matched loop block: {{#${marker.value}}} with ${contentNodes.length} nodes`
            );
          }

          break;
        }
      }
    } else if (marker.type === 'if-end') {
      // Find matching if start
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].type === 'if-start') {
          const startMarker = stack.splice(i, 1)[0];

          // Look for else marker between start and end
          const elseMarker = markers.find(
            m =>
              m.type === 'else' &&
              m.index > startMarker.index &&
              m.index < marker.index &&
              m.parent === startMarker.parent
          );

          // Extract content nodes
          const contentNodes = extractNodesBetween(startMarker, elseMarker || marker);

          const elseNodes = elseMarker ? extractNodesBetween(elseMarker, marker) : undefined;

          blocks.push({
            type: 'conditional',
            variable: startMarker.value,
            startMarker,
            endMarker: marker,
            elseMarker,
            contentNodes,
            elseNodes,
          });

          if (debug) {
            console.log(
              `  Matched conditional block: {{#if ${startMarker.value}}} with ${contentNodes.length} nodes${elseNodes ? ` and ${elseNodes.length} else nodes` : ''}`
            );
          }

          break;
        }
      }
    }
  }

  return blocks;
}

/**
 * Extract AST nodes between two markers
 */
function extractNodesBetween(start: TemplateMarker, end: TemplateMarker): Node[] {
  if (start.parent !== end.parent) {
    console.warn('[remarkTemplateLoopsAST] Markers have different parents, cannot extract nodes');
    return [];
  }

  const parent = start.parent as Parent;
  const startIndex = start.index + 1; // Start AFTER the start marker
  const endIndex = end.index; // End BEFORE the end marker

  if (startIndex >= endIndex) {
    return []; // No nodes between markers
  }

  return parent.children.slice(startIndex, endIndex);
}

/**
 * Sort blocks by depth (innermost first) and position (last first)
 */
function sortBlocksByDepth(blocks: TemplateBlock[]): TemplateBlock[] {
  // For now, simple sort by position (last to first)
  // TODO: Implement proper nesting depth calculation
  return blocks.sort((a, b) => b.startMarker.index - a.startMarker.index);
}

/**
 * Process a loop block using HYBRID approach:
 * 1. Serialize content nodes to markdown string
 * 2. Use existing processTemplateLoops on the string
 * 3. Parse back to AST
 * 4. Replace in tree
 *
 * This preserves metadata on nodes OUTSIDE the loop while processing
 * loop content with the battle-tested string processor.
 */
function processLoopBlock(
  block: TemplateBlock,
  metadata: Record<string, unknown>,
  enableFieldTracking: boolean,
  debug: boolean
): void {
  if (debug) {
    console.log(`[remarkTemplateLoopsAST] Processing loop: {{#${block.variable}}}`);
  }

  // Use HYBRID approach: serialize content, process as string, parse back
  // Step 1: Serialize content nodes to markdown
  const stringifier = unified().use(remarkStringify);
  const contentMarkdown = block.contentNodes
    .map(node =>
      String(stringifier.stringify({ type: 'root', children: [node as RootContent] } as Root))
    )
    .join('\n');

  if (debug) {
    console.log(
      `[remarkTemplateLoopsAST] Content markdown (${contentMarkdown.length} chars):\n${contentMarkdown.substring(0, 200)}...`
    );
  }

  // Step 2: Wrap in loop markers and process with existing string processor
  const loopMarkdown = `{{#${block.variable}}}\n${contentMarkdown}\n{{/${block.variable}}}`;
  const processedMarkdown = processTemplateLoops(
    loopMarkdown,
    metadata,
    undefined,
    enableFieldTracking
  );

  if (debug) {
    console.log(
      `[remarkTemplateLoopsAST] Processed markdown (${processedMarkdown.length} chars):\n${processedMarkdown.substring(0, 200)}...`
    );
  }

  // Step 3: Parse back to AST
  const parser = unified().use(remarkParse);
  const parsedTree = parser.parse(processedMarkdown) as Root;

  if (debug) {
    console.log(`[remarkTemplateLoopsAST] Parsed to ${parsedTree.children.length} nodes`);
  }

  // Step 4: Replace the block with parsed nodes
  replaceBlock(block, parsedTree.children);
}

/**
 * Process a conditional block using HYBRID approach
 */
function processConditionalBlock(
  block: TemplateBlock,
  metadata: Record<string, unknown>,
  enableFieldTracking: boolean,
  debug: boolean
): void {
  if (debug) {
    console.log(`[remarkTemplateLoopsAST] Processing conditional: {{#if ${block.variable}}}`);
  }

  // Use HYBRID approach: serialize, process as string, parse back
  // Step 1: Serialize content nodes
  const stringifier = unified().use(remarkStringify);
  const contentMarkdown = block.contentNodes
    .map(node =>
      String(stringifier.stringify({ type: 'root', children: [node as RootContent] } as Root))
    )
    .join('\n');

  // Step 2: Build conditional markdown
  let conditionalMarkdown = `{{#if ${block.variable}}}\n${contentMarkdown}\n`;

  if (block.elseNodes && block.elseNodes.length > 0) {
    const elseMarkdown = block.elseNodes
      .map(node =>
        String(stringifier.stringify({ type: 'root', children: [node as RootContent] } as Root))
      )
      .join('\n');
    conditionalMarkdown += `{{else}}\n${elseMarkdown}\n`;
  }

  conditionalMarkdown += `{{/if}}`;

  if (debug) {
    console.log(
      `[remarkTemplateLoopsAST] Conditional markdown:\n${conditionalMarkdown.substring(0, 200)}...`
    );
  }

  // Step 3: Process with existing string processor
  const processedMarkdown = processTemplateLoops(
    conditionalMarkdown,
    metadata,
    undefined,
    enableFieldTracking
  );

  if (debug) {
    console.log(
      `[remarkTemplateLoopsAST] Processed result:\n${processedMarkdown.substring(0, 200)}...`
    );
  }

  // Step 4: Parse back to AST
  const parser = unified().use(remarkParse);
  const parsedTree = parser.parse(processedMarkdown) as Root;

  // Step 5: Replace the block
  replaceBlock(block, parsedTree.children);
}

/**
 * Remove a block entirely (markers + content)
 */
function removeBlock(block: TemplateBlock): void {
  const parent = block.startMarker.parent as Parent;
  const startIndex = block.startMarker.index;
  const endIndex = block.endMarker.index;

  // Remove from end to start to preserve indices
  parent.children.splice(startIndex, endIndex - startIndex + 1);
}

/**
 * Replace a block with new nodes
 */
function replaceBlock(block: TemplateBlock, newNodes: Node[]): void {
  const parent = block.startMarker.parent as Parent;
  const startIndex = block.startMarker.index;
  const endIndex = block.endMarker.index;

  // Remove markers + content and insert new nodes
  parent.children.splice(startIndex, endIndex - startIndex + 1, ...(newNodes as RootContent[]));
}

/**
 * Resolve a variable from metadata (supports dot notation)
 */
function resolveVariable(path: string, metadata: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let value: any = metadata;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[part];
  }

  return value;
}

/**
 * Create metadata for a loop item
 */
function createItemMetadata(
  baseMetadata: Record<string, unknown>,
  variable: string,
  item: unknown,
  index: number,
  total: number
): Record<string, unknown> {
  return {
    ...baseMetadata,
    [variable]: item,
    [`${variable}_index`]: index,
    [`${variable}_total`]: total,
    [`${variable}_first`]: index === 0,
    [`${variable}_last`]: index === total - 1,
  };
}

/**
 * Process variables in AST nodes
 *
 * NOTE: This function intentionally does NOT expand {{variable}} patterns.
 * That is handled by remarkTemplateFields which runs AFTER this plugin.
 *
 * This plugin only:
 * 1. Duplicates content nodes for each loop iteration
 * 2. Sets loop context variables (index, first, last, etc.) in metadata
 *
 * The remarkTemplateFields plugin (which runs after) will expand {{variable}}
 * references in each duplicated node.
 */
function processVariablesInNodes(
  nodes: Node[],
  metadata: Record<string, unknown>,
  enableFieldTracking: boolean
): void {
  // Intentionally empty - variables are expanded by remarkTemplateFields
  // which runs after this plugin in the pipeline
}

/**
 * Simple condition evaluator
 *
 * This is a PLACEHOLDER - uses the existing string-based evaluator
 * TODO: Implement true AST-based condition evaluation
 */
function evaluateConditionSimple(condition: string, metadata: Record<string, unknown>): boolean {
  // Simple boolean check for now
  const value = resolveVariable(condition, metadata);

  // Truthy check
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value);
}

export default remarkTemplateLoopsAST;
