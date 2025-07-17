# Features Guide

Comprehensive guide to all features and capabilities of Legal Markdown JS.

## Table of Contents

- [Core Features](#core-features)
- [Mixins System](#mixins-system)
- [Template Loops](#template-loops)
- [Helper Functions](#helper-functions)
- [PDF Generation](#pdf-generation)
- [HTML Generation](#html-generation)
- [Field Highlighting](#field-highlighting)
- [Batch Processing](#batch-processing)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

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
//   fields: [
//     { name: 'title', status: 'filled', value: 'Contract' },
//     { name: 'client.name', status: 'empty', value: undefined },
//     { name: 'hasWarranty', status: 'logic', value: true }
//   ]
// }
```

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
2. **Validation**: Validate YAML and template syntax
3. **Testing**: Test templates with various data scenarios
4. **Review workflow**: Use highlighting for document review

### Security Considerations

1. **Input validation**: Validate all input data
2. **Sanitization**: Sanitize user-provided content
3. **Access control**: Restrict template and data access
4. **Audit logging**: Log document processing activities

For more detailed examples and use cases, see the [examples](../examples/)
directory.
