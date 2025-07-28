/**
 * Display formatting utilities for Interactive CLI
 *
 * This module provides consistent formatting functions for displaying
 * configuration summaries, success messages, errors, and warnings
 * throughout the interactive CLI experience.
 */

import chalk from 'chalk';
import { InteractiveConfig } from '../types';

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
  const { inputFile, outputFilename, outputFormats, processingOptions, cssFile } = config;

  let summary = chalk.bold.cyan('\n📋 Configuration Summary:\n\n');

  // Input file
  summary += `📁 ${chalk.bold('Input file:')} ${inputFile}\n`;

  // Output filename
  summary += `📝 ${chalk.bold('Output filename:')} ${outputFilename}\n`;

  // Output formats
  const formats = [];
  if (outputFormats.pdf) formats.push('PDF');
  if (outputFormats.html) formats.push('HTML');
  if (outputFormats.markdown) formats.push('Markdown');
  if (outputFormats.metadata) formats.push('Metadata');

  summary += `🎯 ${chalk.bold('Output formats:')} ${formats.join(', ')}\n`;

  // CSS file
  if (cssFile) {
    summary += `🎨 ${chalk.bold('CSS file:')} ${cssFile}\n`;
  } else if (outputFormats.html || outputFormats.pdf) {
    summary += `🎨 ${chalk.bold('CSS file:')} None\n`;
  }

  // Processing options
  const options = [];
  if (processingOptions.debug) options.push('Debug');
  if (processingOptions.fieldTracking) options.push('Field tracking');
  if (processingOptions.highlight) options.push('Highlight');

  if (options.length > 0) {
    summary += `⚙️  ${chalk.bold('Processing options:')} ${options.join(', ')}\n`;
  }

  summary += '\n';
  return summary;
}

/**
 * Format success message with generated files list
 *
 * Creates a celebratory success message displaying all the files
 * that were successfully generated during processing.
 *
 * @param outputFiles Array of absolute paths to generated output files
 * @returns Formatted success message with file list
 */
export function formatSuccessMessage(outputFiles: string[]): string {
  let message = chalk.bold.green('\n✅ Files generated successfully!\n\n');

  for (const file of outputFiles) {
    message += `📄 ${chalk.cyan(file)}\n`;
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
  return chalk.bold.red(`\n❌ Error: ${error}\n`);
}

/**
 * Format warning message with consistent styling
 *
 * @param warning Warning message text to display
 * @returns Formatted warning message with yellow styling and warning icon
 */
export function formatWarningMessage(warning: string): string {
  return chalk.bold.yellow(`\n⚠️  Warning: ${warning}\n`);
}
