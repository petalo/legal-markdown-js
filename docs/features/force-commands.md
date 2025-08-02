# Force Commands

The Force Commands feature enables **document-driven configuration**, allowing
documents to specify their own processing options directly in the YAML front
matter. This makes documents self-configuring and eliminates the need for manual
CLI flags.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Template Variables](#template-variables)
- [Available Commands](#available-commands)
- [Alternative Field Names](#alternative-field-names)
- [Security Features](#security-features)
- [Command Priority](#command-priority)
- [Multi-line Commands](#multi-line-commands)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## Overview

Force commands allow documents to embed their processing configuration directly
in the YAML frontmatter, making them portable and self-contained. When a
document contains force commands, those commands automatically override any CLI
arguments.

### Key Benefits

- **Self-configuring documents**: No need to remember specific CLI flags
- **Portability**: Documents work the same across different environments
- **Template variables**: Dynamic configuration based on document content
- **Consistency**: Ensures documents are always processed with correct settings

## Basic Usage

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

## Template Variables

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

### Dynamic File Naming

```yaml
---
client_code: 'ACME'
project_id: 'PRJ-2024-001'
document_version: 'v2.1'
generation_date: '@today'

force_commands: >
  --output-name
  {{client_code}}_{{project_id}}_{{document_version}}_{{formatDate(generation_date,
  "YYYYMMDD")}}.pdf --title "Project Agreement - {{client_code}} {{project_id}}
  {{document_version}}" --pdf --highlight
---
```

**Result**: `ACME_PRJ-2024-001_v2.1_20240715.pdf`

### Conditional Configuration

```yaml
---
client_type: 'enterprise'
region: 'US'
compliance_required: true

force_commands: >
  --pdf --highlight {{#if client_type == "enterprise"}}--css
  enterprise-theme.css{{/if}} {{#if compliance_required}}--export-yaml
  --export-json{{/if}} {{#if region == "US"}}--format letter{{else}}--format
  A4{{/if}}
---
```

## Available Commands

All CLI options are supported in force_commands:

### Output Control

| Command                | Description            | Example                                 |
| ---------------------- | ---------------------- | --------------------------------------- |
| `--css <file>`         | Custom CSS file        | `--css corporate.css`                   |
| `--output-name <name>` | Custom output filename | `--output-name Contract_{{client}}.pdf` |
| `--title <title>`      | Document title         | `--title "{{title}} - {{client}}"`      |

### Format Generation

| Command        | Description                    | Example       |
| -------------- | ------------------------------ | ------------- |
| `--pdf`        | Generate PDF output            | `--pdf`       |
| `--html`       | Generate HTML output           | `--html`      |
| `--format <f>` | PDF format (A4, letter, legal) | `--format A4` |
| `--landscape`  | Landscape orientation          | `--landscape` |

### Features

| Command         | Description               | Example         |
| --------------- | ------------------------- | --------------- |
| `--highlight`   | Enable field highlighting | `--highlight`   |
| `--export-yaml` | Export metadata as YAML   | `--export-yaml` |
| `--export-json` | Export metadata as JSON   | `--export-json` |

### Processing Control

| Command                       | Description                   | Example                       |
| ----------------------------- | ----------------------------- | ----------------------------- |
| `--disable-frontmatter-merge` | Disable frontmatter merging   | `--disable-frontmatter-merge` |
| `--validate-import-types`     | Validate type compatibility   | `--validate-import-types`     |
| `--log-import-operations`     | Log detailed merge operations | `--log-import-operations`     |
| `--debug`                     | Enable debug mode             | `--debug`                     |

## Alternative Field Names

The feature supports multiple naming conventions for flexibility:

```yaml
# All of these work identically:
force_commands: --pdf --highlight # Recommended
force-commands: --pdf --highlight # Kebab case
forceCommands: --pdf --highlight # Camel case
commands: --pdf --highlight # Short form
```

Choose the style that matches your project's YAML conventions.

## Security Features

Force commands include built-in security measures to prevent malicious usage:

### Protected Commands

Critical system options cannot be overridden:

```yaml
# These commands are blocked for security
force_commands: >
  --stdin --stdout    # I/O redirection (blocked) --yaml --headers    # Core
  processing flags (blocked) --no-mixins         # Processing control (blocked)
```

**Protected command categories:**

- `--stdin`, `--stdout` (I/O redirection)
- `--yaml`, `--headers` (Core processing flags)
- `--no-*` flags (Processing control)

### Path Validation

File paths are validated to prevent security issues:

```yaml
# ✅ Safe - relative paths within project
force_commands: --css styles/contract.css

# ❌ Blocked - directory traversal
force_commands: --css ../../../etc/passwd

# ❌ Blocked - absolute paths
force_commands: --css /etc/sensitive-file
```

**Path validation rules:**

- Paths containing `..` are rejected (prevents directory traversal)
- Absolute paths starting with `/` are rejected
- Only relative paths within the project are allowed

### Template Sandboxing

Template resolution is limited to document metadata only:

```yaml
---
client_name: 'Acme Corp'
# Only document variables are available for template resolution
force_commands: --title "Contract for {{client_name}}" # ✅ Safe
# force_commands: --title "{{system.env.PASSWORD}}"     # ❌ Blocked
---
```

## Command Priority

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

### Override Behavior

1. **Force commands win**: Document settings always override CLI
2. **Complete replacement**: CLI arguments are ignored when force commands exist
3. **No merging**: Force commands completely replace CLI options

## Multi-line Commands

For complex configurations, use YAML multi-line syntax:

### Folded Scalar (`>`)

```yaml
---
force_commands: >
  --css corporate-theme.css --pdf --highlight --format A4 --export-yaml
  --export-json --title "{{document_type}} - Generated {{formatDate(@today,
  "YYYY-MM-DD")}}" --output-name {{document_type}}_{{client}}_Final.pdf
---
```

### Literal Scalar (`|`)

```yaml
---
force_commands: |
  --css corporate-theme.css
  --pdf --highlight --format A4
  --export-yaml --export-json
  --title "{{document_type}} - Generated {{formatDate(@today, "YYYY-MM-DD")}}"
  --output-name {{document_type}}_{{client}}_Final.pdf
---
```

### Array Format

```yaml
---
force_commands:
  - '--css corporate-theme.css'
  - '--pdf --highlight'
  - '--export-yaml --export-json'
  - '--title {{document_type}} - {{client}}'
---
```

## Use Cases

### Self-Configuring Documents

Documents that specify their own styling and output requirements:

```yaml
---
document_type: 'legal_brief'
jurisdiction: 'california'

force_commands: --css legal-brief.css --pdf --format legal --landscape
---
```

### Template-Driven Output

Dynamic file naming based on document content:

```yaml
---
case_number: '2024-CV-001'
document_type: 'motion'
filing_date: '@today'

force_commands: >
  --output-name {{case_number}}_{{document_type}}_{{formatDate(filing_date,
  "YYYYMMDD")}}.pdf --title "{{titleCase(document_type)}} - Case
  {{case_number}}" --pdf --highlight
---
```

### Workflow Integration

Automatic metadata export for downstream processing:

```yaml
---
workflow_stage: 'final_review'
export_required: true

force_commands: >
  --pdf --highlight {{#if export_required}}--export-json --export-yaml{{/if}}
  --title "{{document_type}} - {{workflow_stage}}"
---
```

### Client-Specific Styling

Different styling based on client requirements:

```yaml
---
client_code: 'ACME'
client_name: 'Acme Corporation'
document_type: 'service_agreement'

force_commands: >
  --css {{client_code}}-theme.css --title "{{client_name}} -
  {{titleCase(document_type)}}" --pdf --highlight --format A4
---
```

### Environment-Specific Configuration

```yaml
---
environment: 'production'
debug_mode: false

force_commands: >
  --pdf --highlight {{#if debug_mode}}--debug{{/if}} {{#if environment ==
  "production"}}--export-yaml{{/if}}
---
```

## Best Practices

### 1. Use Template Variables

Make force commands dynamic with template variables:

```yaml
# ✅ Good - dynamic configuration
force_commands: >
  --title "{{document_type}} - {{client_name}}"
  --output-name {{client_code}}_{{formatDate(@today, "YYYYMMDD")}}.pdf

# ❌ Static - hard to reuse
force_commands: --title "Contract - Acme Corp" --output-name contract.pdf
```

### 2. Document Complex Commands

Comment complex force command configurations:

```yaml
---
# Force commands configuration:
# - PDF output with corporate styling
# - Field highlighting for review
# - Metadata export for workflow integration
# - Dynamic naming based on client and date
force_commands: >
  --css corporate-theme.css --pdf --highlight --export-yaml --export-json
  --title "{{document_type}} - {{client_name}}" --output-name
  {{client_code}}_{{formatDate(@today, "YYYYMMDD")}}.pdf
---
```

### 3. Test Template Resolution

Verify template variables resolve correctly:

```bash
# Test with debug mode
legal-md document.md --debug
```

### 4. Use Consistent Naming

Be consistent with field naming conventions:

```yaml
# ✅ Good - consistent field names
client_name: 'Acme Corp'
client_code: 'ACME'
document_type: 'service_agreement'

force_commands: >
  --title "{{titleCase(document_type)}} - {{client_name}}" --output-name
  {{client_code}}_{{document_type}}.pdf
```

### 5. Handle Missing Variables

Provide fallbacks for optional variables:

```yaml
---
client_name: 'Acme Corp'
project_code: '' # Might be empty

force_commands: >
  --title "Contract - {{client_name}}" --output-name {{client_name}}{{#if
  project_code}}_{{project_code}}{{/if}}.pdf
---
```

### 6. Organize by Purpose

Group related force command configurations:

```yaml
---
# Document identification
document_type: 'service_agreement'
client_name: 'Acme Corporation'
version: '2.1'

# Output configuration
force_commands: >
  --pdf --highlight --format A4 --css corporate-theme.css --title
  "{{titleCase(document_type)}} - {{client_name}} v{{version}}" --output-name
  {{titleCase(document_type)}}_{{client_name}}_v{{version}}.pdf --export-yaml
  --export-json
---
```

## Common Patterns

### Enterprise Contract Template

```yaml
---
# Contract metadata
contract_type: 'enterprise_service_agreement'
client:
  name: 'Acme Corporation'
  code: 'ACME'
  tier: 'enterprise'
effective_date: '@today'
version: '3.1'

# Processing configuration
force_commands: >
  --css templates/{{client.tier}}-theme.css --pdf --highlight --format A4
  --title "{{titleCase(replaceAll(contract_type, '_', ' '))}} - {{client.name}}
  v{{version}}" --output-name
  {{client.code}}_{{contract_type}}_v{{version}}_{{formatDate(effective_date,
  "YYYYMMDD")}}.pdf --export-yaml --export-json
---
```

### Legal Brief Template

```yaml
---
# Case information
case:
  number: '2024-CV-001'
  title: 'Motion to Dismiss'
  court: 'Superior Court of California'
attorney:
  name: 'Sarah Johnson'
  bar_number: '123456'
filing_date: '@today'

# Brief-specific configuration
force_commands: >
  --css legal-brief.css --pdf --format legal --landscape --title "{{case.title}}
  - Case {{case.number}}" --output-name
  {{case.number}}_{{kebabCase(case.title)}}_{{formatDate(filing_date,
  "YYYYMMDD")}}.pdf --export-yaml
---
```

### Invoice Template

```yaml
---
# Invoice details
invoice:
  number: "INV-{{formatDate(@today, 'YYYYMMDD')}}-001"
  date: '@today'
client:
  name: 'Acme Corporation'
  code: 'ACME'
billing_period: "{{formatDate(addMonths(@today, -1), 'MMMM YYYY')}}"

# Invoice-specific processing
force_commands: >
  --css invoice-template.css --pdf --format A4 --title "Invoice
  {{invoice.number}} - {{client.name}}" --output-name
  {{client.code}}_{{invoice.number}}.pdf --export-json
---
```

## See Also

- [YAML Frontmatter](yaml-frontmatter.md) - Defining variables for force
  commands
- [Variables & Mixins](mixins-variables.md) - Using template variables in
  commands
- [CLI Reference](../cli_reference.md) - Available command options
- [PDF Generation](../output/pdf-generation.md) - PDF-specific options
