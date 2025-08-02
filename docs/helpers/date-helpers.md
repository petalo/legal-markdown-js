# Date Helpers

Date helpers provide powerful date formatting and manipulation capabilities for
legal documents, supporting multiple formats and locales.

## Table of Contents

- [formatDate()](#formatdatedate-format)
- [Date Arithmetic](#date-arithmetic)
- [Format Tokens](#format-tokens)
- [Predefined Formats](#predefined-formats)
- [Examples](#examples)
- [Best Practices](#best-practices)

## `formatDate(date, format)`

Formats a date according to the specified format string.

**Parameters:**

- `date`: Date object, string, or variable
- `format`: Format string (default: 'YYYY-MM-DD')

**Basic Usage:**

```markdown
Current date: {{formatDate(@today, "YYYY-MM-DD")}}

<!-- Output: 2025-07-16 -->

Contract date: {{formatDate(effective_date, "MMMM Do, YYYY")}}

<!-- Output: July 16th, 2025 -->
```

## Date Arithmetic

### `addYears(date, years)`

Adds years to a date.

```markdown
Expiration: {{formatDate(addYears(@today, 3), "MMMM Do, YYYY")}}

<!-- Output: July 16th, 2028 -->

Next renewal: {{formatDate(addYears(start_date, 1), "DD/MM/YYYY")}}

<!-- Output: 16/07/2026 -->
```

### `addMonths(date, months)`

Adds months to a date.

```markdown
Deadline: {{formatDate(addMonths(@today, 6), "MMMM YYYY")}}

<!-- Output: January 2026 -->

Quarterly review: {{formatDate(addMonths(contract_date, 3), "DD/MM/YYYY")}}

<!-- Output: 16/10/2025 -->
```

### `addDays(date, days)`

Adds days to a date.

```markdown
Payment date: {{formatDate(addDays(contract_date, 30), "MMMM Do, YYYY")}}

<!-- Output: August 15th, 2025 -->

Grace period: {{formatDate(addDays(@today, 15), "DD/MM/YYYY")}}

<!-- Output: 31/07/2025 -->
```

## Format Tokens

### Year Tokens

| Token  | Description  | Example |
| ------ | ------------ | ------- |
| `YYYY` | 4-digit year | 2025    |
| `YY`   | 2-digit year | 25      |

### Month Tokens

| Token     | Description               | Example |
| --------- | ------------------------- | ------- |
| `MM`      | 2-digit month (01-12)     | 07      |
| `M`       | 1-digit month (1-12)      | 7       |
| `MMMM`    | Full month name           | July    |
| `MMMM_ES` | Full month name (Spanish) | julio   |
| `MMM`     | Short month name          | Jul     |

### Day Tokens

| Token | Description             | Example |
| ----- | ----------------------- | ------- |
| `DD`  | 2-digit day (01-31)     | 16      |
| `D`   | 1-digit day (1-31)      | 16      |
| `Do`  | Day with ordinal suffix | 16th    |

### Day of Week Tokens

| Token  | Description    | Example   |
| ------ | -------------- | --------- |
| `dddd` | Full day name  | Wednesday |
| `ddd`  | Short day name | Wed       |

## Predefined Formats

The system provides constants for common legal document formats:

| Format    | Pattern                | Example                    |
| --------- | ---------------------- | -------------------------- |
| `ISO`     | `YYYY-MM-DD`           | 2025-07-16                 |
| `US`      | `MM/DD/YYYY`           | 07/16/2025                 |
| `EU`      | `DD/MM/YYYY`           | 16/07/2025                 |
| `UK`      | `DD/MM/YYYY`           | 16/07/2025                 |
| `FULL`    | `MMMM Do, YYYY`        | July 16th, 2025            |
| `FULL_US` | `MMMM D, YYYY`         | July 16, 2025              |
| `SHORT`   | `MMM D, YYYY`          | Jul 16, 2025               |
| `LEGAL`   | `Do day of MMMM, YYYY` | 16th day of July, 2025     |
| `FORMAL`  | `dddd, MMMM Do, YYYY`  | Wednesday, July 16th, 2025 |
| `SPANISH` | `D de MMMM_ES de YYYY` | 16 de julio de 2025        |

### Format Examples

```markdown
<!-- ISO format -->

ISO Date: {{formatDate(@today, "YYYY-MM-DD")}}

<!-- Output: 2025-07-16 -->

<!-- European format -->

European date: {{formatDate(contract_date, "DD/MM/YYYY")}}

<!-- Output: 16/07/2025 -->

<!-- Full format -->

Full date: {{formatDate(@today, "dddd, MMMM Do, YYYY")}}

<!-- Output: Wednesday, July 16th, 2025 -->

<!-- Legal format -->

Legal date: {{formatDate(@today, "Do day of MMMM, YYYY")}}

<!-- Output: 16th day of July, 2025 -->

<!-- Spanish format -->

Spanish format: {{formatDate(@today, "D de MMMM_ES de YYYY")}}

<!-- Output: 16 de julio de 2025 -->
```

## Examples

### Contract Templates

```yaml
---
effective_date: '2025-07-16'
termination_date: '@today'
renewal_periods: 3
---
```

```markdown
# Service Agreement

**Effective Date:** {{formatDate(effective_date, "MMMM Do, YYYY")}}
**Termination Date:** {{formatDate(termination_date, "Do day of MMMM, YYYY")}}

## Renewal Terms

This agreement shall automatically renew for {{renewal_periods}} consecutive
periods of one year each, with the first renewal occurring on
{{formatDate(addYears(effective_date, 1), "MMMM Do, YYYY")}}.

## Payment Schedule

- First payment due:
  {{formatDate(addDays(effective_date, 30), "MMMM Do, YYYY")}}
- Quarterly payments:
  {{formatDate(addMonths(effective_date, 3), "MMM D, YYYY")}},
  {{formatDate(addMonths(effective_date, 6), "MMM D, YYYY")}},
  {{formatDate(addMonths(effective_date, 9), "MMM D, YYYY")}}
- Final payment:
  {{formatDate(addDays(addYears(effective_date, 1), -1), "MMMM Do, YYYY")}}
```

### Invoice Templates

```yaml
---
invoice_date: '@today'
due_days: 30
---
```

```markdown
# Invoice

**Invoice Date:** {{formatDate(invoice_date, "MMMM Do, YYYY")}} **Due Date:**
{{formatDate(addDays(invoice_date, due_days), "MMMM Do, YYYY")}}

Payment is due within {{due_days}} days of the invoice date.
```

### Legal Documents

```yaml
---
execution_date: '@today'
jurisdiction: 'California'
---
```

```markdown
# Legal Agreement

Executed on this {{formatDate(execution_date, "Do")}} day of
{{formatDate(execution_date, "MMMM")}}, {{formatDate(execution_date, "YYYY")}},
in the State of {{jurisdiction}}.

**Witness:** **********\_********** Date:
{{formatDate(execution_date, "MM/DD/YYYY")}}

**Notary:** **********\_********** Date:
{{formatDate(execution_date, "MM/DD/YYYY")}}
```

### International Contracts

```yaml
---
signature_date: '@today'
locale: 'spanish'
---
```

```markdown
{{#if locale == "spanish"}} Firmado el
{{formatDate(signature_date, "D de MMMM_ES de YYYY")}} {{else}} Signed on
{{formatDate(signature_date, "MMMM Do, YYYY")}} {{/if}}
```

## Best Practices

### 1. Use Consistent Date Formats

```markdown
<!-- ✅ Good - consistent format throughout document -->

**Start Date:** {{formatDate(start_date, "MMMM Do, YYYY")}} **End Date:**
{{formatDate(end_date, "MMMM Do, YYYY")}} **Payment Due:**
{{formatDate(payment_date, "MMMM Do, YYYY")}}

<!-- ❌ Avoid - mixing formats -->

**Start Date:** {{formatDate(start_date, "MM/DD/YYYY")}} **End Date:**
{{formatDate(end_date, "MMMM Do, YYYY")}}
```

### 2. Consider Your Audience

```markdown
<!-- US audience -->

**Effective:** {{formatDate(effective_date, "MM/DD/YYYY")}}

<!-- European audience -->

**Effective:** {{formatDate(effective_date, "DD/MM/YYYY")}}

<!-- Legal documents -->

**Effective:** {{formatDate(effective_date, "Do day of MMMM, YYYY")}}
```

### 3. Use Date Arithmetic for Calculations

```markdown
<!-- ✅ Good - calculate dates dynamically -->

**Payment Due:** {{formatDate(addDays(@today, 30), "MMMM Do, YYYY")}} **Contract
Expires:** {{formatDate(addYears(start_date, 2), "MMMM Do, YYYY")}}

<!-- ❌ Avoid - hardcoded dates -->

**Payment Due:** August 15th, 2025
```

### 4. Handle Special Values Appropriately

```markdown
<!-- Using @today for current date -->

**Generated:** {{formatDate(@today, "MMMM Do, YYYY")}}

<!-- Using variable dates -->

**Contract Date:** {{formatDate(contract_date, "MMMM Do, YYYY")}}

<!-- Conditional date display -->

{{#if has_deadline}} **Deadline:**
{{formatDate(deadline_date, "MMMM Do, YYYY")}} {{/if}}
```

### 5. Document Date Formats

```yaml
---
# Date format documentation
effective_date: '2025-07-16' # ISO format: YYYY-MM-DD
payment_terms: 30 # Days from contract date
renewal_period: 1 # Years
---
```

### 6. Validate Date Inputs

When using user-provided dates, ensure they are in the expected format:

```markdown
<!-- Date validation happens automatically -->

{{formatDate(user_provided_date, "MMMM Do, YYYY")}}

<!-- If invalid, returns original value -->
```

## Error Handling

Date helpers handle errors gracefully:

- **Invalid dates**: Return the original value unchanged
- **Missing variables**: Show as unprocessed `{{variable}}`
- **Invalid formats**: Use default format
- **Type errors**: Return safe fallback values

**Example:**

```markdown
<!-- If 'invalid_date' is not a valid date -->

Date: {{formatDate(invalid_date, "DD/MM/YYYY")}}

<!-- Output: Date: invalid_date -->
```

## Integration with Other Helpers

### With String Helpers

```markdown
**Month:** {{titleCase(formatDate(@today, "MMMM"))}}

<!-- Output: Month: July -->
```

### With Number Helpers

```markdown
**Year:** {{formatInteger(formatDate(@today, "YYYY"))}}

<!-- Output: Year: 2,025 -->
```

### With Conditional Logic

```markdown
{{#if formatDate(@today, "MM") == "12"}} **Year-end processing applies** {{/if}}
```

## See Also

- [Special Values](special-values.md) - @today and other date values
- [Number Helpers](number-helpers.md) - Formatting numbers and currency
- [String Helpers](string-helpers.md) - Text manipulation
- [Template Loops](../features/template-loops.md) - Using dates in iterations
- [Optional Clauses](../features/optional-clauses.md) - Date-based conditions
