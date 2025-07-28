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
import { InteractiveConfig } from './types';

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
  } {
    const { outputFormats, processingOptions, cssFile } = config;

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
   * @returns Promise resolving to array of paths to generated output files
   * @throws Error when processing fails for any requested format
   */
  async processFile(inputFile: string): Promise<string[]> {
    const outputFiles: string[] = [];
    const { outputFilename, outputFormats } = this.getConfig();

    try {
      // Process for each selected format
      if (outputFormats.pdf) {
        const pdfOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.pdf`);
        await this.cliService.processFile(inputFile, pdfOutput);
        outputFiles.push(pdfOutput);
      }

      if (outputFormats.html) {
        const htmlOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.html`);
        await this.cliService.processFile(inputFile, htmlOutput);
        outputFiles.push(htmlOutput);
      }

      if (outputFormats.markdown) {
        const mdOutput = path.join(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, `${outputFilename}.md`);
        await this.cliService.processFile(inputFile, mdOutput);
        outputFiles.push(mdOutput);
      }

      if (outputFormats.metadata) {
        const yamlOutput = path.join(
          RESOLVED_PATHS.DEFAULT_OUTPUT_DIR,
          `${outputFilename}-metadata.yaml`
        );
        // Create a separate service instance for metadata export
        const metadataService = new CliService({
          ...this.mapToCliOptions(this.getConfig()),
          exportMetadata: true,
          exportFormat: 'yaml',
          exportPath: yamlOutput,
        });
        await metadataService.processFile(inputFile);
        outputFiles.push(yamlOutput);
      }

      return outputFiles;
    } catch (error) {
      throw new Error(
        `Processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
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
