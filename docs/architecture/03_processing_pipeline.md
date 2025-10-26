# Processing Pipeline Architecture

- [Overview](#overview)
- [Phase 1 - Context Builder](#phase-1--context-builder)
- [Phase 2 - Remark Content Processing](#phase-2--remark-content-processing)
- [Phase 3 - Format Generation](#phase-3--format-generation)
- [Pipeline Entry Points](#pipeline-entry-points)
- [Performance & Validation](#performance--validation)
- [Extension & Migration Notes](#extension--migration-notes)

## Overview

Legal Markdown JS now ships with a **three-phase processing pipeline** that
removes duplicate remark executions and lets every consumer share a cached AST.
The architecture is implemented in `src/core/pipeline` and was introduced while
working on the incremental pipeline initiative (Issue #122). The phases are:

| Phase | Responsibility                                           | Key Outputs                                                             |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1     | Parse frontmatter, resolve force-commands, merge options | `ProcessingContext`                                                     |
| 2     | Run the remark processor exactly once                    | Cached `LegalMarkdownProcessorResult` (content, AST, metadata, exports) |
| 3     | Generate requested artefacts without re-processing       | HTML, PDF, Markdown, metadata files                                     |

```mermaid
flowchart LR
    A[Phase 1\nContext Builder] --> B[Phase 2\nRemark Processor]
    B --> C[Phase 3\nFormat Generator]

    A -.->|ProcessingContext| B
    B -.->|LegalMarkdownProcessorResult| C
    C -->|Generated files| D[CLI / Integrations]
```

The pipeline modules are exported from `src/core/pipeline/index.ts`, making them
available to CLI services, integrations and future API consumers.

## Phase 1 - Context Builder

Phase 1 lives in `src/core/pipeline/context-builder.ts`. It is responsible for
transforming raw markdown + CLI options into a normalized `ProcessingContext`:

- Parses YAML frontmatter via `parseYamlFrontMatter`
- Extracts, renders and applies force-commands (`extractForceCommands`,
  `parseForceCommands`, `applyForceCommands`)
- Merges CLI options, force-commands and additional metadata
- Enables field tracking automatically when highlighting is requested
- Provides validation helpers (`validateProcessingContext`) and metadata merging
  (`mergeMetadata`) for downstream code

The returned `ProcessingContext` bundles the raw content (with and without
YAML), resolved options, merged metadata and the base path that the remark phase
uses for relative imports. Debug logging is emitted when `options.debug` is true
to make tracing easier.

## Phase 2 - Remark Content Processing

Phase 2 reuses the existing remark processor from
`src/extensions/remark/legal-markdown-processor.ts`. The differences introduced
by the pipeline work are:

- `processLegalMarkdownWithRemark` now returns a `LegalMarkdownProcessorResult`
  that includes the processed markdown, metadata, exported file list **and** a
  cached AST (`ast?: Root`)
- Additional metadata gathered in Phase 1 is passed through with the
  `additionalMetadata` option so header numbering and other plugins see the
  consolidated state
- Plugin order validation migrated next to the remark plugins. The validator and
  registry live in `src/plugins/remark/plugin-order-validator.ts` and
  `src/plugins/remark/plugin-metadata-registry.ts`, keeping ordering rules close
  to the implementations (see
  [Remark Content Processing](04_remark_integration.md))

Because Phase 2 only runs **once**, all format generation steps consume the same
AST and metadata snapshot, eliminating the previous "format × remark runs"
combinatorial explosion.

### Pipeline Builder: Single Source of Truth for Plugin Ordering

**New in Phase 2**: The `buildRemarkPipeline()` function in
`src/core/pipeline/pipeline-builder.ts` serves as the **single source of truth**
for determining plugin execution order. This phase-based architecture prevents
subtle ordering bugs like Issue #120 (conditionals evaluating before variables
expand).

**How it works:**

1. **Group by Phase** - Plugins are grouped into 5 explicit phases:
   - Phase 1: CONTENT_LOADING (imports)
   - Phase 2: VARIABLE_EXPANSION (mixins, template fields)
   - Phase 3: CONDITIONAL_EVAL (loops, conditionals)
   - Phase 4: STRUCTURE_PARSING (headers, cross-references)
   - Phase 5: POST_PROCESSING (dates, field tracking)

2. **Topological Sort Within Phases** - Within each phase, plugins are sorted
   using Kahn's algorithm based on `runBefore`/`runAfter` constraints

3. **Validate Capabilities** - Ensures required capabilities (e.g.,
   `variables:resolved`) are provided by earlier plugins

4. **Environment-Aware Validation** - Validation mode adapts automatically:
   - `strict`: Development/CI (throws on violations)
   - `warn`: Production (logs warnings, continues)
   - `silent`: No validation output

**Example Usage:**

```typescript
import { buildRemarkPipeline } from './core/pipeline';
import { GLOBAL_PLUGIN_REGISTRY } from './plugins/remark';

const pipeline = buildRemarkPipeline(
  {
    enabledPlugins: [
      'remarkImports',
      'remarkTemplateFields',
      'processTemplateLoops',
    ],
    metadata: { author: 'Jane Doe' },
    options: { debug: true },
    validationMode: 'strict',
  },
  GLOBAL_PLUGIN_REGISTRY
);

// pipeline.names: ['remarkImports', 'remarkTemplateFields', 'processTemplateLoops']
// pipeline.byPhase: Map { 1 => ['remarkImports'], 2 => ['remarkTemplateFields'], 3 => ['processTemplateLoops'] }
// pipeline.capabilities: Set { 'content:imported', 'fields:expanded', 'variables:resolved', 'conditionals:evaluated' }
```

**Critical Guarantee for Issue #120:**

The phase-based ordering **guarantees** that `remarkTemplateFields` (Phase 2)
always runs before `processTemplateLoops` (Phase 3), ensuring variables are
expanded before conditionals evaluate. This prevents the bug where conditionals
would evaluate against unexpanded `{{variable}}` syntax.

### Template Loop Conditional Evaluation

The `processTemplateLoops` plugin (Phase 3) supports **dual syntax**:

- **Handlebars syntax** (recommended, standard): Uses native Handlebars engine
- **Legacy syntax** (deprecated): Custom expression evaluation (to be removed in
  v4.0.0)

**Since v3.5.0**, Legal Markdown automatically detects which syntax is used and
routes to the appropriate processor. The system logs detailed migration hints
when legacy syntax is detected.

#### Handlebars Engine (New Standard)

Templates using Handlebars syntax benefit from:

- Industry-standard template features
- Subexpressions: `{{formatDate (addYears date 2) "legal"}}`
- Parent context access: `{{../parentVariable}}`
- Native loop helpers: `{{@index}}`, `{{@first}}`, `{{@last}}`
- 30+ registered helpers (date, number, string, math)

See `docs/handlebars-helpers-reference.md` for complete reference.

#### Legacy Expression Evaluation (Deprecated)

The legacy processor includes **full expression evaluation** for conditional
blocks, providing features beyond standard Handlebars (these will be removed in
v4.0.0).

#### Supported Operators

**Comparison Operators:**

- `==` - Equal (loose equality, works with strings and numbers)
- `!=` - Not equal
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

**Boolean Operators:**

- `&&` - Logical AND (higher precedence)
- `||` - Logical OR (lower precedence)

#### Examples

**Simple comparison:**

```yaml
---
city:
  legal: 'madrid'
---
```

```markdown
{{#if city.legal == "madrid"}} Clausula de Madrid {{/if}}
```

**Numeric comparison:**

```yaml
---
contract:
  amount: 50000
---
```

```markdown
{{#if contract.amount > 10000}} High value contract {{/if}}
```

**Complex boolean expression:**

```yaml
---
contract:
  amount: 50000
  jurisdiction: 'spain'
---
```

```markdown
{{#if contract.amount > 10000 && contract.jurisdiction == "spain"}} Spanish
high-value contract {{/if}}
```

#### Implementation Details

The evaluation happens in `evaluateCondition()` which:

1. Detects boolean operators (`&&`, `||`) → delegates to
   `evaluateBooleanExpression()`
2. Detects comparison operators → delegates to `evaluateComparisonExpression()`
3. Falls back to truthiness check for simple variables

Value parsing in `parseComparisonValue()` handles:

- String literals (quoted with `"` or `'`)
- Numeric literals (integers and decimals)
- Boolean literals (`true`, `false`)
- Null literal (`null`)
- Variable references (resolved via `resolveVariablePath()`)

This makes Legal Markdown **more expressive than Handlebars**, which requires
helper functions for comparisons.

#### Comparison with Other Template Engines

| Feature             | Handlebars                 | Liquid                   | Legal Markdown          |
| ------------------- | -------------------------- | ------------------------ | ----------------------- |
| Comparison ops      | ❌ (requires helpers)      | ✅                       | ✅                      |
| Boolean operators   | ❌ (requires helpers)      | ✅                       | ✅                      |
| Syntax              | `{{#if (eq a b)}}`         | `{% if a == b %}`        | `{{#if a == b}}`        |
| Numeric comparisons | `{{#if (gt amount 1000)}}` | `{% if amount > 1000 %}` | `{{#if amount > 1000}}` |

## Phase 3 - Format Generation

Phase 3 is implemented by `src/core/pipeline/format-generator.ts` and focuses on
artefact creation:

- `generateAllFormats` writes HTML, PDF, Markdown and metadata exports without
  re-running the remark phase. It orchestrates Html/Pdf generators and simple
  file writes from the cached AST and processed markdown
- `processAndGenerateFormats` is a convenience helper that executes Phases 2 and
  3 together when Phase 1 already provided a `ProcessingContext`
- Highlight variants share the same cached AST and differ only by the
  `includeHighlighting` flag passed into the Html/Pdf generators
- Output directories are created on demand and comprehensive error messages are
  thrown when creation fails
- Every invocation returns both the generated file list and timing statistics so
  callers can present user feedback or feed telemetry

## Pipeline Entry Points

Two services drive the pipeline at runtime:

- `src/cli/service.ts` - `generateFormattedOutputWithOptions` performs the three
  phases sequentially, ensuring HTML/PDF/Markdown/metadata artefacts come from a
  single remark pass and archiving reuses the processed content
- `src/cli/interactive/service.ts` - the interactive CLI maps user selections to
  CLI options, builds the processing context, runs the remark phase once, then
  calls `generateAllFormats` with the resulting AST

Both services keep their existing single-format behaviour (plain remark output)
for scenarios where only markdown is requested.

## Performance & Validation

- Integration benchmark tests
  (`tests/integration/pipeline-3-phase.integration.test.ts`) confirm a ~50-75 %
  reduction in processing time for multi-format runs by comparing the legacy
  behaviour with the three-phase pipeline
- Unit suites in `tests/unit/core/pipeline/context-builder.test.ts` and
  `tests/unit/core/pipeline/format-generator.test.ts` cover metadata merging,
  error handling and format generation pathways
- Additional CLI and remark plugin tests were updated to assert that the AST is
  preserved across output modes and plugin order validation is enforced when
  requested (`tests/unit/plugins/remark/imports.unit.test.ts`,
  `tests/unit/plugins/remark/css-classes.unit.test.ts`)

## Extension & Migration Notes

- The pipeline exports are additive; existing consumers that call
  `processLegalMarkdownWithRemark` directly remain supported
- New helpers (`buildProcessingContext`, `generateAllFormats`,
  `processAndGenerateFormats`) provide clear integration points for upcoming API
  layers or background workers
- Legacy pipeline code paths tracked in `docs/legacy-deprecation-plan.md` can be
  migrated incrementally by swapping in the three-phase helpers without touching
  business logic
