# YAML Front Matter

Every legal document starts with YAML front matter containing metadata and
variables that control document processing and provide data for template
substitution.

## Table of Contents

- [Basic Syntax](#basic-syntax)
- [Document Metadata](#document-metadata)
- [Variable Definitions](#variable-definitions)
- [Nested Objects](#nested-objects)
- [Arrays and Lists](#arrays-and-lists)
- [Special Fields](#special-fields)
- [Best Practices](#best-practices)

## Basic Syntax

YAML front matter appears at the beginning of your document, enclosed by triple
dashes:

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

## Document Metadata

### Essential Fields

```yaml
---
title: Software License Agreement
version: '1.2'
effective_date: 2024-01-01
document_type: license
jurisdiction: California
---
```

Common metadata fields:

- `title` - Document title
- `version` - Document version
- `effective_date` - When the document becomes effective
- `document_type` - Type of legal document
- `jurisdiction` - Applicable legal jurisdiction

### Processing Control

```yaml
---
# Header configuration
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'

# Processing options
enable_field_tracking: true
export_metadata: true
---
```

## Variable Definitions

### Simple Variables

```yaml
---
client_name: 'Acme Corporation'
license_fee: 5000
currency: 'USD'
payment_days: 30
include_warranty: true
---
```

Usage in document:

```markdown
This agreement is with {{client_name}}. The license fee is
{{formatCurrency(license_fee, currency)}}. Payment is due within
{{payment_days}} days.
```

### Nested Objects

```yaml
---
client:
  company:
    name: Acme Corporation
    address:
      street: 123 Business St
      city: San Francisco
      state: CA
      zip: '94105'
  contact:
    name: John Smith
    email: john@acme.com
    phone: '+1-555-0123'
---
```

Usage:

```markdown
Company: {{client.company.name}} Address: {{client.company.address.street}},
{{client.company.address.city}}, {{client.company.address.state}} Contact:
{{client.contact.name}} ({{client.contact.email}})
```

## Arrays and Lists

### Simple Arrays

```yaml
---
services:
  - 'Legal Consulting'
  - 'Contract Review'
  - 'Compliance Audit'

included_features:
  - Standard support
  - Basic warranty
  - Email assistance
---
```

### Object Arrays

```yaml
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
```

Usage with template loops:

```markdown
## Invoice Items

{{#items}}

- **{{name}}**: {{description}} Price: {{formatCurrency(price, "USD")}}
  {{/items}}
```

## Special Fields

### Reserved Processing Fields

Certain fields have special meaning in Legal Markdown:

```yaml
---
# Header numbering configuration
level-one: 'Chapter %n:'
level-two: 'Section %l1.%l2'
level-three: 'Subsection (%n)'
level-indent: 2.0

# Force commands (document-driven configuration)
force_commands: '--pdf --highlight --css contract.css'

# Metadata export
meta-yaml-output: 'metadata.yaml'
meta-json-output: 'metadata.json'
---
```

### Protected Fields

These fields are automatically generated and cannot be overridden by imports:

- `_cross_references` - Automatically generated cross-reference metadata
- `_processing_stats` - Document processing statistics
- `_import_tree` - Import dependency tree

### Date Fields

```yaml
---
# Special date value
contract_date: '@today'

# Specific dates
start_date: 2024-01-01
end_date: 2024-12-31

# Calculated dates using helpers
due_date: '{{addDays(contract_date, 30)}}'
expiry_date: '{{addYears(start_date, 3)}}'
---
```

## Best Practices

### Organization

**Group related fields:**

```yaml
---
# Document metadata
title: Service Agreement
version: '2.1'
effective_date: 2024-01-01

# Client information
client:
  name: Acme Corporation
  type: enterprise
  region: US

# Financial terms
amount: 50000
currency: USD
payment_terms: 30

# Feature flags
features:
  include_warranty: true
  premium_support: false
  extended_terms: true
---
```

### Naming Conventions

**Use descriptive, consistent names:**

```yaml
---
# ✅ Good - clear and descriptive
client_company_name: 'Acme Corp'
license_start_date: 2024-01-01
include_confidentiality_clause: true

# ❌ Avoid - unclear or inconsistent
name: 'Acme Corp'
date1: 2024-01-01
flag: true
---
```

### Data Types

**Be explicit about data types:**

```yaml
---
# Strings (quoted for safety)
title: 'Software License Agreement'
client_name: 'Acme Corporation'

# Numbers (unquoted)
amount: 50000
tax_rate: 0.21

# Booleans (unquoted)
include_warranty: true
is_premium: false

# Dates (quoted if using special formats)
effective_date: '2024-01-01'
current_date: '@today'
---
```

### Comments and Documentation

```yaml
---
# Document Configuration
title: 'Professional Services Agreement'
version: '3.0' # Updated for new compliance requirements

# Client Details
client:
  name: 'Acme Corporation'
  type: 'enterprise' # Determines available features
  region: 'US' # Affects applicable regulations

# Financial Terms
base_amount: 75000 # Base service fee
tax_rate: 0.08 # State tax rate for jurisdiction
payment_terms: 15 # Days until payment due

# Feature Toggles
features:
  premium_support: true # Enable 24/7 support clause
  extended_warranty: false # Standard warranty only
  compliance_addendum: true # Required for enterprise clients
---
```

### Security Considerations

**Avoid sensitive information in frontmatter:**

```yaml
---
# ✅ Good - reference to secure data
client_reference: 'CLIENT_001'
contract_template: 'enterprise_v2'

# ❌ Avoid - sensitive data
# client_ssn: "123-45-6789"
# account_password: "secret123"
# api_key: "sk_live_abcd1234"
---
```

### Validation and Error Prevention

**Provide fallback values:**

```yaml
---
# Required fields with defaults
client_name: "{{client_name || '[CLIENT NAME REQUIRED]'}}"
effective_date: "{{effective_date || '@today'}}"

# Optional fields with sensible defaults
payment_terms: '{{payment_terms || 30}}'
currency: "{{currency || 'USD'}}"
include_warranty: '{{include_warranty || false}}'
---
```

## Common Patterns

### Legal Document Template

```yaml
---
# Document Information
title: "{{document_type || 'Legal Agreement'}}"
version: '1.0'
effective_date: '@today'
jurisdiction: "{{jurisdiction || 'California'}}"

# Parties
party_a:
  name: '{{party_a_name}}'
  type: "{{party_a_type || 'individual'}}"
  address: '{{party_a_address}}'

party_b:
  name: '{{party_b_name}}'
  type: "{{party_b_type || 'corporation'}}"
  address: '{{party_b_address}}'

# Terms
financial:
  amount: '{{contract_amount}}'
  currency: "{{currency || 'USD'}}"
  payment_terms: '{{payment_terms || 30}}'

duration:
  start_date: '{{start_date || effective_date}}'
  end_date: '{{end_date}}'
  auto_renewal: '{{auto_renewal || false}}'

# Configuration
processing:
  enable_highlighting: true
  export_metadata: true
  archive_original: true
---
```

## See Also

- [Variables & Mixins](mixins-variables.md) - Using variables in document
  content
- [Partial Imports](partial-imports.md) - Merging frontmatter from imported
  files
- [Template Loops](template-loops.md) - Iterating over arrays in frontmatter
- [Force Commands](force-commands.md) - Document-driven configuration
