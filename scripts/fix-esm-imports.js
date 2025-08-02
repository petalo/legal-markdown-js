#!/usr/bin/env node

/**
 * Script to fix ESM imports by adding .js extensions
 *
 * This script walks through the built ESM files and adds .js extensions
 * to relative imports that don't already have them, which is required
 * for proper ESM compliance in Node.js.
 */

import { readdir, readFile, writeFile, existsSync, statSync } from 'fs';
import {
  readdir as readdirAsync,
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from 'fs/promises';
import { join, extname, dirname } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');

async function fixImportsInFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');

    // Fix relative imports without extensions
    // Matches: import ... from './path' or import ... from '../path'
    const fixedContent = content.replace(
      /import\s+([^'"]*)\s+from\s+['"](\.[^'"]*?)(['"])/g,
      (match, importSpec, importPath, quote) => {
        // Skip if already has extension
        if (extname(importPath)) {
          return match;
        }

        // For directory imports, try adding /index.js first
        const currentDir = dirname(filePath);
        const resolvedPath = join(currentDir, importPath);

        // Check if this is a directory import by looking for index.js
        try {
          if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
            if (existsSync(join(resolvedPath, 'index.js'))) {
              return `import ${importSpec} from ${quote}${importPath}/index.js${quote}`;
            }
          }
        } catch (e) {
          // If file system check fails, fall back to regular .js extension
        }

        // Add .js extension to relative imports
        return `import ${importSpec} from ${quote}${importPath}.js${quote}`;
      }
    );

    // Also fix export statements with relative imports
    const fixedExports = fixedContent.replace(
      /export\s+([^'"]*)\s+from\s+['"](\.[^'"]*?)(['"])/g,
      (match, exportSpec, importPath, quote) => {
        // Skip if already has extension
        if (extname(importPath)) {
          return match;
        }

        // For directory exports, try adding /index.js first
        const currentDir = dirname(filePath);
        const resolvedPath = join(currentDir, importPath);

        // Check if this is a directory export by looking for index.js
        try {
          if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
            if (existsSync(join(resolvedPath, 'index.js'))) {
              return `export ${exportSpec} from ${quote}${importPath}/index.js${quote}`;
            }
          }
        } catch (e) {
          // If file system check fails, fall back to regular .js extension
        }

        // Add .js extension to relative imports in exports
        return `export ${exportSpec} from ${quote}${importPath}.js${quote}`;
      }
    );

    // Fix dynamic imports too
    const finalContent = fixedExports.replace(
      /import\s*\(\s*['"](\.[^'"]*?)['"](\s*\))/g,
      (match, importPath, closing) => {
        if (extname(importPath)) {
          return match;
        }
        return `import('${importPath}.js'${closing}`;
      }
    );

    if (finalContent !== content) {
      await writeFileAsync(filePath, finalContent);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function walkDirectory(dir) {
  const entries = await readdirAsync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath);
    } else if (entry.name.endsWith('.js')) {
      await fixImportsInFile(fullPath);
    }
  }
}

async function main() {
  console.log('🔧 Fixing ESM imports by adding .js extensions...');

  try {
    await walkDirectory(DIST_DIR);
    console.log('✅ ESM import fixes completed!');
  } catch (error) {
    console.error('❌ Error fixing ESM imports:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
