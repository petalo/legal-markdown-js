/**
 * Path Constants from Environment Variables
 *
 * This module provides centralized access to path constants loaded from
 * environment variables via dotenv. It ensures consistent path usage
 * across the application and provides sensible defaults.
 *
 * The .env file is discovered from multiple locations in order of precedence:
 * 1. Current working directory
 * 2. User's home directory
 * 3. User's config directory (~/.config/legal-markdown-js/)
 */

import * as path from 'path';
import { discoverAndLoadEnv } from '../utils/env-discovery';

// Discover and load environment variables from .env file
const loadedEnvPath = discoverAndLoadEnv();

// Optional: Log which .env file was loaded for debugging
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'ci' && loadedEnvPath) {
  console.log(`Loaded environment configuration from: ${loadedEnvPath}`);
}

/**
 * Path constants loaded from environment variables
 */
export const PATHS = {
  /**
   * Directory containing images assets
   * @default "src/assets/images"
   */
  IMAGES_DIR: (process.env.IMAGES_DIR || '').trim() || 'src/assets/images',

  /**
   * Directory containing CSS styles
   * @default "src/styles"
   */
  STYLES_DIR: (process.env.STYLES_DIR || '').trim() || 'src/styles',

  /**
   * Default directory for input files
   * @default "input"
   */
  DEFAULT_INPUT_DIR: (process.env.DEFAULT_INPUT_DIR || '').trim() || 'input',

  /**
   * Default directory for output files
   * @default "output"
   */
  DEFAULT_OUTPUT_DIR: (process.env.DEFAULT_OUTPUT_DIR || '').trim() || 'output',

  /**
   * Directory for archiving processed input files
   * @default "processed"
   */
  ARCHIVE_DIR: (process.env.ARCHIVE_DIR || '').trim() || 'processed',
} as const;

/**
 * Resolved absolute paths based on current working directory
 */
export const RESOLVED_PATHS = {
  IMAGES_DIR: path.resolve(process.cwd(), PATHS.IMAGES_DIR),
  STYLES_DIR: path.resolve(process.cwd(), PATHS.STYLES_DIR),
  DEFAULT_INPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_INPUT_DIR),
  DEFAULT_OUTPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_OUTPUT_DIR),
  ARCHIVE_DIR: path.resolve(process.cwd(), PATHS.ARCHIVE_DIR),
} as const;
