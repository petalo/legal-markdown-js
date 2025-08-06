#!/usr/bin/env node

/**
 * Interactive CLI for Legal Markdown Processing
 *
 * This module provides an interactive command-line interface for Legal Markdown
 * processing, guiding users through file selection, format options, and processing
 * configuration with intuitive prompts.
 *
 * Features:
 * - Interactive file selection with recursive directory scanning
 * - Multiple output format selection (HTML, PDF, Markdown, Metadata)
 * - Conditional processing options based on selected formats
 * - CSS file selection for HTML/PDF styling
 * - Configuration confirmation and summary display
 * - Integration with existing CliService for processing
 *
 * @example
 * ```bash
 * # Launch interactive mode
 * legal-md-ui
 * ```
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { selectInputFile } from './prompts/file-selector';
import { selectOutputFormats } from './prompts/output-format';
import { promptProcessingOptions } from './prompts/processing-options';
import { selectCssFile } from './prompts/css-selector';
import { promptOutputFilename } from './prompts/filename';
import { promptArchiveOptions } from './prompts/archive-options';
import { confirmConfiguration } from './prompts/confirmation';
import { handleFirstTimeUserExperience } from './prompts/ftux-handler';
import { InteractiveService } from './service';
import { InteractiveConfig } from './types';
import { formatSuccessMessage, formatErrorMessage } from './utils/format-helpers';
import { readFileSync } from '../../utils/index';
import { parseYamlFrontMatter } from '../../core/parsers/yaml-parser';
import {
  extractForceCommands,
  parseForceCommands,
  applyForceCommands,
} from '../../core/parsers/force-commands-parser';
import { CliService } from '../service';
import * as path from 'path';
import { RESOLVED_PATHS } from '../../constants/index';

/**
 * Run FTUX (First-Time User Experience) mode
 *
 * Provides a guided onboarding experience for new users with options to:
 * - Set up configuration files
 * - Try demo examples
 * - Get help and tutorials
 * - Browse for files manually
 *
 * @returns Promise that resolves when FTUX completes
 * @throws Error when FTUX fails or user cancels
 */
async function runFtuxMode(): Promise<void> {
  try {
    console.log(chalk.bold.blue('\n🌟 Legal Markdown - First-Time User Experience\n'));
    console.log(chalk.gray("Welcome! Let's get you started with Legal Markdown processing.\n"));

    // Run the FTUX flow
    const selectedFile = await handleFirstTimeUserExperience();

    // If a file was selected from FTUX, continue with normal processing
    if (selectedFile) {
      console.log(chalk.green(`\n✅ Selected: ${selectedFile}`));
      console.log(chalk.gray('Continuing with normal processing flow...\n'));

      // Continue with the normal interactive flow starting from step 2
      await continueInteractiveFlow(selectedFile);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log(chalk.yellow('\n👋 Thanks for trying Legal Markdown!\n'));
      return;
    }

    console.log(formatErrorMessage(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Continue interactive flow from a selected file (used after FTUX)
 *
 * @param inputFile - The file selected from FTUX
 */
async function continueInteractiveFlow(inputFile: string): Promise<void> {
  // Check for force commands in the file's frontmatter
  try {
    const content = readFileSync(inputFile);
    const { metadata } = parseYamlFrontMatter(content);
    const forceCommandsStr = extractForceCommands(metadata);

    if (forceCommandsStr) {
      console.log(
        chalk.cyan('\n📋 Found force commands in document. Executing automatic configuration...\n')
      );

      // Parse the force commands
      const forceCommands = parseForceCommands(forceCommandsStr, metadata);

      if (forceCommands) {
        // Apply force commands using CliService directly
        const baseOptions = {
          debug: false,
          yamlOnly: false,
          noHeaders: false,
          noClauses: false,
          noReferences: false,
          noImports: false,
          noMixins: false,
          noReset: false,
          noIndent: false,
          throwOnYamlError: false,
          basePath: path.dirname(inputFile),
        };

        // Apply force commands to base options
        const options = applyForceCommands(baseOptions, forceCommands);

        // Determine output path
        const outputBaseName =
          forceCommands.output || path.basename(inputFile, path.extname(inputFile));
        const outputDir = forceCommands.outputPath || RESOLVED_PATHS.DEFAULT_OUTPUT_DIR;

        // Process file with forced configuration - silent to avoid duplicate success messages
        const cliService = new CliService({
          ...options,
          silent: true,
        });

        // Determine output file path - add extension to prevent path.basename from truncating name
        // CliService will replace this extension with the appropriate ones for each format
        const outputFile = path.join(outputDir, `${outputBaseName}.pdf`);

        // Process once - CliService will handle all requested formats and highlight versions automatically
        await cliService.processFile(inputFile, outputFile);

        // Build list of expected output files for display
        const outputFiles: string[] = [];

        if (forceCommands.pdf) {
          outputFiles.push(path.join(outputDir, `${outputBaseName}.pdf`));

          if (forceCommands.highlight) {
            outputFiles.push(path.join(outputDir, `${outputBaseName}.HIGHLIGHT.pdf`));
          }
        }

        if (forceCommands.html) {
          outputFiles.push(path.join(outputDir, `${outputBaseName}.html`));

          if (forceCommands.highlight) {
            outputFiles.push(path.join(outputDir, `${outputBaseName}.HIGHLIGHT.html`));
          }
        }

        // Show success message
        console.log(formatSuccessMessage(outputFiles));
        return;
      }
    }
  } catch (error) {
    // If there's any error parsing force commands, continue with normal flow
    console.log(
      chalk.gray('No force commands found or error parsing. Continuing with interactive mode...\n')
    );
  }

  // Normal interactive flow
  // Step 2: Select output formats
  const outputFormats = await selectOutputFormats();

  // Step 3: Configure processing options
  const processingOptions = await promptProcessingOptions(outputFormats);

  // Step 4: Select CSS file (if needed)
  const cssFile = await selectCssFile(outputFormats);

  // Step 5: Enter output filename
  const outputFilename = await promptOutputFilename(inputFile);

  // Step 6: Configure archive options
  const archiveResult = await promptArchiveOptions();
  const archiveOptions = {
    enabled: archiveResult.enableArchiving,
    directory: archiveResult.archiveDirectory,
  };

  // Build configuration
  const config: InteractiveConfig = {
    inputFile,
    outputFilename,
    outputFormats,
    processingOptions,
    archiveOptions,
    cssFile,
  };

  // Step 7: Confirm configuration
  const confirmed = await confirmConfiguration(config);

  if (!confirmed) {
    console.log(chalk.yellow('\n❌ Operation cancelled.\n'));
    return;
  }

  // Step 8: Process files
  const service = new InteractiveService(config);
  const result = await service.processFile(inputFile);

  // Step 9: Show results
  console.log(formatSuccessMessage(result.outputFiles, result.archiveResult));
}

/**
 * Main interactive flow that guides users through the complete Legal Markdown processing workflow
 *
 * This function orchestrates the entire interactive experience by:
 * 1. Displaying welcome message and scanning for input files
 * 2. Prompting for file selection from available documents
 * 3. Collecting output format preferences (PDF, HTML, Markdown, Metadata)
 * 4. Gathering processing options based on selected formats
 * 5. Optional CSS file selection for styling
 * 6. Output filename specification
 * 7. Archive options configuration
 * 8. Configuration confirmation and processing execution
 *
 * @returns Promise that resolves when the interactive flow completes
 * @throws Error when processing fails or user cancels operation
 */
async function runInteractiveMode(): Promise<void> {
  try {
    console.log(chalk.bold.blue('\n🎯 Legal Markdown Interactive CLI\n'));
    console.log(chalk.gray('Follow the prompts to configure your document processing.\n'));

    // Step 1: Select input file
    const inputFile = await selectInputFile();

    // Continue with the rest of the flow
    await continueInteractiveFlow(inputFile);
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log(chalk.yellow('\n👋 Goodbye!\n'));
      return;
    }

    console.log(formatErrorMessage(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Create program
const program = new Command();

// Setup CLI information
program
  .name('legal-md-ui')
  .description('Interactive CLI for Legal Markdown document processing')
  .version('0.1.0')
  .option('--ftux', 'Launch First-Time User Experience (setup wizard)')
  .action(async options => {
    if (options.ftux) {
      await runFtuxMode();
    } else {
      await runInteractiveMode();
    }
  });

// Parse command line arguments
program.parse();
