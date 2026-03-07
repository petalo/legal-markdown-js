/**
 * Display formatting utilities for Interactive CLI
 *
 * This module provides consistent formatting functions for displaying
 * configuration summaries, success messages, errors, and warnings
 * throughout the interactive CLI experience.
 */

import chalk from 'chalk';
import { InteractiveConfig, ProcessingResult } from '../types';

/**
 * Format the configuration summary for confirmation display
 *
 * Creates a comprehensive, visually appealing summary of the user's
 * selected configuration options, formatted with colors and icons
 * for easy reading and confirmation.
 *
 * @param config Complete interactive configuration to summarize
 * @returns Formatted configuration summary string with colors and icons
 */
export function formatConfigSummary(config: InteractiveConfig): string {
  const { inputFile, outputFilename, outputFormats, processingOptions, archiveOptions, cssFile } =
    config;

  let summary = chalk.bold('\nConfiguration summary:\n\n');

  summary += `  Input:      ${inputFile}\n`;
  summary += `  Output:     ${outputFilename}\n`;

  const formats = [];
  if (outputFormats.pdf) formats.push('PDF');
  if (outputFormats.html) formats.push('HTML');
  if (outputFormats.docx) formats.push('DOCX');
  if (outputFormats.markdown) formats.push('Markdown');
  if (outputFormats.metadata) formats.push('Metadata');
  summary += `  Formats:    ${formats.join(', ')}\n`;

  if (outputFormats.html || outputFormats.pdf || outputFormats.docx) {
    summary += `  CSS:        ${cssFile || 'none'}\n`;
  }

  const options = [];
  if (processingOptions.debug) options.push('debug');
  if (processingOptions.fieldTracking) options.push('field tracking');
  if (processingOptions.highlight) options.push('highlight');

  if (options.length > 0) {
    summary += `  Options:    ${options.join(', ')}\n`;
  }

  if (archiveOptions.enabled) {
    const archiveDir = archiveOptions.directory || 'default archive directory';
    summary += `  Archiving:  enabled -> ${chalk.cyan(archiveDir)}\n`;
    summary += `              ${chalk.gray('Smart archiving will determine file handling based on content changes')}\n`;
  } else {
    summary += `  Archiving:  disabled\n`;
  }

  summary += '\n';
  return summary;
}

/**
 * Format success message with generated files list and archive results
 *
 * Creates a celebratory success message displaying all the files
 * that were successfully generated during processing, plus information
 * about archiving results if archiving was enabled.
 *
 * @param outputFiles Array of absolute paths to generated output files
 * @param archiveResult Archive operation results (if archiving was enabled)
 * @returns Formatted success message with file list and archive info
 */
export function formatSuccessMessage(
  outputFiles: string[],
  archiveResult?: ProcessingResult['archiveResult']
): string {
  let message = chalk.bold.green('\n✓ Processing complete\n\n');

  message += chalk.bold('Generated:\n');
  for (const file of outputFiles) {
    message += `  -> ${chalk.cyan(file)}\n`;
  }

  if (archiveResult && !archiveResult.success) {
    message += '\n';
    message += chalk.bold('Archiving:\n');
    message += `  ${chalk.red('✗')} Archiving failed: ${archiveResult.error}\n`;
  }

  message += '\n';
  return message;
}

/**
 * Format error message with consistent styling
 *
 * @param error Error message text to display
 * @returns Formatted error message with red styling and error icon
 */
export function formatErrorMessage(error: string): string {
  return chalk.bold.red(`\n✗ Error: ${error}\n`);
}

/**
 * Format warning message with consistent styling
 *
 * @param warning Warning message text to display
 * @returns Formatted warning message with yellow styling and warning icon
 */
export function formatWarningMessage(warning: string): string {
  return chalk.yellow(`\n! Warning: ${warning}\n`);
}
