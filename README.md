# Legal Markdown JS

> A complete Node.js/TypeScript reimplementation of the original Ruby
> [LegalMarkdown](https://github.com/compleatang/legal-markdown) tool with 100%
> feature parity.

Process markdown with YAML front matter, conditional clauses
`[text]{condition}`, cross-references `|reference|`, mixins `{{variable}}`,
imports `@import`, and generate professional PDFs ready to be shared.

![Legal Markdown JS Example](docs/legal-markdown-js-example.png)

## Table of Contents

- [Goals](#goals)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Goals

- **Core Parity**: 1:1 compatibility with the original Ruby legal-markdown tool
  in `src/core/`
- **Node.js Extensions**: Additional functionality leveraging the Node.js
  ecosystem in `src/extensions/`
- **Type Safety**: Full TypeScript implementation with comprehensive type
  definitions
- **Modern Tooling**: Built with modern development practices and tooling

## Installation

```bash
npm install legal-markdown-js
```

After installation, you'll have access to these commands:

- **`legal-md`** - Standard command-line interface with options and flags
- **`legal-md-ui`** - Interactive CLI with guided prompts and smart defaults
- **`legal-md-setup`** - Configuration setup script for easy environment setup
- **`legal-md-playground`** - Local playground server for testing and
  exploration
- **`legal2md`** - Alias for `legal-md` (for compatibility)

## 🚀 Try it Online

**[Live Playground](https://petalo.github.io/legal-markdown-js/)** - Try Legal
Markdown JS directly in your browser with live examples and real-time
processing.

### Local Playground

You can also run the playground locally for offline use or testing:

```bash
# Start local playground server (when installed globally)
legal-md-playground

# Or with custom port
legal-md-playground --port=3000

# Or if installed locally in a project
npm run web:serve
```

The playground provides the same interactive experience as the online version,
including real-time processing, syntax highlighting, and example templates.

## Quick Start

### Initial Setup (Optional)

For the best experience, especially if you're new to Legal Markdown JS, run the
setup script to configure your environment:

```bash
# Configure paths and directories (when installed globally)
legal-md-setup

# Or if installed locally in a project
npm run setup-config
```

This creates a personalized configuration file that the tool will automatically
find and use.

### Command Line Usage

#### Standard CLI

```bash
# Basic document processing
legal-md input.md output.md

# Generate PDF with highlighting
legal-md document.md --pdf --highlight

# Process with custom CSS
legal-md document.md --html --css styles.css
```

#### Interactive CLI

For a guided, user-friendly experience, use the interactive CLI:

```bash
# Launch interactive mode
legal-md-ui
```

The interactive CLI provides:

- **📁 Smart file discovery**: Automatically scans your input directory for
  supported files (`.md`, `.markdown`, `.rst`, `.tex`, `.latex`, `.txt`)
- **🎯 Multiple output formats**: Select any combination of PDF, HTML, Markdown,
  and metadata export
- **⚙️ Conditional options**: Processing options adapt based on your selected
  formats
- **🎨 CSS selection**: Choose from available stylesheets or proceed without
  custom styling
- **📋 Configuration summary**: Review all settings before processing
- **✅ Clear results**: See exactly which files were generated

### Programmatic Usage

```typescript
import {
  processLegalMarkdown,
  processLegalMarkdownAsync,
} from 'legal-markdown-js';

// Synchronous processing (legacy)
const result = processLegalMarkdown(content, {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json',
});

// Asynchronous processing with modern pipeline (recommended)
const asyncResult = await processLegalMarkdownAsync(content, {
  basePath: './documents',
  exportMetadata: true,
  exportFormat: 'json',
  enableFieldTracking: true,
});

console.log(asyncResult.content);
console.log(asyncResult.metadata);
console.log(asyncResult.fieldReport); // Enhanced field tracking
```

## Key Features

### Core Compatibility

All original Legal Markdown features are fully implemented:

- **File Formats**: Markdown, ASCII, reStructuredText, LaTeX
- **YAML Front Matter**: Complete parsing with all standard fields
- **Headers & Numbering**: Full hierarchical numbering system (`l.`, `ll.`,
  `lll.`)
- **Optional Clauses**: Boolean, equality, and logical operations
  (`[text]{condition}`)
- **Cross-References**: Internal section references using (`|reference|`) syntax
- **Partial Imports**: File inclusion with path resolution (`@import`)
- **Metadata Export**: YAML and JSON export with custom paths

### Node.js Enhancements

Additional features available only in the Node.js version:

- **Interactive CLI**: User-friendly guided interface with smart file discovery
  and configuration management
- **Mixins System**: Template substitution and helpers with `{{variable}}`
  syntax
- **AST-Based Processing**: Modern AST-based mixin processing to prevent text
  contamination (v2.4.0+)
- **Pipeline Architecture**: Configurable step-based processing pipeline with
  dependency management and performance monitoring (v2.4.0+)
- **PDF Generation**: Professional PDF output with styling and field
  highlighting
- **HTML Generation**: Custom HTML output with CSS support
- **Template Loops**: Array iteration with `{{#items}}...{{/items}}` syntax
- **Helper Functions**: Date, number, and string formatting helpers
- **Force Commands**: Document-driven configuration with embedded CLI options
- **Batch Processing**: Multi-file processing with concurrency control
- **Field Tracking**: Enhanced field tracking with proper categorization for
  document review

## Architecture & Performance

### Modern Pipeline System (v2.4.0+)

Legal Markdown JS features a completely rewritten processing pipeline that
provides:

- **Step-Based Architecture**: Configurable processing steps with dependency
  management
- **AST-Based Processing**: Modern AST parsing for mixin processing to prevent
  text contamination
- **Performance Monitoring**: Built-in step profiling and performance metrics
- **Error Recovery**: Graceful fallback to legacy processing when needed
- **Field Tracking**: Enhanced field tracking with proper status categorization

#### Processing Order

The new pipeline ensures correct processing order to prevent conflicts:

1. **YAML Front Matter** - Parse document metadata
2. **Import Processing** - Handle file imports and inclusions
3. **Optional Clauses** - Process conditional text blocks
4. **Cross-References** - Resolve internal document references
5. **Template Loops** - Expand array iterations first
6. **AST Mixin Processing** - Process variables and helpers (avoids loop
   conflicts)
7. **Header Processing** - Apply numbering and formatting
8. **Field Tracking** - Apply highlighting and generate reports

#### API Usage

```typescript
// Use the modern async API for best performance
const result = await processLegalMarkdownAsync(content, options);

// Automatic fallback to legacy processing if needed
// No code changes required for existing applications
```

## Documentation

### User Documentation

- **[Getting Started](docs/GETTING-STARTED.md)** - Installation and setup guide
- **[CLI Reference](docs/CLI-REFERENCE.md)** - Complete command-line interface
  documentation
- **[Features Guide](docs/FEATURES-GUIDE.md)** - All features, helpers, and
  advanced usage
- **[Headers & Numbering](docs/HEADERS-NUMBERING.md)** - Hierarchical numbering
  system guide
- **[CSS Classes Reference](docs/CSS-CLASSES.md)** - CSS classes for styling and
  document review
- **[Compatibility](docs/COMPATIBILITY.md)** - Ruby version compatibility
  tracking

### Developer Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Complete system architecture and
  design patterns
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Development workflow,
  standards, and contribution guidelines
- **[Helper Functions](docs/HELPERS.md)** - Complete reference for template
  helpers and functions
- **[Development Guide](docs/DEVELOPMENT-GUIDE.md)** - Complete developer setup
  and workflow
- **[Release Process](docs/RELEASE-PROCESS.md)** - Versioning and release
  procedures
- **[Scripts Reference](docs/SCRIPTS-REFERENCE.md)** - Available npm scripts and
  commands
- **[API Documentation](docs/api/)** - Auto-generated TypeScript API docs

## Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows and feature combinations
- **E2E Tests**: Test CLI interface and full application behavior
- **Path Validation Tests**: Test environment configuration and error handling

## Configuration

Legal Markdown JS supports environment-based configuration for customizing file
paths and directories.

### Quick Setup (Recommended)

For easy configuration setup, especially for non-technical users:

```bash
# Run the setup script (when installed globally)
legal-md-setup

# Or if installed locally in a project
npm run setup-config
```

This script will:

- Create a configuration directory at `~/.config/legal-markdown-js/`
- Copy the configuration template with helpful comments
- Provide clear instructions on how to customize your paths
- Show you exactly where to edit your settings

### Manual Configuration

If you prefer manual setup, create a `.env` file in one of these locations (in
order of precedence):

1. **Current working directory**: `./.env`
2. **Your home directory**: `~/.env`
3. **Config directory**: `~/.config/legal-markdown-js/.env`

```bash
# Copy the example configuration
cp .env.example .env

# Edit the configuration
nano .env
```

### Path Configuration Examples

```bash
# Custom asset organization
IMAGES_DIR=assets/media
STYLES_DIR=assets/css

# Separate project structure
DEFAULT_INPUT_DIR=documents/source
DEFAULT_OUTPUT_DIR=documents/generated

# Absolute paths (useful for CI/CD)
IMAGES_DIR=/var/lib/legal-markdown/images
DEFAULT_OUTPUT_DIR=/var/lib/legal-markdown/output
```

### Using Custom Paths in Code

```typescript
import { PATHS, RESOLVED_PATHS } from 'legal-markdown-js';

// Access configured paths
console.log(PATHS.STYLES_DIR); // Relative path from .env
console.log(RESOLVED_PATHS.STYLES_DIR); // Absolute resolved path
```

## Contributing

We welcome contributions! Please see our
[Contributing Guide](docs/CONTRIBUTING.md) for:

- Development setup and workflow
- Coding standards and best practices
- Testing requirements
- Pull request process

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the development guidelines
4. Run the test suite (`npm test`)
5. Submit a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original [LegalMarkdown](https://github.com/compleatang/legal-markdown)
  project by Casey Kuhlman
- The legal tech community for inspiration and feedback
