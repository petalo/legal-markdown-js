# Number Helpers

Helpers for formatting currency, percentages, and numbers in legal documents.

## Table of Contents

- [`formatCurrency`](#formatcurrency) - Format with currency symbol
- [`formatDollar`](#formatdollar) - Format as US dollars
- [`formatEuro`](#formateuro) - Format as Euros
- [`formatPound`](#formatpound) - Format as British Pounds
- [`formatInteger`](#formatinteger) - Format with thousand separators
- [`formatPercent`](#formatpercent) - Format as percentage
- [`numberToWords`](#numbertowords) - Convert numbers to words
- [`round`](#round) - Round to decimal places

---

## `formatCurrency`

Formats a number as currency with symbol and proper decimal places.

### Syntax

```handlebars
{{formatCurrency amount currency decimals}}
```

### Parameters

- **`amount`** (number) - Amount to format
- **`currency`** (string) - Currency code ("USD", "EUR", "GBP")
- **`decimals`** (number, optional) - Decimal places (default: 2)

### Examples

```handlebars
{{formatCurrency price 'USD'}}
{{formatCurrency total 'EUR'}}
{{formatCurrency amount 'GBP' 2}}
{{formatCurrency (multiply price quantity) 'USD'}}
```

### Output

```
$1,234.56
€1.234,56
£1,234.56
$3,703.68
```

### Notes

- Uses locale-appropriate formatting (periods vs commas)
- Handles negative numbers with proper placement of currency symbol
- For convenience, use `formatDollar`, `formatEuro`, or `formatPound` shortcuts

---

## `formatDollar`

Formats a number as US dollars (shorthand for `formatCurrency` with USD).

### Syntax

```handlebars
{{formatDollar amount decimals}}
```

### Parameters

- **`amount`** (number) - Amount to format
- **`decimals`** (number, optional) - Decimal places (default: 2)

### Examples

```handlebars
Total:
{{formatDollar 1234.56}}
Payment:
{{formatDollar amount}}
Subtotal:
{{formatDollar (multiply price quantity) 2}}
```

### Output

```
Total: $1,234.56
Payment: $5,000.00
Subtotal: $3,703.68
```

---

## `formatEuro`

Formats a number as Euros.

### Syntax

```handlebars
{{formatEuro amount decimals}}
```

### Parameters

- **`amount`** (number) - Amount to format
- **`decimals`** (number, optional) - Decimal places (default: 2)

### Examples

```handlebars
Total:
{{formatEuro 1234.56}}
VAT:
{{formatEuro (multiply subtotal 0.21) 2}}
```

### Output

```
Total: €1.234,56
VAT: €259.27
```

### Notes

- Uses European number formatting (period for thousands, comma for decimals)
- Symbol placement follows European conventions

---

## `formatPound`

Formats a number as British Pounds.

### Syntax

```handlebars
{{formatPound amount decimals}}
```

### Parameters

- **`amount`** (number) - Amount to format
- **`decimals`** (number, optional) - Decimal places (default: 2)

### Examples

```handlebars
Total:
{{formatPound 1234.56}}
Fee:
{{formatPound legalFee 2}}
```

### Output

```
Total: £1,234.56
Fee: £500.00
```

---

## `formatInteger`

Formats a number as an integer with thousand separators.

### Syntax

```handlebars
{{formatInteger number separator}}
```

### Parameters

- **`number`** (number) - Number to format
- **`separator`** (string, optional) - Thousands separator (default: ",")

### Examples

```handlebars
Population:
{{formatInteger 1234567}}
Count:
{{formatInteger totalItems}}
ID:
{{formatInteger contractId ','}}
```

### Output

```
Population: 1,234,567
Count: 42,000
ID: 123,456
```

### Notes

- Rounds decimals using `Math.round` (1234.56 → 1,235)
- Use custom separator for different locales

---

## `formatPercent`

Formats a number as a percentage.

### Syntax

```handlebars
{{formatPercent value decimals}}
```

### Parameters

- **`value`** (number) - Value to format (0.15 = 15%)
- **`decimals`** (number, optional) - Decimal places (default: 2)

### Examples

```handlebars
{{formatPercent 0.15 2}}
{{formatPercent 0.085 1}}
{{formatPercent taxRate 2}}
Tax:
{{formatPercent vatRate 0}}
```

### Output

```
15.00%
8.5%
7.50%
Tax: 21%
```

### Notes

- Input is decimal (0.15 = 15%, not 15 = 15%)
- Automatically multiplies by 100 and adds % symbol

---

## `numberToWords`

Converts a number to its word representation.

### Syntax

```handlebars
{{numberToWords number}}
```

### Parameters

- **`number`** (number) - Number to convert

### Examples

```handlebars
{{numberToWords 1234}}
dollars Amount:
{{titleCase (numberToWords amount)}}
{{numberToWords 42}}
days notice
```

### Output

```
One thousand two hundred thirty-four dollars
Amount: Five Thousand
Forty-two days notice
```

### Notes

- Returns lowercase text (use with `titleCase` or `capitalize` for proper
  casing)
- Supports numbers up to 999,999,999,999
- Handles zero, negative numbers

---

## `round`

Rounds a number to a specified number of decimal places.

### Syntax

```handlebars
{{round number decimals}}
```

### Parameters

- **`number`** (number) - Number to round
- **`decimals`** (number, optional) - Decimal places (default: 0)

### Examples

```handlebars
{{round 3.14159 2}}
{{round price 0}}
{{round (divide total count) 2}}
```

### Output

```
3.14
1235
42.33
```

### Notes

- Uses standard rounding (0.5 rounds up)
- Decimal places default to 0 (whole number)

---

## Complex Number Examples

### Invoice with Tax Calculation

```handlebars
--- subtotal: 1000 taxRate: 0.21 --- **Subtotal:**
{{formatDollar subtotal}}
**Tax ({{formatPercent taxRate 0}}):**
{{formatDollar (multiply subtotal taxRate)}}
**Total:**
{{formatDollar (add subtotal (multiply subtotal taxRate))}}
**Amount in words:**
{{titleCase
  (numberToWords (round (add subtotal (multiply subtotal taxRate)) 0))
}}
dollars
```

**Output:**

```
Subtotal: $1,000.00
Tax (21%): $210.00
Total: $1,210.00
Amount in words: One Thousand Two Hundred Ten dollars
```

### Multi-Currency Contract

```handlebars
--- amountUSD: 5000 amountEUR: 4200 amountGBP: 3800 --- Payment may be made in
any of the following currencies: -
{{formatDollar amountUSD}}
(United States Dollars) -
{{formatEuro amountEUR}}
(Euros) -
{{formatPound amountGBP}}
(British Pounds)
```

**Output:**

```
Payment may be made in any of the following currencies:
- $5,000.00 (United States Dollars)
- €4.200,00 (Euros)
- £3,800.00 (British Pounds)
```

### Pricing Table with Calculations

```handlebars
--- items: - name: "Consulting" rate: 150 hours: 40 - name: "Development" rate:
120 hours: 80 ---

{{#each items}}
  - **{{name}}:**
  {{hours}}
  hours @
  {{formatDollar rate}}/hour =
  {{formatDollar (multiply rate hours)}}
{{/each}}

**Grand Total:**
{{formatDollar (add (multiply 150 40) (multiply 120 80))}}
```

**Output:**

```
- Consulting: 40 hours @ $150.00/hour = $6,000.00
- Development: 80 hours @ $120.00/hour = $9,600.00

Grand Total: $15,600.00
```

---

## See Also

- [Mathematical Helpers](math-helpers.md) - For arithmetic operations
- [Date Helpers](date-helpers.md) - For date formatting
- [String Helpers](string-helpers.md) - For text manipulation

---

[← Back to Helpers](README.md)
