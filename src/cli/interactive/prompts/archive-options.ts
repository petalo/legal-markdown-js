/**
 * Archive Options Prompt
 *
 * This module handles user interaction for configuring source file archiving
 * in the interactive CLI. It provides prompts for enabling archiving and
 * customizing the archive directory.
 */

import { confirm, input } from '@inquirer/prompts';
import { RESOLVED_PATHS } from '../../../constants/paths';
import { ArchiveManager } from '../../../utils/archive-manager';
import chalk from 'chalk';

/**
 * Result of the archive options prompt
 */
export interface ArchivePromptResult {
  /** Whether archiving is enabled */
  enableArchiving: boolean;
  /** Custom archive directory (if provided) */
  archiveDirectory?: string;
}

/**
 * Prompt user for archive configuration options
 *
 * @returns Promise resolving to the archive configuration
 */
export async function promptArchiveOptions(): Promise<ArchivePromptResult> {
  console.log(chalk.bold.cyan('\n📁 Source File Management'));
  console.log('Configure what happens to your source files after processing.\n');

  // Ask if user wants to enable archiving
  const enableArchiving = await confirm({
    message: 'Archive source file after successful processing?',
    default: false,
  });

  if (!enableArchiving) {
    return { enableArchiving: false };
  }

  // Show default directory
  console.log(chalk.gray(`Default archive directory: ${RESOLVED_PATHS.ARCHIVE_DIR}`));

  // Ask if user wants to customize the directory
  const useCustomDirectory = await confirm({
    message: 'Use a custom archive directory?',
    default: false,
  });

  let archiveDirectory: string | undefined;

  if (useCustomDirectory) {
    let validDirectory = false;

    while (!validDirectory) {
      const customDir = await input({
        message: 'Enter custom archive directory:',
        default: 'processed',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Archive directory cannot be empty';
          }

          if (!ArchiveManager.isValidArchiveDirectory(input.trim())) {
            return 'Invalid directory path or cannot create directory';
          }

          return true;
        },
      });

      archiveDirectory = customDir.trim();
      validDirectory = true;
    }
  }

  return {
    enableArchiving,
    archiveDirectory,
  };
}
