#!/usr/bin/env node

/**
 * Post-processing script for dual ESM/CJS build
 *
 * 1. Renames CJS files from .js to .cjs
 * 2. Copies main entry points to expected locations
 * 3. Updates package.json references in CJS files
 */

import { readdir, rename, readFile, writeFile, access } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

const ROOT_DIR = process.cwd();
const DIST_DIR = join(ROOT_DIR, 'dist');
const DIST_CJS_DIR = join(ROOT_DIR, 'dist-cjs');

async function renameFiles(dir, fromExt, toExt) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await renameFiles(fullPath, fromExt, toExt);
      } else if (entry.name.endsWith(fromExt)) {
        const newName = entry.name.replace(fromExt, toExt);
        const newPath = join(dir, newName);
        await rename(fullPath, newPath);
        console.log(`Renamed: ${entry.name} → ${newName}`);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
}

async function copyFile(src, dest) {
  try {
    const content = await readFile(src, 'utf8');
    await writeFile(dest, content);
    console.log(`Copied: ${basename(src)} → ${basename(dest)}`);
    return true;
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error.message);
    return false;
  }
}

async function findFirstExistingPath(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to next candidate.
    }
  }

  return null;
}

async function main() {
  console.log('🔧 Post-processing dual build...');

  // Step 1: Rename CJS files from .js to .cjs
  console.log('\n📝 Renaming CJS files...');
  await renameFiles(DIST_CJS_DIR, '.js', '.cjs');
  await renameFiles(DIST_CJS_DIR, '.js.map', '.cjs.map');

  // Step 2: Copy main entry points
  console.log('\n📋 Copying entry points...');

  // CJS outputs may live at dist-cjs/index.cjs (current) or dist-cjs/src/index.cjs (legacy)
  const cjsEntryPath = await findFirstExistingPath([
    join(DIST_CJS_DIR, 'index.cjs'),
    join(DIST_CJS_DIR, 'src', 'index.cjs'),
  ]);

  const cjsCopySuccess = cjsEntryPath
    ? await copyFile(cjsEntryPath, join(DIST_DIR, 'index.cjs'))
    : false;

  // Copy CJS types from the same directory as the resolved CJS entry
  if (cjsCopySuccess && cjsEntryPath) {
    await copyFile(join(dirname(cjsEntryPath), 'index.d.ts'), join(DIST_DIR, 'index.d.ts'));
  } else {
    // If CJS entry doesn't exist, skip silently (handled by new dual build)
    console.log('CJS entry point copy skipped - using ESM-generated types');
  }

  // Step 3: Clean up temporary CJS directory
  console.log('\n🧹 Cleaning up temporary directories...');
  const { rm } = await import('fs/promises');
  try {
    await rm(DIST_CJS_DIR, { recursive: true, force: true });
    console.log(`Removed: ${DIST_CJS_DIR}`);
  } catch (error) {
    console.warn(`Warning: Could not remove ${DIST_CJS_DIR}:`, error.message);
  }

  console.log('\n✅ Build post-processing completed!');
  console.log(`📦 ESM files: ./dist/`);
  console.log(`📦 CJS files: ./dist/index.cjs`);
}

main().catch(console.error);
