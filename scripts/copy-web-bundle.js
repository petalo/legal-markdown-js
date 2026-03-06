#!/usr/bin/env node
/**
 * Copies the browser bundle and ALL its chunks to the web playground's
 * public directory so they can be served as static assets during dev and
 * production builds.
 *
 * The Vite library build produces a DAG of chunks connected by both static
 * re-exports and dynamic imports. This script BFS-traverses the full import
 * graph starting from legal-markdown-browser.js so every file the browser
 * will request at runtime is present in public/.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '../dist');
const dstDir = resolve(__dirname, '../src/web/public');

const entryFile = 'legal-markdown-browser.js';
const entrySrc = resolve(distDir, entryFile);

if (!existsSync(entrySrc)) {
  console.error('ERROR: dist/legal-markdown-browser.js not found.');
  console.error('Run "npm run build:vite" first.');
  process.exit(1);
}

mkdirSync(dstDir, { recursive: true });

// Remove stale hashed chunk files left by previous builds so they don't
// accumulate in public/ and get deployed unnecessarily.
// Each pattern matches a chunk filename prefix emitted by Vite's hash-based
// code-splitting - add a new pattern here whenever a new entry chunk appears
// in the browser bundle that might leave orphaned hashed copies.
const STALE_PATTERNS = [/^browser-modern-/, /^force-commands-parser-/];
if (existsSync(dstDir)) {
  for (const file of readdirSync(dstDir)) {
    if (STALE_PATTERNS.some(p => p.test(file))) {
      rmSync(resolve(dstDir, file));
    }
  }
}

const { version } = require('../package.json');

// BFS over the chunk import graph.
// Matches both:
//   static re-exports: from './foo-hash.js'
//   dynamic imports:   import('./foo-hash.js')
const CHUNK_REF_RE = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+\.js)['"]/g;

const queue = [entryFile];
const visited = new Set();

while (queue.length > 0) {
  const filename = queue.shift();
  if (visited.has(filename)) continue;
  visited.add(filename);

  const src = resolve(distDir, filename);
  const dst = resolve(dstDir, filename);

  if (!existsSync(src)) {
    console.warn(`WARNING: referenced chunk not found in dist/: ${filename}`);
    continue;
  }

  copyFileSync(src, dst);

  // Patch __LEGAL_MARKDOWN_VERSION__ (webpack build artefact not substituted)
  let content = readFileSync(dst, 'utf8');
  const patched = content.replace(/__LEGAL_MARKDOWN_VERSION__/g, JSON.stringify(version));
  if (patched !== content) {
    writeFileSync(dst, patched);
    console.log(`  Patched __LEGAL_MARKDOWN_VERSION__ -> "${version}" in ${filename}`);
  }

  console.log(`Copied ${filename} -> src/web/public/`);

  // Enqueue all chunk references found in this file.
  // Only follow flat same-directory refs (./chunk.js), not parent (../x.js)
  // or subdirectory (./types/index.js) refs - those are TypeScript type helpers,
  // not runtime chunks.
  let match;
  CHUNK_REF_RE.lastIndex = 0;
  while ((match = CHUNK_REF_RE.exec(content)) !== null) {
    const raw = match[1]; // e.g. './browser-modern-TbqfnqIW.js'
    if (!raw.startsWith('./')) continue; // skip ../ and subdir paths
    const ref = raw.slice(2); // strip './'
    if (ref.includes('/')) continue; // skip subdirectory refs
    if (!visited.has(ref) && existsSync(resolve(distDir, ref))) {
      queue.push(ref);
    }
  }
}
