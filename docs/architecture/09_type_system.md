# Type System <!-- omit in toc -->

- [Overview](#overview)
- [Processing Options](#processing-options)
- [Pipeline Types](#pipeline-types)
- [Plugin Metadata Types](#plugin-metadata-types)
- [Field Tracking Types](#field-tracking-types)
- [Error & Diagnostic Types](#error--diagnostic-types)

## Overview

Legal Markdown JS is written in TypeScript with project-wide `strict` settings.
Shared interfaces reside in `src/types.ts`, with specialised definitions
colocated next to their feature modules (pipeline, plugins, CLI). This section
captures the most important types and where they live.

## Processing Options

`src/types.ts` defines `LegalMarkdownOptions`, the core configuration shape used
by the CLI, web UI and API consumers.

Key groups of options:

- **Execution behaviour** - `yamlOnly`, `noHeaders`, `noClauses`,
  `noReferences`, `noImports`, `noMixins`, `noReset`, `noIndent`
- **Metadata export** - `exportMetadata`, `exportFormat`, `exportPath`
- **Diagnostics** - `debug`, `throwOnYamlError`, `importTracing`,
  `validateImportTypes`, `logImportOperations`
- **Field tracking** - `enableFieldTracking`, `enableFieldTrackingInMarkdown`
- **Context** - `basePath`, `disableFrontmatterMerge`, `_htmlGeneration`

Phase 1 accepts a `Partial<ProcessingOptions>` (see
`src/core/pipeline/context-builder.ts`) that extends `LegalMarkdownOptions` with
CLI-specific flags (`pdf`, `html`, `highlight`, `css`, etc.).

## Pipeline Types

Pipeline modules introduce additional structures:

- `ProcessingContext` - returned by `buildProcessingContext`, contains
  `content`, `rawContent`, `metadata`, `options` and `basePath`
- `ProcessingOptions` - Phase-1 enriched options
  (`src/core/pipeline/context-builder.ts`)
- `FormatGenerationOptions` / `FormatGenerationResult` - describe artefact
  generation (`src/core/pipeline/format-generator.ts`)

These types ensure Phase 2 and Phase 3 consumers can rely on a consistent,
validated context.

## Plugin Metadata Types

`src/plugins/remark/types.ts` defines the metadata contract for the plugin
registry and validator:

- `PluginMetadata` - name, description, version, `runBefore`, `runAfter`,
  `conflicts`, `required`
- `PluginMetadataRegistry` - `Map<string, PluginMetadata>` wrapper
- `PluginOrderValidationResult` - `valid`, `errors`, `warnings`,
  `suggestedOrder`
- `PluginOrderError` / `PluginOrderWarning` - structured diagnostics surfaced by
  the validator

These typings are used by `PluginOrderValidator`, tests and the remark processor
when validating execution order.

## Field Tracking Types

Co-located with the remark plugin and documented in
`docs/architecture/05_field_tracking.md`:

- `TrackedField` - field name, status (`'filled' | 'empty' | 'logic'`), values
  and highlight metadata
- `FieldTrackingReport` - aggregate counts and per-field map
- Reports are attached to `LegalMarkdownProcessorResult.reports?.fieldTracking`

## Error & Diagnostic Types

Additional types worth noting:

- `YamlParsingResult` - content/metadata pair returned by YAML parser
- `ImportProcessingResult` - structure used by legacy import processor (still
  referenced by migration work)
- `CliOptions` - `LegalMarkdownOptions` extension declared in
  `src/cli/service.ts`
- `ProcessingResult` - result structure returned by older APIs; still exported
  for compatibility but superseded by `LegalMarkdownProcessorResult`

Strong typing, together with dedicated unit tests for critical conversions,
keeps the processing pipeline predictable and enables confident refactors.
