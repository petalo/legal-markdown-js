#!/usr/bin/env node

/**
 * Build script helper for handling environment-based paths
 * This script loads path constants and provides them for build operations
 */

require('dotenv').config();
const path = require('path');

// Get paths from environment with defaults
const PATHS = {
  IMAGES_DIR: process.env.IMAGES_DIR || 'src/assets/images',
  STYLES_DIR: process.env.STYLES_DIR || 'src/styles',
  DEFAULT_INPUT_DIR: process.env.DEFAULT_INPUT_DIR || 'input',
  DEFAULT_OUTPUT_DIR: process.env.DEFAULT_OUTPUT_DIR || 'output',
};

// Resolve absolute paths
const RESOLVED_PATHS = {
  IMAGES_DIR: path.resolve(process.cwd(), PATHS.IMAGES_DIR),
  STYLES_DIR: path.resolve(process.cwd(), PATHS.STYLES_DIR),
  DEFAULT_INPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_INPUT_DIR),
  DEFAULT_OUTPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_OUTPUT_DIR),
};

// Export for use in other scripts
module.exports = { PATHS, RESOLVED_PATHS };

// If called directly, print paths for shell scripts
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'images':
      console.log(PATHS.IMAGES_DIR);
      break;
    case 'styles':
      console.log(PATHS.STYLES_DIR);
      break;
    case 'input':
      console.log(PATHS.DEFAULT_INPUT_DIR);
      break;
    case 'output':
      console.log(PATHS.DEFAULT_OUTPUT_DIR);
      break;
    default:
      console.log(JSON.stringify(PATHS, null, 2));
  }
}