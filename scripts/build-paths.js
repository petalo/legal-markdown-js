#!/usr/bin/env node

/**
 * Build script helper for handling environment-based paths
 * This script loads path constants and provides them for build operations
 */

// Load .env file silently without dotenv messages
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse .env manually to avoid dotenv messages
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (error) {
  // Ignore errors, use defaults
}

// Get paths from environment with defaults
const PATHS = {
  IMAGES_DIR: process.env.IMAGES_DIR?.trim() || 'src/assets/images',
  STYLES_DIR: process.env.STYLES_DIR?.trim() || 'src/styles',
  DEFAULT_INPUT_DIR: process.env.DEFAULT_INPUT_DIR?.trim() || 'input',
  DEFAULT_OUTPUT_DIR: process.env.DEFAULT_OUTPUT_DIR?.trim() || 'output',
};

// Resolve absolute paths
const RESOLVED_PATHS = {
  IMAGES_DIR: path.resolve(process.cwd(), PATHS.IMAGES_DIR),
  STYLES_DIR: path.resolve(process.cwd(), PATHS.STYLES_DIR),
  DEFAULT_INPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_INPUT_DIR),
  DEFAULT_OUTPUT_DIR: path.resolve(process.cwd(), PATHS.DEFAULT_OUTPUT_DIR),
};

// Export for use in other scripts
export { PATHS, RESOLVED_PATHS };

// If called directly, print paths for shell scripts
if (import.meta.url === `file://${process.argv[1]}`) {
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