import * as path from 'path';
import { getRuntimeConfig } from '../config/runtime';

/**
 * Path constants loaded from environment variables
 */
export const PATHS = {
  get IMAGES_DIR() {
    return getConfig().paths.images;
  },
  get STYLES_DIR() {
    return getConfig().paths.styles;
  },
  get DEFAULT_INPUT_DIR() {
    return getConfig().paths.input;
  },
  get DEFAULT_OUTPUT_DIR() {
    return getConfig().paths.output;
  },
  get ARCHIVE_DIR() {
    return getConfig().paths.archive;
  },
};

function getConfig() {
  return getRuntimeConfig();
}

/**
 * Resolved absolute paths based on current working directory
 */
export const RESOLVED_PATHS = {
  get IMAGES_DIR() {
    return path.resolve(process.cwd(), PATHS.IMAGES_DIR);
  },
  get STYLES_DIR() {
    return path.resolve(process.cwd(), PATHS.STYLES_DIR);
  },
  get DEFAULT_INPUT_DIR() {
    return path.resolve(process.cwd(), PATHS.DEFAULT_INPUT_DIR);
  },
  get DEFAULT_OUTPUT_DIR() {
    return path.resolve(process.cwd(), PATHS.DEFAULT_OUTPUT_DIR);
  },
  get ARCHIVE_DIR() {
    return path.resolve(process.cwd(), PATHS.ARCHIVE_DIR);
  },
};
