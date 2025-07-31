/**
 * @fileoverview Centralized CLI path configuration for tests
 * 
 * This module provides consistent CLI path resolution across all test files,
 * eliminating fragile hardcoded paths and providing a single source of truth.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the current directory for ESM modules
 */
function getCurrentDir(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}

/**
 * CLI path configuration
 */
export const CLI_PATHS = {
  /**
   * Main CLI executable path
   */
  main: path.resolve(process.cwd(), 'dist', 'cli', 'index.js'),
  
  /**
   * Interactive CLI path
   */
  interactive: path.resolve(process.cwd(), 'dist', 'cli', 'interactive', 'index.js'),
  
  /**
   * Get CLI path relative to a test file
   * @param testFileUrl - import.meta.url from the test file
   * @returns Resolved CLI path
   */
  fromTestFile: (testFileUrl: string): string => {
    const testDir = getCurrentDir(testFileUrl);
    return path.resolve(testDir, '..', '..', 'dist', 'cli', 'index.js');
  },
  
  /**
   * Get interactive CLI path relative to a test file
   * @param testFileUrl - import.meta.url from the test file
   * @returns Resolved interactive CLI path
   */
  interactiveFromTestFile: (testFileUrl: string): string => {
    const testDir = getCurrentDir(testFileUrl);
    return path.resolve(testDir, '..', '..', 'dist', 'cli', 'interactive', 'index.js');
  }
} as const;

/**
 * Validate that CLI paths exist
 * @returns Object with validation results
 */
export function validateCliPaths(): { main: boolean; interactive: boolean } {
  const fs = require('fs');
  
  return {
    main: fs.existsSync(CLI_PATHS.main),
    interactive: fs.existsSync(CLI_PATHS.interactive)
  };
}

/**
 * Get CLI path from package.json bin configuration (if available)
 * This provides the most stable resolution based on package configuration
 */
export function getCliPathFromPackageJson(): string | null {
  try {
    const packageJson = require('../../package.json');
    const binPath = packageJson.bin?.['legal2md'] || packageJson.bin;
    
    if (binPath) {
      return path.resolve(process.cwd(), binPath);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the best available CLI path, preferring package.json bin over hardcoded paths
 */
export function getBestCliPath(): string {
  const packagePath = getCliPathFromPackageJson();
  return packagePath || CLI_PATHS.main;
}