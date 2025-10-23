# Remark Integration Architecture

- [Remark Integration Architecture](#remark-integration-architecture)
  - [Overview](#overview)
  - [Relationship to the Three-Phase Pipeline](#relationship-to-the-three-phase-pipeline)
    - [Preventing Reprocessing: PDF Generation](#preventing-reprocessing-pdf-generation)
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
      - [Pattern 1: Content Loading First (Phase 1)](#pattern-1-content-loading-first-phase-1)
      - [Pattern 2: Variables Before Conditionals (Phase 2 → Phase 3)](#pattern-2-variables-before-conditionals-phase-2--phase-3)
      - [Pattern 3: Header Parsing Before Processing (Within Phase 4)](#pattern-3-header-parsing-before-processing-within-phase-4)
      - [Pattern 4: Cross-References Before Headers (Within Phase 4)](#pattern-4-cross-references-before-headers-within-phase-4)
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

The plugin suite is organized into **5 explicit processing phases** to ensure
deterministic execution order and prevent subtle bugs like variables evaluating
after conditionals (Issue #120):

| Phase | Group                  | Plugins                                                                                          | Description                                                                                                 |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1     | Content Loading        | `remarkImports`                                                                                  | Load and merge external content via `@import` directives. Must run first to establish complete document AST |
| 2     | Variable Expansion     | `remarkMixins`, `remarkTemplateFields`                                                           | Expand mixin definitions and resolve `{{field}}` template variables. **Critical: runs BEFORE conditionals** |
| 3     | Conditional Evaluation | `processTemplateLoops`, `remarkClauses`                                                          | Evaluate conditional logic and loops. Variables are guaranteed to be resolved at this point                 |
| 4     | Structure Parsing      | `remarkLegalHeadersParser`, `remarkHeaders`, `remarkCrossReferences`, `remarkCrossReferencesAst` | Parse document structure, legal headers and cross-references. Requires fully-expanded content               |
| 5     | Post-Processing        | `remarkDates`, `remarkSignatureLines`, `remarkFieldTracking`, `remarkDebugAst`                   | Final transformations, date resolution, field tracking and debugging utilities                              |

This phase-based architecture ensures that:

- Variables are **always expanded before** conditional evaluation (fixes Issue
  #120)
- Imports load content **before** any transformation plugins run
- Document structure is parsed **after** all content expansions complete
- Field tracking and reporting happen **last** to capture the final state

### Key Plugin Responsibilities

- **AST-based imports** ensure embedded documents retain structure and HTML
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

Each plugin registers its metadata including **phase assignment** and
**capabilities** in `src/plugins/remark/plugin-metadata-registry.ts`:

```typescript
export const PLUGIN_METADATA_LIST: PluginMetadata[] = [
  // PHASE 1: CONTENT_LOADING
  {
    name: 'remarkImports',
    phase: ProcessingPhase.CONTENT_LOADING,
    description: 'Process @import directives and insert content as AST nodes',
    capabilities: ['content:imported', 'metadata:merged'],
    runBefore: ['remarkLegalHeadersParser', 'remarkMixins'],
    required: false,
    version: '2.0.0',
  },

  // PHASE 2: VARIABLE_EXPANSION
  {
    name: 'remarkMixins',
    phase: ProcessingPhase.VARIABLE_EXPANSION,
    description: 'Expand mixin definitions from frontmatter',
    requiresPhases: [ProcessingPhase.CONTENT_LOADING],
    requiresCapabilities: ['metadata:merged'],
    capabilities: ['mixins:expanded'],
    runBefore: ['remarkTemplateFields'],
    required: false,
  },
  {
    name: 'remarkTemplateFields',
    phase: ProcessingPhase.VARIABLE_EXPANSION,
    description: 'Expand template fields ({{field}}) with metadata values',
    capabilities: ['fields:expanded', 'variables:resolved'],
    runAfter: ['remarkMixins'],
    required: true,
  },

  // PHASE 3: CONDITIONAL_EVAL
  {
    name: 'processTemplateLoops',
    phase: ProcessingPhase.CONDITIONAL_EVAL,
    description: 'Process conditional loops and template logic',
    requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],
    requiresCapabilities: ['variables:resolved'],
    capabilities: ['conditionals:evaluated'],
    required: true,
  },
  {
    name: 'remarkClauses',
    phase: ProcessingPhase.CONDITIONAL_EVAL,
    description: 'Process conditional clauses {{#if condition}}...{{/if}}',
    required: false,
  },

  // PHASE 4: STRUCTURE_PARSING
  {
    name: 'remarkLegalHeadersParser',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Parse legal header syntax (l., ll., lll.) into AST metadata',
    requiresPhases: [ProcessingPhase.CONTENT_LOADING],
    capabilities: ['headers:parsed'],
    runBefore: ['remarkHeaders', 'remarkCrossReferences'],
    required: true,
  },
  {
    name: 'remarkCrossReferences',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Process cross-references between document sections',
    requiresCapabilities: ['headers:parsed'],
    capabilities: ['crossrefs:resolved'],
    runAfter: ['remarkLegalHeadersParser'],
    runBefore: ['remarkHeaders'],
    required: false,
  },
  {
    name: 'remarkHeaders',
    phase: ProcessingPhase.STRUCTURE_PARSING,
    description: 'Process and number legal headers',
    requiresCapabilities: ['headers:parsed'],
    capabilities: ['headers:numbered'],
    runAfter: ['remarkLegalHeadersParser', 'remarkCrossReferences'],
    required: true,
  },

  // PHASE 5: POST_PROCESSING
  {
    name: 'remarkDates',
    phase: ProcessingPhase.POST_PROCESSING,
    description: 'Process date references (@today syntax)',
    required: false,
  },
  {
    name: 'remarkFieldTracking',
    phase: ProcessingPhase.POST_PROCESSING,
    description: 'Track field usage for highlighting and reporting',
    requiresCapabilities: ['fields:expanded'],
    required: false,
  },
];
```

**Key Metadata Fields:**

- **`phase`**: Explicit phase assignment (1-5) ensures deterministic ordering
- **`capabilities`**: Semantic tags describing what the plugin produces (e.g.,
  `'variables:resolved'`, `'headers:parsed'`)
- **`requiresPhases`**: Which phases must complete before this plugin runs
- **`requiresCapabilities`**: Which capabilities must be available before this
  plugin runs
- **`runBefore`/`runAfter`**: Fine-grained ordering within a phase (legacy
  constraints, still supported)
- **`required`**: Whether the plugin is mandatory for correct processing

### Dependency Declarations

Plugins declare dependencies using a **two-tier system**:

**1. Phase-Level Dependencies (Coarse-Grained)**

- **`phase`**: Mandatory field assigning the plugin to one of 5 phases
- **`requiresPhases`**: Array of phases that must complete before this plugin
  runs
- **`requiresCapabilities`**: Array of semantic capabilities that must be
  available (e.g., `'variables:resolved'`)
- **`capabilities`**: Array of semantic tags this plugin provides (e.g.,
  `'headers:parsed'`)

**2. Plugin-Level Dependencies (Fine-Grained, within phases)**

- **`runBefore`**: Array of plugin names that must run AFTER this plugin
- **`runAfter`**: Array of plugin names that must run BEFORE this plugin

**Example: Phase-based ordering prevents Issue #120**

```typescript
// remarkTemplateFields runs in Phase 2 (VARIABLE_EXPANSION)
{
  phase: ProcessingPhase.VARIABLE_EXPANSION,
  capabilities: ['variables:resolved']
}

// processTemplateLoops runs in Phase 3 (CONDITIONAL_EVAL)
// and explicitly requires variables to be resolved first
{
  phase: ProcessingPhase.CONDITIONAL_EVAL,
  requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],
  requiresCapabilities: ['variables:resolved']
}
```

This guarantees that **variables always expand before conditionals evaluate**,
preventing the subtle bug where conditionals would evaluate against unexpanded
`{{variable}}` syntax instead of actual values.

These constraints create a dependency graph that the validator resolves using
topological sorting within each phase.

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

The `PluginOrderValidator` class
(`src/plugins/remark/plugin-order-validator.ts`) provides comprehensive
validation logic including:

- **Dependency violations**: `runBefore`/`runAfter` constraint violations
- **Conflicts**: Plugins that cannot be used together
- **Circular dependencies**: Detects impossible ordering scenarios
- **Capability validation**: Ensures required capabilities are provided before
  use
- **Phase validation**: Verifies plugins don't require later phases

```typescript
import { PluginOrderValidator } from './plugins/remark/plugin-order-validator';
import { GLOBAL_PLUGIN_REGISTRY } from './plugins/remark/plugin-metadata-registry';

const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

const result = validator.validate(
  ['remarkImports', 'remarkTemplateFields', 'remarkHeaders'],
  {
    throwOnError: false,
    logWarnings: true,
    debug: false,
  }
);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
  console.log('Suggested order:', result.suggestedOrder);
}
```

#### Validation Result

The validator returns a detailed result object:

```typescript
interface PluginOrderValidationResult {
  valid: boolean; // Overall validation status
  errors: PluginOrderError[]; // Critical errors
  warnings: PluginOrderWarning[]; // Non-critical warnings
  suggestedOrder?: string[]; // Suggested correct order (if validation failed)
}

interface PluginOrderError {
  type:
    | 'dependency-violation'
    | 'conflict'
    | 'circular-dependency'
    | 'capability-missing' // NEW in Phase 3
    | 'phase-dependency'; // NEW in Phase 3
  plugin: string;
  relatedPlugin?: string;
  message: string;
}
```

**NEW in Phase 3**: The validator now automatically checks:

1. **Capability Dependencies**: Ensures that when a plugin requires a capability
   (via `requiresCapabilities`), there's at least one earlier plugin in the
   execution order that provides it (via `capabilities`)

2. **Phase Dependencies**: Validates that plugins with `requiresPhases` only
   reference earlier phases, preventing impossible dependencies

```typescript
// Example: Capability validation catches this error
const result = validator.validate(['processTemplateLoops']); // Missing remarkTemplateFields

// Error: Plugin "processTemplateLoops" requires capability "variables:resolved"
// but no earlier plugin provides it
```

### Common Plugin Ordering Patterns

#### Pattern 1: Content Loading First (Phase 1)

Content imports must always run in Phase 1 to establish the complete document:

```typescript
// ✅ CORRECT - remarkImports in Phase 1
{
  phase: ProcessingPhase.CONTENT_LOADING; // Phase 1
}

// ❌ INCORRECT - Would violate phase ordering
{
  phase: ProcessingPhase.VARIABLE_EXPANSION; // Phase 2 - TOO LATE
}
```

#### Pattern 2: Variables Before Conditionals (Phase 2 → Phase 3)

**Critical for Issue #120**: Variables MUST expand before conditionals evaluate:

```typescript
// ✅ CORRECT - Variables in Phase 2, Conditionals in Phase 3
{
  name: 'remarkTemplateFields',
  phase: ProcessingPhase.VARIABLE_EXPANSION,  // Phase 2
  capabilities: ['variables:resolved']
}
{
  name: 'processTemplateLoops',
  phase: ProcessingPhase.CONDITIONAL_EVAL,  // Phase 3
  requiresCapabilities: ['variables:resolved']
}

// ❌ INCORRECT - Would cause conditionals to evaluate against {{var}} syntax
// (This was the bug in Issue #120)
{
  name: 'processTemplateLoops',
  phase: ProcessingPhase.VARIABLE_EXPANSION,  // Phase 2 - WRONG
}
{
  name: 'remarkTemplateFields',
  phase: ProcessingPhase.CONDITIONAL_EVAL,  // Phase 3 - WRONG
}
```

#### Pattern 3: Header Parsing Before Processing (Within Phase 4)

Header parsing must happen before header numbering, both in Phase 4:

```typescript
// ✅ CORRECT - Both in Phase 4, but runBefore/runAfter ensures order
{
  name: 'remarkLegalHeadersParser',
  phase: ProcessingPhase.STRUCTURE_PARSING,  // Phase 4
  runBefore: ['remarkHeaders']
}
{
  name: 'remarkHeaders',
  phase: ProcessingPhase.STRUCTURE_PARSING,  // Phase 4
  runAfter: ['remarkLegalHeadersParser']
}

// ❌ INCORRECT - Wrong phase assignment
{
  name: 'remarkHeaders',
  phase: ProcessingPhase.VARIABLE_EXPANSION,  // Phase 2 - TOO EARLY
}
```

#### Pattern 4: Cross-References Before Headers (Within Phase 4)

Cross-references must extract `|key|` patterns before header numbering:

```typescript
// ✅ CORRECT - Explicit ordering within Phase 4
{
  name: 'remarkCrossReferences',
  phase: ProcessingPhase.STRUCTURE_PARSING,  // Phase 4
  runBefore: ['remarkHeaders']
}
{
  name: 'remarkHeaders',
  phase: ProcessingPhase.STRUCTURE_PARSING,  // Phase 4
  runAfter: ['remarkCrossReferences']
}
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

1. **Determine the correct phase** for your plugin:
   - Phase 1 (CONTENT_LOADING): Loads external content
   - Phase 2 (VARIABLE_EXPANSION): Expands variables/mixins
   - Phase 3 (CONDITIONAL_EVAL): Evaluates conditions/loops
   - Phase 4 (STRUCTURE_PARSING): Parses document structure
   - Phase 5 (POST_PROCESSING): Final transformations

2. **Register plugin metadata** in `plugin-metadata-registry.ts`:

```typescript
{
  name: 'remarkMyNewPlugin',
  phase: ProcessingPhase.STRUCTURE_PARSING,  // Choose appropriate phase
  description: 'Description of what it does',

  // Phase-level dependencies
  requiresPhases: [ProcessingPhase.VARIABLE_EXPANSION],  // If needed
  requiresCapabilities: ['variables:resolved'],  // If needed
  capabilities: ['my-feature:processed'],  // What this provides

  // Fine-grained ordering within phase (if needed)
  runAfter: ['remarkImports'],
  runBefore: ['remarkHeaders'],

  required: false,
}
```

3. **Add plugin to processor** in `legal-markdown-processor.ts`:

```typescript
processor.use(remarkMyNewPlugin, {
  metadata: result.metadata,
  debug: options.debug,
});
```

4. **Add unit tests** to verify plugin behavior:

```bash
# Create test file
tests/unit/plugins/remark/my-new-plugin.unit.test.ts

# Test phase assignment, capabilities, and interactions
```

5. **Run validation** to ensure correct ordering:

```bash
npm test -- tests/integration/plugin-order-validation.integration.test.ts
npm test -- tests/unit/plugins/remark/plugin-metadata-registry.unit.test.ts
```

6. **Verify behavior** with integration tests showing plugin interactions

### Best Practices

1. **Choose the Right Phase**: Assign plugins to the earliest phase where they
   can safely run
2. **Use Capabilities**: Declare semantic capabilities to make dependencies
   explicit and self-documenting
3. **Minimal Constraints**: Only declare necessary `runBefore`/`runAfter`
   constraints within a phase
4. **Document Dependencies**: Explain why ordering matters in plugin description
   and comments
5. **Test Phase Assignment**: Add unit tests to
   `plugin-metadata-registry.unit.test.ts` for new plugins
6. **Integration Tests**: Add tests for plugin interaction scenarios, especially
   cross-phase dependencies
7. **Enable Validation**: Always validate in development mode to catch ordering
   issues early
8. **Monitor Output**: Watch for validation warnings in production logs

**Phase Assignment Guidelines:**

- If your plugin **loads content from files** → Phase 1 (CONTENT_LOADING)
- If your plugin **expands variables or mixins** → Phase 2 (VARIABLE_EXPANSION)
- If your plugin **evaluates conditionals or loops** → Phase 3
  (CONDITIONAL_EVAL)
- If your plugin **parses structure (headers, refs)** → Phase 4
  (STRUCTURE_PARSING)
- If your plugin **does final formatting or tracking** → Phase 5
  (POST_PROCESSING)

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
