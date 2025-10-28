# Force Commands Feature

The `force_commands` feature allows Legal Markdown documents to specify their
own processing options directly in the YAML front matter. This enables automatic
configuration based on document content, ensuring consistent processing without
manual CLI flags.

## Overview

Documents can include a `force_commands` field in their YAML front matter that
contains command-line options. These commands are automatically parsed and
applied during processing.

## Syntax

```yaml
---
title: My Document
force_commands: >
  --css theme.css  --pdf --highlight --output-name {{title}}_{{formatDate date
  "YYYYMMDD"}}.pdf
---
```

## Supported Commands

### Output Control

- `--css <file>` - Custom CSS file path
- `--output-name <name>` - Custom output filename (supports templates)
- `--title <title>` - Document title override (supports templates)

### Format Options

- `--pdf` - Generate PDF output
- `--html` - Generate HTML output
- `--highlight` - Enable field highlighting
- `--format <format>` - PDF format (A4, letter, legal)
- `--landscape` - Landscape orientation

### Export Options

- `--export-yaml` - Export metadata as YAML
- `--export-json` - Export metadata as JSON
- `--output-path <path>` - Custom export path

### Debug Options

- `--debug` - Enable debug mode

## Template Variables

Force commands support full template variable resolution using document
metadata:

```yaml
force_commands: >
  --output-name Contract_{{client}}_{{formatDate date "YYYYMMDD"}}.pdf --title
  "{{titleCase document_type}} - {{client}}"
```

All Legal Markdown template helpers are available:

- `{{formatDate date "format"}}`
- `{{titleCase text}}`
- `{{formatCurrency amount currency}}`
- `{{numberToWords number}}`
- And more...

## Security Features

### Protected Commands

Certain commands are protected and cannot be overridden for security:

- `--stdin`, `--stdout` - I/O redirection
- `--yaml`, `--headers` - Core processing flags
- `--no-*` flags - Processing control

### Path Validation

File paths are validated to prevent directory traversal:

- Paths containing `..` are rejected
- Absolute paths starting with `/` are rejected

## Examples

### Basic PDF Generation

```yaml
---
title: Contract
client: Acme Corp
force_commands: --pdf --highlight --css corporate.css
---
```

### Complex Output Naming

```yaml
---
title: Service Agreement
client: Acme Corporation
effective_date: 2024-01-01
force_commands: >
  --output-name {{title}}_{{client}}_{{formatDate effective_date
  "YYYYMMDD"}}.pdf --pdf --export-yaml
---
```

### Multi-line Commands

```yaml
---
title: Legal Document
force_commands: |
  --css theme.css
  --pdf --highlight
  --export-json
  --title "{{title}} - Generated {{formatDate today "YYYY-MM-DD"}}"
---
```

## Usage

Simply include the `force_commands` field in your document's YAML front matter.
The commands will be automatically parsed and applied during processing:

```bash
# Process document with force commands
legal-md document.md

# Force commands are applied automatically
# No need for manual flags!
```

## Alternative Field Names

The feature supports multiple naming conventions:

- `force_commands` (recommended)
- `force-commands`
- `forceCommands`
- `commands`

## Integration

Force commands integrate seamlessly with:

- CLI processing
- Programmatic API usage
- Batch processing
- Web playground (future enhancement)

## Limitations

1. **Security**: Protected commands cannot be overridden
2. **Validation**: File paths are validated for security
3. **Template Context**: Only document metadata is available for templates
4. **Processing Order**: Force commands are applied before core processing

This feature enables document-driven configuration, making Legal Markdown
documents truly self-contained and portable.
