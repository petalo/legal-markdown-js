# LegalMarkdown Examples

This directory contains example files demonstrating various features of
LegalMarkdown.

## File Overview

### Basic Examples

- `example.md` - Main example showing multiple features
- `simple-contract.md` - Simple contract template
- `nda-template.md` - Non-disclosure agreement template

### Feature-Specific Examples

- `yaml-only.md` - YAML front matter processing only
- `headers-only.md` - Header numbering examples
- `import-example.md` - Document import features
- `optional-clauses.md` - Conditional clauses example
- `cross-references.md` - Cross-reference usage

### Output Examples

- `processed-example.md` - Example of processed output
- `final-output.md` - Final processed document
- `test-output.md` - Test processing output
- `import-output.md` - Import processing result

### Metadata Examples

- `agreement-metadata.json` - Software license agreement metadata
- `advanced-metadata.json` - Advanced features metadata example
- `metadata.json` - Simple metadata example
- `metadata.yaml` - YAML format metadata example

## Usage

To process any example file:

```bash
# Basic processing
npx legal-md examples/example.md examples/output.md

# YAML only
npx legal-md --yaml examples/yaml-only.md

# Debug mode
npx legal-md --debug examples/example.md examples/debug-output.md

# Export metadata
npx legal-md --export-yaml examples/example.md

# Using external metadata files
npx legal-md examples/simple-contract.md examples/output.md --metadata examples/agreement-metadata.json

# Process with YAML metadata
npx legal-md examples/nda-template.md examples/nda-output.md --metadata examples/metadata.yaml
```

## Creating Your Own Examples

1. Start with YAML front matter (optional)
2. Use header notation: `l.`, `ll.`, `lll.`, etc.
3. Add optional clauses with `[clause]{condition}`
4. Include imports with `@import filename.md`
5. Reference other sections with `|reference|`
