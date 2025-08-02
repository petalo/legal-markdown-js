# Error Handling

Comprehensive error handling strategies for Legal Markdown processing, including
graceful failures, debugging techniques, and recovery mechanisms.

## Table of Contents

- [Overview](#overview)
- [Error Types](#error-types)
- [Graceful Failures](#graceful-failures)
- [Error Configuration](#error-configuration)
- [Debugging Strategies](#debugging-strategies)
- [Recovery Mechanisms](#recovery-mechanisms)
- [Best Practices](#best-practices)
- [Troubleshooting Guide](#troubleshooting-guide)

## Overview

Legal Markdown JS implements a robust error handling system designed to:

- **Fail gracefully** - Continue processing despite errors when possible
- **Provide clear feedback** - Detailed error messages and context
- **Enable debugging** - Comprehensive logging and diagnostic tools
- **Support recovery** - Mechanisms to handle and retry failed operations
- **Maintain data integrity** - Prevent corruption during error conditions

## Error Types

### Processing Errors

#### YAML Parse Errors

```typescript
try {
  const result = processLegalMarkdown(content, {
    throwOnYamlError: true,
    enableFieldTracking: true,
  });
} catch (error) {
  if (error.code === 'YAML_PARSE_ERROR') {
    console.error('Invalid YAML:', error.message);
    console.error('Line:', error.line);
    console.error('Column:', error.column);
  }
}
```

**Common YAML errors:**

- Invalid syntax (missing quotes, incorrect indentation)
- Duplicate keys
- Invalid escape sequences
- Circular references

#### Template Processing Errors

```typescript
interface TemplateError {
  code: 'TEMPLATE_ERROR' | 'VARIABLE_ERROR' | 'HELPER_ERROR';
  message: string;
  variable?: string;
  helper?: string;
  line?: number;
  column?: number;
  context?: string;
}

try {
  const result = processLegalMarkdown(content);
} catch (error) {
  if (error.code === 'TEMPLATE_ERROR') {
    console.error(`Template error: ${error.message}`);
    console.error(`Variable: ${error.variable}`);
    console.error(`Context: ${error.context}`);
  }
}
```

#### Helper Function Errors

```typescript
// Helper errors are handled gracefully by default
const content = `
Date: {{formatDate(invalid_date, "DD/MM/YYYY")}}
Price: {{formatCurrency(invalid_number, "EUR")}}
Result: {{unknownHelper(value)}}
`;

const result = processLegalMarkdown(content);
// Output preserves original values for invalid inputs:
// Date: invalid_date
// Price: invalid_number
// Result: {{unknownHelper(value)}}
```

### File System Errors

#### File Access Errors

```typescript
try {
  const result = await processFile('./non-existent.md');
} catch (error) {
  switch (error.code) {
    case 'ENOENT':
      console.error('File not found:', error.path);
      break;
    case 'EACCES':
      console.error('Permission denied:', error.path);
      break;
    case 'EISDIR':
      console.error('Expected file, got directory:', error.path);
      break;
  }
}
```

#### Import/Include Errors

```typescript
// Handle missing imported files
const result = processLegalMarkdown(content, {
  onImportError: (importPath, error) => {
    console.warn(`Failed to import ${importPath}: ${error.message}`);
    return '<!-- Import failed: ' + importPath + ' -->';
  },
  continueOnImportError: true,
});
```

### Output Generation Errors

#### PDF Generation Errors

```typescript
try {
  const pdf = await generatePdf(content, 'output.pdf', options);
} catch (error) {
  switch (error.code) {
    case 'LOGO_NOT_FOUND':
      console.warn('Logo file not found, generating without logo');
      // Retry without logo
      const pdfWithoutLogo = await generatePdf(content, 'output.pdf', {
        ...options,
        cssPath: undefined,
      });
      break;
    case 'CSS_PARSE_ERROR':
      console.error('CSS parsing failed:', error.message);
      break;
    case 'MEMORY_LIMIT_EXCEEDED':
      console.error('PDF generation requires too much memory');
      break;
  }
}
```

#### HTML Generation Errors

```typescript
try {
  const html = await generateHtml(content, options);
} catch (error) {
  if (error.code === 'TEMPLATE_NOT_FOUND') {
    console.warn('Custom template not found, using default');
    const defaultHtml = await generateHtml(content, {
      ...options,
      customTemplate: undefined,
    });
  }
}
```

## Graceful Failures

### Helper Function Fallbacks

Legal Markdown helpers are designed to handle errors gracefully:

```markdown
<!-- Invalid date input -->

Date: {{formatDate(invalid_date, "DD/MM/YYYY")}}

<!-- Output: Date: invalid_date -->

<!-- Invalid number input -->

Price: {{formatCurrency(invalid_number, "EUR")}}

<!-- Output: Price: invalid_number -->

<!-- Unknown helper function -->

Result: {{unknownHelper(value)}}

<!-- Output: Result: {{unknownHelper(value)}} -->

<!-- Type conversion errors -->

Count: {{formatInteger("not-a-number")}}

<!-- Output: Count: not-a-number -->
```

### Partial Processing Success

```typescript
const result = processLegalMarkdown(content, {
  continueOnError: true,
  collectErrors: true,
});

if (result.errors.length > 0) {
  console.log(`Processing completed with ${result.errors.length} errors:`);
  result.errors.forEach(error => {
    console.error(`- ${error.type}: ${error.message}`);
  });
}

// Document is still generated with available data
console.log('Generated content length:', result.content.length);
```

### Fallback Content

```typescript
const result = processLegalMarkdown(content, {
  // Provide fallback values for missing variables
  fallbackValues: {
    client_name: '[Client Name Required]',
    contract_date: '[Date Required]',
    amount: '[Amount Required]',
  },

  // Use placeholders for missing imports
  importFallback: importPath => {
    return `<!-- Content from ${importPath} not available -->`;
  },
});
```

## Error Configuration

### Error Handling Options

```typescript
interface ErrorHandlingOptions {
  // Throw errors vs collect them
  throwOnYamlError?: boolean;
  throwOnTemplateError?: boolean;
  throwOnImportError?: boolean;

  // Continue processing despite errors
  continueOnError?: boolean;
  continueOnImportError?: boolean;
  continueOnHelperError?: boolean;

  // Error collection and reporting
  collectErrors?: boolean;
  logErrors?: boolean;
  errorLogLevel?: 'error' | 'warn' | 'info' | 'debug';

  // Fallback behaviors
  fallbackValues?: Record<string, any>;
  importFallback?: (path: string) => string;
  helperFallback?: (helper: string, args: any[]) => any;
}

const result = processLegalMarkdown(content, {
  throwOnYamlError: false,
  continueOnError: true,
  collectErrors: true,
  logErrors: true,
  errorLogLevel: 'warn',

  fallbackValues: {
    client_name: '[CLIENT NAME REQUIRED]',
    effective_date: '[DATE REQUIRED]',
  },
});
```

### Development vs Production Settings

```typescript
// Development configuration
const devConfig = {
  throwOnYamlError: true, // Fail fast in development
  throwOnTemplateError: true,
  continueOnError: false,
  logErrors: true,
  errorLogLevel: 'debug',
};

// Production configuration
const prodConfig = {
  throwOnYamlError: false, // Continue processing in production
  throwOnTemplateError: false,
  continueOnError: true,
  collectErrors: true,
  logErrors: true,
  errorLogLevel: 'error',

  fallbackValues: {
    // Provide meaningful defaults
    client_name: '[CLIENT NAME PENDING]',
    effective_date: '[DATE TO BE DETERMINED]',
  },
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
```

## Debugging Strategies

### Debug Mode

```bash
# Enable comprehensive debugging
legal-md --debug document.md output.md

# Debug specific components
legal-md --debug-yaml --debug-templates document.md output.md

# Verbose logging
legal-md --log-level debug document.md output.md
```

### Programmatic Debugging

```typescript
const result = processLegalMarkdown(content, {
  debug: true,
  debugOptions: {
    traceVariables: true,
    traceHelpers: true,
    traceImports: true,
    traceErrors: true,
  },
});

// Examine debug information
console.log('Variables processed:', result.debug.variables);
console.log('Helpers called:', result.debug.helpers);
console.log('Files imported:', result.debug.imports);
console.log('Errors encountered:', result.debug.errors);
```

### Step-by-Step Debugging

```typescript
// Debug individual processing steps
async function debugProcessing(content: string) {
  try {
    // Step 1: Parse YAML
    console.log('1. Parsing YAML frontmatter...');
    const yamlResult = parseYamlFrontmatter(content);
    console.log('✓ YAML parsed successfully');

    // Step 2: Process imports
    console.log('2. Processing imports...');
    const importResult = processImports(yamlResult.content);
    console.log('✓ Imports processed');

    // Step 3: Process variables
    console.log('3. Processing variables...');
    const variableResult = processVariables(importResult, yamlResult.data);
    console.log('✓ Variables processed');

    // Step 4: Process helpers
    console.log('4. Processing helpers...');
    const helperResult = processHelpers(variableResult);
    console.log('✓ Helpers processed');

    return helperResult;
  } catch (error) {
    console.error(`❌ Error in step: ${error.step}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}
```

### Error Context Capture

```typescript
const result = processLegalMarkdown(content, {
  captureContext: true,
  contextLines: 3, // Lines before/after error
});

result.errors.forEach(error => {
  console.error(`Error: ${error.message}`);
  console.error(`Location: Line ${error.line}, Column ${error.column}`);
  console.error('Context:');
  console.error(error.context);
});
```

## Recovery Mechanisms

### Automatic Retry

```typescript
async function processWithRetry(
  content: string,
  options: any,
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return processLegalMarkdown(content, options);
    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### Fallback Processing

```typescript
async function processWithFallback(content: string) {
  try {
    // Try full processing
    return processLegalMarkdown(content, {
      enableFieldTracking: true,
      includeHighlighting: true,
    });
  } catch (error) {
    console.warn('Full processing failed, trying basic processing...');

    try {
      // Fallback to basic processing
      return processLegalMarkdown(content, {
        enableFieldTracking: false,
        includeHighlighting: false,
        continueOnError: true,
      });
    } catch (fallbackError) {
      console.error('Basic processing also failed, returning minimal result');

      // Last resort: return raw content with error markers
      return {
        content: `<!-- Processing failed: ${error.message} -->\n${content}`,
        errors: [error, fallbackError],
      };
    }
  }
}
```

### Partial Recovery

```typescript
async function processWithPartialRecovery(content: string) {
  const sections = splitIntoSections(content);
  const results = [];
  const errors = [];

  for (const section of sections) {
    try {
      const result = processLegalMarkdown(section);
      results.push(result.content);
    } catch (error) {
      console.warn(`Section processing failed: ${error.message}`);
      errors.push(error);

      // Include section with error marker
      results.push(`<!-- Section error: ${error.message} -->\n${section}`);
    }
  }

  return {
    content: results.join('\n\n'),
    errors: errors,
  };
}
```

## Best Practices

### 1. Environment-Specific Error Handling

```typescript
class ErrorHandler {
  private isProduction = process.env.NODE_ENV === 'production';

  handleProcessingError(error: Error, content: string) {
    if (this.isProduction) {
      // Production: Log error but continue processing
      console.error('Processing error:', error.message);
      return this.generateFallbackContent(content, error);
    } else {
      // Development: Throw error for immediate attention
      throw error;
    }
  }

  private generateFallbackContent(content: string, error: Error) {
    return `<!-- Error: ${error.message} -->\n${content}`;
  }
}
```

### 2. Comprehensive Error Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'legal-markdown-errors.log' }),
  ],
});

const result = processLegalMarkdown(content, {
  onError: (error, context) => {
    logger.error('Legal Markdown processing error', {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
    });
  },
});
```

### 3. User-Friendly Error Messages

```typescript
function formatUserError(error: any): string {
  switch (error.code) {
    case 'YAML_PARSE_ERROR':
      return `Document configuration error at line ${error.line}: ${error.message}. Please check your document's front matter.`;

    case 'TEMPLATE_ERROR':
      return `Template processing error with variable "${error.variable}": ${error.message}. Please check your variable syntax.`;

    case 'FILE_NOT_FOUND':
      return `Could not find imported file "${error.path}". Please check the file path and ensure the file exists.`;

    default:
      return `An unexpected error occurred: ${error.message}. Please contact support if this continues.`;
  }
}
```

### 4. Progressive Error Handling

```typescript
async function progressiveProcessing(content: string) {
  const strategies = [
    // Strategy 1: Full featured processing
    () =>
      processLegalMarkdown(content, {
        enableFieldTracking: true,
        includeHighlighting: true,
        processImports: true,
      }),

    // Strategy 2: Basic processing without advanced features
    () =>
      processLegalMarkdown(content, {
        enableFieldTracking: false,
        includeHighlighting: false,
        processImports: true,
        continueOnError: true,
      }),

    // Strategy 3: Minimal processing
    () =>
      processLegalMarkdown(content, {
        enableFieldTracking: false,
        includeHighlighting: false,
        processImports: false,
        continueOnError: true,
      }),
  ];

  for (const [index, strategy] of strategies.entries()) {
    try {
      const result = await strategy();
      if (index > 0) {
        console.warn(
          `Processing succeeded with strategy ${index + 1} (reduced features)`
        );
      }
      return result;
    } catch (error) {
      console.warn(`Strategy ${index + 1} failed: ${error.message}`);
      if (index === strategies.length - 1) {
        throw new Error('All processing strategies failed');
      }
    }
  }
}
```

### 5. Error Recovery Testing

```typescript
// Test error scenarios
describe('Error Handling', () => {
  test('handles invalid YAML gracefully', () => {
    const invalidYaml = `---
title: "Test Document"
invalid: [unclosed array
---
Content here`;

    const result = processLegalMarkdown(invalidYaml, {
      continueOnError: true,
      collectErrors: true,
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('YAML_PARSE_ERROR');
    expect(result.content).toContain('Content here');
  });

  test('handles missing variables gracefully', () => {
    const template = 'Client: {{missing_variable}}';

    const result = processLegalMarkdown(template, {
      continueOnError: true,
      fallbackValues: {
        missing_variable: '[MISSING]',
      },
    });

    expect(result.content).toBe('Client: [MISSING]');
  });
});
```

## Troubleshooting Guide

### Common Error Scenarios

#### YAML Parsing Failures

**Symptoms:** Document won't process, YAML error messages **Causes:**

- Invalid YAML syntax
- Missing quotes around strings with special characters
- Incorrect indentation

**Solutions:**

```yaml
# ❌ Invalid
title: Contract for: Client

# ✅ Valid
title: "Contract for: Client"

# ❌ Invalid indentation
level-one: Article %n.
 level-two: Section %n.

# ✅ Valid indentation
level-one: Article %n.
level-two: Section %n.
```

#### Variable Processing Errors

**Symptoms:** Variables show as `{{variable_name}}` in output **Causes:**

- Variable not defined in YAML frontmatter
- Typo in variable name
- Incorrect variable syntax

**Solutions:**

```yaml
---
# Define all used variables
client_name: "Acme Corp"
effective_date: "@today"
---

# Use exact variable names
Client: {{client_name}}  # ✅ Correct
Client: {{clientName}}   # ❌ Wrong variable name
```

#### Helper Function Errors

**Symptoms:** Helper calls appear unchanged in output **Causes:**

- Unknown helper function
- Incorrect parameter types
- Helper syntax errors

**Solutions:**

```markdown
<!-- ✅ Correct helper usage -->

Date: {{formatDate(@today, "MMMM Do, YYYY")}} Amount:
{{formatCurrency(1000, "USD")}}

<!-- ❌ Common mistakes -->

Date: {{formatdate(@today, "MMMM Do, YYYY")}} <!-- Wrong case --> Amount:
{{formatCurrency("1000", "USD")}} <!-- String instead of number -->
```

### Diagnostic Commands

```bash
# Check document syntax
legal-md --validate document.md

# Debug specific issues
legal-md --debug --log-level debug document.md

# Test with minimal processing
legal-md --safe-mode document.md output.md

# Check helper functions
legal-md --test-helpers document.md
```

## See Also

- [Configuration](configuration.md) - Error handling configuration options
- [Best Practices](best-practices.md) - Error prevention strategies
- [Batch Processing](batch-processing.md) - Error handling in batch operations
- [Field Tracking](../processing/field-tracking.md) - Error detection through
  field tracking
