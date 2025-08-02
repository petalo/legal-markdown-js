# Number Helpers

Number helpers provide comprehensive formatting for currency, percentages,
integers, and custom number displays in legal documents.

## Table of Contents

- [Currency Formatting](#currency-formatting)
- [Percentage Formatting](#percentage-formatting)
- [Integer Formatting](#integer-formatting)
- [Number Conversion](#number-conversion)
- [Custom Number Formatting](#custom-number-formatting)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Currency Formatting

### `formatCurrency(amount, currency, decimals)`

Formats a number as currency with proper symbols and formatting.

**Parameters:**

- `amount`: Number to format
- `currency`: Currency code ('EUR', 'USD', 'GBP')
- `decimals`: Number of decimals (default: 2)

**Examples:**

```markdown
Total amount: {{formatCurrency(1234.56, "EUR")}}

<!-- Output: 1,234.56 € -->

Price in dollars: {{formatCurrency(1234.56, "USD", 0)}}

<!-- Output: $1,235 -->

Price in pounds: {{formatCurrency(1234.56, "GBP", 2)}}

<!-- Output: £1,234.56 -->
```

### Currency Shortcuts

#### `formatEuro(amount, decimals)`

Shortcut to format in euros.

```markdown
Cost: {{formatEuro(2500.00)}}

<!-- Output: 2,500.00 € -->

Discount: {{formatEuro(100, 0)}}

<!-- Output: 100 € -->
```

#### `formatDollar(amount, decimals)`

Shortcut to format in dollars.

```markdown
Price: {{formatDollar(1299.99)}}

<!-- Output: $1,299.99 -->

Fee: {{formatDollar(50, 0)}}

<!-- Output: $50 -->
```

#### `formatPound(amount, decimals)`

Shortcut to format in pounds sterling.

```markdown
Amount: {{formatPound(850.00)}}

<!-- Output: £850.00 -->

Cost: {{formatPound(1250.75)}}

<!-- Output: £1,250.75 -->
```

## Percentage Formatting

### `formatPercent(value, decimals, symbol)`

Formats a number as a percentage.

**Parameters:**

- `value`: Decimal number to format (0.05 = 5%)
- `decimals`: Number of decimals (default: 2)
- `symbol`: Show % symbol (default: true)

**Important**: Input values should be in decimal format where 1.0 = 100%

| Input | Represents | Output  |
| ----- | ---------- | ------- |
| 0.21  | 21%        | 21.00%  |
| 1.5   | 150%       | 150.00% |
| 0.055 | 5.5%       | 5.50%   |

**Examples:**

```markdown
Interest rate: {{formatPercent(0.05, 1)}}

<!-- Output: 5.0% -->

Commission: {{formatPercent(0.025, 2)}}

<!-- Output: 2.50% -->

Discount: {{formatPercent(0.15, 0)}}

<!-- Output: 15% -->

High rate: {{formatPercent(1.5, 1)}}

<!-- Output: 150.0% -->
```

## Integer Formatting

### `formatInteger(value, separator)`

Formats an integer with thousands separators.

**Parameters:**

- `value`: Integer to format
- `separator`: Thousands separator (default: ',')

**Examples:**

```markdown
Population: {{formatInteger(1234567)}}

<!-- Output: 1,234,567 -->

Units: {{formatInteger(1234567, ".")}}

<!-- Output: 1.234.567 -->

Count: {{formatInteger(50000, " ")}}

<!-- Output: 50 000 -->
```

## Number Conversion

### `numberToWords(number)`

Converts a number to words (useful for legal documents).

**Examples:**

```markdown
Amount: {{numberToWords(50000)}} euros

<!-- Output: fifty thousand euros -->

Quantity: {{capitalize(numberToWords(42))}} units

<!-- Output: Forty-two units -->

Total: {{titleCase(numberToWords(1250))}} dollars

<!-- Output: One Thousand Two Hundred Fifty dollars -->
```

### `round(value, decimals)`

Rounds a number to the specified decimals.

**Examples:**

```markdown
Result: {{round(123.456789, 2)}}

<!-- Output: 123.46 -->

Percentage: {{round(14.6789, 0)}}%

<!-- Output: 15% -->

Precise: {{round(3.14159, 3)}}

<!-- Output: 3.142 -->
```

## Custom Number Formatting

### `formatNumber(value, decimals, decimalSeparator, thousandSeparator)`

Formats a number with custom decimal and thousand separators for international
use.

**Parameters:**

- `value`: Number to format
- `decimals`: Number of decimal places (default: 2)
- `decimalSeparator`: Character for decimal separation (default: '.')
- `thousandSeparator`: Character for thousand separation (default: ',')

**Examples:**

```markdown
<!-- US Format -->

Standard US: {{formatNumber(1234.56)}}

<!-- Output: 1,234.56 -->

<!-- European Format -->

European: {{formatNumber(1234.56, 2, ",", " ")}}

<!-- Output: 1 234,56 -->

<!-- German Format -->

German: {{formatNumber(1234.56, 2, ",", ".")}}

<!-- Output: 1.234,56 -->

<!-- Custom Format -->

Custom: {{formatNumber(1234.56, 1, ":", "|")}}

<!-- Output: 1|234:6 -->
```

## Examples

### Financial Contracts

```yaml
---
base_fee: 25000
additional_services: 5000
tax_rate: 0.08
discount_rate: 0.10
currency: 'USD'
---
```

```markdown
# Financial Summary

**Base Fee:** {{formatCurrency(base_fee, currency)}} **Additional Services:**
{{formatCurrency(additional_services, currency)}} **Subtotal:**
{{formatCurrency(base_fee + additional_services, currency)}}

**Discount
({{formatPercent(discount_rate, 0)}}):** -{{formatCurrency((base_fee + additional_services) * discount_rate, currency)}}
**Net Amount:**
{{formatCurrency((base_fee + additional_services) * (1 - discount_rate), currency)}}

**Tax ({{formatPercent(tax_rate, 1)}}):**
{{formatCurrency((base_fee + additional_services) * (1 - discount_rate) * tax_rate, currency)}}

**Total Due:**
{{formatCurrency((base_fee + additional_services) * (1 - discount_rate) * (1 + tax_rate), currency)}}
```

### Invoice Templates

```yaml
---
items:
  - description: 'Legal Consulting'
    hours: 40
    rate: 300
  - description: 'Document Review'
    hours: 20
    rate: 250
tax_rate: 0.085
---
```

```markdown
# Invoice

## Items

{{#items}}

- **{{description}}**: {{formatInteger(hours)}} hours @
  {{formatCurrency(rate, "USD")}} = {{formatCurrency(hours * rate, "USD")}}
  {{/items}}

**Subtotal:**
{{formatCurrency(items.0.hours * items.0.rate + items.1.hours * items.1.rate, "USD")}}
**Tax ({{formatPercent(tax_rate, 1)}}):**
{{formatCurrency((items.0.hours * items.0.rate + items.1.hours * items.1.rate) * tax_rate, "USD")}}
**Total:**
{{formatCurrency((items.0.hours * items.0.rate + items.1.hours * items.1.rate) * (1 + tax_rate), "USD")}}
```

### Payment Terms

```yaml
---
principal_amount: 100000
interest_rate: 0.065
payment_term_months: 36
---
```

```markdown
# Loan Agreement

**Principal Amount:** {{formatCurrency(principal_amount, "USD")}}
({{titleCase(numberToWords(principal_amount))}})

**Interest Rate:** {{formatPercent(interest_rate, 2)}} per annum

**Term:** {{formatInteger(payment_term_months)}} months

**Monthly Payment:**
{{formatCurrency(principal_amount * (interest_rate / 12) * Math.pow(1 + interest_rate / 12, payment_term_months) / (Math.pow(1 + interest_rate / 12, payment_term_months) - 1), "USD")}}
```

### International Formats

```yaml
---
amount: 1234567.89
german_client: true
french_client: false
---
```

```markdown
{{#if german_client}} **Betrag:** {{formatNumber(amount, 2, ",", ".")}} €
{{else if french_client}} **Montant:** {{formatNumber(amount, 2, ",", " ")}} €
{{else}} **Amount:** {{formatCurrency(amount, "USD")}} {{/if}}
```

### Statistics and Reporting

```yaml
---
statistics:
  total_contracts: 1547
  success_rate: 0.924
  average_value: 45670.33
  growth_rate: 0.127
---
```

```markdown
# Annual Report

**Total Contracts:** {{formatInteger(statistics.total_contracts)}} **Success
Rate:** {{formatPercent(statistics.success_rate, 1)}} **Average Contract
Value:** {{formatCurrency(statistics.average_value, "USD")}} **Growth Rate:**
{{formatPercent(statistics.growth_rate, 1)}}

## Performance Metrics

Our success rate of {{formatPercent(statistics.success_rate, 0)}} represents
{{formatInteger(statistics.total_contracts * statistics.success_rate)}}
successful contracts out of {{formatInteger(statistics.total_contracts)}} total.
```

## Best Practices

### 1. Use Consistent Currency Formatting

```markdown
<!-- ✅ Good - consistent currency throughout -->

**Base Price:** {{formatCurrency(base_price, "USD")}} **Tax:**
{{formatCurrency(tax_amount, "USD")}} **Total:**
{{formatCurrency(total_amount, "USD")}}

<!-- ❌ Avoid - mixing formats -->

**Base Price:** ${{base_price}} **Tax:** {{formatCurrency(tax_amount, "USD")}}
**Total:** {{total_amount}} dollars
```

### 2. Handle Different Locales

```yaml
---
locale: 'european'
amount: 1234.56
---
```

```markdown
{{#if locale == "european"}} **Amount:** {{formatNumber(amount, 2, ",", " ")}} €
{{else}} **Amount:** {{formatCurrency(amount, "USD")}} {{/if}}
```

### 3. Use Appropriate Decimal Places

```markdown
<!-- Currency - typically 2 decimals -->

**Price:** {{formatCurrency(price, "USD", 2)}}

<!-- Percentages - based on precision needed -->

**Interest Rate:** {{formatPercent(rate, 3)}} <!-- 5.125% --> **Discount:**
{{formatPercent(discount, 0)}} <!-- 15% -->

<!-- Large numbers - often no decimals -->

**Population:** {{formatInteger(population)}}
```

### 4. Combine with String Helpers

```markdown
**Amount:** {{formatCurrency(amount, "USD")}}
({{titleCase(numberToWords(amount))}})

<!-- Output: $50,000.00 (Fifty Thousand) -->
```

### 5. Use Number Conversion for Legal Documents

```markdown
The total amount of {{formatCurrency(amount, "USD")}} ({{numberToWords(amount)}}
dollars) shall be paid in full.
```

### 6. Handle Edge Cases

```markdown
<!-- Zero amounts -->

{{#if amount > 0}} **Amount Due:** {{formatCurrency(amount, "USD")}} {{else}}
**Amount Due:** No payment required {{/if}}

<!-- Negative amounts -->

{{#if balance < 0}} **Credit Balance:**
{{formatCurrency(Math.abs(balance), "USD")}} {{else}} **Amount Due:**
{{formatCurrency(balance, "USD")}} {{/if}}
```

### 7. Document Number Formats

```yaml
---
# Number formatting documentation
amounts:
  base: 25000 # USD, 2 decimal places
  rate: 0.065 # Percentage in decimal (6.5%)
  count: 1547 # Integer with thousands separator
---
```

## Error Handling

Number helpers handle errors gracefully:

- **Invalid numbers**: Return the original value as a string
- **Missing variables**: Show as unprocessed `{{variable}}`
- **Type errors**: Return safe fallback values
- **Division by zero**: Returns appropriate error indicators

**Example:**

```markdown
<!-- If 'invalid_number' is not a number -->

Price: {{formatCurrency(invalid_number, "USD")}}

<!-- Output: Price: invalid_number -->
```

## Integration with Other Helpers

### With Date Helpers

```markdown
**Due Date:** {{formatDate(due_date, "MMMM Do, YYYY")}} **Amount:**
{{formatCurrency(amount, "USD")}}
```

### With String Helpers

```markdown
**Client:** {{titleCase(client_name)}} **Amount:**
{{formatCurrency(amount, "USD")}} ({{titleCase(numberToWords(amount))}})
```

### With Conditional Logic

```markdown
{{#if amount > 10000}} **High Value Contract:**
{{formatCurrency(amount, "USD")}} **Approval Required** {{/if}}
```

## See Also

- [Date Helpers](date-helpers.md) - Date formatting and manipulation
- [String Helpers](string-helpers.md) - Text formatting and conversion
- [Special Values](special-values.md) - Special number values and calculations
- [Template Loops](../features/template-loops.md) - Using numbers in iterations
- [Optional Clauses](../features/optional-clauses.md) - Number-based conditions
