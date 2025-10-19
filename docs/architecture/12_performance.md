# Performance Considerations <!-- omit in toc -->

- [Overview](#overview)
- [Three-Phase Pipeline Impact](#three-phase-pipeline-impact)
- [Plugin Efficiency](#plugin-efficiency)
- [Format Generation Costs](#format-generation-costs)
- [Benchmarking & Monitoring](#benchmarking--monitoring)
- [Optimisation Guidelines](#optimisation-guidelines)

## Overview

Performance work focuses on minimising repeated parsing/traversal and keeping
I/O predictable. The shift to the three-phase pipeline (Issue #122) delivers the
largest gains by caching the remark AST and eliminating redundant work.

## Three-Phase Pipeline Impact

- **Single remark run** - regardless of the number of requested formats, remark
  executes once per document. Previously HTML + PDF + Markdown meant three or
  four runs; now the cached AST feeds every output.
- **Measured improvements** - integration benchmarks show ~50-75 % faster
  processing for multi-format runs compared to the legacy approach; numbers are
  captured in `tests/integration/pipeline-3-phase.integration.test.ts`.
- **Context reuse** - `ProcessingContext` avoids repeated YAML parsing and
  force-command evaluation when the same document is processed with different
  options inside the same workflow.

## Plugin Efficiency

- Plugins run in a deterministic order validated by `PluginOrderValidator`,
  preventing accidental quadratic behaviour from mis-ordered dependencies.
- Expensive plugins (`remarkImports`, `remarkTemplateFields`) limit repeated
  traversals by caching metadata inside their visitor state.
- AST transformations favour pure functions and limit allocations to keep GC
  pressure low during large document runs.

## Format Generation Costs

- HTML/PDF generation still represents the bulk of processing time once the AST
  is cached. Optimisations include:
  - Rendering highlight + non-highlight variants in parallel
  - Streaming writes via `writeFileSync` guarded by directory existence checks
  - Reusing generated HTML for PDF conversion (no extra remark calls)
- Markdown export simply writes the processed content, contributing negligible
  overhead compared to HTML/PDF.

## Benchmarking & Monitoring

- `tests/integration/pipeline-3-phase.integration.test.ts` includes timing
  asserts to catch regressions
- CLI debug mode (`--debug`) logs per-phase timing to the console, helping spot
  slowdowns in user environments
- Perf investigations log start/stop timestamps in the new pipeline modules for
  deeper analysis when needed

## Optimisation Guidelines

1. **Avoid extra remark runs** - build pipeline extensions on top of the cached
   `LegalMarkdownProcessorResult`
2. **Batch filesystem writes** - create output directories once and reuse them
   to prevent redundant I/O checks
3. **Profile before changing** - use Node's `--inspect` profiler or Vitest's
   benchmark utilities when investigating plugin hotspots
4. **Guard plugin metadata** - ensure new plugins declare dependencies so the
   validator maintains optimal execution order

These practices keep processing fast even as new features (imports/mixins, field
tracking, PDF generation) evolve.
