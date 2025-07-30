# CLI Reference

Complete command-line interface documentation for Legal Markdown JS.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Command Syntax](#command-syntax)
- [Options Reference](#options-reference)
- [Processing Options](#processing-options)
- [Output Options](#output-options)
- [Format Options](#format-options)
- [Source File Archiving](#source-file-archiving)
- [Advanced Options](#advanced-options)
- [Input/Output Methods](#inputoutput-methods)
- [Examples](#examples)
- [Exit Codes](#exit-codes)
- [Configuration Files](#configuration-files)
- [Troubleshooting](#troubleshooting)

## Basic Usage

```bash
legal-md [options] [input] [output]
```

The CLI accepts an input file and optional output file. If no output file is
specified, the processed content is written to stdout.

## Command Syntax

### Positional Arguments

```bash
legal-md input.md output.md
```

- `input`: Path to the input file (required unless using `--stdin`)
- `output`: Path to the output file (optional, defaults to stdout)

### Global Options

```bash
legal-md --help
legal-md --version
```

## Options Reference

### Help and Version

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--help`, `-h`    | Display help information    |
| `--version`, `-v` | Display version information |

### Processing Control

| Option                        | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `--debug`, `-d`               | Enable debug mode with detailed output                    |
| `--yaml`, `-y`                | Process only YAML front matter                            |
| `--headers`                   | Process only headers                                      |
| `--no-headers`                | Skip header processing                                    |
| `--no-clauses`                | Skip optional clause processing                           |
| `--no-references`             | Skip cross-reference processing                           |
| `--no-imports`                | Skip import processing                                    |
| `--no-mixins`                 | Skip mixin processing                                     |
| `--enable-field-tracking`     | Add field tracking spans to markdown output               |
| `--disable-frontmatter-merge` | Disable automatic frontmatter merging from imported files |
| `--import-tracing`            | Add HTML comments showing imported content boundaries     |
| `--validate-import-types`     | Validate type compatibility during frontmatter merging    |
| `--log-import-operations`     | Log detailed frontmatter merge operations                 |

### Output Control

| Option                              | Description                       |
| ----------------------------------- | --------------------------------- |
| `--stdout`                          | Write output to standard output   |
| `--stdin`                           | Read input from standard input    |
| `--to-markdown`                     | Convert output to markdown format |
| `--export-yaml`                     | Export metadata as YAML           |
| `--export-json`                     | Export metadata as JSON           |
| `--output-path <path>`, `-o <path>` | Specify output path for metadata  |

### Format Generation

| Option                   | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `--pdf`                  | Generate PDF output                                          |
| `--html`                 | Generate HTML output                                         |
| `--highlight`            | Enable field highlighting in HTML/PDF                        |
| `--css <path>`           | Path to custom CSS file                                      |
| `--title <title>`        | Document title for HTML/PDF                                  |
| `--archive-source [dir]` | Archive source file after successful processing to directory |

### Advanced Processing

| Option               | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `--no-reset`         | Disable header numbering reset (continuous numbering) |
| `--no-indent`        | Disable header indentation (flat formatting)          |
| `--throwOnYamlError` | Throw error on invalid YAML                           |

## Processing Options

### Basic Processing

```bash
# Standard processing
legal-md input.md output.md

# Debug mode
legal-md --debug input.md output.md

# Process only specific parts
legal-md --yaml input.md output.md          # Only YAML front matter
legal-md --headers input.md output.md       # Only headers
```

### Selective Processing

```bash
# Skip specific processors
legal-md --no-headers input.md output.md     # Skip headers
legal-md --no-mixins input.md output.md      # Skip mixins
legal-md --no-clauses input.md output.md     # Skip optional clauses
legal-md --no-references input.md output.md  # Skip cross-references
legal-md --no-imports input.md output.md     # Skip imports

# Enable field tracking in markdown output
legal-md --enable-field-tracking input.md output.md  # Add HTML spans for tracking

# Combine multiple skip options
legal-md --no-headers --no-mixins input.md output.md
```

### Field Tracking Options

```bash
# Enable field tracking in markdown output (Ruby compatibility: disabled by default)
legal-md --enable-field-tracking input.md output.md

# Field tracking is automatically enabled for HTML and PDF output
legal-md --html --highlight input.md        # HTML with field tracking
legal-md --pdf --highlight input.md         # PDF with field tracking
```

**Note**: Field tracking adds HTML `<span>` elements to mark template variables
and expressions in the output. This is useful for document review and debugging,
but may not be desired for clean markdown output. The feature maintains
compatibility with the original Ruby LegalMarkdown by being disabled by default
for markdown output.

### Frontmatter Merging Options

Legal Markdown JS automatically merges frontmatter (YAML metadata) from imported
files into the main document. This powerful feature allows template composition
and data inheritance.

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

**Frontmatter Merging Features:**

- **Automatic Merging**: Imported files' YAML frontmatter is automatically
  merged into the main document
- **Type Validation**: Optional validation ensures compatible data types during
  merging
- **Import Tracing**: HTML comments mark imported content boundaries for
  debugging
- **Detailed Logging**: Comprehensive logging of merge operations for
  troubleshooting
- **Conflict Resolution**: Smart handling of conflicting keys between documents

### Header Processing Options

```bash
# Continuous numbering (don't reset at each level)
legal-md --no-reset input.md output.md

# Flat formatting (no indentation)
legal-md --no-indent input.md output.md

# Both options
legal-md --no-reset --no-indent input.md output.md
```

## Output Options

### Standard Output

```bash
# Process to file
legal-md input.md output.md

# Process to stdout
legal-md input.md --stdout
legal-md input.md  # Same as above when no output file specified
```

### Metadata Export

```bash
# Export metadata as YAML
legal-md --export-yaml input.md output.md

# Export metadata as JSON
legal-md --export-json input.md output.md

# Custom metadata output path
legal-md --export-json --output-path ./metadata input.md output.md
```

## Format Options

### PDF Generation

```bash
# Generate PDF
legal-md input.md --pdf

# PDF with custom title
legal-md input.md --pdf --title "Legal Document"

# PDF with highlighting
legal-md input.md --pdf --highlight

# PDF with custom CSS
legal-md input.md --pdf --css ./styles/legal.css

# PDF with all options
legal-md input.md --pdf --highlight --title "Contract" --css ./styles/contract.css
```

### HTML Generation

```bash
# Generate HTML
legal-md input.md --html

# HTML with highlighting
legal-md input.md --html --highlight

# HTML with custom CSS
legal-md input.md --html --css ./styles/legal.css

# HTML with title
legal-md input.md --html --title "Legal Document"
```

### Combined Output

```bash
# Generate both PDF and HTML
legal-md input.md --pdf --html --highlight --title "Contract"
```

### Source File Archiving

Legal Markdown JS features **smart archiving** that automatically moves source
files to a specified directory after successful processing. The system
intelligently handles different content scenarios to optimize file management.

```bash
# Archive to default directory (from ARCHIVE_DIR env var or 'processed')
legal-md input.md --archive-source

# Archive to custom directory
legal-md input.md --archive-source ./completed

# Archive with PDF generation
legal-md input.md --pdf --archive-source ./processed-pdfs

# Archive with custom directory path
legal-md input.md --archive-source "/path/to/archive"
```

#### Smart Archiving Logic

The archiving system compares the original file content with the processed
content to determine the optimal archiving strategy:

**Identical Content** (static documents):

```bash
# Original document with only metadata changes
document.md → archive/document.md
```

When the processed content is identical to the original (e.g., documents with
only frontmatter differences), only the original file is archived. This
preserves reusable template files.

**Different Content** (documents with imports/processing):

```bash
# Document with imports, mixins, or template processing
document.md → archive/document.ORIGINAL.md   # Template file
            → archive/document.PROCESSED.md  # Processed result
```

When processing changes the content (e.g., resolving imports, applying mixins),
both versions are archived with clear suffixes:

- `.ORIGINAL` - The source template file
- `.PROCESSED` - The fully processed content

#### Archive Features

- **Smart Content Comparison**: Automatically detects whether content changed
  during processing
- **Dual Archiving**: Preserves both template and processed versions when
  content differs
- **Template Preservation**: Keeps reusable templates intact for static
  documents
- **Content Normalization**: Handles line ending and whitespace differences
  intelligently
- **Automatic Directory Creation**: Archive directories are created if they
  don't exist
- **Conflict Resolution**: If files with the same name exist, they are
  automatically renamed (e.g., `document_1.md`, `document.ORIGINAL_1.md`)
- **Error Handling**: Processing continues even if archiving fails (with
  warnings)
- **Path Resolution**: Supports both relative and absolute archive paths

#### Configuration

The default archive directory can be configured via environment variables:

```bash
# Set default archive directory
export ARCHIVE_DIR="./processed"

# Use in command
legal-md input.md --archive-source  # Uses ./processed
```

See [Configuration Files](#configuration-files) for more details on environment
setup.

## Force Commands

Legal Markdown supports **document-driven configuration** through the
`force_commands` feature. This allows documents to specify their own processing
options directly in the YAML front matter, making documents self-configuring and
portable.

### Basic Usage

Add a `force_commands` field to your document's YAML front matter:

```yaml
---
title: Service Agreement
client: Acme Corp
force_commands: --pdf --highlight --css corporate.css
---
# {{title}}

This agreement is between us and {{client}}.
```

When processed, this document will automatically:

- Generate PDF output
- Enable field highlighting
- Apply corporate.css styling

### Syntax

```yaml
---
force_commands: >
  --css theme.css --pdf --highlight --output-name {{title}}_{{formatDate(date,
  "YYYYMMDD")}}.pdf --title "{{title}} - {{client}}"
---
```

### Supported Commands

All CLI options are supported in force_commands:

| Command                | Description                    | Example                                 |
| ---------------------- | ------------------------------ | --------------------------------------- |
| `--css <file>`         | Custom CSS file                | `--css corporate.css`                   |
| `--output-name <name>` | Custom output filename         | `--output-name Contract_{{client}}.pdf` |
| `--pdf`                | Generate PDF output            | `--pdf`                                 |
| `--html`               | Generate HTML output           | `--html`                                |
| `--highlight`          | Enable field highlighting      | `--highlight`                           |
| `--export-yaml`        | Export metadata as YAML        | `--export-yaml`                         |
| `--export-json`        | Export metadata as JSON        | `--export-json`                         |
| `--title <title>`      | Document title                 | `--title "{{title}} - {{client}}"`      |
| `--format <format>`    | PDF format (A4, letter, legal) | `--format A4`                           |
| `--landscape`          | Landscape orientation          | `--landscape`                           |
| `--debug`              | Enable debug mode              | `--debug`                               |

### Template Support

Force commands support full template variable resolution:

```yaml
---
client_name: Acme Corporation
effective_date: 2024-01-01
force_commands: >
  --output-name Contract_{{titleCase(client_name)}}_{{formatDate(effective_date,
  "YYYYMMDD")}}.pdf --title "Agreement - {{client_name}}" --pdf --export-yaml
---
```

This generates: `Contract_Acme_Corporation_20240101.pdf`

### Alternative Field Names

The feature supports multiple naming conventions:

- `force_commands` (recommended)
- `force-commands`
- `forceCommands`
- `commands`

### Security Features

- **Protected Commands**: Critical options like `--stdin`, `--yaml`, `--no-*`
  flags cannot be overridden
- **Path Validation**: File paths are validated to prevent directory traversal
  attacks
- **Template Sandboxing**: Only document metadata is available for template
  resolution

### Priority

Force commands **override** CLI arguments. If both are specified:

```bash
legal-md document.md --html  # CLI says HTML

# Document has: force_commands: --pdf
# Result: PDF is generated (force_commands wins)
```

### Examples

```bash
# Document with force commands processes automatically
legal-md self-configuring-document.md

# No CLI flags needed - everything specified in document
# Force commands handle: --pdf --highlight --css --title --export-yaml
```

See the [Force Commands Guide](../examples/force-commands/) for detailed
examples.

## Advanced Options

### Error Handling

```bash
# Strict YAML parsing
legal-md --throwOnYamlError input.md output.md

# Debug mode for troubleshooting
legal-md --debug input.md output.md
```

### Format Conversion

```bash
# Convert to markdown format
legal-md input.rst --to-markdown output.md

# Process different input formats
legal-md input.tex output.md
legal-md input.rst output.md
```

## Input/Output Methods

### File Processing

```bash
# Standard file processing
legal-md input.md output.md

# Process multiple files
legal-md contract.md processed-contract.md
legal-md brief.md processed-brief.md
```

### Standard Input/Output

```bash
# Read from stdin, write to stdout
cat input.md | legal-md --stdin --stdout

# Read from stdin, write to file
cat input.md | legal-md --stdin output.md

# Read from file, write to stdout
legal-md input.md --stdout

# Pipe processing
cat input.md | legal-md --stdin --stdout > output.md
```

### Combining with Other Tools

```bash
# Process and convert with pandoc
legal-md input.md --stdout | pandoc -f markdown -t docx -o output.docx

# Process and format
legal-md input.md --stdout | prettier --parser markdown

# Process multiple files with find
find . -name "*.md" -exec legal-md {} {}.processed \;
```

## Examples

### Basic Document Processing

```bash
# Process a contract
legal-md contract.md processed-contract.md

# Process with debug output
legal-md --debug contract.md processed-contract.md

# Process only headers
legal-md --headers contract.md headers-only.md
```

### PDF Generation Examples

```bash
# Generate PDF with highlighting
legal-md contract.md --pdf --highlight

# Generate PDF with custom styling
legal-md contract.md --pdf --css ./styles/contract.css --title "Service Agreement"

# Generate both normal and highlighted PDFs
legal-md contract.md --pdf --highlight --title "Contract Review"
```

### Source File Archiving

```bash
# Archive source after processing (smart archiving)
legal-md contract.md --archive-source

# Archive to custom directory
legal-md contract.md --archive-source ./completed-contracts

# Process to PDF and archive source
legal-md contract.md --pdf --highlight --archive-source ./processed

# Archive with conflict resolution (automatic renaming)
legal-md duplicate.md --archive-source ./archive  # Creates duplicate_1.md if duplicate.md exists
```

#### Smart Archiving Examples

```bash
# Static document (only frontmatter changes)
legal-md static-template.md --archive-source ./archive
# Result: archive/static-template.md (single file)

# Document with imports and mixins
legal-md contract-template.md --archive-source ./archive
# Result: archive/contract-template.ORIGINAL.md (template)
#         archive/contract-template.PROCESSED.md (processed)

# PDF generation with smart archiving
legal-md complex-document.md --pdf --highlight --archive-source ./processed
# Archives both template and processed versions if content differs

# Batch processing with smart archiving
for file in templates/*.md; do
  legal-md "$file" --pdf --archive-source ./archive
done
# Each file is intelligently archived based on content changes
```

### Batch Processing

```bash
# Process all markdown files in directory
for file in *.md; do
  legal-md "$file" "processed-$file"
done

# Process with consistent options and archive sources
for file in *.md; do
  legal-md "$file" --pdf --highlight --archive-source ./processed
done

# Process with find and archive
find ./documents -name "*.md" -exec legal-md --pdf --highlight --archive-source ./archive {} \;
```

### Metadata Export

```bash
# Export metadata for inspection
legal-md --export-json contract.md processed-contract.md

# Export to custom location
legal-md --export-yaml --output-path ./metadata contract.md processed-contract.md
```

### Field Tracking Examples

```bash
# Generate markdown with field tracking for review
legal-md --enable-field-tracking contract.md reviewed-contract.md

# Generate HTML with field tracking (automatic)
legal-md --html --highlight contract.md

# Generate PDF with field tracking (automatic)
legal-md --pdf --highlight contract.md

# Process with field tracking and export metadata
legal-md --enable-field-tracking --export-json contract.md processed-contract.md

# Process with frontmatter merging disabled
legal-md --disable-frontmatter-merge contract-template.md processed-contract.md

# Process with import tracing for debugging
legal-md --import-tracing --validate-import-types contract-template.md debug-contract.md
```

### Pipeline Processing

```bash
# Process and generate PDF in one command
legal-md contract.md --pdf --highlight --title "Final Contract"

# Process from template with data
cat template.md | legal-md --stdin --stdout > final-document.md
```

## Exit Codes

The CLI returns standard exit codes:

| Code | Description                    |
| ---- | ------------------------------ |
| 0    | Success                        |
| 1    | General error                  |
| 2    | Invalid command line arguments |
| 3    | Input file not found           |
| 4    | Output file write error        |
| 5    | YAML parsing error             |
| 6    | Template processing error      |

### Example Error Handling

```bash
# Check exit code
legal-md input.md output.md
if [ $? -eq 0 ]; then
  echo "Processing successful"
else
  echo "Processing failed with code $?"
fi

# Use in scripts
legal-md input.md output.md || {
  echo "Processing failed"
  exit 1
}
```

## Configuration Files

### Project Configuration

Create `.legalmdrc` in your project root:

```json
{
  "debug": false,
  "exportFormat": "json",
  "enableFieldTracking": true,
  "pdfOptions": {
    "format": "Letter",
    "margins": "1in"
  },
  "htmlOptions": {
    "includeHighlighting": true
  }
}
```

### Global Configuration

Create `~/.legalmdrc` for global settings:

```json
{
  "basePath": "~/legal-documents",
  "exportMetadata": true,
  "defaultCss": "~/legal-styles/default.css"
}
```

## Troubleshooting

### Common Issues

#### Command Not Found

```bash
# Check installation
npm list -g legal-markdown-js

# Reinstall if needed
npm install -g legal-markdown-js

# Use npx as alternative
npx legal-markdown-js input.md output.md
```

#### Permission Errors

```bash
# Check file permissions
ls -la input.md

# Use sudo if needed (not recommended)
sudo legal-md input.md output.md

# Better: fix file permissions
chmod 644 input.md
```

#### Processing Errors

```bash
# Use debug mode
legal-md --debug input.md output.md

# Check YAML syntax
legal-md --yaml input.md

# Validate step by step
legal-md --headers input.md  # Test headers only
```

### Debug Output

Enable debug mode to see detailed processing information:

```bash
legal-md --debug input.md output.md
```

This shows:

- File reading and writing operations
- YAML front matter parsing
- Header processing steps
- Reference resolution
- Mixin processing
- Error messages with stack traces

### Performance Issues

```bash
# Skip unnecessary processing
legal-md --no-mixins --no-imports input.md output.md

# Process only what you need
legal-md --headers input.md output.md
```

### Memory Issues

```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 $(which legal-md) input.md output.md
```

For more troubleshooting help, see the
[Getting Started](getting_started.md#troubleshooting) guide.
