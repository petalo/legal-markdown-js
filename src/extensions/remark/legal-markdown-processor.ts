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
import { remarkDebugAST } from '../../plugins/remark/debug-ast';
import { fieldTracker } from '../tracking/field-tracker';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import { processTemplateLoops } from '../template-loops';
import { exportMetadata } from '../../core/exporters/metadata-exporter';

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
  /** Processed markdown content */
  content: string;

  /** Extracted and processed metadata */
  metadata: Record<string, any>;

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
 * 1. Imports (must be first to process imported content)
 * 2. Mixins (content expansion before other processing)
 * 3. Clauses (conditional content)
 * 4. Template fields (field processing and tracking)
 * 5. Cross-references (reference resolution)
 * 6. Headers (final structure processing)
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

  // Add legal headers parser FIRST to convert l., ll., etc. to proper headers
  // This must run before any other plugin that depends on headers
  if (!options.noHeaders) {
    processor.use(remarkLegalHeadersParser, {
      debug: options.debug,
    });
  }

  // Add imports plugin first (must be processed before other content)
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

  // Add clauses plugin (conditional content processing)
  if (!options.noClauses) {
    processor.use(remarkClauses, {
      metadata,
      debug: options.debug,
      enableFieldTracking: options.enableFieldTracking,
    });
  }

  // Add dates plugin (processes @today tokens with arithmetic and formatting)
  processor.use(remarkDates, {
    metadata,
    debug: options.debug,
    enableFieldTracking: options.enableFieldTracking,
  });

  // Add template fields plugin (processes {{field}} patterns)
  processor.use(remarkTemplateFields, {
    metadata,
    fieldPatterns: options.fieldPatterns,
    enableFieldTracking: options.enableFieldTracking,
    debug: options.debug,
  });

  // Add cross-references plugin unless disabled
  if (!options.disableCrossReferences && !options.noReferences) {
    processor.use(remarkCrossReferences, {
      metadata,
      enableFieldTracking: options.enableFieldTracking,
      debug: options.debug,
    });
  }

  // Add headers plugin (should be processed after content is finalized)
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
    strong: '*', // Use * for __bold__ (single asterisk means **double**)
    bullet: '-', // Use - for bullets
    fence: '`', // Use ` for code blocks
    fences: true, // Use fenced code blocks
    incrementListMarker: true, // Increment list markers (1. 2. 3.)
  });

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
        content: contentWithoutYaml,
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
        content: contentWithoutYaml,
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

    if (options.debug) {
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
    let preprocessedContent = contentWithoutYaml;
    const fieldMappings = new Map<string, string>(); // Maps normalized patterns to original patterns

    if (options.debug) {
      console.log('[legal-markdown-processor] About to check for pre-processing...');
    }

    if (options.fieldPatterns && options.fieldPatterns.length > 0) {
      for (const pattern of options.fieldPatterns) {
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

    // Pre-process template loops before remark parsing
    if (!options.noClauses) {
      if (options.debug) {
        console.log('[legal-markdown-processor] Pre-processing template loops...');
      }

      preprocessedContent = processTemplateLoops(
        preprocessedContent,
        combinedMetadata,
        undefined, // context
        options.enableFieldTracking || false
      );

      if (options.debug) {
        console.log(
          '[legal-markdown-processor] Content after processTemplateLoops (first 800 chars):'
        );
        console.log(preprocessedContent.substring(0, 800));
      }

      if (options.debug) {
        console.log('[legal-markdown-processor] Template loops processed');
        if (preprocessedContent.includes('{{#')) {
          console.log(
            '[legal-markdown-processor] WARNING: Content still contains {{# patterns after loop processing!'
          );
        }
      }
    }

    // Store field mappings in metadata for later use
    combinedMetadata['_field_mappings'] = fieldMappings;

    // Ensure default pattern is always included for template field processing
    // since preprocessing normalizes all patterns to {{field}} format
    const processingOptions = {
      ...options,
      fieldPatterns:
        options.fieldPatterns && options.fieldPatterns.length > 0
          ? ['{{(.+?)}}', ...options.fieldPatterns]
          : undefined,
    };

    // Create and configure processor
    const processor = createLegalMarkdownProcessor(combinedMetadata, processingOptions);

    // Track which plugins are being used
    pluginsUsed.push('remarkTemplateFields');
    if (!options.disableCrossReferences && !options.noReferences) {
      pluginsUsed.push('remarkCrossReferences');
    }
    if (!options.disableFieldTracking && options.enableFieldTracking) {
      pluginsUsed.push('remarkFieldTracking');
    }

    if (options.debug) {
      console.log(`📋 Using plugins: ${pluginsUsed.join(', ')}`);
    }

    // Process the content (field highlighting is now done during AST processing)
    const result = await processor.process(preprocessedContent);
    const processedContent = String(result);

    // Extract imported metadata from the processed tree
    const processedTree = result.history[0]; // Get the processed tree
    const importedMetadata = (processedTree as any)?._importedMetadata || {};

    // Merge imported metadata with combined metadata (imported metadata has lower priority)
    const finalMetadata = {
      ...importedMetadata,
      ...combinedMetadata,
    };

    if (options.debug && Object.keys(importedMetadata).length > 0) {
      console.log(
        `📦 Merged ${Object.keys(importedMetadata).length} imported metadata fields:`,
        Object.keys(importedMetadata)
      );
    }

    // Extract processing statistics
    const crossReferencesFound = combinedMetadata['_cross_references']?.length || 0;
    const fieldsTracked = options.enableFieldTracking ? fieldTracker.getTotalOccurrences() : 0;

    // Generate field report if field tracking is enabled
    let fieldReport;
    if (options.enableFieldTracking) {
      const fields = fieldTracker.getFields();
      fieldReport = {
        totalFields: fieldsTracked,
        uniqueFields: fields.size,
        fields: fields,
      };
    }

    // Handle metadata export if requested
    let exportedFiles: string[] = [];
    if (options.exportMetadata) {
      try {
        const exportResult = exportMetadata(
          finalMetadata,
          options.exportFormat,
          options.exportPath
        );
        exportedFiles = exportResult.exportedFiles;

        if (options.debug) {
          console.log(`📁 Exported metadata files: ${exportedFiles.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`Failed to export metadata: ${errorMessage}`);
        if (options.debug) {
          console.warn('⚠️ Metadata export failed:', error);
        }
      }
    }

    if (options.debug) {
      console.log(`✅ Processing completed in ${Date.now() - startTime}ms`);
      console.log(`📊 Cross-references found: ${crossReferencesFound}`);
      console.log(`📋 Fields tracked: ${fieldsTracked}`);
    }

    return {
      content: processedContent,
      metadata: finalMetadata,
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
