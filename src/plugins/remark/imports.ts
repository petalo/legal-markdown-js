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
import { Root, Paragraph, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import * as fs from 'fs';
import * as path from 'path';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import { mergeSequentially, MergeOptions, MergeResult } from '../../core/utils/frontmatter-merger';
import { processMixins } from '../../core/processors/mixin-processor';

/**
 * Maximum header level supported in legal markdown (l. to lllllllll.)
 */
const MAX_HEADER_LEVEL = 9;

/**
 * Pattern to detect function calls in field expressions (e.g., formatPercent(...))
 */
const FUNCTION_CALL_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/;

/**
 * Pattern to detect conditional expressions in field expressions (e.g., field ? a : b)
 */
const CONDITIONAL_PATTERN = /\?.*:/;

/**
 * Pattern to match escaped less-than characters from remarkStringify
 */
const ESCAPED_LT_PATTERN = /\\</g;

/**
 * Pattern to match escaped greater-than characters from remarkStringify
 */
const ESCAPED_GT_PATTERN = /\\>/g;

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

  return (tree: Root) => {
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

    // Process all text nodes that might contain import directives
    visit(tree, node => {
      if (node.type === 'text') {
        processTextNode(node as Text, context);
      } else if (node.type === 'paragraph') {
        processParagraphNode(node as Paragraph, context);
      }
    });

    // Perform sequential merge of all imported metadata at the end
    if (context.mergeMetadata && context.importedMetadataList.length > 0) {
      const mergedResult = performSequentialMerge(context);
      (tree as any)._importedMetadata = mergedResult.metadata;
      (tree as any)._importStats = mergedResult.stats;
    }
  };
};

/**
 * Process a text node for import directives
 */
function processTextNode(node: Text, context: ImportContext) {
  const originalText = node.value;
  const importDirectives = extractImportDirectives(originalText);

  if (importDirectives.length === 0) {
    return;
  }

  if (context.debug) {
    console.log(`[remarkImports] Found ${importDirectives.length} import directives in text node`);
  }

  // Process directives in reverse order to maintain correct positions
  let processedText = originalText;
  for (let i = importDirectives.length - 1; i >= 0; i--) {
    const directive = importDirectives[i];
    const result = processImportDirective(directive, context);

    // Replace the directive with the result
    processedText =
      processedText.substring(0, directive.start) + result + processedText.substring(directive.end);
  }

  node.value = processedText;
}

/**
 * Process a paragraph node for import directives
 */
function processParagraphNode(node: Paragraph, context: ImportContext) {
  // Process each text child in the paragraph
  node.children.forEach(child => {
    if (child.type === 'text') {
      processTextNode(child as Text, context);
    }
  });
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
 * Process an import directive
 */
function processImportDirective(directive: ImportDirective, context: ImportContext): string {
  if (context.depth >= context.maxDepth) {
    console.warn(
      `[remarkImports] Maximum import depth (${context.maxDepth}) reached for file "${directive.filePath}"`
    );
    return directive.fullMatch; // Return original directive
  }

  // Resolve file path
  const absolutePath = path.resolve(context.basePath, directive.filePath);
  const normalizedPath = path.normalize(absolutePath);

  // Check for circular imports
  if (context.importStack.includes(normalizedPath)) {
    console.warn(`[remarkImports] Circular import detected: ${normalizedPath}`);
    return directive.fullMatch; // Return original directive
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
    return directive.fullMatch; // Return original directive
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

  // Process nested imports
  const nestedContext: ImportContext = {
    ...context,
    depth: context.depth + 1,
    importStack: [...context.importStack, normalizedPath],
    basePath: path.dirname(normalizedPath), // Update base path for relative imports
  };

  return processNestedImports(contentToImport, nestedContext);
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

/**
 * Expand mixins with field tracking spans
 *
 * Expands {{field}} patterns and wraps the results in HTML spans for field tracking,
 * similar to what remarkTemplateFields does. This ensures imported mixins have proper
 * field highlighting support.
 *
 * @param content - Content with {{field}} patterns
 * @param metadata - Metadata to resolve field values
 * @returns Content with expanded mixins wrapped in tracking spans
 */
function expandMixinsWithTracking(content: string, metadata: Record<string, any>): string {
  const mixinPattern = /\{\{([^}]+)\}\}/g;

  return content.replace(mixinPattern, (match, fieldExpression) => {
    const trimmedField = fieldExpression.trim();

    // Try to resolve the field value
    let value: any;
    let hasValue = false;

    try {
      // Use processMixins to handle the complex logic (helpers, dot notation, etc.)
      const expandedValue = processMixins(match, metadata, {});

      // Check if the mixin was actually expanded (processMixins returns original if not found)
      if (expandedValue !== match) {
        value = expandedValue;
        hasValue = true;
      }
    } catch (error) {
      // If resolution fails, leave as is for remarkTemplateFields to process
    }

    // Only expand mixins that we found in imported metadata
    // Leave others unchanged so remarkTemplateFields can process them with main metadata
    if (hasValue) {
      // Detect if this is a formula/helper (contains function call) or a simple field
      // Helpers: formatPercent(...), formatDate(...), etc.
      // Conditionals: field ? value1 : value2
      const hasLogic =
        FUNCTION_CALL_PATTERN.test(trimmedField) || // Function call: formatPercent(...)
        CONDITIONAL_PATTERN.test(trimmedField); // Conditional: field ? a : b

      // Use appropriate CSS class based on whether it's a formula or simple field
      const cssClass = hasLogic ? 'legal-field highlight' : 'legal-field imported-value';

      // Value was found in imported metadata - expand and track
      return `<span class="${cssClass}" data-field="${trimmedField}">${value}</span>`;
    } else {
      // Value not in imported metadata - leave unchanged for main pipeline processing
      return match;
    }
  });
}

/**
 * Strip HTML comments and wrapper tags from imported content
 *
 * This is a temporary workaround because remarkImports inserts content as plain text
 * (not AST nodes), which causes HTML to be escaped when rendered.
 *
 * We strip:
 * - HTML comments: <!-- ... -->
 * - Standalone wrapper tags WITHOUT attributes: <p>, <div>, <span> (only when wrapping headers)
 * - We PRESERVE tags WITH attributes (class, id, style) as they may be needed for styling
 *
 * TODO: Fix the root cause by making remarkImports insert content as proper AST nodes
 * See: https://github.com/petalo/legal-markdown-js/issues/119
 */
function stripHtmlComments(content: string): string {
  let processed = content;

  // Remove HTML comments (<!-- ... -->)
  // Use non-greedy match to handle multiple comments on same line
  processed = processed.replace(/<!--[\s\S]*?-->/g, '');

  // Remove standalone wrapper tags WITHOUT attributes that contain legal headers
  // Pattern: <p>\nll. Header\n</p> (but NOT <p class="...">\nll. Header\n</p>)
  // This prevents plain tags from being escaped while preserving styled tags
  // The negative lookahead (?!\s+[a-z]) ensures we only match tags without attributes
  const headerPattern = `l{1,${MAX_HEADER_LEVEL}}`;
  processed = processed.replace(
    new RegExp(
      `<(p|div|span)(?!\\s+[a-z])\\s*>\\s*(${headerPattern}\\.\\s+[^\\n]+)\\s*<\\/\\1>`,
      'gi'
    ),
    '$2'
  );

  // Also remove wrapper tags on same line: <p>ll. Header</p> (but not <p class="...">ll. Header</p>)
  processed = processed.replace(
    new RegExp(`<(p|div|span)(?!\\s+[a-z])\\s*>(${headerPattern}\\.\\s+[^<]+)<\\/\\1>`, 'gi'),
    '$2'
  );

  return processed;
}

/**
 * Process nested imports in content
 */
function processNestedImports(content: string, context: ImportContext): string {
  const importDirectives = extractImportDirectives(content);

  let processedContent = content;

  if (importDirectives.length > 0) {
    // Process directives in reverse order to maintain correct positions
    for (let i = importDirectives.length - 1; i >= 0; i--) {
      const directive = importDirectives[i];
      const result = processImportDirective(directive, context);

      // Replace the directive with the result
      processedContent =
        processedContent.substring(0, directive.start) +
        result +
        processedContent.substring(directive.end);
    }
  }

  // Expand mixins using accumulated metadata from imported files
  // This allows mixins defined in imported file frontmatter to work
  // We use processMixins but then wrap values in HTML spans for field tracking
  if (context.mergeMetadata && Object.keys(context.accumulatedMetadata).length > 0) {
    processedContent = expandMixinsWithTracking(processedContent, context.accumulatedMetadata);
  }

  // Strip HTML comments from imported content to prevent escaping
  // (temporary workaround - see stripHtmlComments function comment)
  return stripHtmlComments(processedContent);
}

export default remarkImports;
