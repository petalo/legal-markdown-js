# Special Values

Built-in variables and context values available in Handlebars templates.

## Table of Contents

- [`@today`](#today) - Current date variable
- [Loop Variables](#loop-variables) - Variables available in `#each` blocks
  - [`@index`](#index) - Current index (0-based)
  - [`@first`](#first) - First item boolean
  - [`@last`](#last) - Last item boolean
  - [`@total`](#total) - Total items count
  - [`this`](#this) - Current loop item
- [Context Access](#context-access)
  - [`../`](#parent-context-access) - Parent context access
  - [`../../`](#ancestor-context-access) - Ancestor context access

---

## `@today`

Current date variable with format specifiers and arithmetic.

### Basic Usage

```handlebars
@today
```

Returns the current date.

### Format Specifiers

Apply format specifiers using square brackets:

| Syntax           | Format          | Example Output   |
| ---------------- | --------------- | ---------------- |
| `@today[ISO]`    | ISO format      | 2025-10-26       |
| `@today[US]`     | US format       | 10/26/2025       |
| `@today[EU]`     | European format | 26/10/2025       |
| `@today[legal]`  | Legal format    | October 26, 2025 |
| `@today[long]`   | Long format     | October 26, 2025 |
| `@today[medium]` | Medium format   | Oct 26, 2025     |
| `@today[short]`  | Short format    | Oct 26, 25       |

### Date Arithmetic

Add or subtract time using arithmetic operators:

| Syntax        | Operation                | Example           |
| ------------- | ------------------------ | ----------------- |
| `@today+30`   | 30 days from now         | November 25, 2025 |
| `@today-90`   | 90 days ago              | July 28, 2025     |
| `@today+1y`   | 1 year from now          | October 26, 2026  |
| `@today+2m`   | 2 months from now        | December 26, 2025 |
| `@today+1y6m` | 1 year 6 months from now | April 26, 2027    |

### Combined Operations

Combine arithmetic with format specifiers:

```handlebars
@today+30[US] → 11/25/2025 @today+1y[legal] → October 26, 2026 @today-90d[ISO] →
2025-07-28 @today+2m15d[EU] → 10/01/2026
```

### Examples

```handlebars
**Document Date:** @today[legal] **Due Date:** @today+30[US] **Contract
Expires:** @today+1y[ISO] **Grace Period Ends:** @today+15d[EU]
```

**Output:**

```
Document Date: October 26, 2025
Due Date: 11/25/2025
Contract Expires: 2026-10-26
Grace Period Ends: 10/11/2025
```

### Alternative: Using Helpers

You can also use the `today` helper with `formatDate` for more control:

```handlebars
{{formatDate today 'MMMM D, YYYY'}}
{{formatDate (addDays today 45) 'legal'}}
{{formatDate (addYears today 2) 'YYYY-MM-DD'}}
```

---

## Loop Variables

Special variables available inside `{{#each}}` blocks.

### `@index`

Current index (0-based) of the item in the loop.

**Example:**

```handlebars
{{#each items}}
  {{@index}}.
  {{name}}
{{/each}}
```

**Output:**

```
0. First item
1. Second item
2. Third item
```

### Human-Readable Index

For 1-based indexing:

```handlebars
{{#each items}}
  {{add @index 1}}.
  {{name}}
{{/each}}
```

**Output:**

```
1. First item
2. Second item
3. Third item
```

---

### `@first`

Boolean indicating if this is the first item.

**Example:**

```handlebars
{{#each items}}
  {{#if @first}}**First:**{{/if}}
  {{name}}
{{/each}}
```

**Output:**

```
**First:** Item 1
Item 2
Item 3
```

---

### `@last`

Boolean indicating if this is the last item.

**Example:**

```handlebars
{{#each items}}
  {{name}}{{#unless @last}}, {{/unless}}
{{/each}}
```

**Output:**

```
Item 1, Item 2, Item 3
```

---

### `@total`

Total number of items in the array (Legal Markdown extension).

**Example:**

```handlebars
{{#each items}}
  Item
  {{add @index 1}}
  of
  {{@total}}:
  {{name}}
{{/each}}
```

**Output:**

```
Item 1 of 3: First
Item 2 of 3: Second
Item 3 of 3: Third
```

---

### `this`

Current item in the loop.

**For Simple Arrays:**

```handlebars
--- names: ["Alice", "Bob", "Charlie"] ---

{{#each names}}
  -
  {{this}}
{{/each}}
```

**Output:**

```
- Alice
- Bob
- Charlie
```

**For Object Arrays:**

```handlebars
--- items: - name: "Widget" price: 10 ---

{{#each items}}
  {{this.name}}:
  {{this.price}}
  {{!-- or just {{name}}: {{price}} --}}
{{/each}}
```

---

## Context Access

### Parent Context Access

Use `../` to access the parent context from within nested blocks.

**Example:**

```handlebars
---
companyName: "ACME Corp"
departments:
  - name: "Engineering"
  - name: "Sales"
---

{{#each departments}}
  {{name}} at {{../companyName}}
{{/each}}
```

**Output:**

```
Engineering at ACME Corp
Sales at ACME Corp
```

### Ancestor Context Access

Use `../../` for grandparent context, `../../../` for great-grandparent, etc.

**Example:**

```handlebars
---
companyName: "ACME Corp"
domain: "acme.com"
departments:
  - name: "Engineering"
    employees: ["Alice", "Bob"]
---

{{#each departments}}
  ## {{name}} ({{../companyName}})
  {{#each employees}}
    - {{this}} - {{../name}} at {{../../companyName}}
    - Email: {{this}}@{{../../domain}}
  {{/each}}
{{/each}}
```

**Output:**

```
## Engineering (ACME Corp)
  - Alice - Engineering at ACME Corp
  - Email: Alice@acme.com
  - Bob - Engineering at ACME Corp
  - Email: Bob@acme.com
```

---

## Complex Examples

### Invoice with Metadata

```handlebars
---
invoiceDate: 2025-10-26
paymentDays: 30
company: "ACME Corp"
items:
  - desc: "Consulting"
    qty: 8
    rate: 150
  - desc: "Development"
    qty: 16
    rate: 120
---

**Invoice Date:** @today[legal]
**Due Date:** @today+{{paymentDays}}[US]

{{#each items}}
{{add @index 1}}. {{desc}}: {{qty}} × {{formatDollar rate}} = {{formatDollar (multiply qty rate)}}
{{/each}}

**Total:** {{formatDollar (add (multiply 8 150) (multiply 16 120))}}
**Issued by:** {{../company}}
```

### Contract with Nested Loops

```handlebars
--- contractStart: 2025-01-15 term: 12 parties: - role: "Provider" name: "Tech
Services Inc" contacts: - type: "Email" value: "info@techservices.com" - type:
"Phone" value: "555-1234" - role: "Client" name: "ACME Corp" contacts: - type:
"Email" value: "legal@acme.com" --- **Contract Period:** @contractStart[legal]
to @contractStart+{{term}}m[legal] **Parties:**
{{#each parties}}

  **{{role}}:**
  {{name}}
  {{#each contacts}}
    -
    {{type}}:
    {{value}}
  {{/each}}
{{/each}}
```

---

## See Also

- [Date Helpers](date-helpers.md) - For date formatting and arithmetic
- [Built-in Handlebars](handlebars-builtins.md) - For #each, #if, #with
- [Utility Helpers](utility-helpers.md) - For concat and other utilities

---

[← Back to Helpers](README.md)
