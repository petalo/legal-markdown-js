# Output Formats Overview

Legal Markdown JS supports multiple output formats with professional styling,
highlighting, and customization options for legal and business documents.

## Available Output Formats

### 📄 [PDF Generation](pdf-generation.md)

Generate professional PDF documents with custom styling and branding.

- **PDF Options** - Page formats, orientation, margins
- **Logo Integration** - Automatic logo detection and embedding
- **Headers/Footers** - Custom templates with page numbers
- **Template Helpers** - Programmatic PDF generation tools

**Example:**

```bash
legal-md contract.md --pdf --css ./styles/legal.css --highlight
```

### 🌐 [HTML Generation](html-generation.md)

Create responsive HTML documents with interactive features.

- **Custom Templates** - Full HTML template control
- **CSS Integration** - External and inline styling
- **Responsive Design** - Mobile-friendly layouts
- **Interactive Features** - JavaScript integration, tooltips

**Example:**

```bash
legal-md document.md --html --highlight --css ./styles/responsive.css
```

### 🧾 [DOCX Generation](docx-generation.md)

Generate native Word documents with CSS-to-style mapping.

- **Word-Compatible Output** - `.docx` packages ready for Office/LibreOffice
- **Style Mapping** - `default.css`/`highlight.css` mapped to DOCX paragraph/run
  styles
- **Document Classes** - Support for `.confidential`, `.separator`,
  `.algorithm`, `.signatures`, `.table-of-contents`
- **List + Break Mapping** - `list-style-type` and `page-break-before/after`
  adaptation
- **Headers/Footers** - Version + page numbers + optional logo, or custom API
  templates
- **Highlight Variants** - Optional `.HIGHLIGHT.docx` reviewer copy
- **Pipeline Reuse** - Same 3-phase processing path as HTML/PDF

**Example:**

```bash
legal-md contract.md --docx --highlight --css ./styles/legal.css
```

### 🎯 [Field Highlighting](field-highlighting.md)

Visual indicators for template field status and data validation.

- **Color Coding** - Blue (filled), Red (missing), Yellow (complex)
- **Field Tracking** - Comprehensive field processing reports
- **Review Workflow** - Document completeness validation
- **Custom Styling** - Configurable highlight appearance

**Example:**

```typescript
const result = await processLegalMarkdown(content, {
  enableFieldTracking: true,
});
console.log(result.fieldReport); // Detailed field analysis
```

### 🎨 [CSS Classes](css-classes.md)

Complete reference for styling and customization.

- **Legal Header Classes** - Semantic legal document structure
- **Field Review Classes** - Template variable highlighting
- **Formatting Classes** - Document layout and typography
- **Custom Styling** - Override default appearances

**Example:**

```css
.legal-header-level-1 {
  /* Article headers */
}
.imported-value {
  /* Successfully filled fields */
}
.missing-value {
  /* Fields requiring data */
}
```

## Quick Start

### Generate Multiple Formats

```bash
# Generate all formats simultaneously
legal-md contract.md --pdf --html --docx --highlight --css ./styles/legal.css

# Output:
# - contract.pdf (PDF with highlighting)
# - contract.html (HTML with highlighting)
# - contract.docx (normal DOCX)
# - contract.HIGHLIGHT.pdf (Highlighted PDF version)
# - contract.HIGHLIGHT.docx (Highlighted DOCX version)
```

### Programmatic Generation

```typescript
import {
  generatePdf,
  generateHtml,
  generateDocx,
  generateDocxVersions,
  processLegalMarkdown,
} from 'legal-markdown-js';

// Generate PDF
const pdfBuffer = await generatePdf(content, 'contract.pdf', {
  cssPath: './styles/legal.css',
  includeHighlighting: true,
  format: 'A4',
});

// Generate HTML
const html = await generateHtml(content, {
  title: 'Service Agreement',
  cssPath: './styles/responsive.css',
  includeHighlighting: true,
});

// Generate DOCX
const docxBuffer = await generateDocx(content, 'contract.docx', {
  title: 'Service Agreement',
  cssPath: './styles/legal.css',
  includeHighlighting: true,
  headerTemplate: '<p class="text-center">ACME</p>',
  footerTemplate: '<p class="text-center text-muted">Internal</p>',
});

// Generate both normal and highlight DOCX versions
const docxVersions = await generateDocxVersions(content, 'contract.docx', {
  title: 'Service Agreement',
  cssPath: './styles/legal.css',
});
console.log(docxVersions.normal.length, docxVersions.highlighted.length);

// Get field tracking report
const result = await processLegalMarkdown(content, {
  enableFieldTracking: true,
});
console.log(
  `Document ${(result.fieldReport.filled / result.fieldReport.total) * 100}% complete`
);
```

## Navigation

- [← Back to Documentation](../README.md)
- [Features →](../features/README.md)
- [Helper Functions →](../helpers/README.md)
- [Advanced Topics →](../advanced/README.md)

## See Also

- [Features Overview](../features/README.md) - Core Legal Markdown features
- [Helper Functions](../helpers/README.md) - Template formatting helpers
- [Smart Archiving](../features/smart-archiving.md) - Automatic file management
- [Force Commands](../features/force-commands.md) - Self-configuring documents
