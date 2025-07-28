# Timeout Safety in Legal Markdown Processing

This document describes the timeout safety mechanisms implemented in Legal
Markdown JS to prevent infinite loops and protect against complex nested
structures or circular references during document processing.

## Overview

Legal Markdown processing involves parsing YAML frontmatter, flattening nested
objects, and merging metadata from multiple imported files. While these
operations are typically fast, pathological cases such as deeply nested
structures or circular references could potentially cause performance issues or
infinite loops.

To protect against these scenarios, timeout mechanisms have been implemented at
key processing points.

## Timeout Locations

### 1. Object Flattening (`object-flattener.ts`)

**Default Timeout**: 5 seconds (5000ms)

The object flattening process converts nested objects to dot notation for
granular merging. Timeout protection is applied to prevent excessive processing
time on deeply nested structures.

```typescript
// Example usage
const result = flattenObject(
  complexObject,
  '',
  new WeakSet(),
  Date.now(),
  5000
);
```

**Error Message**:
`Object flattening timed out after 5000ms. This may indicate a complex nested structure or circular references.`

### 2. Frontmatter Merging (`frontmatter-merger.ts`)

**Default Timeout**: 10 seconds (10000ms) for single merge, 15 seconds (15000ms)
for sequential merge

Frontmatter merging involves flattening, comparing, and unflattening metadata
objects. Timeout checks are performed:

- Before flattening objects
- During the merge loop
- In sequential merge operations

```typescript
// Example usage
const result = mergeFlattened(current, imported, {
  timeoutMs: 10000,
  // other options...
});
```

**Error Messages**:

- `Frontmatter merge timed out after 10000ms. This may indicate complex nested structures or circular references.`
- `Sequential merge timed out after 15000ms while processing import X/Y.`

### 3. Import Processing (`import-processor.ts`)

**Default Timeout**: 30 seconds (30000ms)

Import processing handles multiple files with nested imports and metadata
merging. This is the highest-level timeout as it encompasses multiple
operations.

```typescript
// Timeout is automatically applied
const result = processPartialImports(content, basePath, metadata, options);
```

**Error Message**:
`Import processing timed out after 30000ms. This may indicate complex nested imports or circular references.`

## Circular Reference Handling

In addition to timeouts, circular references are explicitly detected and
handled:

```typescript
// Circular reference detected
const circular: any = { name: 'test' };
circular.self = circular;

const result = flattenObject(circular);
// Result: { name: 'test', self: '[Circular Reference]' }
// Warning logged: "Circular reference detected at path 'self'. Replacing with placeholder."
```

## Timeout Configuration

Timeouts can be configured through the options parameter:

```typescript
// Configure frontmatter merge timeout
const mergeOptions: MergeOptions = {
  timeoutMs: 5000, // 5 second timeout
  // other options...
};

// Configure import processing (affects nested operations)
const importOptions: LegalMarkdownOptions = {
  // Timeout is handled internally, but can be indirectly affected by complexity
};
```

## Best Practices

1. **Document Structure**: Keep frontmatter nesting reasonable (< 10 levels
   deep)
2. **Import Chains**: Avoid extremely long chains of nested imports (< 20
   levels)
3. **Circular References**: Ensure imported files don't create circular import
   chains
4. **Performance Monitoring**: Log operations when debugging performance issues

## Error Handling

When timeouts occur, the system will:

1. **Throw a descriptive error** with timeout duration and suggested cause
2. **Preserve system stability** by preventing infinite loops
3. **Provide debugging information** to help identify problematic structures

## Development Notes

- Timeouts use `Date.now()` for consistency across environments
- WeakSet is used for circular reference detection to avoid memory leaks
- Timeout values are configurable but have sensible defaults
- Error messages are designed to be helpful for debugging

## Performance Expectations

Normal legal document processing should complete well within timeout limits:

- **Simple documents** (< 100 metadata fields): < 10ms
- **Complex documents** (< 1000 metadata fields, 5 levels deep): < 100ms
- **Very complex documents** (large nested structures): < 1 second

If operations consistently approach timeout limits, consider:

- Simplifying document structure
- Reducing import nesting depth
- Breaking large documents into smaller, more focused files
