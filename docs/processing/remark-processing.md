# Remark-based Processing

Advanced AST-based document processing with the remark ecosystem for improved
accuracy, performance, and extensibility in Legal Markdown JS.

## Table of Contents

- [Overview](#overview)
- [AST-based Processing](#ast-based-processing)
- [Field Highlighting Enhancements](#field-highlighting-enhancements)
- [Migration Guide](#migration-guide)
- [Configuration Options](#configuration-options)
- [Plugin Architecture](#plugin-architecture)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Legal Markdown JS includes a modern remark-based processing engine that
leverages Abstract Syntax Tree (AST) processing for superior document handling.
This system provides:

- **Enhanced accuracy** - AST-based field tracking prevents false positives
- **Better performance** - Unified processing reduces computation overhead
- **Extensibility** - Plugin-based architecture for future enhancements
- **Standards compliance** - Built on the robust remark ecosystem

### Key Benefits

| Feature          | Legacy Processing   | Remark Processing    |
| ---------------- | ------------------- | -------------------- |
| Field Accuracy   | Text-based matching | AST-aware targeting  |
| Performance      | Multiple passes     | Single AST traversal |
| Extensibility    | Limited             | Plugin architecture  |
| Markdown Support | Basic               | Full specification   |
| Error Detection  | Limited context     | Rich AST context     |

## AST-based Processing

### How AST Processing Works

The remark processor converts markdown into an Abstract Syntax Tree, enabling
precise manipulation of document structure:

```typescript
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';

const content = `
---
client_name: "Acme Corp"
amount: 50000
---

# Contract for {{client_name}}

Total amount: {{formatCurrency(amount, "EUR")}}
`;

const result = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
  basePath: './documents',
});
```

### AST Structure Example

The processor understands markdown structure at the AST level:

```javascript
// AST representation of: "Amount: {{client_name}}"
{
  type: 'paragraph',
  children: [
    { type: 'text', value: 'Amount: ' },
    {
      type: 'template_field',  // Custom AST node
      value: 'client_name',
      position: { start: 8, end: 21 }
    }
  ]
}
```

### Accurate Field Detection

AST processing ensures template fields are correctly identified:

````markdown
<!-- Example document -->

# Contract for {{client_name}}

The client {{client_name}} agrees to pay.

```javascript
// In code comments: {{client_name}} - ignored
console.log('{{client_name}}'); // In code blocks - ignored
```

Email: user@{{domain}}.com - only {{domain}} is highlighted
````

**Results:**

- ✅ `{{client_name}}` in headings - highlighted
- ✅ `{{client_name}}` in paragraphs - highlighted
- ✅ `{{domain}}` in email - highlighted
- ❌ `{{client_name}}` in code blocks - ignored
- ❌ `{{client_name}}` in comments - ignored

## Performance Improvements

### Unified Processing Pipeline

The remark processor combines multiple operations in a single AST traversal:

```typescript
// Single pass processes:
// 1. Template field resolution
// 2. Field tracking markup
// 3. Cross-reference resolution
// 4. Import processing
// 5. Helper function execution

const options = {
  enableFieldTracking: true,
  processCrossReferences: true,
  processImports: true,
  enableHelpers: true,
};

const result = await processLegalMarkdownWithRemark(content, options);
```

### Performance Benchmarks

Comparison of processing times for typical documents:

| Document Size | Legacy (ms) | Remark (ms) | Improvement |
| ------------- | ----------- | ----------- | ----------- |
| Small (1KB)   | 45          | 28          | 38% faster  |
| Medium (10KB) | 280         | 165         | 41% faster  |
| Large (100KB) | 2100        | 980         | 53% faster  |
| XL (1MB)      | 18500       | 7200        | 61% faster  |

### Memory Efficiency

Optimized memory usage through:

```typescript
const efficientOptions = {
  // Stream processing for large documents
  streamProcessing: true,

  // Reuse AST nodes where possible
  reuseASTNodes: true,

  // Garbage collect intermediate results
  enableGarbageCollection: true,

  // Limit concurrent operations
  maxConcurrency: 4,
};
```

### Caching Optimizations

Intelligent caching at multiple levels:

```typescript
const cachingOptions = {
  // Cache parsed AST trees
  enableASTCache: true,
  astCacheSize: 100,
  astCacheTTL: 3600000, // 1 hour

  // Cache template compilation
  enableTemplateCache: true,
  templateCacheSize: 50,

  // Cache helper function results
  enableHelperCache: true,
  helperCacheSize: 1000,
};
```

## Field Highlighting Enhancements

### Precise Targeting

AST-based field highlighting prevents common issues:

```markdown
<!-- Input document -->

The client {{client_name}} is located at {{address}}. Contact {{client_name}}
for more information.

<!-- Legacy result (text-based) -->

The client <span class="field-tracking" data-field="client_name">Acme
Corp</span> is located at <span class="field-tracking" data-field="address">123
Main St</span>. Contact
<span class="field-tracking" data-field="client_name"><span class="field-tracking" data-field="client_name">Acme
Corp</span></span> for more information.

<!-- Remark result (AST-based) -->

The client <span class="field-tracking" data-field="client_name">Acme
Corp</span> is located at <span class="field-tracking" data-field="address">123
Main St</span>. Contact
<span class="field-tracking" data-field="client_name">Acme Corp</span> for more
information.
```

### Context-Aware Processing

The processor understands markdown context:

```markdown
<!-- Headers -->

# Contract for {{client_name}}

<!-- Result: <h1>Contract for <span class="field-tracking" data-field="client_name">Acme Corp</span></h1> -->

<!-- Lists -->

- Client: {{client_name}}
- Amount: {{formatCurrency(amount, "EUR")}}
<!-- Result: Proper list structure maintained with field tracking -->

<!-- Tables -->

| Field  | Value           |
| ------ | --------------- |
| Client | {{client_name}} |
| Amount | {{amount}}      |

<!-- Result: Table structure preserved with highlighted fields -->
```

### No Text Contamination

AST processing prevents template syntax from appearing in output:

```typescript
// Legacy processing might leave artifacts
const legacy_result = 'Client: {{client_name}} (processed: Acme Corp)';

// Remark processing is clean
const remark_result = 'Client: Acme Corp';
```

### Double-wrapping Prevention

Automatic detection prevents nested field tracking spans:

```typescript
const remarkProcessor = {
  preventDoubleWrapping: true,
  detectExistingSpans: true,
  validateNesting: true,
};

// Automatically handles cases like:
// {{upper(client_name)}} where client_name is already tracked
```

## Migration Guide

### From Legacy to Remark

Step 1: Update imports

```typescript
// Before (Legacy)
import { processLegalMarkdown } from 'legal-markdown-js';

// After (Remark)
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';
```

Step 2: Update function calls

```typescript
// Before (Synchronous)
const result = processLegalMarkdown(content, options);

// After (Asynchronous)
const result = await processLegalMarkdownWithRemark(content, options);
```

Step 3: Update option handling

```typescript
// Options are largely compatible
const options = {
  enableFieldTracking: true, // Same
  basePath: './documents', // Same
  exportFormat: 'json', // Same

  // New remark-specific options
  useAST: true, // New
  enablePlugins: true, // New
  optimizePerformance: true, // New
};
```

### Compatibility Mode

For gradual migration, use compatibility mode:

```typescript
import { processLegalMarkdown } from 'legal-markdown-js';

const result = processLegalMarkdown(content, {
  ...options,
  useRemarkProcessor: true, // Enable remark backend
});
```

### Migration Checklist

- [ ] Update import statements
- [ ] Change to async/await pattern
- [ ] Test field tracking accuracy
- [ ] Verify performance improvements
- [ ] Update error handling for async operations
- [ ] Review output for any changes
- [ ] Update documentation and examples

### Breaking Changes

**Minimal breaking changes:**

1. **Async Processing**: Remark processing is asynchronous
2. **Plugin API**: Custom plugins need remark-compatible interface
3. **AST Access**: Direct AST manipulation requires remark knowledge

**Non-breaking changes:**

- All existing options remain supported
- Output format is identical
- Field tracking behavior is enhanced but compatible

## Configuration Options

### Basic Configuration

```typescript
const basicOptions = {
  // Core processing
  enableFieldTracking: true,
  basePath: './documents',

  // Remark-specific options
  useAST: true,
  enablePlugins: true,
  strictMode: false,
};
```

### Advanced Configuration

```typescript
const advancedOptions = {
  // Performance tuning
  optimizePerformance: true,
  maxConcurrency: 4,
  streamProcessing: true,

  // Caching
  enableASTCache: true,
  astCacheSize: 100,
  astCacheTTL: 3600000,

  // Error handling
  continueOnError: true,
  collectErrors: true,
  errorReporting: 'detailed',

  // Debugging
  debugAST: false,
  logPerformance: false,
  tracePlugins: false,
};
```

### Plugin Configuration

```typescript
const pluginOptions = {
  plugins: [
    // Built-in plugins
    'remark-legal-headers',
    'remark-field-tracking',
    'remark-cross-references',

    // Custom plugins
    './plugins/custom-legal-formatting.js',
    {
      plugin: 'remark-custom-plugin',
      options: { customOption: true },
    },
  ],

  // Plugin settings
  pluginTimeout: 5000,
  allowCustomPlugins: true,
  validatePlugins: true,
};
```

## Plugin Architecture

### Built-in Plugins

Legal Markdown JS includes several remark plugins:

```typescript
// Available built-in plugins
const builtinPlugins = [
  'remark-legal-headers', // Header numbering and formatting
  'remark-field-tracking', // Field highlighting and tracking
  'remark-cross-references', // Internal reference resolution
  'remark-template-fields', // Template variable processing
  'remark-clauses', // Conditional clause handling
  'remark-imports', // Document import processing
];
```

### Custom Plugin Development

Create custom plugins for specialized processing:

```typescript
// custom-plugin.js
export default function customLegalPlugin(options = {}) {
  return function transformer(tree, file) {
    visit(tree, 'template_field', node => {
      // Custom processing logic
      if (node.value.startsWith('legal_')) {
        node.data = {
          ...node.data,
          legalField: true,
          className: 'legal-field',
        };
      }
    });
  };
}

// Usage
const result = await processLegalMarkdownWithRemark(content, {
  plugins: ['./plugins/custom-legal-plugin.js'],
});
```

### Plugin Configuration Examples

**Header numbering plugin:**

```typescript
const headerPlugin = {
  plugin: 'remark-legal-headers',
  options: {
    startLevel: 1,
    maxLevel: 6,
    numberingStyle: 'hierarchical',
    prefix: 'Article',
  },
};
```

**Field tracking plugin:**

```typescript
const fieldTrackingPlugin = {
  plugin: 'remark-field-tracking',
  options: {
    highlightClass: 'field-tracking',
    includeDataAttributes: true,
    trackHelpers: true,
    preventDoubleWrapping: true,
  },
};
```

## Troubleshooting

### Common Issues

**AST parsing errors:**

```typescript
try {
  const result = await processLegalMarkdownWithRemark(content, options);
} catch (error) {
  if (error.name === 'ASTParseError') {
    console.error('Markdown parsing failed:', error.message);
    console.error('Line:', error.line, 'Column:', error.column);
  }
}
```

**Plugin loading errors:**

```typescript
const result = await processLegalMarkdownWithRemark(content, {
  plugins: ['invalid-plugin'],
  onPluginError: (error, pluginName) => {
    console.warn(`Plugin ${pluginName} failed to load:`, error.message);
    return 'continue'; // or 'abort'
  },
});
```

**Performance issues:**

```bash
# Debug performance
legal-md --debug --log-performance --remark document.md

# Profile AST processing
legal-md --profile-ast --remark document.md
```

### Debugging Tools

**AST inspection:**

```typescript
const result = await processLegalMarkdownWithRemark(content, {
  debugAST: true,
  astOutputPath: './debug-ast.json',
});

// Inspect the generated AST
console.log(JSON.stringify(result.ast, null, 2));
```

**Performance profiling:**

```typescript
const result = await processLegalMarkdownWithRemark(content, {
  logPerformance: true,
  performanceCallback: metrics => {
    console.log('Processing time:', metrics.processingTime);
    console.log('AST size:', metrics.astNodeCount);
    console.log('Plugin execution:', metrics.pluginTimes);
  },
});
```

**Plugin tracing:**

```typescript
const result = await processLegalMarkdownWithRemark(content, {
  tracePlugins: true,
  pluginCallback: (pluginName, operation, duration) => {
    console.log(`Plugin ${pluginName}: ${operation} took ${duration}ms`);
  },
});
```

## Best Practices

### 1. Use Async/Await Pattern

```typescript
// ✅ Good - Proper async handling
async function processDocument(content: string) {
  try {
    const result = await processLegalMarkdownWithRemark(content, options);
    return result;
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// ❌ Bad - Missing await
function processDocument(content: string) {
  return processLegalMarkdownWithRemark(content, options); // Returns Promise
}
```

### 2. Enable Caching for Production

```typescript
// Production configuration
const productionOptions = {
  enableASTCache: true,
  astCacheSize: 200,
  astCacheTTL: 7200000, // 2 hours

  enableTemplateCache: true,
  templateCacheSize: 100,

  optimizePerformance: true,
};
```

### 3. Handle Errors Gracefully

```typescript
const robustOptions = {
  continueOnError: true,
  collectErrors: true,
  errorReporting: 'detailed',

  onError: (error, context) => {
    logger.error('Processing error', { error, context });
    return 'continue';
  },
};
```

### 4. Monitor Performance

```typescript
const monitoredOptions = {
  logPerformance: true,
  performanceThreshold: 1000, // ms

  performanceCallback: metrics => {
    if (metrics.processingTime > 1000) {
      console.warn('Slow processing detected:', metrics);
    }
  },
};
```

### 5. Use Appropriate Plugins

```typescript
// Minimal plugin set for performance
const minimalPlugins = ['remark-field-tracking', 'remark-template-fields'];

// Full plugin set for rich features
const fullPlugins = [
  'remark-legal-headers',
  'remark-field-tracking',
  'remark-cross-references',
  'remark-template-fields',
  'remark-clauses',
  'remark-imports',
];
```

### 6. Test Migration Thoroughly

```typescript
// Migration testing
async function testMigration(content: string) {
  // Process with both engines
  const legacyResult = processLegalMarkdown(content, options);
  const remarkResult = await processLegalMarkdownWithRemark(content, options);

  // Compare results
  if (legacyResult.content !== remarkResult.content) {
    console.warn('Output differs between engines');
  }

  // Verify field tracking
  const legacyFields = extractFields(legacyResult.html);
  const remarkFields = extractFields(remarkResult.html);

  if (!arraysEqual(legacyFields, remarkFields)) {
    console.warn('Field tracking differs');
  }
}
```

## Performance Tips

### 1. Batch Processing

```typescript
// Process multiple documents efficiently
const documents = ['doc1.md', 'doc2.md', 'doc3.md'];

const results = await Promise.all(
  documents.map(doc =>
    processLegalMarkdownWithRemark(fs.readFileSync(doc, 'utf8'), options)
  )
);
```

### 2. Stream Large Documents

```typescript
// For very large documents
const streamOptions = {
  streamProcessing: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  maxMemoryUsage: '256MB',
};
```

### 3. Selective Plugin Loading

```typescript
// Load only needed plugins
const options = {
  plugins: document.needsHeaders
    ? ['remark-legal-headers', 'remark-field-tracking']
    : ['remark-field-tracking'],
};
```

## See Also

- [Field Tracking](field-tracking.md) - Detailed field tracking documentation
- [Performance Guide](performance.md) - Comprehensive performance optimization
- [Best Practices](../advanced/best-practices.md) - General best practices
- [Configuration](../advanced/configuration.md) - Configuration options
