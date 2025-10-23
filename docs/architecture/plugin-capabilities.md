# Plugin Capabilities Reference

Capabilities are semantic tags that plugins declare to express what they provide
or require. This system enables automatic validation of plugin dependencies and
ensures the processing pipeline executes in the correct order.

## Naming Convention

**Format**: `namespace:action`

- **namespace**: Broad category (e.g., `content`, `headers`, `variables`)
- **action**: What was done (e.g., `imported`, `parsed`, `resolved`)

**Examples**:

- `content:imported` - Content from imports has been loaded
- `metadata:merged` - Metadata has been merged from all sources
- `fields:expanded` - Template fields have been expanded
- `headers:parsed` - Legal headers have been converted to standard headers
- `crossrefs:resolved` - Cross-references have been resolved

## Standard Capabilities

### Phase 1: CONTENT_LOADING

| Capability         | Provided By   | Description                                            |
| ------------------ | ------------- | ------------------------------------------------------ |
| `content:imported` | remarkImports | Content from @import directives loaded into AST        |
| `metadata:merged`  | remarkImports | Metadata from imported files merged with main document |

### Phase 2: VARIABLE_EXPANSION

| Capability           | Provided By          | Description                                      |
| -------------------- | -------------------- | ------------------------------------------------ |
| `mixins:expanded`    | remarkMixins         | Mixin definitions from frontmatter expanded      |
| `fields:expanded`    | remarkTemplateFields | Template fields ({{field}}) resolved with values |
| `variables:resolved` | remarkTemplateFields | All variable expansions complete                 |

**Critical for Issue #120**: The `variables:resolved` capability ensures that
all `{{variable}}` patterns are expanded to actual values BEFORE conditional
evaluation begins.

### Phase 3: CONDITIONAL_EVAL

| Capability               | Provided By          | Description                                                    |
| ------------------------ | -------------------- | -------------------------------------------------------------- |
| `conditionals:evaluated` | processTemplateLoops | Conditional blocks ({{#if}}, {{#unless}}, {{#each}}) evaluated |
| `clauses:processed`      | remarkClauses        | Optional clause syntax processed                               |

### Phase 4: STRUCTURE_PARSING

| Capability           | Provided By              | Description                                                       |
| -------------------- | ------------------------ | ----------------------------------------------------------------- |
| `headers:parsed`     | remarkLegalHeadersParser | Legal header syntax (l., ll., lll.) converted to standard headers |
| `headers:numbered`   | remarkHeaders            | Headers numbered according to metadata rules                      |
| `crossrefs:resolved` | remarkCrossReferences    | Cross-reference markers (\|key\|) resolved to header numbers      |

**Note**: `remarkLegalHeadersParser` now handles legal headers that contain
template fields (e.g., `l. {{title}}`). After template field expansion in Phase
2, these become HTML nodes like `l. <span>Title</span>`, which the parser now
correctly processes.

### Phase 5: POST_PROCESSING

| Capability             | Provided By          | Description                                          |
| ---------------------- | -------------------- | ---------------------------------------------------- |
| `dates:formatted`      | remarkDates          | Date references (@today) formatted                   |
| `signatures:processed` | remarkSignatureLines | Signature line markers processed                     |
| `tracking:enabled`     | remarkFieldTracking  | Field tracking active for highlighting and reporting |

## Capability Dependencies

### Example: Template Loops Require Variables

```typescript
{
  name: 'processTemplateLoops',
  phase: ProcessingPhase.CONDITIONAL_EVAL,
  requiresCapabilities: ['variables:resolved'], // MUST have this
  capabilities: ['conditionals:evaluated']
}
```

This ensures that if you enable `processTemplateLoops`, the validator will
verify that `remarkTemplateFields` (which provides `variables:resolved`) is also
enabled and runs first.

### Example: Cross-References Require Headers

```typescript
{
  name: 'remarkCrossReferences',
  phase: ProcessingPhase.STRUCTURE_PARSING,
  requiresCapabilities: ['headers:parsed'], // MUST have this
  capabilities: ['crossrefs:resolved']
}
```

This ensures cross-references are only resolved after legal headers have been
parsed.

## Optional vs Required Capabilities

**Optional Capability Requirement**:

```typescript
{
  name: 'remarkMixins',
  phase: ProcessingPhase.VARIABLE_EXPANSION,
  // Note: metadata:merged is beneficial but not strictly required
  // Mixins can work without imports
  capabilities: ['mixins:expanded']
}
```

**Required Capability Requirement**:

```typescript
{
  name: 'remarkHeaders',
  phase: ProcessingPhase.STRUCTURE_PARSING,
  requiresCapabilities: ['headers:parsed'], // STRICTLY required
  capabilities: ['headers:numbered']
}
```

## Adding New Capabilities

When creating a new plugin that introduces new functionality:

### 1. Choose a Capability Name

Follow the `namespace:action` convention:

- ✅ Good: `footnotes:processed`, `tables:formatted`, `metadata:validated`
- ❌ Bad: `processFootnotes`, `table-format`, `ValidateMetadata`

### 2. Declare in Plugin Metadata

```typescript
{
  name: 'remarkMyNewPlugin',
  phase: ProcessingPhase.POST_PROCESSING,
  description: 'Process custom markdown syntax',

  // Capabilities this plugin REQUIRES
  requiresCapabilities: ['fields:expanded'],

  // Capabilities this plugin PROVIDES
  capabilities: ['custom-syntax:processed'],

  required: false,
}
```

### 3. Update This Document

Add your new capability to the appropriate phase section above with:

- Capability name
- Plugin that provides it
- Description of what it means

### 4. Add Tests

```typescript
// tests/unit/plugins/remark/plugin-metadata-registry.unit.test.ts
it('should provide custom-syntax:processed capability', () => {
  const metadata = getPluginMetadata('remarkMyNewPlugin');
  expect(metadata?.capabilities).toContain('custom-syntax:processed');
});
```

## Validation Errors

### Error: Missing Required Capability

```
[PipelineBuilder] Capability validation failed:
  - Plugin "remarkCrossReferences" requires capability "headers:parsed"
    but no earlier plugin provides it
```

**Solution**: Enable `remarkLegalHeadersParser` which provides `headers:parsed`.

### Error: Circular Capability Dependencies

```
[PipelineBuilder] Circular dependency detected in capabilities
```

**Solution**: Review plugin metadata and ensure capability requirements form a
directed acyclic graph (DAG). No plugin should require a capability that depends
on its own outputs.

## Best Practices

1. **Be Specific**: Use precise capability names that clearly describe what
   changed
   - ✅ `headers:numbered` (clear action)
   - ❌ `headers:done` (vague)

2. **Namespace Consistency**: Group related capabilities under the same
   namespace
   - `headers:parsed`, `headers:numbered`, `headers:linked`

3. **Document Dependencies**: Explain WHY a capability is required in the plugin
   description

4. **Test Capability Chains**: Add integration tests that verify capability
   requirements are met

5. **Version Capabilities**: If capability meaning changes significantly,
   consider a new capability name rather than breaking existing code

## Debugging Capability Issues

Enable debug mode to see capability validation:

```typescript
const pipeline = buildRemarkPipeline({
  enabledPlugins: [...],
  metadata: {},
  options: {},
  debug: true  // Shows capability validation details
});
```

Debug output:

```
[PipelineBuilder] Validating capabilities...
[PipelineBuilder] ✓ Plugin "processTemplateLoops" requires "variables:resolved"
[PipelineBuilder]   → Provided by "remarkTemplateFields" (Phase 2)
[PipelineBuilder] ✓ All capability requirements satisfied
```

## References

- [Plugin Metadata Registry](../../src/plugins/remark/plugin-metadata-registry.ts) -
  Source of truth for all capabilities
- [Pipeline Builder](../../src/core/pipeline/pipeline-builder.ts) - Capability
  validation logic
- [Remark Integration](./04_remark_integration.md) - Full plugin ordering
  documentation
