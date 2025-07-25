#!/usr/bin/env node

/**
 * @fileoverview Command Line Interface for Legal Markdown Processing
 *
 * This module provides a comprehensive CLI tool for processing Legal Markdown
 * documents with support for various output formats, processing options, and
 * input/output methods (files, stdin/stdout).
 *
 * Features:
 * - File and stdin input processing
 * - Multiple output formats (Markdown, HTML, PDF)
 * - Comprehensive processing options and flags
 * - Field highlighting and styling options
 * - Metadata export capabilities
 * - Error handling and user feedback
 * - Debug mode support
 *
 * @example
 * ```bash
 * # Process a file
 * legal-md input.md output.md
 *
 * # Generate PDF with highlighting
 * legal-md input.md --pdf --highlight --title "Contract"
 *
 * # Process from stdin
 * cat input.md | legal-md --stdin --stdout
 *
 * # Export metadata
 * legal-md input.md --export-yaml --output-path metadata.yaml
 * ```
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { LegalMarkdownOptions } from '@types';
import { CliService } from './service';
import { FileNotFoundError } from '@errors';

/**
 * Helper function to read content from standard input
 *
 * @async
 * @returns {Promise<string>} A promise that resolves to the stdin content
 * @throws {Error} When stdin reading fails
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', error => {
      reject(error);
    });
  });
}

// Create program
const program = new Command();

// Setup CLI information
program
  .name('legal-md')
  .description('Node.js implementation of LegalMarkdown for processing legal documents')
  .version('0.1.0');

// Main command
program
  .argument('[input]', 'Input file path')
  .argument('[output]', 'Output file path')
  .option('-d, --debug', 'Enable debug mode')
  .option('-y, --yaml', 'Process only YAML front matter')
  .option('--headers', 'Process only headers')
  .option('--no-headers', 'Skip header processing')
  .option('--no-clauses', 'Skip optional clause processing')
  .option('--no-references', 'Skip cross-reference processing')
  .option('--no-imports', 'Skip import processing')
  .option('--no-mixins', 'Skip mixin processing')
  .option('--no-reset', 'Disable header numbering reset (continuous numbering)')
  .option('--no-indent', 'Disable header indentation (flat formatting)')
  .option('--throwOnYamlError', 'Throw error on invalid YAML')
  .option('--to-markdown', 'Convert output to markdown format')
  .option('--stdin', 'Read from standard input')
  .option('--stdout', 'Write to standard output')
  .option('--export-yaml', 'Export metadata as YAML')
  .option('--export-json', 'Export metadata as JSON')
  .option('-o, --output-path <path>', 'Path for metadata export')
  .option('--pdf', 'Generate PDF output')
  .option('--html', 'Generate HTML output')
  .option('--highlight', 'Enable field highlighting in HTML/PDF output')
  .option('--enable-field-tracking', 'Add field tracking spans to markdown output')
  .option('--css <path>', 'Path to custom CSS file for HTML/PDF')
  .option('--title <title>', 'Document title for HTML/PDF')
  .action(async (input, output, options) => {
    try {
      // Handle stdin input
      if (options.stdin) {
        const stdinContent = await readStdin();
        const cliOptions: LegalMarkdownOptions & {
          verbose?: boolean;
          pdf?: boolean;
          html?: boolean;
          highlight?: boolean;
          css?: string;
          title?: string;
        } = {
          debug: options.debug,
          yamlOnly: options.yaml,
          noHeaders: options.headers === false,
          noClauses: options.headers === true ? true : options.clauses === false,
          noReferences: options.headers === true ? true : options.references === false,
          noImports: options.headers === true ? true : options.imports === false,
          noMixins: options.headers === true ? true : options.mixins === false,
          noReset: options.reset === false,
          noIndent: options.indent === false,
          throwOnYamlError: options.throwOnYamlError,
          toMarkdown: options.toMarkdown,
          exportMetadata: options.exportYaml || options.exportJson,
          exportFormat: options.exportYaml ? 'yaml' : 'json',
          exportPath: options.outputPath,
          basePath: process.cwd(),
          verbose: options.debug,
          pdf: options.pdf,
          html: options.html,
          highlight: options.highlight,
          enableFieldTrackingInMarkdown: options.enableFieldTracking,
          css: options.css,
          title: options.title,
        };

        const cliService = new CliService(cliOptions);
        const result = await cliService.processContent(stdinContent);

        // When using stdin, first argument is the output file
        const outputFile = input;

        if (options.stdout || !outputFile) {
          console.log(result);
        } else {
          require('fs').writeFileSync(outputFile, result);
          console.error(`✅ Output written to: ${outputFile}`);
        }
        return;
      }

      // Handle input file
      if (!input) {
        console.error(chalk.red('Error: Input file is required\n'));
        console.error(chalk.yellow('Usage examples:'));
        console.error(
          chalk.cyan('  legal-md document.md output.md           ') + '# Process file to file'
        );
        console.error(
          chalk.cyan('  legal-md document.md --stdout            ') + '# Process file to stdout'
        );
        console.error(chalk.cyan('  legal-md document.md --pdf --title "Doc" ') + '# Generate PDF');
        console.error(
          chalk.cyan('  legal-md document.md --html --highlight  ') +
            '# Generate HTML with highlighting'
        );
        console.error(
          chalk.cyan('  cat document.md | legal-md --stdin       ') + '# Process from stdin'
        );
        console.error(
          chalk.cyan('  legal-md --help                          ') + '# Show all options\n'
        );
        process.exit(1);
      }

      const cliOptions: LegalMarkdownOptions & {
        verbose?: boolean;
        pdf?: boolean;
        html?: boolean;
        highlight?: boolean;
        css?: string;
        title?: string;
      } = {
        debug: options.debug,
        yamlOnly: options.yaml,
        noHeaders: options.headers === false,
        noClauses: options.headers === true ? true : options.clauses === false,
        noReferences: options.headers === true ? true : options.references === false,
        noImports: options.headers === true ? true : options.imports === false,
        noMixins: options.headers === true ? true : options.mixins === false,
        noReset: options.reset === false,
        noIndent: options.indent === false,
        throwOnYamlError: options.throwOnYamlError,
        toMarkdown: options.toMarkdown,
        exportMetadata: options.exportYaml || options.exportJson,
        exportFormat: options.exportYaml ? 'yaml' : 'json',
        exportPath: options.outputPath,
        basePath: process.cwd(),
        verbose: options.debug,
        pdf: options.pdf,
        html: options.html,
        highlight: options.highlight,
        enableFieldTrackingInMarkdown: options.enableFieldTracking,
        css: options.css,
        title: options.title,
      };

      const cliService = new CliService(cliOptions);

      // Force stdout if --stdout flag is used
      if (options.stdout) {
        await cliService.processFile(input);
      } else {
        await cliService.processFile(input, output);
      }
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        console.error(chalk.red('Error: Input file not found'));
        process.exit(1);
      }

      console.error(chalk.red('Error processing document:'));
      console.error(error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
