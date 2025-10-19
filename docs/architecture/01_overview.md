# Overview

Legal Markdown JS is the TypeScript implementation of the Legal Markdown
processing platform. It ingests contract-friendly markdown plus YAML metadata
and produces consistent, multi-format output (Markdown, HTML, PDF, metadata
exports) while enforcing legal-document conventions such as structured headers
and clause toggles.

## System Purpose

The project exists to:

- Guarantee deterministic, auditable document output across CLI, browser bundle
  and programmatic consumers
- Provide a single parsing + transformation stack built on remark/Unified
- Support template-driven authoring workflows (fields, helpers, clauses,
  references, imports, mixins)
- Supply review tooling such as field tracking and highlight-friendly outputs

## Architecture Posture

The codebase is organised around a **three-phase processing pipeline**:

1. **Phase 1 - Context Builder**: Parse frontmatter, resolve force-commands,
   merge options, and emit a `ProcessingContext`
2. **Phase 2 - Remark Processor**: Run the canonical remark plugin suite once
   and cache the resulting AST + metadata (`LegalMarkdownProcessorResult`)
3. **Phase 3 - Format Generator**: Derive every requested artefact from the
   cached AST without re-processing content

This pipeline is reusable by the CLI, browser interface, automated jobs and
future services. It replaces the legacy regex stack, which now only survives in
compatibility shims tracked in `docs/legacy-deprecation-plan.md`.

## Capability Highlights

### Document Processing

- YAML frontmatter parsing with metadata merging and validation
- Template field resolution (helpers, conditionals, mixins)
- Legal header parsing and numbering with CSS class decoration
- Clause toggles, cross-references, imports and date helpers
- Field tracking with highlight-ready spans and usage reports

### Output Generation

- Markdown (processed content) with optional indentation control
- HTML and PDF via cached AST, with highlight variants and custom CSS support
- Metadata exports (YAML/JSON) aligned with processing options

### Developer Experience

- TypeScript-first APIs with strict typing and shared interfaces
- CLI (scriptable + interactive) and UMD/browser bundles built from the same
  pipeline modules
- Extension points for new remark plugins, helpers and generators
- Comprehensive testing strategy balancing unit, integration and regression
  suites

## Document Map

The architecture documentation is structured as follows:

| Document                    | Focus                                            |
| --------------------------- | ------------------------------------------------ |
| `02_core_system.md`         | Codebase modules, pipeline exports and data flow |
| `03_processing_pipeline.md` | Phase-by-phase pipeline architecture             |
| `04_remark_integration.md`  | Plugin suite, metadata registry and validator    |
| `05_field_tracking.md`      | Field tracking internals and reports             |
| `06_web_interface.md`       | Browser application + bundle integration         |
| `07_cli_system.md`          | CLI stack and service orchestration              |
| `08_extensions.md`          | Supported extension points and patterns          |
| `09_type_system.md`         | Shared types and typing conventions              |
| `10_build_deployment.md`    | Build targets, packaging and distribution        |
| `11_testing_strategy.md`    | Testing layers and coverage expectations         |
| `12_performance.md`         | Benchmarks and performance tooling               |
| `13_security.md`            | Threat model and mitigation checklist            |
| `14_migration_strategy.md`  | Legacy deprecation and adoption plan             |
| `15_troubleshooting.md`     | Runbooks for common failure scenarios            |

Together they document the current architecture baseline after the pipeline
refactor (Issue #122) and serve as the touchpoint for future evolution.
