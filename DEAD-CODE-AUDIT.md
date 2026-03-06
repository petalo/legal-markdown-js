# Dead Code & Legacy Audit Report

> Generated: 2026-03-01 Branch: claude/analyze-legal-markdown-refactor-OiNHB
> Context: Post-B11 refactoring completion audit Verified: 2026-03-01
> (independent cross-check of every claim)

---

## Summary

The v4 refactoring (B0-B11) replaced the old string-based pipeline with a remark
AST pipeline, deleted the legacy template engine, and added Handlebars as the
sole template system. However, the old pipeline infrastructure was never removed
-- it was marked `@deprecated` but left in place. This report documents all dead
code, unused dependencies, and cleanup opportunities.

**Total dead code identified: ~5,360 lines across 15 source files + 2 build
files + ~14 unused npm packages.** Additionally, 10 legacy test files (~3,000
lines) will become orphaned once the dead processors are deleted.

---

## 1. Dead Pipeline Infrastructure

### 1.1 `src/extensions/pipeline/` (2,409 lines) -- FULLY DEAD

**Zero imports from outside this directory.** The entire module is unreachable.

| File                  | Lines | Purpose (historical)                                                         |
| --------------------- | ----- | ---------------------------------------------------------------------------- |
| `pipeline-manager.ts` | 789   | Orchestrated the old string-based processing pipeline                        |
| `pipeline-config.ts`  | 691   | Wired deprecated processors together, imported all 6 core processors         |
| `pipeline-logger.ts`  | 511   | Logging for the old pipeline steps                                           |
| `types.ts`            | 418   | Type definitions for the old pipeline (PipelineConfig, PipelineResult, etc.) |

**Action:** Delete entire `src/extensions/pipeline/` directory.

### 1.2 `src/core/processors/` (2,717 lines) -- FULLY DEAD

All 7 files are marked `@deprecated, will be removed in v4.0.0`. Their only
production consumer was `pipeline-config.ts` (Section 1.1, also dead).

| File                     | Lines | Replaced by                                          |
| ------------------------ | ----- | ---------------------------------------------------- |
| `header-processor.ts`    | 617   | `src/plugins/remark/legal-headers-parser.ts`         |
| `mixin-processor.ts`     | 540   | `src/extensions/ast-mixin-processor.ts` + Handlebars |
| `date-processor.ts`      | 386   | `src/plugins/remark/dates.ts` + `@today` in YAML     |
| `reference-processor.ts` | 365   | `src/plugins/remark/cross-references.ts`             |
| `import-processor.ts`    | 360   | `src/plugins/remark/imports.ts`                      |
| `clause-processor.ts`    | 244   | `src/plugins/remark/clauses.ts`                      |
| `base-processor.ts`      | 205   | No replacement needed (abstract base class)          |

**Warning:** 10 test files directly import from these processors (see Section
8). Several contain unique edge-case coverage not replicated in the remark
plugin test suites. These must be addressed before deletion.

**Action:** Delete entire `src/core/processors/` directory. Remove re-exports
from `src/core/index.ts`. Delete or migrate the 10 orphaned test files (Section
8).

### 1.3 `src/core/pipeline/` (1,716 lines) -- PARTIALLY DEAD

This directory has mixed status. The CLI (`src/cli/service.ts` and
`src/cli/interactive/service.ts`) imports three functions:

| Export                         | Used by | Status                                             |
| ------------------------------ | ------- | -------------------------------------------------- |
| `buildProcessingContext`       | CLI     | **KEEP** -- builds YAML context, resolves imports  |
| `generateAllFormats`           | CLI     | **KEEP** -- generates HTML/PDF/highlighted outputs |
| `buildFormatGenerationOptions` | CLI     | **KEEP** -- builds format generation config        |
| `preprocessorAdapter`          | Nobody  | DEAD                                               |
| `remarkTemplateLoops`          | Nobody  | DEAD                                               |
| `templateLoopsAdapter`         | Nobody  | DEAD                                               |

**Action:** Keep the 3 used functions (in `context-builder.ts`,
`format-generator.ts`, `string-transformations.ts`). Delete dead adapters
(`preprocessor-adapter.ts`, `loops-adapter.ts`). Simplify `index.ts` exports.

---

## 2. Unused npm Dependencies

### 2.1 Production Dependencies (remove with `npm uninstall`)

| Package            | Why it's dead                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `remark`           | We import `unified` + `remark-parse` + `remark-stringify` directly, not the `remark` convenience wrapper |
| `remark-html`      | HTML generation uses `marked.js`, not remark-html                                                        |
| `restructured`     | reStructuredText parser -- no usage found in codebase                                                    |
| `latex-ast-parser` | LaTeX parser -- no usage found in codebase                                                               |

**Note:** `cosmiconfig`, `unist-util-is`, and `unist-util-visit-parents` were
flagged by depcheck but are likely false positives (dynamic imports or
sub-dependency usage).

### 2.2 Dev Dependencies (residual from pre-Vite build)

These are remnants of the webpack/browserify build system that Vite replaced:

| Package                 | Why it's dead                                |
| ----------------------- | -------------------------------------------- |
| `browserify`            | Replaced by Vite library mode                |
| `buffer`                | Browserify polyfill, not needed with Vite    |
| `crypto-browserify`     | Browserify polyfill                          |
| `events`                | Browserify polyfill                          |
| `stream-browserify`     | Browserify polyfill                          |
| `util`                  | Browserify polyfill                          |
| `webpack-cli`           | Replaced by Vite                             |
| `ts-loader`             | Webpack loader, not needed                   |
| `@vitejs/plugin-legacy` | Only needed if targeting IE11 (we don't)     |
| `autoprefixer`          | PostCSS plugin, not configured anywhere      |
| `postcss`               | Not used -- Vite inlines CSS without PostCSS |

Also confirmed dead after verification:

| Package                       | Notes                         |
| ----------------------------- | ----------------------------- |
| `@testing-library/user-event` | Zero imports in any test file |

**Not dead (verified active):**

| Package                       | Why it stays                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `tsconfig-paths`              | Used in 3 npm scripts (`cli`, `cli:ui`, `dev`) for ts-node path alias resolution |
| `@semantic-release/changelog` | Used in `.releaserc.json` (line 71), part of active release pipeline             |
| `@semantic-release/git`       | Used in `.releaserc.json` (line 75), part of active release pipeline             |

---

## 3. Redundant Code Patterns

### 3.1 Legacy syntax detection in `template-fields.ts`

`src/plugins/remark/template-fields.ts` lines 337-360 contain a legacy helper
syntax detection block (`helperName(arg1, arg2)` pattern). This is redundant
with the check in `src/extensions/template-loops.ts:hasLegacySyntax()` which
already throws `ProcessingError` with migration instructions.

The template-fields block silently skips legacy syntax instead of throwing,
which means if a document somehow bypasses the template-loops check, legacy
calls would be silently ignored rather than producing an error.

**Verified:** `processTemplateLoops()` runs unconditionally in Phase 2
(`applyStringTransformations` in `string-transformations.ts`).
`remarkTemplateFields` runs in Phase 3 (remark AST pipeline). There is no code
path that skips Phase 2 but reaches Phase 3. The template-fields legacy block is
therefore unreachable.

**Action:** Remove the legacy detection block from template-fields.ts. The
template-loops check is the authoritative gate. If it passes, there is no legacy
syntax to detect.

### 3.2 `src/core/index.ts` barrel exports

`src/core/index.ts` re-exports all deprecated processors. After deleting
`src/core/processors/`, these exports should be removed. The remaining exports
(parsers, utils) should be reviewed for relevance.

### 3.3 `src/extensions/index.ts` barrel exports

Exports `ast-mixin-processor` which is still used by `template-fields.ts` (the
`detectBracketValues` function). This is NOT dead but should be verified as the
sole remaining consumer.

---

## 4. Files Safe to Delete

```
# Fully dead -- zero production consumers
src/extensions/pipeline/pipeline-manager.ts      (789 lines)
src/extensions/pipeline/pipeline-config.ts       (691 lines)
src/extensions/pipeline/pipeline-logger.ts       (511 lines)
src/extensions/pipeline/types.ts                 (418 lines)
src/core/processors/header-processor.ts          (617 lines)
src/core/processors/mixin-processor.ts           (540 lines)
src/core/processors/date-processor.ts            (386 lines)
src/core/processors/reference-processor.ts       (365 lines)
src/core/processors/import-processor.ts          (360 lines)
src/core/processors/clause-processor.ts          (244 lines)
src/core/processors/base-processor.ts            (205 lines)
src/core/pipeline/preprocessor-adapter.ts        (119 lines)
src/core/pipeline/loops-adapter.ts               (73 lines)
src/browser.ts                                   (10 lines)
webpack.config.cjs                               (30 lines)
                                          TOTAL: ~5,358 lines
```

---

## 5. Risk Assessment

| Action                                        | Risk       | Mitigation                                                                                     |
| --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| Delete `extensions/pipeline/`                 | **None**   | Zero imports, cannot break anything                                                            |
| Delete `core/processors/`                     | **Medium** | Production-dead, but 10 test files import directly. Must delete/migrate tests too (Section 8). |
| Delete dead adapters in `core/pipeline/`      | **Low**    | Only exported from barrel, no direct consumers.                                                |
| Remove unused npm deps                        | **Low**    | Production deps are not imported. Dev deps are not in build config. Run build + tests after.   |
| Remove legacy detection in template-fields.ts | **Medium** | Verify template-loops gate catches all cases first.                                            |

---

## 6. Execution Plan

Recommended order (each step independently verifiable):

1. **Delete `src/extensions/pipeline/`** -- safest, zero risk. Also delete
   `tests/unit/extensions/pipeline-manager.unit.test.ts`.
2. **Migrate unique test coverage** from the 10 legacy test files into the
   corresponding remark plugin test suites (Section 8). Then delete the legacy
   test files.
3. **Delete `src/core/processors/`** -- remove re-exports from `core/index.ts`
4. **Clean `src/core/pipeline/`** -- delete dead adapters, simplify index.ts
5. **Remove unused production deps** --
   `npm uninstall remark remark-html restructured latex-ast-parser`
6. **Remove unused dev deps** --
   `npm uninstall browserify buffer crypto-browserify events stream-browserify util webpack-cli ts-loader @testing-library/user-event`
7. **Delete legacy UMD build** -- delete `webpack.config.cjs` and
   `src/browser.ts` (coupled pair, see Section 9). Verify Vite produces the
   needed browser bundle first.
8. **Simplify template-fields.ts** -- remove redundant legacy detection block

After each step: `npx tsc --noEmit && npx vitest run`

---

## 7. What NOT to Delete

| Item                                                       | Why it stays                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `buildProcessingContext` (core/pipeline)                   | CLI uses it to parse YAML + resolve imports                         |
| `generateAllFormats` (core/pipeline)                       | CLI uses it for HTML/PDF generation                                 |
| `detectSyntaxType` / `hasLegacySyntax` (template-loops.ts) | Error gate for legacy syntax -- produces migration instructions     |
| `ast-mixin-processor.ts`                                   | `detectBracketValues` still used by template-fields.ts              |
| `cosmiconfig`                                              | Used in src/config/, depcheck false positive                        |
| `tsconfig-paths`                                           | Used in npm scripts `cli`, `cli:ui`, `dev` for ts-node path aliases |
| `@semantic-release/changelog`                              | Used in `.releaserc.json`, active release pipeline                  |
| `@semantic-release/git`                                    | Used in `.releaserc.json`, active release pipeline                  |

---

## 8. Legacy Test Files Requiring Migration

10 test files directly import from `src/core/processors/`. Deleting the
processors without addressing these tests will break the test suite. Each file
was analyzed for unique edge-case coverage not present in the remark plugin test
suites.

### 8.1 Files with significant unique coverage (migrate before deleting)

| Test file                                                              | Unique assertions not in remark tests                                                                                                                                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/core/processors/import-processor-frontmatter.unit.test.ts` | **Entirely unique.** Circular import detection, reserved field filtering, import tracing, cascading frontmatter merge order, type validation. No remark equivalent exists.                      |
| `tests/unit/processors/clause-processor.unit.test.ts`                  | `AND`/`OR` keyword operators, `=`/`!=` equality in `[text]{condition}` syntax, nested object equality, multiline clauses, special chars in condition names                                      |
| `tests/unit/processors/date-processor.unit.test.ts`                    | `dateFormat` camelCase alias, `lang`/`tz` aliases for locale/timezone, named formats via metadata (`US`, `European`), ordinal teen exceptions (11th/12th/13th), individual custom format tokens |
| `tests/unit/processors/reference-processor.unit.test.ts`               | Metadata-based pipe `\|key\|` resolution (not just headers), `%R` uppercase Roman numerals, keys with dots/hyphens, comprehensive field tracking attribute assertions                           |
| `tests/unit/processors/header-processor.unit.test.ts`                  | `level-indent` customization, skip-level numbering (l. then lll.), malformed header passthrough                                                                                                 |
| `tests/unit/processors/header-advanced-options.unit.test.ts`           | `no-reset`/`no-indent` read from metadata (not options object), options-over-metadata precedence, `%s` sibling counter with noReset                                                             |
| `tests/unit/core/advanced-features.unit.test.ts`                       | Outline numbering (Roman + alpha + numeric mixed), angle-bracket `<>` style, numeric `level-indent` (2.0 not '2.0'), invalid header level cap (l10.)                                            |
| `tests/unit/processors/mixin-processor.unit.test.ts`                   | `enableFieldTracking` backward compat (must NOT add spans), `{{ spaces }}` whitespace handling, legacy processMixins API behavioral contract                                                    |

### 8.2 Files safe to delete (coverage is redundant or low-risk)

| Test file                                             | Notes                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tests/unit/processors/import-processor.unit.test.ts` | `validateImports()` utility and permission errors are the only unique bits; lower risk                          |
| `tests/unit/core/mixin-processor-helpers.test.ts`     | Helpers are individually tested in `extensions/helpers/`; only the template invocation error contract is unique |

### 8.3 Remark plugin test suites (migration targets)

| Processor           | Migrate unique assertions to                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| header-processor    | `tests/unit/plugins/remark/headers.unit.test.ts`, `header-indentation.unit.test.ts` |
| clause-processor    | `tests/unit/plugins/remark/clauses.unit.test.ts`, `clause-syntaxes.test.ts`         |
| date-processor      | `tests/unit/plugins/remark/dates.unit.test.ts`                                      |
| reference-processor | `tests/unit/plugins/remark/cross-references.unit.test.ts`                           |
| import-processor    | `tests/unit/plugins/remark/imports.unit.test.ts`                                    |
| mixin-processor     | `tests/unit/extensions/ast-mixin-processor.unit.test.ts`                            |

---

## 9. `browser.ts` + `webpack.config.cjs` (coupled dead pair)

The original audit listed `browser.ts` under "What NOT to Delete", claiming it
was needed for a `package.json` `browser` field. **This is incorrect** -- no
`browser` field exists in package.json.

**Actual status:**

- `src/browser.ts` (10 lines) is a thin re-export of `browser-modern.ts`
- Its only consumer is `webpack.config.cjs` (line 6:
  `entry: './src/browser.ts'`)
- `webpack.config.cjs` builds the legacy UMD bundle
  (`legal-markdown.umd.min.js`)
- Vite already builds the browser bundle from `browser-modern.ts` directly
- No source file in `src/` imports `browser.ts`
- `REFACTOR-PLAN.md` explicitly says: "Delete `src/browser.ts` (legacy UMD)"

**These two files form a coupled pair** -- `browser.ts` exists only because
`webpack.config.cjs` references it, and `webpack.config.cjs` is part of the
legacy build system being replaced by Vite.

**Action:** Delete both files. Before deleting, verify that Vite's output
(`dist/browser/legal-markdown.js`) covers all use cases previously served by the
UMD bundle, or add a UMD output format to `vite.config.ts` if needed.

**Risk:** Low. The UMD bundle (`legal-markdown.umd.min.js`) may have external
consumers loading it via `<script>` tags. Check if anyone depends on the UMD
filename before removing.
