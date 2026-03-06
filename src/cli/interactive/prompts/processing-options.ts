/**
 * @fileoverview Processing options prompts for Interactive CLI
 */

import { checkbox } from '@inquirer/prompts';
import { CliProcessingOptions, OutputFormat } from '../types';

/**
 * Prompt user for processing options based on selected output formats
 */
export async function promptProcessingOptions(
  outputFormats: OutputFormat
): Promise<CliProcessingOptions> {
  console.log('\n⚙️  Processing Options:\n');

  // Build choices based on selected output formats
  const choices = [{ name: '🐛 Debug mode', value: 'debug', checked: false }];

  // Add field tracking only if Markdown is selected
  if (outputFormats.markdown) {
    choices.push({
      name: '📝 Field tracking in Markdown output',
      value: 'fieldTracking',
      checked: false,
    });
  }

  // Add highlight only if HTML, PDF, or DOCX is selected - pre-selected by default
  if (outputFormats.html || outputFormats.pdf || outputFormats.docx) {
    choices.push({
      name: '🎯 Field highlighting in HTML/PDF/DOCX output',
      value: 'highlight',
      checked: true,
    });
  }

  // If only debug is available, still show the checkbox for consistency
  const selectedOptions = await checkbox({
    message: 'Select processing options:',
    choices,
  });

  return {
    debug: selectedOptions.includes('debug'),
    fieldTracking: selectedOptions.includes('fieldTracking'),
    highlight: selectedOptions.includes('highlight'),
  };
}
