/**
 * @fileoverview Output format selection prompt for Interactive CLI
 */

import { checkbox } from '@inquirer/prompts';
import { OutputFormat } from '../types';

/**
 * Prompt user to select output formats
 */
export async function selectOutputFormats(): Promise<OutputFormat> {
  const selectedFormats = await checkbox({
    message: 'Select output formats:',
    choices: [
      { name: '🌐 HTML', value: 'html' },
      { name: '📄 PDF', value: 'pdf', checked: true }, // Default selected
      { name: '🧾 DOCX', value: 'docx' },
      { name: '📝 Markdown', value: 'markdown' },
      { name: '📊 Export metadata (YAML/JSON)', value: 'metadata' },
    ],
    required: true, // This ensures at least one option is selected
  });

  return {
    html: selectedFormats.includes('html'),
    pdf: selectedFormats.includes('pdf'),
    docx: selectedFormats.includes('docx'),
    markdown: selectedFormats.includes('markdown'),
    metadata: selectedFormats.includes('metadata'),
  };
}
