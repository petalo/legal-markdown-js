/**
 * Service integration for Interactive CLI
 *
 * This module provides the bridge between the interactive CLI configuration
 * and the existing CliService, translating user selections into appropriate
 * CLI options and orchestrating the document processing workflow.
 */

import * as path from 'path';
import { LegalMarkdownOptions } from '@types';
import { CliService } from '../service';
import { RESOLVED_PATHS } from '@constants';
import { InteractiveConfig, ProcessingResult } from './types';
import { ArchiveManager } from '../../utils/archive-manager';
import { readFileSync } from '@lib';
import { processLegalMarkdown } from '../../index';

/**
 * Interactive service for processing documents with user-selected configuration
 *
 * This class serves as an adapter between the interactive CLI configuration
 * collected from user prompts and the existing CliService infrastructure,
 * ensuring seamless integration with the established processing pipeline.
 */
export class InteractiveService {
  private cliService: CliService;
  private config: InteractiveConfig;

  /**
   * Initialize the interactive service with user configuration
   *
   * @param config Complete interactive configuration collected from user prompts
   */
  constructor(config: InteractiveConfig) {
    this.config = config;
    const options = this.mapToCliOptions(config);
    this.cliService = new CliService(options);
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
      // Create a CliService without archiving for individual format processing
      const processingOptions = this.mapToCliOptions(this.getConfig());
      const nonArchivingService = new CliService({
        ...processingOptions,
        archiveSource: false, // Disable archiving during format processing
        exportMetadata: false, // Disable metadata export to prevent duplications
      });

      // Process for each selected format
      if (outputFormats.pdf) {
        const pdfOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.pdf`);
        await nonArchivingService.processFile(inputFile, pdfOutput);
        outputFiles.push(pdfOutput);

        // Add highlight version if highlight is enabled
        if (processingOptions.highlight) {
          const highlightPdfOutput = path.join(
            RESOLVED_PATHS.DEFAULT_OUTPUT_DIR,
            `${outputFilename}.HIGHLIGHT.pdf`
          );
          outputFiles.push(highlightPdfOutput);
        }
      }

      if (outputFormats.html) {
        const htmlOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.html`);
        await nonArchivingService.processFile(inputFile, htmlOutput);
        outputFiles.push(htmlOutput);

        // Add highlight version if highlight is enabled
        if (processingOptions.highlight) {
          const highlightHtmlOutput = path.join(
            RESOLVED_PATHS.DEFAULT_OUTPUT_DIR,
            `${outputFilename}.HIGHLIGHT.html`
          );
          outputFiles.push(highlightHtmlOutput);
        }
      }

      if (outputFormats.markdown) {
        const mdOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.md`);
        await nonArchivingService.processFile(inputFile, mdOutput);
        outputFiles.push(mdOutput);
      }

      if (outputFormats.metadata) {
        const yamlOutput = path.join(
          RESOLVED_PATHS.DEFAULT_OUTPUT_DIR,
          `${outputFilename}-metadata.yaml`
        );
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
        outputFiles.push(yamlOutput);
      }

      // Handle archiving separately after all processing is complete
      let archiveResult;
      if (archiveOptions.enabled) {
        archiveResult = await this.handleArchiving(inputFile);
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

      // Determine archive directory
      let archiveDir: string;
      if (archiveOptions.directory) {
        archiveDir = archiveOptions.directory;
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
