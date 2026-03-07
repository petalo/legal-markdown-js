/**
 * Legal Markdown Processor with Remark Pipeline (Phase 3: AST Processing)
 *
 * This module provides a comprehensive processor for Legal Markdown documents
 * using the remark ecosystem. It combines multiple remark plugins to provide
 * AST-based processing that avoids text contamination issues.
 *
 * Processing Flow:
 * - Phase 1: Context building (YAML parsing, metadata merging) - done in context-builder.ts
 * - Phase 2: String transformations (field normalization, clauses, loops) - done in string-transformations.ts
 * - Phase 3: AST processing (THIS MODULE - remark plugins)
 * - Phase 4: Format generation (HTML, PDF) - done in format-generator.ts
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
 * @see docs/architecture/03_processing_pipeline.md
 * @see docs/architecture/string-transformations.md
 * @module
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import type { Root } from 'mdast';
import type { Unsafe } from 'mdast-util-to-markdown';
import {
  remarkCrossReferences,
  remarkTemplateFields,
  remarkHeaders,
  remarkMixins,
  remarkImports,
  remarkLegalHeadersParser,
  remarkDates,
  remarkSignatureLines,
} from '../../plugins/remark/index';
import { PluginOrderValidator } from '../../plugins/remark/plugin-order-validator';
import { GLOBAL_PLUGIN_REGISTRY } from '../../plugins/remark/plugin-metadata-registry';
import { fieldTracker, FieldStatus } from '../tracking/field-tracker';
import { flattenObject } from '../../core/utils/object-flattener';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import { exportMetadata } from '../../core/exporters/metadata-exporter';
import type { MarkdownString } from '../../types/content-formats';
import { asMarkdown } from '../../types/content-formats';
import type { YamlValue } from '../../types';
import { applyStringTransformations } from '../../core/pipeline/string-transformations';
import { detectSyntaxType } from '../template-loops';
import { parseForceCommands, applyForceCommands } from '../../core/parsers/force-commands-parser';
import { logger } from '../../utils/logger';

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
  const syntaxType = detectSyntaxType(content);

  if (syntaxType === 'handlebars' || syntaxType === 'mixed') {
    return content;
  }

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
 * Configuration options for the Legal Markdown processor
 * @interface LegalMarkdownProcessorOptions
 */
export interface LegalMarkdownProcessorOptions {
  /** Base path for resolving relative imports */
  basePath?: string;

  /** Enable field tracking and highlighting */
  enableFieldTracking?: boolean;

  /** Use AST-first field tracking pipeline */
  astFieldTracking?: boolean;

  /** Highlight winner branch content for conditional blocks */
  logicBranchHighlighting?: boolean;

  /** Enable debug logging */
  debug?: boolean;

  /** Validate plugin execution order and log warnings */
  validatePluginOrder?: boolean;

  /** Additional metadata to merge with document metadata */
  additionalMetadata?: Record<string, YamlValue>;

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

  /** Whether to add HTML comments showing import boundaries in output */
  importTracing?: boolean;

  /** Whether to validate type compatibility during frontmatter merging */
  validateImportTypes?: boolean;

  /** Whether to log detailed frontmatter merge operations */
  logImportOperations?: boolean;

  /** Disable automatic frontmatter merging from imported files */
  disableFrontmatterMerge?: boolean;
}

/**
 * Result from Legal Markdown processing
 * @interface LegalMarkdownProcessorResult
 */
export interface LegalMarkdownProcessorResult {
  /** Processed markdown content (always Markdown format, never HTML) */
  content: MarkdownString;

  /** Extracted and processed metadata */
  metadata: Record<string, YamlValue>;

  /** Cached AST for Phase 3 format generation (optional) */
  ast?: Root;

  /** Array of exported metadata files */
  exportedFiles?: string[];

  /** Field tracking report (if enabled) */
  fieldReport?: {
    totalFields: number;
    uniqueFields: number;
    fields: Map<string, import('../../extensions/tracking/field-tracker').TrackedField>;
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

function resolveTrackingOptions(options: {
  enableFieldTracking?: boolean;
  astFieldTracking?: boolean;
  logicBranchHighlighting?: boolean;
}): { astFieldTracking: boolean; logicBranchHighlighting: boolean } {
  const trackingEnabled = options.enableFieldTracking ?? false;
  const explicitAst = options.astFieldTracking;
  const explicitLogic = options.logicBranchHighlighting;
  const astFieldTracking = explicitAst ?? (explicitLogic === true ? true : trackingEnabled);
  const logicBranchHighlighting = explicitLogic ?? astFieldTracking;

  return {
    astFieldTracking,
    logicBranchHighlighting,
  };
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
  metadata: Record<string, YamlValue>,
  options: LegalMarkdownProcessorOptions
) {
  const trackingOptions = resolveTrackingOptions(options);
  const processor = unified().use(remarkParse).use(remarkGfm);

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
      validateTypes: options.validateImportTypes ?? true,
      logImportOperations: options.logImportOperations ?? options.debug,
      importTracing: options.importTracing,
    });
  }

  // Step 2: Add legal headers parser AFTER imports to convert l., ll., etc. to proper headers
  // This ensures headers in imported files are also converted
  // WARNING: Do not move this before imports or headers in imported files won't be processed
  // NOTE: Optional clauses are processed in Phase 2 (string transformations) before AST parsing
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
    astFieldTracking: trackingOptions.astFieldTracking,
    logicBranchHighlighting: trackingOptions.logicBranchHighlighting,
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
    unsafe: unsafeWithoutUnderscores, // Filtered unsafe patterns (no underscore rules)
    handlers: {
      // Override text node serialization to prevent underscore escaping.
      // mdast-util-to-markdown's `unsafe` option is ADDITIVE - it merges with
      // hardcoded defaults that include underscore escaping rules. There is no
      // public API to REMOVE default unsafe patterns. Since we configure
      // emphasis:'*' and strong:'*', underscores in output text are never
      // markdown syntax - escaped \_  is always a serialization artifact.
      // See: https://github.com/syntax-tree/mdast-util-to-markdown/blob/2.1.2/lib/unsafe.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mdast-util-to-markdown handler parameters are not publicly typed
      text(node: any, _parent: any, state: any, info: any) {
        const result = state.safe(node.value, {
          before: info.before,
          after: info.after,
          encode: info.encode,
        });
        // Strip backslash escapes that are not valid markdown syntax:
        // - \_ : underscores never form emphasis when using emphasis:'*' / strong:'*'
        // - \@ : email @-signs are plain text in legal docs (not GFM @mentions)
        return result.replaceAll('\\_', '_').replaceAll('\\@', '@');
      },
    },
  });

  // Build plugin order list for validation (must match actual processor.use() order above)
  // NOTE: Optional clauses (remarkClauses) are now processed in Phase 2 (string transformations)
  if (!options.noImports) pluginOrder.push('remarkImports');
  if (!options.noHeaders) pluginOrder.push('remarkLegalHeadersParser');
  if (!options.noMixins) pluginOrder.push('remarkMixins');
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
        logger.warn('Plugin order validation warnings detected');
        for (const error of result.errors) {
          logger.warn(`  - ${error.message}`);
        }
        if (result.suggestedOrder) {
          logger.warn('Suggested order', result.suggestedOrder.join(' → '));
        }
      }
    } catch (error) {
      // If validation fails, just log a warning in debug mode
      if (options.debug) {
        logger.warn(
          'Plugin order validation failed',
          error instanceof Error ? error.message : String(error)
        );
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
export async function processLegalMarkdown(
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
      logger.debug('Starting Legal Markdown processing with remark pipeline');
    }

    // Parse YAML front matter first
    if (options.debug) {
      logger.debug('Raw content length', content.length);
      logger.debug('Raw content first 500 chars', content.substring(0, 500));
    }

    const { content: contentWithoutYaml, metadata: yamlMetadata } = parseYamlFrontMatter(
      content,
      options.throwOnYamlError
    );

    if (options.debug) {
      logger.debug('YAML parsed', Object.keys(yamlMetadata));
      logger.debug('Sample metadata', yamlMetadata);
    }

    // Pre-process: Escape underscores inside {{}} to prevent markdown italic parsing
    // This prevents {{_field}} from being parsed as {{*field}}
    const contentWithEscapedTemplates = escapeTemplateUnderscores(contentWithoutYaml);

    if (options.debug && contentWithEscapedTemplates !== contentWithoutYaml) {
      logger.debug('Escaped template underscores');
    }

    // If key processing is disabled, return original content without remark processing
    // Check if the main content-altering features are disabled
    const keyProcessingDisabled = options.noHeaders && options.noReferences && options.noMixins;

    if (options.debug) {
      logger.debug('Processing flags', {
        noHeaders: options.noHeaders,
        noReferences: options.noReferences,
        noMixins: options.noMixins,
        enableFieldTracking: options.enableFieldTracking,
        keyProcessingDisabled,
      });
    }

    if (keyProcessingDisabled && !options.enableFieldTracking) {
      if (options.debug) {
        logger.debug('Key processing disabled, returning original content');
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

    let updatedOptions = { ...options };

    // Parse force_commands from metadata if present (higher precedence)
    if (combinedMetadata.force_commands && typeof combinedMetadata.force_commands === 'string') {
      const forceCommands = parseForceCommands(combinedMetadata.force_commands, combinedMetadata);
      if (forceCommands) {
        updatedOptions = applyForceCommands(updatedOptions, forceCommands);
      }
    }

    if (updatedOptions.debug) {
      logger.debug('Combined metadata keys', Object.keys(combinedMetadata));
      logger.debug('Combined metadata sample', combinedMetadata);
      logger.debug('Services structure', JSON.stringify(combinedMetadata.services, null, 2));
      logger.debug('Milestones structure', JSON.stringify(combinedMetadata.milestones, null, 2));
    }

    const trackingOptions = resolveTrackingOptions(updatedOptions);

    // ──────────────────────────────────────────────────────────────────────────
    // Phase 2: String Transformations
    // ──────────────────────────────────────────────────────────────────────────
    // Apply all string-level transformations BEFORE remark AST parsing
    // This includes: field normalization, optional clauses, template loops
    // See: docs/architecture/string-transformations.md
    if (updatedOptions.debug) {
      logger.debug('Starting Phase 2: String Transformations');
    }

    const stringTransformResult = await applyStringTransformations(contentWithEscapedTemplates, {
      metadata: combinedMetadata,
      debug: updatedOptions.debug,
      enableFieldTracking: updatedOptions.enableFieldTracking,
      astFieldTracking: trackingOptions.astFieldTracking,
      logicBranchHighlighting: trackingOptions.logicBranchHighlighting,
      noClauses: updatedOptions.noClauses,
      fieldPatterns: updatedOptions.fieldPatterns,
    });

    const preprocessedContent = stringTransformResult.content;
    const escapedTemplates = stringTransformResult.escapedTemplates;

    // Merge updated metadata from string transformations (includes field mappings)
    Object.assign(combinedMetadata, stringTransformResult.metadata);

    if (updatedOptions.debug) {
      logger.debug('Phase 2 complete. Content length', preprocessedContent.length);
      if (preprocessedContent.includes('{{#')) {
        logger.debug('WARNING: Content still has {{# patterns!');
      }
    }

    // Ensure default pattern is always included for template field processing
    // since preprocessing normalizes all patterns to {{field}} format
    const processingOptions = {
      ...updatedOptions,
      astFieldTracking: trackingOptions.astFieldTracking,
      logicBranchHighlighting: trackingOptions.logicBranchHighlighting,
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

    if (updatedOptions.debug) {
      logger.debug(`Using plugins: ${pluginsUsed.join(', ')}`);
    }

    // Process the content (field highlighting is now done during AST processing)
    const result = await processor.process(preprocessedContent);
    let processedContent = String(result);

    // Restore escaped template literals: __LMESC_N__ → {{...}}
    // These were collected from \{{...}} patterns before Phase 2 string transformations.
    if (escapedTemplates.length > 0) {
      for (let i = 0; i < escapedTemplates.length; i++) {
        processedContent = processedContent.replace(
          new RegExp(`__LMESC_${i}__`, 'g'),
          escapedTemplates[i]
        );
      }
    }
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
      logger.debug(
        `Merged ${Object.keys(importedMetadata).length} imported metadata fields`,
        Object.keys(importedMetadata)
      );
    }

    // Extract processing statistics
    const crossRefsValue = combinedMetadata['_cross_references'];
    const crossReferencesFound = Array.isArray(crossRefsValue) ? crossRefsValue.length : 0;
    const fieldsTracked = updatedOptions.enableFieldTracking
      ? fieldTracker.getTotalOccurrences()
      : 0;

    // Generate field report if field tracking is enabled
    let fieldReport;
    if (updatedOptions.enableFieldTracking) {
      const fields = fieldTracker.getFields();

      // Add YAML keys that were declared but never used as template fields
      const flatMeta = flattenObject(finalMetadata);
      for (const [key, value] of Object.entries(flatMeta)) {
        if (!key.startsWith('_') && !fields.has(key)) {
          fields.set(key, {
            name: key,
            status: FieldStatus.DECLARED,
            value: value as YamlValue,
            hasLogic: false,
          });
        }
      }

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
          logger.debug(`Exported metadata files: ${exportedFiles.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`Failed to export metadata: ${errorMessage}`);
        if (updatedOptions.debug) {
          logger.warn(
            'Metadata export failed',
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }

    if (updatedOptions.debug) {
      logger.debug(`Processing completed in ${Date.now() - startTime}ms`);
      logger.debug(`Cross-references found: ${crossReferencesFound}`);
      logger.debug(`Fields tracked: ${fieldsTracked}`);
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
      logger.error(
        'Legal Markdown processing failed',
        error instanceof Error ? error.message : String(error)
      );
    }

    // Re-throw with additional context
    const enhancedError = new Error(
      `Legal Markdown processing failed: ${error instanceof Error ? error.message : String(error)}`
    );
    // Store the original error for debugging (avoiding .cause for compatibility)
    (enhancedError as unknown as Record<string, unknown>).originalError = error;
    throw enhancedError;
  }
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
      return processLegalMarkdown(content, {
        ...options,
        ...additionalOptions,
      });
    },

    processSync(content: string, additionalOptions: Partial<LegalMarkdownProcessorOptions> = {}) {
      void content;
      void additionalOptions;
      throw new Error(
        'Synchronous processing is not available with the remark-based processor. ' +
          'Please use processLegalMarkdown() (async) instead.'
      );
    },
  };
}

// Types are already exported inline, no need for separate export

// Exported for testing - not part of public API
export {
  escapeTemplateUnderscores as _escapeTemplateUnderscores,
  createLegalMarkdownProcessor as _createLegalMarkdownProcessor,
};
