# Helper Functions Overview

Helper functions provide powerful data formatting and manipulation capabilities
for Legal Markdown documents. Use helpers with the `{{helperName(args)}}` syntax
to create professional, consistent document formatting.

## Available Helper Categories

### 📅 [Date Helpers](date-helpers.md)

Format and manipulate dates for contracts, invoices, and legal documents.

- **formatDate()** - Custom date formatting with multiple tokens
- **addYears()**, **addMonths()**, **addDays()** - Date arithmetic
- **Predefined formats** - ISO, US, EU, Legal, and international formats

**Example:**

```markdown
**Effective Date:** {{formatDate(@today, "MMMM Do, YYYY")}} **Expiry Date:**
{{formatDate(addYears(@today, 2), "MMMM Do, YYYY")}}
```

### 🔢 [Number Helpers](number-helpers.md)

Format currency, percentages, and numbers for financial and legal documents.

- **formatCurrency()** - Multi-currency formatting (USD, EUR, GBP)
- **formatPercent()** - Percentage display with precision control
- **formatInteger()** - Number formatting with separators
- **numberToWords()** - Convert numbers to written form for legal docs

**Example:**

```markdown
**Total Amount:** {{formatCurrency(25000, "USD")}} **Interest Rate:**
{{formatPercent(0.065, 2)}} **Amount in Words:**
{{titleCase(numberToWords(25000))}} Dollars
```

### 📝 [String Helpers](string-helpers.md)

Manipulate and format text for professional document presentation.

- **titleCase()**, **capitalize()** - Professional text formatting
- **upper()**, **lower()** - Case conversion
- **truncate()**, **clean()** - Text processing
- **initials()**, **pluralize()** - Specialized text operations
- **Advanced case conversion** - camelCase, kebabCase, snakeCase

**Example:**

```markdown
**Client:** {{titleCase(client_name)}} **Reference:**
{{upper(initials(client_name))}}-{{padStart(invoice_number, 4, "0")}}
**Status:** {{capitalize(status)}}
```

### ⭐ [Special Values](special-values.md)

Dynamic values that automatically update during document generation.

- **@today** - Current date with arithmetic and formatting
- **Format specifiers** - `@today[US]`, `@today[legal]`, `@today[ISO]`
- **Date arithmetic** - `@today+30`, `@today+1y`, `@today-90d`
- **Combined operations** - `@today+30[legal]`, `@today+1y[US]`

**Example:**

```markdown
**Generated:** @today[legal] **Due Date:** @today+30[US] **Contract Expires:**
@today+1y[legal]
```

## Quick Reference

### Most Common Helpers

| Helper                                | Purpose           | Example              |
| ------------------------------------- | ----------------- | -------------------- |
| `formatDate(@today, "MMMM Do, YYYY")` | Professional date | July 16th, 2025      |
| `formatCurrency(amount, "USD")`       | Currency display  | $25,000.00           |
| `titleCase(text)`                     | Professional text | "Legal Services LLC" |
| `@today+30[US]`                       | Future date       | 08/15/2025           |
| `formatPercent(0.065, 1)`             | Percentage        | 6.5%                 |
| `initials(full_name)`                 | Name initials     | "JMS"                |

### Helper Syntax

```markdown
<!-- Basic helper usage -->

{{helperName(variable)}}

<!-- Helper with parameters -->

{{helperName(variable, parameter1, parameter2)}}

<!-- Nested helpers -->

{{helperName(otherHelper(variable))}}

<!-- Helper with conditions -->

{{variable ? helperName(variable) : "default"}}
```

## Navigation

- [← Back to Documentation](../README.md)
- [Features →](../features/README.md)
- [Output Formats →](../output/README.md)
- [Advanced Topics →](../advanced/README.md)

## See Also

- [YAML Frontmatter](../features/yaml-frontmatter.md) - Defining variables for
  helpers
- [Variables & Mixins](../features/mixins-variables.md) - Using helpers with
  variables
- [Template Loops](../features/template-loops.md) - Helpers in iterations
- [Optional Clauses](../features/optional-clauses.md) - Conditional helper usage
