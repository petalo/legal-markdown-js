# Field Tracking

Comprehensive field tracking and highlighting system for Legal Markdown JS,
providing visual indicators and detailed reports for template variable usage and
document completeness.

## Table of Contents

- [Overview](#overview)
- [Tracking Modes](#tracking-modes)
- [Output Format Behavior](#output-format-behavior)
- [Configuration Options](#configuration-options)
- [Field Highlighting](#field-highlighting)
- [Field Reports](#field-reports)
- [CLI Usage](#cli-usage)
- [Programmatic Usage](#programmatic-usage)
- [Legacy vs Modern Modes](#legacy-vs-modern-modes)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Field tracking in Legal Markdown JS provides comprehensive visibility into
template variable usage, helping identify missing data, validate document
completeness, and facilitate document review workflows. The system offers
different tracking modes optimized for various output formats and use cases.

### Key Features

- **Visual highlighting** - Color-coded indicators for different field states
- **Detailed reporting** - Comprehensive field usage statistics
- **Format-specific behavior** - Optimized tracking for markdown, HTML, and PDF
- **Legacy compatibility** - Maintains Ruby LegalMarkdown compatibility
- **AST-based accuracy** - Precise field detection with remark processing

## Tracking Modes

### Modern Mode (Default)

Advanced tracking with AST-based field detection:

```typescript
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';

const result = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
});
```

**Features:**

- AST-based field detection prevents false positives
- Format-aware tracking behavior
- Enhanced field reporting
- Double-wrapping prevention

### Legacy Mode

Compatible with original Ruby LegalMarkdown behavior:

```typescript
import { processLegalMarkdown } from 'legal-markdown-js';

const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
  enableFieldTrackingInMarkdown: true, // Required for markdown output
});
```

**Features:**

- Text-based field detection
- Ruby-compatible behavior
- Simple tracking mechanism
- Backward compatibility

## Output Format Behavior

Field tracking behavior differs based on the target output format to optimize
the experience for each use case.

### Markdown Output

**Default Behavior:** Clean output (tracking disabled)

- Maintains compatibility with Ruby LegalMarkdown
- Produces clean markdown suitable for further processing
- No HTML spans or tracking markup

**Enabled Behavior:** Tracking with HTML spans

```bash
# Enable tracking in markdown output
legal-md --enable-field-tracking document.md output.md
```

```markdown
<!-- Input -->

Client: {{client_name}} Amount: {{formatCurrency(amount, "EUR")}}

<!-- Output with tracking enabled -->

Client: <span class="field-tracking" data-field="client_name">Acme Corp</span>
Amount:
<span class="field-tracking" data-field="amount" data-helper="formatCurrency">1,234.56
€</span>
```

### HTML Output

**Default Behavior:** Automatic tracking when highlighting enabled

```bash
# HTML generation with field tracking
legal-md --html --highlight document.md
```

**Features:**

- Visual color-coded highlighting
- CSS classes for styling
- Data attributes for analysis
- Responsive design support

### PDF Output

**Default Behavior:** Automatic tracking when highlighting enabled

```bash
# PDF generation with field tracking
legal-md --pdf --highlight document.md
```

**Features:**

- Print-optimized highlighting
- Professional styling
- Header/footer preservation
- High-quality field indicators

## Configuration Options

### Basic Configuration

```typescript
// Enable tracking for all formats
const basicOptions = {
  enableFieldTracking: true,
};

// Enable tracking for markdown output specifically
const markdownOptions = {
  enableFieldTracking: true,
  enableFieldTrackingInMarkdown: true,
};
```

### Advanced Configuration

```typescript
const advancedOptions = {
  // Core tracking settings
  enableFieldTracking: true,
  enableFieldTrackingInMarkdown: false, // Ruby compatibility

  // Tracking behavior
  trackHelpers: true, // Track helper function calls
  trackConditionals: true, // Track conditional expressions
  trackImports: true, // Track imported content

  // Reporting options
  generateFieldReport: true,
  includeFieldPositions: true,
  reportFormat: 'detailed', // 'simple', 'detailed', 'json'

  // Styling options
  highlightClass: 'field-tracking',
  includeDataAttributes: true,
  preventDoubleWrapping: true,

  // Performance options
  batchFieldProcessing: true,
  cacheFieldResults: true,
};
```

### Environment Variables

```bash
# Global field tracking settings
LEGAL_MD_FIELD_TRACKING=true
LEGAL_MD_FIELD_TRACKING_MARKDOWN=false
LEGAL_MD_HIGHLIGHT_CLASS=custom-tracking
LEGAL_MD_FIELD_REPORT=detailed
```

## Field Highlighting

Visual indicators provide immediate feedback on field status and completeness.

### Highlight Colors

The system uses color-coded highlighting to indicate field states:

| Color      | Class            | Description                              | Use Case       |
| ---------- | ---------------- | ---------------------------------------- | -------------- |
| **Blue**   | `imported-value` | Successfully filled fields               | Completed data |
| **Red**    | `missing-value`  | Required fields without values           | Missing data   |
| **Yellow** | `highlight`      | Conditional logic or complex expressions | Review needed  |

### CSS Classes

Default styling for field highlighting:

```css
/* Successfully filled fields */
.imported-value {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Missing required fields */
.missing-value {
  background-color: #ffebee;
  border: 1px solid #f44336;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Conditional or complex expressions */
.highlight {
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Generic field tracking */
.field-tracking {
  position: relative;
  display: inline;
}

/* Data attribute styling */
.field-tracking[data-helper]::after {
  content: ' [' attr(data-helper) ']';
  font-size: 0.8em;
  opacity: 0.7;
}
```

### Custom Styling

Override default styles for branded documents:

```css
/* Corporate styling */
.field-tracking.corporate {
  background-color: #f5f5f5;
  border-bottom: 2px solid #1976d2;
  padding: 1px 2px;
  border-radius: 0;
}

/* Legal document styling */
.field-tracking.legal {
  background-color: transparent;
  border-bottom: 1px dashed #666;
  font-weight: bold;
}

/* Review mode styling */
.field-tracking.review {
  background-color: #fffacd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 1px;
}
```

### HTML Structure

Field tracking generates semantic HTML with data attributes:

```html
<!-- Simple field -->
<span
  class="field-tracking imported-value"
  data-field="client_name"
  data-type="string"
  >Acme Corporation</span
>

<!-- Field with helper -->
<span
  class="field-tracking highlight"
  data-field="amount"
  data-helper="formatCurrency"
  data-params='["EUR", 2]'
  >1,234.56 €</span
>

<!-- Conditional field -->
<span
  class="field-tracking highlight"
  data-field="warranty_clause"
  data-condition="hasWarranty"
  data-type="conditional"
  >Extended warranty applies</span
>

<!-- Missing field -->
<span
  class="field-tracking missing-value"
  data-field="missing_data"
  data-required="true"
  >{{missing_data}}</span
>
```

## Field Reports

Comprehensive reporting provides detailed insights into field usage and document
completeness.

### Report Structure

```typescript
interface FieldReport {
  total: number; // Total fields detected
  filled: number; // Fields with values
  empty: number; // Fields without values
  logic: number; // Conditional/logic fields
  helpers: number; // Helper function calls
  imports: number; // Imported fields
  completion: number; // Completion percentage
  fields: FieldDetail[]; // Detailed field information
}

interface FieldDetail {
  name: string; // Field name
  status: 'filled' | 'empty' | 'logic' | 'helper';
  value?: any; // Field value
  type?: string; // Data type
  position?: Position; // Location in document
  helper?: string; // Helper function name
  condition?: string; // Conditional expression
  source?: string; // Data source (yaml, import, etc.)
}
```

### Basic Report Example

```typescript
const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
});

console.log(result.fieldReport);
// {
//   total: 15,
//   filled: 12,
//   empty: 2,
//   logic: 1,
//   helpers: 8,
//   imports: 3,
//   completion: 80,
//   fields: [
//     {
//       name: 'client_name',
//       status: 'filled',
//       value: 'Acme Corp',
//       type: 'string',
//       source: 'yaml'
//     },
//     {
//       name: 'contract_amount',
//       status: 'helper',
//       value: '50,000.00 €',
//       helper: 'formatCurrency',
//       source: 'yaml'
//     },
//     {
//       name: 'optional_clause',
//       status: 'empty',
//       value: undefined,
//       type: 'string',
//       source: 'yaml'
//     }
//   ]
// }
```

### Detailed Report with Positions

```typescript
const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
  includeFieldPositions: true,
  reportFormat: 'detailed',
});

console.log(result.fieldReport.fields[0]);
// {
//   name: 'client_name',
//   status: 'filled',
//   value: 'Acme Corporation',
//   type: 'string',
//   position: {
//     start: { line: 5, column: 12 },
//     end: { line: 5, column: 25 }
//   },
//   occurrences: 3,
//   firstUsage: { line: 5, column: 12 },
//   lastUsage: { line: 28, column: 45 },
//   context: 'This agreement is made with {{client_name}} for...'
// }
```

### Report Analysis

```typescript
// Analyze field completion
function analyzeFields(report: FieldReport) {
  const completionRate = (report.filled / report.total) * 100;
  const missingFields = report.fields.filter(f => f.status === 'empty');
  const criticalFields = missingFields.filter(f => f.name.includes('required'));

  return {
    readyForProduction: completionRate === 100,
    needsReview: completionRate < 90,
    missingRequired: criticalFields.length > 0,
    suggestions: generateSuggestions(report),
  };
}

function generateSuggestions(report: FieldReport): string[] {
  const suggestions = [];

  if (report.empty > 0) {
    suggestions.push(`${report.empty} fields need values`);
  }

  if (report.logic > report.total * 0.3) {
    suggestions.push('High number of conditional fields - review logic');
  }

  return suggestions;
}
```

## CLI Usage

### Basic Field Tracking

```bash
# Enable field tracking in markdown output
legal-md --enable-field-tracking contract.md reviewed-contract.md

# Generate HTML with automatic field tracking
legal-md --html --highlight contract.md contract.html

# Generate PDF with automatic field tracking
legal-md --pdf --highlight contract.md contract.pdf
```

### Advanced CLI Options

```bash
# Field tracking with metadata export
legal-md --enable-field-tracking --export-json contract.md processed-contract.md

# Custom highlight class
legal-md --html --highlight --css-class="custom-tracking" contract.md

# Debug field tracking
legal-md --debug --enable-field-tracking --log-level verbose contract.md

# Batch processing with field tracking
legal-md --enable-field-tracking --batch ./contracts/*.md ./output/
```

### Field Report Generation

```bash
# Generate field report only
legal-md --field-report-only contract.md > field-report.json

# Include field report in metadata
legal-md --export-json --include-field-report contract.md

# Detailed field report with positions
legal-md --field-report detailed --include-positions contract.md
```

## Programmatic Usage

### TypeScript Integration

```typescript
import { processLegalMarkdown, FieldReport } from 'legal-markdown-js';

async function processWithTracking(content: string): Promise<{
  content: string;
  report: FieldReport;
  recommendations: string[];
}> {
  const result = processLegalMarkdown(content, {
    enableFieldTracking: true,
    includeFieldPositions: true,
    reportFormat: 'detailed',
  });

  const analysis = analyzeFieldCompleteness(result.fieldReport);

  return {
    content: result.content,
    report: result.fieldReport,
    recommendations: analysis.recommendations,
  };
}

function analyzeFieldCompleteness(report: FieldReport) {
  const completionRate = (report.filled / report.total) * 100;
  const recommendations = [];

  if (completionRate < 100) {
    const missingFields = report.fields
      .filter(f => f.status === 'empty')
      .map(f => f.name);

    recommendations.push(
      `Complete missing fields: ${missingFields.join(', ')}`
    );
  }

  if (report.logic > 5) {
    recommendations.push('Review conditional logic for complexity');
  }

  return { completionRate, recommendations };
}
```

### React Integration

```typescript
import React, { useState, useEffect } from 'react';
import { processLegalMarkdown } from 'legal-markdown-js';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function DocumentEditor({ content, onChange }: DocumentEditorProps) {
  const [fieldReport, setFieldReport] = useState<FieldReport | null>(null);
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    const processDocument = async () => {
      const result = processLegalMarkdown(content, {
        enableFieldTracking: true,
        outputFormat: 'html'
      });

      setProcessedContent(result.content);
      setFieldReport(result.fieldReport);
    };

    processDocument();
  }, [content]);

  return (
    <div className="document-editor">
      <div className="editor-panel">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="preview-panel">
        <div
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>

      <div className="field-report-panel">
        {fieldReport && (
          <FieldReportComponent report={fieldReport} />
        )}
      </div>
    </div>
  );
}
```

## Legacy vs Modern Modes

### Legacy Mode (Ruby Compatible)

Maintains compatibility with original Ruby LegalMarkdown:

```typescript
// Legacy behavior
const legacyOptions = {
  enableFieldTracking: false, // Disabled by default
  enableFieldTrackingInMarkdown: false, // Must explicitly enable
  legacyCompatible: true,
  simpleFieldDetection: true,
};
```

**Characteristics:**

- Field tracking disabled by default for markdown
- Text-based field detection
- Simple HTML span generation
- Ruby LegalMarkdown compatibility

### Modern Mode (Enhanced)

Advanced field tracking with AST-based processing:

```typescript
// Modern behavior
const modernOptions = {
  enableFieldTracking: true, // Enabled by default
  useAST: true, // AST-based detection
  preventDoubleWrapping: true, // Enhanced accuracy
  smartFieldDetection: true, // Context-aware
  enhancedReporting: true, // Detailed reports
};
```

**Characteristics:**

- Intelligent field detection
- Context-aware processing
- Advanced reporting capabilities
- Performance optimizations

### Migration Path

```typescript
// Step 1: Enable modern processing
const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
  modernMode: true, // Enable modern features
  legacyFallback: true, // Fallback for compatibility
});

// Step 2: Gradually adopt AST processing
const remarkResult = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
});

// Step 3: Full modern mode
const fullModernResult = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
  useAdvancedFeatures: true,
  optimizePerformance: true,
});
```

## Troubleshooting

### Common Issues

**Field tracking not visible in markdown output:**

```bash
# Solution: Explicitly enable tracking
legal-md --enable-field-tracking document.md output.md
```

**Double-wrapped fields in HTML:**

```typescript
// Solution: Enable double-wrapping prevention
const options = {
  enableFieldTracking: true,
  preventDoubleWrapping: true,
};
```

**Incorrect field detection:**

```typescript
// Solution: Use AST-based processing
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';

const result = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
});
```

**Performance issues with large documents:**

```typescript
// Solution: Enable performance optimizations
const options = {
  enableFieldTracking: true,
  batchFieldProcessing: true,
  cacheFieldResults: true,
  streamProcessing: true,
};
```

### Debug Mode

```bash
# Enable field tracking debugging
legal-md --debug --enable-field-tracking --log-level verbose document.md

# Trace field detection
legal-md --trace-fields --enable-field-tracking document.md

# Export debug information
legal-md --debug-fields --export-debug-info document.md
```

### Field Detection Issues

```typescript
// Debug field detection
const result = processLegalMarkdown(content, {
  enableFieldTracking: true,
  debugFields: true,
  logFieldDetection: true,
  validateFieldSyntax: true,
});

// Check for undetected fields
result.debugInfo.undetectedFields.forEach(field => {
  console.warn(`Undetected field: ${field.text} at ${field.position}`);
});
```

## Best Practices

### 1. Format-Specific Usage

```typescript
// Use appropriate tracking for each format
const markdownOptions = {
  enableFieldTracking: false, // Clean output
  generateFieldReport: true, // Still get reports
};

const htmlOptions = {
  enableFieldTracking: true, // Visual tracking
  includeHighlighting: true,
};

const pdfOptions = {
  enableFieldTracking: true, // Print-friendly tracking
  optimizeForPrint: true,
};
```

### 2. Development vs Production

```typescript
// Development configuration
const devOptions = {
  enableFieldTracking: true,
  includeFieldPositions: true,
  reportFormat: 'detailed',
  debugFields: true,
};

// Production configuration
const prodOptions = {
  enableFieldTracking: false, // Clean output
  generateFieldReport: true, // For monitoring
  reportFormat: 'simple',
};
```

### 3. Review Workflow

```typescript
// Stage 1: Development with full tracking
const devResult = processLegalMarkdown(content, {
  enableFieldTracking: true,
  includeFieldPositions: true,
});

// Stage 2: Review with highlighting
const reviewResult = processLegalMarkdown(content, {
  enableFieldTracking: true,
  outputFormat: 'html',
  includeHighlighting: true,
});

// Stage 3: Production without tracking
const prodResult = processLegalMarkdown(content, {
  enableFieldTracking: false,
  validateCompleteness: true,
});
```

### 4. Performance Optimization

```typescript
// Optimize field tracking performance
const optimizedOptions = {
  enableFieldTracking: true,
  batchFieldProcessing: true,
  cacheFieldResults: true,
  limitFieldLookback: 1000, // Limit search scope
  enableFieldIndexing: true, // Index fields for faster lookup
};
```

### 5. Custom Styling

```css
/* Professional document styling */
.field-tracking.professional {
  background: none;
  border-bottom: 1px solid #ccc;
  transition: all 0.2s ease;
}

.field-tracking.professional:hover {
  background-color: #f5f5f5;
  border-bottom-color: #007acc;
}

/* Review mode styling */
.field-tracking.review {
  position: relative;
  background-color: rgba(255, 255, 0, 0.1);
  border-radius: 2px;
}

.field-tracking.review::before {
  content: attr(data-field);
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}
```

## See Also

- [Remark Processing](remark-processing.md) - AST-based field detection
- [Performance Guide](performance.md) - Optimization strategies
- [Field Highlighting](../output/field-highlighting.md) - Visual highlighting
  details
- [Best Practices](../advanced/best-practices.md) - Document development
  guidelines
