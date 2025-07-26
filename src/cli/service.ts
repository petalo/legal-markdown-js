/**
 * @fileoverview CLI Service for Legal Markdown Processing
 *
 * This module provides a service class that handles the business logic for
 * the CLI tool, including file processing, output generation, error handling,
 * and user feedback. It coordinates between the core processing functions
 * and the command-line interface.
 *
 * Features:
 * - File and content processing orchestration
 * - Multi-format output generation (HTML, PDF, Markdown)
 * - Error handling and user feedback
 * - Verbose logging and debugging support
 * - Path resolution and file system operations
 * - Flexible output options (file, stdout)
 *
 * @example
 * ```typescript
 * import { CliService } from './cli/service';
 *
 * const service = new CliService({
 *   verbose: true,
 *   pdf: true,
 *   highlight: true
 * });
 *
 * await service.processFile('input.md', 'output.md');
 * ```
 */

import { processLegalMarkdown, generateHtml, generatePdf, generatePdfVersions } from '../index';
import { LegalMarkdownOptions } from '@types';
import { readFileSync, writeFileSync, resolveFilePath } from '@lib';
import { LegalMarkdownError, FileNotFoundError } from '@errors';
import {
  extractForceCommands,
  parseForceCommands,
  applyForceCommands,
} from '../core/parsers/force-commands-parser';
import { parseYamlFrontMatter } from '../core/parsers/yaml-parser';
import chalk from 'chalk';
import * as path from 'path';

/**
 * Extended options interface for CLI operations
 *
 * @interface CliOptions
 * @extends LegalMarkdownOptions
 */
export interface CliOptions extends LegalMarkdownOptions {
  /** Input file path */
  input?: string;
  /** Output file path */
  output?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Generate PDF output */
  pdf?: boolean;
  /** Generate HTML output */
  html?: boolean;
  /** Enable field highlighting */
  highlight?: boolean;
  /** Path to custom CSS file */
  css?: string;
  /** Document title */
  title?: string;
}

/**
 * Service class for CLI operations and document processing
 *
 * Handles file processing, output generation, and error management
 * for the Legal Markdown CLI tool.
 *
 * @class CliService
 * @example
 * ```typescript
 * const service = new CliService({
 *   verbose: true,
 *   pdf: true,
 *   highlight: true
 * });
 * ```
 */
export class CliService {
  private options: CliOptions;

  /**
   * Creates a new CLI service instance
   *
   * @param {CliOptions} [options={}] - Configuration options
   */
  constructor(options: CliOptions = {}) {
    this.options = options;
  }

  /**
   * Processes a file from input path to output path
   *
   * @async
   * @param {string} inputPath - Path to the input file
   * @param {string} [outputPath] - Path for output file (optional for stdout)
   * @returns {Promise<void>}
   * @throws {FileNotFoundError} When input file doesn't exist
   * @throws {LegalMarkdownError} When processing fails
   */
  public async processFile(inputPath: string, outputPath?: string): Promise<void> {
    try {
      this.log(`Processing file: ${inputPath}`, 'info');

      const resolvedInputPath = resolveFilePath(this.options.basePath, inputPath);

      // Check if file exists before trying to read it
      if (!require('fs').existsSync(resolvedInputPath)) {
        throw new FileNotFoundError(resolvedInputPath);
      }

      const content = readFileSync(resolvedInputPath);

      // Use the directory of the input file as the basePath for imports
      const inputDir = path.dirname(resolvedInputPath);

      // Process force commands and update options FIRST
      const effectiveOptions = this.processForceCommands(content, {
        ...this.options,
        basePath: inputDir,
        enableFieldTracking: this.options.highlight,
      });

      // Determine output format using effective options (after force commands)
      if (effectiveOptions.pdf || effectiveOptions.html) {
        await this.generateFormattedOutputWithOptions(
          content,
          inputPath,
          outputPath,
          effectiveOptions
        );
      } else {
        // Normal markdown processing
        const result = processLegalMarkdown(content, effectiveOptions);

        if (outputPath) {
          const resolvedOutputPath = resolveFilePath(this.options.basePath, outputPath);
          writeFileSync(resolvedOutputPath, result.content);
          this.log(`Output written to: ${resolvedOutputPath}`, 'success');
          console.log('Successfully processed');
        } else {
          console.log(result.content);
        }

        if (result.exportedFiles && result.exportedFiles.length > 0) {
          this.log(`Exported files: ${result.exportedFiles.join(', ')}`, 'info');
        }

        if (result.metadata && this.options.verbose) {
          this.log('Metadata:', 'info');
          console.log(JSON.stringify(result.metadata, null, 2));
        }
      }
    } catch (error) {
      this.handleError(error);
      throw error; // Re-throw to allow CLI to handle exit codes
    }
  }

  /**
   * Processes content directly without file I/O
   *
   * @async
   * @param {string} content - The content to process
   * @returns {Promise<string>} The processed content
   * @throws {LegalMarkdownError} When processing fails
   */
  public async processContent(content: string): Promise<string> {
    try {
      // Process force commands and update options
      const effectiveOptions = this.processForceCommands(content, {
        ...this.options,
        enableFieldTracking: this.options.highlight,
      });

      const result = processLegalMarkdown(content, effectiveOptions);
      return result.content;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Logs messages with appropriate styling and prefixes
   *
   * @private
   * @param {string} message - The message to log
   * @param {'info' | 'success' | 'warn' | 'error'} [level='info'] - The log level
   * @returns {void}
   */
  private log(message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
    if (!this.options.verbose && level === 'info') return;

    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    };

    const prefix = {
      info: '📝',
      success: '✅',
      warn: '⚠️',
      error: '❌',
    };

    console.log(`${prefix[level]} ${colors[level](message)}`);
  }

  /**
   * Generates formatted output (HTML/PDF) from processed content
   *
   * @private
   * @async
   * @param {string} content - The content to format
   * @param {string} inputPath - Original input path for naming
   * @param {string} [outputPath] - Output path override
   * @returns {Promise<void>}
   */
  private async generateFormattedOutputWithOptions(
    content: string,
    inputPath: string,
    outputPath: string | undefined,
    options: Partial<CliOptions>
  ): Promise<void> {
    const baseOutputPath = outputPath || inputPath;
    const baseName = path.basename(baseOutputPath, path.extname(baseOutputPath));
    const dirName = path.dirname(baseOutputPath);

    // Get the directory of the input file for imports
    const resolvedInputPath = resolveFilePath(this.options.basePath, inputPath);
    const inputDir = path.dirname(resolvedInputPath);

    // Use the passed options (already processed for force commands)
    const generateOptions = {
      ...options,
      basePath: inputDir,
      includeHighlighting: options.highlight,
      cssPath: (options as any).cssPath || options.css,
      title: options.title || baseName,
      highlightCssPath: path.join(__dirname, 'styles/highlight.css'),
    };

    // Generate HTML if requested
    if (generateOptions.html) {
      if (generateOptions.highlight) {
        // Generate both normal and highlighted versions
        const normalHtmlPath = path.join(dirName, `${baseName}.html`);
        const highlightedHtmlPath = path.join(dirName, `${baseName}.HIGHLIGHT.html`);

        const normalHtmlContent = await generateHtml(content, {
          ...generateOptions,
          includeHighlighting: false,
        });
        const highlightedHtmlContent = await generateHtml(content, {
          ...generateOptions,
          includeHighlighting: true,
        });

        writeFileSync(normalHtmlPath, normalHtmlContent);
        writeFileSync(highlightedHtmlPath, highlightedHtmlContent);

        this.log(`HTML output written to: ${normalHtmlPath}`, 'success');
        this.log(`Highlighted HTML output written to: ${highlightedHtmlPath}`, 'success');
      } else {
        // Generate single HTML
        const htmlPath = path.join(dirName, `${baseName}.html`);
        const htmlContent = await generateHtml(content, generateOptions);
        writeFileSync(htmlPath, htmlContent);
        this.log(`HTML output written to: ${htmlPath}`, 'success');
      }
    }

    // Generate PDF if requested
    if (generateOptions.pdf) {
      if (generateOptions.highlight) {
        // Generate both normal and highlighted versions
        const normalPdfPath = path.join(dirName, `${baseName}.pdf`);
        const highlightedPdfPath = path.join(dirName, `${baseName}.HIGHLIGHT.pdf`);

        await generatePdfVersions(content, normalPdfPath, generateOptions);

        this.log(`PDF output written to: ${normalPdfPath}`, 'success');
        this.log(`Highlighted PDF output written to: ${highlightedPdfPath}`, 'success');
      } else {
        // Generate single PDF
        const pdfPath = path.join(dirName, `${baseName}.pdf`);
        await generatePdf(content, pdfPath, generateOptions);
        this.log(`PDF output written to: ${pdfPath}`, 'success');
      }
    }
  }

  /**
   * Handles and formats errors for user display
   *
   * @private
   * @param {unknown} error - The error to handle
   * @returns {void}
   */
  private handleError(error: unknown): void {
    if (error instanceof LegalMarkdownError) {
      this.log(`${error.name}: ${error.message}`, 'error');
      if (error.context && this.options.verbose) {
        console.log('Context:', error.context);
      }
    } else if (error instanceof Error) {
      this.log(`Error: ${error.message}`, 'error');
    } else {
      this.log(`Unexpected error: ${String(error)}`, 'error');
    }

    if (this.options.debug) {
      console.error(error);
    }
  }

  /**
   * Process force commands from content and apply them to options
   *
   * @private
   * @param {string} content - The content to analyze for force commands
   * @param {Partial<CliOptions>} baseOptions - Base options to extend
   * @returns {Partial<CliOptions>} Updated options with force commands applied
   */
  private processForceCommands(
    content: string,
    baseOptions: Partial<CliOptions>
  ): Partial<CliOptions> {
    try {
      // Parse YAML front matter to extract metadata
      const { metadata } = parseYamlFrontMatter(content, false);

      if (!metadata) {
        return baseOptions;
      }

      // Extract force commands from metadata
      const forceCommandsString = extractForceCommands(metadata);

      if (!forceCommandsString) {
        return baseOptions;
      }

      this.log(`Found force commands: ${forceCommandsString}`, 'info');

      // Parse the force commands
      const forceCommands = parseForceCommands(forceCommandsString, metadata, baseOptions);

      if (!forceCommands) {
        this.log('Failed to parse force commands', 'warn');
        return baseOptions;
      }

      // Apply force commands to base options
      const updatedOptions = applyForceCommands(baseOptions, forceCommands);

      this.log(`Applied force commands: ${Object.keys(forceCommands).join(', ')}`, 'success');

      return updatedOptions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error processing force commands: ${errorMessage}`, 'warn');
      return baseOptions;
    }
  }
}
