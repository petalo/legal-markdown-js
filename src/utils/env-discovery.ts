/**
 * Environment File Discovery Utility
 *
 * This module provides functionality to discover .env files in multiple
 * locations to improve user experience, especially for non-developer users.
 * It searches for .env files in the following order:
 * 1. Current working directory
 * 2. User's home directory
 * 3. User's config directory (~/.config/legal-markdown-js/)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from 'dotenv';

/**
 * Potential locations for .env files in order of precedence
 */
const ENV_SEARCH_PATHS = [
  // 1. Current working directory (highest precedence)
  () => path.join(process.cwd(), '.env'),

  // 2. User's home directory
  () => path.join(os.homedir(), '.env'),

  // 3. User's config directory
  () => path.join(os.homedir(), '.config', 'legal-markdown-js', '.env'),
];

/**
 * Discovers and loads .env file from multiple possible locations
 *
 * @returns The path of the loaded .env file or null if none found
 */
export function discoverAndLoadEnv(): string | null {
  for (const getPath of ENV_SEARCH_PATHS) {
    const envPath = getPath();

    try {
      if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
        // Load the .env file
        config({ path: envPath, debug: false });
        return envPath;
      }
    } catch (error) {
      // Continue to next location if this one fails
      continue;
    }
  }

  return null;
}

/**
 * Gets all potential .env file locations for informational purposes
 *
 * @returns Array of potential .env file paths
 */
export function getEnvSearchPaths(): string[] {
  return ENV_SEARCH_PATHS.map(getPath => getPath());
}

/**
 * Creates the config directory if it doesn't exist
 *
 * @returns The path to the config directory
 */
export function ensureConfigDirectory(): string {
  const configDir = path.join(os.homedir(), '.config', 'legal-markdown-js');

  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  } catch (error) {
    // If we can't create the directory, that's okay
    // The user can still use other locations
  }

  return configDir;
}

/**
 * Creates a sample .env file in the user's config directory
 *
 * @returns The path where the sample was created or null if failed
 */
export function createSampleEnvFile(): string | null {
  try {
    const configDir = ensureConfigDirectory();
    const samplePath = path.join(configDir, '.env');

    // Don't overwrite existing file
    if (fs.existsSync(samplePath)) {
      return samplePath;
    }

    const sampleContent = `# Legal Markdown - User Configuration
# This file was automatically created in your config directory
# Customize these paths according to your needs

# Directory containing image assets (logos, diagrams, etc.)
IMAGES_DIR=src/assets/images

# Directory containing CSS stylesheets  
STYLES_DIR=src/styles

# Default directory for input documents
DEFAULT_INPUT_DIR=input

# Default directory for output documents
DEFAULT_OUTPUT_DIR=output
`;

    fs.writeFileSync(samplePath, sampleContent, 'utf8');
    return samplePath;
  } catch (error) {
    return null;
  }
}
