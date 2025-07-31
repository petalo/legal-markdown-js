/**
 * File selection prompt for Interactive CLI
 *
 * This module handles the file selection process, providing users with
 * options to select from discovered files, browse directories, or
 * manually enter file paths.
 *
 * @module
 */

import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { RESOLVED_PATHS } from '../../../constants/index';
import { scanDirectory } from '../utils/file-scanner';
import { formatWarningMessage } from '../utils/format-helpers';
import { handleFirstTimeUserExperience } from './ftux-handler';
import { handleBrowseFolder, handleManualInput } from '../utils/file-input-helpers';

/** Option for browsing alternative directories */
const BROWSE_OPTION = '📁 Browse other folder...';
/** Option for manual path entry */
const MANUAL_OPTION = '📝 Enter path manually...';
/** Option for exiting the application */
const EXIT_OPTION = '❌ Exit';

/**
 * Prompt user to select an input file
 *
 * Initiates the file selection process by scanning the default input directory
 * and presenting available files to the user. If no files are found, falls back
 * to manual input options.
 *
 * @returns Promise resolving to the absolute path of the selected input file
 * @throws Error when user cancels or no valid file is selected
 */
export async function selectInputFile(): Promise<string> {
  console.log(chalk.cyan(`🔍 Searching for files in: ${RESOLVED_PATHS.DEFAULT_INPUT_DIR}\n`));

  const files = scanDirectory(RESOLVED_PATHS.DEFAULT_INPUT_DIR);

  if (files.length === 0) {
    console.log(formatWarningMessage('No supported files found in the default directory.'));
    return await handleFirstTimeUserExperience();
  }

  const choices = [
    ...files.map(file => ({
      name: file.name,
      value: file.path,
    })),
    { name: BROWSE_OPTION, value: BROWSE_OPTION },
    { name: MANUAL_OPTION, value: MANUAL_OPTION },
    { name: EXIT_OPTION, value: EXIT_OPTION },
  ];

  const selectedFile = await select({
    message: 'Select an input file:',
    choices,
  });

  switch (selectedFile) {
    case BROWSE_OPTION:
      return await handleBrowseFolder();
    case MANUAL_OPTION:
      return await handleManualInput();
    case EXIT_OPTION:
      console.log(chalk.yellow('👋 Goodbye!'));
      process.exit(0);
      break;
    default:
      return selectedFile;
  }
}
