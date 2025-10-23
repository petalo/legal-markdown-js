# Troubleshooting <!-- omit in toc -->

- [Overview](#overview)
- [Common Failures](#common-failures)
- [Diagnostics Checklist](#diagnostics-checklist)
- [Logging \& Debug Flags](#logging--debug-flags)
- [Support Runbooks](#support-runbooks)

## Overview

This guide summarises the most common issues seen across CLI, web and automated
usage and the recommended steps to diagnose them.

## Common Failures

| Symptom                               | Likely Cause                                                   | Resolution                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `FileNotFoundError` thrown by CLI     | Input path resolved against incorrect `basePath`               | Pass absolute path or set `--base-path`/`RESOLVED_PATHS.DEFAULT_INPUT_DIR` correctly                         |
| Headings lack numbering / CSS classes | `noHeaders` or `noIndent` options enabled, or metadata missing | Remove disabling flags, ensure YAML metadata includes header config, keep Phase 2 metadata injection enabled |
| Highlight HTML not generated          | `--highlight` not provided or CSS path unresolved              | Re-run with `--highlight`, ensure CSS file exists and is reachable                                           |
| Plugin order validation error         | New plugin missing metadata constraints                        | Update `plugin-metadata-registry.ts`, rerun `tests/integration/plugin-order-validation.integration.test.ts`  |
| PDF generation hangs                  | Puppeteer browser download missing                             | Run `npm run test:pdf-setup` or install Chrome dependencies; ensure environment variables allow downloads    |

## Diagnostics Checklist

1. **Reproduce with `--debug`** (CLI) to capture pipeline timings and plugin
   order logs
2. **Run `npm run test:integration`** to confirm global regressions
3. **Inspect `tests/fixtures`** for canonical inputs; compare outputs to isolate
   diffs
4. **Check `ProcessingContext`** by logging its metadata/options to ensure
   force-commands resolved as expected
5. **Validate plugin registry** by running
   `tests/unit/utils/plugin-order-validator.unit.test.ts`

## Logging & Debug Flags

- `--debug` - enables verbose logging in CLI services and remark processor
- `validatePluginOrder: true` - surfaces ordering issues in development builds
- `logImportOperations` / `validateImportTypes` - useful when debugging metadata
  merges and import collisions
- `DEBUG=legal-markdown:*` (future enhancement) - placeholder for
  namespace-based logging if `debug` module is introduced

## Support Runbooks

- **CLI errors** - capture command, environment, `--debug` output and relevant
  metadata files; open an issue referencing architecture document sections if
  the pipeline order seems incorrect
- **Web UI issues** - reproduce via `npm run web`, open browser devtools,
  inspect worker messages logged from pipeline phases
- **Performance regressions** - rerun
  `tests/integration/pipeline-3-phase.integration.test.ts` and profile Phase 2
  plugin timings via custom logging

Keeping troubleshooting notes aligned with the new pipeline helps reduce support
turnaround and keeps future engineers aware of known limitations.
