# CLI Reference

Complete command-line interface documentation for Legal Markdown JS.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Command Syntax](#command-syntax)
- [Options Reference](#options-reference)
- [Processing Options](#processing-options)
- [Output Options](#output-options)
- [Format Options](#format-options)
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

| Option            | Description                            |
| ----------------- | -------------------------------------- |
| `--debug`, `-d`   | Enable debug mode with detailed output |
| `--yaml`, `-y`    | Process only YAML front matter         |
| `--headers`       | Process only headers                   |
| `--no-headers`    | Skip header processing                 |
| `--no-clauses`    | Skip optional clause processing        |
| `--no-references` | Skip cross-reference processing        |
| `--no-imports`    | Skip import processing                 |
| `--no-mixins`     | Skip mixin processing                  |

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

| Option            | Description                           |
| ----------------- | ------------------------------------- |
| `--pdf`           | Generate PDF output                   |
| `--html`          | Generate HTML output                  |
| `--highlight`     | Enable field highlighting in HTML/PDF |
| `--css <path>`    | Path to custom CSS file               |
| `--title <title>` | Document title for HTML/PDF           |

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

# Combine multiple skip options
legal-md --no-headers --no-mixins input.md output.md
```

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

### Batch Processing

```bash
# Process all markdown files in directory
for file in *.md; do
  legal-md "$file" "processed-$file"
done

# Process with consistent options
find ./documents -name "*.md" -exec legal-md --pdf --highlight {} \;
```

### Metadata Export

```bash
# Export metadata for inspection
legal-md --export-json contract.md processed-contract.md

# Export to custom location
legal-md --export-yaml --output-path ./metadata contract.md processed-contract.md
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
[Getting Started](GETTING-STARTED.md#troubleshooting) guide.
