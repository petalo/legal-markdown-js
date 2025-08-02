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

These classes are automatically applied to headers based on their hierarchy
level, providing consistent formatting for legal documents.

### Header Level Classes

| Class                   | Purpose                           | Applied To                        |
| ----------------------- | --------------------------------- | --------------------------------- |
| `.legal-header-level-1` | Top-level headers (Articles)      | `h1` elements and level 1 headers |
| `.legal-header-level-2` | Second-level headers (Sections)   | `h2` elements and level 2 headers |
| `.legal-header-level-3` | Third-level headers (Subsections) | `h3` elements and level 3 headers |
| `.legal-header-level-4` | Fourth-level headers              | `h4` elements and level 4 headers |
| `.legal-header-level-5` | Fifth-level headers (Paragraphs)  | `h5` elements and level 5 headers |
| `.legal-header-level-6` | Sixth-level headers               | `h6` elements and level 6 headers |

### Semantic Header Classes

| Class                   | Purpose                  | Equivalent Level |
| ----------------------- | ------------------------ | ---------------- |
| `.legal-article`        | Article-level headers    | Level 1          |
| `.legal-section`        | Section-level headers    | Level 2          |
| `.legal-subsection`     | Subsection-level headers | Level 3          |
| `.legal-sub-subsection` | Sub-subsection headers   | Level 4          |
| `.legal-paragraph`      | Paragraph-level headers  | Level 5          |

### Base Classes

| Class           | Purpose                                 |
| --------------- | --------------------------------------- |
| `.legal-header` | Base class applied to all legal headers |

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
# Article 1: General Provisions

## Section 1.1: Definitions

### 1.1.1 Interpretation
```

**Generated HTML:**

```html
<h1 class="legal-header legal-header-level-1 legal-article">
  Article 1: General Provisions
</h1>
<h2 class="legal-header legal-header-level-2 legal-section">
  Section 1.1: Definitions
</h2>
<h3 class="legal-header legal-header-level-3 legal-subsection">
  1.1.1 Interpretation
</h3>
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
.legal-header-level-1 {
  font-size: 1.6em;
  font-weight: bold;
  color: #1a1a1a;
  margin-top: 2em;
  margin-bottom: 1em;
}

.legal-header-level-2 {
  font-size: 1.3em;
  font-weight: 600;
  color: #333;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
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
  .legal-header-level-1,
  .legal-header-level-2,
  .legal-header-level-3,
  .legal-header-level-4,
  .legal-header-level-5,
  .legal-header-level-6 {
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

- Use semantic header classes (`.legal-article`, `.legal-section`) for better
  document structure
- Apply consistent styling across all header levels
- Consider print-friendly styles for PDF generation

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

```javascript
// Header classes are applied based on header level
const headerLevel = determineHeaderLevel(element);
element.className = `legal-header legal-header-level-${headerLevel}`;

// Field classes are applied based on field state
if (fieldHasValue(field)) {
  element.className = 'imported-value';
} else if (fieldIsRequired(field)) {
  element.className = 'missing-value';
} else if (fieldHasLogic(field)) {
  element.className = 'highlight';
}
```

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
