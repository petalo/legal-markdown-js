/**
 * Service integration for Interactive CLI
 *
 * This module provides the bridge between the interactive CLI configuration
 * and the existing CliService, translating user selections into appropriate
 * CLI options and orchestrating the document processing workflow.
 */

import * as path from 'path';
import { LegalMarkdownOptions } from '../../types';
import { CliService } from '../service';
import { RESOLVED_PATHS } from '../../constants/index';
import { InteractiveConfig, ProcessingResult } from './types';
import { ArchiveManager } from '../../utils/archive-manager';
import { readFileSync } from '../../utils/index';
import { processLegalMarkdown } from '../../index';
import {
  buildProcessingContext,
  processLegalMarkdownWithRemark,
  generateAllFormats,
  buildFormatGenerationOptions,
} from '../../core/pipeline';

/**
 * Get the path to the highlight CSS file from the package
 * Works in both CommonJS and ESM environments
 */
function getHighlightCssPath(): string {
  const isEsm = typeof __filename === 'undefined' || typeof __dirname === 'undefined';

  if (!isEsm && typeof __dirname !== 'undefined') {
    return path.resolve(__dirname, '..', '..', 'styles', 'highlight.css');
  }

  // Fallback for ESM environments
  return path.join(process.cwd(), 'src', 'styles', 'highlight.css');
}

/**
 * Interactive service for processing documents with user-selected configuration
 *
 * This class serves as an adapter between the interactive CLI configuration
 * collected from user prompts and the existing CliService infrastructure,
 * ensuring seamless integration with the established processing pipeline.
 */
export class InteractiveService {
  private config: InteractiveConfig;

  /**
   * Initialize the interactive service with user configuration
   *
   * @param config Complete interactive configuration collected from user prompts
   */
  constructor(config: InteractiveConfig) {
    this.config = config;
  }

  /**
   * Map interactive configuration to CLI service options
   *
   * Translates the structured interactive configuration into the format
   * expected by the existing CliService, ensuring all user selections
   * are properly represented in the processing options.
   *
   * @param config Interactive configuration to convert
   * @returns CLI service options with all necessary flags and paths configured
   */
  private mapToCliOptions(config: InteractiveConfig): LegalMarkdownOptions & {
    verbose?: boolean;
    pdf?: boolean;
    html?: boolean;
    highlight?: boolean;
    css?: string;
    title?: string;
    archiveSource?: string | boolean;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
  } {
    const { outputFormats, processingOptions, archiveOptions, cssFile } = config;

    return {
      debug: processingOptions.debug,
      yamlOnly: false,
      noHeaders: false,
      noClauses: false,
      noReferences: false,
      noImports: false,
      noMixins: false,
      noReset: false,
      noIndent: false,
      throwOnYamlError: false,
      toMarkdown: outputFormats.markdown,
      exportMetadata: outputFormats.metadata,
      exportFormat: 'yaml' as const,
      basePath: RESOLVED_PATHS.DEFAULT_INPUT_DIR,
      verbose: processingOptions.debug,
      pdf: outputFormats.pdf,
      html: outputFormats.html,
      highlight: processingOptions.highlight,
      enableFieldTrackingInMarkdown: processingOptions.fieldTracking,
      css: cssFile ? path.join(RESOLVED_PATHS.STYLES_DIR, cssFile) : undefined,
      title: config.outputFilename,
      archiveSource: archiveOptions.enabled ? archiveOptions.directory || true : false,
      format: undefined, // Interactive CLI doesn't collect this, use default
      landscape: undefined, // Interactive CLI doesn't collect this, use default
    };
  }

  /**
   * Process the input file and generate all requested outputs
   *
   * Coordinates the processing of the selected input file according to the
   * user's configuration, generating output files in all requested formats
   * and writing them to the configured output directory.
   *
   * @param inputFile Absolute path to the input document to process
   * @returns Promise resolving to processing result with output files and archive info
   * @throws Error when processing fails for any requested format
   */
  async processFile(inputFile: string): Promise<ProcessingResult> {
    const outputFiles: string[] = [];
    const { outputFilename, outputFormats, archiveOptions } = this.getConfig();

    try {
      // Determine the output directory: if archiving is enabled, use archive directory
      let outputDir: string;
      if (archiveOptions.enabled && archiveOptions.directory) {
        // Custom directory should be relative to DEFAULT_OUTPUT_DIR
        const customDir = archiveOptions.directory.replace(/\/+$/, '');
        outputDir = path.resolve(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, customDir);
      } else {
        outputDir = RESOLVED_PATHS.DEFAULT_OUTPUT_DIR;
      }

      // Read file content
      const content = readFileSync(inputFile);
      const inputDir = path.dirname(inputFile);

      // Map interactive config to processing options
      const processingOptions = this.mapToCliOptions(this.getConfig());

      // PHASE 1: Build processing context (parses YAML, resolves force-commands)
      const context = await buildProcessingContext(content, processingOptions, inputDir);

      // PHASE 2: Process content ONCE (runs remark pipeline, caches AST)
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata, // Pass YAML metadata for header processing
      });

      // PHASE 3: Generate all formats from cached result (NO re-processing!)
      const highlightCssPath = getHighlightCssPath();
      const cssPath = context.options.cssPath ?? processingOptions.css;

      const formatGenerationOptions = buildFormatGenerationOptions(context.options, {
        outputDir,
        baseFilename: outputFilename,
        pdf: outputFormats.pdf,
        html: outputFormats.html,
        markdown: outputFormats.markdown && !archiveOptions.enabled, // Skip if archiving
        metadata: outputFormats.metadata,
        highlight: processingOptions.highlight,
        cssPath,
        highlightCssPath,
        title: outputFilename,
        format: processingOptions.format,
        landscape: processingOptions.landscape,
        exportFormat: 'yaml',
        exportPath: path.join(outputDir, `${outputFilename}-metadata.yaml`),
      });

      const formatResult = await generateAllFormats(processedResult, formatGenerationOptions);

      // Add all generated files to output
      outputFiles.push(...formatResult.generatedFiles);

      // Handle archiving separately after all processing is complete
      let archiveResult;
      if (archiveOptions.enabled) {
        // Use the already-processed content from Phase 2
        archiveResult = await this.handleArchivingWithProcessedContent(
          inputFile,
          content,
          processedResult.content
        );

        // Include archived MD files in outputFiles so they appear in the MD section
        if (archiveResult && archiveResult.success) {
          if (archiveResult.contentsIdentical && archiveResult.archivedPath) {
            // Single archived file (content identical)
            if (archiveResult.archivedPath.endsWith('.md')) {
              outputFiles.push(archiveResult.archivedPath);
            }
          } else {
            // Two archived files (content different) - include both MD files
            if (
              archiveResult.archivedOriginalPath &&
              archiveResult.archivedOriginalPath.endsWith('.md')
            ) {
              outputFiles.push(archiveResult.archivedOriginalPath);
            }
            if (
              archiveResult.archivedProcessedPath &&
              archiveResult.archivedProcessedPath.endsWith('.md')
            ) {
              outputFiles.push(archiveResult.archivedProcessedPath);
            }
          }
        }
      }

      return {
        outputFiles,
        archiveResult,
      };
    } catch (error) {
      throw new Error(
        `Processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle archiving of source file using already-processed content
   *
   * This method reuses the processed content from Phase 2 instead of
   * re-processing the file, eliminating duplicate processing.
   *
   * @param inputFile Path to the source file to archive
   * @param originalContent Original file content
   * @param processedContent Already-processed content from Phase 2
   * @returns Archive operation result information
   */
  private async handleArchivingWithProcessedContent(
    inputFile: string,
    originalContent: string,
    processedContent: string
  ): Promise<ProcessingResult['archiveResult']> {
    try {
      const archiveManager = new ArchiveManager();
      const { archiveOptions } = this.getConfig();

      // Determine archive directory - should be relative to project root
      let archiveDir: string;
      if (archiveOptions.directory) {
        // Custom directory should be relative to project root (consistent with ARCHIVE_DIR)
        // Ensure directory name doesn't have trailing slash (normalize)
        const customDir = archiveOptions.directory.replace(/\/+$/, '');
        archiveDir = path.resolve(process.cwd(), customDir);
      } else {
        archiveDir = RESOLVED_PATHS.ARCHIVE_DIR;
      }

      // Use smart archiving with already-processed content (NO re-processing!)
      const result = await archiveManager.smartArchiveFile(inputFile, {
        archiveDir,
        createDirectory: true,
        conflictResolution: 'rename',
        originalContent,
        processedContent, // Reuse from Phase 2
      });

      return {
        success: result.success,
        contentsIdentical: result.contentsIdentical,
        archivedPath: result.archivedPath,
        archivedOriginalPath: result.archivedOriginalPath,
        archivedProcessedPath: result.archivedProcessedPath,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the current configuration
   *
   * @returns The interactive configuration used to initialize this service
   */
  private getConfig(): InteractiveConfig {
    return this.config;
  }
}
