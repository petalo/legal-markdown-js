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

      // Create a CliService without archiving for individual format processing
      const processingOptions = this.mapToCliOptions(this.getConfig());
      const nonArchivingService = new CliService({
        ...processingOptions,
        archiveSource: false, // Disable archiving during format processing
        exportMetadata: false, // Disable metadata export to prevent duplications
        silent: true, // Suppress success messages to prevent duplication
      });

      // Process for each selected format
      if (outputFormats.pdf) {
        const pdfOutput = path.join(outputDir, `${outputFilename}.pdf`);
        await nonArchivingService.processFile(inputFile, pdfOutput);
        outputFiles.push(pdfOutput);

        // Add highlight version if highlight is enabled
        if (processingOptions.highlight) {
          const highlightPdfOutput = path.join(outputDir, `${outputFilename}.HIGHLIGHT.pdf`);
          outputFiles.push(highlightPdfOutput);
        }
      }

      if (outputFormats.html) {
        const htmlOutput = path.join(outputDir, `${outputFilename}.html`);
        await nonArchivingService.processFile(inputFile, htmlOutput);
        outputFiles.push(htmlOutput);

        // Add highlight version if highlight is enabled
        if (processingOptions.highlight) {
          const highlightHtmlOutput = path.join(outputDir, `${outputFilename}.HIGHLIGHT.html`);
          outputFiles.push(highlightHtmlOutput);
        }
      }

      if (outputFormats.markdown) {
        // Only generate normal MD file if archiving is disabled
        // When archiving is enabled, we'll have .ORIGINAL and .PROCESSED files instead
        if (!archiveOptions.enabled) {
          const mdOutput = path.join(outputDir, `${outputFilename}.md`);
          await nonArchivingService.processFile(inputFile, mdOutput);
          outputFiles.push(mdOutput);
        }
      }

      if (outputFormats.metadata) {
        const yamlOutput = path.join(outputDir, `${outputFilename}-metadata.yaml`);
        // Process the file to get metadata only, without going through full pipeline
        const content = readFileSync(inputFile);
        const inputDir = path.dirname(inputFile);
        const metadataOptions = {
          ...processingOptions,
          basePath: inputDir,
          exportMetadata: true,
          exportFormat: 'yaml' as const,
          exportPath: yamlOutput,
        };
        const result = processLegalMarkdown(content, metadataOptions);

        // Validate that metadata was actually exported
        if (result.exportedFiles && result.exportedFiles.length > 0) {
          // Filter out imported files - only include actual exported metadata files
          const metadataFiles = result.exportedFiles.filter(file => {
            const fileName = path.basename(file);
            return fileName.includes('-metadata.') || fileName.includes('metadata.');
          });

          if (metadataFiles.length > 0) {
            outputFiles.push(...metadataFiles);
          } else {
            throw new Error(`Failed to export metadata to: ${yamlOutput}`);
          }
        } else {
          throw new Error(`Failed to export metadata to: ${yamlOutput}`);
        }
      }

      // Handle archiving separately after all processing is complete
      let archiveResult;
      if (archiveOptions.enabled) {
        archiveResult = await this.handleArchiving(inputFile);

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
   * Handle archiving of source file and capture results
   *
   * @param inputFile Path to the source file to archive
   * @returns Archive operation result information
   */
  private async handleArchiving(inputFile: string): Promise<ProcessingResult['archiveResult']> {
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

      // Read original content
      const originalContent = readFileSync(inputFile);

      // Process the content to get processed version
      const inputDir = path.dirname(inputFile);
      const processedResult = processLegalMarkdown(originalContent, {
        basePath: inputDir,
      });

      // Use smart archiving
      const result = await archiveManager.smartArchiveFile(inputFile, {
        archiveDir,
        createDirectory: true,
        conflictResolution: 'rename',
        originalContent,
        processedContent: processedResult.content,
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
