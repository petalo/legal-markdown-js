# Legal Markdown Helpers

Legal Markdown includes a complete system of helpers to format and manipulate
dates, numbers, and strings in legal documents. Helpers are used with the
**mixin syntax** `{{helperName(args)}}` and can be nested to create complex
expressions.

> **Note on Syntax**: Legal Markdown uses two distinct syntaxes:
>
> - `{{variable}}` for **mixins** (variables, helpers, template loops)
> - `|reference|` for **cross-references** (internal section references)

## Table of Contents

- [Template Loops and Lists](#template-loops-and-lists)
- [Date Helpers](#date-helpers)
- [Number Helpers](#number-helpers)
- [String Helpers](#string-helpers)
- [Special Values](#special-values)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)

## Template Loops and Lists

Legal Markdown supports template loops for iterating over arrays and conditional
blocks using the `{{#variable}}...{{/variable}}` syntax.

### Array Loops

Use `{{#arrayName}}...{{/arrayName}}` to iterate over arrays of data. The system
supports both simple array names and nested object paths using dot notation.

**Basic syntax:**

```markdown
{{#items}}

- {{name}} - {{price}} {{/items}}
```

**With nested objects (dot notation):**

```markdown
{{#services.included}}

- {{.}} {{/services.included}}

{{#contract.parties}}

- {{name}} ({{role}}) {{/contract.parties}}
```

**With conditionals:**

```markdown
{{#items}}

- {{name}} {{onSale ? "(ON SALE!)" : ""}} - ${{price}} {{/items}}
```

### Conditional Blocks

Use the same syntax for conditional rendering based on truthy/falsy values:

```markdown
{{#isMember}} **Member Status:** Active **Points:** {{pointsEarned}}
{{/isMember}}
```

### Lists Integration

When using loops inside HTML lists, the system automatically handles markdown
list syntax to prevent nested `<ul>` elements:

**Correct approach:**

```markdown
<ul class="items-list">
{{#items}}
- {{name}} - ${{price}}
{{/items}}
</ul>
```

**Generated HTML:**

```html
<ul class="items-list">
  <li>Item 1 - $10.99</li>
  <li>Item 2 - $15.50</li>
</ul>
```

### Loop Context Variables

Within loops, you have access to special context variables:

- `{{.}}` - Current item value (for primitive arrays) or current object (for
  object arrays)
- `@index` - Current item index (0-based)
- `@total` - Total number of items
- `@first` - True if first item
- `@last` - True if last item

**Example with primitive arrays:**

```markdown
{{#services.included}}

- {{.}} {{/services.included}}
```

**Example with object arrays:**

```markdown
{{#items}} {{@index + 1}}. {{name}} {{@last ? "(Final item)" : ""}} {{/items}}
```

**Example with nested object paths:**

```markdown
{{#maintenance.lessor_obligations}}

- {{.}} {{/maintenance.lessor_obligations}}
```

### Table Loops

Perfect for generating table rows:

```markdown
<table>
<tr><th>Day</th><th>Hours</th></tr>
{{#businessHours}}
<tr><td>{{day}}</td><td>{{hours}}</td></tr>
{{/businessHours}}
</table>
```

### Important Notes

1. **Dot Notation Support:** Template loops support nested object access using
   dot notation (e.g., `{{#services.included}}`, `{{#contract.parties}}`). This
   allows you to iterate over arrays stored in nested objects within your YAML
   front matter.

2. **Current Item Access:** Use `{{.}}` to access the current item value in
   primitive arrays or the current object in object arrays. This is essential
   for displaying individual array values.

3. **List Processing:** The system automatically converts markdown list syntax
   (`- item`) to HTML `<li>` elements when inside HTML `<ul>` containers to
   prevent nested lists.

4. **Nested Loops:** Loops can be nested, and each maintains its own context.

5. **HTML Integration:** You can mix HTML and markdown within loops - the system
   handles the conversion intelligently.

6. **Error Handling:** If the array variable doesn't exist, the loop block is
   simply omitted from the output.

## Date Helpers

### `formatDate(date, format)`

Formats a date according to the specified format.

**Parameters:**

- `date`: Date object, string, or variable
- `format`: Format string (default: 'YYYY-MM-DD')

**Format tokens:**

- `YYYY`: 4-digit year (2025)
- `YY`: 2-digit year (25)
- `MM`: 2-digit month (01-12)
- `M`: 1-digit month (1-12)
- `DD`: 2-digit day (01-31)
- `D`: 1-digit day (1-31)
- `MMMM`: Full month name (January)
- `MMM`: Short month name (Jan)
- `dddd`: Full day name (Monday)
- `ddd`: Short day name (Mon)
- `Do`: Day with ordinal suffix (1st, 2nd, 3rd, 4th)

**Examples:**

```markdown
ISO Date: {{formatDate(@today, "YYYY-MM-DD")}}

<!-- Output: 2025-07-16 -->

Full date: {{formatDate(@today, "dddd, MMMM Do, YYYY")}}

<!-- Output: Wednesday, July 16th, 2025 -->

European date: {{formatDate(contract_date, "DD/MM/YYYY")}}

<!-- Output: 16/07/2025 -->

Legal date: {{formatDate(@today, "Do day of MMMM, YYYY")}}

<!-- Output: 16th day of July, 2025 -->
```

### `addYears(date, years)`

Adds years to a date.

**Examples:**

```markdown
Expiration: {{formatDate(addYears(@today, 3), "MMMM Do, YYYY")}}

<!-- Output: July 16th, 2028 -->

Next renewal: {{formatDate(addYears(start_date, 1), "DD/MM/YYYY")}}
```

### `addMonths(date, months)`

Adds months to a date.

**Examples:**

```markdown
Deadline: {{formatDate(addMonths(@today, 6), "MMMM YYYY")}}

<!-- Output: January 2026 -->

Quarterly review: {{formatDate(addMonths(contract_date, 3), "DD/MM/YYYY")}}
```

### `addDays(date, days)`

Adds days to a date.

**Examples:**

```markdown
Payment date: {{formatDate(addDays(contract_date, 30), "MMMM Do, YYYY")}}

<!-- Output: August 15th, 2025 -->

Grace period: {{formatDate(addDays(@today, 15), "DD/MM/YYYY")}}
```

## Number Helpers

### `formatCurrency(amount, currency, decimals)`

Formats a number as currency.

**Parameters:**

- `amount`: Number to format
- `currency`: Currency code ('EUR', 'USD', 'GBP')
- `decimals`: Number of decimals (default: 2)

**Examples:**

```markdown
Total amount: {{formatCurrency(amount, "EUR")}}

<!-- Output: 1,234.56 € -->

Price in dollars: {{formatCurrency(price, "USD", 0)}}

<!-- Output: $1,235 -->

Price in pounds: {{formatCurrency(cost, "GBP", 2)}}

<!-- Output: £1,234.56 -->
```

### `formatEuro(amount, decimals)`

Shortcut to format in euros.

**Examples:**

```markdown
Cost: {{formatEuro(total_cost)}}

<!-- Output: 2,500.00 € -->

Discount: {{formatEuro(discount, 0)}}

<!-- Output: 100 € -->
```

### `formatDollar(amount, decimals)`

Shortcut to format in dollars.

**Examples:**

```markdown
Price: {{formatDollar(price)}}

<!-- Output: $1,299.99 -->
```

### `formatPound(amount, decimals)`

Shortcut to format in pounds sterling.

**Examples:**

```markdown
Amount: {{formatPound(amount)}}

<!-- Output: £850.00 -->
```

### `formatPercent(value, decimals, symbol)`

Formats a number as a percentage.

**Parameters:**

- `value`: Number to format
- `decimals`: Number of decimals (default: 2)
- `symbol`: Show % symbol (default: true)

**Examples:**

```markdown
Interest rate: {{formatPercent(0.05, 1)}}

<!-- Output: 5.0% -->

Commission: {{formatPercent(commission_rate, 2)}}

<!-- Output: 2.50% -->

Discount: {{formatPercent(discount, 0)}}

<!-- Output: 15% -->

High rate: {{formatPercent(1.5, 1)}}

<!-- Output: 150.0% -->
```

**Important:** The input value should always be in decimal format where 1.0 =
100%. For example:

- 0.21 represents 21%
- 1.5 represents 150%
- 0.055 represents 5.5%

### `formatInteger(value, separator)`

Formats an integer with thousands separators.

**Examples:**

```markdown
Population: {{formatInteger(population)}}

<!-- Output: 1,234,567 -->

Units: {{formatInteger(units, ".")}}

<!-- Output: 1.234.567 -->
```

### `numberToWords(number)`

Converts a number to words (useful for legal documents).

**Examples:**

```markdown
Amount: {{numberToWords(amount)}} euros

<!-- Output: fifty thousand euros -->

Quantity: {{capitalize(numberToWords(quantity))}} units

<!-- Output: Forty-two units -->
```

### `round(value, decimals)`

Rounds a number to the specified decimals.

**Examples:**

```markdown
Result: {{round(calculation, 2)}}

<!-- Output: 123.46 -->

Percentage: {{round(percentage, 0)}}%

<!-- Output: 15% -->
```

## String Helpers

### `capitalize(str)`

Capitalizes the first letter of a string.

**Examples:**

```markdown
Name: {{capitalize(first_name)}}

<!-- Input: "john" → Output: "John" -->

Greeting: {{capitalize("hello world")}}

<!-- Output: "Hello world" -->
```

### `capitalizeWords(str)`

Capitalizes the first letter of each word.

**Examples:**

```markdown
Title: {{capitalizeWords(job_title)}}

<!-- Input: "chief executive officer" → Output: "Chief Executive Officer" -->

Full name: {{capitalizeWords(full_name)}}

<!-- Input: "john doe smith" → Output: "John Doe Smith" -->
```

### `upper(str)`

Converts to uppercase.

**Examples:**

```markdown
Code: {{upper(product_code)}}

<!-- Input: "abc123" → Output: "ABC123" -->

Emphasis: {{upper("important")}}

<!-- Output: "IMPORTANT" -->
```

### `lower(str)`

Converts to lowercase.

**Examples:**

```markdown
Email: {{lower(email_address)}}

<!-- Input: "John@EXAMPLE.COM" → Output: "john@example.com" -->
```

### `titleCase(str)`

Converts to title case (handles articles and prepositions).

**Examples:**

```markdown
Book: {{titleCase(book_title)}}

<!-- Input: "the art of war" → Output: "The Art of War" -->

Movie: {{titleCase("lord of the rings")}}

<!-- Output: "Lord of the Rings" -->
```

### `truncate(str, length, suffix)`

Truncates a string to the specified length.

**Parameters:**

- `str`: String to truncate
- `length`: Maximum length
- `suffix`: Suffix to add (default: "...")

**Examples:**

```markdown
Summary: {{truncate(description, 50)}}

<!-- Input: "This is a very long description..." → Output: "This is a very long description that will be..." -->

Short title: {{truncate(long_title, 20, "…")}}

<!-- Output: "A very long titl…" -->
```

### `clean(str)`

Removes extra spaces and cleans the string.

**Examples:**

```markdown
Clean text: {{clean("  multiple   spaces  ")}}

<!-- Output: "multiple spaces" -->
```

### `pluralize(word, count, plural)`

Pluralizes a word according to the number.

**Parameters:**

- `word`: Singular word
- `count`: Number to determine plural
- `plural`: Custom plural form (optional)

**Examples:**

```markdown
Articles: {{count}} {{pluralize("article", count, "articles")}}

<!-- count=1 → "1 article" -->
<!-- count=5 → "5 articles" -->

Days: {{days}} {{pluralize("day", days)}}

<!-- days=1 → "1 day" -->
<!-- days=30 → "30 days" -->

People: {{people_count}} {{pluralize("person", people_count, "people")}}

<!-- people_count=1 → "1 person" -->
<!-- people_count=5 → "5 people" -->
```

### `initials(name)`

Extracts the initials from a name.

**Examples:**

```markdown
Initials: {{initials(full_name)}}

<!-- Input: "John Michael Doe" → Output: "JMD" -->

Signature: {{initials(signatory_name)}}

<!-- Input: "María García López" → Output: "MGL" -->
```

### `replaceAll(str, search, replace)`

Replaces all occurrences of a substring.

**Examples:**

```markdown
Updated text: {{replaceAll(contract_text, "COMPANY", company_name)}}

<!-- Replaces all occurrences of "COMPANY" with the company name -->

Clean code: {{replaceAll(reference_code, "-", "")}}

<!-- Input: "REF-2024-001" → Output: "REF2024001" -->
```

### Case Conversion

#### `camelCase(str)`

Converts to camelCase.

**Examples:**

```markdown
Variable: {{camelCase("first name")}}

<!-- Output: "firstName" -->

Field: {{camelCase("contract_start_date")}}

<!-- Output: "contractStartDate" -->
```

#### `pascalCase(str)`

Converts to PascalCase.

**Examples:**

```markdown
Class: {{pascalCase("user profile")}}

<!-- Output: "UserProfile" -->
```

#### `kebabCase(str)`

Converts to kebab-case.

**Examples:**

```markdown
URL: {{kebabCase("Company Name")}}

<!-- Output: "company-name" -->
```

#### `snakeCase(str)`

Converts to snake_case.

**Examples:**

```markdown
DB field: {{snakeCase("Company Name")}}

<!-- Output: "company_name" -->
```

## Special Values

### `@today`

Special value that resolves to the current date.

**Examples:**

```markdown
Generation date: {{formatDate(@today, "DD/MM/YYYY")}}

<!-- Output: 16/07/2025 -->

Full date: {{formatDate(@today, "dddd, MMMM Do, YYYY")}}

<!-- Output: Wednesday, July 16th, 2025 -->
```

## Advanced Usage

### Nested Helpers

Helpers can be nested to create complex expressions:

**Examples:**

```markdown
Uppercase name: {{upper(capitalizeWords(client_name))}}

<!-- Input: "john doe" → Output: "JOHN DOE" -->

Future formatted date: {{formatDate(addMonths(@today, 6), "MMMM Do, YYYY")}}

<!-- Output: "January 16th, 2026" -->

Document ID:
{{upper(replaceAll(kebabCase(client_name), "-", ""))}}{{formatDate(@today, "YYMMDD")}}

<!-- Input: "John Doe" → Output: "JOHNDOE250716" -->
```

### Helpers with Variables

Helpers can use variables as arguments:

**Examples:**

```markdown
Amount: {{formatCurrency(total_amount, currency_code, decimal_places)}}

<!-- Uses the variables: total_amount, currency_code, decimal_places -->

Deadline: {{formatDate(addDays(start_date, payment_days), date_format)}}

<!-- Uses the variables: start_date, payment_days, date_format -->
```

### Helpers with Conditionals

Helpers can be combined with conditional expressions:

**Examples:**

```markdown
Amount: {{amount ? formatCurrency(amount, "EUR") : "Amount not specified"}}

<!-- Shows the formatted amount or alternative text -->

Date: {{due_date ? formatDate(due_date, "DD/MM/YYYY") : "No due date"}}

<!-- Shows the formatted date or alternative text -->
```

## Best Practices

### 1. Consistency in Format

Use the same date and number formats throughout the document:

```markdown
<!-- Good practice -->

Start date: {{formatDate(start_date, "DD/MM/YYYY")}} End date:
{{formatDate(end_date, "DD/MM/YYYY")}}

<!-- Bad practice -->

Start date: {{formatDate(start_date, "DD/MM/YYYY")}} End date:
{{formatDate(end_date, "MMMM Do, YYYY")}}
```

### 2. Data Validation

Combine helpers with conditionals to validate data:

```markdown
Amount: {{amount ? formatCurrency(amount, "EUR") : "[AMOUNT REQUIRED]"}}
Contact: {{contact_name ? capitalizeWords(contact_name) : "[NAME REQUIRED]"}}
```

### 3. Localization

Use variables to facilitate localization:

```markdown
## <!-- In the YAML frontmatter -->

currency: "EUR" date_format: "DD/MM/YYYY"

---

<!-- In the document -->

Price: {{formatCurrency(price, currency)}} Date:
{{formatDate(contract_date, date_format)}}
```

### 4. Documenting Complex Helpers

Document complex helpers with comments:

```markdown
<!-- Generates unique ID: INITIALS + DATE + CODE -->

ID:
{{upper(initials(client_name))}}{{formatDate(@today, "YYMMDD")}}{{formatInteger(sequence, "")}}
```

## Complete Examples

### Service Agreement

```markdown
---
contract_date: @today
client_name: "john doe"
company_name: "tech solutions inc"
amount: 50000
currency: "EUR"
payment_days: 30
project_months: 6
---

# Service Agreement - {{titleCase(client_name)}}

**Date:** {{formatDate(contract_date, "dddd, MMMM Do, YYYY")}} **Client:**
{{capitalizeWords(client_name)}} **Company:** {{titleCase(company_name)}}

## Financial Terms

**Total Amount:** {{formatCurrency(amount, currency)}} **Amount in Words:**
{{capitalize(numberToWords(amount))}} euros **Currency:** {{upper(currency)}}

## Payment Schedule

**Payment Terms:** {{payment_days}} {{pluralize("day", payment_days)}} **Due
Date:** {{formatDate(addDays(contract_date, payment_days), "DD/MM/YYYY")}}
**Project Duration:** {{project_months}}
{{pluralize("month", project_months, "months")}} **End Date:**
{{formatDate(addMonths(contract_date, project_months), "DD/MM/YYYY")}}

## Document Information

**Contract ID:**
{{upper(initials(client_name))}}{{formatDate(contract_date, "YYMMDD")}}
**Generated:** {{formatDate(@today, "DD/MM/YYYY")}} at
{{formatDate(@today, "HH:mm")}}

## Signatures

**Client:** {{capitalizeWords(client_name)}} ({{initials(client_name)}})
**Date:** **\*\***\_\_\_**\*\***

**Company:** {{titleCase(company_name)}} **Date:** **\*\***\_\_\_**\*\***
```

### Invoice

```markdown
---
invoice_date: @today
client_name: "maría garcía"
invoice_number: 2024001
subtotal: 1000
tax_rate: 0.21
items:
  - name: "Consulting"
    quantity: 10
    price: 80
  - name: "Development"
    quantity: 5
    price: 120
---

# Invoice No. {{formatInteger(invoice_number, "")}}

**Date:** {{formatDate(invoice_date, "DD/MM/YYYY")}} **Client:**
{{capitalizeWords(client_name)}} **Initials:** {{initials(client_name)}}

## Financial Summary

**Subtotal:** {{formatEuro(subtotal)}} **VAT ({{formatPercent(tax_rate, 0)}}):**
{{formatEuro(subtotal * tax_rate)}} **Total:**
{{formatEuro(subtotal * (1 + tax_rate))}}

**Total in Words:** {{capitalize(numberToWords(subtotal * (1 + tax_rate)))}}
euros

## Payment Information

**Due Date:** {{formatDate(addDays(invoice_date, 30), "DD/MM/YYYY")}}
**Reference:**
{{upper(replaceAll(kebabCase(client_name), "-", ""))}}{{formatDate(invoice_date, "YYMMDD")}}
```

### Non-Disclosure Agreement

```markdown
---
agreement_date: @today
party_a: "innovatech solutions"
party_b: "digital consulting group"
duration_months: 24
governing_law: "Spain"
---

# Non-Disclosure Agreement

**Date:** {{formatDate(agreement_date, "Do of MMMM, YYYY")}}

Between {{titleCase(party_a)}} and {{titleCase(party_b)}}

## Duration

This agreement will have a duration of {{duration_months}}
{{pluralize("month", duration_months, "months")}}, starting on
{{formatDate(agreement_date, "DD/MM/YYYY")}} and ending on
{{formatDate(addMonths(agreement_date, duration_months), "DD/MM/YYYY")}}.

## Jurisdiction

This agreement will be governed by the laws of {{governing_law}}.

## Identifiers

**Agreement Code:**
{{upper(initials(party_a))}}{{upper(initials(party_b))}}{{formatDate(agreement_date, "YYMMDD")}}
**Generated:** {{formatDate(@today, "dddd, DD of MMMM, YYYY")}}

## Signatures

**{{titleCase(party_a)}}** Initials: {{initials(party_a)}} Date:
**\*\***\_\_\_**\*\***

**{{titleCase(party_b)}}** Initials: {{initials(party_b)}} Date:
**\*\***\_\_\_**\*\***
```

## Error Handling

Helpers are designed to handle errors gracefully:

- **Invalid dates:** Return the original value
- **Invalid numbers:** Return the original value as a string
- **Unknown helpers:** Leave the original syntax unchanged
- **Type errors:** Are caught and logged, returning undefined

**Error handling example:**

```markdown
<!-- If 'invalid_date' is not a valid date -->

Date: {{formatDate(invalid_date, "DD/MM/YYYY")}}

<!-- Output: Date: invalid_date -->

<!-- If 'invalid_number' is not a number -->

Price: {{formatCurrency(invalid_number, "EUR")}}

<!-- Output: Price: invalid_number -->

<!-- If 'unknownHelper' does not exist -->

Result: {{unknownHelper(value)}}

<!-- Output: Result: {{unknownHelper(value)}} -->
```

This helper system provides a solid foundation for creating professional legal
documents with automatic and consistent formatting, while maintaining the
flexibility needed for different types of documents and use cases.
