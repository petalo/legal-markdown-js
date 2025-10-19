/**
 * Remark Plugin for Import Processing
 *
 * This plugin processes import directives in legal documents using AST processing.
 * Imports allow including content from external files, with support for partial
 * content inclusion, metadata merging, and circular import detection.
 *
 * Features:
 * - File-based imports with @import directive
 * - Partial content imports from files
 * - YAML frontmatter merging from imported files
 * - Circular import detection and prevention
 * - Relative and absolute path resolution
 * - Import caching for performance
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkStringify from 'remark-stringify';
 * import { remarkImports } from './imports';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkImports, {
 *     basePath: './documents',
 *     mergeMetadata: true
 *   })
 *   .use(remarkStringify);
 * ```
 *
 * @module
 */

import { Plugin } from 'unified';
import { Root, Paragraph, Text, Content } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';
import * as fs from 'fs';
import * as path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import { mergeSequentially, MergeOptions, MergeResult } from '../../core/utils/frontmatter-merger';
import type { PluginMetadata } from './types';

/**
 * Maximum header level supported in legal markdown (l. to lllllllll.)
 */
const MAX_HEADER_LEVEL = 9;

/**
 * Options for the remark imports plugin
 * @interface RemarkImportsOptions
 */
export interface RemarkImportsOptions {
  /** Base path for resolving import files */
  basePath?: string;

  /** Whether to merge metadata from imported files */
  mergeMetadata?: boolean;

  /** Enable debug logging */
  debug?: boolean;

  /** Maximum import depth for circular import prevention */
  maxDepth?: number;

  /** Maximum execution time in milliseconds for import processing */
  timeoutMs?: number;

  /** Whether to filter reserved fields from imported metadata */
  filterReserved?: boolean;

  /** Whether to validate type compatibility before merging */
  validateTypes?: boolean;

  /** Whether to log import operations for debugging */
  logImportOperations?: boolean;

  /** Callback for handling imported metadata */
  onMetadataMerged?: (mergedMetadata: Record<string, any>, fromFile: string) => void;

  /** List of files currently being processed (for circular import detection) */
  importStack?: string[];
}

/**
 * Import directive information
 */
interface ImportDirective {
  /** Path to the file to import */
  filePath: string;

  /** Optional section to import from the file */
  section?: string;

  /** Start and end positions in the text */
  start: number;
  end: number;

  /** Full match text */
  fullMatch: string;
}

/**
 * Import processing context
 */
interface ImportContext {
  /** Current import depth */
  depth: number;

  /** Maximum allowed depth */
  maxDepth: number;

  /** Base path for file resolution */
  basePath: string;

  /** Whether to merge metadata */
  mergeMetadata: boolean;

  /** Debug mode flag */
  debug: boolean;

  /** Processing start time for timeout management */
  startTime: number;

  /** Maximum execution time in milliseconds */
  timeoutMs: number;

  /** Whether to filter reserved fields */
  filterReserved: boolean;

  /** Whether to validate type compatibility */
  validateTypes: boolean;

  /** Whether to log import operations */
  logImportOperations: boolean;

  /** Callback for metadata merging */
  onMetadataMerged?: (mergedMetadata: Record<string, any>, fromFile: string) => void;

  /** Stack of files being imported (for circular detection) */
  importStack: string[];

  /** Cache of imported file contents */
  contentCache: Map<string, string>;

  /** List of all imported metadata for sequential merging */
  importedMetadataList: Array<{ metadata: Record<string, any>; source: string }>;

  /** List of successfully imported files */
  importedFiles: string[];

  /** Accumulated metadata from all imports (for mixin expansion) */
  accumulatedMetadata: Record<string, any>;
}

/**
 * Result of import processing
 */
export interface ImportResult {
  /** The processed content */
  content: string;

  /** Merged metadata from all imports */
  mergedMetadata: Record<string, any>;

  /** List of successfully imported files */
  importedFiles: string[];

  /** Detailed merge statistics */
  mergeStats?: {
    totalImports: number;
    propertiesAdded: number;
    conflictsResolved: number;
    reservedFieldsFiltered: number;
    addedFields: string[];
    conflictedFields: string[];
    filteredFields: string[];
  };
}

/**
 * Remark plugin for processing imports
 *
 * This plugin identifies and processes import directives in markdown text,
 * loading content from external files and optionally merging their metadata.
 *
 * @param options - Configuration options for import processing
 * @returns Remark plugin transformer function
 */
export const remarkImports: Plugin<[RemarkImportsOptions], Root> = options => {
  const {
    basePath = '.',
    mergeMetadata = true,
    debug = false,
    maxDepth = 10,
    timeoutMs = 30000,
    filterReserved = true,
    validateTypes = true,
    logImportOperations = false,
    onMetadataMerged,
    importStack = [],
  } = options;

  return async (tree: Root) => {
    const startTime = Date.now();

    if (debug) {
      console.log('[remarkImports] Processing imports with options:', {
        basePath,
        mergeMetadata,
        maxDepth,
        timeoutMs,
        filterReserved,
        validateTypes,
        currentDepth: importStack.length,
      });
    }

    const context: ImportContext = {
      depth: importStack.length,
      maxDepth,
      basePath,
      mergeMetadata,
      debug,
      startTime,
      timeoutMs,
      filterReserved,
      validateTypes,
      logImportOperations,
      onMetadataMerged,
      importStack: [...importStack],
      contentCache: new Map(),
      importedMetadataList: [],
      importedFiles: [],
      accumulatedMetadata: {}, // Initialize with empty metadata
    };

    // Collect all nodes that need replacement
    type NodeReplacement = {
      parent: Paragraph | Root;
      index: number;
      nodes: Content[];
    };
    const replacements: NodeReplacement[] = [];

    // Process all paragraph nodes that might contain import directives
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || index === undefined) return;

      // Check if any text children contain import directives
      for (const child of node.children) {
        if (child.type === 'text') {
          const directives = extractImportDirectives(child.value);
          if (directives.length > 0) {
            // This paragraph contains imports - we'll need to process it
            replacements.push({
              parent: parent as Paragraph | Root,
              index,
              nodes: [], // Will be filled in later
            });
            return SKIP; // Skip children
          }
        }
      }
    });

    // Process replacements (parse imported content to AST)
    for (const replacement of replacements) {
      const paragraph = replacement.parent.children[replacement.index] as Paragraph;
      const processedNodes = await processParagraphWithImports(paragraph, context);
      replacement.nodes = processedNodes;
    }

    // Apply replacements (in reverse order to maintain indices)
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { parent, index, nodes } = replacements[i];
      parent.children.splice(index, 1, ...nodes);
    }

    // Perform sequential merge of all imported metadata at the end
    if (context.mergeMetadata && context.importedMetadataList.length > 0) {
      const mergedResult = performSequentialMerge(context);
      (tree as any)._importedMetadata = mergedResult.metadata;
      (tree as any)._importStats = mergedResult.stats;
    }
  };
};

/**
 * Process a paragraph containing import directives and return AST nodes
 *
 * This function replaces the old text-based import logic. Instead of replacing
 * @import directives with plain text (which causes HTML escaping), it parses
 * imported content into proper AST nodes.
 *
 * @param paragraph - Paragraph node containing import directives
 * @param context - Import processing context
 * @returns Array of Content nodes to replace the paragraph
 */
async function processParagraphWithImports(
  paragraph: Paragraph,
  context: ImportContext
): Promise<Content[]> {
  const results: Content[] = [];

  // Process each child in the paragraph
  for (const child of paragraph.children) {
    if (child.type !== 'text') {
      results.push(child);
      continue;
    }

    const text = child.value;
    const directives = extractImportDirectives(text);

    if (directives.length === 0) {
      // No imports, keep the text as is
      results.push(child);
      continue;
    }

    if (context.debug) {
      console.log(`[remarkImports] Found ${directives.length} import directives`);
    }

    // Process each import directive and build AST nodes
    let lastIndex = 0;
    for (const directive of directives) {
      // Add text before the import directive (if any)
      if (directive.start > lastIndex) {
        const beforeText = text.substring(lastIndex, directive.start);
        if (beforeText.trim()) {
          results.push({
            type: 'text',
            value: beforeText,
          });
        }
      }

      // Process the import and get AST nodes
      const importedNodes = await processImportDirectiveToAST(directive, context);
      results.push(...importedNodes);

      lastIndex = directive.end;
    }

    // Add remaining text after last import (if any)
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex);
      if (afterText.trim()) {
        results.push({
          type: 'text',
          value: afterText,
        });
      }
    }
  }

  return results;
}

/**
 * Extract import directives from text
 */
function extractImportDirectives(text: string): ImportDirective[] {
  const directives: ImportDirective[] = [];

  // Regex to match import directives: @import file.md or @import file.md#section
  const importRegex = /@import\s+([^\s#]+)(?:#([^\s]+))?/g;

  let match;
  while ((match = importRegex.exec(text)) !== null) {
    const [fullMatch, filePath, section] = match;

    directives.push({
      filePath: filePath.trim(),
      section: section?.trim(),
      start: match.index,
      end: match.index + fullMatch.length,
      fullMatch,
    });
  }

  return directives;
}

/**
 * Parse imported content into AST nodes
 *
 * This function parses markdown content into proper AST nodes instead of plain text,
 * which preserves HTML structure and prevents HTML comments/tags from being escaped.
 *
 * @param content - Markdown content to parse
 * @returns Array of AST nodes (Content[])
 */
async function parseImportedContentToAST(content: string): Promise<Content[]> {
  // Create a minimal unified processor with just remark-parse
  const processor = unified().use(remarkParse);

  // Parse the content to get AST
  const tree = processor.parse(content) as Root;

  // Return the children nodes (not the root itself)
  // This allows us to insert them into the parent tree
  return tree.children;
}

/**
 * Process an import directive and return AST nodes
 *
 * This replaces the old processImportDirective() which returned plain text.
 * By returning AST nodes, we preserve HTML structure and prevent escaping.
 *
 * @param directive - Import directive information
 * @param context - Import processing context
 * @returns Array of AST nodes from the imported content
 */
async function processImportDirectiveToAST(
  directive: ImportDirective,
  context: ImportContext
): Promise<Content[]> {
  if (context.depth >= context.maxDepth) {
    console.warn(
      `[remarkImports] Maximum import depth (${context.maxDepth}) reached for file "${directive.filePath}"`
    );
    // Return the original directive as text
    return [{ type: 'text', value: directive.fullMatch }];
  }

  // Resolve file path
  const absolutePath = path.resolve(context.basePath, directive.filePath);
  const normalizedPath = path.normalize(absolutePath);

  // Check for circular imports
  if (context.importStack.includes(normalizedPath)) {
    console.warn(`[remarkImports] Circular import detected: ${normalizedPath}`);
    return [{ type: 'text', value: directive.fullMatch }];
  }

  if (context.debug) {
    console.log(
      `[remarkImports] Processing import "${directive.filePath}" (resolved: ${normalizedPath})`
    );
  }

  // Load file content
  const fileContent = loadFileContent(normalizedPath, context);

  if (!fileContent) {
    console.warn(`[remarkImports] Import file not found: ${directive.filePath}`);
    return [{ type: 'text', value: directive.fullMatch }];
  }

  // Parse YAML frontmatter if mergeMetadata is enabled
  let contentToImport = fileContent;
  if (context.mergeMetadata) {
    const { content, metadata } = parseYamlFrontMatter(fileContent, false);
    contentToImport = content;

    if (Object.keys(metadata).length > 0) {
      // Add metadata to list for sequential merging later
      context.importedMetadataList.push({
        metadata,
        source: normalizedPath,
      });

      // Accumulate metadata for mixin expansion in imported content
      // Merge the new metadata into accumulated metadata (shallow merge)
      context.accumulatedMetadata = {
        ...context.accumulatedMetadata,
        ...metadata,
      };

      // Track imported file
      if (!context.importedFiles.includes(normalizedPath)) {
        context.importedFiles.push(normalizedPath);
      }

      if (context.debug) {
        console.log(
          `[remarkImports] Collected metadata from ${directive.filePath}:`,
          Object.keys(metadata)
        );
      }
    }
  }

  // Extract section if specified
  if (directive.section) {
    contentToImport = extractSection(contentToImport, directive.section, context.debug);
  }

  // Process nested imports in the content
  const nestedContext: ImportContext = {
    ...context,
    depth: context.depth + 1,
    importStack: [...context.importStack, normalizedPath],
    basePath: path.dirname(normalizedPath), // Update base path for relative imports
  };

  const processedContent = await processNestedImportsToAST(contentToImport, nestedContext);

  // Expand mixins using accumulated metadata
  // This allows mixins defined in imported file frontmatter to work
  if (context.mergeMetadata && Object.keys(context.accumulatedMetadata).length > 0) {
    return await expandMixinsInAST(processedContent, context.accumulatedMetadata);
  }

  return processedContent;
}

/**
 * Perform sequential merge of all collected metadata
 */
function performSequentialMerge(context: ImportContext): MergeResult {
  if (context.importedMetadataList.length === 0) {
    return {
      metadata: {},
      stats: undefined,
    };
  }

  // Check timeout before starting merge
  if (Date.now() - context.startTime > context.timeoutMs) {
    throw new Error(
      `Import processing timed out after ${context.timeoutMs}ms. ` +
        'This may indicate complex nested imports or slow file operations.'
    );
  }

  // Prepare merge options
  const mergeOptions: MergeOptions = {
    filterReserved: context.filterReserved,
    validateTypes: context.validateTypes,
    logOperations: context.logImportOperations,
    includeStats: true,
    timeoutMs: Math.max(1000, context.timeoutMs - (Date.now() - context.startTime)),
  };

  // Extract metadata array for merging
  const metadataList = context.importedMetadataList.map(item => item.metadata);

  if (context.debug) {
    console.log(
      `[remarkImports] Performing sequential merge of ${metadataList.length} metadata objects`
    );
  }

  try {
    // Use sequential merge with initial empty metadata (source always wins)
    const result = mergeSequentially({}, metadataList, mergeOptions);

    // Call onMetadataMerged callback if provided
    if (context.onMetadataMerged && Object.keys(result.metadata).length > 0) {
      context.onMetadataMerged(result.metadata, 'merged-imports');
    }

    return result;
  } catch (error) {
    if (context.debug) {
      console.warn('[remarkImports] Sequential merge failed:', error);
    }
    throw error;
  }
}

/**
 * Load file content with caching
 */
function loadFileContent(filePath: string, context: ImportContext): string | null {
  // Check cache first
  if (context.contentCache.has(filePath)) {
    return context.contentCache.get(filePath)!;
  }

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      context.contentCache.set(filePath, content);
      return content;
    }
  } catch (error) {
    if (context.debug) {
      console.warn(`[remarkImports] Failed to load import file "${filePath}":`, error);
    }
  }

  return null;
}

/**
 * Extract a specific section from content
 */
function extractSection(content: string, sectionName: string, debug: boolean): string {
  // Look for header with the section name
  const lines = content.split('\n');
  let sectionStart = -1;
  let sectionEnd = lines.length;
  let sectionLevel = 0;

  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a header line
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const [, hashes, title] = headerMatch;
      const level = hashes.length;

      if (title.toLowerCase() === sectionName.toLowerCase()) {
        sectionStart = i + 1; // Start after the header
        sectionLevel = level;
        if (debug) {
          console.log(`[remarkImports] Found section '${sectionName}' at line ${i}`);
        }
        break;
      }
    }
  }

  if (sectionStart === -1) {
    if (debug) {
      console.warn(`[remarkImports] Section '${sectionName}' not found`);
    }
    return content; // Return full content if section not found
  }

  // Find section end (next header of same or higher level)
  for (let i = sectionStart; i < lines.length; i++) {
    const line = lines[i].trim();

    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const [, hashes] = headerMatch;
      const level = hashes.length;

      if (level <= sectionLevel) {
        sectionEnd = i;
        break;
      }
    }
  }

  return lines.slice(sectionStart, sectionEnd).join('\n').trim();
}

// expandMixinsWithTracking() removed; see PR for details.

/**
 * Process nested imports in content and return AST nodes
 *
 * This replaces the old processNestedImports() which worked with text.
 * By returning AST nodes, HTML comments and tags are preserved properly.
 *
 * @param content - Markdown content that may contain import directives
 * @param context - Import processing context
 * @returns Array of AST nodes with imports resolved
 */
async function processNestedImportsToAST(
  content: string,
  context: ImportContext
): Promise<Content[]> {
  // Parse the content to AST first
  const nodes = await parseImportedContentToAST(content);

  // Check if any of the nodes contain import directives
  const hasImports = nodes.some(node => {
    if (node.type === 'paragraph') {
      return (node as Paragraph).children.some(
        child => child.type === 'text' && extractImportDirectives(child.value).length > 0
      );
    }
    return false;
  });

  if (!hasImports) {
    // No nested imports, return as is
    return nodes;
  }

  // Process paragraphs with imports
  const processedNodes: Content[] = [];
  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const paragraph = node as Paragraph;
      const hasDirectives = paragraph.children.some(
        child => child.type === 'text' && extractImportDirectives(child.value).length > 0
      );

      if (hasDirectives) {
        // Process this paragraph's imports
        const importedNodes = await processParagraphWithImports(paragraph, context);
        processedNodes.push(...importedNodes);
      } else {
        processedNodes.push(node);
      }
    } else {
      processedNodes.push(node);
    }
  }

  return processedNodes;
}

/**
 * Expand mixins in AST nodes
 *
 * This function processes {{field}} patterns in text nodes within the AST,
 * resolving them using the provided metadata and wrapping them with HTML
 * for field tracking.
 *
 * @param nodes - AST nodes that may contain mixin patterns
 * @param metadata - Metadata to resolve field values
 * @returns AST nodes with mixins expanded
 */
async function expandMixinsInAST(
  nodes: Content[],
  metadata: Record<string, any>
): Promise<Content[]> {
  const processedNodes: Content[] = [];

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      // Process text children in the paragraph
      const paragraph = node as Paragraph;
      const processedChildren: Content[] = [];

      for (const child of paragraph.children) {
        if (child.type === 'text') {
          // Let remarkTemplateFields handle all mixin processing with proper metadata
          processedChildren.push(child);
        } else {
          processedChildren.push(child);
        }
      }

      processedNodes.push({
        ...paragraph,
        children: processedChildren,
      } as Paragraph);
    } else {
      processedNodes.push(node);
    }
  }

  return processedNodes;
}

/**
 * Metadata for remarkImports plugin
 *
 * Dependencies:
 * - Must run BEFORE remarkTemplateFields (fields in imported content need processing)
 * - Must run BEFORE remarkLegalHeadersParser (legal headers in imported content need parsing)
 * - Must run BEFORE remarkFieldTracking (imported fields need tracking)
 */
export const remarkImportsMetadata: PluginMetadata = {
  name: 'remarkImports',
  description: 'Process @import directives and insert content as AST nodes',
  runBefore: ['remarkTemplateFields', 'remarkLegalHeadersParser', 'remarkFieldTracking'],
  required: false,
  version: '2.0.0', // Version 2.0 uses AST-based insertion
};

export default remarkImports;
