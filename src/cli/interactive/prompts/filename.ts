/**
 * @fileoverview Output filename input prompt for Interactive CLI
 */

import { input } from '@inquirer/prompts';
import * as path from 'path';

/**
 * Prompt user for output filename (without extension)
 */
export async function promptOutputFilename(inputFile: string): Promise<string> {
  const inputBasename = path.basename(inputFile, path.extname(inputFile));

  const filename = await input({
    message: 'Enter output filename (without extension):',
    default: inputBasename,
    validate: (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        return 'Filename is required';
      }

      // Check for invalid characters (basic validation)
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(trimmed)) {
        return 'Filename contains invalid characters';
      }

      // Check if it starts/ends with spaces or dots
      if (trimmed !== value) {
        return 'Filename cannot start or end with spaces';
      }

      if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
        return 'Filename cannot start or end with dots';
      }

      return true;
    },
  });

  return filename.trim();
}
