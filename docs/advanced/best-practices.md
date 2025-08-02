# Best Practices

Comprehensive guidelines for creating professional, maintainable, and secure
legal documents with Legal Markdown JS, covering document structure, template
organization, performance optimization, and security considerations.

## Table of Contents

- [Overview](#overview)
- [Document Structure](#document-structure)
- [Template Organization](#template-organization)
- [Performance Optimization](#performance-optimization)
- [Quality Assurance](#quality-assurance)
- [Security Considerations](#security-considerations)
- [Helper Function Guidelines](#helper-function-guidelines)
- [Error Prevention](#error-prevention)
- [Maintenance and Updates](#maintenance-and-updates)

## Overview

Following best practices ensures that your Legal Markdown documents are:

- **Professional** - Meet legal and business standards
- **Maintainable** - Easy to update and modify
- **Reliable** - Consistent and error-free output
- **Secure** - Protected against common vulnerabilities
- **Performant** - Process efficiently at scale
- **Accessible** - Clear structure and documentation

## Document Structure

### 1. Start with YAML Frontmatter

Always begin documents with comprehensive YAML front matter:

```yaml
---
title: 'Service Agreement'
document_type: 'contract'
version: '1.0'
created_date: '@today'
author: 'Legal Department'

# Document variables
client_name: 'Acme Corporation'
service_type: 'Software Development'
contract_value: 50000
currency: 'EUR'
start_date: '2025-08-01'
duration_months: 12

# Processing options
enable_field_tracking: true
export_format: 'json'
---
```

**Benefits:**

- Centralized variable management
- Clear document metadata
- Processing configuration in one place
- Version control and tracking

### 2. Use Hierarchical Numbering

Employ the `l.`, `ll.`, `lll.` system for proper legal structure:

```markdown
l. Definitions and Interpretation ll. Scope of Services lll. Service Delivery
Standards llll. Performance Metrics lllll. Quality Benchmarks

l. Terms and Conditions ll. Payment Terms lll. Invoicing Process llll. Late
Payment Penalties
```

**Advantages:**

- Automatic cross-reference generation
- Consistent numbering across documents
- Easy reorganization and updates
- Professional legal formatting

### 3. Define All Variables

Ensure all referenced variables are defined in YAML:

```yaml
---
# ✅ Good - All variables defined
client_name: "TechCorp Inc."
project_name: "Digital Transformation"
start_date: "2025-08-01"
end_date: "2026-07-31"
total_amount: 75000
currency: "USD"
---

<!-- ❌ Bad - Undefined variable will show as {{missing_var}} -->
Client: {{missing_var}}

<!-- ✅ Good - All variables defined -->
Client: {{client_name}}
Project: {{project_name}}
```

### 4. Use Descriptive Variable Names

Choose clear, descriptive variable names following consistent conventions:

```yaml
---
# ✅ Good - Clear, descriptive names
client_company_name: 'Global Industries Ltd.'
project_start_date: '2025-08-01'
monthly_service_fee: 5000
primary_contact_email: 'john.doe@globalindustries.com'
contract_termination_notice_days: 30

# ❌ Bad - Unclear, abbreviated names
cc: 'Global Industries Ltd.'
psd: '2025-08-01'
msf: 5000
pce: 'john.doe@globalindustries.com'
ctnd: 30
---
```

**Naming conventions:**

- Use snake_case for consistency
- Include context (e.g., `contract_start_date` vs `start_date`)
- Avoid abbreviations unless widely understood
- Use descriptive suffixes (`_amount`, `_date`, `_email`)

## Template Organization

### 1. Modular Approach

Use imports for common sections to promote reusability:

```markdown
## <!-- main-contract.md -->

title: "Service Agreement" imports:

- "./sections/definitions.md"
- "./sections/payment-terms.md"
- "./sections/termination.md"
- "./sections/signatures.md"

---

# {{title}}

This agreement is made between {{client_name}} and {{service_provider}}.

{{import:definitions}}

{{import:payment-terms}}

{{import:termination}}

{{import:signatures}}
```

**Structure example:**

```text
templates/
├── contracts/
│   ├── base-contract.md
│   └── sections/
│       ├── definitions.md
│       ├── payment-terms.md
│       ├── liability.md
│       └── termination.md
├── agreements/
│   ├── nda-template.md
│   └── service-agreement.md
└── common/
    ├── signatures.md
    └── contact-info.md
```

### 2. Consistent Formatting

Maintain consistent date and number formats throughout documents:

```yaml
---
# Define formatting standards
date_format: 'DD/MM/YYYY'
currency: 'EUR'
number_decimals: 2
---
```

```markdown
<!-- ✅ Good - Consistent formatting -->

Start date: {{formatDate(start_date, date_format)}} End date:
{{formatDate(end_date, date_format)}} Amount:
{{formatCurrency(amount, currency, number_decimals)}} Fee:
{{formatCurrency(monthly_fee, currency, number_decimals)}}

<!-- ❌ Bad - Inconsistent formatting -->

Start date: {{formatDate(start_date, "DD/MM/YYYY")}} End date:
{{formatDate(end_date, "MMMM Do, YYYY")}} Amount:
{{formatCurrency(amount, "EUR")}} Fee: {{formatDollar(monthly_fee)}}
```

### 3. Error Handling and Fallbacks

Provide fallback values for optional fields:

```markdown
<!-- Required fields with validation -->

Client: {{client_name ? client_name : "[CLIENT NAME REQUIRED]"}} Amount:
{{contract_value ? formatCurrency(contract_value, currency) : "[AMOUNT REQUIRED]"}}

<!-- Optional fields with graceful fallbacks -->

Department: {{client_department ? client_department : "Not specified"}} Project
Code: {{project_code ? upper(project_code) : "To be assigned"}} Special Terms:
{{special_terms ? special_terms : "Standard terms apply"}}
```

### 4. Documentation and Comments

Comment complex logic and document template usage:

```markdown
<!--
Template: Service Agreement
Purpose: Standard professional services contract
Variables Required: client_name, service_type, contract_value
Last Updated: 2025-08-01
-->

---

title: "Service Agreement Template"

# Required variables (document will fail without these)

required_vars:

- client_name
- service_type
- contract_value
- start_date

# Optional variables (will use defaults)

optional_vars:

- project_code
- special_terms
- client_department

---

<!-- Generates unique contract ID: CLIENT_INITIALS + DATE + SEQUENCE -->

Contract ID:
{{upper(initials(client_name))}}{{formatDate(@today, "YYMMDD")}}{{padStart(sequence_number, 3, "0")}}

<!-- Payment schedule calculation: monthly payments over contract duration -->

Monthly Payment: {{formatCurrency(contract_value / duration_months, currency)}}
```

## Performance Optimization

### 1. Batch Processing

Use batch processing for multiple files to improve efficiency:

```typescript
// Process multiple contracts efficiently
const batchOptions = {
  concurrency: 4,
  enableCache: true,
  outputPath: './generated-contracts',
  progressCallback: (completed, total) => {
    console.log(
      `Progress: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`
    );
  },
};

await processBatch(
  [
    './contracts/client-a.md',
    './contracts/client-b.md',
    './contracts/client-c.md',
  ],
  batchOptions
);
```

### 2. Selective Processing

Skip unnecessary processors with command-line flags:

```bash
# Skip field tracking for final production documents
legal-md --no-field-tracking contract.md final-contract.pdf

# Skip metadata export for simple conversions
legal-md --no-metadata --pdf contract.md output.pdf

# Minimal processing for testing
legal-md --no-field-tracking --no-metadata --no-validation test.md
```

### 3. Template Caching

Cache processed templates for repeated use:

```typescript
const processingOptions = {
  enableCache: true,
  cacheDirectory: './cache',
  cacheTimeout: 3600000, // 1 hour
  validateCache: true,
};

// First run: processes and caches
const result1 = await processLegalMarkdown(content, processingOptions);

// Subsequent runs: uses cache if template unchanged
const result2 = await processLegalMarkdown(content, processingOptions);
```

### 4. Memory Management

Monitor memory usage for large documents:

```typescript
const largeDocumentOptions = {
  streamProcessing: true,
  maxMemoryUsage: '512MB',
  chunkSize: 1000000, // 1MB chunks
  enableGarbageCollection: true,
};

await processLegalMarkdown(largeContent, largeDocumentOptions);
```

## Quality Assurance

### 1. Field Tracking for Review

Use field tracking to identify missing data and ensure document completeness:

```bash
# Enable field tracking for document review
legal-md --enable-field-tracking contract.md review-contract.md

# Generate HTML with field highlighting for visual review
legal-md --html --highlight contract.md review.html

# Generate PDF with field highlighting
legal-md --pdf --highlight contract.md review.pdf
```

**Field tracking workflow:**

1. **Development**: Use tracking to identify all required fields
2. **Review**: Use highlighting in HTML/PDF for visual review
3. **Production**: Generate clean final documents without tracking

### 2. Validation and Testing

Implement comprehensive validation:

```yaml
---
# Document validation rules
validation:
  required_fields: ['client_name', 'contract_value', 'start_date']
  field_types:
    contract_value: number
    start_date: date
    client_email: email
  custom_rules:
    contract_value: 'value > 0'
    start_date: 'date >= today'
---
```

```bash
# Validate document structure and syntax
legal-md --validate contract.md

# Test with sample data
legal-md --test-data ./test-data.yaml contract.md test-output.md

# Check all templates in project
legal-md --validate-all ./templates/
```

### 3. Review Workflow

Establish systematic review processes:

```markdown
<!-- Review checklist embedded in template -->
<!--
REVIEW CHECKLIST:
□ All required fields completed
□ Dates are logical and consistent
□ Financial amounts are correct
□ Legal terms are appropriate
□ Cross-references resolve correctly
□ Formatting is professional
-->
```

**Review stages:**

1. **Automated validation** - Check syntax and required fields
2. **Field tracking review** - Visual inspection of highlighted document
3. **Legal review** - Content and legal compliance check
4. **Final generation** - Clean document without tracking

### 4. Version Control

Implement version control for templates and documents:

```yaml
---
# Template versioning
template_version: '2.1.0'
template_author: 'Legal Department'
last_updated: '@today'
changelog:
  - '2.1.0: Added new liability clauses'
  - '2.0.0: Updated for new regulations'
  - '1.5.0: Enhanced termination terms'

# Document versioning
document_version: '1.0'
review_status: 'draft'
approved_by: ''
approval_date: ''
---
```

## Security Considerations

### 1. Input Validation

Validate all input data to prevent injection attacks:

```typescript
// Input validation schema
const inputSchema = {
  client_name: {
    type: 'string',
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\.]+$/,
  },
  contract_value: {
    type: 'number',
    minimum: 0,
    maximum: 10000000,
  },
  client_email: {
    type: 'string',
    format: 'email',
  },
  start_date: {
    type: 'string',
    format: 'date',
  },
};

// Validate before processing
const validationResult = validateInput(documentData, inputSchema);
if (!validationResult.isValid) {
  throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
}
```

### 2. Content Sanitization

Sanitize user-provided content to prevent XSS and injection:

```typescript
// Sanitize HTML content
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

const cleanContent = sanitizeHtml(userContent, sanitizeOptions);
```

### 3. Access Control and Permissions

Restrict template and data access:

```typescript
// Access control configuration
const accessControl = {
  templatePaths: [
    path.resolve('./templates'), // Only allowed template directory
    path.resolve('./shared-templates'),
  ],
  dataSourcePaths: [
    path.resolve('./data'), // Only allowed data directory
    path.resolve('./client-data'),
  ],
  outputPaths: [
    path.resolve('./output'), // Only allowed output directory
    path.resolve('./generated'),
  ],
  blacklistedPaths: [
    path.resolve('/etc'), // System directories
    path.resolve('/usr'),
    path.resolve('c:\\windows'),
  ],
};
```

### 4. Import Security

Handle frontmatter security and prevent malicious imports:

```yaml
---
# ✅ Safe - Standard content imports
imports:
  - './safe-template.md'
  - './legal-clauses.md'

# ❌ Dangerous - System configuration injection
# These fields are automatically filtered in imports:
# level-one: "malicious format"
# force_commands: "--exec dangerous-command"
# meta-yaml-output: "/etc/passwd"
---
```

```bash
# Validate import types to detect attacks
legal-md --validate-import-types contract.md

# Enable strict import validation
legal-md --strict-imports --validate-all contract.md
```

### 5. Audit Logging

Log document processing activities:

```typescript
// Audit logging configuration
const auditLogger = {
  logLevel: 'info',
  logFile: './logs/document-processing.log',
  logFormat: 'json',
  includeUserInfo: true,
  loggedEvents: [
    'document_processed',
    'template_loaded',
    'import_resolved',
    'validation_failed',
    'security_violation',
  ],
};

// Log processing events
auditLogger.info('Document processed', {
  documentId: 'CONTRACT-001',
  template: 'service-agreement.md',
  user: 'legal.dept@company.com',
  timestamp: new Date().toISOString(),
  outputFormat: 'pdf',
});
```

### 6. Timeout Protection

Prevent infinite loops and resource exhaustion:

```typescript
const secureOptions = {
  processingTimeout: 30000, // 30 second timeout
  maxImportDepth: 10, // Prevent deep recursion
  maxTemplateSize: '10MB', // Limit template size
  enableCircularRefDetection: true, // Detect circular imports
  maxVariableExpansions: 1000, // Prevent expansion bombs
};
```

## Helper Function Guidelines

### 1. Consistency in Format

Use the same date and number formats throughout documents:

```markdown
<!-- ✅ Good practice - Consistent formatting -->

Start date: {{formatDate(start_date, "DD/MM/YYYY")}} End date:
{{formatDate(end_date, "DD/MM/YYYY")}} Amount:
{{formatCurrency(contract_value, "EUR")}} Monthly fee:
{{formatCurrency(monthly_fee, "EUR")}}

<!-- ❌ Bad practice - Inconsistent formatting -->

Start date: {{formatDate(start_date, "DD/MM/YYYY")}} End date:
{{formatDate(end_date, "MMMM Do, YYYY")}} Amount: {{formatEuro(contract_value)}}
Monthly fee: {{formatDollar(monthly_fee)}}
```

### 2. Data Validation with Helpers

Combine helpers with conditionals to validate data:

```markdown
<!-- Validate and format with fallbacks -->

Amount: {{amount ? formatCurrency(amount, "EUR") : "[AMOUNT REQUIRED]"}}
Contact: {{contact_name ? capitalizeWords(contact_name) : "[NAME REQUIRED]"}}
Date: {{due_date ? formatDate(due_date, "DD/MM/YYYY") : "[DATE REQUIRED]"}}

<!-- Complex validation -->

Email:
{{client_email ? (contains(client_email, "@") ? lower(client_email) : "[INVALID EMAIL]") : "[EMAIL REQUIRED]"}}
```

### 3. Localization Support

Use variables to facilitate multi-language and regional support:

```yaml
---
# Localization configuration
locale: 'en-US'
currency: 'EUR'
date_format: 'DD/MM/YYYY'
number_format: 'european' # european, us, international
---
```

```markdown
<!-- Localized formatting -->

Price: {{formatCurrency(price, currency)}} Date:
{{formatDate(contract_date, date_format)}} Amount in words:
{{numberToWords(amount)}} {{currency_word}}
```

### 4. Complex Helper Documentation

Document complex helpers with clear comments:

```markdown
<!--
Complex ID Generation Formula:
- Client initials (uppercase)
- Current date (YYMMDD format)
- Sequence number (zero-padded to 3 digits)
Example: ABC250801001
-->

Contract ID:
{{upper(initials(client_name))}}{{formatDate(@today, "YYMMDD")}}{{padStart(sequence_number, 3, "0")}}

<!--
Payment calculation with currency conversion
Base amount × conversion rate × tax factor
-->

Total Payment:
{{formatCurrency(round(base_amount * conversion_rate * (1 + tax_rate), 2), target_currency)}}
```

## Error Prevention

### 1. Defensive Programming

Anticipate and handle common error scenarios:

```markdown
<!-- Check for null/undefined values -->

Client: {{client_name || "[CLIENT NAME REQUIRED]"}}

<!-- Validate number types -->

Amount:
{{typeof amount === 'number' ? formatCurrency(amount, "EUR") : "[INVALID AMOUNT]"}}

<!-- Handle array lengths -->

Services: {{services && services.length > 0 ? services.length : 0}} items

<!-- Date validation -->

Expiry:
{{expiry_date ? formatDate(expiry_date, "DD/MM/YYYY") : "[NO EXPIRY DATE]"}}
```

### 2. Type Safety

Ensure type consistency across templates:

```yaml
---
# Type definitions for validation
type_definitions:
  client_name: string
  contract_value: number
  start_date: date
  is_premium: boolean
  services: array
  contact_info: object
---
```

### 3. Testing Scenarios

Create comprehensive test cases:

```yaml
# test-data/minimal.yaml
client_name: "Test Client"
contract_value: 1000
start_date: "2025-08-01"

# test-data/complete.yaml
client_name: "Complete Test Corp"
contract_value: 50000
start_date: "2025-08-01"
end_date: "2026-07-31"
services: ["Consulting", "Development"]
special_terms: "Extended warranty included"

# test-data/edge-cases.yaml
client_name: "Ümlaut & Special Chars Inc."
contract_value: 999999.99
start_date: "2025-12-31"
```

```bash
# Test with different data sets
legal-md --test-data test-data/minimal.yaml template.md
legal-md --test-data test-data/complete.yaml template.md
legal-md --test-data test-data/edge-cases.yaml template.md
```

## Maintenance and Updates

### 1. Template Versioning

Implement systematic template versioning:

```yaml
---
# Template metadata
template_id: 'service-agreement-v2'
version: '2.1.0'
created_date: '2025-01-01'
last_modified: '@today'
author: 'Legal Department'
tested_with: ['legal-markdown-js@2.16.0']

# Compatibility
minimum_version: '2.15.0'
breaking_changes:
  - '2.0.0: Changed date format requirements'
  - '1.5.0: Updated variable naming convention'

# Dependencies
required_templates:
  - 'common/signatures.md'
  - 'common/definitions.md'
---
```

### 2. Change Management

Document and track template changes:

```markdown
<!-- CHANGELOG
v2.1.0 (2025-08-01):
- Added support for multi-currency contracts
- Enhanced liability clauses
- Fixed date formatting issues

v2.0.0 (2025-06-01):
- BREAKING: Changed variable naming from camelCase to snake_case
- Added comprehensive field validation
- Updated legal language for compliance

v1.5.0 (2025-04-01):
- Added optional insurance clauses
- Enhanced payment terms flexibility
- Minor formatting improvements
-->
```

### 3. Automated Testing

Set up continuous testing for templates:

```javascript
// template-tests.js
const testSuites = [
  {
    name: 'Service Agreement Tests',
    template: './templates/service-agreement.md',
    testCases: [
      {
        data: './test-data/minimal.yaml',
        expectedFields: ['client_name', 'amount'],
      },
      { data: './test-data/complete.yaml', expectedLength: '>1000' },
      { data: './test-data/edge-cases.yaml', shouldNotFail: true },
    ],
  },
];

// Run tests
testSuites.forEach(suite => {
  suite.testCases.forEach(testCase => {
    const result = processTemplate(suite.template, testCase.data);
    validateResult(result, testCase);
  });
});
```

### 4. Documentation Maintenance

Keep documentation current and comprehensive:

```markdown
<!-- Template documentation header -->
<!--
# Service Agreement Template

## Purpose
Standard professional services contract for IT consulting engagements.

## Required Variables
- client_name: Full legal name of client organization
- service_type: Type of services being provided
- contract_value: Total contract value in EUR
- start_date: Contract start date (YYYY-MM-DD format)

## Optional Variables
- end_date: Contract end date (defaults to start_date + 12 months)
- payment_terms: Payment terms in days (defaults to 30)
- special_clauses: Array of additional clauses

## Output Formats
- PDF: Formatted for printing and signing
- HTML: For web review and collaboration
- Markdown: For version control and editing

## Last Updated: 2025-08-01
## Next Review: 2025-11-01
-->
```

### 5. Monitoring and Analytics

Track template usage and performance:

```typescript
// Template analytics
const analytics = {
  trackUsage: true,
  logPerformance: true,
  reportErrors: true,
  metricsEndpoint: '/api/template-metrics',
};

// Usage tracking
trackTemplateUsage({
  templateId: 'service-agreement-v2',
  userId: 'legal.dept@company.com',
  processingTime: 1250, // milliseconds
  outputFormat: 'pdf',
  success: true,
});
```

## Conclusion

Following these best practices ensures that your Legal Markdown documents are
professional, secure, maintainable, and efficient. Regular review and updates of
these practices help maintain high standards as your document automation needs
evolve.

Key takeaways:

- **Structure** documents with comprehensive YAML frontmatter
- **Organize** templates modularly with imports and reusable components
- **Optimize** performance through caching and selective processing
- **Secure** inputs through validation and sanitization
- **Test** thoroughly with multiple data scenarios
- **Document** everything for future maintenance

## See Also

- [Configuration](configuration.md) - Global and project settings
- [Error Handling](error-handling.md) - Comprehensive error management
- [Batch Processing](batch-processing.md) - Efficient multi-document processing
- [Field Tracking](../processing/field-tracking.md) - Document completeness
  validation
