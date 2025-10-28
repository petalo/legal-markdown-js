# Phase 2: String Transformations

## Overview

Phase 2 performs **string-level transformations** on raw markdown content BEFORE
remark AST parsing. These transformations handle patterns that would be
fragmented and impossible to match once the content is parsed into an AST.

**Module:** `src/core/pipeline/string-transformations.ts` **Related Issue:**
[#149 - Refactor pipeline to separate string transformations from AST plugins](https://github.com/petalo/legal-markdown-js/issues/149)

## Why String Transformations Exist

### The AST Fragmentation Problem

When remark parses markdown into an Abstract Syntax Tree (AST), it splits
content into typed nodes (paragraphs, text, strong, emphasis, etc.). Multi-line
patterns with markdown formatting get fragmented across these nodes, making it
**impossible** for AST-based plugins to match complete patterns.

### Example: Multi-line Optional Clause

Consider this optional clause with markdown formatting:

```markdown
[l. **Warranties**

The seller provides warranties.]{includeWarranties}
```

**As String (BEFORE remark):**

```text
✅ Regex can match the complete pattern:
   /\[(.*?)\]\{(.*?)\}/s
```

**As AST (AFTER remark parsing):**

```text
❌ Plugin cannot see complete pattern - it's fragmented:

Paragraph {
  children: [
    Text("["),
    Text("l. "),
    Strong("Warranties"),      ← Markdown formatting creates nodes
    Text("]{"),
    Text("includeWarranties"),
    Text("}")
  ]
}
Paragraph {
  children: [
    Text("The seller provides warranties.")  ← New paragraph
  ]
}
```

The opening `[` and closing `]{condition}` are in different parts of the AST,
and the content spans multiple paragraphs with nested formatting. No AST plugin
can match this pattern.

## Transformation Order

String transformations run in a specific order to handle dependencies:

```text
1. Field Pattern Normalization
   ├─ Convert custom patterns to standard {{field}} format
   └─ Must run BEFORE template loops (Handlebars needs consistent syntax)

2. Optional Clauses Processing
   ├─ Evaluate [content]{condition} patterns
   └─ Must run BEFORE template loops (allows Handlebars inside clauses)

3. Template Loops Processing
   ├─ Expand {{#each}}, {{#if}}, etc. (Handlebars blocks)
   └─ Must run AFTER field normalization (all fields use {{}} syntax)
```

## Decision Tree: String Transform vs AST Plugin

Use this decision tree to determine whether a feature should be implemented as a
string transformation or a remark plugin:

```text
┌─ Does the pattern span multiple lines?
│  └─ YES → String Transformation
│
├─ Does the pattern contain markdown formatting (**, *, [], etc.)?
│  └─ YES → String Transformation
│
├─ Does the pattern need to see complete blocks (like {{#each}}...{{/each}})?
│  └─ YES → String Transformation
│
├─ Does the pattern need AST context (node types, parent/child relationships)?
│  └─ YES → Remark Plugin
│
├─ Does the feature need to insert or modify AST nodes?
│  └─ YES → Remark Plugin
│
└─ Does the feature work on simple text replacement?
   ├─ YES → Can be either (prefer String Transformation for simplicity)
   └─ NO  → Remark Plugin
```

## Current String Transformations

### 1. Field Pattern Normalization

**Purpose:** Convert custom field patterns to standard `{{field}}` format

**Why String-Level:** Simple text replacement that must happen before Handlebars
compilation

**Example:**

```markdown
<!-- Before -->

The price is |price| and tax is <tax>

<!-- After -->

The price is {{price}} and tax is {{tax}}
```

**Future:** May support additional custom patterns like `|field|` or `<field>`

### 2. Optional Clauses

**Purpose:** Conditionally include/exclude content blocks based on metadata

**Why String-Level:** Multi-line content with markdown formatting gets
fragmented in AST (see example above)

**Syntax:** `[content]{condition}`

**Example:**

```markdown
<!-- Input -->

[l. **Warranties**

The seller provides the following warranties:

- Warranty 1
- Warranty 2]{includeWarranties}

<!-- With includeWarranties=true: -->

l. **Warranties**

The seller provides the following warranties:

- Warranty 1
- Warranty 2

<!-- With includeWarranties=false: -->

(removed)
```

**Implementation:** `preprocessOptionalClauses()` in `string-transformations.ts`

### 3. Template Loops

**Purpose:** Expand Handlebars blocks (`{{#each}}`, `{{#if}}`) with data

**Why String-Level:** Handlebars blocks span multiple lines and need to see
complete block structures that would be fragmented in AST

**Syntax:**

- Handlebars (standard): `{{#each items}}...{{/each}}`
- Legacy (deprecated): `{{#items}}...{{/items}}`

**Example:**

```markdown
<!-- Input -->

{{#each services}} l. **{{name}}**

Description: {{description}} Price: {{formatCurrency price "USD"}} {{/each}}

<!-- Output with services=[{name:"Design", description:"...", price:1000}] -->

l. **Design**

Description: ... Price: $1,000.00
```

**Implementation:** `processTemplateLoops()` in
`src/extensions/template-loops.ts`

## Features That MUST Be String Transformations

These features **cannot** work as remark plugins:

| Feature                 | Reason                                               |
| ----------------------- | ---------------------------------------------------- |
| Optional clauses        | Multi-line content with markdown formatting          |
| Template loops          | Handlebars blocks span multiple paragraphs           |
| Field normalization     | Must happen before Handlebars compilation            |
| Multi-line conditionals | Condition and content span different AST nodes       |
| Block-level expansions  | Need to see complete blocks before AST fragmentation |

## Features That MUST Be AST Plugins

These features **require** AST context:

| Feature                 | Reason                                                   |
| ----------------------- | -------------------------------------------------------- |
| Imports (`@import`)     | Need to insert AST nodes at specific positions           |
| Legal headers (l., ll.) | Need to identify paragraph nodes and convert to headings |
| Cross-references        | Need AST context to resolve section numbers              |
| Dates (`@today`)        | Simple text nodes work fine in AST                       |
| Signature lines         | Need to wrap text nodes with HTML nodes                  |

## Implementation Details

### Entry Point

```typescript
import { applyStringTransformations } from './core/pipeline/string-transformations';

const result = await applyStringTransformations(content, {
  metadata: { ...yamlMetadata, ...additionalMetadata },
  debug: true,
  enableFieldTracking: true,
  noClauses: false,
});

// result.content is ready for remark AST parsing
// result.metadata includes field mappings and tracking data
```

### Adding a New String Transformation

To add a new string transformation:

1. **Determine if it should be a string transformation** (use decision tree
   above)

2. **Add transformation function** in `string-transformations.ts`:

   ```typescript
   function myNewTransformation(
     content: string,
     metadata: Record<string, any>,
     debug: boolean = false
   ): string {
     // Transform content
     return processedContent;
   }
   ```

3. **Add to transformation order** in `applyStringTransformations()`:

   ```typescript
   // Step N: My new transformation
   processedContent = myNewTransformation(
     processedContent,
     metadata,
     options.debug || false
   );
   ```

4. **Add tests** in `tests/unit/core/pipeline/string-transformations.test.ts`

5. **Update documentation** (this file)

## Performance Considerations

String transformations are **fast**:

- Run once per document (before AST parsing)
- Simple regex-based matching
- No AST traversal overhead
- Process raw strings directly

Compared to AST plugins:

| Aspect      | String Transformation | AST Plugin    |
| ----------- | --------------------- | ------------- |
| Speed       | ⚡ Very fast          | 🐌 Slower     |
| Complexity  | ✅ Simple regex       | ❌ Node walk  |
| Multi-line  | ✅ Easy               | ❌ Impossible |
| AST context | ❌ None               | ✅ Full       |

## Debugging

Enable debug logging to trace string transformations:

```typescript
const result = await applyStringTransformations(content, {
  metadata: metadata,
  debug: true, // ← Enable debug logging
});
```

Debug output includes:

```text
[String Transformations] Starting Phase 2 transformations
[String Transformations] Content length: 1234
[normalizeFieldPatterns] Normalized 3 custom field patterns
[preprocessOptionalClauses] Found 2 optional clauses
[preprocessOptionalClauses] Condition "includeWarranties" = true (include: true)
[String Transformations] Template loops processed
[String Transformations] Final content length: 1567
```

## Testing Strategy

### Unit Tests

Test each transformation individually:

```typescript
import { applyStringTransformations } from './string-transformations';

it('processes optional clauses correctly', async () => {
  const content = '[Optional content]{showThis}';
  const metadata = { showThis: true };

  const result = await applyStringTransformations(content, {
    metadata,
    debug: false,
  });

  expect(result.content).toBe('Optional content');
});
```

### Integration Tests

Test complete pipeline flow:

```typescript
import { processLegalMarkdownWithRemark } from './legal-markdown-processor';

it('handles multi-line optional clauses with markdown', async () => {
  const content = `
[l. **Warranties**

The seller provides warranties.]{includeWarranties}
`;

  const result = await processLegalMarkdownWithRemark(content, {
    additionalMetadata: { includeWarranties: true },
  });

  expect(result.content).toContain('Warranties');
});
```

## Migration from remarkClauses

The old `remarkClauses` plugin has been removed because it:

1. **Could not handle multi-line clauses** - AST fragmentation prevented
   matching
2. **Was redundant** - `preprocessOptionalClauses()` already handled clauses
3. **Caused confusion** - Dual processing of the same feature

Migration is transparent - optional clauses continue to work identically, but
now process correctly in all cases (including multi-line with markdown).

## Related Documentation

- [Processing Pipeline Architecture](./03_processing_pipeline.md) - Overall
  4-phase pipeline
- [Remark Integration](./04_remark_integration.md) - Phase 3 AST plugins
- [Template Loops](../../src/extensions/template-loops.ts) - Handlebars
  processing
- [Issue #149](https://github.com/petalo/legal-markdown-js/issues/149) -
  Original refactoring proposal

## References

- **Remark AST Specification:** <https://github.com/syntax-tree/mdast>
- **Handlebars Documentation:** <https://handlebarsjs.com/>
- **CommonMark Spec:** <https://spec.commonmark.org/>
