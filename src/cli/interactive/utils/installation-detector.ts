/**
 * Installation Detection Utilities
 *
 * Utilities to detect whether legal-markdown-js is installed globally
 * or locally, and determine the appropriate configuration file location.
 *
 * @module
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Check if the current execution is from a global installation
 *
 * @returns True if running from global installation
 */
export function isGlobalInstallation(): boolean {
  try {
    // Method 1: Check if the current script path includes global node_modules
    const scriptPath = process.argv[1] || '';

    // Common global installation paths
    const globalPaths = [
      '/usr/local/lib/node_modules',
      '/usr/lib/node_modules',
      path.join(os.homedir(), '.npm-global'),
      path.join(os.homedir(), '.nvm'),
      // Windows paths
      path.join(process.env.APPDATA || '', 'npm'),
      path.join(process.env.ProgramFiles || '', 'nodejs'),
    ];

    // Check if script path contains global installation indicators
    if (globalPaths.some(globalPath => scriptPath.includes(globalPath))) {
      return true;
    }

    // Method 2: Check if there's a local package.json with legal-markdown-js
    const localPackageJson = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(localPackageJson)) {
      try {
        const packageContent = JSON.parse(fs.readFileSync(localPackageJson, 'utf8'));
        const hasLocalDep =
          packageContent.dependencies?.['legal-markdown-js'] ||
          packageContent.devDependencies?.['legal-markdown-js'];

        // If found in local package.json, it's likely a local installation
        if (hasLocalDep) {
          return false;
        }
      } catch {
        // If can't parse package.json, continue with other methods
      }
    }

    // Method 3: Check if local node_modules exists
    const localNodeModules = path.join(process.cwd(), 'node_modules', 'legal-markdown-js');
    if (fs.existsSync(localNodeModules)) {
      return false;
    }

    // Default to global if we can't determine
    return true;
  } catch {
    // If any method fails, default to global installation
    return true;
  }
}

/**
 * Get the appropriate configuration directory path
 *
 * @returns Path where configuration files should be stored
 */
export function getConfigDirectory(): string {
  if (isGlobalInstallation()) {
    // Global installation: use user config directory
    const configDir = path.join(os.homedir(), '.config', 'legal-markdown-js');

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    return configDir;
  } else {
    // Local installation: use current working directory
    return process.cwd();
  }
}

/**
 * Get the full path for .env configuration file
 *
 * @returns Full path to .env file
 */
export function getEnvFilePath(): string {
  return path.join(getConfigDirectory(), '.env');
}

/**
 * Get installation type description for user messages
 *
 * @returns Human-readable description of installation type
 */
export function getInstallationDescription(): string {
  const isGlobal = isGlobalInstallation();
  const configPath = getConfigDirectory();

  if (isGlobal) {
    return `Global installation - Configuration will be saved to:\n${configPath}/.env`;
  } else {
    return `Local installation - Configuration will be saved to:\n${configPath}/.env`;
  }
}
