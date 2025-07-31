# 📚 Legal Markdown Examples

This directory contains comprehensive examples demonstrating all features of
Legal Markdown. Each example is self-contained with its own documentation,
executable script, and generated output files.

## 🗂️ Example Categories

### 🟢 Basic Processing

Perfect for getting started with Legal Markdown.

- **[simple-document](basic-processing/simple-document/)** - Basic document
  processing without special features
- **[yaml-frontmatter](basic-processing/yaml-frontmatter/)** - YAML metadata
  parsing and extraction

### 📋 Headers

Learn header processing and numbering systems.

- **[multiple-headers](headers/multiple-headers/)** - Multiple header levels
  with traditional syntax
- **[mixed-header-styles](headers/mixed-header-styles/)** - Mixing traditional
  and alternative header syntax
- **[header-tracking](headers/header-tracking/)** - Field tracking capabilities
  in headers

### 🔗 Cross References

Master cross-reference processing for internal section linking.

- **[basic-references](cross-references/basic-references/)** - Basic
  cross-reference syntax for internal section references

### ❓ Optional Clauses

Dynamic content with conditional logic.

- **[conditional-content](optional-clauses/conditional-content/)** - Basic
  conditional clauses with boolean logic
- **[boolean-logic](optional-clauses/boolean-logic/)** - Complex boolean
  expressions and AND/OR operations

### 🎨 Mixins & Templates

Advanced template features and data processing.

- **[helper-functions](mixins/helper-functions/)** - Date, currency, and string
  formatting functions
- **[template-loops](mixins/template-loops/)** - Array iteration and dynamic
  list generation

### 📥 Imports

Modular document construction.

- **[partial-imports](imports/partial-imports/)** - Importing external markdown
  files with @import syntax

### 📄 Output Formats

Generate professional documents in multiple formats.

- **[pdf-generation](output-formats/pdf-generation/)** - PDF output with styling
  and field highlighting
- **[metadata-export](output-formats/metadata-export/)** - Exporting processed
  metadata to YAML/JSON

### 🏢 Advanced Examples

Real-world legal documents with complex features.

- **[office-lease-complete](advanced/office-lease-complete/)** - Complete office
  lease agreement with rich data
- **[complex-nda](advanced/complex-nda/)** - NDA with advanced conditional logic
  and multiple data sources

### 🔧 Integration

CLI usage and programmatic integration.

- **[cli-usage](integration/cli-usage/)** - Command-line interface examples and
  batch processing

## 🚀 Quick Start

### Run a specific example

```bash
cd basic-processing/simple-document
./run.sh
```

### Run all examples

```bash
./run-all.sh
```

### Run examples in a category

```bash
find headers -name "run.sh" -execdir bash -c './run.sh' \;
```

## 📁 File Conventions

Understanding the file naming conventions used throughout the examples:

- **`*.md`** - Input Legal Markdown files
- **`*.yaml`, `*.json`** - Metadata and data files
- **`*.output.md`** - Processed markdown output
- **`*.output.html`** - HTML output with styling
- **`*.output.pdf`** - PDF output for printing/sharing
- **`*.HIGHLIGHT.output.pdf`** - PDF with field highlighting for review
- **`run.sh`** - Executable script for the example
- **`README.md`** - Documentation for the example

## 🎯 Learning Path

We recommend following this progression:

1. **Start with basics**: `basic-processing/simple-document`
2. **Learn YAML**: `basic-processing/yaml-frontmatter`
3. **Master headers**: `headers/multiple-headers`
4. **Add references**: `cross-references/basic-references`
5. **Try conditionals**: `optional-clauses/conditional-content`
6. **Use mixins**: `mixins/helper-functions`
7. **Generate PDFs**: `output-formats/pdf-generation`
8. **Build complex docs**: `advanced/office-lease-complete`

## 🛠️ Running Examples

Each example directory contains:

- Input files (`.md`, `.yaml`, `.json`)
- Executable script (`run.sh`)
- Documentation (`README.md`)
- Generated outputs (after running)

### Prerequisites

Make sure you have the CLI built:

```bash
npm run build
```

### Individual Example

```bash
cd examples/basic-processing/simple-document
./run.sh
```

### Batch Processing

```bash
# Run all examples
cd examples
./run-all.sh

# Run specific category
find headers -name "run.sh" -exec bash -c 'cd "$(dirname "{}")" && ./run.sh' \;
```

## 📊 What Each Example Generates

| Example          | `.md` | `.html` | `.pdf` | `.yaml/.json` |
| ---------------- | ----- | ------- | ------ | ------------- |
| Basic Processing | ✅    | ✅      | ❌     | ❌            |
| Headers          | ✅    | ✅      | ❌     | ❌            |
| Cross References | ✅    | ✅      | ❌     | ❌            |
| Optional Clauses | ✅    | ✅      | ❌     | ❌            |
| Mixins           | ✅    | ✅      | ❌     | ❌            |
| PDF Generation   | ✅    | ✅      | ✅     | ❌            |
| Metadata Export  | ✅    | ✅      | ❌     | ✅            |
| Advanced         | ✅    | ✅      | ✅     | ✅            |

## 🔍 Troubleshooting

### Common Issues

**"CLI not found"**

```bash
# Make sure you've built the project
npm run build

# Or install globally
npm install -g legal-markdown-js
```

**"Permission denied"**

```bash
# Make scripts executable
find examples -name "run.sh" -exec chmod +x {} \;
```

**"Command timeout"**

```bash
# Some examples may take longer, run individually
cd examples/advanced/office-lease-complete
./run.sh
```

### Debug Mode

Add `--debug` flag to see detailed processing:

```bash
# Edit any run.sh script
$CLI input.md --debug output.md
```

## 🎨 Customization

### Adding Your Own Example

1. Create directory: `examples/my-category/my-example/`
2. Add input files: `document.md`, `data.yaml`
3. Copy and modify `run.sh` from similar example
4. Add `README.md` documentation
5. Test: `./run.sh`

### Custom Styling

Examples with HTML/PDF output can use custom CSS:

```bash
$CLI input.md --html --css custom-styles.css -o output.html
```

## 📚 Documentation

- [Getting Started Guide](../docs/getting_started.md)
- [API Reference](../docs/api.md)
- [CLI Reference](../docs/cli.md)
- [Feature Documentation](../docs/)

## 🤝 Contributing

Found an issue or want to add an example?

1. Check existing examples for similar patterns
2. Follow the file naming conventions
3. Include comprehensive documentation
4. Test with `./run.sh` before submitting

## 📈 Statistics

After running all examples, you'll have generated:

- **~50+ output files** across all formats
- **Markdown documents** with processed content
- **HTML files** with professional styling
- **PDF documents** ready for printing/sharing
- **Metadata exports** for system integration

---

🎉 **Happy documenting with Legal Markdown!**

_Need help? Check individual example README files or the main documentation._
