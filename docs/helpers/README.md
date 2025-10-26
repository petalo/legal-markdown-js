# Helper Functions Reference

Complete guide to all helper functions available in Legal Markdown.

## Categories

### 📅 [Date Helpers](date-helpers.md)

Format and manipulate dates for legal documents.

**Available helpers:**

- `today` - Current date
- `formatDate` - Format dates with multiple formats
- `addYears` - Add/subtract years
- `addMonths` - Add/subtract months
- `addDays` - Add/subtract days
- `formatBasicDate` - Simple date formatting

### 🔢 [Number Helpers](number-helpers.md)

Format currency, percentages, and numbers.

**Available helpers:**

- `formatCurrency` - Format with currency symbol
- `formatDollar` - Format as US dollars
- `formatEuro` - Format as Euros
- `formatPound` - Format as British Pounds
- `formatInteger` - Format with thousand separators
- `formatPercent` - Format as percentage
- `numberToWords` - Convert numbers to words
- `round` - Round to decimal places

### 📝 [String Helpers](string-helpers.md)

Text manipulation and formatting.

**Available helpers:**

- `capitalize` - Capitalize first letter
- `capitalizeWords` - Capitalize each word
- `titleCase` - Smart title casing
- `upper` - Convert to uppercase
- `lower` - Convert to lowercase
- `truncate` - Truncate with suffix
- `clean` - Remove extra whitespace
- `pluralize` - Convert to plural
- `kebabCase` - Convert to kebab-case
- `snakeCase` - Convert to snake_case
- `camelCase` - Convert to camelCase
- `pascalCase` - Convert to PascalCase
- `padStart` - Pad string at start
- `padEnd` - Pad string at end
- `contains` - Check substring
- `replaceAll` - Replace all occurrences
- `initials` - Extract initials

### 🧮 [Mathematical Helpers](math-helpers.md)

Arithmetic operations for calculations.

**Available helpers:**

- `multiply` - Multiply two numbers
- `divide` - Divide two numbers
- `add` - Add two numbers
- `subtract` - Subtract two numbers

### 🛠️ [Utility Helpers](utility-helpers.md)

General-purpose utilities.

**Available helpers:**

- `concat` - Concatenate strings
- `trackField` - Field tracking for highlighting

### ⭐ [Special Values](special-values.md)

Built-in variables and context values.

**Available:**

- `@today` - Current date variable
- `@index` - Loop index (0-based)
- `@first` - First item boolean
- `@last` - Last item boolean
- `@total` - Total items count
- `this` - Current loop item
- `../` - Parent context access

### 🔧 [Built-in Handlebars Helpers](handlebars-builtins.md)

Standard Handlebars control structures.

**Available:**

- `#if` - Conditional rendering
- `#unless` - Inverse conditional
- `#each` - Array iteration
- `#with` - Change context
- `lookup` - Dynamic property access

---

## Syntax

Legal Markdown uses **Handlebars syntax** for all helpers:

```handlebars
{{helper arg1 arg2}}
{{formatDate date 'YYYY-MM-DD'}}
{{formatCurrency amount 'USD'}}
```

### Subexpressions

Chain helpers together using parentheses:

```handlebars
{{formatDate (addYears startDate 5) 'legal'}}
{{formatCurrency (multiply price quantity) 'USD'}}
{{upper (concat firstName ' ' lastName)}}
```

### Conditionals

Use helpers with `#if` for conditional logic:

```handlebars
{{#if (contains email '@gmail.com')}}
  Gmail address detected
{{/if}}
```

---

## Quick Examples

### Date Formatting

```handlebars
Effective date:
{{formatDate startDate 'legal'}}
Expiration:
{{formatDate (addYears startDate 2) 'MMMM D, YYYY'}}
```

### Currency Calculations

```handlebars
Subtotal:
{{formatCurrency subtotal 'USD'}}
Tax ({{formatPercent taxRate 1}}):
{{formatCurrency (multiply subtotal taxRate) 'USD'}}
Total:
{{formatCurrency (add subtotal (multiply subtotal taxRate)) 'USD'}}
```

### String Manipulation

```handlebars
Client:
{{titleCase clientName}}
Reference:
{{upper (concat 'REF-' contractId)}}
```

### Loops

```handlebars
{{#each items}}
  {{@index}}.
  {{titleCase name}}
  -
  {{formatCurrency price 'USD'}}
{{/each}}
```

---

## See Also

- [Handlebars Migration Guide](../handlebars-migration.md) - Migrating from
  legacy syntax
- [Architecture Documentation](../architecture/) - How helpers work internally
- [Official Handlebars Documentation](https://handlebarsjs.com/) - Handlebars
  reference

---

## Navigation

- [← Back to Documentation](../README.md)
