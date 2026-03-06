#!/usr/bin/env node

/**
 * Guardrails for test runner configuration.
 *
 * This catches migration regressions early (for example, Vitest 4 removed
 * `test.poolOptions`), before they show up as runtime warnings in CI output.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const CONFIG_FILES = ['vitest.config.ts'];

const FORBIDDEN_PATTERNS = [
  {
    id: 'poolOptions',
    pattern: /\bpoolOptions\s*:/g,
    reason:
      'Vitest 4 removed `test.poolOptions`. Move those settings to top-level test options.',
    docs: 'https://vitest.dev/guide/migration#pool-rework',
  },
];

function getLineNumber(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

let hasErrors = false;

for (const relativePath of CONFIG_FILES) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  for (const rule of FORBIDDEN_PATTERNS) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      const line = getLineNumber(content, match.index);
      hasErrors = true;
      console.error(
        `[test-settings] ${relativePath}:${line} uses forbidden "${rule.id}".\n` +
          `  ${rule.reason}\n` +
          `  ${rule.docs}`
      );
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('[test-settings] OK');
