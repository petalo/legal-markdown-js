# PDF Generation

Generate professional PDF documents with custom styling, logos, and formatting
options for legal and business documents.

## Table of Contents

- [Basic PDF Generation](#basic-pdf-generation)
- [PDF Backend / Connector](#pdf-backend--connector)
- [PDF Options](#pdf-options)
- [Auto Headers and Footers](#auto-headers-and-footers)
- [Logo Detection](#logo-detection)
- [Template Helpers](#template-helpers)
- [Advanced Configuration](#advanced-configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Basic PDF Generation

### Command Line Usage

Generate PDFs directly from the command line:

```bash
# Basic PDF generation
legal-md document.md --pdf

# PDF with field highlighting
legal-md document.md --pdf --highlight

# PDF with custom CSS styling
legal-md document.md --pdf --css ./styles/contract.css

# PDF with a specific connector
legal-md document.md --pdf --pdf-connector puppeteer
```

### Programmatic Usage

The public `generatePdf` function processes Legal Markdown content and produces
a PDF buffer. It first runs `processLegalMarkdown` internally, then passes the
result to the PDF generator.

```typescript
import { generatePdf } from 'legal-markdown-js';

const buffer = await generatePdf(content, 'output.pdf', {
  title: 'Legal Document',
  format: 'A4',
  landscape: false,
  includeHighlighting: true,
  cssPath: './styles/legal.css',
});
```

## PDF Backend / Connector

Legal Markdown JS supports three PDF backends. The active connector is chosen
via the `pdf.connector` config key or the `LEGAL_MD_PDF_CONNECTOR` env var:

| Connector        | How to install            | Notes                                     |
| ---------------- | ------------------------- | ----------------------------------------- |
| `puppeteer`      | `npm install puppeteer`   | Self-contained; most reproducible         |
| `system-chrome`  | Install Chrome / Chromium | Zero npm footprint; uses existing browser |
| `weasyprint`     | `pip install weasyprint`  | Python-based; headless-server friendly    |
| `auto` (default) | ---                       | Tries in the order above; first wins      |

```yaml
# .legalmdrc
pdf:
  connector: system-chrome # or puppeteer | weasyprint | auto
```

```bash
# One-off override
LEGAL_MD_PDF_CONNECTOR=weasyprint legal-md document.md --pdf
```

## PDF Options

### Public API Options (`generatePdf`)

These are the options accepted by the top-level `generatePdf()` function
exported from `legal-markdown-js`:

| Option                | Type    | Default   | Description                                                 |
| --------------------- | ------- | --------- | ----------------------------------------------------------- |
| `title`               | string  | from YAML | Document title (falls back to metadata)                     |
| `format`              | string  | `'A4'`    | Page format: `A4`, `Letter`, or `Legal`                     |
| `landscape`           | boolean | `false`   | Page orientation                                            |
| `pdfConnector`        | string  | `'auto'`  | Backend: `auto`, `puppeteer`, `system-chrome`, `weasyprint` |
| `includeHighlighting` | boolean | `false`   | Include field highlighting styles                           |
| `cssPath`             | string  | ---       | Path to custom CSS file                                     |
| `highlightCssPath`    | string  | ---       | Path to highlighting CSS file                               |

All standard `LegalMarkdownOptions` (e.g., `debug`, `enableFieldTracking`) are
also accepted and forwarded to the processing pipeline.

### Internal `PdfGeneratorOptions`

The internal `PdfGeneratorOptions` interface (used by
`pdfGenerator.generatePdf`) extends `HtmlGeneratorOptions` and adds these
PDF-specific properties:

| Option                | Type    | Default   | Description                                     |
| --------------------- | ------- | --------- | ----------------------------------------------- |
| `format`              | string  | `'A4'`    | Page format: `A4`, `Letter`, or `Legal`         |
| `landscape`           | boolean | `false`   | Page orientation                                |
| `margin`              | object  | see below | Page margins (`top`, `right`, `bottom`, `left`) |
| `displayHeaderFooter` | boolean | `false`   | Show headers and footers (auto-set to `true`)   |
| `headerTemplate`      | string  | ---       | Custom HTML template for page headers           |
| `footerTemplate`      | string  | ---       | Custom HTML template for page footers           |
| `printBackground`     | boolean | `true`    | Include CSS background colors/images            |
| `preferCSSPageSize`   | boolean | `false`   | Use CSS page size if specified                  |
| `cssPath`             | string  | ---       | Path to CSS file (also used for logo detection) |
| `version`             | string  | ---       | Document version displayed in footer            |

Default margins when auto-generated headers/footers are active:

```typescript
{ top: '3cm', right: '1cm', bottom: '3cm', left: '1cm' }
```

Default margins otherwise:

```typescript
{ top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
```

## Auto Headers and Footers

When no custom `headerTemplate` or `footerTemplate` is provided, the PDF
generator automatically generates headers and footers using `PdfTemplates`:

- **Header**: Empty div (no logo) or a right-aligned logo image if a logo is
  detected from the CSS file.
- **Footer**: Right-aligned page numbers in the format "Pg: 1 / 10". If a
  `version` option is provided, it also shows the version on the left side.

When auto-generated templates are active, `displayHeaderFooter` is automatically
set to `true` and top/bottom margins are increased to 3cm (unless custom margins
are specified).

If custom `headerTemplate` or `footerTemplate` values are provided, the auto
behavior is skipped and the custom templates are used as-is.

## Logo Detection

### Automatic Logo Detection

The PDF generator automatically detects logos from CSS files when `cssPath` is
provided. It looks for a `--logo-filename` custom property:

```css
/* In your CSS file (e.g., styles/contract.css) */
:root {
  --logo-filename: logo.company.png;
}
```

The logo filename can be a local file (resolved relative to the configured
images directory) or an external URL (`http://` or `https://`).

### Logo Requirements

- **Format**: PNG only (validated via magic number bytes)
- **Size**: Maximum 500KB
- **Location**: Local files are resolved from the configured images directory
- **Reference**: Use `--logo-filename` CSS custom property

### Logo Integration Process

1. **Detection**: Parses CSS for `--logo-filename` property
2. **Resolution**: Determines if the value is a URL or local filename
3. **Validation**: Checks file exists, is PNG format, and within 500KB limit
4. **Encoding**: Converts to base64 for embedding in PDF header
5. **Fallback**: Continues without logo if any step fails (graceful degradation)

## Template Helpers

The `PdfTemplates` class provides static methods for generating header and
footer HTML templates. These are used internally by the PDF generator but can
also be used directly for custom PDF workflows.

```typescript
import { PdfTemplates } from 'legal-markdown-js';
import { PDF_TEMPLATE_CONSTANTS } from 'legal-markdown-js';

// Generate templates programmatically
const logoBase64 = 'iVBORw0KGgoAAAANS...'; // raw base64, no data URI prefix

const headerTemplate = PdfTemplates.generateHeaderTemplate(logoBase64);
const footerTemplate = PdfTemplates.generateFooterTemplate('1.0.0');
const customHeader = PdfTemplates.generateCustomHeaderTemplate(
  'Confidential',
  logoBase64
);
const customFooter = PdfTemplates.generateCustomFooterTemplate(
  '(c) 2025 Company Name'
);
```

### Available Template Helpers

| Method                           | Description                                | Parameters                |
| -------------------------------- | ------------------------------------------ | ------------------------- |
| `generateHeaderTemplate()`       | Header with optional logo (right-aligned)  | `logoBase64?: string`     |
| `generateFooterTemplate()`       | Footer with page numbers, optional version | `version?: string`        |
| `generateCustomHeaderTemplate()` | Header with text and optional logo         | `headerText, logoBase64?` |
| `generateCustomFooterTemplate()` | Footer with custom text and page numbers   | `footerText`              |

## Advanced Configuration

### Generate Multiple Versions

Create both normal and highlighted versions simultaneously:

```typescript
import { generatePdfVersions } from 'legal-markdown-js';

const { normal, highlighted } = await generatePdfVersions(
  content,
  'document.pdf',
  {
    title: 'Contract',
    cssPath: './styles/contract.css',
    format: 'A4',
  }
);

// Creates: document.pdf and document.HIGHLIGHT.pdf
console.log('Normal PDF size:', normal.length);
console.log('Highlighted PDF size:', highlighted.length);
```

### Using the Internal PDF Generator Directly

For more control, use the singleton `pdfGenerator` instance directly:

```typescript
import { pdfGenerator } from 'legal-markdown-js';
import { processLegalMarkdown } from 'legal-markdown-js';
import { asMarkdown } from 'legal-markdown-js';

// Process content first
const result = await processLegalMarkdown(content, {
  enableFieldTracking: true,
});

// Generate PDF with full PdfGeneratorOptions
const buffer = await pdfGenerator.generatePdf(result.content, './output.pdf', {
  format: 'A4',
  landscape: false,
  cssPath: './styles/contract.css',
  version: '2.1.0',
  printBackground: true,
  margin: {
    top: '2cm',
    right: '1cm',
    bottom: '2cm',
    left: '1cm',
  },
});
```

### Generate PDF from Pre-generated HTML

The `generatePdfFromHtml` method accepts pre-generated HTML and converts it
directly to PDF without re-processing the markdown. This is used internally by
the 3-phase pipeline:

```typescript
import { htmlGenerator, pdfGenerator } from 'legal-markdown-js';

// Generate HTML once
const html = await htmlGenerator.generateHtml(result.content, {
  cssPath: './styles.css',
  includeHighlighting: true,
});

// Reuse the same HTML for PDF (no re-processing)
const buffer = await pdfGenerator.generatePdfFromHtml(html, './output.pdf', {
  format: 'A4',
});
```

## Examples

### Contract Generation

```typescript
import { generatePdf } from 'legal-markdown-js';

const contractPdf = await generatePdf(contractContent, 'contract.pdf', {
  title: 'Service Agreement',
  format: 'Letter',
  cssPath: './styles/legal-contract.css',
  includeHighlighting: false,
});
```

### Highlighted Review Copy

```typescript
const reviewPdf = await generatePdf(contractContent, 'contract-review.pdf', {
  title: 'Service Agreement - Review Copy',
  format: 'A4',
  cssPath: './styles/legal-contract.css',
  includeHighlighting: true,
});
```

### Both Versions at Once

```typescript
import { generatePdfVersions } from 'legal-markdown-js';

const { normal, highlighted } = await generatePdfVersions(
  contractContent,
  'contract.pdf',
  {
    title: 'Service Agreement',
    format: 'A4',
    cssPath: './styles/legal-contract.css',
  }
);
// Creates: contract.pdf and contract.HIGHLIGHT.pdf
```

## Best Practices

### 1. CSS Optimization

```css
/* Optimize CSS for PDF generation */
@media print {
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.4;
  }

  /* Avoid page breaks inside important sections */
  .contract-clause {
    break-inside: avoid;
  }

  /* Control page breaks */
  .new-page {
    page-break-before: always;
  }
}
```

### 2. Logo Management

Keep logo files under 500KB and in PNG format. The generator validates both the
file size and PNG magic bytes before embedding.

```css
/* Reference your logo in CSS */
:root {
  --logo-filename: company-logo.png;
}
```

### 3. Performance Optimization

```typescript
// Reuse CSS path for multiple documents
const cssPath = './styles/shared-legal.css';

const documents = await Promise.all([
  generatePdf(contract1, 'contract1.pdf', { cssPath }),
  generatePdf(contract2, 'contract2.pdf', { cssPath }),
  generatePdf(contract3, 'contract3.pdf', { cssPath }),
]);

// Or use generatePdfVersions for normal + highlighted
const { normal, highlighted } = await generatePdfVersions(content, 'doc.pdf', {
  cssPath,
});
```

### 4. Error Handling

```typescript
try {
  const buffer = await generatePdf(content, 'output.pdf', options);
  console.log('PDF generated successfully');
} catch (error) {
  // Common errors:
  // - PdfDependencyError: no PDF backend available
  // - Chrome launch failure (missing browser)
  // - Invalid markdown content
  console.error('PDF generation failed:', error.message);
}
```

### 5. File Organization

```text
project/
  styles/
    legal-contract.css
    invoice.css
    shared-legal.css
  assets/
    images/
      company-logo.png
  output/
    contracts/
    invoices/
```

## Troubleshooting

### Common Issues

**PDF generation fails with PdfDependencyError:**

- Ensure at least one backend is available (puppeteer, system Chrome, or
  weasyprint)
- Run `npx puppeteer browsers install chrome` to install a bundled Chrome
- Or install Chrome/Chromium on the system

**Logo not appearing:**

- Verify PNG format and file size under 500KB
- Check `--logo-filename` CSS custom property syntax
- Ensure the file is accessible from the configured images directory

**Layout issues:**

- Test CSS with HTML output first (`--html`)
- Use print media queries for PDF-specific styles
- Check margin and page size settings

**macOS-specific Chrome issues:**

- Apple Silicon Macs may need Rosetta 2: `softwareupdate --install-rosetta`
- Check Chrome permissions if launch fails

## See Also

- [HTML Generation](html-generation.md) - Generate HTML output
- [Field Highlighting](field-highlighting.md) - Visual field tracking
- [CSS Classes](css-classes.md) - Available CSS styling classes
