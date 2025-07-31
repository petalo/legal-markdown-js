# Assets Directory

This directory contains static assets used by Legal Markdown JS for PDF
generation and document styling.

## Directory Structure

```text
src/assets/
├── images/           # Logo and image files for PDF headers/footers
│   └── ...              # Additional logos
└── README.md        # This file
```

## Logo Integration

### Overview

The PDF generator automatically detects and includes logos in document headers
when:

1. A CSS file contains the `--logo-filename` custom property
2. The referenced logo file exists in this `images/` directory
3. The logo meets validation requirements (PNG format, ≤500KB)

### Usage

#### Step 1: Add Logo File

Place your PNG logo in the `src/assets/images/` directory:

```text
src/assets/images/logo.company.png
```

#### Step 2: Reference in CSS

Add the logo filename to your CSS file:

```css
:root {
  --logo-filename: logo.company.png;
}
```

#### Step 3: Generate PDF with Logo

```typescript
import { generatePdf } from 'legal-markdown-js';

const buffer = await generatePdf(content, 'output.pdf', {
  cssPath: './styles/contract.css', // Contains --logo-filename
});
```

### Logo Requirements

| Property       | Requirement          | Notes                                                  |
| -------------- | -------------------- | ------------------------------------------------------ |
| **Format**     | PNG only             | Validated using PNG magic numbers                      |
| **Size**       | ≤ 500KB              | Configurable in `PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE` |
| **Dimensions** | Any                  | Automatically scaled to 40px height in headers         |
| **Location**   | `src/assets/images/` | Copied to `dist/assets/images/` during build           |

### Validation Process

The system performs the following validation checks:

1. **File Existence**: Verifies the file exists in the images directory
2. **Size Check**: Ensures file size is within the 500KB limit
3. **Format Validation**: Checks PNG magic numbers (0x89, 0x50, 0x4E, 0x47)
4. **Base64 Encoding**: Converts valid files for embedding in PDF templates

### Error Handling

If logo validation fails, the system:

- Logs a warning message with the specific error
- Continues PDF generation without the logo
- Uses an empty header template as fallback

### Build Process

During the build process (`npm run build`), all assets are copied from
`src/assets/` to `dist/assets/` to ensure they're available in the compiled
package.

## File Naming Conventions

- Use descriptive names: `logo.company-name.png`
- Include version if needed: `logo.company.v2.png`
- Use lowercase with hyphens or dots for separation
- Avoid spaces and special characters

## Examples

### Basic Logo Integration

```css
/* styles/contract.css */
:root {
  --logo-filename: logo.petalo.png;
}
```

### Multiple Logos for Different Documents

```css
/* styles/contract.css */
:root {
  --logo-filename: logo.legal-dept.png;
}

/* styles/invoice.css */
:root {
  --logo-filename: logo.accounting.png;
}
```

### Conditional Logo Usage

```typescript
// Different logos based on document type
const cssPath =
  documentType === 'contract'
    ? './styles/contract.css' // Uses logo.legal.png
    : './styles/general.css'; // Uses logo.company.png

const buffer = await generatePdf(content, 'output.pdf', { cssPath });
```

## Template Customization

For advanced logo positioning and styling, use the template helper functions:

```typescript
import { PdfTemplates } from 'legal-markdown-js/generators/pdf-templates';

// Custom header with logo and text
const headerTemplate = PdfTemplates.generateCustomHeaderTemplate(
  'Confidential Document',
  logoBase64
);

// Standard header with just logo
const simpleHeader = PdfTemplates.generateHeaderTemplate(logoBase64);
```

## Troubleshooting

### Common Issues

**Logo not appearing in PDF:**

- Check CSS contains `--logo-filename: filename.png;`
- Verify file exists in `src/assets/images/`
- Ensure file is valid PNG format
- Check file size is under 500KB

**Build errors:**

- Ensure `src/assets/` is copied to `dist/` in build script
- Verify file permissions allow reading the logo file

**Invalid format errors:**

- Only PNG format is supported
- Use image conversion tools to convert other formats to PNG

### Debug Logging

Enable debug logging to see detailed logo detection information:

```typescript
import { generatePdf } from 'legal-markdown-js';

// Debug logs will show logo detection process
const buffer = await generatePdf(content, 'output.pdf', {
  cssPath: './styles/contract.css',
});
```

Look for log messages like:

- `Auto-detecting logo from CSS`
- `Logo detected and loaded successfully`
- `Logo detection failed, proceeding without logo`

## Related Documentation

- [PDF Generation Features](../../docs/features_guide.md#pdf-with-logo-headersfooters)
- [CSS Classes Documentation](../../docs/css-classes.md)
- [Architecture Overview](../../docs/architecture.md)
