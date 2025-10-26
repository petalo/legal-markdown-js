# Extension Points <!-- omit in toc -->

- [Overview](#overview)
- [Remark Plugin Extensions](#remark-plugin-extensions)
- [Pipeline Extensions](#pipeline-extensions)
- [Helper & Formatter Extensions](#helper--formatter-extensions)
- [CLI & Tooling Hooks](#cli--tooling-hooks)
- [Best Practices](#best-practices)

## Overview

Legal Markdown JS exposes a small set of extension surfaces so teams can add new
behaviour without forking the processor. The supported patterns centre on the
remark ecosystem, pipeline helpers and helper libraries.

## Remark Plugin Extensions

Custom remark plugins are the preferred way to augment document processing.

- Register plugins by extending `src/plugins/remark/plugin-metadata-registry.ts`
  with dependency metadata and adding the implementation under
  `src/plugins/remark/`
- Provide `runBefore`, `runAfter` and `conflicts` declarations so the validator
  (`PluginOrderValidator`) can maintain a valid execution order
- Export configuration hooks from
  `src/extensions/remark/legal-markdown-processor.ts` to make the plugin
  available to consumers

```typescript
// Example metadata entry
{
  name: 'remarkMyPlugin',
  description: 'Custom AST transform',
  runAfter: ['remarkTemplateFields'],
  required: false,
}
```

Plugins receive the shared options object and can attach results to the
processor return value via the `additionalData` field on
`LegalMarkdownProcessorResult`. Detailed guidance lives in
`docs/architecture/04_remark_integration.md`.

## Pipeline Extensions

The three-phase pipeline intentionally keeps Phase 1 and Phase 3 composable:

- Wrap `buildProcessingContext` to inject additional metadata or resolve
  organisation-specific force-commands
- Compose `generateAllFormats` with custom format writers (e.g., JSON, DOCX) by
  augmenting the returned file list after Phase 3 completes
- Add orchestration layers that call `processAndGenerateFormats` with custom
  scheduling, queuing or post-processing concerns

Pipeline consumers should treat the cached `LegalMarkdownProcessorResult` as the
single source of truth for processed content and metadata.

## Helper & Formatter Extensions

Helper libraries remain pluggable through existing registries:

- **Template helpers** - new functions can be added in `src/core/helpers/*` and
  exposed via the template-fields plugin configuration
- **Handlebars helpers** - register custom helpers using the Handlebars engine
  (see details below)
- **HTML/PDF generators** - extend `HtmlGenerator` / `PdfGenerator` with custom
  templates or post-process the generated markup/files before writing them to
  disk
- **Metadata exporters** - consume `LegalMarkdownProcessorResult.metadata` to
  publish additional reports (e.g., compliance summaries)

When adding helpers, update typing in `src/types/helpers.ts` and include
targeted unit tests.

### Handlebars Template Engine

Since v3.5.0, Legal Markdown supports **Handlebars** as the standard template
engine alongside legacy custom syntax (deprecated).

**Registering Custom Handlebars Helpers:**

```typescript
import { registerCustomHelper } from './extensions/handlebars-engine';

// Register a custom helper
registerCustomHelper('formatPhoneNumber', (phoneNumber: string) => {
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
});
```

**Usage in templates:**

```handlebars
Phone: {{formatPhoneNumber client.phone}}
```

**Available Helper Categories:**

- **Date helpers**: `formatDate`, `addYears`, `addMonths`, `addDays`, etc.
- **Number helpers**: `formatCurrency`, `formatPercent`, `numberToWords`, etc.
- **String helpers**: `capitalize`, `titleCase`, `truncate`, `concat`, etc.
- **Math helpers**: `multiply`, `divide`, `add`, `subtract`

See `docs/handlebars-helpers-reference.md` for complete reference.

**Architecture:**

- Helper registration: `src/extensions/handlebars-engine.ts`
- Template processing: `src/extensions/template-loops.ts`
- Syntax detection: Automatic (Handlebars vs Legacy)
- Migration path: See `docs/handlebars-migration.md`

**Best Practices:**

1. Use Handlebars syntax for new templates
2. Register helpers in `handlebars-engine.ts` initialization
3. Provide TypeScript types for helper arguments
4. Include unit tests for custom helpers
5. Document helpers in `handlebars-helpers-reference.md`

## CLI & Tooling Hooks

- `CliService` and `InteractiveService` accept option overrides; wrapper scripts
  can inject defaults (e.g., enforce `--validate-plugin-order` in specific
  environments)
- Downstream tools can consume the `tests/` fixtures and integration harness to
  validate custom plugins against regression suites
- The browser build exposes the same public API, enabling extensions inside the
  web interface without diverging processing logic

## Best Practices

1. **Validate plugin order** - always update metadata and run
   `tests/integration/plugin-order-validation.integration.test.ts`
2. **Respect cached AST** - avoid triggering extra remark runs; reuse the
   `LegalMarkdownProcessorResult` provided by Phase 2
3. **Document new behaviour** - mirror this architecture set when introducing
   new extension types to keep the documentation cohesive
4. **Test thoroughly** - add unit and integration coverage before enabling
   extensions in production pipelines

These guidelines ensure extensions remain compatible with the shared pipeline
and retain the deterministic behaviour expected by legal workflows.
