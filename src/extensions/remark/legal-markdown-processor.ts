/**
 * Legal Markdown Processor with Remark Pipeline
 *
 * This module provides a comprehensive processor for Legal Markdown documents
 * using the remark ecosystem. It combines multiple remark plugins to provide
 * AST-based processing that avoids text contamination issues.
 *
 * Features:
 * - Complete remark pipeline with all Legal Markdown plugins
 * - Field tracking integration with automatic clearing
 * - Cross-reference processing with section numbering
 * - Metadata extraction and processing
 * - Comprehensive error handling and debugging
 * - Compatible with existing Legal Markdown API
 *
 * @example
 * ```typescript
 * import { processLegalMarkdownWithRemark } from './legal-markdown-processor';
 *
 * const result = await processLegalMarkdownWithRemark(content, {
 *   basePath: './documents',
 *   enableFieldTracking: true,
 *   debug: true
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // Extracted metadata
 * console.log(result.fieldReport); // Field tracking report
 * ```
 *
 * @module
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Unsafe } from 'mdast-util-to-markdown';
import {
  remarkCrossReferences,
  remarkFieldTracking,
  remarkTemplateFields,
  remarkHeaders,
  remarkClauses,
  remarkMixins,
  remarkImports,
  remarkLegalHeadersParser,
  remarkDates,
} from '../../plugins/remark/index';
import { PluginOrderValidator } from '../../plugins/remark/plugin-order-validator';
import { GLOBAL_PLUGIN_REGISTRY } from '../../plugins/remark/plugin-metadata-registry';
import remarkSignatureLines from '../../plugins/remark/signature-lines';
import { remarkDebugAST } from '../../plugins/remark/debug-ast';
import { fieldTracker } from '../tracking/field-tracker';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import { processTemplateLoops, detectSyntaxType } from '../template-loops';
import { exportMetadata } from '../../core/exporters/metadata-exporter';
import type { MarkdownString } from '../../types/content-formats';
import { asMarkdown } from '../../types/content-formats';

/**
 * Unsafe patterns for markdown serialization, excluding underscore patterns.
 *
 * Based on mdast-util-to-markdown@2.1.2 default unsafe patterns, with
 * underscore patterns removed since we use asterisks for emphasis/strong.
 *
 * Why hardcoded instead of imported:
 * - The lib/unsafe.js file is not exported in package.json exports
 * - Dynamic import would fail in ESM environments
 * - These patterns are stable across mdast-util-to-markdown versions
 *
 * According to CommonMark spec 0.31.2, underscores between alphanumeric
 * characters or between other underscores cannot create emphasis (they are
 * both left-flanking AND right-flanking), so they don't need to be escaped.
 *
 * Source: https://github.com/syntax-tree/mdast-util-to-markdown/blob/2.1.2/lib/unsafe.js
 * Last reviewed: 2025-01-02 (mdast-util-to-markdown@2.1.2)
 *
 * Excluded patterns:
 * - {atBreak: true, character: '_'}
 * - {character: '_', inConstruct: 'phrasing', notInConstruct: ['autolink', 'destinationLiteral', ...]}
 */
const unsafeWithoutUnderscores: Array<Unsafe> = [
  { character: '\t', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: '\t', before: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: '\t', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde'] },
  {
    character: '\r',
    inConstruct: [
      'codeFencedLangGraveAccent',
      'codeFencedLangTilde',
      'codeFencedMetaGraveAccent',
      'codeFencedMetaTilde',
      'destinationLiteral',
      'headingAtx',
    ],
  },
  {
    character: '\n',
    inConstruct: [
      'codeFencedLangGraveAccent',
      'codeFencedLangTilde',
      'codeFencedMetaGraveAccent',
      'codeFencedMetaTilde',
      'destinationLiteral',
      'headingAtx',
    ],
  },
  { character: ' ', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ' ', before: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ' ', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde'] },
  {
    character: '!',
    after: '\\[',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { character: '"', inConstruct: 'titleQuote' },
  { atBreak: true, character: '#' },
  { character: '#', inConstruct: 'headingAtx', after: '(?:[\r\n]|$)' },
  { character: '&', after: '[#A-Za-z]', inConstruct: 'phrasing' },
  { character: "'", inConstruct: 'titleApostrophe' },
  { character: '(', inConstruct: 'destinationRaw' },
  {
    before: '\\]',
    character: '(',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { atBreak: true, before: '\\d+', character: ')' },
  { character: ')', inConstruct: 'destinationRaw' },
  { atBreak: true, character: '*', after: '(?:[ \t\r\n*])' },
  {
    character: '*',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { atBreak: true, character: '+', after: '(?:[ \t\r\n])' },
  { atBreak: true, character: '-', after: '(?:[ \t\r\n-])' },
  { atBreak: true, before: '\\d+', character: '.', after: '(?:[ \t\r\n]|$)' },
  { atBreak: true, character: '<', after: '[!/?A-Za-z]' },
  {
    character: '<',
    after: '[!/?A-Za-z]',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { character: '<', inConstruct: 'destinationLiteral' },
  { atBreak: true, character: '=' },
  { atBreak: true, character: '>' },
  { character: '>', inConstruct: 'destinationLiteral' },
  { atBreak: true, character: '[' },
  {
    character: '[',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { character: '[', inConstruct: ['label', 'reference'] },
  { character: '\\', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ']', inConstruct: ['label', 'reference'] },
  // NOTE: Underscore patterns are intentionally excluded here
  // Original patterns were:
  // {atBreak: true, character: '_'},
  // {character: '_', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans},
  { atBreak: true, character: '`' },
  { character: '`', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedMetaGraveAccent'] },
  {
    character: '`',
    inConstruct: 'phrasing',
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe',
    ],
  },
  { atBreak: true, character: '~' },
];

/**
 * Pre-process content to escape underscores inside {{}} to prevent
 * markdown parser from interpreting them as italic delimiters
 *
 * **Problem**: Field names with underscores like `{{counterparty.legal_name}}`
 * would be parsed by remark as `{{counterparty.legal*name}}` because markdown
 * treats `_text_` as emphasis (converted to `*text*` during parsing).
 *
 * **Solution**: Escape underscores to `\_` before markdown parsing. The escaped
 * underscores are later unescaped in:
 * - `remarkTemplateFields` (src/plugins/remark/template-fields.ts)
 * - `parseMarkdownInlineFormatting` (src/plugins/remark/legal-headers-parser.ts)
 *
 * @see https://github.com/petalo/legal-markdown-js/issues/139
 * @see src/plugins/remark/template-fields.ts - Unescapes underscores during field extraction
 * @see src/plugins/remark/legal-headers-parser.ts - Excludes template fields from emphasis parsing
 *
 * @param content - Raw markdown content
 * @returns Content with underscores escaped for legacy syntax, unchanged for Handlebars
 *
 * @example
 * ```typescript
 * // Legacy syntax - escapes underscores
 * escapeTemplateUnderscores('{{legal_name}}') // => '{{legal\_name}}'
 *
 * // Handlebars syntax - no escaping needed
 * escapeTemplateUnderscores('{{titleCase section_name}}') // => '{{titleCase section_name}}'
 * escapeTemplateUnderscores('{{#if test}}')  // => '{{#if test}}' (unchanged)
 * ```
 */
function escapeTemplateUnderscores(content: string): string {
  // Detect if content uses Handlebars syntax
  const syntaxType = detectSyntaxType(content);

  // Skip escaping for Handlebars and mixed syntax - underscores are valid identifiers
  // and Handlebars handles them correctly without markdown interference.
  // For mixed syntax, we prefer not to escape to avoid breaking Handlebars variables.
  if (syntaxType === 'handlebars' || syntaxType === 'mixed') {
    return content;
  }

  // For pure legacy syntax, escape underscores to prevent markdown italic parsing
  // Match {{...}} patterns and escape underscores inside them
  return content.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
    const trimmed = inner.trim();

    // Don't escape loop/conditional markers - these are processed by processTemplateLoops
    // and should not have their syntax modified
    if (
      trimmed.startsWith('#') || // {{#if}}, {{#each}}, etc.
      trimmed.startsWith('/') || // {{/if}}, {{/each}}, etc.
      trimmed === 'else' // {{else}}
    ) {
      return match;
    }

    // Escape underscores to prevent markdown parser from interpreting them as
    // italic delimiters. These will be unescaped during template field expansion.
    const escaped = inner.replace(/_/g, '\\_');
    return `{{${escaped}}}`;
  });
}

/**
 * Pre-process optional clauses [content]{condition} before remark parsing
 *
 * This function processes optional clauses BEFORE the content is parsed by remark,
 * which allows clauses with multi-line content and markdown formatting to work correctly.
 * Without this pre-processing, remark would split the clause across multiple AST nodes,
 * making it impossible for the remarkClauses plugin to find and process them.
 *
 * @param content - The markdown content with optional clauses
 * @param metadata - Document metadata for evaluating conditions
 * @param debug - Enable debug logging
 * @returns Content with optional clauses processed
 */
function preprocessOptionalClauses(
  content: string,
  metadata: Record<string, any>,
  debug: boolean = false
): string {
  // Regex to match optional clauses: [content]{condition}
  // Uses dotall mode (s flag) to match across newlines
  // eslint-disable-next-line no-useless-escape
  const clauseRegex = /\[([^\[\]]*(?:\n[^\[\]]*)*?)\]\{([^{}]+?)\}/gs;

  let processedContent = content;
  const matches: Array<{ full: string; content: string; condition: string; index: number }> = [];

  // Collect all matches first (to avoid mutation during iteration)
  let match;
  while ((match = clauseRegex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      content: match[1],
      condition: match[2].trim(),
      index: match.index,
    });
  }

  if (debug && matches.length > 0) {
    console.log(`[preprocessOptionalClauses] Found ${matches.length} optional clauses`);
  }

  // Process matches in reverse order to maintain correct positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const { full, content: clauseContent, condition, index } = matches[i];

    // Evaluate the condition
    const conditionValue = metadata[condition];
    const shouldInclude = Boolean(conditionValue);

    if (debug) {
      console.log(
        `[preprocessOptionalClauses] Condition "${condition}" = ${conditionValue} (include: ${shouldInclude})`
      );
    }

    // Replace the clause with its content if true, or remove it if false
    const replacement = shouldInclude ? clauseContent : '';
    processedContent =
      processedContent.substring(0, index) +
      replacement +
      processedContent.substring(index + full.length);
  }

  return processedContent;
}

/**
 * Configuration options for the Legal Markdown processor
 * @interface LegalMarkdownProcessorOptions
 */
export interface LegalMarkdownProcessorOptions {
  /** Base path for resolving relative imports */
  basePath?: string;

  /** Enable field tracking and highlighting */
  enableFieldTracking?: boolean;

  /** Enable debug logging */
  debug?: boolean;

  /** Validate plugin execution order and log warnings */
  validatePluginOrder?: boolean;

  /** Additional metadata to merge with document metadata */
  additionalMetadata?: Record<string, any>;

  /** Custom field patterns for field tracking */
  fieldPatterns?: string[];

  /** Disable specific processing steps */
  disableCrossReferences?: boolean;
  disableFieldTracking?: boolean;

  /** Metadata export options */
  exportMetadata?: boolean;
  exportFormat?: 'yaml' | 'json';
  exportPath?: string;

  /** Processing flags (for compatibility with legacy processor) */
  yamlOnly?: boolean;
  noHeaders?: boolean;
  noClauses?: boolean;
  noReferences?: boolean;
  noImports?: boolean;
  noMixins?: boolean;
  noReset?: boolean;
  noIndent?: boolean;
  throwOnYamlError?: boolean;
}

/**
 * Result from Legal Markdown processing
 * @interface LegalMarkdownProcessorResult
 */
export interface LegalMarkdownProcessorResult {
  /** Processed markdown content (always Markdown format, never HTML) */
  content: MarkdownString;

  /** Extracted and processed metadata */
  metadata: Record<string, any>;

  /** Cached AST for Phase 3 format generation (optional) */
  ast?: Root;

  /** Array of exported metadata files */
  exportedFiles?: string[];

  /** Field tracking report (if enabled) */
  fieldReport?: {
    totalFields: number;
    uniqueFields: number;
    fields: Map<string, any>;
  };

  /** Processing statistics and debugging info */
  stats: {
    processingTime: number;
    pluginsUsed: string[];
    crossReferencesFound: number;
    fieldsTracked: number;
  };

  /** Any warnings or non-fatal errors encountered */
  warnings: string[];
}

/**
 * Create a configured remark processor for Legal Markdown
 *
 * This function assembles a unified processor with all the necessary remark plugins
 * for Legal Markdown processing. Plugins are added in a specific order to ensure
 * proper processing dependencies:
 *
 * **CRITICAL PLUGIN ORDER:**
 * 1. Imports - MUST be first to load all content before any transformation
 * 2. Legal Headers Parser - MUST be after imports to convert headers in imported files
 * 3. Mixins - Content expansion before other processing
 * 4. Clauses - Conditional content
 * 5. Template fields - Field processing and tracking
 * 6. Cross-references - Reference resolution
 * 7. Headers - Final structure processing and numbering
 *
 * **WARNING:** Changing this order can break functionality:
 * - If Legal Headers Parser runs before Imports, headers in imported files won't be converted
 * - If Cross-references runs before Headers, section numbering won't be available
 * - If Mixins runs before Imports, variable expansion won't work for imported content
 *
 * @param metadata - Document metadata from YAML frontmatter and additional sources
 * @param options - Configuration options for processing
 * @returns Configured unified processor ready for content processing
 * @internal
 */
function createLegalMarkdownProcessor(
  metadata: Record<string, any>,
  options: LegalMarkdownProcessorOptions
) {
  const processor = unified().use(remarkParse);

  // Track plugin names for order validation
  const pluginOrder: string[] = [];

  // Step 1: Add imports plugin FIRST - must load all content before any transformation
  // This ensures that imported files are loaded before any other processing
  if (!options.noImports) {
    processor.use(remarkImports, {
      basePath: options.basePath || '.',
      mergeMetadata: true,
      debug: options.debug,
      maxDepth: 10,
      timeoutMs: 30000,
      filterReserved: true,
      validateTypes: true,
      logImportOperations: options.debug,
    });
  }

  // Add clauses plugin (conditional content processing)
  // IMPORTANT: Must run BEFORE remarkLegalHeadersParser to process clauses that contain legal headers
  if (!options.noClauses) {
    processor.use(remarkClauses, {
      metadata,
      debug: options.debug,
      enableFieldTracking: options.enableFieldTracking,
    });
  }

  // Step 2: Add legal headers parser AFTER imports and clauses to convert l., ll., etc. to proper headers
  // This ensures headers in imported files are also converted
  // WARNING: Do not move this before imports or headers in imported files won't be processed
  // WARNING: Do not move this before clauses or clauses containing headers won't be processed
  if (!options.noHeaders) {
    processor.use(remarkLegalHeadersParser, {
      debug: options.debug,
    });
  }

  // Add mixins plugin (should be processed early for content expansion)
  if (!options.noMixins) {
    processor.use(remarkMixins, {
      metadata,
      basePath: options.basePath || '.',
      debug: options.debug,
      maxDepth: 5,
    });
  }

  // Skip loop processing plugins since we pre-process loops
  // Consolidation and loop processing now happen before remark parsing

  // Add dates plugin (processes @today tokens with arithmetic and formatting)
  processor.use(remarkDates, {
    metadata,
    debug: options.debug,
    enableFieldTracking: options.enableFieldTracking,
  });

  // Add signature lines plugin (wraps long underscore sequences with CSS class)
  processor.use(remarkSignatureLines, {
    minUnderscores: 10,
    addCssClass: true,
    cssClassName: 'signature-line',
    debug: options.debug,
  });

  // Add template fields plugin (processes {{field}} patterns)
  processor.use(remarkTemplateFields, {
    metadata,
    fieldPatterns: options.fieldPatterns,
    enableFieldTracking: options.enableFieldTracking,
    debug: options.debug,
  });

  // Add cross-references plugin BEFORE headers (needs to extract |key| patterns before headers removes them)
  if (!options.disableCrossReferences && !options.noReferences) {
    processor.use(remarkCrossReferences, {
      metadata,
      enableFieldTracking: options.enableFieldTracking,
      debug: options.debug,
    });
  }

  // Add headers plugin AFTER cross-references (processes headers after cross-reference extraction)
  if (!options.noHeaders) {
    processor.use(remarkHeaders, {
      metadata,
      noReset: options.noReset,
      noIndent: options.noIndent,
      debug: options.debug,
    });
  }

  // Add field tracking plugin unless disabled
  // Note: remarkTemplateFields already handles field tracking, so we only
  // use remarkFieldTracking if template field processing is disabled
  // Currently disabled as remarkTemplateFields handles this functionality
  // eslint-disable-next-line no-constant-condition
  if (false && !options.disableFieldTracking && options.enableFieldTracking) {
    processor.use(remarkFieldTracking, {
      metadata,
      patterns: options.fieldPatterns,
      debug: options.debug,
    });
  }

  // Add stringify plugin with proper markdown formatting
  processor.use(remarkStringify, {
    emphasis: '*', // Use * for _italic_
    strong: '*', // Use ** for __bold__ (asterisks, not underscores)
    bullet: '-', // Use - for bullets
    fence: '`', // Use ` for code blocks
    fences: true, // Use fenced code blocks
    incrementListMarker: true, // Increment list markers (1. 2. 3.)
    rule: '-', // Use --- for horizontal rules (not ***)
    ruleRepetition: 3, // Use exactly 3 dashes for horizontal rules
    unsafe: unsafeWithoutUnderscores, // Use filtered unsafe patterns without underscores
  });

  // Build plugin order list for validation (must match actual processor.use() order above)
  if (!options.noImports) pluginOrder.push('remarkImports');
  if (!options.noHeaders) pluginOrder.push('remarkLegalHeadersParser');
  if (!options.noMixins) pluginOrder.push('remarkMixins');
  if (!options.noClauses) pluginOrder.push('remarkClauses');
  pluginOrder.push('remarkDates');
  pluginOrder.push('remarkSignatureLines');
  pluginOrder.push('remarkTemplateFields');
  if (!options.disableCrossReferences && !options.noReferences) {
    pluginOrder.push('remarkCrossReferences');
  }
  if (!options.noHeaders) pluginOrder.push('remarkHeaders');

  // Validate plugin order
  if (options.debug || options.validatePluginOrder) {
    try {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);
      const result = validator.validate(pluginOrder, {
        throwOnError: false, // Don't throw, just log warnings
        logWarnings: options.debug || options.validatePluginOrder,
        strictMode: false,
        debug: options.debug,
      });

      if (!result.valid && options.debug) {
        console.warn('[LegalMarkdownProcessor] Plugin order validation warnings detected');
        for (const error of result.errors) {
          console.warn(`  - ${error.message}`);
        }
        if (result.suggestedOrder) {
          console.warn('  Suggested order:', result.suggestedOrder.join(' → '));
        }
      }
    } catch (error) {
      // If validation fails, just log a warning in debug mode
      if (options.debug) {
        console.warn('[LegalMarkdownProcessor] Plugin order validation failed:', error);
      }
    }
  }

  return processor;
}

/**
 * Process Legal Markdown content using remark pipeline
 *
 * This is the main entry point for remark-based Legal Markdown processing.
 * It provides a complete AST-based processing pipeline with:
 * - YAML frontmatter parsing and metadata extraction
 * - Template field processing with nested helper support
 * - Cross-reference resolution and section numbering
 * - Field tracking for document highlighting
 * - Import processing for modular documents
 * - Comprehensive error handling and debugging
 *
 * @param content - Raw Legal Markdown content to process
 * @param options - Processing options and configuration
 * @returns Promise resolving to processed content, metadata, and statistics
 *
 * @example
 * ```typescript
 * const result = await processLegalMarkdownWithRemark(markdownContent, {
 *   enableFieldTracking: true,
 *   basePath: './templates',
 *   debug: true
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.stats.fieldsTracked); // Number of tracked fields
 * ```
 */
export async function processLegalMarkdownWithRemark(
  content: string,
  options: LegalMarkdownProcessorOptions = {}
): Promise<LegalMarkdownProcessorResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const pluginsUsed: string[] = ['remarkParse', 'remarkStringify'];

  try {
    // Clear field tracker at the beginning
    fieldTracker.clear();

    if (options.debug) {
      console.log('🔄 Starting Legal Markdown processing with remark pipeline');
    }

    // Parse YAML front matter first
    if (options.debug) {
      console.log('[legal-markdown-processor] Raw content length:', content.length);
      console.log(
        '[legal-markdown-processor] Raw content first 500 chars:',
        content.substring(0, 500)
      );
    }

    const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(
      content,
      options.throwOnYamlError
    );

    if (options.debug) {
      console.log('[legal-markdown-processor] YAML parsed:', Object.keys(yamlMetadata));
      console.log('[legal-markdown-processor] Sample metadata:', yamlMetadata);
    }

    // Pre-process: Escape underscores inside {{}} to prevent markdown italic parsing
    // This prevents {{_field}} from being parsed as {{*field}}
    const contentWithEscapedTemplates = escapeTemplateUnderscores(contentWithoutYaml);

    if (options.debug && contentWithEscapedTemplates !== contentWithoutYaml) {
      console.log('[legal-markdown-processor] Escaped template underscores');
    }

    // If key processing is disabled, return original content without remark processing
    // Check if the main content-altering features are disabled
    const keyProcessingDisabled = options.noHeaders && options.noReferences && options.noMixins;

    if (options.debug) {
      console.log('[legal-markdown-processor] Processing flags:', {
        noHeaders: options.noHeaders,
        noReferences: options.noReferences,
        noMixins: options.noMixins,
        enableFieldTracking: options.enableFieldTracking,
        keyProcessingDisabled,
      });
    }

    if (keyProcessingDisabled && !options.enableFieldTracking) {
      if (options.debug) {
        console.log(
          '[legal-markdown-processor] Key processing disabled, returning original content'
        );
      }

      return {
        content: asMarkdown(contentWithEscapedTemplates),
        metadata: { ...yamlMetadata, ...options.additionalMetadata },
        stats: {
          processingTime: Date.now() - startTime,
          pluginsUsed: [],
          crossReferencesFound: 0,
          fieldsTracked: 0,
        },
        warnings: [],
      };
    }

    // If only processing YAML, return early
    if (options.yamlOnly) {
      return {
        content: asMarkdown(contentWithEscapedTemplates),
        metadata: yamlMetadata,
        stats: {
          processingTime: Date.now() - startTime,
          pluginsUsed: [],
          crossReferencesFound: 0,
          fieldsTracked: 0,
        },
        warnings: [],
      };
    }

    // Merge metadata sources
    const combinedMetadata = {
      ...yamlMetadata,
      ...options.additionalMetadata,
    };

    // Process force commands and metadata options
    const { parseForceCommands, applyForceCommands } = await import(
      '../../core/parsers/force-commands-parser'
    );

    let updatedOptions = { ...options };

    // Parse force_commands from metadata if present (higher precedence)
    if (combinedMetadata.force_commands && typeof combinedMetadata.force_commands === 'string') {
      const forceCommands = parseForceCommands(combinedMetadata.force_commands, combinedMetadata);
      if (forceCommands) {
        updatedOptions = applyForceCommands(updatedOptions, forceCommands);
      }
    }

    if (updatedOptions.debug) {
      console.log(
        '[legal-markdown-processor] Combined metadata keys:',
        Object.keys(combinedMetadata)
      );
      console.log('[legal-markdown-processor] Combined metadata sample:', combinedMetadata);
      console.log(
        '[legal-markdown-processor] Services structure:',
        JSON.stringify(combinedMetadata.services, null, 2)
      );
      console.log(
        '[legal-markdown-processor] Milestones structure:',
        JSON.stringify(combinedMetadata.milestones, null, 2)
      );
    }

    // Preprocess custom field patterns to avoid HTML parsing issues
    let preprocessedContent = contentWithEscapedTemplates;
    const fieldMappings = new Map<string, string>(); // Maps normalized patterns to original patterns

    if (updatedOptions.debug) {
      console.log('[legal-markdown-processor] About to check for pre-processing...');
    }

    if (updatedOptions.fieldPatterns && updatedOptions.fieldPatterns.length > 0) {
      for (const pattern of updatedOptions.fieldPatterns) {
        if (pattern !== '{{(.+?)}}') {
          // Skip default pattern
          const regex = new RegExp(pattern, 'g');
          preprocessedContent = preprocessedContent.replace(regex, (match, fieldName) => {
            const normalizedPattern = `{{${fieldName}}}`;
            fieldMappings.set(normalizedPattern, match);
            return normalizedPattern;
          });
        }
      }
    }

    // Pre-process optional clauses [content]{condition} before remark parsing
    // This must happen BEFORE template loops to allow Handlebars helpers inside clauses
    if (!updatedOptions.noClauses) {
      if (updatedOptions.debug) {
        console.log('[legal-markdown-processor] Pre-processing optional clauses...');
      }

      preprocessedContent = preprocessOptionalClauses(
        preprocessedContent,
        combinedMetadata,
        updatedOptions.debug || false
      );

      if (updatedOptions.debug) {
        console.log('[legal-markdown-processor] Optional clauses processed');
      }
    }

    // Pre-process template loops (Handlebars {{#each}}, {{#if}}, etc.) before remark parsing
    // Note: This always runs unless explicitly disabled, independent of clauses
    if (updatedOptions.debug) {
      console.log('[legal-markdown-processor] Pre-processing template loops...');
    }

    preprocessedContent = processTemplateLoops(
      preprocessedContent,
      combinedMetadata,
      undefined, // context
      updatedOptions.enableFieldTracking || false
    );

    if (updatedOptions.debug) {
      console.log('[legal-markdown-processor] Content after processTemplateLoops:');
      console.log(preprocessedContent.substring(0, 800));
    }

    if (updatedOptions.debug) {
      console.log('[legal-markdown-processor] Template loops processed');
      if (preprocessedContent.includes('{{#')) {
        console.log('[legal-markdown-processor] WARNING: Content has {{# patterns!');
      }
    }

    // Store field mappings in metadata for later use
    combinedMetadata['_field_mappings'] = fieldMappings;

    // Ensure default pattern is always included for template field processing
    // since preprocessing normalizes all patterns to {{field}} format
    const processingOptions = {
      ...updatedOptions,
      fieldPatterns:
        updatedOptions.fieldPatterns && updatedOptions.fieldPatterns.length > 0
          ? ['{{(.+?)}}', ...updatedOptions.fieldPatterns]
          : undefined,
    };

    // Create and configure processor
    const processor = createLegalMarkdownProcessor(combinedMetadata, processingOptions);

    // Track which plugins are being used
    pluginsUsed.push('remarkTemplateFields');
    if (!updatedOptions.disableCrossReferences && !updatedOptions.noReferences) {
      pluginsUsed.push('remarkCrossReferences');
    }
    if (!updatedOptions.disableFieldTracking && updatedOptions.enableFieldTracking) {
      pluginsUsed.push('remarkFieldTracking');
    }

    if (updatedOptions.debug) {
      console.log(`📋 Using plugins: ${pluginsUsed.join(', ')}`);
    }

    // Process the content (field highlighting is now done during AST processing)
    const result = await processor.process(preprocessedContent);
    const processedContent = String(result);

    // Cache the AST for Phase 3 format generation
    // The AST is available in result.data (after processing)
    const processedTree = result.value as unknown as Root;

    // Extract imported metadata from the processed tree
    const importedMetadata =
      (result.history[0] as unknown as Record<string, unknown>)?._importedMetadata || {};

    // Merge imported metadata with combined metadata (imported metadata has lower priority)
    const finalMetadata = {
      ...importedMetadata,
      ...combinedMetadata,
    };

    if (updatedOptions.debug && Object.keys(importedMetadata).length > 0) {
      console.log(
        `📦 Merged ${Object.keys(importedMetadata).length} imported metadata fields:`,
        Object.keys(importedMetadata)
      );
    }

    // Extract processing statistics
    const crossReferencesFound = combinedMetadata['_cross_references']?.length || 0;
    const fieldsTracked = updatedOptions.enableFieldTracking
      ? fieldTracker.getTotalOccurrences()
      : 0;

    // Generate field report if field tracking is enabled
    let fieldReport;
    if (updatedOptions.enableFieldTracking) {
      const fields = fieldTracker.getFields();
      fieldReport = {
        totalFields: fieldsTracked,
        uniqueFields: fields.size,
        fields: fields,
      };
    }

    // Handle metadata export if requested
    let exportedFiles: string[] = [];
    if (updatedOptions.exportMetadata) {
      try {
        const exportResult = exportMetadata(
          finalMetadata,
          updatedOptions.exportFormat,
          updatedOptions.exportPath
        );
        exportedFiles = exportResult.exportedFiles;

        if (updatedOptions.debug) {
          console.log(`📁 Exported metadata files: ${exportedFiles.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`Failed to export metadata: ${errorMessage}`);
        if (updatedOptions.debug) {
          console.warn('⚠️ Metadata export failed:', error);
        }
      }
    }

    if (updatedOptions.debug) {
      console.log(`✅ Processing completed in ${Date.now() - startTime}ms`);
      console.log(`📊 Cross-references found: ${crossReferencesFound}`);
      console.log(`📋 Fields tracked: ${fieldsTracked}`);
    }

    return {
      content: asMarkdown(processedContent),
      metadata: finalMetadata,
      ast: processedTree, // Cached AST for Phase 3
      exportedFiles: exportedFiles.length > 0 ? exportedFiles : undefined,
      fieldReport,
      stats: {
        processingTime: Date.now() - startTime,
        pluginsUsed,
        crossReferencesFound,
        fieldsTracked,
      },
      warnings,
    };
  } catch (error) {
    if (options.debug) {
      console.error('❌ Legal Markdown processing failed:', error);
    }

    // Re-throw with additional context
    const enhancedError = new Error(
      `Legal Markdown processing failed: ${error instanceof Error ? error.message : String(error)}`
    );
    // Store the original error for debugging (avoiding .cause for compatibility)
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
}

/**
 * Synchronous version of the Legal Markdown processor
 *
 * Note: This is not truly synchronous as remark is async.
 * This is a simplified fallback that throws an error suggesting async usage.
 * For real sync processing, use the legacy processor.
 */
export function processLegalMarkdownWithRemarkSync(
  content: string,
  options: LegalMarkdownProcessorOptions = {}
): Omit<LegalMarkdownProcessorResult, 'fieldReport'> & { fieldReport?: any } {
  // Suppress ESLint warning for unused parameter
  void content;
  void options;

  throw new Error(
    'Synchronous processing is not available with the remark-based processor. ' +
      'Please use processLegalMarkdownWithRemark() (async) instead, ' +
      'or use the legacy processor for sync operations.'
  );
}

/**
 * Create a pre-configured processor instance for reuse
 *
 * This factory function creates a reusable processor instance with pre-configured
 * options. Useful for batch processing multiple documents with the same settings.
 *
 * @param options - Base configuration options for all processing operations
 * @returns Object with async and sync processing methods
 *
 * @example
 * ```typescript
 * const processor = createReusableLegalMarkdownProcessor({
 *   enableFieldTracking: true,
 *   basePath: './templates'
 * });
 *
 * const result1 = await processor.process(content1);
 * const result2 = await processor.process(content2, { debug: true });
 * ```
 */
export function createReusableLegalMarkdownProcessor(options: LegalMarkdownProcessorOptions = {}) {
  return {
    async process(content: string, additionalOptions: Partial<LegalMarkdownProcessorOptions> = {}) {
      return processLegalMarkdownWithRemark(content, {
        ...options,
        ...additionalOptions,
      });
    },

    processSync(content: string, additionalOptions: Partial<LegalMarkdownProcessorOptions> = {}) {
      return processLegalMarkdownWithRemarkSync(content, {
        ...options,
        ...additionalOptions,
      });
    },
  };
}

// Types are already exported inline, no need for separate export
