# PDF Generation Example

This example demonstrates how to use the PDF generation features of
legal-markdown-js.

## Sample Contract

```markdown
---
title: Service Agreement
client:
  name: Acme Corporation
  address: 123 Business St, City, State 12345
  contact: john@acme.com
vendor:
  name: Tech Solutions Inc
  address: 456 Tech Ave, City, State 67890
  contact: 
service_type: Software Development
payment_terms:
  amount: 50000
  currency: USD
  schedule: monthly
  late_fee: true
start_date: @today+7
duration_months: 12
---

# {{title}}

This agreement is entered into on {{start_date}} between:

**CLIENT**: {{client.name}}  
Address: {{client.address}}  
Contact: {{client.contact}}

**VENDOR**: {{vendor.name}}  
Address: {{vendor.address}}  
Contact: {{vendor.contact ? vendor.contact : "[Contact Information Required]"}}

## Services

The Vendor agrees to provide {{service_type}} services to the Client.

## Payment Terms

- **Amount**: {{payment_terms.amount}} {{payment_terms.currency}}
- **Payment Schedule**: {{payment_terms.schedule}}
  {{payment_terms.late_fee ? "- **Late Fees**: 1.5% per month on overdue amounts" : ""}}

## Duration

This agreement shall commence on {{start_date}} and continue for
{{duration_months}} months.

[if payment_terms.late_fee]

## Late Payment Clause

Any payment not received within 30 days of the due date shall incur a late fee
as specified above. [end]
```

## Generating Output

### Command Line

```bash
# Generate standard markdown output
legal-md contract.md output.md

# Generate PDF with highlighting
legal-md contract.md --pdf --highlight

# Generate HTML with custom CSS
legal-md contract.md --html --css custom.css

# Generate all formats
legal-md contract.md --pdf --html --highlight --title "Service Agreement"
```

### Programmatic Usage

```javascript
import {
  processLegalMarkdown,
  generateHtml,
  generatePdf,
  generatePdfVersions,
} from 'legal-markdown-js';
import fs from 'fs';

const content = fs.readFileSync('contract.md', 'utf-8');

// Process markdown only
const result = processLegalMarkdown(content);
console.log(result.content); // Processed markdown
console.log(result.metadata); // Extracted metadata

// Generate HTML
const html = await generateHtml(content, {
  title: 'Service Agreement',
  cssPath: './styles.css',
  includeHighlighting: true,
});
fs.writeFileSync('contract.html', html);

// Generate PDF
await generatePdf(content, 'contract.pdf', {
  title: 'Service Agreement',
  format: 'Letter',
  includeHighlighting: false,
});

// Generate both versions
await generatePdfVersions(content, 'contract.pdf', {
  title: 'Service Agreement',
  cssPath: './styles.css',
});
// Creates: contract.normal.pdf and contract.highlighted.pdf
```

## Field Highlighting

When `includeHighlighting` is enabled, the generated HTML/PDF will highlight
fields:

- **Blue borders** (imported-value): Successfully filled fields from metadata
  - Example: `{{client.name}}` → "Acme Corporation"

- **Red borders** (missing-value): Required fields without values
  - Example: `{{vendor.contact}}` → "[Contact Information Required]"

- **Yellow borders** (highlight): Fields with conditional logic
  - Example: `{{payment_terms.late_fee ? "..." : ""}}`

## Custom CSS

Create a custom CSS file to style your documents:

```css
/* custom.css */
body {
  font-family: 'Georgia', serif;
  line-height: 1.8;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}

/* Customize highlighting colors */
.imported-value {
  background-color: #e3f2fd;
  border-color: #1976d2;
}

.missing-value {
  background-color: #ffebee;
  border-color: #d32f2f;
  font-weight: bold;
}

/* Page breaks for PDF */
.page-break {
  page-break-before: always;
}

/* Signature lines */
.signature-line {
  border-bottom: 1px solid #000;
  width: 300px;
  margin: 30px 0;
}
```

## Tips

1. **Test with highlighting first** to identify any missing fields before
   generating the final PDF
2. **Use custom CSS** to match your organization's branding
3. **Different formats** for different purposes:
   - `A4` for international documents
   - `Letter` for US documents
   - `Legal` for contracts requiring more vertical space
4. **Keep a template library** with common contract types and their CSS files
5. **Use batch processing** for generating multiple contracts:

```javascript
const contracts = ['contract1.md', 'contract2.md', 'contract3.md'];

for (const file of contracts) {
  const content = fs.readFileSync(file, 'utf-8');
  await generatePdf(content, file.replace('.md', '.pdf'), {
    title: 'Contract',
    includeHighlighting: false,
  });
}
```
