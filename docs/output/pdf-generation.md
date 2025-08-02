# PDF Generation

Generate professional PDF documents with custom styling, logos, and advanced
formatting options for legal and business documents.

## Table of Contents

- [Basic PDF Generation](#basic-pdf-generation)
- [PDF Options](#pdf-options)
- [Logo Headers and Footers](#logo-headers-and-footers)
- [Template Helpers](#template-helpers)
- [Advanced Configuration](#advanced-configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

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

# PDF with custom format
legal-md document.md --pdf --format A4 --landscape
```

### Programmatic Usage

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

## PDF Options

### Core Configuration

| Option                | Type    | Default        | Description                     |
| --------------------- | ------- | -------------- | ------------------------------- |
| `title`               | string  | Document title | PDF document title              |
| `format`              | string  | 'A4'           | Page format (A4, Letter, Legal) |
| `landscape`           | boolean | false          | Page orientation                |
| `includeHighlighting` | boolean | false          | Include field highlighting      |
| `cssPath`             | string  | -              | Path to custom CSS file         |
| `displayHeaderFooter` | boolean | false          | Show headers and footers        |

### Format Options

```typescript
// Available page formats
const formats = {
  A4: { width: 8.27, height: 11.7 }, // 210 × 297 mm
  Letter: { width: 8.5, height: 11 }, // 8.5 × 11 inches
  Legal: { width: 8.5, height: 14 }, // 8.5 × 14 inches
  A3: { width: 11.7, height: 16.5 }, // 297 × 420 mm
};

// Custom page size
const buffer = await generatePdf(content, 'output.pdf', {
  format: 'A4',
  landscape: true,
  margin: {
    top: '0.5in',
    right: '0.5in',
    bottom: '0.5in',
    left: '0.5in',
  },
});
```

## Logo Headers and Footers

### Automatic Logo Detection

The PDF generator automatically detects and includes logos when a CSS file
contains logo configuration:

```css
/* In your CSS file (e.g., styles/contract.css) */
:root {
  --logo-filename: logo.company.png;
}

/* Optional logo styling */
.header-logo {
  height: 40px;
  width: auto;
}
```

```typescript
import { generatePdf } from 'legal-markdown-js';

// Logo automatically detected and included in header
const buffer = await generatePdf(content, 'output.pdf', {
  cssPath: './styles/contract.css', // Contains --logo-filename
  format: 'A4',
  displayHeaderFooter: true,
});
```

### Manual Header/Footer Templates

Create custom headers and footers with full HTML/CSS control:

```typescript
const buffer = await generatePdf(content, 'output.pdf', {
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="width: 100%; text-align: right; padding-right: 25mm;">
      <img src="data:image/png;base64,iVBORw0..." style="height: 40px;" />
      <span style="font-size: 10px; margin-left: 10px;">Confidential</span>
    </div>
  `,
  footerTemplate: `
    <div style="width: 100%; text-align: center; padding: 10px 25mm; font-size: 10px;">
      <span>Company Legal Services</span>
      <span style="float: right;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `,
  margin: {
    top: '1in', // Space for header
    bottom: '1in', // Space for footer
  },
});
```

### Logo Requirements

- **Format**: PNG only (for best compatibility)
- **Size**: Maximum 500KB (for performance)
- **Location**: Place in accessible directory (e.g., `assets/images/`)
- **Reference**: Use `--logo-filename` CSS variable to specify

### Logo Integration Process

1. **Detection**: System scans CSS for `--logo-filename` property
2. **Validation**: Checks file exists, is PNG format, and within size limits
3. **Encoding**: Converts to base64 for embedding in PDF
4. **Template Generation**: Creates header/footer with logo positioning
5. **Fallback**: Continues without logo if any step fails

## Template Helpers

Use built-in template helpers for consistent PDF generation:

```typescript
import { PdfTemplates } from 'legal-markdown-js/generators/pdf-templates';
import { PDF_TEMPLATE_CONSTANTS } from 'legal-markdown-js/constants';

// Generate templates programmatically
const logoBase64 = 'data:image/png;base64,iVBORw0...';

const headerTemplate = PdfTemplates.generateHeaderTemplate(logoBase64);
const footerTemplate = PdfTemplates.generateFooterTemplate();
const customHeader = PdfTemplates.generateCustomHeaderTemplate(
  'Confidential',
  logoBase64
);

const buffer = await generatePdf(content, 'output.pdf', {
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
  margin: PDF_TEMPLATE_CONSTANTS.DEFAULT_MARGINS,
});
```

### Available Template Helpers

| Method                           | Description                       | Usage             |
| -------------------------------- | --------------------------------- | ----------------- |
| `generateHeaderTemplate()`       | Standard header with logo         | Company documents |
| `generateFooterTemplate()`       | Standard footer with page numbers | Most documents    |
| `generateCustomHeaderTemplate()` | Header with custom text + logo    | Confidential docs |
| `generateLegalFooterTemplate()`  | Footer with legal disclaimers     | Legal documents   |

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
console.log('Normal PDF:', normal);
console.log('Highlighted PDF:', highlighted);
```

### PDF Metadata

```typescript
const buffer = await generatePdf(content, 'output.pdf', {
  title: 'Service Agreement',
  subject: 'Legal Contract',
  author: 'Legal Department',
  creator: 'Legal Markdown JS',
  keywords: ['contract', 'legal', 'agreement'],
  creationDate: new Date(),
  modificationDate: new Date(),
});
```

### Print Options

```typescript
const buffer = await generatePdf(content, 'output.pdf', {
  printBackground: true, // Include CSS background colors/images
  preferCSSPageSize: true, // Use CSS page size if specified
  scale: 1.0, // Page scale factor
  paperWidth: 8.5, // Custom paper width (inches)
  paperHeight: 11, // Custom paper height (inches)
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
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="text-align: center; width: 100%; font-size: 10px; padding: 10px;">
      <strong>CONFIDENTIAL</strong>
    </div>
  `,
  footerTemplate: `
    <div style="text-align: center; width: 100%; font-size: 9px; padding: 10px;">
      Service Agreement - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
  margin: {
    top: '0.75in',
    bottom: '0.75in',
    left: '0.5in',
    right: '0.5in',
  },
});
```

### Invoice Generation

```typescript
const invoicePdf = await generatePdf(invoiceContent, 'invoice.pdf', {
  title: `Invoice ${invoiceNumber}`,
  format: 'A4',
  cssPath: './styles/invoice.css',
  displayHeaderFooter: true,
  includeHighlighting: false,
  printBackground: true,
});
```

### Legal Brief

```typescript
const briefPdf = await generatePdf(briefContent, 'legal-brief.pdf', {
  title: 'Motion to Dismiss',
  format: 'Legal', // 8.5 × 14 inches
  cssPath: './styles/legal-brief.css',
  margin: {
    top: '1in',
    bottom: '1in',
    left: '1.25in', // Left margin for binding
    right: '1in',
  },
});
```

### Multi-Language Document

```typescript
const multiLangPdf = await generatePdf(content, 'document.pdf', {
  title: 'Contrato de Servicios',
  format: 'A4',
  cssPath: './styles/spanish-legal.css',
  // Ensure proper font support for international characters
  printBackground: true,
  preferCSSPageSize: false,
});
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

```typescript
// ✅ Good - optimize logo for PDF
const optimizedLogo = await optimizeLogo('./assets/company-logo.png', {
  maxWidth: 200,
  maxHeight: 80,
  quality: 90,
});

// ❌ Avoid - large unoptimized logos
// --logo-filename: huge-logo-5mb.png;
```

### 3. Performance Optimization

```typescript
// ✅ Good - reuse CSS for multiple documents
const cssPath = './styles/shared-legal.css';

const documents = await Promise.all([
  generatePdf(contract1, 'contract1.pdf', { cssPath }),
  generatePdf(contract2, 'contract2.pdf', { cssPath }),
  generatePdf(contract3, 'contract3.pdf', { cssPath }),
]);

// ✅ Good - batch generation
const { normal, highlighted } = await generatePdfVersions(
  content,
  'doc.pdf',
  options
);
```

### 4. Error Handling

```typescript
try {
  const buffer = await generatePdf(content, 'output.pdf', options);
  console.log('PDF generated successfully');
} catch (error) {
  if (error.code === 'LOGO_NOT_FOUND') {
    console.warn('Logo file not found, generating PDF without logo');
    // Retry without logo
    const buffer = await generatePdf(content, 'output.pdf', {
      ...options,
      cssPath: undefined,
    });
  } else {
    console.error('PDF generation failed:', error.message);
  }
}
```

### 5. File Organization

```text
project/
├── styles/
│   ├── legal-contract.css
│   ├── invoice.css
│   └── shared-legal.css
├── assets/
│   └── images/
│       ├── company-logo.png
│       └── watermark.png
└── output/
    ├── contracts/
    ├── invoices/
    └── archive/
```

### 6. Testing PDF Output

```typescript
// Test PDF generation in development
if (process.env.NODE_ENV === 'development') {
  const testPdf = await generatePdf(sampleContent, 'test.pdf', {
    title: 'Test Document',
    includeHighlighting: true,
    cssPath: './styles/test.css',
  });

  // Validate PDF was created
  const fs = require('fs');
  if (fs.existsSync('test.pdf')) {
    console.log('✅ PDF generation test passed');
  }
}
```

### 7. Version Control

```typescript
// Include version info in PDFs
const versionInfo = `Generated by Legal Markdown JS v${packageVersion}`;

const buffer = await generatePdf(content, 'output.pdf', {
  creator: versionInfo,
  subject: `Document generated on ${new Date().toISOString()}`,
  // Include generation metadata
  footerTemplate: `
    <div style="font-size: 8px; text-align: center; width: 100%;">
      ${versionInfo} - Page <span class="pageNumber"></span>
    </div>
  `,
});
```

## Troubleshooting

### Common Issues

**PDF generation fails:**

- Check CSS file path is correct
- Verify logo file exists and is accessible
- Ensure content is valid markdown

**Logo not appearing:**

- Verify PNG format and file size < 500KB
- Check `--logo-filename` CSS variable syntax
- Ensure file path is relative to CSS file

**Layout issues:**

- Test CSS with HTML output first
- Use print media queries for PDF-specific styles
- Check margin and page size settings

**Performance issues:**

- Optimize logo file sizes
- Reduce CSS complexity
- Use batch generation for multiple PDFs

## See Also

- [HTML Generation](html-generation.md) - Generate HTML output
- [Field Highlighting](field-highlighting.md) - Visual field tracking
- [CSS Classes](css-classes.md) - Available CSS styling classes
- [Smart Archiving](../features/smart-archiving.md) - Automatic file management
