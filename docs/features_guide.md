<!-- markdownlint-disable MD013 -->

# Features Guide <!-- omit in toc -->

Comprehensive guide to all features and capabilities of Legal Markdown JS.

## Table of Contents <!-- omit in toc -->

- [Core Features](#core-features)
  - [YAML Front Matter](#yaml-front-matter)
  - [Headers and Numbering](#headers-and-numbering)
  - [Cross-References](#cross-references)
    - [Internal Section References](#internal-section-references)
    - [Variable References](#variable-references)
    - [Automatic Cross-References Metadata](#automatic-cross-references-metadata)
  - [Optional Clauses](#optional-clauses)
  - [Partial Imports](#partial-imports)
  - [Frontmatter Merging](#frontmatter-merging)
    - [Basic Frontmatter Merging](#basic-frontmatter-merging)
    - [Granular Property-Level Merging](#granular-property-level-merging)
    - [Sequential Import Processing](#sequential-import-processing)
    - [Reserved Fields Security](#reserved-fields-security)
    - [Advanced Frontmatter Features](#advanced-frontmatter-features)
    - [Practical Use Cases](#practical-use-cases)
    - [Security and Best Practices](#security-and-best-practices)
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
    - [Automatic Logo Detection](#automatic-logo-detection)
    - [Manual Header/Footer Templates](#manual-headerfooter-templates)
    - [Using Template Helpers](#using-template-helpers)
    - [Logo Requirements](#logo-requirements)
    - [Logo Integration Process](#logo-integration-process)
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
  - [Basic Usage](#basic-usage)
  - [Template Variables in Commands](#template-variables-in-commands)
  - [Available Commands](#available-commands)
  - [Alternative Field Names](#alternative-field-names)
  - [Security and Validation](#security-and-validation)
  - [Command Priority](#command-priority)
  - [Multi-line Commands](#multi-line-commands)
  - [Use Cases](#use-cases)
- [Smart File Archiving](#smart-file-archiving)
  - [Archive Logic](#archive-logic)
  - [Content Comparison](#content-comparison)
  - [Archive Scenarios](#archive-scenarios)
    - [Scenario 1: Static Documents](#scenario-1-static-documents)
    - [Scenario 2: Template Documents](#scenario-2-template-documents)
    - [Scenario 3: Conflict Resolution](#scenario-3-conflict-resolution)
  - [Configuration and Usage](#configuration-and-usage)
    - [Archiving: Basic Usage](#archiving-basic-usage)
    - [Environment Configuration](#environment-configuration)
    - [Programmatic Usage](#programmatic-usage)
    - [Archive Features](#archive-features)
    - [Archiving: Use Cases](#archiving-use-cases)
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
- [Remark-based Processing](#remark-based-processing)
  - [AST-based Field Highlighting](#ast-based-field-highlighting)
  - [Improved Performance](#improved-performance)
  - [Better Text Processing](#better-text-processing)

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

Legal Markdown supports two types of cross-references:

#### Internal Section References

Reference numbered sections within the same document:

```markdown
l. **Definitions** |definitions|

Terms defined in this agreement...

l. **Payment Terms** |payment|

As outlined in |definitions|, payment is due within 30 days.
```

**Output:**

```markdown
Article 1. **Definitions**

Terms defined in this agreement...

Article 2. **Payment Terms**

As outlined in Article 1., payment is due within 30 days.
```

#### Variable References

Reference variables defined in YAML front matter:

```markdown
This agreement is between |client.name| and |provider.name|.

The effective date is |effective_date|.

Payment terms are |payment_terms| days.
```

#### Automatic Cross-References Metadata

When processing documents with internal cross-references, Legal Markdown
automatically generates a `_cross_references` field in the document metadata
containing all section references:

```yaml
_cross_references:
  - key: 'definitions'
    sectionNumber: 'Article 1.'
    sectionText: 'Article 1. **Definitions**'
  - key: 'payment'
    sectionNumber: 'Article 2.'
    sectionText: 'Article 2. **Payment Terms**'
```

This metadata is available for:

- Export to YAML/JSON files with `meta-yaml-output` or `meta-json-output`
- Integration with external systems
- Document analysis and validation

**Note:** The `_cross_references` field is a protected field that cannot be
overridden by imports.

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

### Frontmatter Merging

Legal Markdown JS automatically merges YAML frontmatter from imported files into
the main document's metadata using a "source always wins" strategy. This enables
modular document composition with metadata inheritance.

#### Basic Frontmatter Merging

**Main Document** (`contract.md`):

```yaml
---
title: "Professional Services Agreement"
client:
  name: "Default Client"  # Will be overridden by import
liability_cap: 500000     # Main document wins over imports
payment_terms: "Net 45"  # Main document preference
---

# {{title}}

@import components/client-info.md
@import components/standard-terms.md
```

**Component** (`components/client-info.md`):

```yaml
---
client:
  name: "Acme Corporation"     # Overrides main document
  industry: "Manufacturing"   # New field, added to metadata
  contact: "legal@acme.com"   # New nested field
liability_cap: 2000000        # Loses to main document
payment_terms: "Net 15"      # Loses to main document
---

**Client:** {{client.name}} ({{client.industry}})
**Contact:** {{client.contact}}
```

**Result**: The main document's values for `liability_cap` and `payment_terms`
are preserved, while `client.name`, `client.industry`, and `client.contact` are
merged from the imported file.

#### Granular Property-Level Merging

Frontmatter merging works at the property level for nested objects:

```yaml
# Main document
config:
  debug: true
  server: "production"
  database:
    host: "main-db"

# Import
config:
  debug: false           # Conflict - main wins
  timeout: 30           # New field - added
  database:
    host: "import-db"   # Conflict - main wins
    port: 5432          # New field - added

# Merged result
config:
  debug: true           # From main (wins conflict)
  server: "production"  # From main (preserved)
  timeout: 30           # From import (added)
  database:
    host: "main-db"     # From main (wins conflict)
    port: 5432          # From import (added)
```

#### Sequential Import Processing

When multiple imports have conflicting metadata, the first import wins over
subsequent imports (but main document always wins over all imports):

```yaml
# main.md
shared_field: "main_value"

# First import
shared_field: "first_value"  # Loses to main
unique_field: "from_first"

# Second import
shared_field: "second_value" # Loses to main
unique_field: "from_second"  # Loses to first import

# Final result
shared_field: "main_value"   # Main document wins
unique_field: "from_first"   # First import wins
```

#### Reserved Fields Security

For security, certain fields are automatically filtered and cannot be overridden
by imports:

```yaml
# Malicious import attempt (automatically filtered)
level-one: 'HACKED %n' # Header configuration (filtered)
force_commands: 'rm -rf /' # Command injection (filtered)
meta-yaml-output: '/etc/passwd' # Path traversal (filtered)
pipeline-config: { ... } # System configuration (filtered)

# Only safe fields are merged
legitimate_field: 'safe value' # Allowed through
```

Reserved fields include:

- `level-one`, `level-two`, etc. (header configuration)
- `force_commands`, `commands` (command injection prevention)
- `meta-yaml-output`, `meta-json-output` (path traversal prevention)
- `pipeline-config` (system configuration protection)

#### Advanced Frontmatter Features

**Type Validation**: Enable strict type checking during merge operations:

```bash
# Validate types during frontmatter merging
legal-markdown contract.md --validate-import-types
```

If enabled, type conflicts are detected and logged:

```yaml
# Main document
count: 42

# Import with type conflict
count: "not a number"    # Type conflict - main value preserved

# Result with type validation
count: 42                # Preserved with warning logged
```

**Import Operation Logging**: Track detailed merge operations:

```bash
# Log detailed frontmatter merge operations
legal-markdown contract.md --log-import-operations
```

**Disable Frontmatter Merging**: Turn off automatic merging:

```bash
# Process without frontmatter merging
legal-markdown contract.md --disable-frontmatter-merge
```

#### Practical Use Cases

**Legal Document Assembly**:

- **Standard Terms**: Common clauses with default values
- **Client Terms**: Client-specific overrides and additions
- **Project Terms**: Project-specific parameters
- **Regulatory Terms**: Jurisdiction-specific requirements

**Template Composition**:

- **Base Templates**: Core document structure with defaults
- **Component Library**: Reusable sections with metadata
- **Customization Layers**: Client/project specific modifications
- **Compliance Overlays**: Industry-specific requirements

**Example: Enterprise Contract Assembly**:

```yaml
# Main enterprise contract
---
title: "Enterprise Master Agreement"
liability_cap: 10000000  # Enterprise-level protection
payment_terms: "Net 15"  # Fast payment for enterprise
---

@import components/client-specific-terms.md  # Override defaults
@import components/standard-legal-terms.md   # Base legal framework
@import components/enterprise-sla.md         # Performance requirements
```

Each imported component contributes its metadata while the main document's
preferences take precedence for any conflicts.

#### Security and Best Practices

1. **Structure Hierarchy**: Put most general settings in main document
2. **Use Descriptive Names**: Name import files by their purpose
3. **Document Precedence**: Comment which fields should win conflicts
4. **Validate Types**: Use `--validate-import-types` in CI/CD
5. **Security First**: Never import untrusted content without validation
6. **Test Thoroughly**: Verify merged metadata matches expectations

The frontmatter merging system includes timeout protection to prevent infinite
loops from circular references and comprehensive security filtering to prevent
system configuration override.

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

| Category     | Commands                                                                            | Description                 |
| ------------ | ----------------------------------------------------------------------------------- | --------------------------- |
| **Output**   | `--css <file>`, `--output-name <name>`, `--title <title>`                           | Styling and naming          |
| **Formats**  | `--pdf`, `--html`, `--format <format>`, `--landscape`                               | Output format control       |
| **Features** | `--highlight`, `--export-yaml`, `--export-json`                                     | Enhanced functionality      |
| **Imports**  | `--disable-frontmatter-merge`, `--validate-import-types`, `--log-import-operations` | Frontmatter merging control |
| **Debug**    | `--debug`                                                                           | Troubleshooting             |

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

## Smart File Archiving

Legal Markdown JS features an intelligent archiving system that automatically
organizes processed files based on content analysis. The system compares
original and processed content to determine the optimal archiving strategy,
ensuring both templates and results are preserved appropriately.

### Archive Logic

The smart archiving system makes decisions based on content comparison:

```typescript
// Smart archiving workflow
const originalContent = readFile('document.md');
const processedContent = processLegalMarkdown(originalContent);

if (contentsAreIdentical(originalContent, processedContent)) {
  // Archive only the original file
  archive('document.md' → 'archive/document.md');
} else {
  // Archive both versions with clear suffixes
  archive('document.md' → 'archive/document.ORIGINAL.md');   // Template
  writeFile('archive/document.PROCESSED.md', processedContent); // Result
}
```

### Content Comparison

The system performs intelligent content comparison that:

- **Normalizes line endings** (handles Windows/Unix differences)
- **Trims whitespace** (ignores formatting differences)
- **Compares actual content** (focuses on meaningful changes)

```typescript
// Content normalization for comparison
function areContentsIdentical(content1: string, content2: string): boolean {
  const normalize = (content: string) => content.replace(/\r\n/g, '\n').trim();
  return normalize(content1) === normalize(content2);
}
```

### Archive Scenarios

#### Scenario 1: Static Documents

For documents where processing doesn't change the content (e.g., documents with
only frontmatter):

```yaml
---
title: Legal Notice
client: Acme Corp
date: 2024-01-01
---
# Legal Notice

This is a static legal notice.
```

**Archive Result**:

```bash
archive/legal-notice.md  # Single file - template is preserved
```

#### Scenario 2: Template Documents

For documents with imports, mixins, or variable substitution:

```yaml
---
title: Service Agreement
client: Acme Corp
effective_date: 2024-01-01
---
# {{title}}

@import clauses/standard-terms.md

This agreement between Legal Services Inc. and {{client}}
is effective {{formatDate(effective_date, "MMMM Do, YYYY")}}.

[Confidentiality clause applies]{client.confidentiality_required}
```

**Archive Result**:

```bash
archive/service-agreement.ORIGINAL.md   # Template file
archive/service-agreement.PROCESSED.md  # Processed result
```

#### Scenario 3: Conflict Resolution

When files with the same name already exist in the archive:

```bash
# First document
legal-md contract.md --archive-source ./archive
# Creates: archive/contract.md

# Second document with same name
legal-md contract.md --archive-source ./archive
# Creates: archive/contract_1.md (automatic renaming)

# With different content (template processing)
legal-md template.md --archive-source ./archive
# Creates: archive/template.ORIGINAL_1.md
#          archive/template.PROCESSED_1.md
```

### Configuration and Usage

#### Archiving: Basic Usage

```bash
# Enable smart archiving with default directory
legal-md document.md --archive-source

# Custom archive directory
legal-md document.md --archive-source ./completed

# With PDF generation
legal-md document.md --pdf --highlight --archive-source ./processed
```

#### Environment Configuration

```bash
# Set default archive directory
export ARCHIVE_DIR="./processed-documents"

# Use default directory
legal-md document.md --archive-source
```

#### Programmatic Usage

```typescript
import { CliService } from 'legal-markdown-js';

const cliService = new CliService({
  archiveSource: './archive',
});

// Smart archiving happens automatically
await cliService.processFile('template.md', 'output.md');
```

#### Archive Features

- **Intelligent Decision Making**: Automatically determines whether to archive
  one or two files
- **Template Preservation**: Keeps original templates intact for reuse
- **Result Preservation**: Saves processed content for reference
- **Clear Naming**: Uses `.ORIGINAL` and `.PROCESSED` suffixes for clarity
- **Conflict Resolution**: Automatic renaming when files already exist
- **Error Handling**: Graceful handling of archive failures
- **Cross-Platform**: Works consistently across different operating systems

#### Archiving: Use Cases

**Document Template Management**:

```bash
# Process multiple templates
for template in templates/*.md; do
  legal-md "$template" --pdf --archive-source ./completed
done
# Templates with imports → dual archiving
# Static templates → single archiving
```

**Workflow Integration**:

```bash
# Process and archive in production pipeline
legal-md contract-template.md --pdf --highlight --archive-source ./production-archive
# Preserves both template (for future use) and result (for records)
```

**Quality Assurance**:

```bash
# Archive for review and compliance
legal-md legal-document.md --pdf --export-json --archive-source ./compliance
# Smart archiving helps maintain audit trail
```

The smart archiving system ensures that your document workflow maintains both
the flexibility of templates and the integrity of processed results,
automatically organizing files based on their actual content changes.

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
5. **Frontmatter security**: Reserved fields are automatically filtered in
   imports
   - System configuration fields (`level-one`, `meta-yaml-output`, etc.)
   - Command injection fields (`force_commands`, `commands`)
   - Use `--validate-import-types` to detect type confusion attacks
6. **Timeout protection**: Automatic timeout prevents infinite loops from
   circular references

## Remark-based Processing

The library now includes advanced remark-based processing that provides improved
accuracy and performance for field tracking and document processing.

### AST-based Field Highlighting

The new remark processor uses Abstract Syntax Tree (AST) processing to provide
more accurate field highlighting:

```typescript
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';

const result = await processLegalMarkdownWithRemark(content, {
  enableFieldTracking: true,
  basePath: './documents',
});
```

**Benefits:**

- **No text contamination**: Field highlighting is applied during AST
  processing, preventing false positives
- **Accurate targeting**: Only actual template fields are highlighted, not
  similar text elsewhere
- **Double-wrapping prevention**: Automatic detection prevents nested field
  tracking spans

### Improved Performance

The remark-based processor offers several performance improvements:

- **Unified processing**: Single AST traversal handles multiple operations
- **Optimized parsing**: Faster markdown parsing with remark ecosystem
- **Reduced processing steps**: Combined field tracking and content processing

### Better Text Processing

Enhanced text processing capabilities:

- **Markdown-aware**: Full understanding of markdown structure
- **Context-sensitive**: Processing decisions based on document context
- **Extensible**: Plugin-based architecture for future enhancements

**Migration from Legacy:**

```typescript
// Legacy (still supported)
import { processLegalMarkdown } from 'legal-markdown-js';
const result = processLegalMarkdown(content, options);

// New remark-based (recommended for new projects)
import { processLegalMarkdownWithRemark } from 'legal-markdown-js';
const result = await processLegalMarkdownWithRemark(content, options);
```

For more detailed examples and use cases, see the [examples](../examples/)
directory.
