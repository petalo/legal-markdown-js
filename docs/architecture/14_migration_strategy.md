# Migration Strategy <!-- omit in toc -->

- [Overview](#overview)
- [Current State](#current-state)
- [Remaining Legacy Surface](#remaining-legacy-surface)
- [Planned Milestones](#planned-milestones)
- [Communication \& Docs](#communication--docs)

## Overview

The migration is complete: the remark-based async pipeline is now the canonical
and only supported processing pipeline. This document captures the final state
and historical cleanup context.

## Current State

- Phase 1/2/3 remark pipeline has replaced all legacy CLI/runtime flows (Issue
  #122 ✅)
- Remark plugin metadata/validator moved next to plugin implementations
- Field tracking, headers, imports and mixins all rely on AST transformations
- New integration/unit suites cover the modern pipeline
  (`tests/integration/pipeline-3-phase.integration.test.ts`,
  `tests/unit/core/pipeline/*`)

## Remaining Legacy Surface

Tracked in supporting docs under `docs/`:

- `DEAD-CODE-AUDIT.md` - catalogue of modules still depending on regex
  processors
- `plans/2026-03-03-phase2-phase3-span-refactor-plan.md` - steps to retire
  legacy helpers once AST equivalents exist
- `plans/2026-03-03-phase2-phase3-span-refactor-validation-report.md` -
  historical checklist and validation outcomes for issues #119-#121 (AST-based
  imports, plugin order hardening, legacy pipeline removal)

Key technical debt items:

1. **`remarkImports` AST insertion** - Issue #119; ensures imported HTML/comment
   structure is preserved
2. **Plugin order tooling polish** - Issue #120; surfacing clearer diagnostics
   in CLI outputs and locking critical orderings
3. **Legacy processor removal** - Issue #121 completed; remaining legacy helpers
   are now deprecated references, not active pipeline paths

## Planned Milestones

| Milestone | Goal                                                 | Status                                 |
| --------- | ---------------------------------------------------- | -------------------------------------- |
| M1        | Complete AST-based import insertion (Issue #119)     | ❌ Pending                             |
| M2        | Harden plugin order validator UX (Issue #120)        | ⚠️ In progress                         |
| M3        | Remove legacy pipeline exports and update docs/tests | ✅ Completed                           |
| M4        | Publish migration guide for downstream integrators   | Draft (`docs/handlebars-migration.md`) |

Each milestone should update this file and the supporting documents, ensuring
downstream teams know how to adapt.

## Communication & Docs

- Architecture set (`docs/architecture/*.md`) stays authoritative for the modern
  pipeline
- Migration progress and pending actions live in the issue-specific docs listed
  above
- Release notes flag breaking changes or deprecations; semantic-release
  automates changelog entries once tasks land on the main branch

Maintaining these artefacts keeps internal teams and external adopters aligned
with the completed transition away from the legacy system.
