# HTML Generation

Generate professional HTML documents with custom styling and field highlighting
for legal and business documents.

## Table of Contents

- [Basic HTML Generation](#basic-html-generation)
- [HTML Options](#html-options)
- [CSS Integration](#css-integration)
- [DOM Transformations](#dom-transformations)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Basic HTML Generation

### Command Line Usage

Generate HTML documents directly from the command line:

```bash
# Basic HTML generation
legal-md document.md --html

# HTML with field highlighting
legal-md document.md --html --highlight

# HTML with custom CSS
legal-md document.md --html --css ./styles/contract.css

# HTML with custom output name
legal-md document.md --html --output-name custom-document.html
```

### Programmatic Usage

```typescript
import { generateHtml } from 'legal-markdown-js';

const html = await generateHtml(content, {
  title: 'Legal Document',
  cssPath: './styles/legal.css',
  includeHighlighting: true,
});

// Save to file
import fs from 'fs';
fs.writeFileSync('output.html', html);
```

## HTML Options

### Core Configuration

These are the options accepted by the top-level `generateHtml()` function
exported from `legal-markdown-js`:

| Option                | Type    | Default            | Description                         |
| --------------------- | ------- | ------------------ | ----------------------------------- |
| `title`               | string  | `'Legal Document'` | HTML document title                 |
| `cssPath`             | string  | -                  | Path to custom CSS file             |
| `highlightCssPath`    | string  | -                  | Path to field highlighting CSS file |
| `includeHighlighting` | boolean | false              | Include field highlighting styles   |

All standard `LegalMarkdownOptions` (e.g., `debug`, `enableFieldTracking`) are
also accepted and forwarded to the processing pipeline. Note that
`enableFieldTracking` is always forced to `true` for HTML generation.

When no custom `cssPath` is provided, the built-in `default.css` is
automatically embedded. YAML frontmatter metadata with primitive values
(strings, numbers, booleans) is rendered as `<meta>` tags in the HTML head.

### Example

```typescript
const html = await generateHtml(content, {
  title: 'Service Agreement',
  cssPath: './styles/contract.css',
  includeHighlighting: true,
});
```

## CSS Integration

### External CSS Files

Provide a custom CSS file to replace the built-in default styling:

```typescript
const html = await generateHtml(content, {
  title: 'Legal Document',
  cssPath: './styles/professional.css',
  includeHighlighting: true,
});
```

When `cssPath` is provided, the built-in `default.css` is not embedded. When
`includeHighlighting` is true and `highlightCssPath` is provided, that CSS is
also embedded alongside the custom CSS.

### Default CSS

When no custom `cssPath` is provided, the generator embeds the built-in
`default.css` from `src/styles/default.css`. This includes professional styling
for legal documents, responsive tables, and print-friendly formatting.

### Responsive Design Tips

Add responsive styles to your custom CSS:

```css
@media (max-width: 768px) {
  body {
    padding: 10px;
    font-size: 14px;
  }

  table {
    font-size: 12px;
  }
}

@media print {
  .no-print {
    display: none;
  }

  body {
    font-size: 12pt;
  }
}
```

## DOM Transformations

The HTML generator automatically applies several DOM transformations to improve
output quality:

- **Short list protection**: Lists with fewer than 5 items get a `no-break`
  class to prevent page breaks in the middle
- **Table responsiveness**: Tables are wrapped in
  `<div class="table-responsive">` containers
- **Accessibility**: Images without `alt` attributes get empty alt tags
- **Print optimization**: Page break elements receive `page-break-before` class
- **List cleanup**: Single `<p>` tags inside `<li>` elements are unwrapped
- **Structural tag unescaping**: Page-break divs that were escaped during import
  processing are restored to proper HTML

## Examples

### Contract Document

```typescript
import { generateHtml } from 'legal-markdown-js';

const contractHtml = await generateHtml(contractContent, {
  title: 'Service Agreement - Acme Corp',
  cssPath: './styles/legal-contract.css',
  includeHighlighting: true,
});

import fs from 'fs';
fs.writeFileSync('contract.html', contractHtml);
```

### Multi-Document Batch

```typescript
const documents = ['contract.md', 'addendum.md', 'exhibit-a.md'];

const htmlDocs = await Promise.all(
  documents.map(async doc => {
    const content = fs.readFileSync(doc, 'utf8');
    return generateHtml(content, {
      title: path.basename(doc, '.md'),
      cssPath: './styles/document-set.css',
      includeHighlighting: true,
    });
  })
);
```

## Best Practices

### 1. CSS for Print

```css
@media print {
  body {
    font-size: 12pt;
    padding: 0.5in;
  }

  .no-print {
    display: none;
  }
}
```

### 2. Batch Generation

```typescript
// Reuse shared options for consistency
const sharedOptions = {
  cssPath: './styles/legal.css',
  includeHighlighting: true,
};

const results = await Promise.all(
  files.map(file =>
    generateHtml(file.content, { ...sharedOptions, title: file.name })
  )
);
```

### 3. Cross-Format Consistency

```typescript
// Use same CSS for both HTML and PDF
const sharedOptions = {
  title: 'Document',
  cssPath: './styles/cross-format.css',
};

const html = await generateHtml(content, sharedOptions);
const pdf = await generatePdf(content, 'output.pdf', sharedOptions);
```

## Troubleshooting

### Common Issues

**CSS not loading:**

- Check CSS file path is correct and accessible
- Verify CSS file permissions
- When no custom CSS is provided, default CSS is embedded automatically

**Layout issues:**

- Test on different screen sizes
- Validate CSS media queries
- Check viewport meta tag in the generated HTML head

### Debug Mode

```typescript
const html = await generateHtml(content, {
  title: 'Debug Document',
  cssPath: './styles/debug.css',
  debug: true,
});
```

## See Also

- [PDF Generation](pdf-generation.md) - Generate PDF documents
- [Field Highlighting](field-highlighting.md) - Visual field tracking
- [CSS Classes](css-classes.md) - Available styling classes
