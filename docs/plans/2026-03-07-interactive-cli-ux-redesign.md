# Interactive CLI UX Redesign

**Date:** 2026-03-07 **Branch:** `ux/interactive-cli-redesign` **Scope:**
`src/cli/interactive/`

## Problem

The interactive CLI (`legal-md-ui`) uses decorative emoji throughout its
prompts, section headers, and output messages. This creates two issues:

1. **LLM agent parsing** - emoji are semantically ambiguous tokens with variable
   byte widths. Agents invoking the CLI and reading its stdout cannot reliably
   extract structured information from emoji-prefixed lines.
2. **Inconsistency** - the same emoji (`📝`, `🎯`) is reused for unrelated
   concepts; section header styles vary between plain `console.log` and
   `chalk.bold.cyan`; some steps have headers, others do not.

Additionally, the final output list duplicates logic unnecessarily and adds
superfluous line breaks.

## Design decisions

### Symbol system

| Purpose          | Old                 | New                      |
| ---------------- | ------------------- | ------------------------ |
| Success state    | `✅`                | `✓`                      |
| Error / failure  | `❌`                | `✗`                      |
| File path / item | `📄`, `📦`, `🎯`... | `→`                      |
| Warning          | `⚠️`                | `!` (inline text prefix) |
| Status / info    | `🔍`, `📋`, `🎨`... | plain text only          |

ANSI color (chalk) is retained - it is trivially strippable by any consumer.

### Section headers

All `console.log` section headers inserted before Inquirer prompts are
**removed**. The prompt message itself carries sufficient context. The only
console output before a prompt is an informational status line where truly
necessary (e.g. `Searching: <path>`).

### Output list (generated files)

The grouped format (`PDF:` / `HTML:` subheaders) is replaced with a flat list.
The file extension in the path is sufficient to identify the format.

```
✓ Processing complete

Generated:
  → /output/doc.pdf
  → /output/doc.HIGHLIGHT.pdf
  → /output/doc.html

Archiving: failed - <error>    ← only shown on failure
```

### Configuration summary

Columnar key-value layout, lowercase values, no emoji:

```
Configuration summary:

  Input:      /docs/contrato.md
  Output:     contrato
  Formats:    PDF, HTML
  CSS:        none
  Options:    highlight
  Archiving:  disabled
```

## Complete message catalog

### `index.ts` (welcome + flow control)

| Old                                                                             | New                                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `🎯 Legal Markdown Interactive CLI`                                             | `Legal Markdown Interactive CLI`                               |
| `📋 Found force commands in document. Executing automatic configuration...`     | `Force commands detected. Applying automatic configuration...` |
| `No force commands found or error parsing. Continuing with interactive mode...` | `No force commands found. Continuing with interactive mode...` |
| `❌ Operation cancelled.`                                                       | `Operation cancelled.`                                         |
| `👋 Goodbye!`                                                                   | `Goodbye.`                                                     |

### Step 1 - File selection (`file-selector.ts`, `file-input-helpers.ts`)

| Old                                            | New                           |
| ---------------------------------------------- | ----------------------------- |
| `⚠️ Input directory not found`                 | `! Input directory not found` |
| `🔍 Searching for files in: <path>`            | `Searching: <path>`           |
| choice: `📁 Browse other folder...`            | `Browse other folder...`      |
| choice: `📝 Enter path manually...`            | `Enter path manually...`      |
| choice: `❌ Exit`                              | `Exit`                        |
| `👋 Goodbye!`                                  | `Goodbye.`                    |
| 🐛 `\\n` literal in `file-input-helpers.ts:48` | `\n` (bugfix)                 |

### Step 2 - Output formats (`output-format.ts`)

| Old                                      | New                                    |
| ---------------------------------------- | -------------------------------------- |
| choice: `🌐 HTML`                        | `HTML`                                 |
| choice: `📄 PDF`                         | `PDF`                                  |
| choice: `🧾 DOCX`                        | `DOCX`                                 |
| choice: `📝 Markdown`                    | `Markdown`                             |
| choice: `📊 Export metadata (YAML/JSON)` | `Export metadata (YAML)` ← also bugfix |

### Step 3 - Processing options (`processing-options.ts`)

| Old                                                     | New                                  |
| ------------------------------------------------------- | ------------------------------------ |
| section header: `⚙️  Processing Options:`               | **removed**                          |
| choice: `🐛 Debug mode`                                 | `Debug mode`                         |
| choice: `📝 Field tracking in Markdown output`          | `Field tracking (Markdown output)`   |
| choice: `🎯 Field highlighting in HTML/PDF/DOCX output` | `Field highlighting (HTML/PDF/DOCX)` |

### Step 4 - CSS selection (`css-selector.ts`)

| Old                                 | New         |
| ----------------------------------- | ----------- |
| section header: `🎨 CSS Selection:` | **removed** |
| choice: `No custom CSS`             | `None`      |

### Step 6 - Archive options (`archive-options.ts`)

| Old                                                          | New                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| section header: `📁 Source File Management` + description    | **removed**                                          |
| 🐛 `default: 'processed'` (conflicts with shown default dir) | `default: path.basename(RESOLVED_PATHS.ARCHIVE_DIR)` |

### Step 7 - Configuration summary + output (`format-helpers.ts`)

| Old                                    | New                          |
| -------------------------------------- | ---------------------------- |
| `📋 Configuration Summary:`            | `Configuration summary:`     |
| `📄 Input file:`                       | `Input:` (columnar)          |
| `📝 Output filename:`                  | `Output:`                    |
| `🎯 Output formats:`                   | `Formats:`                   |
| `🎨 CSS file:`                         | `CSS:`                       |
| `⚙️  Processing options:`              | `Options:`                   |
| `📦 Source archiving: Enabled → <dir>` | `Archiving: enabled → <dir>` |
| `📦 Source archiving: Disabled`        | `Archiving: disabled`        |
| `✅ Files generated successfully!`     | `✓ Processing complete`      |
| `📄 Generated files:`                  | `Generated:`                 |
| grouped `PDF:` / `HTML:` subheaders    | **removed** - flat list      |
| `<path>`                               | `→ <path>`                   |
| `📦 Source file archiving:` (failure)  | `Archiving:`                 |
| `❌ Error: <msg>`                      | `✗ Error: <msg>`             |
| `⚠️  Warning: <msg>`                   | `! Warning: <msg>`           |

## Bugs fixed

1. `file-input-helpers.ts:48` - `\\n` literal → `\n`
2. `output-format.ts:19` - `"YAML/JSON"` → `"YAML"` (only YAML is exported)
3. `archive-options.ts:62` - custom directory `default: 'processed'` →
   `path.basename(RESOLVED_PATHS.ARCHIVE_DIR)`

## Files to modify

- `src/cli/interactive/index.ts`
- `src/cli/interactive/prompts/archive-options.ts`
- `src/cli/interactive/prompts/css-selector.ts`
- `src/cli/interactive/prompts/output-format.ts`
- `src/cli/interactive/prompts/processing-options.ts`
- `src/cli/interactive/utils/file-input-helpers.ts`
- `src/cli/interactive/utils/file-selector.ts` (via `file-selector.ts`)
- `src/cli/interactive/utils/format-helpers.ts`
