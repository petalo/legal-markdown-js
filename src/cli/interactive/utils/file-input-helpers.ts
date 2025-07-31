/**
 * File input helper functions for Interactive CLI
 *
 * Shared utilities for file selection and browsing across different
 * interactive CLI components.
 *
 * @module
 */

import { select, input } from '@inquirer/prompts';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { scanDirectory, isValidFile } from './file-scanner';
import { formatWarningMessage } from './format-helpers';

/** Option for manual path entry */
const MANUAL_OPTION = '📝 Enter path manually...';
/** Option for exiting the application */
const EXIT_OPTION = '❌ Exit';

/**
 * Handle browsing to a different folder
 */
export async function handleBrowseFolder(): Promise<string> {
  const folderPath = await input({
    message: 'Enter folder path to browse:',
    // Use cwd as default to allow full filesystem navigation flexibility
    // (differs from RESOLVED_PATHS.DEFAULT_INPUT_DIR to provide broader access)
    default: process.cwd(),
    validate: value => {
      const resolvedPath = path.resolve(value);
      try {
        if (!fs.existsSync(resolvedPath)) {
          return 'Folder does not exist';
        }
        if (!fs.statSync(resolvedPath).isDirectory()) {
          return 'Path is not a directory';
        }
        return true;
      } catch {
        return 'Invalid folder path';
      }
    },
  });

  const resolvedPath = path.resolve(folderPath);
  console.log(chalk.cyan(`🔍 Searching for files in: ${resolvedPath}\\n`));

  const files = scanDirectory(resolvedPath);

  if (files.length === 0) {
    console.log(formatWarningMessage('No supported files found in this directory.'));
    return await handleManualInput();
  }

  const choices = [
    ...files.map(file => ({
      name: file.name,
      value: file.path,
    })),
    { name: MANUAL_OPTION, value: MANUAL_OPTION },
    { name: EXIT_OPTION, value: EXIT_OPTION },
  ];

  const selectedFile = await select({
    message: 'Select an input file:',
    choices,
  });

  if (selectedFile === MANUAL_OPTION) {
    return await handleManualInput();
  }

  if (selectedFile === EXIT_OPTION) {
    console.log(chalk.yellow('👋 Goodbye!'));
    process.exit(0);
  }

  return selectedFile;
}

/**
 * Handle manual file path input
 */
export async function handleManualInput(): Promise<string> {
  const filePath = await input({
    message: 'Enter file path:',
    validate: value => {
      if (!value.trim()) {
        return 'File path is required';
      }

      const resolvedPath = path.resolve(value.trim());

      if (!isValidFile(resolvedPath)) {
        return 'File does not exist or is not readable';
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      const supportedExts = ['.md', '.markdown', '.rst', '.tex', '.latex', '.txt'];

      if (!supportedExts.includes(ext)) {
        return `Unsupported file type. Supported: ${supportedExts.join(', ')}`;
      }

      return true;
    },
  });

  return path.resolve(filePath.trim());
}
