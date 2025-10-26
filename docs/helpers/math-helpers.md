# Mathematical Helpers

Helpers for arithmetic operations and calculations in legal documents.

## Table of Contents

- [`multiply`](#multiply) - Multiply two numbers
- [`divide`](#divide) - Divide two numbers
- [`add`](#add) - Add two numbers
- [`subtract`](#subtract) - Subtract two numbers

---

## Overview

Mathematical helpers replace legacy expression syntax with standard Handlebars
helper calls. These helpers are essential for calculations in contracts,
invoices, and financial documents.

### Legacy vs Current Syntax

**Legacy (Deprecated):**

```handlebars
{{price * quantity}}
{{total / count}}
{{subtotal + tax}}
{{original - discount}}
```

**Current (Handlebars):**

```handlebars
{{multiply price quantity}}
{{divide total count}}
{{add subtotal tax}}
{{subtract original discount}}
```

---

## `multiply`

Multiplies two numbers.

### Syntax

```handlebars
{{multiply a b}}
```

### Parameters

- **`a`** (number | string) - First number
- **`b`** (number | string) - Second number

### Examples

```handlebars
Total:
{{formatDollar (multiply price quantity)}}
{{multiply 5 10}}
{{multiply rate hours}}
```

### Output

```
Total: $500.00
50
120
```

### Notes

- Automatically converts string numbers to Number type
- Can be used in subexpressions with formatting helpers
- Handles decimals correctly

### Complex Example

```handlebars
--- price: 150 quantity: 3 taxRate: 0.21 --- Subtotal:
{{formatDollar (multiply price quantity)}}
Tax:
{{formatDollar (multiply (multiply price quantity) taxRate)}}
Total:
{{formatDollar
  (add (multiply price quantity) (multiply (multiply price quantity) taxRate))
}}
```

---

## `divide`

Divides two numbers.

### Syntax

```handlebars
{{divide a b}}
```

### Parameters

- **`a`** (number | string) - Dividend
- **`b`** (number | string) - Divisor

### Examples

```handlebars
Average:
{{divide total count}}
{{divide 100 4}}
Per month:
{{formatDollar (divide yearlyRate 12)}}
```

### Output

```
Average: 25
25
Per month: $416.67
```

### Notes

- Automatically converts string numbers to Number type
- Division by zero returns `Infinity`
- Use with `round` for controlled decimal places

### Complex Example

```handlebars
--- totalRevenue: 150000 totalExpenses: 95000 months: 12 --- Monthly revenue:
{{formatDollar (divide totalRevenue months)}}
Monthly expenses:
{{formatDollar (divide totalExpenses months)}}
Monthly profit:
{{formatDollar (divide (subtract totalRevenue totalExpenses) months)}}
Profit margin:
{{formatPercent (divide (subtract totalRevenue totalExpenses) totalRevenue) 1}}
```

---

## `add`

Adds two numbers.

### Syntax

```handlebars
{{add a b}}
```

### Parameters

- **`a`** (number | string) - First number
- **`b`** (number | string) - Second number

### Examples

```handlebars
Total:
{{add subtotal tax}}
{{add 10 5}}
Grand total:
{{formatDollar (add amount1 amount2)}}
```

### Output

```
Total: 1210
15
Grand total: $7,500.00
```

### Notes

- Automatically converts string numbers to Number type
- **Different from `concat`**: `add` performs arithmetic, `concat` joins strings
- Can chain multiple additions using nested helpers

### Adding More Than Two Numbers

```handlebars
{{add (add a b) c}}
{{add (add (add a b) c) d}}
```

### Complex Example

```handlebars
--- basePrice: 1000 setupFee: 250 monthlyFee: 50 months: 12 --- One-time fees:
{{formatDollar (add basePrice setupFee)}}
Recurring fees:
{{formatDollar (multiply monthlyFee months)}}
**Total contract value:**
{{formatDollar (add (add basePrice setupFee) (multiply monthlyFee months))}}
```

---

## `subtract`

Subtracts two numbers.

### Syntax

```handlebars
{{subtract a b}}
```

### Parameters

- **`a`** (number | string) - Number to subtract from
- **`b`** (number | string) - Number to subtract

### Examples

```handlebars
Discount:
{{subtract originalPrice salePrice}}
{{subtract 100 25}}
Savings:
{{formatDollar (subtract retail sale)}}
```

### Output

```
Discount: 50
75
Savings: $25.00
```

### Notes

- Automatically converts string numbers to Number type
- Order matters: `subtract a b` = a - b
- Can result in negative numbers

### Complex Example

```handlebars
--- grossSalary: 5000 federalTax: 750 stateTax: 300 socialSecurity: 310
medicare: 72.50 --- **Gross Salary:**
{{formatDollar grossSalary}}

Deductions: - Federal Tax:
{{formatDollar federalTax}}
- State Tax:
{{formatDollar stateTax}}
- Social Security:
{{formatDollar socialSecurity}}
- Medicare:
{{formatDollar medicare}}

**Total Deductions:**
{{formatDollar (add (add (add federalTax stateTax) socialSecurity) medicare)}}
**Net Salary:**
{{formatDollar
  (subtract
    grossSalary (add (add (add federalTax stateTax) socialSecurity) medicare)
  )
}}
```

---

## Complex Calculation Examples

### Compound Interest

```handlebars
--- principal: 10000 annualRate: 0.05 years: 5 --- Principal:
{{formatDollar principal}}
Annual rate:
{{formatPercent annualRate 1}}
Term:
{{years}}
years Future value:
{{formatDollar
  (multiply principal (multiply (add 1 annualRate) (add 1 annualRate)))
}}
```

### Prorated Payment

```handlebars
--- monthlyRate: 1200 startDay: 15 daysInMonth: 30 --- Monthly rate:
{{formatDollar monthlyRate}}
Days remaining:
{{subtract daysInMonth startDay}}
Daily rate:
{{formatDollar (divide monthlyRate daysInMonth)}}
**Prorated amount:**
{{formatDollar
  (multiply (divide monthlyRate daysInMonth) (subtract daysInMonth startDay))
}}
```

### Percentage Calculations

```handlebars
--- originalPrice: 500 discountPercent: 0.15 --- Original price:
{{formatDollar originalPrice}}
Discount:
{{formatPercent discountPercent 0}}
({{formatDollar (multiply originalPrice discountPercent)}}) **Final price:**
{{formatDollar
  (subtract originalPrice (multiply originalPrice discountPercent))
}}
**You save:**
{{formatDollar (multiply originalPrice discountPercent)}}
```

### Invoice with Line Items

```handlebars
--- items: - description: "Consulting" rate: 150 hours: 8 - description:
"Development" rate: 120 hours: 16 taxRate: 0.08 ---

{{#each items}}
  {{@index}}.
  {{description}}:
  {{hours}}
  hrs @
  {{formatDollar rate}}/hr =
  {{formatDollar (multiply rate hours)}}
{{/each}}

Subtotal:
{{formatDollar (add (multiply 150 8) (multiply 120 16))}}
Tax ({{formatPercent taxRate 0}}):
{{formatDollar (multiply (add (multiply 150 8) (multiply 120 16)) taxRate)}}
**Total:**
{{formatDollar
  (add
    (add (multiply 150 8) (multiply 120 16))
    (multiply (add (multiply 150 8) (multiply 120 16)) taxRate)
  )
}}
```

---

## Tips and Best Practices

### 1. Use Subexpressions for Clarity

**Bad:**

```handlebars
{{add basePrice (multiply (divide extraFee 12) months)}}
```

**Good:**

```handlebars
{{! Calculate monthly fee first }}
{{divide extraFee 12}}
per month
{{multiply (divide extraFee 12) months}}
total extras
```

### 2. Store Complex Calculations in Variables

Use frontmatter for intermediate values:

```yaml
---
basePrice: 1000
monthlyFee: 50
months: 12
yearlyFees: 600 # monthlyFee * months (calculated outside)
---
```

### 3. Combine with Number Helpers

Always format currency and percentages:

```handlebars
{{formatDollar (multiply price quantity)}}
# Good
{{multiply price quantity}}
# Raw number, not formatted
```

### 4. Handle Division Carefully

```handlebars
{{round (divide total count) 2}}
# Control decimals
{{formatDollar (divide amount 12)}}
# Auto-formats to 2 decimals
```

---

## See Also

- [Number Helpers](number-helpers.md) - For formatting calculation results
- [Date Helpers](date-helpers.md) - For date arithmetic
- [Utility Helpers](utility-helpers.md) - For concatenation

---

[← Back to Helpers](README.md)
