# Features Guide <!-- omit in toc -->

Comprehensive guide to all features and capabilities of Legal Markdown JS.

## Table of Contents <!-- omit in toc -->

- [Core Features](#core-features)
  - [YAML Front Matter](#yaml-front-matter)
  - [Headers and Numbering](#headers-and-numbering)
  - [Cross-References](#cross-references)
  - [Optional Clauses](#optional-clauses)
  - [Partial Imports](#partial-imports)
- [Mixins System](#mixins-system)
  - [Basic Variable Substitution](#basic-variable-substitution)
  - [Nested Object Access](#nested-object-access)
  - [Array Access](#array-access)
  - [Conditional Mixins](#conditional-mixins)
- [Template Loops](#template-loops)
  - [Array Iteration](#array-iteration)
  - [Conditional Blocks](#conditional-blocks)
  - [Nested Loops](#nested-loops)
- [Helper Functions](#helper-functions)
  - [Date Helpers](#date-helpers)
    - [Available Date Helpers](#available-date-helpers)
    - [Date Format Tokens](#date-format-tokens)
  - [Number Helpers](#number-helpers)
    - [Available Number Helpers](#available-number-helpers)
  - [String Helpers](#string-helpers)
    - [Available String Helpers](#available-string-helpers)
  - [Special Values](#special-values)
- [PDF Generation](#pdf-generation)
  - [Basic PDF Generation](#basic-pdf-generation)
  - [PDF with Highlighting](#pdf-with-highlighting)
  - [PDF with Custom CSS](#pdf-with-custom-css)
  - [PDF Options](#pdf-options)
  - [PDF with Logo Headers/Footers](#pdf-with-logo-headersfooters)
  - [Generate Both Versions](#generate-both-versions)
- [HTML Generation](#html-generation)
  - [Basic HTML Generation](#basic-html-generation)
  - [HTML with Field Highlighting](#html-with-field-highlighting)
  - [Custom HTML Template](#custom-html-template)
- [Field Highlighting](#field-highlighting)
  - [Highlight Colors](#highlight-colors)
  - [CSS Classes](#css-classes)
  - [Field Tracking Report](#field-tracking-report)
- [Batch Processing](#batch-processing)
  - [Batch Options](#batch-options)
- [Force Commands](#force-commands)
  - [Basic Usage](#basic-usage-2)
  - [Template Variables in Commands](#template-variables-in-commands)
  - [Security and Validation](#security-and-validation)
  - [Command Priority](#command-priority)
- [Advanced Features](#advanced-features)
  - [Custom Header Formats](#custom-header-formats)
  - [Multi-language Support](#multi-language-support)
  - [Jurisdiction-specific Templates](#jurisdiction-specific-templates)
  - [Error Handling](#error-handling)
- [Configuration](#configuration)
  - [Global Configuration](#global-configuration)
  - [Project Configuration](#project-configuration)
- [Best Practices](#best-practices)
  - [Document Structure](#document-structure)
  - [Template Organization](#template-organization)
  - [Performance Optimization](#performance-optimization)
  - [Quality Assurance](#quality-assurance)
  - [Security Considerations](#security-considerations)

## Core Features

### YAML Front Matter

Every legal document starts with YAML front matter containing metadata and
variables:

```yaml
---
title: Service Agreement
client:
  name: Acme Corporation
  contact: John Smith
  email: john@acme.com
provider:
  name: Professional Services LLC
  address: 123 Service St
effective_date: 2024-01-01
payment_terms: 30
confidentiality: true
---
```

### Headers and Numbering

Hierarchical numbering system for legal documents:

```markdown
l. Definitions ll. Software "Software" means the computer program licensed under
this Agreement.

ll. License "License" means the terms and conditions for use and distribution.

l. License Grant ll. Rights Granted Subject to the terms hereof, Licensor grants
Licensee a license to use the Software.

ll. Restrictions Licensee may not distribute, modify, or reverse engineer the
Software.
```

### Cross-References

Reference variables defined in YAML front matter:

```markdown
This agreement is between |client.name| and |provider.name|.

The effective date is |effective_date|.

Payment terms are |payment_terms| days.
```

### Optional Clauses

Conditional content based on YAML variables:

```markdown
[This clause appears only if confidentiality is required.]{confidentiality}

[Premium support is included for enterprise clients.]{client.type =
"enterprise"}

[This applies to California residents only.]{jurisdiction = "California"}
```

### Partial Imports

Include content from other files:

```markdown
@import boilerplate/header.md

l. Terms and Conditions

@import clauses/confidentiality.md

@import clauses/payment.md

@import boilerplate/footer.md
```

## Mixins System

The mixins system allows template substitution using `{{variable}}` syntax with
advanced features:

### Basic Variable Substitution

```markdown
---
title: Software License Agreement
client_name: Acme Corp
license_fee: 5000
---

# {{title}}

This agreement is with {{client_name}}. The license fee is ${{license_fee}}.
```

### Nested Object Access

```markdown
---
client:
  company:
    name: Acme Corporation
    address:
      street: 123 Business St
      city: San Francisco
      state: CA
---

Company: {{client.company.name}} Address: {{client.company.address.street}},
{{client.company.address.city}}, {{client.company.address.state}}
```

### Array Access

```markdown
---
parties:
  - name: John Smith
    role: Client
  - name: Jane Doe
    role: Provider
---

First party: {{parties.0.name}} ({{parties.0.role}}) Second party:
{{parties.1.name}} ({{parties.1.role}})
```

### Conditional Mixins

```markdown
---
client_name: Acme Corp
support_level: premium
payment_terms: 30
---

Client: {{client_name}} Support:
{{support_level ? "Premium support included" : "Standard support"}} Payment:
{{payment_terms ? "Net " + payment_terms + " days" : "Payment terms to be negotiated"}}
```

## Template Loops

Process arrays and iterate over collections:

### Array Iteration

```markdown
---
items:
  - name: Software License
    price: 1000
    description: Annual software license
  - name: Support Package
    price: 500
    description: Technical support for 12 months
  - name: Training
    price: 300
    description: User training sessions
---

# Invoice Items

[#items]

- **{{name}}**: {{description}} Price: ${{price}} [/items]
```

### Conditional Blocks

```markdown
---
has_warranty: true
warranty_period: 12
---

[#has_warranty]

## Warranty

This product includes a {{warranty_period}}-month warranty. [/has_warranty]
```

### Nested Loops

```markdown
---
departments:
  - name: Engineering
    employees:
      - name: John Smith
        role: Senior Developer
      - name: Jane Doe
        role: Team Lead
  - name: Sales
    employees:
      - name: Bob Johnson
        role: Sales Manager
---

[#departments]

## {{name}} Department

[#employees]

- {{name}} - {{role}} [/employees] [/departments]
```

## Helper Functions

Comprehensive set of helper functions for formatting and manipulation:

### Date Helpers

```markdown
---
contract_date: 2024-01-15
---

# Contract dated {{formatDate(contract_date, "MMMM Do, YYYY")}}

Effective: {{formatDate(contract_date, "DD/MM/YYYY")}} Expiry:
{{formatDate(addYears(contract_date, 3), "YYYY-MM-DD")}} Due:
{{formatDate(addDays(contract_date, 30), "MMMM Do, YYYY")}}
```

#### Available Date Helpers

- `formatDate(date, format)` - Format dates with custom patterns
- `addYears(date, years)` - Add years to a date
- `addMonths(date, months)` - Add months to a date
- `addDays(date, days)` - Add days to a date

#### Date Format Tokens

- `YYYY` - 4-digit year
- `MM` - 2-digit month
- `DD` - 2-digit day
- `MMMM` - Full month name
- `Do` - Day with ordinal suffix

### Number Helpers

```markdown
---
amount: 50000
rate: 0.052
population: 1234567
---

Total: {{formatCurrency(amount, "USD")}} Rate: {{formatPercent(rate, 1)}}
Population: {{formatInteger(population)}} Amount in words:
{{numberToWords(amount)}} Rounded: {{round(rate, 3)}}
```

#### Available Number Helpers

- `formatCurrency(amount, currency, decimals)` - Format as currency
- `formatPercent(value, decimals)` - Format as percentage
- `formatInteger(value, separator)` - Format with thousand separators
- `numberToWords(number)` - Convert number to written form
- `round(value, decimals)` - Round to specified decimal places

### String Helpers

```markdown
---
client_name: 'john doe'
description: 'This is a very long description that needs to be truncated'
---

Client: {{capitalize(client_name)}} Title: {{titleCase(client_name)}} Upper:
{{upper(client_name)}} Summary: {{truncate(description, 50, "...")}} Initials:
{{initials(client_name)}}
```

#### Available String Helpers

- `capitalize(str)` - Capitalize first letter
- `capitalizeWords(str)` - Capitalize each word
- `titleCase(str)` - Convert to title case
- `upper(str)` - Convert to uppercase
- `lower(str)` - Convert to lowercase
- `truncate(str, length, suffix)` - Truncate with suffix
- `initials(name)` - Extract initials
- `clean(str)` - Remove extra whitespace

### Special Values

```markdown
---
contract_date: @today
---

Generated on: {{formatDate(@today, "MMMM Do, YYYY")}} Contract date:
{{formatDate(contract_date, "YYYY-MM-DD")}} Expiry:
{{formatDate(addYears(@today, 1), "MMMM Do, YYYY")}}
```

The `@today` special value resolves to the current date.

## PDF Generation

Generate professional PDF documents with custom styling:

### Basic PDF Generation

```bash
legal-md document.md --pdf
```

### PDF with Highlighting

```bash
legal-md document.md --pdf --highlight
```

### PDF with Custom CSS

```bash
legal-md document.md --pdf --css ./styles/contract.css
```

### PDF Options

```typescript
import { generatePdf } from 'legal-markdown-js';

const buffer = await generatePdf(content, 'output.pdf', {
  title: 'Legal Document',
  format: 'A4',
  landscape: false,
  includeHighlighting: true,
  cssPath: './styles/legal.css',
});
```

### PDF with Logo Headers/Footers

The PDF generator automatically detects and includes logos in headers when a CSS
file is provided with logo configuration:

#### Automatic Logo Detection

```css
/* In your CSS file (e.g., src/styles/contract.css) */
:root {
  --logo-filename: logo.company.png;
}
```

```typescript
import { generatePdf } from 'legal-markdown-js';

// Logo automatically detected and included in header
const buffer = await generatePdf(content, 'output.pdf', {
  cssPath: '.src/styles/contract.css', // Contains --logo-filename
  format: 'A4',
});
```

#### Manual Header/Footer Templates

```typescript
const buffer = await generatePdf(content, 'output.pdf', {
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="width: 100%; text-align: right; padding-right: 25mm;">
      <img src="data:image/png;base64,iVBORw0..." style="height: 40px;" />
    </div>
  `,
  footerTemplate: `
    <div style="width: 100%; text-align: right; padding: 10px 25mm; font-size: 10px;">
      Page <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `,
});
```

#### Using Template Helpers

```typescript
import { PdfTemplates } from 'legal-markdown-js/generators/pdf-templates';
import { PDF_TEMPLATE_CONSTANTS } from 'legal-markdown-js/constants';

// Generate templates programmatically
const headerTemplate = PdfTemplates.generateHeaderTemplate(logoBase64);
const footerTemplate = PdfTemplates.generateFooterTemplate();
const customHeader = PdfTemplates.generateCustomHeaderTemplate(
  'Confidential',
  logoBase64
);

const buffer = await generatePdf(content, 'output.pdf', {
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
});
```

#### Logo Requirements

- **Format**: PNG only
- **Size**: Maximum 500KB
- **Location**: Place in `src/assets/images/` directory
- **Reference**: Use `--logo-filename` CSS variable to specify

#### Logo Integration Process

1. **Detection**: System scans CSS for `--logo-filename` property
2. **Validation**: Checks file exists, is PNG format, and within size limits
3. **Encoding**: Converts to base64 for embedding
4. **Template Generation**: Creates header/footer with logo positioning
5. **Fallback**: Continues without logo if any step fails

### Generate Both Versions

```typescript
import { generatePdfVersions } from 'legal-markdown-js';

const { normal, highlighted } = await generatePdfVersions(
  content,
  'document.pdf',
  {
    title: 'Contract',
    cssPath: './styles/contract.css',
  }
);
// Creates: document.pdf and document.HIGHLIGHT.pdf
```

## HTML Generation

Generate HTML documents with custom styling:

### Basic HTML Generation

```typescript
import { generateHtml } from 'legal-markdown-js';

const html = await generateHtml(content, {
  title: 'Legal Document',
  cssPath: './styles/legal.css',
  includeHighlighting: true,
});
```

### HTML with Field Highlighting

```bash
legal-md document.md --html --highlight
```

### Custom HTML Template

```typescript
const html = await generateHtml(content, {
  title: 'Contract Review',
  cssPath: './styles/contract.css',
  includeHighlighting: true,
  customTemplate: './templates/legal.html',
});
```

## Field Highlighting

Visual indicators for template fields in HTML and PDF output:

### Highlight Colors

- **Blue (imported-value)**: Fields successfully filled from data
- **Red (missing-value)**: Required fields without values
- **Yellow (highlight)**: Fields with conditional logic or mixins

### CSS Classes

```css
.imported-value {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  padding: 2px 4px;
  border-radius: 3px;
}

.missing-value {
  background-color: #ffebee;
  border: 1px solid #f44336;
  padding: 2px 4px;
  border-radius: 3px;
}

.highlight {
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  padding: 2px 4px;
  border-radius: 3px;
}
```

### Field Tracking Report

Field tracking provides visibility into template variable usage and helps
identify missing data. The system now separates field tracking for different
output formats:

```typescript
// For HTML/PDF output (automatic field tracking)
const result = processLegalMarkdown(content, {
  enableFieldTracking: true, // Always enabled for HTML/PDF
});

// For markdown output (Ruby compatibility: disabled by default)
const result = processLegalMarkdown(content, {
  enableFieldTrackingInMarkdown: true, // Explicitly enable for markdown
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

**Field Tracking Behavior:**

- **Markdown output**: Clean output by default (Ruby compatibility), enable with
  `--enable-field-tracking` CLI flag or `enableFieldTrackingInMarkdown: true`
  option
- **HTML/PDF output**: Field tracking always enabled when
  `enableFieldTracking: true` and `--highlight` flag is used
- **Playground**: Split preview with separate markdown and HTML outputs, each
  with independent field tracking controls

## Batch Processing

Process multiple files efficiently:

```typescript
import { processBatch } from 'legal-markdown-js';

const result = await processBatch({
  inputDir: './documents',
  outputDir: './processed',
  extensions: ['.md', '.txt'],
  recursive: true,
  preserveStructure: true,
  concurrency: 5,
  onProgress: (processed, total, currentFile) => {
    console.log(`Processing: ${currentFile} (${processed}/${total})`);
  },
});

console.log(`Processed: ${result.totalProcessed}`);
console.log(`Errors: ${result.totalErrors}`);
```

### Batch Options

- `inputDir`: Source directory
- `outputDir`: Output directory
- `extensions`: File extensions to process
- `recursive`: Process subdirectories
- `preserveStructure`: Maintain directory structure
- `concurrency`: Number of parallel processes
- `onProgress`: Progress callback function

## Force Commands

The Force Commands feature enables **document-driven configuration**, allowing
documents to specify their own processing options directly in the YAML front
matter. This makes documents self-configuring and eliminates the need for manual
CLI flags.

### Basic Usage

Documents can include a `force_commands` field that contains command-line
options:

```yaml
---
title: Service Agreement
client_name: Acme Corporation
effective_date: 2024-01-01

# Embedded processing configuration
force_commands: >
  --css corporate-theme.css --pdf --highlight --export-yaml --export-json
  --title "{{title}} - {{client_name}}"
---
# {{title}}

This agreement is between Legal Services Inc. and {{titleCase(client_name)}}.

The effective date of this agreement is {{formatDate(effective_date, "MMMM Do,
YYYY")}}.
```

When this document is processed with `legal-md document.md`, it automatically:

1. **Applies corporate CSS**: Uses `corporate-theme.css` for styling
2. **Generates PDF**: Creates PDF output with highlighting enabled
3. **Exports metadata**: Creates both YAML and JSON metadata files
4. **Sets dynamic title**: Uses template variables in the document title
5. **Processes templates**: Resolves all `{{variable}}` expressions

### Template Variables in Commands

Force commands support full template variable resolution, allowing dynamic
configuration:

```yaml
---
document_type: Service Agreement
client_name: Acme Corporation
effective_date: 2024-01-01
contract_value: 50000
currency: USD

force_commands: >
  --output-name
  {{titleCase(document_type)}}_{{titleCase(client_name)}}_{{formatDate(effective_date,
  "YYYYMMDD")}}.pdf --title "{{document_type}} - {{client_name}}
  ({{formatCurrency(contract_value, currency)}})" --css corporate-style.css
  --pdf --highlight --format A4 --export-yaml --export-json
---
```

This generates:

- **PDF file**: `Service_Agreement_Acme_Corporation_20240101.pdf`
- **Document title**: "Service Agreement - Acme Corporation ($50,000.00)"
- **Metadata exports**: YAML and JSON files with processed data

### Available Commands

All CLI options are supported in force_commands:

| Category     | Commands                                                  | Description            |
| ------------ | --------------------------------------------------------- | ---------------------- |
| **Output**   | `--css <file>`, `--output-name <name>`, `--title <title>` | Styling and naming     |
| **Formats**  | `--pdf`, `--html`, `--format <format>`, `--landscape`     | Output format control  |
| **Features** | `--highlight`, `--export-yaml`, `--export-json`           | Enhanced functionality |
| **Debug**    | `--debug`                                                 | Troubleshooting        |

### Alternative Field Names

The feature supports multiple naming conventions for flexibility:

```yaml
# All of these work identically:
force_commands: --pdf --highlight # Recommended
force-commands: --pdf --highlight # Kebab case
forceCommands: --pdf --highlight # Camel case
commands: --pdf --highlight # Short form
```

### Security and Validation

Force commands include built-in security measures:

**Protected Commands**: Critical system options cannot be overridden:

- `--stdin`, `--stdout` (I/O redirection)
- `--yaml`, `--headers` (Core processing flags)
- `--no-*` flags (Processing control)

**Path Validation**: File paths are validated to prevent security issues:

- Paths containing `..` are rejected (prevents directory traversal)
- Absolute paths starting with `/` are rejected
- Only relative paths within the project are allowed

**Template Sandboxing**: Template resolution is limited to document metadata
only.

### Command Priority

Force commands **take precedence** over CLI arguments:

```bash
# CLI command:
legal-md document.md --html --css basic.css

# Document contains:
# force_commands: --pdf --css advanced.css

# Result: PDF is generated with advanced.css
# (force_commands override CLI options)
```

This design ensures documents are truly self-configuring and portable across
different environments.

### Multi-line Commands

For complex configurations, use YAML multi-line syntax:

```yaml
---
force_commands: |
  --css corporate-theme.css
  --pdf --highlight --format A4
  --export-yaml --export-json  
  --title "{{document_type}} - Generated {{formatDate(today, "YYYY-MM-DD")}}"
  --output-name {{document_type}}_{{client}}_Final.pdf
---
```

### Use Cases

**Self-Configuring Documents**: Documents that specify their own styling and
output requirements:

```yaml
force_commands: --css legal-brief.css --pdf --format legal --landscape
```

**Template-Driven Output**: Dynamic file naming based on document content:

```yaml
force_commands:
  --output-name {{case_number}}_{{document_type}}_{{formatDate(filing_date,
  "YYYYMMDD")}}.pdf
```

**Workflow Integration**: Automatic metadata export for downstream processing:

```yaml
force_commands: --export-json --export-yaml --pdf --highlight
```

**Client-Specific Styling**: Different styling based on client requirements:

```yaml
force_commands:
  --css {{client_code}}-theme.css --title "{{client_name}} - {{document_type}}"
```

## Advanced Features

### Custom Header Formats

```yaml
---
title: Academic Paper
level-one: '%n.'
level-two: '%n.%s'
level-three: '%n.%s.%t'
level-four: '%n.%s.%t.%f'
level-five: '%n.%s.%t.%f.%i'
level-indent: 2.0
---
```

### Multi-language Support

```yaml
---
title: Contrato de Servicios
language: es
locale: es-ES
date_format: DD/MM/YYYY
---
```

### Jurisdiction-specific Templates

```yaml
---
title: Software License Agreement
jurisdiction: California
template_type: software_license
governing_law: California
---
```

### Error Handling

```typescript
import { processLegalMarkdown } from 'legal-markdown-js';

try {
  const result = processLegalMarkdown(content, {
    throwOnYamlError: true,
    enableFieldTracking: true,
  });
} catch (error) {
  if (error.code === 'YAML_PARSE_ERROR') {
    console.error('Invalid YAML:', error.message);
  }
}
```

## Configuration

### Global Configuration

Create `.legalmdrc` in your home directory:

```json
{
  "defaultOptions": {
    "debug": false,
    "exportFormat": "json",
    "enableFieldTracking": true
  },
  "outputFormats": {
    "pdf": {
      "format": "Letter",
      "margins": "1in"
    },
    "html": {
      "includeHighlighting": true
    }
  },
  "templatePaths": ["~/legal-templates", "./templates"]
}
```

### Project Configuration

Create `legal-markdown.config.js`:

```javascript
module.exports = {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json',
  enableFieldTracking: true,
  pdfOptions: {
    format: 'A4',
    margins: '1in',
  },
  htmlOptions: {
    includeHighlighting: true,
    cssPath: './styles/legal.css',
  },
  helpers: {
    customHelper: value => {
      return value.toUpperCase();
    },
  },
};
```

## Best Practices

### Document Structure

1. **Start with YAML**: Always begin documents with YAML front matter
2. **Use hierarchical numbering**: Employ the `l.`, `ll.`, `lll.` system for
   legal structure
3. **Define all variables**: Ensure all referenced variables are defined in YAML
4. **Use descriptive names**: Choose clear, descriptive variable names

### Template Organization

1. **Modular approach**: Use imports for common sections
2. **Consistent formatting**: Maintain consistent date and number formats
3. **Error handling**: Provide fallback values for optional fields
4. **Documentation**: Comment complex logic in templates

### Performance Optimization

1. **Batch processing**: Use batch processing for multiple files
2. **Selective processing**: Skip unnecessary processors with `--no-*` flags
3. **Caching**: Cache processed templates for repeated use
4. **Memory management**: Monitor memory usage for large documents

### Quality Assurance

1. **Field tracking**: Use field tracking to identify missing data
   - For document review: `legal-md --enable-field-tracking input.md output.md`
   - For HTML/PDF review: `legal-md --html --highlight input.md` (automatic)
2. **Validation**: Validate YAML and template syntax
3. **Testing**: Test templates with various data scenarios
4. **Review workflow**: Use highlighting for document review
   - Markdown: Clean output for final documents, tracking for review
   - HTML/PDF: Highlighting available for visual review

### Security Considerations

1. **Input validation**: Validate all input data
2. **Sanitization**: Sanitize user-provided content
3. **Access control**: Restrict template and data access
4. **Audit logging**: Log document processing activities

For more detailed examples and use cases, see the [examples](../examples/)
directory.
