/**
 * @fileoverview Path Constants from Environment Variables
 *
 * This module provides centralized access to path constants loaded from
 * environment variables via dotenv. It ensures consistent path usage
 * across the application and provides sensible defaults.
 */

import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config();

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
} as const;

/**
 * Resolved absolute paths based on current working directory
 */
export const RESOLVED_PATHS = {
  IMAGES_DIR: path.resolve(process.cwd(), PATHS.IMAGES_DIR),
  STYLES_DIR: path.resolve(process.cwd(), PATHS.STYLES_DIR),
  DEFAULT_INPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_INPUT_DIR),
  DEFAULT_OUTPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_OUTPUT_DIR),
} as const;
