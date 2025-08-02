# Field Highlighting

Visual indicators for template fields in HTML and PDF output that help identify
field status, missing data, and conditional logic during document review.

## Table of Contents

- [Overview](#overview)
- [Highlight Colors](#highlight-colors)
- [CSS Classes](#css-classes)
- [Field Tracking Report](#field-tracking-report)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Field highlighting provides visual feedback about template variable processing,
making it easy to:

- **Identify filled fields** - Variables that were successfully populated
- **Spot missing data** - Required fields without values
- **Track conditional logic** - Fields with complex expressions or mixins
- **Review document completeness** - Visual audit of template processing

### How It Works

When highlighting is enabled, Legal Markdown wraps processed variables with CSS
classes that provide visual indicators:

```markdown
<!-- Input template -->

**Client:** {{client_name}} **Amount:** {{formatCurrency(amount, "USD")}} **Due
Date:** {{missing_field}}

<!-- Output with highlighting -->

**Client:** <span class="imported-value">Acme Corporation</span> **Amount:**
<span class="highlight">$25,000.00</span> **Due Date:**
<span class="missing-value">{{missing_field}}</span>
```

## Highlight Colors

### Color Coding System

| Color      | CSS Class        | Meaning             | Description                           |
| ---------- | ---------------- | ------------------- | ------------------------------------- |
| **Blue**   | `imported-value` | Successfully filled | Fields populated from YAML data       |
| **Red**    | `missing-value`  | Missing data        | Required fields without values        |
| **Yellow** | `highlight`      | Complex processing  | Fields with helpers, logic, or mixins |

### Visual Indicators

- **Blue background**: Field was successfully filled from YAML frontmatter
- **Red background**: Field name appears in output (data missing)
- **Yellow background**: Field processed with helpers or conditional logic

## CSS Classes

### Default Styling

```css
.imported-value {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  padding: 2px 4px;
  border-radius: 3px;
  color: #1976d2;
}

.missing-value {
  background-color: #ffebee;
  border: 1px solid #f44336;
  padding: 2px 4px;
  border-radius: 3px;
  color: #d32f2f;
}

.highlight {
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  padding: 2px 4px;
  border-radius: 3px;
  color: #f57c00;
}
```

### Custom Styling

Override default styles for your brand:

```css
/* Custom highlighting styles */
.imported-value {
  background-color: #e8f5e8;
  border: 2px solid #4caf50;
  padding: 3px 6px;
  border-radius: 5px;
  font-weight: bold;
}

.missing-value {
  background-color: #ffe6e6;
  border: 2px dashed #ff5722;
  padding: 3px 6px;
  border-radius: 5px;
  animation: pulse 2s infinite;
}

.highlight {
  background-color: #fff9c4;
  border: 1px solid #fbc02d;
  padding: 3px 6px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(251, 192, 45, 0.3);
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
```

### Print-Friendly Styles

```css
@media print {
  .imported-value,
  .missing-value,
  .highlight {
    background-color: transparent !important;
    border: 1px solid #333 !important;
    color: inherit !important;
  }

  .missing-value::after {
    content: ' [MISSING]';
    font-weight: bold;
  }
}
```

## Field Tracking Report

### Programmatic Access

```typescript
import { processLegalMarkdown } from 'legal-markdown-js';

// For HTML/PDF output (automatic field tracking)
const result = processLegalMarkdown(content, {
  enableFieldTracking: true, // Always enabled for HTML/PDF
  outputFormat: 'html',
});

console.log(result.fieldReport);
// {
//   total: 15,
//   filled: 12,
//   empty: 2,
//   logic: 1,
//   fields: [
//     { name: 'title', status: 'filled', value: 'Contract' },
//     { name: 'client.name', status: 'empty', value: undefined },
//     { name: 'hasWarranty', status: 'logic', value: true }
//   ]
// }
```

### Field Report Structure

```typescript
interface FieldReport {
  total: number; // Total fields processed
  filled: number; // Successfully filled fields
  empty: number; // Missing/empty fields
  logic: number; // Fields with complex logic
  fields: Field[]; // Detailed field information
}

interface Field {
  name: string; // Field name (e.g., 'client.name')
  status: 'filled' | 'empty' | 'logic';
  value: any; // Resolved value or undefined
  location?: string; // Source location in document
  type?: string; // Data type
}
```

### Report Analysis

```typescript
function analyzeFieldReport(report) {
  const completeness = (report.filled / report.total) * 100;

  console.log(`Document Completeness: ${completeness.toFixed(1)}%`);
  console.log(`Fields Filled: ${report.filled}/${report.total}`);
  console.log(`Missing Fields: ${report.empty}`);
  console.log(`Complex Fields: ${report.logic}`);

  // Find missing fields
  const missingFields = report.fields.filter(f => f.status === 'empty');
  if (missingFields.length > 0) {
    console.log('\nMissing Fields:');
    missingFields.forEach(field => {
      console.log(`- ${field.name}`);
    });
  }
}
```

## Configuration

### CLI Usage

```bash
# Enable highlighting in HTML output
legal-md document.md --html --highlight

# Enable highlighting in PDF output
legal-md document.md --pdf --highlight

# Enable field tracking in markdown output (legacy mode)
legal-md document.md --enable-field-tracking
```

### Programmatic Configuration

```typescript
// HTML/PDF with highlighting
const result = processLegalMarkdown(content, {
  outputFormat: 'html',
  enableFieldTracking: true,
  highlightFields: true,
});

// Markdown with field tracking (legacy mode)
const result = processLegalMarkdown(content, {
  outputFormat: 'markdown',
  enableFieldTrackingInMarkdown: true,
});

// Custom highlighting options
const result = processLegalMarkdown(content, {
  outputFormat: 'html',
  enableFieldTracking: true,
  highlightingOptions: {
    showTooltips: true,
    includeFieldNames: true,
    customClasses: {
      filled: 'my-filled-class',
      missing: 'my-missing-class',
      logic: 'my-logic-class',
    },
  },
});
```

### Field Tracking Behavior

| Output Format | Default Behavior                    | Enable Flag               |
| ------------- | ----------------------------------- | ------------------------- |
| **Markdown**  | Clean output (no tracking)          | `--enable-field-tracking` |
| **HTML**      | Tracking enabled with `--highlight` | `--highlight`             |
| **PDF**       | Tracking enabled with `--highlight` | `--highlight`             |

## Examples

### Contract Review

```yaml
---
title: 'Service Agreement'
client:
  name: 'Acme Corporation'
  # Missing: email, address
effective_date: '@today'
amount: 50000
# Missing: payment_terms
warranty_included: true
---
```

```markdown
# {{title}}

**Client:** {{client.name}} **Email:** {{client.email}} **Address:**
{{client.address}}

**Effective Date:** {{formatDate(effective_date, "MMMM Do, YYYY")}} **Amount:**
{{formatCurrency(amount, "USD")}} **Payment Terms:** {{payment_terms}}

{{#if warranty_included}} **Warranty:** Included as per terms {{/if}}
```

**Highlighted Output:**

- **Blue**: `title`, `client.name`, `effective_date`, `amount`,
  `warranty_included`
- **Red**: `client.email`, `client.address`, `payment_terms`
- **Yellow**: `formatDate(...)`, `formatCurrency(...)`, conditional warranty

### Invoice Template

```typescript
const invoiceResult = processLegalMarkdown(invoiceTemplate, {
  outputFormat: 'html',
  enableFieldTracking: true,
  data: {
    invoice_number: 'INV-2025-001',
    client_name: 'Acme Corp',
    // Missing: due_date, items
    tax_rate: 0.08,
  },
});

// Check completeness
const report = invoiceResult.fieldReport;
if (report.empty > 0) {
  console.warn(`Invoice incomplete: ${report.empty} missing fields`);
}
```

### Document Validation

```typescript
function validateDocument(content, requiredFields) {
  const result = processLegalMarkdown(content, {
    enableFieldTracking: true,
    outputFormat: 'html',
  });

  const missingRequired = requiredFields.filter(
    field =>
      !result.fieldReport.fields.find(
        f => f.name === field && f.status === 'filled'
      )
  );

  if (missingRequired.length > 0) {
    throw new Error(`Missing required fields: ${missingRequired.join(', ')}`);
  }

  return result;
}

// Usage
const requiredFields = ['client.name', 'amount', 'effective_date'];
const validatedResult = validateDocument(contractTemplate, requiredFields);
```

## Best Practices

### 1. Review Workflow

```typescript
// Step 1: Generate with highlighting
const draftResult = processLegalMarkdown(template, {
  outputFormat: 'html',
  enableFieldTracking: true,
  data: partialData,
});

// Step 2: Review field report
const report = draftResult.fieldReport;
console.log(`Document ${(report.filled / report.total) * 100}% complete`);

// Step 3: Address missing fields
const missingFields = report.fields
  .filter(f => f.status === 'empty')
  .map(f => f.name);

// Step 4: Generate final version
const finalData = { ...partialData, ...additionalData };
const finalResult = processLegalMarkdown(template, {
  outputFormat: 'pdf',
  enableFieldTracking: false, // Clean final output
  data: finalData,
});
```

### 2. Custom CSS Integration

```css
/* Brand-specific highlighting */
:root {
  --success-color: #2e7d32;
  --warning-color: #f57c00;
  --error-color: #c62828;
}

.imported-value {
  background-color: var(--success-color);
  color: white;
  font-weight: 500;
}

.missing-value {
  background-color: var(--error-color);
  color: white;
  position: relative;
}

.missing-value::after {
  content: '⚠';
  margin-left: 4px;
}

.highlight {
  background-color: var(--warning-color);
  color: white;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .imported-value {
    background-color: #1b5e20;
    border-color: #4caf50;
  }

  .missing-value {
    background-color: #b71c1c;
    border-color: #f44336;
  }

  .highlight {
    background-color: #e65100;
    border-color: #ff9800;
  }
}
```

### 3. Quality Assurance

```typescript
// QA checking function
function performQACheck(template, data) {
  const result = processLegalMarkdown(template, {
    enableFieldTracking: true,
    outputFormat: 'html',
    data,
  });

  const report = result.fieldReport;
  const issues = [];

  // Check for missing fields
  if (report.empty > 0) {
    issues.push(`${report.empty} missing fields`);
  }

  // Check completeness threshold
  const completeness = report.filled / report.total;
  if (completeness < 0.95) {
    issues.push(`Document only ${(completeness * 100).toFixed(1)}% complete`);
  }

  // Check for complex logic that might need review
  const complexFields = report.fields.filter(f => f.status === 'logic');
  if (complexFields.length > 5) {
    issues.push(`${complexFields.length} fields use complex logic`);
  }

  return {
    passed: issues.length === 0,
    issues,
    report,
  };
}
```

### 4. Automated Testing

```typescript
// Test highlighting functionality
describe('Field Highlighting', () => {
  test('highlights missing fields', () => {
    const template = '**Client:** {{client_name}}';
    const result = processLegalMarkdown(template, {
      enableFieldTracking: true,
      outputFormat: 'html',
      data: {}, // No data provided
    });

    expect(result.html).toContain('class="missing-value"');
    expect(result.fieldReport.empty).toBe(1);
  });

  test('highlights filled fields', () => {
    const template = '**Client:** {{client_name}}';
    const result = processLegalMarkdown(template, {
      enableFieldTracking: true,
      outputFormat: 'html',
      data: { client_name: 'Acme Corp' },
    });

    expect(result.html).toContain('class="imported-value"');
    expect(result.fieldReport.filled).toBe(1);
  });
});
```

### 5. Integration with CI/CD

```typescript
// CI/CD quality gate
function checkDocumentQuality(templatePath, dataPath) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const result = processLegalMarkdown(template, {
    enableFieldTracking: true,
    outputFormat: 'html',
    data,
  });

  const completeness = result.fieldReport.filled / result.fieldReport.total;

  if (completeness < 0.9) {
    throw new Error(
      `Document completeness ${(completeness * 100).toFixed(1)}% below required 90%`
    );
  }

  console.log(
    `✅ Document quality check passed (${(completeness * 100).toFixed(1)}% complete)`
  );
}
```

## Troubleshooting

### Common Issues

**Highlighting not appearing:**

- Verify `--highlight` flag is used
- Check CSS classes are properly loaded
- Ensure field tracking is enabled

**Incorrect field status:**

- Check YAML frontmatter syntax
- Verify variable names match exactly
- Test with simple variables first

**Performance with large documents:**

- Consider disabling highlighting for final production output
- Use field tracking only during development/review

### Debug Mode

```typescript
// Enable debug information
const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
  debug: true,
  outputFormat: 'html',
});

console.log('Field processing details:', result.debug.fieldProcessing);
```

## See Also

- [PDF Generation](pdf-generation.md) - Highlighting in PDF output
- [HTML Generation](html-generation.md) - Highlighting in HTML output
- [CSS Classes](css-classes.md) - Complete CSS reference
- [Field Tracking](../processing/field-tracking.md) - Technical implementation
  details
