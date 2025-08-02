/**
 * CLI Service for Legal Markdown Processing
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
 *
 * @module
 */

import { generateHtml, generatePdf } from '../index';
import { processLegalMarkdownWithRemark } from '../extensions/remark/legal-markdown-processor';
import { LegalMarkdownOptions } from '../types';
import { readFileSync, writeFileSync, resolveFilePath } from '../utils/index';
import { LegalMarkdownError, FileNotFoundError } from '../errors/index';
import {
  extractForceCommands,
  parseForceCommands,
  applyForceCommands,
} from '../core/parsers/force-commands-parser';
import { parseYamlFrontMatter } from '../core/parsers/yaml-parser';
import { RESOLVED_PATHS } from '../constants/index';
import { ArchiveManager } from '../utils/archive-manager';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

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
  /** Suppress success output messages */
  silent?: boolean;
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
  /** Archive source file after successful processing */
  archiveSource?: string | boolean;
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
   * Resolves output file path using environment variables for relative paths
   *
   * @param {string} outputPath - The output path to resolve
   * @returns {string} The resolved absolute output path
   * @private
   */
  private resolveOutputPath(outputPath: string): string {
    if (path.isAbsolute(outputPath)) {
      return outputPath;
    }

    return resolveFilePath(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR, outputPath);
  }

  /**
   * Determines the output directory for generated files
   *
   * @param {string | undefined} outputPath - The output path (if provided)
   * @returns {string} The directory to use for output files
   * @private
   */
  private getOutputDirectory(outputPath: string | undefined): string {
    if (outputPath && path.isAbsolute(outputPath)) {
      return path.dirname(outputPath);
    }

    return RESOLVED_PATHS.DEFAULT_OUTPUT_DIR;
  }

  /**
   * Processes a file from input path to output path
   *
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
      if (!fs.existsSync(resolvedInputPath)) {
        throw new FileNotFoundError(resolvedInputPath);
      }

      const content = readFileSync(resolvedInputPath);

      // Use the directory of the input file as the basePath for imports
      const inputDir = path.dirname(resolvedInputPath);

      // Process force commands and update options FIRST
      const effectiveOptions = this.processForceCommands(content, {
        ...this.options,
        basePath: inputDir,
        enableFieldTracking: this.options.enableFieldTracking,
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
        // Process using remark-based processor
        this.log('Using remark-based processor', 'info');
        const result = await processLegalMarkdownWithRemark(content, {
          basePath: effectiveOptions.basePath,
          enableFieldTracking: effectiveOptions.enableFieldTracking,
          debug: effectiveOptions.debug,
          yamlOnly: effectiveOptions.yamlOnly,
          noHeaders: effectiveOptions.noHeaders,
          noClauses: effectiveOptions.noClauses,
          noReferences: effectiveOptions.noReferences,
          noImports: effectiveOptions.noImports,
          noMixins: effectiveOptions.noMixins,
          noReset: effectiveOptions.noReset,
          noIndent: false, // CLI markdown output should preserve indentation
          throwOnYamlError: effectiveOptions.throwOnYamlError,
          exportMetadata: effectiveOptions.exportMetadata,
          exportFormat: effectiveOptions.exportFormat,
          exportPath: effectiveOptions.exportPath,
        });

        if (outputPath) {
          const resolvedOutputPath = this.resolveOutputPath(outputPath);
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

        // Archive source file if requested
        await this.handleArchiving(resolvedInputPath, content, result.content);
      }
    } catch (error) {
      this.handleError(error);
      throw error; // Re-throw to allow CLI to handle exit codes
    }
  }

  /**
   * Processes content directly without file I/O
   *
   * @param {string} content - The content to process
   * @returns {Promise<string>} The processed content
   * @throws {LegalMarkdownError} When processing fails
   */
  public async processContent(content: string): Promise<string> {
    try {
      // Process force commands and update options
      const effectiveOptions = this.processForceCommands(content, {
        ...this.options,
        enableFieldTracking: this.options.enableFieldTracking,
      });

      // Handle auto-populate headers mode
      if (effectiveOptions.autoPopulateHeaders) {
        const { autoPopulateYamlFrontMatter } = await import('../core/yaml/yaml-auto-population');
        return autoPopulateYamlFrontMatter(content);
      }

      // Process using remark-based processor
      const result = await processLegalMarkdownWithRemark(content, {
        basePath: effectiveOptions.basePath,
        enableFieldTracking: effectiveOptions.enableFieldTracking,
        debug: effectiveOptions.debug,
        yamlOnly: effectiveOptions.yamlOnly,
        noHeaders: effectiveOptions.noHeaders,
        noClauses: effectiveOptions.noClauses,
        noReferences: effectiveOptions.noReferences,
        noImports: effectiveOptions.noImports,
        noMixins: effectiveOptions.noMixins,
        noReset: effectiveOptions.noReset,
        noIndent: false, // CLI markdown output should preserve indentation
        throwOnYamlError: effectiveOptions.throwOnYamlError,
        exportMetadata: effectiveOptions.exportMetadata,
        exportFormat: effectiveOptions.exportFormat,
        exportPath: effectiveOptions.exportPath,
      });

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
    const dirName = this.getOutputDirectory(outputPath);

    // Get the directory of the input file for imports
    const resolvedInputPath = resolveFilePath(this.options.basePath, inputPath);
    const inputDir = path.dirname(resolvedInputPath);

    // Resolve CSS path if provided
    let cssPath: string | undefined =
      ((options as Record<string, unknown>).cssPath as string) || options.css;
    if (typeof cssPath === 'string' && cssPath && !path.isAbsolute(cssPath)) {
      // If CSS path is relative, resolve it against STYLES_DIR
      cssPath = path.resolve(RESOLVED_PATHS.STYLES_DIR, cssPath);
    } else if (typeof cssPath !== 'string') {
      cssPath = undefined;
    }

    // Use the passed options (already processed for force commands)
    const generateOptions = {
      ...options,
      basePath: inputDir,
      includeHighlighting: options.highlight,
      cssPath,
      highlightCssPath: path.join(process.cwd(), 'src/styles/highlight.css'),
      title: options.title || baseName,
      // Force noIndent: true for HTML/PDF generation to prevent indented headers 
      // from being interpreted as code blocks by remark
      noIndent: true,
    };

    const generatedFiles: string[] = [];

    // Generate HTML if requested
    if (generateOptions.html) {
      if (generateOptions.highlight) {
        // Generate both normal and highlighted versions
        const htmlPath = path.join(dirName, `${baseName}.html`);
        const highlightHtmlPath = path.join(dirName, `${baseName}.HIGHLIGHT.html`);

        // Normal version (without highlight CSS)
        const normalHtmlContent = await generateHtml(content, {
          ...generateOptions,
          includeHighlighting: false,
        });
        writeFileSync(htmlPath, normalHtmlContent);

        // Highlighted version (with highlight CSS)
        const highlightHtmlContent = await generateHtml(content, {
          ...generateOptions,
          includeHighlighting: true,
        });

        writeFileSync(highlightHtmlPath, highlightHtmlContent);

        generatedFiles.push(htmlPath, highlightHtmlPath);
      } else {
        // Generate single HTML without highlighting
        const htmlPath = path.join(dirName, `${baseName}.html`);
        const htmlContent = await generateHtml(content, {
          ...generateOptions,
          includeHighlighting: false,
        });
        writeFileSync(htmlPath, htmlContent);
        generatedFiles.push(htmlPath);
      }
    }

    // Generate PDF if requested
    if (generateOptions.pdf) {
      if (generateOptions.highlight) {
        // Generate both normal and highlighted versions
        const pdfPath = path.join(dirName, `${baseName}.pdf`);
        const highlightPdfPath = path.join(dirName, `${baseName}.HIGHLIGHT.pdf`);

        // Normal version (without highlight CSS)
        await generatePdf(content, pdfPath, {
          ...generateOptions,
          includeHighlighting: false,
        });

        // Highlighted version (with highlight CSS)
        await generatePdf(content, highlightPdfPath, {
          ...generateOptions,
          includeHighlighting: true,
        });

        generatedFiles.push(pdfPath, highlightPdfPath);
      } else {
        // Generate single PDF without highlighting
        const pdfPath = path.join(dirName, `${baseName}.pdf`);
        await generatePdf(content, pdfPath, generateOptions);
        generatedFiles.push(pdfPath);
      }
    }

    // Process markdown using remark processor
    const markdownResult = await processLegalMarkdownWithRemark(content, {
      basePath: generateOptions.basePath,
      enableFieldTracking: generateOptions.enableFieldTracking,
      debug: generateOptions.debug,
      yamlOnly: generateOptions.yamlOnly,
      noHeaders: generateOptions.noHeaders,
      noClauses: generateOptions.noClauses,
      noReferences: generateOptions.noReferences,
      noImports: generateOptions.noImports,
      noMixins: generateOptions.noMixins,
      noReset: generateOptions.noReset,
      noIndent: false, // CLI markdown output should preserve indentation
      throwOnYamlError: generateOptions.throwOnYamlError,
      exportMetadata: generateOptions.exportMetadata,
      exportFormat: generateOptions.exportFormat,
      exportPath: generateOptions.exportPath,
    });

    if (options.toMarkdown || (!generateOptions.html && !generateOptions.pdf)) {
      const mdPath = path.join(dirName, `${baseName}.md`);
      writeFileSync(mdPath, markdownResult.content);
      generatedFiles.push(mdPath);
    }

    // Show generated files
    this.showGeneratedFiles(generatedFiles, generateOptions.highlight);

    // Archive source file if requested
    await this.handleArchiving(resolvedInputPath, content, markdownResult.content);
  }

  /**
   * Show generated files with proper grouping and formatting
   *
   * @private
   * @param {string[]} files - Array of generated file paths
   * @param {boolean} hasHighlight - Whether highlight versions were generated
   */
  private showGeneratedFiles(files: string[], hasHighlight?: boolean): void {
    if (files.length === 0 || this.options.silent) {
      return;
    }

    this.log('Files generated successfully!', 'success');
    console.log(chalk.bold('\n📄 Generated files:'));

    if (hasHighlight) {
      // Group files by extension
      const grouped = new Map<string, { normal: string; highlight?: string }>();

      for (const file of files) {
        const ext = path.extname(file);
        const basename = path.basename(file, ext);
        const isHighlight = basename.includes('.HIGHLIGHT');

        if (isHighlight) {
          const normalBasename = basename.replace('.HIGHLIGHT', '');
          const key = `${normalBasename}${ext}`;
          const existing = grouped.get(key) || { normal: '' };
          existing.highlight = file;
          grouped.set(key, existing);
        } else {
          const key = `${basename}${ext}`;
          const existing = grouped.get(key) || { normal: file };
          existing.normal = file;
          grouped.set(key, existing);
        }
      }

      // Show grouped files by extension
      const extensions = new Set(
        Array.from(grouped.keys()).map(key => key.split('.').pop()?.toLowerCase())
      );

      for (const ext of ['md', 'html', 'pdf']) {
        if (!extensions.has(ext)) continue;

        console.log(chalk.gray(`\n   ${ext.toUpperCase()}:`));

        for (const [key, fileGroup] of grouped) {
          if (!key.endsWith(`.${ext}`)) continue;

          if (fileGroup.normal) {
            console.log(`   ${chalk.cyan(fileGroup.normal)}`);
          }
          if (fileGroup.highlight) {
            console.log(`   ${chalk.cyan(fileGroup.highlight)}`);
          }
        }
      }
    } else {
      // Simple list when no highlight
      for (const file of files) {
        console.log(`   ${chalk.cyan(file)}`);
      }
    }
  }

  /**
   * Handle archiving of source file after successful processing
   *
   * @private
   * @param {string} inputPath - Path to the source file to archive
   * @param {string} originalContent - Original file content
   * @param {string} processedContent - Processed file content
   * @returns {Promise<void>}
   */
  private async handleArchiving(
    inputPath: string,
    originalContent: string,
    processedContent: string
  ): Promise<void> {
    // Only archive if the option is enabled
    if (!this.options.archiveSource) {
      return;
    }

    try {
      const archiveManager = new ArchiveManager();

      // Determine archive directory
      let archiveDir: string;
      if (typeof this.options.archiveSource === 'string') {
        // Custom directory provided
        archiveDir = this.options.archiveSource;
      } else {
        // Use default from environment/config
        archiveDir = RESOLVED_PATHS.ARCHIVE_DIR;
      }

      // Use smart archiving that compares original vs processed content
      const result = await archiveManager.smartArchiveFile(inputPath, {
        archiveDir,
        createDirectory: true,
        conflictResolution: 'rename',
        originalContent,
        processedContent,
      });

      if (result.success) {
        if (result.contentsIdentical) {
          this.log(`Source file archived to: ${result.archivedPath}`, 'success');
        } else {
          this.log(`Original archived to: ${result.archivedOriginalPath}`, 'success');
          this.log(`Processed archived to: ${result.archivedProcessedPath}`, 'success');
        }
      } else {
        this.log(`Warning: Failed to archive source file: ${result.error}`, 'warn');
      }
    } catch (error) {
      // Don't fail the entire operation if archiving fails
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Warning: Archive operation failed: ${errorMessage}`, 'warn');
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
