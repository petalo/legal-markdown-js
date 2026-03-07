# Interactive CLI UX Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Remove emoji from the interactive CLI, introduce a clean symbol system
(check/cross/arrow/!), simplify the output list to a flat format, and apply a
columnar config summary - making the CLI parseable by LLM agents.

**Architecture:** Pure string/label changes across 8 source files and 2 test
files. No logic changes except in `formatSuccessMessage` (remove grouping logic)
and `archive-options.ts` (fix default value). TDD: update failing tests first,
then fix source.

**Tech Stack:** TypeScript, chalk, @inquirer/prompts, vitest

**Design doc:** `docs/plans/2026-03-07-interactive-cli-ux-redesign.md`

---

## Task 1: format-helpers - update failing tests

**Files:**

- Modify: `tests/unit/cli/interactive/utils/format-helpers.test.ts`

These tests currently assert the old emoji strings. Update them to the new
strings first so they fail before we touch the source.

**Step 1: Update test assertions for `formatConfigSummary`**

In `format-helpers.test.ts`, find the `formatConfigSummary` describe block and
update every `toContain` call:

```ts
// Line 69 - was: 'Configuration Summary:'
expect(result).toContain('Configuration summary:');

// Line 70 - was: 'Input file: /path/to/contract.md'
expect(result).toContain('Input:');
expect(result).toContain('/path/to/contract.md');

// Line 71 - was: 'Output filename: processed-contract'
expect(result).toContain('Output:');
expect(result).toContain('processed-contract');

// Line 72 - was: 'Output formats: PDF, HTML, Metadata'
expect(result).toContain('Formats:');

// Line 73 - was: 'CSS file: contract.petalo.css'
expect(result).toContain('CSS:');

// Line 74 - was: 'Processing options: Debug, Highlight'
expect(result).toContain('Options:');

// Line 75 - was: 'Source archiving: Disabled'
expect(result).toContain('Archiving:');
expect(result).toContain('disabled');
```

Apply the same pattern to the remaining `formatConfigSummary` test cases:

- `'CSS file: None'` -> `'CSS:'` and `'none'`
- `'Processing options: Field tracking'` -> `'Options:'` and `'field tracking'`
- `'Source archiving: Disabled'` -> `'Archiving:'` and `'disabled'`
- `'Source archiving: Enabled -> default archive directory'` -> `'Archiving:'`
  and `'enabled'` and `'default archive directory'`
- `'Source archiving: Enabled -> ./custom-archive'` -> `'Archiving:'` and
  `'enabled'` and `'./custom-archive'`

**Step 2: Update test assertions for `formatSuccessMessage`**

```ts
// All 'Files generated successfully!' -> 'Processing complete'
expect(result).toContain('Processing complete');

// All 'Generated files:' -> 'Generated:'
expect(result).toContain('Generated:');

// 'Source file archiving:' -> 'Archiving:'
expect(result).toContain('Archiving:'); // only in failure test
```

**Step 3: Update test assertions for `formatErrorMessage`**

```ts
// was: '❌ Error: File not found: input.md'
expect(result).toContain('Error: File not found: input.md');
// also assert the cross symbol:
expect(result).toContain('x Error:');
// Note: actual symbol is ✗ but chalk is mocked as passthrough
```

Wait - chalk is mocked as passthrough (returns string as-is), so the test will
see the raw `✗` character. Update:

```ts
expect(result).toContain('✗ Error: File not found: input.md');
```

**Step 4: Update test assertions for `formatWarningMessage`**

```ts
// was: '⚠️  Warning: No CSS files found in styles directory'
expect(result).toContain('! Warning: No CSS files found in styles directory');
```

**Step 5: Run tests to verify they fail**

```bash
npx vitest run tests/unit/cli/interactive/utils/format-helpers.test.ts
```

Expected: multiple FAIL assertions matching the old strings.

---

## Task 2: format-helpers - implement the changes

**Files:**

- Modify: `src/cli/interactive/utils/format-helpers.ts`

**Step 1: Update `formatConfigSummary`**

Replace the entire function body with:

```ts
export function formatConfigSummary(config: InteractiveConfig): string {
  const {
    inputFile,
    outputFilename,
    outputFormats,
    processingOptions,
    archiveOptions,
    cssFile,
  } = config;

  let summary = chalk.bold('\nConfiguration summary:\n\n');

  summary += `  Input:      ${inputFile}\n`;
  summary += `  Output:     ${outputFilename}\n`;

  const formats = [];
  if (outputFormats.pdf) formats.push('PDF');
  if (outputFormats.html) formats.push('HTML');
  if (outputFormats.docx) formats.push('DOCX');
  if (outputFormats.markdown) formats.push('Markdown');
  if (outputFormats.metadata) formats.push('Metadata');
  summary += `  Formats:    ${formats.join(', ')}\n`;

  if (outputFormats.html || outputFormats.pdf || outputFormats.docx) {
    summary += `  CSS:        ${cssFile || 'none'}\n`;
  }

  const options = [];
  if (processingOptions.debug) options.push('debug');
  if (processingOptions.fieldTracking) options.push('field tracking');
  if (processingOptions.highlight) options.push('highlight');

  if (options.length > 0) {
    summary += `  Options:    ${options.join(', ')}\n`;
  }

  if (archiveOptions.enabled) {
    const archiveDir = archiveOptions.directory || 'default archive directory';
    summary += `  Archiving:  enabled -> ${chalk.cyan(archiveDir)}\n`;
    summary += `              ${chalk.gray('Smart archiving will determine file handling based on content changes')}\n`;
  } else {
    summary += `  Archiving:  disabled\n`;
  }

  summary += '\n';
  return summary;
}
```

**Step 2: Update `formatSuccessMessage`**

Replace the entire function body with:

```ts
export function formatSuccessMessage(
  outputFiles: string[],
  archiveResult?: ProcessingResult['archiveResult']
): string {
  let message = chalk.bold.green('\n✓ Processing complete\n\n');

  message += chalk.bold('Generated:\n');
  for (const file of outputFiles) {
    message += `  -> ${chalk.cyan(file)}\n`;
  }

  if (archiveResult && !archiveResult.success) {
    message += '\n';
    message += chalk.bold('Archiving:\n');
    message += `  ${chalk.red('✗')} Archiving failed: ${archiveResult.error}\n`;
  }

  message += '\n';
  return message;
}
```

Note: The `path` import can be removed from `format-helpers.ts` after this
change since grouping logic no longer uses it.

**Step 3: Update `formatErrorMessage`**

```ts
export function formatErrorMessage(error: string): string {
  return chalk.bold.red(`\n✗ Error: ${error}\n`);
}
```

**Step 4: Update `formatWarningMessage`**

```ts
export function formatWarningMessage(warning: string): string {
  return chalk.yellow(`\n! Warning: ${warning}\n`);
}
```

**Step 5: Remove unused `path` import**

Remove the line `import * as path from 'path';` from `format-helpers.ts` - it is
no longer used.

**Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/unit/cli/interactive/utils/format-helpers.test.ts
```

Expected: all PASS.

**Step 7: Commit**

```bash
git add src/cli/interactive/utils/format-helpers.ts tests/unit/cli/interactive/utils/format-helpers.test.ts
git commit -m "refactor(interactive-cli): redesign output formatting - flat list, clean symbols, columnar summary"
```

---

## Task 3: output-format - remove emoji and fix YAML label

**Files:**

- Modify: `src/cli/interactive/prompts/output-format.ts`

No dedicated unit tests for prompt choices - verify visually.

**Step 1: Update choices array**

```ts
choices: [
  { name: 'HTML', value: 'html' },
  { name: 'PDF', value: 'pdf', checked: true },
  { name: 'DOCX', value: 'docx' },
  { name: 'Markdown', value: 'markdown' },
  { name: 'Export metadata (YAML)', value: 'metadata' },
],
```

**Step 2: Run full unit test suite to check nothing broke**

```bash
npx vitest run tests/unit/cli/interactive/
```

Expected: all PASS.

**Step 3: Commit**

```bash
git add src/cli/interactive/prompts/output-format.ts
git commit -m "fix(interactive-cli): remove emoji from output format choices, fix YAML/JSON label"
```

---

## Task 4: processing-options - remove section header and emoji

**Files:**

- Modify: `src/cli/interactive/prompts/processing-options.ts`

**Step 1: Remove section header and update choices**

Remove this line:

```ts
console.log('\n⚙️  Processing Options:\n');
```

Update choices:

```ts
const choices = [{ name: 'Debug mode', value: 'debug', checked: false }];

// Markdown tracking option:
choices.push({
  name: 'Field tracking (Markdown output)',
  value: 'fieldTracking',
  checked: false,
});

// Highlight option:
choices.push({
  name: 'Field highlighting (HTML/PDF/DOCX)',
  value: 'highlight',
  checked: true,
});
```

**Step 2: Run unit tests**

```bash
npx vitest run tests/unit/cli/interactive/
```

Expected: all PASS.

**Step 3: Commit**

```bash
git add src/cli/interactive/prompts/processing-options.ts
git commit -m "refactor(interactive-cli): remove section header and emoji from processing options"
```

---

## Task 5: css-selector - remove section header, update None choice

**Files:**

- Modify: `src/cli/interactive/prompts/css-selector.ts`

**Step 1: Remove section header and update constant**

```ts
// Remove this line:
console.log('\n🎨 CSS Selection:\n');

// Change constant from:
const NO_CSS_OPTION = 'No custom CSS';
// To:
const NO_CSS_OPTION = 'None';
```

**Step 2: Run unit tests**

```bash
npx vitest run tests/unit/cli/interactive/
```

Expected: all PASS.

**Step 3: Commit**

```bash
git add src/cli/interactive/prompts/css-selector.ts
git commit -m "refactor(interactive-cli): remove section header and emoji from CSS selector"
```

---

## Task 6: archive-options - remove section header, fix default

**Files:**

- Modify: `src/cli/interactive/prompts/archive-options.ts`

**Step 1: Remove section header and description**

Remove these two lines:

```ts
console.log(chalk.bold.cyan('\n📁 Source File Management'));
console.log('Configure what happens to your source files after processing.\n');
```

**Step 2: Fix the custom directory default**

Find:

```ts
default: 'processed',
```

Replace with:

```ts
default: path.basename(RESOLVED_PATHS.ARCHIVE_DIR),
```

This requires adding `import * as path from 'path';` at the top if not already
present.

**Step 3: Run unit tests**

```bash
npx vitest run tests/unit/cli/interactive/
```

Expected: all PASS.

**Step 4: Commit**

```bash
git add src/cli/interactive/prompts/archive-options.ts
git commit -m "fix(interactive-cli): remove section header and fix archive directory default value"
```

---

## Task 7: file-selector and file-input-helpers - update constants and fix bug

**Files:**

- Modify: `src/cli/interactive/prompts/file-selector.ts`
- Modify: `src/cli/interactive/utils/file-input-helpers.ts`
- Modify: `tests/unit/cli/interactive/utils/file-input-helpers.test.ts`

**Step 1: Update tests first - change mocked return values**

In `file-input-helpers.test.ts`, find the two places that use the old emoji
strings as mock return values and update them:

```ts
// Line 259 - was: '📝 Enter path manually...'
vi.mocked(select).mockResolvedValue('Enter path manually...');

// Line 276 - was: '❌ Exit'
vi.mocked(select).mockResolvedValue('Exit');
```

Also update the `toContain` assertions for choice names (lines 218, 240):

```ts
// was: stringContaining('Enter path manually')
expect.objectContaining({ name: 'Enter path manually...' }),

// was: stringContaining('Exit')
expect.objectContaining({ name: 'Exit' }),
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/unit/cli/interactive/utils/file-input-helpers.test.ts
```

Expected: FAIL on the mocked value comparisons.

**Step 3: Update constants in `file-selector.ts`**

```ts
const BROWSE_OPTION = 'Browse other folder...';
const MANUAL_OPTION = 'Enter path manually...';
const EXIT_OPTION = 'Exit';
```

Also update the info message:

```ts
// was: chalk.cyan(`🔍 Searching for files in: ${searchDirectory}\n`)
console.log(chalk.gray(`Searching: ${searchDirectory}\n`));
```

And the warning message (already uses `formatWarningMessage` - no emoji in text
itself, just the `!` prefix from the formatter).

And the goodbye:

```ts
// was: chalk.yellow('👋 Goodbye!')
console.log(chalk.yellow('Goodbye.'));
```

And the warning for missing config:

```ts
// was: chalk.yellow('\n⚠️  Input directory not found')
console.log(chalk.yellow('\n! Input directory not found'));
```

**Step 4: Update constants in `file-input-helpers.ts` and fix `\\n` bug**

```ts
const MANUAL_OPTION = 'Enter path manually...';
const EXIT_OPTION = 'Exit';
```

Fix the `\\n` bug at line 48:

```ts
// was: chalk.cyan(`🔍 Searching for files in: ${resolvedPath}\\n`)
console.log(chalk.gray(`Searching: ${resolvedPath}\n`));
```

Update the goodbye message:

```ts
// was: chalk.yellow('👋 Goodbye!')
console.log(chalk.yellow('Goodbye.'));
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/unit/cli/interactive/utils/file-input-helpers.test.ts
```

Expected: all PASS.

**Step 6: Commit**

```bash
git add src/cli/interactive/prompts/file-selector.ts src/cli/interactive/utils/file-input-helpers.ts tests/unit/cli/interactive/utils/file-input-helpers.test.ts
git commit -m "fix(interactive-cli): remove emoji from file selection, fix literal \\n bug in browse-folder"
```

---

## Task 8: index.ts - update welcome and flow messages

**Files:**

- Modify: `src/cli/interactive/index.ts`

No dedicated unit tests for these console.log messages.

**Step 1: Update welcome message**

```ts
// was: chalk.bold.blue('\n🎯 Legal Markdown Interactive CLI\n')
console.log(chalk.bold('\nLegal Markdown Interactive CLI\n'));
```

**Step 2: Update force commands message**

```ts
// was: chalk.cyan('\n📋 Found force commands in document. Executing automatic configuration...\n')
console.log(
  chalk.cyan('\nForce commands detected. Applying automatic configuration...\n')
);
```

**Step 3: Update "no force commands" message**

```ts
// was: 'No force commands found or error parsing. Continuing with interactive mode...\n'
console.log(
  chalk.gray('No force commands found. Continuing with interactive mode...\n')
);
```

**Step 4: Update cancellation message**

```ts
// was: chalk.yellow('\n❌ Operation cancelled.\n')
console.log(chalk.yellow('\nOperation cancelled.\n'));
```

**Step 5: Update goodbye message**

```ts
// was: chalk.yellow('\n👋 Goodbye!\n')
console.log(chalk.yellow('\nGoodbye.\n'));
```

**Step 6: Run full interactive test suite**

```bash
npx vitest run tests/unit/cli/interactive/
```

Expected: all PASS.

**Step 7: Commit**

```bash
git add src/cli/interactive/index.ts
git commit -m "refactor(interactive-cli): clean up welcome and flow control messages"
```

---

## Task 9: Final verification

**Step 1: Run complete test suite**

```bash
npx vitest run
```

Expected: all PASS, no regressions.

**Step 2: Smoke test interactive mode manually**

```bash
npx ts-node src/cli/interactive/index.ts
```

Walk through the flow once and verify:

- No emoji visible in any prompt or message
- Config summary shows columnar layout
- Output list is flat with `->` prefix
- Warning/error messages use `!` / `✗` respectively

**Step 3: Commit if any fixups needed, then push**

```bash
git push -u origin ux/interactive-cli-redesign
```
