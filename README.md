# Legal Markdown Wizard

A Node.js implementation of [LegalMarkdown](https://github.com/compleatang/legal-markdown) for processing legal documents with structured markdown and YAML front matter.

## 🎯 Project Goals

- **Core Parity**: 1:1 compatibility with the original Ruby legal-markdown tool
- **Node.js Extensions**: Additional functionality leveraging the Node.js ecosystem
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern Tooling**: Built with modern development practices and tooling

## 📁 Project Structure

```
src/
├── core/                    # 🎯 Core functionality (parity with original)
│   ├── parsers/            # YAML front matter parsing
│   ├── processors/         # Document processing (headers, clauses, references, imports)
│   ├── exporters/          # Metadata export functionality
│   └── index.ts            # Core module exports
├── extensions/             # 🚀 Node.js specific enhancements
│   ├── validators/         # Document validation utilities
│   ├── formatters/         # Advanced output formatting
│   ├── utilities/          # Analysis and utility functions
│   └── index.ts            # Extensions module exports
├── cli.ts                  # Command-line interface
├── index.ts                # Main entry point
└── types.ts                # TypeScript type definitions

tests/
├── unit/                   # Unit tests
│   ├── parsers/           # Parser unit tests
│   ├── processors/        # Processor unit tests
│   ├── exporters/         # Exporter unit tests
│   └── core/              # Core functionality tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
└── setup.ts               # Test configuration
```

## 🚀 Installation

```bash
npm install legal-md-wizard
```

## 🔧 Usage

### Command Line Interface

```bash
# Basic usage
legal-md input.md output.md

# Process only YAML front matter
legal-md --yaml input.md output.md

# Process only headers  
legal-md --headers input.md output.md

# Export metadata
legal-md --export-json --output-path ./metadata input.md output.md

# Debug mode
legal-md --debug input.md output.md

# Skip specific processing
legal-md --no-headers --no-references input.md output.md
```

### Programmatic API

```typescript
import { processLegalMarkdown } from 'legal-md-wizard';

const result = processLegalMarkdown(content, {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json'
});

console.log(result.content);
console.log(result.metadata);
console.log(result.exportedFiles);
```

## 📋 Features

### ✅ Core Features (Legal Markdown Parity)

| Feature | Status | Tests |
|---------|--------|-------|
| **File Formats** | | |
| ✅ Markdown (.md) input | Implemented | [file-formats.unit.test.ts](tests/unit/core/file-formats.unit.test.ts) |
| ✅ ASCII (.txt) input | Implemented | [file-formats.unit.test.ts](tests/unit/core/file-formats.unit.test.ts) |
| **YAML Front Matter** | | |
| ✅ Parse YAML delimiters (`---`) | Implemented | [yaml-parser.unit.test.ts](tests/unit/parsers/yaml-parser.unit.test.ts) |
| ✅ Basic fields (title, author, date) | Implemented | [yaml-parser.unit.test.ts](tests/unit/parsers/yaml-parser.unit.test.ts) |
| ✅ Parties array with name and type | Implemented | [yaml-parser.unit.test.ts](tests/unit/parsers/yaml-parser.unit.test.ts) |
| ✅ Jurisdiction and governing-law | Implemented | [yaml-parser.unit.test.ts](tests/unit/parsers/yaml-parser.unit.test.ts) |
| ✅ Custom variable definitions | Implemented | [yaml-parser.unit.test.ts](tests/unit/parsers/yaml-parser.unit.test.ts) |
| **Headers & Numbering** | | |
| ✅ `l.`, `ll.`, `lll.` notation | Implemented | [header-processor.unit.test.ts](tests/unit/processors/header-processor.unit.test.ts) |
| ✅ Alternative `l1.`, `l2.` syntax | Implemented | [header-processor.unit.test.ts](tests/unit/processors/header-processor.unit.test.ts) |
| ✅ Custom level formatting | Implemented | [header-processor.unit.test.ts](tests/unit/processors/header-processor.unit.test.ts) |
| ✅ Hierarchical numbering | Implemented | [header-processor.unit.test.ts](tests/unit/processors/header-processor.unit.test.ts) |
| **Optional Clauses** | | |
| ✅ Square bracket notation `[...]` | Implemented | [clause-processor.unit.test.ts](tests/unit/processors/clause-processor.unit.test.ts) |
| ✅ Condition syntax `{condition}` | Implemented | [clause-processor.unit.test.ts](tests/unit/processors/clause-processor.unit.test.ts) |
| ✅ Boolean conditions | Implemented | [clause-processor.unit.test.ts](tests/unit/processors/clause-processor.unit.test.ts) |
| ✅ AND/OR logic operations | Implemented | [clause-processor.unit.test.ts](tests/unit/processors/clause-processor.unit.test.ts) |
| ✅ Equality conditions | Implemented | [clause-processor.unit.test.ts](tests/unit/processors/clause-processor.unit.test.ts) |
| **Cross-References** | | |
| ✅ Pipe notation `\|reference\|` | Implemented | [reference-processor.unit.test.ts](tests/unit/processors/reference-processor.unit.test.ts) |
| ✅ YAML front matter values | Implemented | [reference-processor.unit.test.ts](tests/unit/processors/reference-processor.unit.test.ts) |
| ✅ Text string references | Implemented | [reference-processor.unit.test.ts](tests/unit/processors/reference-processor.unit.test.ts) |
| ✅ Date and number references | Implemented | [reference-processor.unit.test.ts](tests/unit/processors/reference-processor.unit.test.ts) |
| **Partial Imports** | | |
| ✅ `@import [filename]` syntax | Implemented | [import-processor.unit.test.ts](tests/unit/processors/import-processor.unit.test.ts) |
| ✅ Relative and absolute paths | Implemented | [import-processor.unit.test.ts](tests/unit/processors/import-processor.unit.test.ts) |
| ✅ Multiple imports support | Implemented | [import-processor.unit.test.ts](tests/unit/processors/import-processor.unit.test.ts) |
| **Metadata Export** | | |
| ✅ YAML and JSON export | Implemented | [metadata-exporter.unit.test.ts](tests/unit/exporters/metadata-exporter.unit.test.ts) |
| ✅ Custom output paths | Implemented | [metadata-exporter.unit.test.ts](tests/unit/exporters/metadata-exporter.unit.test.ts) |
| ✅ Include/exclude options | Implemented | [metadata-exporter.unit.test.ts](tests/unit/exporters/metadata-exporter.unit.test.ts) |

### 🚀 Extensions (Node.js Enhancements)

| Feature | Status | Description |
|---------|--------|-------------|
| 🔍 **Document Validation** | Implemented | Structure validation, bracket matching |
| 🎨 **Advanced Formatting** | Implemented | HTML output, legal styling options |
| 📊 **Document Analysis** | Implemented | Word count, statistics, reference extraction |
| 🧪 **Comprehensive Testing** | Implemented | Unit, integration, and E2E test suites |

## 🧪 Testing

The project uses a comprehensive testing strategy:

```bash
# Run all tests
npm test

# Run specific test types
npm test -- --testPathPattern="unit"           # Unit tests only
npm test -- --testPathPattern="integration"    # Integration tests only
npm test -- --testPathPattern="e2e"           # E2E tests only

# Run specific test files
npm test -- --testPathPattern="yaml-parser"   # YAML parser tests
npm test -- --testPathPattern="header-processor" # Header processing tests

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests** (`tests/unit/`): Test individual components in isolation
- **Integration Tests** (`tests/integration/`): Test complete workflows and feature combinations
- **E2E Tests** (`tests/e2e/`): Test CLI interface and full application behavior

## 📖 Examples

### Basic Legal Document

```markdown
---
title: "Software License Agreement"
parties:
  - name: "TechCorp Inc."
    type: "Corporation"
  - name: "Client LLC"
    type: "LLC"
effective_date: "2024-01-01"
jurisdiction: "California"
payment_terms: 30
include_warranty: false
---

l. Definitions
ll. Software
The "Software" means the computer program licensed under this Agreement.

l. License Grant
The license is granted to |parties.1.name| by |parties.0.name|.

[Warranty provisions apply]{include_warranty}.

l. Payment
Payment is due within |payment_terms| days.
```

### Advanced Features

```markdown
---
title: "Complex Agreement"
level-one: "Article %n:"
level-two: "Section %n.%s"
level-three: "(%n)"
meta-json-output: "metadata.json"
---

l. Introduction
ll. Background
lll. Previous Agreements

@import common-clauses.md

l. Terms and Conditions
[Premium terms apply]{client_type = "premium" AND active = true}.
```

## 🔗 API Reference

### Main Functions

#### `processLegalMarkdown(content, options)`

Process a legal markdown document with all features.

**Parameters:**
- `content: string` - The document content to process
- `options: LegalMarkdownOptions` - Processing options

**Returns:**
```typescript
{
  content: string;           // Processed document content
  metadata?: object;         // Parsed YAML front matter
  exportedFiles?: string[];  // Paths to exported metadata files
}
```

**Options:**
```typescript
interface LegalMarkdownOptions {
  basePath?: string;         // Base path for resolving imports
  yamlOnly?: boolean;        // Process only YAML front matter
  noHeaders?: boolean;       // Skip header processing
  noClauses?: boolean;       // Skip optional clause processing
  noReferences?: boolean;    // Skip cross-reference processing
  noImports?: boolean;       // Skip import processing
  exportMetadata?: boolean;  // Export metadata to files
  exportFormat?: 'yaml' | 'json'; // Metadata export format
  exportPath?: string;       // Custom export path
  debug?: boolean;           // Enable debug output
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the project structure:
   - **Core functionality** goes in `src/core/` (maintain parity)
   - **Extensions** go in `src/extensions/` (Node.js specific)
4. Add tests for your changes
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- **Core vs Extensions**: Keep original legal-markdown compatibility in `src/core/`, add enhancements in `src/extensions/`
- **Testing**: All new features must include unit tests, integration tests for complex workflows
- **TypeScript**: Use proper typing throughout, avoid `any` types
- **Documentation**: Update README.md and add JSDoc comments for public APIs

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original [LegalMarkdown](https://github.com/compleatang/legal-markdown) project by Casey Kuhlman
- The legal tech community for inspiration and feedback

## 🐛 Issues & Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/legal-md-wizard/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-org/legal-md-wizard/discussions)
- 📚 **Documentation**: This README and inline code documentation
- 💬 **Community**: Join our discussions for questions and community support