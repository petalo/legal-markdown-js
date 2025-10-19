# Remark Integration Architecture

- [Remark Integration Architecture](#remark-integration-architecture)
  - [Overview](#overview)
  - [Relationship to the Three-Phase Pipeline](#relationship-to-the-three-phase-pipeline)
  - [Plugin Suite](#plugin-suite)
    - [Phase-Aligned Groups](#phase-aligned-groups)
    - [Key Plugin Responsibilities](#key-plugin-responsibilities)
  - [Plugin Metadata Registry \& Order Validation](#plugin-metadata-registry--order-validation)
    - [How It Works](#how-it-works)
    - [Plugin Metadata Registry](#plugin-metadata-registry)
    - [Dependency Declarations](#dependency-declarations)
    - [Automatic Validation](#automatic-validation)
    - [Plugin Order Validator](#plugin-order-validator)
      - [Validation Result](#validation-result)
    - [Common Plugin Ordering Patterns](#common-plugin-ordering-patterns)
      - [Pattern 1: Import Processing First](#pattern-1-import-processing-first)
      - [Pattern 2: Header Parsing Before Processing](#pattern-2-header-parsing-before-processing)
      - [Pattern 3: Cross-References Before Headers](#pattern-3-cross-references-before-headers)
    - [Troubleshooting Plugin Order Issues](#troubleshooting-plugin-order-issues)
      - [Problem: Validation Warnings](#problem-validation-warnings)
      - [Problem: Processing Produces Incorrect Output](#problem-processing-produces-incorrect-output)
      - [Problem: Circular Dependencies](#problem-circular-dependencies)
    - [Adding New Plugins](#adding-new-plugins)
    - [Best Practices](#best-practices)
  - [Legal Markdown Processor Result](#legal-markdown-processor-result)
  - [Diagnostics \& Tooling](#diagnostics--tooling)
  - [Testing Coverage](#testing-coverage)

## Overview

The remark integration is the core AST-processing engine for Legal Markdown JS.
It replaces legacy regex transforms with unified/remark plugins that understand
markdown structure and enables safe manipulation of document content. This
module powers Phase 2 of the processing pipeline and exposes a single entry
point: `processLegalMarkdownWithRemark`.

## Relationship to the Three-Phase Pipeline

Phase 2 of the pipeline (`docs/architecture/03_processing_pipeline.md`)
delegates all markdown transformation work to the remark processor. The
surrounding phases set the stage:

1. **Phase 1 (Context Builder)** provides merged CLI options, force-commands and
   metadata through a `ProcessingContext`
2. **Phase 2 (Remark Processor)** consumes that context and runs the plugin
   suite once, caching the resulting AST
3. **Phase 3 (Format Generator)** reuses the cached AST and processed markdown
   to produce HTML, PDF, Markdown and metadata exports without re-processing

This separation keeps the remark integration focused on AST manipulation while
allowing external services (CLI, API, workers) to orchestrate input/output
concerns without duplicating work.

### Preventing Reprocessing: PDF Generation

**Historical Issue**: An earlier implementation of `generatePdfFormats()` called
`PdfGenerator.generatePdf(markdown)`, which internally regenerated HTML from
markdown. This violated the 3-phase pipeline's "process once, output many"
principle, causing:

- Double HTML conversion (once for HTML output, once inside PDF generation)
- Inconsistent output between saved HTML files and embedded PDF HTML
- Path resolution issues for CSS files (especially `highlight.css`)
- Performance degradation

**Solution**: Phase 3 now uses a two-step approach:

1. Generate HTML once using `HtmlGenerator.generateHtml(markdown, options)`
2. Convert that pre-generated HTML to PDF using
   `PdfGenerator.generatePdfFromHtml(html, outputPath, options)`

This ensures the PDF uses **exactly the same HTML** that would be saved to disk,
with all CSS already resolved and applied.

**Verification**: See `tests/integration/no-reprocessing.integration.test.ts`
which uses spies to verify:

- `generateHtml()` is called exactly once per variant (normal/highlight)
- `generatePdfFromHtml()` is used instead of `generatePdf()`
- The remark processor runs exactly once regardless of output formats

## Plugin Suite

Remark plugins live under `src/plugins/remark`. They follow unified conventions,
receive the shared options object, and can rely on the metadata collected during
Phase 1.

### Phase-Aligned Groups

| Group                      | Plugins                                                        | Description                                                                                               |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Import & Composition       | `remarkImports`, `remarkMixins`                                | Resolve `@import` statements as AST nodes and expand mixin definitions before any field resolution occurs |
| Field Resolution           | `remarkTemplateFields`, `remarkFieldTracking`                  | Replace `{{field}}` expressions and track usage for highlighting and reports                              |
| Header Processing          | `remarkLegalHeadersParser`, `remarkHeaders`                    | Parse legal header markers (`l.`, `ll.`, `lll.`) and attach numbering/CSS classes                         |
| Cross-References & Clauses | `remarkCrossReferences`, `remarkClauses`, `remarkDates`        | Resolve `\|reference\|` patterns, conditional clauses and date helpers                                    |
| Utility                    | `remarkSignatureLines`, `remarkHtmlComments`, `remarkDebugAst` | Optional helpers for signature markup, comment preservation and debugging                                 |

### Key Plugin Responsibilities

- **AST-based imports** ensure embedded documents retain structure and HTML
  (Issue #119 completed - AST insertion working correctly)
- **Template field resolution** integrates helper functions and guards against
  double-processing by modifying nodes directly
- **Field tracking** differentiates `filled`, `empty` and `logic` fields and is
  the basis for highlight output and reporting
  (`docs/architecture/05_field_tracking.md`)
- **Header parsing** externalises legal-numbering rules so downstream tools can
  reference consistent identifiers and CSS classes (see updated table in
  `docs/output/css-classes.md`)

## Plugin Metadata Registry & Order Validation

The Legal Markdown processing pipeline includes an automatic plugin order
validation system that ensures plugins are executed in the correct sequence.
This is critical because some plugins depend on the output of others, and
incorrect ordering can lead to processing errors or incorrect document output.

### How It Works

The plugin order validation system uses metadata-driven dependency declarations
with topological sorting to determine the correct plugin execution order.

### Plugin Metadata Registry

Each plugin registers its dependencies in
`src/plugins/remark/plugin-metadata-registry.ts`:

```typescript
export const PLUGIN_METADATA: PluginMetadata[] = [
  {
    name: 'remarkImports',
    description: 'Process @import directives for document composition',
    runBefore: ['remarkLegalHeadersParser', 'remarkTemplateFields'],
    required: true,
  },
  {
    name: 'remarkLegalHeadersParser',
    description: 'Parse legal header syntax (l., ll., lll.) into AST metadata',
    runAfter: ['remarkImports'],
    runBefore: ['remarkHeaders'],
    required: false,
  },
  {
    name: 'remarkTemplateFields',
    description: 'Expand template fields ({{field}}) with metadata values',
    runAfter: ['remarkImports'],
    required: false,
  },
  {
    name: 'remarkHeaders',
    description: 'Process and number legal headers',
    runAfter: ['remarkLegalHeadersParser'],
    required: false,
  },
  {
    name: 'remarkCrossReferences',
    description: 'Process cross-references between document sections',
    runBefore: ['remarkHeaders'],
    runAfter: ['remarkLegalHeadersParser'],
    required: false,
  },
  {
    name: 'remarkClauses',
    description: 'Process conditional clauses [content]{condition}',
    required: false,
  },
  {
    name: 'remarkDates',
    description: 'Process date references (@today syntax)',
    required: false,
  },
  {
    name: 'remarkHtmlComments',
    description: 'Preserve HTML comments in output',
    required: false,
  },
];
```

### Dependency Declarations

Plugins can declare two types of ordering constraints:

- **`runBefore`**: Array of plugin names that must run AFTER this plugin
- **`runAfter`**: Array of plugin names that must run BEFORE this plugin

These constraints create a dependency graph that the validator resolves using
topological sorting.

### Automatic Validation

The `legal-markdown-processor.ts` automatically validates plugin order when
`validatePluginOrder` option is enabled (default in development):

```typescript
// Validate plugin order if requested
if (options.validatePluginOrder) {
  const validationResult = validatePluginOrder(orderedPluginNames);

  if (!validationResult.isValid) {
    console.warn('[Plugin Order Validation] Issues detected:');
    validationResult.violations.forEach(violation => {
      console.warn(`  - ${violation}`);
    });

    if (validationResult.hasCriticalViolations) {
      throw new Error(
        'Critical plugin order violations detected. ' +
          'The processing pipeline may produce incorrect results.'
      );
    }
  }
}
```

### Plugin Order Validator

The `PluginOrderValidator` utility (`src/utils/plugin-order-validator.ts`)
provides the validation logic:

```typescript
import { validatePluginOrder } from '../utils/plugin-order-validator';

const result = validatePluginOrder([
  'remarkImports',
  'remarkTemplateFields',
  'remarkHeaders',
]);

if (!result.isValid) {
  console.log('Violations:', result.violations);
  console.log('Critical:', result.hasCriticalViolations);
}
```

#### Validation Result

The validator returns a detailed result object:

```typescript
interface PluginOrderValidationResult {
  isValid: boolean; // Overall validation status
  violations: string[]; // List of violation messages
  hasCriticalViolations: boolean; // Whether any violations are critical
  suggestedOrder?: string[]; // Suggested correct order (if violations found)
}
```

### Common Plugin Ordering Patterns

#### Pattern 1: Import Processing First

Imports must always run first because they modify the document structure:

```typescript
// ✅ CORRECT
['remarkImports', 'remarkTemplateFields', 'remarkHeaders'][
  // ❌ INCORRECT - Headers processed before imports
  ('remarkHeaders', 'remarkImports', 'remarkTemplateFields')
];
```

#### Pattern 2: Header Parsing Before Processing

Header parsing must happen before header processing:

```typescript
// ✅ CORRECT
['remarkLegalHeadersParser', 'remarkHeaders'][
  // ❌ INCORRECT - Processing before parsing
  ('remarkHeaders', 'remarkLegalHeadersParser')
];
```

#### Pattern 3: Cross-References Before Headers

Cross-references must extract `|key|` patterns before headers removes them:

```typescript
// ✅ CORRECT
['remarkLegalHeadersParser', 'remarkCrossReferences', 'remarkHeaders'][
  // ❌ INCORRECT - Headers run first, removing |key| patterns
  ('remarkHeaders', 'remarkCrossReferences')
];
```

### Troubleshooting Plugin Order Issues

#### Problem: Validation Warnings

**Symptom**: Console warnings about plugin order violations

**Solution**:

1. Check the violation messages for specific ordering requirements
2. Review plugin metadata in `plugin-metadata-registry.ts`
3. Reorder plugins in processor to match suggested order
4. Run tests to verify correct behavior

#### Problem: Processing Produces Incorrect Output

**Symptom**: Document output doesn't match expectations

**Diagnostic Steps**:

1. Enable plugin order validation: `{ validatePluginOrder: true }`
2. Check console for validation warnings
3. Enable debug mode: `{ debug: true }`
4. Review plugin execution order in logs
5. Compare with expected order from metadata registry

**Example Debug Output**:

```typescript
const result = await processLegalMarkdownWithRemark(content, {
  validatePluginOrder: true,
  debug: true,
});

// Output:
// [Plugin Order Validation] Checking order: remarkImports, remarkTemplateFields, ...
// [Plugin Order Validation] ✓ Valid order
// [remarkImports] Processing 2 imports
// [remarkTemplateFields] Expanding 5 template fields
// [remarkHeaders] Processing 3 headers
```

#### Problem: Circular Dependencies

**Symptom**: Error: "Circular dependency detected"

**Solution**:

1. Review plugin metadata for conflicting constraints
2. Remove unnecessary `runBefore`/`runAfter` declarations
3. Ensure constraints form a directed acyclic graph (DAG)

**Example Fix**:

```typescript
// ❌ INCORRECT - Circular dependency
{
  name: 'pluginA',
  runAfter: ['pluginB']
},
{
  name: 'pluginB',
  runAfter: ['pluginA']
}

// ✅ CORRECT - Remove one constraint
{
  name: 'pluginA',
  runAfter: ['pluginB']
},
{
  name: 'pluginB',
  // No runAfter needed
}
```

### Adding New Plugins

When adding a new plugin to the processing pipeline:

1. **Register plugin metadata** in `plugin-metadata-registry.ts`:

```typescript
{
  name: 'remarkMyNewPlugin',
  description: 'Description of what it does',
  runAfter: ['remarkImports'],  // Dependencies
  runBefore: ['remarkHeaders'], // What depends on this
  required: false,
}
```

2. **Add plugin to processor** in `legal-markdown-processor.ts`:

```typescript
processor.use(remarkMyNewPlugin, {
  metadata: result.metadata,
  debug: options.debug,
});
```

3. **Run validation** to ensure correct ordering:

```bash
npm test -- tests/integration/plugin-order-validation.integration.test.ts
```

4. **Verify behavior** with integration tests showing plugin interactions

### Best Practices

1. **Minimal Constraints**: Only declare necessary ordering constraints
2. **Clear Dependencies**: Document why ordering matters in plugin description
3. **Test Coverage**: Add integration tests for plugin interaction scenarios
4. **Enable Validation**: Always validate in development mode
5. **Monitor Output**: Watch for validation warnings in production logs

## Legal Markdown Processor Result

`processLegalMarkdownWithRemark` returns a `LegalMarkdownProcessorResult` with:

- `content`  processed markdown (respecting `noIndent`, `noHeaders`, etc.)
- `metadata`  merged metadata, including values injected during Phase 1
- `ast`  cached mdast tree available for downstream format generation
- `exportedFiles`  metadata exports written during processing
- `reports`  field tracking and diagnostic reports when enabled

Phase 3 consumes this object directly, so any plugin that needs to expose extra
information can attach it here without reprocessing documents.

## Diagnostics & Tooling

- Enable `debug: true` to see plugin-by-plugin logging, order validation output
  and timing information throughout the pipeline
- Use `remarkDebugAst` locally to inspect AST transformations
- Dedicated utilities (`tests/unit/utils/plugin-order-validator.unit.test.ts`)
  cover the validator behaviour, ensuring dependency errors are actionable
- Repository scripts continue to expose quick smoke checks for HTML comment
  preservation, legal header numbering and cross-reference resolution

## Testing Coverage

- `tests/integration/plugin-order-validation.integration.test.ts` asserts that
  order violations are detected and reported with actionable guidance
- Suite-specific unit tests (e.g.
  `tests/unit/plugins/remark/imports.unit.test.ts`,
  `tests/unit/plugins/remark/css-classes.unit.test.ts`) verify plugin-specific
  behaviours such as AST insertion, CSS class application and highlight markup
- Field tracking expectations remain documented and enforced in
  `tests/unit/plugins/remark/html-comments.unit.test.ts` and related cases
- `tests/integration/legacy-remark-parity.integration.test.ts` verifies
  functional equivalence between legacy processors and remark plugins
- `tests/integration/imports-with-html.integration.test.ts` provides end-to-end
  verification of HTML preservation through the import pipeline
