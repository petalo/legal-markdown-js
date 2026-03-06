import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const ROOT = path.resolve(process.cwd());
export const NODE_CLI = path.join(ROOT, 'dist', 'cli', 'index.js');

const COMPILED_BINARY = path.join(ROOT, 'dist', 'bin', 'legal-md');

function hasBun(): boolean {
  try {
    execSync('bun --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function tryBuildCompiledBinary(): void {
  if (!hasBun()) {
    return;
  }

  try {
    execSync('npm run -s build:binary', {
      cwd: ROOT,
      stdio: 'pipe',
    });
  } catch {
    // Fall back to node CLI when binary compilation is not available.
  }
}

function isBinaryStale(): boolean {
  if (!fs.existsSync(COMPILED_BINARY) || !fs.existsSync(NODE_CLI)) {
    return false;
  }

  return fs.statSync(COMPILED_BINARY).mtimeMs < fs.statSync(NODE_CLI).mtimeMs;
}

export function resolveBinaryCommand(): string {
  if (!fs.existsSync(COMPILED_BINARY) || isBinaryStale()) {
    tryBuildCompiledBinary();
  }

  if (fs.existsSync(COMPILED_BINARY)) {
    return `"${COMPILED_BINARY}"`;
  }

  return `node "${NODE_CLI}"`;
}
