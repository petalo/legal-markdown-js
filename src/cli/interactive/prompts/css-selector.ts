/**
 * CSS file selection prompt for Interactive CLI
 *
 * @module
 */

import { select } from '@inquirer/prompts';
import { RESOLVED_PATHS } from '../../../constants/index';
import { scanCssFiles } from '../utils/file-scanner';
import { formatWarningMessage } from '../utils/format-helpers';
import { OutputFormat } from '../types';

const NO_CSS_OPTION = 'No custom CSS';

/**
 * Prompt user to select a CSS file if HTML or PDF formats are selected
 */
export async function selectCssFile(outputFormats: OutputFormat): Promise<string | undefined> {
  // Only show CSS selection if HTML or PDF is selected
  if (!outputFormats.html && !outputFormats.pdf) {
    return undefined;
  }

  console.log('\n🎨 CSS Selection:\n');

  const cssFiles = scanCssFiles(RESOLVED_PATHS.STYLES_DIR);

  if (cssFiles.length === 0) {
    console.log(formatWarningMessage(`No CSS files found in ${RESOLVED_PATHS.STYLES_DIR}`));
    return undefined;
  }

  const choices = [
    { name: NO_CSS_OPTION, value: undefined },
    ...cssFiles.map(file => ({
      name: file,
      value: file,
    })),
  ];

  // If there's only one CSS file, pre-select it
  const defaultChoice = cssFiles.length === 1 ? cssFiles[0] : undefined;

  const selectedCss = await select({
    message: 'Select a CSS file for styling:',
    choices,
    default: defaultChoice,
  });

  return selectedCss;
}
