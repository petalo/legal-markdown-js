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
├── core/                    # 🎯 Core functionality (Ruby-compatible only)
│   ├── helpers/            # Basic Ruby-compatible helpers only
│   │   ├── date-helpers.ts         # Only @today basic functionality
│   │   └── index.ts                # Core helper exports
│   ├── utils/              # Core utility functions
│   │   ├── object-flattener.ts     # Object flattening for granular merging
│   │   ├── frontmatter-merger.ts   # YAML frontmatter merging logic
│   │   └── reserved-fields-filter.ts # Security filtering for imports
│   ├── tracking/           # Core field tracking interfaces
│   │   └── field-state.ts          # FieldState and CoreFieldState types
│   └── index.ts            # Core module exports
├── processors/             # 🔄 Document processing components (legacy structure)
│   ├── header-processor.ts         # l., ll., lll. header numbering
│   ├── clause-processor.ts         # [text]{condition} optional clauses
│   ├── reference-processor.ts      # |reference| cross-references
│   ├── import-processor.ts         # @import file inclusion with frontmatter merging
│   ├── mixin-processor.ts          # {{variable}} template substitution (legacy)
│   └── date-processor.ts           # @today date processing
├── extensions/             # 🚀 Modern Node.js enhancements
│   ├── helpers/            # Advanced helper functions (Node.js only)
│   │   ├── advanced-date-helpers.ts  # Complex date operations
│   │   ├── number-helpers.ts         # Currency, formatting
│   │   ├── string-helpers.ts         # String manipulation
│   │   └── index.ts                  # Extension helper exports
│   ├── generators/         # Output generation (Node.js only)
│   │   ├── html-generator.ts         # HTML output generation
│   │   ├── pdf-generator.ts          # PDF generation
│   │   ├── pdf-templates.ts          # PDF template system
│   │   └── index.ts                  # Generator exports
│   ├── parsers/            # Advanced format parsers (Node.js only)
│   │   ├── content-detector.ts       # Auto-detect file formats
│   │   ├── fallback-parsers.ts       # Fallback conversion
│   │   ├── pandoc-loader.ts          # Pandoc integration
│   │   ├── pandoc-parser.ts          # Pandoc processing
│   │   ├── pandoc-factory.ts         # Pandoc factory
│   │   └── index.ts                  # Parser exports
│   ├── tracking/           # Enhanced field tracking (Node.js only)
│   │   └── field-tracker.ts          # Advanced field tracking
│   ├── pipeline/           # 🎯 Modern Pipeline System (v2.4.0+)
│   │   ├── types.ts                  # Pipeline interfaces and types
│   │   ├── pipeline-manager.ts       # Core pipeline orchestration
│   │   ├── pipeline-logger.ts        # Performance monitoring and logging
│   │   └── pipeline-config.ts        # Default pipeline configurations
│   ├── ast-mixin-processor.ts        # 🔬 AST-based mixin processing
│   ├── template-loops.ts             # {{#items}}...{{/items}} loop processing
│   ├── batch-processor.ts            # Multi-file processing
│   ├── rst-parser.ts                 # reStructuredText support
│   ├── latex-parser.ts               # LaTeX document support
│   ├── validators/         # Document validation utilities
│   │   └── index.ts                  # Document structure validation
│   ├── formatters/         # Advanced output formatting
│   │   └── index.ts                  # HTML/PDF output generation
│   ├── utilities/          # Analysis and utility functions
│   │   └── index.ts                  # Document analysis utilities
│   └── index.ts            # Extensions module exports
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
├── browser.ts              # Browser entry point
└── types.ts                # Legacy type definitions (deprecated)

tests/
├── unit/                   # Unit tests
│   ├── core/              # Core functionality tests
│   │   ├── file-formats.unit.test.ts           # Core file format tests
│   │   ├── yaml-parser.unit.test.ts            # YAML parsing tests
│   │   ├── advanced-features.unit.test.ts      # Core feature tests
│   │   ├── force-commands-parser.unit.test.ts  # Force commands tests
│   │   ├── utils/          # Core utility tests
│   │   │   ├── object-flattener.unit.test.ts   # Object flattening tests
│   │   │   ├── frontmatter-merger.unit.test.ts # Frontmatter merging tests
│   │   │   └── reserved-fields-filter.unit.test.ts # Security filtering tests
│   │   └── mixin-processor-helpers.test.ts     # Core helper tests
│   ├── processors/        # Legacy processor unit tests
│   │   ├── header-processor.unit.test.ts       # Header processing tests
│   │   ├── clause-processor.unit.test.ts       # Clause processing tests
│   │   ├── reference-processor.unit.test.ts    # Reference processing tests
│   │   ├── import-processor.unit.test.ts       # Import processing tests
│   │   ├── mixin-processor.unit.test.ts        # Legacy mixin tests
│   │   └── date-processor.unit.test.ts         # Date processing tests
│   ├── extensions/        # Modern extension tests
│   │   ├── helpers/       # Extension helper tests
│   │   │   ├── date-helpers.test.ts             # Advanced date helper tests
│   │   │   ├── number-helpers.test.ts           # Number helper tests
│   │   │   └── string-helpers.test.ts           # String helper tests
│   │   ├── generators/    # Generator tests
│   │   │   ├── html-generator.unit.test.ts      # HTML generation tests
│   │   │   ├── pdf-templates.unit.test.ts       # PDF template tests
│   │   │   └── pdf-logo-detection.unit.test.ts # PDF logo tests
│   │   ├── parsers/       # Parser tests
│   │   │   ├── content-detector.test.ts         # Content detection tests
│   │   │   ├── fallback-parsers.test.ts         # Fallback parser tests
│   │   │   └── pandoc-loader.test.ts            # Pandoc loader tests
│   │   ├── tracking/      # Field tracking tests
│   │   │   └── field-tracker.unit.test.ts       # Enhanced tracking tests
│   │   ├── ast-mixin-processor.unit.test.ts     # AST processing tests
│   │   ├── pipeline-manager.unit.test.ts        # Pipeline system tests
│   │   ├── template-loops.unit.test.ts          # Template loop tests
│   │   ├── batch-processor.unit.test.ts         # Batch processing tests
│   │   ├── rst-parser.unit.test.ts              # RST parser tests
│   │   └── latex-parser.unit.test.ts            # LaTeX parser tests
│   ├── exporters/         # Exporter tests
│   │   └── metadata-exporter.unit.test.ts       # Metadata export tests
│   ├── constants/         # Constants tests
│   │   └── paths.unit.test.ts                   # Path configuration tests
│   └── cli/               # CLI tests
│       └── stdin-stdout.unit.test.ts            # CLI input/output tests
├── integration/           # Integration tests
│   ├── core-functionality.test.ts              # Core workflow integration
│   ├── legal-markdown.integration.test.ts      # Main processing integration
│   ├── frontmatter-merge.integration.test.ts   # Frontmatter merging integration
│   ├── template-loops.integration.test.ts      # Template loop integration
│   ├── pdf-generation.integration.test.ts      # PDF generation integration
│   ├── examples-validation.integration.test.ts # Example validation
│   └── paths-validation.integration.test.ts    # Path handling validation
├── e2e/                   # End-to-end tests
│   ├── cli.e2e.test.ts               # CLI interface tests
│   └── pdf-generation.e2e.test.ts   # Complete PDF workflow tests
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

### Modern Pipeline System (v2.4.0+)

Legal Markdown JS now features a modern pipeline architecture for enhanced
processing:

#### Pipeline Components

1. **Pipeline Manager** (`src/extensions/pipeline/pipeline-manager.ts`):
   - Orchestrates step-by-step document processing
   - Handles dependencies between processing steps
   - Provides comprehensive error handling and recovery
   - Includes performance monitoring and metrics

2. **Pipeline Configuration** (`src/extensions/pipeline/pipeline-config.ts`):
   - Pre-configured processing pipelines for different use cases
   - `createDefaultPipeline()` - Standard document processing
   - `createHtmlPipeline()` - HTML output with field tracking
   - Configurable step ordering and dependencies

3. **AST Mixin Processor** (`src/extensions/ast-mixin-processor.ts`):
   - Prevents text contamination issues from the legacy processor
   - Uses Abstract Syntax Tree parsing for clean variable substitution
   - Supports all mixin types: variables, helpers, conditionals
   - Automatic bracket value detection for missing fields

#### Pipeline Development Guidelines

When working on pipeline components:

```typescript
/**
 * Example Pipeline Step Implementation
 */
export class CustomProcessor implements BaseProcessor {
  public isEnabled(options: LegalMarkdownOptions): boolean {
    return options.enableCustomProcessing ?? true;
  }

  public process(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string {
    // Process content here
    return processedContent;
  }
}

// Register with pipeline
const pipeline = createDefaultPipeline();
pipeline.registerStep({
  name: 'custom-processing',
  processor: new CustomProcessor(),
  order: 9, // After mixins (8) but before final steps
  enabled: true,
  dependencies: ['mixins'], // Requires mixins to complete first
});
```

#### AST Processing Guidelines

When extending AST functionality:

```typescript
/**
 * AST Node Processing Example
 */
export function processCustomNodes(
  nodes: MixinNode[],
  metadata: Record<string, any>
): string {
  return nodes
    .map(node => {
      if (node.type === 'text') {
        return node.content;
      }

      // Process mixin nodes with isolated context
      const resolvedValue = resolveCustomMixin(node.variable, metadata);

      // Track field for highlighting/validation
      fieldTracker.trackField(node.variable, {
        value: resolvedValue,
        mixinUsed: 'custom',
      });

      return String(resolvedValue);
    })
    .join('');
}
```

### Core Functionality Development

When working on `src/core/` components:

1. **Pipeline Integration**: Implement BaseProcessor interface for pipeline
   compatibility
2. **Type Safety**: Use strict typing with proper interfaces
3. **Test Coverage**: Include comprehensive unit tests
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

### Enhanced Field Tracking System

The field tracking system (`src/tracking/field-tracker.ts`) provides
comprehensive field monitoring:

#### Field Tracking Guidelines

1. **Mixin Type Classification**: Track whether fields use variables, helpers,
   or conditionals
2. **Status Detection**: Automatically classify fields as filled, empty, or
   logic-based
3. **HTML Generation**: Support for highlighting with CSS classes when enabled
4. **Performance**: Efficient tracking for large documents

**Example Field Tracking Usage**:

```typescript
import { fieldTracker, FieldStatus } from '../tracking/field-tracker';

// Track a field during processing
fieldTracker.trackField('client.name', {
  value: 'Acme Corporation',
  mixinUsed: 'variable', // 'variable' | 'helper' | 'conditional'
  hasLogic: false,
});

// Generate comprehensive report
const report = fieldTracker.generateReport();
console.log(`Total fields: ${report.total}`);
console.log(
  `Filled: ${report.filled}, Empty: ${report.empty}, Logic: ${report.logic}`
);

// Get fields by status
const emptyFields = fieldTracker.getFieldsByStatus(FieldStatus.EMPTY);
```

#### Field Tracking Integration

When creating new processors, integrate field tracking:

```typescript
export class CustomProcessor implements BaseProcessor {
  public process(content: string, metadata: Record<string, any>): string {
    // Process content and track fields
    const processedContent = this.processContent(content, metadata);

    // Track discovered fields
    this.discoveredFields.forEach(field => {
      fieldTracker.trackField(field.name, {
        value: field.resolvedValue,
        mixinUsed: field.type,
        hasLogic: field.type !== 'variable',
      });
    });

    return processedContent;
  }
}
```

### Helper System Development

**Core Helpers (`src/core/helpers/`)**

Core helpers should only include basic functionality that exists in the original
Ruby legal-markdown gem:

- Basic date functionality (@today)
- Simple formatting that maintains Ruby compatibility
- No complex Node.js specific features

**Extension Helpers (`src/extensions/helpers/`)**

When adding new helpers to the extensions system:

1. **Pure Functions**: Helpers should be stateless and pure
2. **Error Handling**: Graceful handling of invalid inputs
3. **Type Safety**: Strong typing for all parameters and returns
4. **Documentation**: Clear examples in JSDoc comments
5. **AST Compatibility**: Ensure helpers work with the AST processor

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
- Test pipeline components thoroughly
- Verify AST processing correctness
- Validate field tracking integration
- Test frontmatter merging scenarios (conflicts, security, types)

**Example Pipeline Component Test**:

```typescript
describe('Pipeline Manager', () => {
  it('should execute pipeline steps in correct order', async () => {
    const pipeline = createDefaultPipeline();
    const content = '{{name}} - {{formatDate(@today, "YYYY-MM-DD")}}';
    const metadata = { name: 'John Doe' };
    const options = { legalMarkdownOptions: {} };

    const result = await pipeline.execute(content, metadata, options);

    expect(result.success).toBe(true);
    expect(result.content).toContain('John Doe');
    expect(result.stepResults).toHaveLength(6); // All pipeline steps
  });

  it('should handle null content gracefully', async () => {
    const pipeline = createDefaultPipeline();
    const result = await pipeline.execute(
      null as any,
      {},
      {
        legalMarkdownOptions: {},
      }
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });
});
```

**Example AST Processor Test**:

```typescript
describe('AST Mixin Processor', () => {
  beforeEach(() => {
    fieldTracker.clear();
  });

  it('should prevent text contamination in variable resolution', () => {
    const content = 'Client: {{client.name}}. Phone: {{client.phone}}';
    const metadata = {
      client: {
        name: 'John Smith & Associates', // Contains special characters
        phone: '555-0123',
      },
    };

    const result = processMixins(content, metadata);

    expect(result).toBe('Client: John Smith & Associates. Phone: 555-0123');
    // Should not contaminate other variable resolution
  });

  it('should track fields correctly during AST processing', () => {
    const content = 'Name: {{name}}, Date: {{formatDate(@today)}}';
    const metadata = { name: 'John Doe' };
    const options = { enableFieldTracking: true };

    processMixins(content, metadata, options);

    const fields = fieldTracker.getFields();
    expect(fields.get('name')?.status).toBe(FieldStatus.FILLED);
    expect(fields.get('formatDate(@today)')?.status).toBe(FieldStatus.LOGIC);
  });
});
```

**Example Frontmatter Merging Test**:

```typescript
describe('Frontmatter Merger', () => {
  it('should merge frontmatter with source always wins strategy', () => {
    const current = {
      title: 'Main Document',
      client: { name: 'Main Client' },
      liability_cap: 500000,
    };
    const imported = {
      client: {
        name: 'Imported Client', // Conflict - current wins
        industry: 'Manufacturing', // New field - added
      },
      liability_cap: 1000000, // Conflict - current wins
      payment_terms: 'Net 30', // New field - added
    };

    const result = mergeFlattened(current, imported);

    expect(result.client.name).toBe('Main Client'); // Current wins
    expect(result.client.industry).toBe('Manufacturing'); // Added from import
    expect(result.liability_cap).toBe(500000); // Current wins
    expect(result.payment_terms).toBe('Net 30'); // Added from import
  });

  it('should filter reserved fields for security', () => {
    const current = { title: 'Document' };
    const imported = {
      title: 'Imported Title',
      'level-one': 'HACKED %n', // Should be filtered
      force_commands: 'rm -rf /', // Should be filtered
      'meta-yaml-output': '/etc/passwd', // Should be filtered
      legitimate_field: 'safe value', // Should be allowed
    };

    const result = mergeFlattened(current, imported);

    expect(result.title).toBe('Document'); // Current wins
    expect(result['level-one']).toBeUndefined(); // Filtered out
    expect(result['force_commands']).toBeUndefined(); // Filtered out
    expect(result['meta-yaml-output']).toBeUndefined(); // Filtered out
    expect(result.legitimate_field).toBe('safe value'); // Allowed through
  });

  it('should handle type conflicts with validation', () => {
    const current = {
      count: 42,
      config: { debug: true },
    };
    const imported = {
      count: 'not a number', // Type conflict
      config: 'not an object', // Type conflict
      valid_field: 'string value', // No conflict
    };

    const result = mergeFlattened(current, imported, {
      validateTypes: true,
      returnStatistics: true,
    });

    expect(result.merged.count).toBe(42); // Original preserved
    expect(result.merged.config.debug).toBe(true); // Original preserved
    expect(result.merged.valid_field).toBe('string value'); // Added
    expect(result.statistics.typeConflicts).toHaveLength(2); // Two conflicts logged
  });

  it('should handle timeout protection', () => {
    const circularObj: any = { name: 'test' };
    circularObj.self = circularObj; // Create circular reference

    expect(() => {
      mergeFlattened({}, { circular: circularObj }, { timeoutMs: 100 });
    }).not.toThrow(); // Should handle gracefully with timeout
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

  it('should process documents with frontmatter merging', async () => {
    // Create test files
    const mainContent = `
---
title: "Enterprise Agreement"
client:
  name: "Default Client"    # Will be overridden
liability_cap: 500000       # Main document wins
---

# {{title}}
Client: {{client.name}}

@import components/client-info.md
@import components/standard-terms.md
    `;

    const clientInfoContent = `
---
client:
  name: "Acme Corporation"  # Overrides main
  industry: "Manufacturing" # Added to metadata
liability_cap: 2000000      # Loses to main document
payment_terms: "Net 15"    # Added to metadata
---

**Industry:** {{client.industry}}
    `;

    // Write test files
    await fs.writeFile('./test-main.md', mainContent);
    await fs.writeFile('./components/client-info.md', clientInfoContent);

    const result = await processLegalMarkdown('./test-main.md', {
      basePath: './',
      exportMetadata: true,
    });

    // Verify frontmatter merging
    expect(result.content).toContain('Enterprise Agreement');
    expect(result.content).toContain('Acme Corporation'); // From import
    expect(result.content).toContain('Manufacturing'); // From import
    expect(result.metadata.liability_cap).toBe(500000); // Main wins
    expect(result.metadata.client.name).toBe('Acme Corporation'); // Import wins
    expect(result.metadata.payment_terms).toBe('Net 15'); // From import

    // Cleanup
    await fs.unlink('./test-main.md');
    await fs.unlink('./components/client-info.md');
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

## 🔍 Logging and Debugging

### Logging Levels

Legal Markdown JS uses a comprehensive logging system with configurable levels
to provide the right amount of information for different environments and use
cases.

#### Available Log Levels

The system supports the following log levels (from most verbose to least
verbose):

1. **`debug`** - Detailed debugging information including:
   - Pipeline step execution details
   - Field tracking operations
   - AST processing steps
   - Template variable resolution
   - Performance metrics for each processing step

2. **`info`** - General informational messages including:
   - Pipeline execution summaries
   - Document processing completion
   - File generation notifications
   - Configuration loading status

3. **`warn`** - Warning messages for non-critical issues:
   - Missing optional fields
   - Import file resolution issues
   - Type conflicts in frontmatter merging
   - Performance warnings

4. **`error`** - Error messages for critical issues:
   - Processing failures
   - File system errors
   - Invalid document structure
   - Unrecoverable parsing errors

5. **`none`** - Completely silent operation (no log output)

#### Default Behavior

- **Production/CLI**: Default to `error` level for quiet operation
- **Development**: Use `debug` level when `NODE_ENV=development`
- **Testing**: Use `none` level to avoid test output pollution

#### Configuring Log Levels

**Environment Variables:**

```bash
# Set general logging level
export LOG_LEVEL=info

# Enable development mode with debug logging
export NODE_ENV=development

# For completely silent operation
export LOG_LEVEL=none
```

**Programmatic Configuration:**

```typescript
import { logger } from './src/utils/logger';
import {
  ConsolePipelineLogger,
  LogLevel,
} from './src/extensions/pipeline/pipeline-logger';

// Configure general logger
logger.setLogLevel('warn'); // Only warnings and errors

// Configure pipeline logger
const pipelineLogger = new ConsolePipelineLogger({
  level: LogLevel.INFO,
  enableMetrics: true,
  enableColors: true,
});
```

#### Logger Components

**1. General Logger (`src/utils/logger.ts`)**

- Handles application-wide logging
- Used by generators, parsers, and utilities
- Controlled by `LOG_LEVEL` environment variable

**2. Pipeline Logger (`src/extensions/pipeline/pipeline-logger.ts`)**

- Specialized for pipeline system logging
- Provides detailed execution metrics
- Includes performance profiling and step timing

#### Development Guidelines

**When to Use Each Level:**

```typescript
// DEBUG: Detailed processing information
logger.debug('Processing mixin node', {
  variable: 'client.name',
  resolvedValue: 'Acme Corp',
});

// INFO: Important operation completion
logger.info('PDF generated successfully', {
  outputPath: './contract.pdf',
  size: 207760,
});

// WARN: Non-critical issues that should be noted
logger.warn('Missing optional field', {
  field: 'client.phone',
  document: 'contract.md',
});

// ERROR: Critical failures
logger.error('Failed to parse YAML frontmatter', {
  error: 'Invalid syntax at line 5',
  file: 'document.md',
});
```

**Pipeline Logging Example:**

```typescript
// Pipeline logs automatically include timing and metrics
const pipeline = createDefaultPipeline();
const result = await pipeline.execute(content, metadata, {
  legalMarkdownOptions: { enableFieldTracking: true },
  enableStepProfiling: true, // Enable detailed step timing
});
```

**Log Output Examples:**

```bash
# ERROR level (default) - Only critical issues
[ERROR] Failed to parse document: Invalid YAML syntax

# INFO level - Operation summaries
[INFO] PDF generated successfully { outputPath: "./contract.pdf", size: 207760 }

# DEBUG level - Detailed pipeline information
2025-07-28T18:56:15.901Z [PIPELINE] DEBUG Step 'mixins' starting { inputSize: "23.6 KB" }
2025-07-28T18:56:15.902Z [PIPELINE] INFO Step 'mixins' completed {
  "duration": "1ms",
  "fieldsTracked": 12,
  "success": true
}
```

#### Testing with Logging

**Disable logging in tests:**

```typescript
beforeEach(() => {
  logger.setLogLevel('none');
});
```

**Test log output:**

```typescript
it('should log processing errors', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  // Code that should log an error
  processInvalidDocument();

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));

  consoleSpy.mockRestore();
});
```

#### Performance Considerations

- **Production**: Use `error` level to minimize I/O overhead
- **Development**: Use `debug` level for comprehensive debugging
- **CI/CD**: Use `warn` level to catch issues without excessive output
- **Metrics**: Pipeline metrics can be disabled with `enableMetrics: false`

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

We use **GitHub Flow** with branch protection:

```bash
main                      # Production-ready code (protected)
├── feature/feature-name  # Feature development
├── hotfix/bug-fix       # Critical bug fixes
└── docs/documentation   # Documentation updates
```

**Branch Protection Rules:**

- ✅ Pull requests required for all changes to `main`
- ✅ CI must pass (all Node.js versions + security audit)
- ✅ At least 1 reviewer approval required
- ✅ Branches must be up to date before merge
- ⚠️ Admin bypass enabled for emergency hotfixes

### Pull Request Process

**Standard Workflow** (recommended for all changes):

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

7. **Create Pull Request**:

   ```bash
   gh pr create --title "feat: add amazing feature" --body "Description of changes"
   ```

8. **Wait for CI**: All status checks must pass
9. **Code Review**: Get approval from reviewer
10. **Merge via GitHub**: Use GitHub UI to merge

**Emergency Hotfix Workflow** (admin only):

```bash
git checkout -b hotfix/critical-fix
# Make minimal fix
git push origin hotfix/critical-fix
gh pr create --title "hotfix: critical issue" --label "hotfix"
# Admin can bypass review once CI passes
```

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

## 📞 Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Discord**: Real-time community chat (link in README)

### Documentation Resources

- **[API Reference](docs/api-reference.md)**: Complete API documentation
- **[Architecture Guide](architecture.md)**: System architecture overview
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
