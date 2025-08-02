# Partial Imports and Frontmatter Merging

Include content from other files and automatically merge YAML frontmatter for
modular document composition.

## Table of Contents

- [Basic Imports](#basic-imports)
- [Frontmatter Merging](#frontmatter-merging)
- [Merge Strategies](#merge-strategies)
- [Security Features](#security-features)
- [Configuration Options](#configuration-options)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## Basic Imports

Include content from other files using the `@import` directive:

### Simple Import

```markdown
@import boilerplate/header.md

l. Terms and Conditions

@import clauses/confidentiality.md

@import clauses/payment.md

@import boilerplate/footer.md
```

### File Structure Example

```text
project/
├── main-contract.md
├── boilerplate/
│   ├── header.md
│   └── footer.md
└── clauses/
    ├── confidentiality.md
    ├── payment.md
    └── termination.md
```

### Import Processing

When Legal Markdown processes imports:

1. **File Resolution**: Locates imported files relative to the main document
2. **Content Inclusion**: Inserts the imported content at the import location
3. **Frontmatter Merging**: Automatically merges YAML metadata (see below)
4. **Recursive Processing**: Imported files can contain their own imports

## Frontmatter Merging

Legal Markdown JS automatically merges YAML frontmatter from imported files into
the main document's metadata using a **"source always wins"** strategy.

### Basic Frontmatter Merging

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

### Granular Property-Level Merging

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

## Merge Strategies

### Source Always Wins Strategy

Legal Markdown uses a **"source always wins"** strategy where:

1. **Main document** values always take precedence
2. **First import** wins over subsequent imports for the same field
3. **New fields** from imports are added to the metadata

### Sequential Import Processing

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

## Security Features

### Reserved Fields Security

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
- `_cross_references` (protected metadata fields)

### Timeout Protection

The frontmatter merging system includes timeout protection to prevent infinite
loops from circular references.

## Configuration Options

### CLI Options

```bash
# Default behavior: frontmatter merging enabled
legal-md contract-template.md output.md

# Disable frontmatter merging
legal-md contract-template.md --disable-frontmatter-merge output.md

# Enable import tracing for debugging
legal-md contract-template.md --import-tracing output.md

# Validate type compatibility during merging
legal-md contract-template.md --validate-import-types output.md

# Log detailed merge operations
legal-md contract-template.md --log-import-operations output.md

# Combine multiple import options
legal-md template.md --import-tracing --validate-import-types --log-import-operations output.md
```

### Advanced Frontmatter Features

**Type Validation**: Enable strict type checking during merge operations:

```bash
# Validate types during frontmatter merging
legal-md contract.md --validate-import-types
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
legal-md contract.md --log-import-operations
```

## Use Cases

### Legal Document Assembly

- **Standard Terms**: Common clauses with default values
- **Client Terms**: Client-specific overrides and additions
- **Project Terms**: Project-specific parameters
- **Regulatory Terms**: Jurisdiction-specific requirements

### Template Composition

- **Base Templates**: Core document structure with defaults
- **Component Library**: Reusable sections with metadata
- **Customization Layers**: Client/project specific modifications
- **Compliance Overlays**: Industry-specific requirements

### Example: Enterprise Contract Assembly

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

### Document Modularization

**Main Contract** (`enterprise-agreement.md`):

```yaml
---
title: "Enterprise Service Agreement"
client_type: "enterprise"
liability_limit: 5000000
---

@import sections/definitions.md
@import sections/service-terms.md
@import sections/payment-terms.md
@import sections/termination.md
```

**Service Terms** (`sections/service-terms.md`):

```yaml
---
service_level: 'premium'
support_hours: '24x7'
response_time: '1 hour'
liability_limit: 1000000 # Lower than main - main wins
---
l. **Service Terms**

Client will receive {{service_level}} service with {{support_hours}} support and
{{response_time}} response time.
```

**Final Result**: Main document's higher liability limit (5M) is preserved,
while service-specific metadata is added.

### Template Library System

```text
templates/
├── contracts/
│   ├── base-contract.md
│   ├── enterprise-contract.md
│   └── standard-contract.md
├── clauses/
│   ├── confidentiality.md
│   ├── payment-terms.md
│   ├── termination.md
│   └── warranty.md
└── metadata/
    ├── client-defaults.md
    ├── enterprise-defaults.md
    └── compliance-eu.md
```

**Usage:**

```markdown
---
title: 'Custom Enterprise Agreement'
---

@import metadata/enterprise-defaults.md
@import metadata/client-defaults.md
@import contracts/base-contract.md
@import clauses/confidentiality.md
@import clauses/warranty.md
@import metadata/compliance-eu.md
```

## Best Practices

### 1. Structure Hierarchy

Put most general settings in main document:

```yaml
# Main document - general settings
---
title: "Service Agreement"
version: "2.0"
effective_date: "@today"
currency: "USD"
---

# Imports provide specific details
@import client-specific.md    # Client overrides
@import service-details.md    # Service-specific terms
```

### 2. Use Descriptive Names

Name import files by their purpose:

```markdown
@import metadata/client-acme-corp.md @import clauses/enterprise-warranty.md
@import terms/california-compliance.md
```

### 3. Document Precedence

Comment which fields should win conflicts:

```yaml
---
# Main document values (highest priority)
liability_cap: 10000000  # Enterprise minimum - do not override
payment_terms: "Net 15"  # Fast payment required

# Import will add client details but won't override above
---

@import client-metadata.md
```

### 4. Validate Types

Use `--validate-import-types` in CI/CD:

```bash
# In your build pipeline
legal-md contract-template.md --validate-import-types --log-import-operations
```

### 5. Security First

Never import untrusted content without validation:

```yaml
# ✅ Good - trusted internal components
@import internal/standard-terms.md
@import internal/client-metadata.md

# ❌ Dangerous - external or user-provided content
# @import user-uploads/custom-terms.md
# @import external/untrusted-content.md
```

### 6. Test Thoroughly

Verify merged metadata matches expectations:

```bash
# Export metadata to verify merge results
legal-md contract.md --export-yaml --output-path ./debug/
```

### 7. Import Organization

Organize imports logically:

```markdown
---
title: 'Main Contract'
---

# Metadata imports first

@import metadata/client-defaults.md @import metadata/project-settings.md

# Content imports

@import content/definitions.md @import content/main-terms.md

# Compliance last (highest specificity)

@import compliance/gdpr-terms.md
```

## Common Patterns

### Multi-Tenant Template System

```yaml
# tenant-specific.md
---
tenant:
  name: 'Acme Corp'
  tier: 'enterprise'
  region: 'US'
branding:
  logo: 'acme-logo.png'
  colors: '#ff0000'
---
```

```yaml
# service-level.md
---
sla:
  uptime: '99.9%'
  support: '24x7'
  response: '1 hour'
tenant:
  tier: 'standard' # Will be overridden by tenant-specific
---
```

```markdown
# main-contract.md

---

title: "Service Agreement" effective_date: "@today"

---

@import metadata/tenant-specific.md # Specific tenant config @import
metadata/service-level.md # Service defaults @import content/standard-terms.md #
Standard legal terms
```

### Compliance Framework

```markdown
# base-contract.md

---

compliance: gdpr: false hipaa: false sox: false

---

@import base-terms.md

# GDPR-specific additions

{{#if compliance.gdpr}} @import compliance/gdpr-clauses.md {{/if}}

# HIPAA-specific additions

{{#if compliance.hipaa}} @import compliance/hipaa-clauses.md {{/if}}
```

## See Also

- [YAML Frontmatter](yaml-frontmatter.md) - Understanding metadata structure
- [Optional Clauses](optional-clauses.md) - Using imported metadata in
  conditions
- [Variables & Mixins](mixins-variables.md) - Using merged variables in content
- [CLI Reference](../cli_reference.md) - Import-related command options
