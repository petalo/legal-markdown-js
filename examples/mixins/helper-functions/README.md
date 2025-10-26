# Helper Functions

Using helper functions for data formatting including dates, currency, and string
manipulation.

> **Note on Syntax**: As of v3.5.0, Legal Markdown supports **Handlebars
> syntax** for helpers.
>
> - **Current syntax** (Handlebars): `{{helper arg1 arg2}}`
> - **Legacy syntax** (Deprecated, removed in v4.0.0): `{{helper(arg1, arg2)}}`

## 📋 What this example demonstrates

- Helper function calls in templates (both Handlebars and legacy syntax)
- Date formatting functions
- Currency formatting
- String manipulation helpers
- Subexpressions (nested helper calls)

## 📁 Files

- **formatted-contract-handlebars.md** - Contract using **Handlebars syntax**
  (current standard)
- **formatted-contract.md** - Contract using variables and conditionals
- **contract-data.json** - External data for helper functions
- **formatted-contract.output.md** - Document with formatted values
- **formatted-contract.output.html** - HTML with helper-formatted content

## 🚀 Usage

```bash
./run.sh
```

Or process individual files:

```bash
# Process with Handlebars syntax (current)
legal-md formatted-contract-handlebars.md output.html

# Process legacy example
legal-md formatted-contract.md output.html
```

## 🔍 Key features shown

1. **Helper Functions**: Built-in formatting functions with Handlebars syntax
2. **Date Formatting**: Various date display formats (`formatDate`, `addYears`,
   `addMonths`, `addDays`)
3. **Currency Formatting**: Money and number formatting (`formatCurrency`,
   `formatPercent`, `numberToWords`)
4. **String Helpers**: Text manipulation and formatting (`titleCase`, `upper`,
   `lower`, `initials`, etc.)
5. **Subexpressions**: Nested helper calls like
   `{{formatDate (addYears today 2) "YYYY-MM-DD"}}`

## 📝 Syntax Examples

### Handlebars Syntax (Current - v3.5.0+)

```markdown
**Date:** {{formatDate today "MMMM Do, YYYY"}} **Amount:**
{{formatCurrency amount "USD"}} **Client:** {{titleCase client_name}} **Due
Date:** {{formatDate (addDays today 30) "YYYY-MM-DD"}}
```

### Legacy Syntax (Deprecated - Removed in v4.0.0)

```markdown
**Date:** {{formatDate(@today, "MMMM Do, YYYY")}} **Amount:**
{{formatCurrency(amount, "USD")}} **Client:** {{titleCase(client_name)}} **Due
Date:** {{formatDate(addDays(@today, 30), "YYYY-MM-DD")}}
```

## 💡 Learn more

- [Handlebars Helpers Reference](../../../docs/handlebars-helpers-reference.md) -
  Complete reference with 30+ helpers
- [Handlebars Migration Guide](../../../docs/handlebars-migration.md) -
  Migrating from legacy to Handlebars syntax
- [Helper Functions Guide](../../../docs/helpers/README.md) - Quick overview
  with category links
