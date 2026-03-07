#!/usr/bin/env node

/**
 * Unified entry point for legal-md distribution binary.
 *
 * Routes to subcommands when called with a known first argument,
 * otherwise delegates to the standard CLI.
 *
 * Usage:
 *   legal-md [options] [input] [output]  - standard processing CLI
 *   legal-md ui                          - interactive UI mode
 *   legal-md playground                  - local web playground
 */

const [, , rawFirstArg] = process.argv;
const firstArg = rawFirstArg?.startsWith('--') ? rawFirstArg.slice(2) : rawFirstArg;

export {};

if (firstArg === 'ui') {
  process.argv.splice(2, 1);
  await import('./interactive/index.js');
} else if (firstArg === 'playground') {
  process.argv.splice(2, 1);
  await import('./playground/index.js');
} else {
  await import('./index.js');
}
