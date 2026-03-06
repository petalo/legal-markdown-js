/**
 * CLI flag coverage guard.
 *
 * Fails when a new flag appears in --help output that is not listed in
 * cli-flag-manifest.ts. This ensures every new flag ships with a test.
 *
 * Also verifies that both targets (node CLI + compiled binary) expose
 * identical flags, protecting against the binary going stale.
 */
import { execSync } from 'child_process';
import { TESTED_FLAGS, TESTED_SUBCOMMAND_FLAGS } from './cli-flag-manifest.js';
import { NODE_CLI, resolveBinaryCommand } from './cli-target-command.js';

const BINARY_CMD = resolveBinaryCommand();

/** Run --help and return stdout + stderr combined (Commander writes help to stdout) */
function getHelpOutput(cmd: string): string {
  try {
    return execSync(`${cmd} --help`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: any) {
    // ENOENT means the binary/script does not exist - fail loudly instead of
    // returning empty output (which would silently make all flag-coverage tests pass).
    if (err.code === 'ENOENT' || err.status == null) {
      throw new Error(
        `Failed to spawn: ${cmd}\n` +
          `Ensure the project is built before running e2e tests (npm run build).\n` +
          `Original error: ${err.message}`
      );
    }
    // Commander exits 0 for --help; other non-zero exits return combined output
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

/**
 * Extract option flags from option declaration columns only.
 * This avoids matching hyphenated words in descriptions (e.g. AST-first).
 */
function parseFlags(helpText: string): Set<string> {
  const flags = new Set<string>();

  for (const line of helpText.split('\n')) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('-')) {
      continue;
    }

    const declaration = trimmed.split(/\s{2,}/)[0] ?? trimmed;
    const matches = declaration.match(/--?[A-Za-z][A-Za-z0-9-]*/g) ?? [];

    for (const match of matches) {
      flags.add(match);
    }
  }

  return flags;
}

const ALL_KNOWN = new Set([...TESTED_FLAGS, ...TESTED_SUBCOMMAND_FLAGS]);

describe('CLI flag coverage guard', () => {
  it('node --help exposes only known flags', () => {
    const help = getHelpOutput(`node "${NODE_CLI}"`);
    const found = parseFlags(help);
    const unknown = [...found].filter(f => !ALL_KNOWN.has(f));

    if (unknown.length > 0) {
      throw new Error(
        `Untested flags found in node --help output:\n` +
          unknown.map(f => `  ${f}`).join('\n') +
          `\n\nAdd them to tests/e2e/cli-flag-manifest.ts and write tests in tests/e2e/cli-params.e2e.test.ts`
      );
    }
  });

  it('binary --help exposes only known flags', () => {
    const help = getHelpOutput(BINARY_CMD);
    const found = parseFlags(help);
    const unknown = [...found].filter(f => !ALL_KNOWN.has(f));

    if (unknown.length > 0) {
      throw new Error(
        `Untested flags found in binary --help output:\n` +
          unknown.map(f => `  ${f}`).join('\n') +
          `\n\nAdd them to tests/e2e/cli-flag-manifest.ts and write tests in tests/e2e/cli-params.e2e.test.ts`
      );
    }
  });

  it('node and binary --help are flag-identical', () => {
    const nodeFlags = parseFlags(getHelpOutput(`node "${NODE_CLI}"`));
    const binaryFlags = parseFlags(getHelpOutput(BINARY_CMD));

    const onlyInNode = [...nodeFlags].filter(f => !binaryFlags.has(f));
    const onlyInBinary = [...binaryFlags].filter(f => !nodeFlags.has(f));

    const diffs: string[] = [];
    if (onlyInNode.length > 0)
      diffs.push(`Only in node: ${onlyInNode.join(', ')}`);
    if (onlyInBinary.length > 0)
      diffs.push(`Only in binary: ${onlyInBinary.join(', ')}`);

    if (diffs.length > 0) {
      throw new Error(
        `node CLI and binary expose different flags:\n` + diffs.join('\n')
      );
    }
  });
});
