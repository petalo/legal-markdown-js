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
import * as fs from 'fs';
import * as path from 'path';
import { RESOLVED_PATHS } from '../../../constants/index';
import { scanDirectory } from '../utils/file-scanner';
import { formatWarningMessage } from '../utils/format-helpers';
import { handleBrowseFolder, handleManualInput } from '../utils/file-input-helpers';
import { getEnvSearchPaths } from '../../../utils/env-discovery';
import { getEnvFilePath } from '../utils/installation-detector';

/** Option for browsing alternative directories */
const BROWSE_OPTION = '📁 Browse other folder...';
/** Option for manual path entry */
const MANUAL_OPTION = '📝 Enter path manually...';
/** Option for exiting the application */
const EXIT_OPTION = '❌ Exit';

/**
 * Check if a directory exists and is accessible
 *
 * @param dirPath - Path to check
 * @returns True if directory exists and is accessible
 */
function isDirectoryAccessible(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if configuration is properly set up
 *
 * @returns True if .env exists in the correct location and input directory is configured and accessible
 */
function isConfigurationValid(): boolean {
  // Check if .env exists in the expected installation-specific location
  const expectedEnvPath = getEnvFilePath();
  const hasCorrectEnvFile = fs.existsSync(expectedEnvPath);

  if (!hasCorrectEnvFile) {
    // Fallback: check if there's a .env in the current working directory
    const localEnvPath = path.join(process.cwd(), '.env');
    const hasLocalEnvFile = fs.existsSync(localEnvPath);

    if (!hasLocalEnvFile) {
      return false;
    }

    // If local .env exists, reload environment variables from it
    try {
      const envContent = fs.readFileSync(localEnvPath, 'utf8');
      const envVars = envContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .reduce(
          (vars, line) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              // Remove quotes if present
              let value = valueParts.join('=').trim();
              if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
              ) {
                value = value.slice(1, -1);
              }
              vars[key.trim()] = value;
            }
            return vars;
          },
          {} as Record<string, string>
        );

      // Check if DEFAULT_INPUT_DIR is configured and accessible in local .env
      const localInputDir = envVars.DEFAULT_INPUT_DIR;
      if (!localInputDir) {
        return false;
      }

      return isDirectoryAccessible(path.resolve(localInputDir));
    } catch {
      return false;
    }
  }

  // Check if the configured input directory is accessible
  return isDirectoryAccessible(RESOLVED_PATHS.DEFAULT_INPUT_DIR);
}

/**
 * Show warning when configuration is missing/invalid
 */
async function showConfigurationWarning(): Promise<void> {
  console.log(chalk.yellow('\n⚠️  Configuration Setup Needed'));
  console.log(chalk.gray('No valid configuration detected or input directory is not accessible.'));
  console.log(chalk.cyan('Using current directory as input...\n'));
}

/**
 * Handle file selection logic
 */
async function handleFileSelection(selectedFile: string): Promise<string> {
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

/**
 * Prompt user to select an input file
 *
 * Initiates the file selection process by first checking if configuration is valid.
 * If not, uses current directory. Then scans the input directory and presents
 * available files to the user, with fallback options for manual input.
 *
 * @returns Promise resolving to the absolute path of the selected input file
 * @throws Error when user cancels or no valid file is selected
 */
export async function selectInputFile(): Promise<string> {
  let searchDirectory: string;
  let searchMessage: string;

  // Check if configuration is valid first
  if (!isConfigurationValid()) {
    await showConfigurationWarning();
    searchDirectory = process.cwd();
    searchMessage = 'Select a file from current directory:';
  } else {
    // Configuration is valid - use configured directory
    console.log(chalk.cyan(`🔍 Searching for files in: ${RESOLVED_PATHS.DEFAULT_INPUT_DIR}\n`));
    searchDirectory = RESOLVED_PATHS.DEFAULT_INPUT_DIR;
    searchMessage = 'Select an input file:';
  }

  const files = scanDirectory(searchDirectory, searchDirectory);

  if (files.length === 0) {
    console.log(formatWarningMessage('No supported files found in the directory.'));
    console.log(chalk.gray('You can browse a different folder or enter a path manually.\n'));

    const fallbackChoice = await select({
      message: 'How would you like to proceed?',
      choices: [
        { name: BROWSE_OPTION, value: BROWSE_OPTION },
        { name: MANUAL_OPTION, value: MANUAL_OPTION },
        { name: EXIT_OPTION, value: EXIT_OPTION },
      ],
    });

    return await handleFileSelection(fallbackChoice);
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
    message: searchMessage,
    choices,
  });

  return await handleFileSelection(selectedFile);
}
