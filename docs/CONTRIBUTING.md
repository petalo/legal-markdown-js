# Contributing to Legal Markdown JS

Thank you for your interest in contributing to Legal Markdown JS! This guide
will help you get started with contributing to the project.

## 🎯 Project Architecture

Legal Markdown JS follows a dual-architecture approach to maintain compatibility
while enabling modern enhancements:

### Core vs Extensions Philosophy

- **`src/core/`**: Maintains 1:1 compatibility with the original Ruby Legal
  Markdown tool
- **`src/extensions/`**: Node.js specific enhancements and additional
  functionality

This separation ensures:

- **Compatibility**: Core functionality remains identical to the Ruby version
- **Innovation**: Extensions can leverage modern Node.js features
- **Maintainability**: Clear separation of concerns
- **Testing**: Isolated testing strategies for each layer

## 📁 Project Structure

```text
src/
├── core/                    # 🎯 Core functionality (parity with original)
│   ├── parsers/            # YAML front matter parsing
│   │   └── yaml-parser.ts  # YAML delimiter and content parsing
│   ├── processors/         # Document processing components
│   │   ├── header-processor.ts     # l., ll., lll. header numbering
│   │   ├── clause-processor.ts     # [text]{condition} optional clauses
│   │   ├── reference-processor.ts  # |reference| cross-references
│   │   ├── import-processor.ts     # @import file inclusion
│   │   ├── mixin-processor.ts      # {{variable}} template substitution
│   │   └── date-processor.ts       # @today date processing
│   ├── exporters/          # Metadata export functionality
│   │   └── metadata-exporter.ts    # YAML/JSON metadata export
│   └── index.ts            # Core module exports
├── extensions/             # 🚀 Node.js specific enhancements
│   ├── validators/         # Document validation utilities
│   │   ├── structure-validator.ts  # Document structure validation
│   │   └── bracket-matcher.ts      # Bracket and syntax validation
│   ├── formatters/         # Advanced output formatting
│   │   ├── html-generator.ts       # HTML output generation
│   │   └── pdf-generator.ts        # PDF output generation
│   ├── utilities/          # Analysis and utility functions
│   │   ├── batch-processor.ts      # Multi-file processing
│   │   ├── field-tracker.ts        # Field usage tracking
│   │   └── document-analyzer.ts    # Document statistics
│   ├── parsers/            # Additional format parsers
│   │   ├── rst-parser.ts           # reStructuredText support
│   │   └── latex-parser.ts         # LaTeX document support
│   └── index.ts            # Extensions module exports
├── helpers/                # Helper function system
│   ├── date-helpers.ts     # Date formatting and manipulation
│   ├── number-helpers.ts   # Number and currency formatting
│   └── string-helpers.ts   # String manipulation and formatting
├── cli/                    # Command-line interface
│   ├── index.ts           # CLI entry point
│   └── commands/          # Individual CLI commands
├── web/                    # Web interface components
│   ├── bundle.js          # Main web bundle
│   ├── bundle-standalone.js # Standalone web bundle
│   ├── index.html         # Main web interface
│   └── standalone.html    # Standalone web interface
├── browser.ts              # Browser entry point
├── types/                  # TypeScript type definitions
│   ├── core.ts            # Core types and interfaces
│   ├── extensions.ts      # Extension-specific types
│   └── index.ts           # Type exports
├── index.ts                # Main entry point
└── types.ts                # Legacy type definitions (deprecated)

tests/
├── unit/                   # Unit tests
│   ├── parsers/           # Parser unit tests
│   ├── processors/        # Processor unit tests
│   ├── exporters/         # Exporter unit tests
│   ├── helpers/           # Helper function tests
│   └── core/              # Core functionality tests
├── integration/           # Integration tests
│   ├── workflows/         # Complete processing workflows
│   ├── cli/               # CLI interface tests
│   └── compatibility/     # Ruby version compatibility tests
├── e2e/                   # End-to-end tests
│   ├── contracts/         # Legal contract processing
│   ├── agreements/        # Various agreement types
│   └── templates/         # Template-based documents
├── fixtures/              # Test data and examples
│   ├── input/             # Sample input documents
│   ├── expected/          # Expected output files
│   └── data/              # Test metadata and configurations
└── setup.ts               # Test configuration and utilities
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher
- **Git**: For version control

### Development Setup

1. **Fork and Clone**:

   ```bash
   git clone https://github.com/your-username/legal-markdown-js.git
   cd legal-markdown-js
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Build the Project**:

   ```bash
   npm run build
   ```

4. **Run Tests**:

   ```bash
   npm test
   ```

5. **Start Development**:

   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Development
npm run dev              # Watch mode development
npm run build            # Build TypeScript to JavaScript
npm run build:watch      # Build in watch mode

# Web Interface
npm run build:web        # Build web bundles
npm run build:packages   # Build all packages (web + npm)

# Testing
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests
npm run test:coverage    # Generate coverage report
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run typecheck        # Run TypeScript type checking

# Documentation
npm run docs:build       # Build documentation
npm run docs:serve       # Serve documentation locally

# Release
npm run release          # Create a new release
npm run version          # Bump version and create changelog
```

## 🛠️ Development Guidelines

### Core Functionality Development

When working on `src/core/` components:

1. **Maintain Parity**: Ensure identical behavior to the Ruby version
2. **Test Coverage**: Include comprehensive unit tests
3. **TypeScript**: Use strict typing throughout
4. **Documentation**: Include JSDoc comments for all public APIs

**Example Core Processor**:

```typescript
/**
 * Processes legal markdown headers with hierarchical numbering
 * Maintains compatibility with Ruby legal-markdown gem
 */
export class HeaderProcessor {
  private readonly options: HeaderOptions;

  constructor(options: HeaderOptions = {}) {
    this.options = { ...DEFAULT_HEADER_OPTIONS, ...options };
  }

  /**
   * Process headers in content with l., ll., lll. notation
   * @param content - Document content to process
   * @returns Processed content with numbered headers
   */
  public process(content: string): string {
    // Implementation that matches Ruby version behavior
  }

  // Private methods for internal logic
}
```

### Extension Development

When working on `src/extensions/` components:

1. **Modern Features**: Leverage Node.js ecosystem capabilities
2. **Optional Integration**: Extensions should be opt-in
3. **Performance**: Consider performance implications
4. **Backward Compatibility**: Don't break core functionality

**Example Extension**:

```typescript
/**
 * PDF generation extension for legal documents
 * Node.js specific enhancement using Puppeteer
 */
export class PdfGenerator {
  private readonly options: PdfGeneratorOptions;

  constructor(options: PdfGeneratorOptions = {}) {
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
  }

  /**
   * Generate PDF from processed legal markdown
   * @param content - Processed markdown content
   * @param outputPath - Path for PDF output
   * @returns Promise resolving to generated PDF buffer
   */
  public async generatePdf(
    content: string,
    outputPath: string
  ): Promise<Buffer> {
    // Modern Node.js implementation
  }
}
```

### Helper System Development

When adding new helpers to the `src/helpers/` system:

1. **Pure Functions**: Helpers should be stateless and pure
2. **Error Handling**: Graceful handling of invalid inputs
3. **Type Safety**: Strong typing for all parameters and returns
4. **Documentation**: Clear examples in JSDoc comments

**Example Helper**:

````typescript
/**
 * Format a number as currency with locale support
 * @param amount - Number to format
 * @param currency - Currency code (USD, EUR, GBP)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(1000, 'EUR', 0) // "€1,000"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch (error) {
    // Graceful fallback for invalid inputs
    return amount.toString();
  }
}
````

### Web Interface Development

When working on the web interface (`src/web/` and `src/browser.ts`):

1. **Browser Compatibility**: Support modern browsers (Chrome, Firefox, Safari,
   Edge)
2. **Responsive Design**: Ensure interface works on different screen sizes
3. **Performance**: Optimize bundle size and loading times
4. **User Experience**: Focus on intuitive and professional UI/UX
5. **Accessibility**: Follow WCAG guidelines for accessibility

**Web Interface Architecture**:

```typescript
/**
 * Web interface controller for browser environment
 * Handles real-time document processing and preview
 */
export class LegalMarkdownWeb {
  private editor: HTMLTextAreaElement;
  private cssEditor: HTMLTextAreaElement;
  private preview: HTMLElement;
  private processor: LegalMarkdownProcessor;

  constructor(containerId: string) {
    this.initializeInterface(containerId);
    this.setupEventHandlers();
  }

  /**
   * Process document content and update preview
   * @param content - Markdown content to process
   * @param css - Custom CSS for styling
   */
  public async processDocument(content: string, css?: string): Promise<void> {
    try {
      const result = await this.processor.process(content);
      this.updatePreview(result.content, css);
    } catch (error) {
      this.showError(error.message);
    }
  }

  private setupEventHandlers(): void {
    // Real-time processing on content change
    this.editor.addEventListener('input', this.debounceProcess.bind(this));
    this.cssEditor.addEventListener('input', this.updateStyles.bind(this));
  }
}
```

**Web Bundle Requirements**:

1. **Standalone Bundle**: Complete functionality without external dependencies
2. **Modular Bundle**: Smaller size for npm package integration
3. **CDN Distribution**: Available via jsDelivr and other CDNs
4. **Source Maps**: For development and debugging

**Testing Web Interface**:

```typescript
describe('Web Interface', () => {
  it('should process markdown in real-time', async () => {
    const container = document.createElement('div');
    const webInterface = new LegalMarkdownWeb(container.id);

    const testContent = `
l. First Section
This is a test document.
    `;

    await webInterface.processDocument(testContent);

    const preview = container.querySelector('.preview');
    expect(preview?.innerHTML).toContain('1. First Section');
  });
});
```

## 🧪 Testing Guidelines

### Test Structure

Every component should have comprehensive tests:

```bash
tests/
├── unit/componentName.unit.test.ts      # Unit tests
├── integration/componentName.int.test.ts # Integration tests
└── e2e/featureName.e2e.test.ts          # End-to-end tests
```

### Unit Testing

Unit tests should:

- Test individual functions in isolation
- Cover all code paths and edge cases
- Use descriptive test names
- Include both positive and negative test cases

**Example Unit Test**:

```typescript
describe('HeaderProcessor', () => {
  let processor: HeaderProcessor;

  beforeEach(() => {
    processor = new HeaderProcessor();
  });

  describe('process()', () => {
    it('should number headers with l. notation correctly', () => {
      const input = 'l. First\nll. Second\nlll. Third';
      const expected = '1. First\n1.1. Second\n1.1.1. Third';

      const result = processor.process(input);

      expect(result).toBe(expected);
    });

    it('should handle empty content gracefully', () => {
      const result = processor.process('');
      expect(result).toBe('');
    });

    it('should preserve non-header content unchanged', () => {
      const input = 'Regular text\nl. Header\nMore text';
      const result = processor.process(input);

      expect(result).toContain('Regular text');
      expect(result).toContain('More text');
      expect(result).toContain('1. Header');
    });
  });
});
```

### Integration Testing

Integration tests should:

- Test complete workflows
- Verify component interactions
- Test with realistic data
- Cover error scenarios

**Example Integration Test**:

```typescript
describe('Legal Document Processing Integration', () => {
  it('should process complete legal document with all features', async () => {
    const input = `
---
title: Test Agreement
parties:
  - name: Company A
    type: Corporation
---

l. Introduction
This agreement is between |parties.0.name|.

[Optional clause]{include_optional}.
    `;

    const result = await processLegalMarkdown(input, {
      basePath: './test-fixtures',
      exportMetadata: true,
    });

    expect(result.content).toContain('1. Introduction');
    expect(result.content).toContain('Company A');
    expect(result.metadata).toHaveProperty('title', 'Test Agreement');
    expect(result.exportedFiles).toHaveLength(1);
  });
});
```

### E2E Testing

End-to-end tests should:

- Test the CLI interface
- Use realistic document examples
- Verify file input/output operations
- Test error handling and edge cases

### Test Data Management

- **Fixtures**: Store test data in `tests/fixtures/`
- **Snapshots**: Use Jest snapshots for complex output verification
- **Mocking**: Mock external dependencies appropriately
- **Cleanup**: Ensure tests clean up temporary files

## 📝 Code Style and Standards

### TypeScript Guidelines

1. **Strict Configuration**: Use strict TypeScript settings
2. **Type Definitions**: Prefer interfaces for object shapes
3. **Generic Types**: Use generics for reusable components
4. **Avoid Any**: Never use `any` type unless absolutely necessary

### Code Formatting

- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and consistency
- **Naming Conventions**:
  - PascalCase for classes and interfaces
  - camelCase for functions and variables
  - UPPER_SNAKE_CASE for constants
  - kebab-case for file names

### Documentation Standards

1. **JSDoc Comments**: Document all public APIs
2. **README Updates**: Update documentation for new features
3. **Type Documentation**: Include examples in type definitions
4. **Architecture Docs**: Update architecture documentation for significant
   changes

## 🔄 Contribution Workflow

### Branch Strategy

```bash
main                    # Production-ready code
├── develop            # Integration branch for features
├── feature/feature-name   # Feature development
├── fix/bug-description    # Bug fixes
└── docs/documentation     # Documentation updates
```

### Pull Request Process

1. **Create Feature Branch**:

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**: Follow development guidelines

3. **Add Tests**: Ensure comprehensive test coverage

4. **Run Quality Checks**:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

5. **Commit Changes**:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push Branch**:

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create Pull Request**: Use the provided template

### Commit Message Format

Follow Conventional Commits specification:

```text
type(scope): description

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples**:

```bash
feat(core): add header numbering reset option
fix(parser): handle malformed YAML gracefully
docs(api): update helper function documentation
test(integration): add comprehensive workflow tests
```

### Code Review Guidelines

**For Authors**:

- Provide clear PR descriptions
- Include test coverage information
- Respond promptly to feedback
- Keep PRs focused and reasonably sized

**For Reviewers**:

- Review for functionality, design, and maintainability
- Test the changes locally when possible
- Provide constructive feedback
- Approve when satisfied with quality

## 🚨 Common Pitfalls and Solutions

### 1. Breaking Core Compatibility

**Problem**: Changes to core functionality break Ruby version compatibility

**Solution**:

- Always run compatibility tests before submitting
- Keep breaking changes in extensions only
- Document any intentional compatibility changes

### 2. Inadequate Test Coverage

**Problem**: New features lack comprehensive testing

**Solution**:

- Write tests before implementing features (TDD)
- Aim for >90% test coverage
- Include edge cases and error scenarios

### 3. Type Safety Issues

**Problem**: Using `any` types or missing type definitions

**Solution**:

- Define proper interfaces for all data structures
- Use union types for multiple possibilities
- Leverage TypeScript strict mode

### 4. Performance Regressions

**Problem**: New features slow down processing

**Solution**:

- Profile code with performance testing
- Use efficient algorithms and data structures
- Consider lazy loading for expensive operations

## 🎯 Areas for Contribution

### High Priority

1. **Core Feature Completeness**: Ensure 100% Ruby compatibility
2. **Test Coverage**: Achieve comprehensive test coverage
3. **Performance Optimization**: Improve processing speed
4. **Documentation**: Complete API and user documentation

### Medium Priority

1. **Additional File Formats**: Support more input formats
2. **Enhanced PDF Generation**: Advanced PDF styling options
3. **Batch Processing**: Improved multi-file processing
4. **Plugin System**: Extensible architecture for custom processors

### Nice to Have

1. **IDE Integration**: VS Code extension for Legal Markdown
2. **Web Interface**: Browser-based document processor
3. **Cloud Integration**: Direct cloud storage support
4. **Collaborative Features**: Multi-user document editing

## 📞 Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Discord**: Real-time community chat (link in README)

### Documentation Resources

- **[API Reference](docs/api-reference.md)**: Complete API documentation
- **[Architecture Guide](ARCHITECTURE.md)**: System architecture overview
- **[Compatibility Guide](COMPATIBILITY.md)**: Feature compatibility tracking
- **[Examples](examples/)**: Practical usage examples

### Maintainer Contact

For significant contributions or architectural questions:

- Create a GitHub issue with the "question" label
- Tag maintainers in discussions
- Use the "RFC" (Request for Comments) issue template for major changes

## 🙏 Recognition

Contributors will be recognized in:

- **CONTRIBUTORS.md**: List of all contributors
- **Release Notes**: Recognition for significant contributions
- **GitHub Contributors**: Automatic GitHub contributor recognition

Thank you for contributing to Legal Markdown JS! Your contributions help make
legal document processing more accessible and powerful for everyone.
