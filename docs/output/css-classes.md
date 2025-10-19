# CSS Classes Reference

Legal Markdown JS automatically adds CSS classes to the HTML output to enhance
visual control and document review. These classes fall into two main categories:
**formatting classes** for document structure and **review classes** for field
validation.

## 📋 Overview

Legal Markdown adds CSS classes under specific conditions to help you:

- **Format documents** with consistent legal document styling
- **Review contracts** by highlighting field states and data integration

## 🎨 Legal Header Classes

These classes are automatically applied to legal headers (created with `l.`,
`ll.`, `lll.`, etc. syntax) based on their hierarchy level, providing consistent
formatting for legal documents.

### Header Level Classes

Legal Markdown automatically adds CSS classes to headers to identify their level
in the document hierarchy. These classes are added to the HTML output when
generating HTML or PDF files.

| Class                   | Purpose                           | Applied To            | Legal Syntax          |
| ----------------------- | --------------------------------- | --------------------- | --------------------- |
| `.legal-header-level-1` | Top-level headers (Articles)      | Level 1 legal headers | `l.` or `l1.`         |
| `.legal-header-level-2` | Second-level headers (Sections)   | Level 2 legal headers | `ll.` or `l2.`        |
| `.legal-header-level-3` | Third-level headers (Subsections) | Level 3 legal headers | `lll.` or `l3.`       |
| `.legal-header-level-4` | Fourth-level headers              | Level 4 legal headers | `llll.` or `l4.`      |
| `.legal-header-level-5` | Fifth-level headers (Paragraphs)  | Level 5 legal headers | `lllll.` or `l5.`     |
| `.legal-header-level-6` | Sixth-level headers               | Level 6 legal headers | `llllll.` or `l6.`    |
| `.legal-header-level-7` | Seventh-level headers             | Level 7 legal headers | `lllllll.` or `l7.`   |
| `.legal-header-level-8` | Eighth-level headers              | Level 8 legal headers | `llllllll.` or `l8.`  |
| `.legal-header-level-9` | Ninth-level headers               | Level 9 legal headers | `lllllllll.` or `l9.` |

**Note:** Regular markdown headers (created with `#`, `##`, etc.) do **not**
receive these CSS classes. Only headers created using the legal markdown syntax
(`l.`, `ll.`, etc.) get the `legal-header-level-X` classes.

## 🔍 Field Review Classes

These classes are added when using the `--highlight` flag and help identify
field states during document review.

### Field State Classes

These classes are automatically applied to fields when using the `--highlight`
flag:

| Class             | Purpose                        | Color     | When Applied                                       |
| ----------------- | ------------------------------ | --------- | -------------------------------------------------- |
| `.imported-value` | Successfully populated fields  | 🔵 Blue   | Fields filled from YAML frontmatter or JSON data   |
| `.missing-value`  | Required fields without values | 🔴 Red    | Empty or undefined required fields                 |
| `.highlight`      | Fields with conditional logic  | 🟠 Orange | Fields with mixins, conditionals, or complex logic |

**Additional Classes:** Some processing modes may also add a `.legal-field` base
class. CSS targeting either pattern will work correctly.

## 🚀 Usage Examples

### Basic Document Formatting

```markdown
---
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '%n.'
---

l. General Provisions

ll. Definitions

lll. Interpretation
```

**Generated HTML:**

```html
<h1 class="legal-header-level-1">Article 1. General Provisions</h1>
<h2 class="legal-header-level-2">Section 1. Definitions</h2>
<h3 class="legal-header-level-3">1. Interpretation</h3>
```

**With noIndent option (recommended for HTML/PDF output):**

```markdown
---
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '%n.'
noIndent: true
---

l. General Provisions ll. Definitions lll. Interpretation
```

### Field Highlighting for Review

```bash
# Enable field highlighting for contract review
legal-md contract.md --highlight --html -o review.html
```

**Generated HTML (v2.14+ with remark-based processing):**

```html
<span class="legal-field imported-value" data-field="client_name"
  >John Doe</span
>
<!-- Successfully filled -->
<span class="legal-field missing-value" data-field="client_address"
  >{{client_address}}</span
>
<!-- Missing required field -->
<span class="legal-field highlight" data-field="crossref.payment"
  >Article 1.5</span
>
<!-- Cross-reference with logic -->
```

## 🎯 Custom Styling

### Basic Header Styling

```css
/* Level 1 - Articles */
.legal-header-level-1 {
  font-size: 1.6em;
  font-weight: bold;
  color: #1a1a1a;
  margin-top: 2em;
  margin-bottom: 1em;
  page-break-after: avoid;
}

/* Level 2 - Sections */
.legal-header-level-2 {
  font-size: 1.3em;
  font-weight: 600;
  color: #333;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  page-break-after: avoid;
}

/* Level 3 - Subsections */
.legal-header-level-3 {
  font-size: 1.15em;
  font-weight: 600;
  color: #444;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
}

/* Levels 4-9 - Deeper nesting */
.legal-header-level-4,
.legal-header-level-5,
.legal-header-level-6,
.legal-header-level-7,
.legal-header-level-8,
.legal-header-level-9 {
  font-size: 1em;
  font-weight: 500;
  color: #555;
  margin-top: 1em;
  margin-bottom: 0.5em;
}
```

### Review Mode Styling

```css
/* Universal field styling - works for both systems */
.imported-value,
.legal-field.imported-value {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  color: #0d47a1;
  padding: 2px 4px;
  border-radius: 3px;
  display: inline;
  vertical-align: baseline;
  white-space: normal;
}

.missing-value,
.legal-field.missing-value {
  background-color: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  padding: 2px 4px;
  border-radius: 3px;
  display: inline;
  vertical-align: baseline;
  white-space: normal;
  font-weight: 500;
}

.highlight,
.legal-field.highlight {
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  color: #e65100;
  padding: 2px 4px;
  border-radius: 3px;
  display: inline;
  vertical-align: baseline;
  white-space: normal;
}

/* Optional: Base class for modern system */
.legal-field {
  border-radius: 3px;
  border: 1px solid transparent;
  padding: 2px 4px;
  display: inline;
  vertical-align: baseline;
  white-space: normal;
}
```

### Print-Friendly Styling

```css
@media print {
  /* Prevent page breaks after headers */
  .legal-header-level-1,
  .legal-header-level-2,
  .legal-header-level-3,
  .legal-header-level-4,
  .legal-header-level-5,
  .legal-header-level-6,
  .legal-header-level-7,
  .legal-header-level-8,
  .legal-header-level-9 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  /* Hide review classes in print */
  .imported-value,
  .missing-value,
  .highlight {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
}
```

## 📚 Integration with CLI

### Document Generation

```bash
# Generate formatted document
legal-md contract.md --html --css styles.css -o contract.html

# Generate PDF with styling
legal-md contract.md --pdf --css styles.css -o contract.pdf
```

### Review Mode

```bash
# Generate review version with field highlighting
legal-md contract.md --highlight --html --css review-styles.css -o review.html

# Generate highlighted PDF for review
legal-md contract.md --highlight --pdf -o review.pdf
```

## 💡 Best Practices

### Document Formatting

- Use the `legal-header-level-X` classes to style headers by their hierarchy
  level
- Apply consistent styling across all 9 header levels
- Consider print-friendly styles for PDF generation
- Use `noIndent: true` in YAML frontmatter when generating HTML/PDF output to
  avoid markdown formatting artifacts

### Review Workflow

- Use `--highlight` flag during contract review and validation
- Style `.missing-value` prominently to catch required fields
- Use different colors for different field states to improve review efficiency

### Custom CSS Integration

- Create separate CSS files for document formatting vs. review styling
- Use CSS variables for consistent color schemes
- Test styles across different output formats (HTML, PDF)

## 🔧 Technical Implementation

### Class Application Logic

Legal header classes are automatically applied during the remark processing
pipeline:

```javascript
// Header classes are applied based on legal header level (1-9)
// Only legal headers (l., ll., lll., etc.) receive these classes
const headerLevel = node.depth; // 1-9
const cssClass = `legal-header-level-${headerLevel}`;
node.data.hProperties = { className: cssClass };

// Field classes are applied based on field state (when using --highlight)
if (fieldHasValue(field)) {
  element.className = 'imported-value';
} else if (fieldIsRequired(field)) {
  element.className = 'missing-value';
} else if (fieldHasLogic(field)) {
  element.className = 'highlight';
}
```

**Note:** CSS classes are added via the `hProperties` data attribute in the
remark AST, which is then converted to HTML by `remark-rehype`.

### CSS File Locations

| File                           | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `src/styles/default.css`       | Default document and header styling               |
| `src/styles/headers.css`       | Enhanced legal header styles with data attributes |
| `src/styles/highlight.css`     | Field highlighting and review styles              |
| `examples/styles/contract.css` | Contract-specific styling example                 |
| `src/web/styles.css`           | Web interface specific styles                     |

## 📖 See Also

- [Headers Numbering Guide](../features/headers-numbering.md) - Learn about
  header numbering systems
- [Features Guide](../features/README.md) - Complete feature documentation
- [CLI Reference](cli_reference.md) - Command-line options and flags
- [Getting Started](getting_started.md) - Basic usage examples
