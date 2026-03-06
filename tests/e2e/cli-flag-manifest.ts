/**
 * Canonical list of all CLI flags and subcommands that have e2e tests.
 *
 * IMPORTANT: When you add a new flag to src/cli/index.ts, you MUST:
 *   1. Add the flag string to TESTED_FLAGS below
 *   2. Write a test for it in tests/e2e/cli-params.e2e.test.ts
 *
 * The cli-flag-coverage.e2e.test.ts test will fail in CI if any flag
 * appears in --help output but is missing from this set.
 */
export const TESTED_FLAGS = new Set([
  // short aliases
  '-V',
  '-d',
  '-y',
  '-o',
  // processing control
  '--debug',
  '--yaml',
  '--headers',
  '--no-headers',
  '--no-clauses',
  '--no-references',
  '--no-imports',
  '--no-mixins',
  '--no-reset',
  '--no-indent',
  '--throwOnYamlError',
  '--to-markdown',
  // i/o
  '--stdin',
  '--stdout',
  // metadata export
  '--export-yaml',
  '--export-json',
  '--output-path',
  // html/pdf
  '--pdf',
  '--pdf-connector',
  '--html',
  '--docx',
  '--highlight',
  '--title',
  '--css',
  // advanced
  '--enable-field-tracking',
  '--ast-field-tracking',
  '--logic-branch-highlighting',
  '--disable-frontmatter-merge',
  '--import-tracing',
  '--validate-import-types',
  '--log-import-operations',
  '--archive-source',
  // meta
  '--version',
  '--help',
  '-h',
]);

export const TESTED_SUBCOMMAND_FLAGS = new Set([
  'init',
  'config',
  '-g',
  '--global',
]);
