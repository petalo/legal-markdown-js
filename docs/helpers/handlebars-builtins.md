# Built-in Handlebars Helpers

Standard Handlebars control structures and utilities available in Legal
Markdown.

## Table of Contents

- [`#if`](#if) - Conditional rendering
- [`#unless`](#unless) - Inverse conditional
- [`#each`](#each) - Array iteration
- [`#with`](#with) - Change context
- [`lookup`](#lookup) - Dynamic property access

---

## `#if`

Renders content conditionally based on a truthy value.

### Syntax

```handlebars
{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}
```

### Examples

```handlebars
{{#if isPremium}}
  **Premium Member** since
  {{formatDate joinDate 'legal'}}
{{else}}
  Standard Member
{{/if}}
```

```handlebars
{{#if amount}}
  Total:
  {{formatDollar amount}}
{{/if}}
```

### Truthy/Falsy Values

- **Truthy**: `true`, non-zero numbers, non-empty strings, objects, arrays
- **Falsy**: `false`, `0`, `""`, `null`, `undefined`, `[]` (empty array)

### With Subexpressions

```handlebars
{{#if (contains email '@gmail.com')}}
  Gmail address detected
{{/if}}

{{#if (multiply price quantity)}}
  Total:
  {{formatDollar (multiply price quantity)}}
{{/if}}
```

---

## `#unless`

Inverse of `#if` - renders when condition is falsy.

### Syntax

```handlebars
{{#unless condition}}
  Content when false
{{/unless}}
```

### Examples

```handlebars
{{#unless hasWarranty}}
  **Note:** No warranty provided
{{/unless}}
```

```handlebars
{{#unless @last}}, {{/unless}}
```

### Equivalent to #if with else

```handlebars
{{#if condition}}A{{else}}B{{/if}}
{{#unless condition}}B{{else}}A{{/unless}}
```

---

## `#each`

Iterates over arrays or objects.

### Syntax

```handlebars
{{#each array}}
  {{this}}
{{/each}}
```

### Special Variables

- `{{this}}` - Current item
- `{{@index}}` - Current index (0-based)
- `{{@first}}` - Boolean, true for first item
- `{{@last}}` - Boolean, true for last item
- `{{@total}}` - Total count (Legal Markdown extension)
- `{{@key}}` - Property name (when iterating objects)

### Array Examples

```handlebars
--- items: - "Apple" - "Banana" - "Cherry" ---

{{#each items}}
  {{@index}}.
  {{this}}{{#unless @last}}, {{/unless}}
{{/each}}
```

**Output:**

```
0. Apple, 1. Banana, 2. Cherry
```

### Object Arrays

```handlebars
--- products: - name: "Widget" price: 10 - name: "Gadget" price: 25 ---

{{#each products}}
  -
  {{name}}:
  {{formatDollar price}}
{{/each}}
```

**Output:**

```
- Widget: $10.00
- Gadget: $25.00
```

### Iterating Objects

```handlebars
--- contact: name: "John Doe" email: "john@example.com" phone: "555-1234" ---

{{#each contact}}
  {{@key}}:
  {{this}}
{{/each}}
```

**Output:**

```
name: John Doe
email: john@example.com
phone: 555-1234
```

### Else Block

```handlebars
{{#each items}}
  -
  {{this}}
{{else}}
  No items found
{{/each}}
```

---

## `#with`

Changes the context for a block.

### Syntax

```handlebars
{{#with object}}
  {{property}}
{{/with}}
```

### Examples

```handlebars
--- client: name: "ACME Corp" address: "123 Main St" email: "info@acme.com" ---

{{#with client}}
  **Client Information:** - Name:
  {{name}}
  - Address:
  {{address}}
  - Email:
  {{email}}
{{/with}}
```

**Output:**

```
Client Information:
- Name: ACME Corp
- Address: 123 Main St
- Email: info@acme.com
```

### Nested Contexts

```handlebars
--- contract: client: name: "ACME Corp" terms: duration: 12 rate: 1000 ---

{{#with contract}}
  {{#with client}}
    Client:
    {{name}}
  {{/with}}
  {{#with terms}}
    Duration:
    {{duration}}
    months @
    {{formatDollar rate}}/month
  {{/with}}
{{/with}}
```

---

## `lookup`

Dynamic property access using a variable property name.

### Syntax

```handlebars
{{lookup object property}}
```

### Examples

```handlebars
--- client: name: "ACME Corp" email: "info@acme.com" fieldToShow: "name" ---

{{lookup client fieldToShow}}
```

**Output:**

```
ACME Corp
```

### Array Access

```handlebars
--- items: ["First", "Second", "Third"] index: 1 ---

{{lookup items index}}
```

**Output:**

```
Second
```

### Dynamic Field Selection

```handlebars
--- data: englishName: "Contract" spanishName: "Contrato" frenchName: "Contrat"
language: "spanish" --- Document type:
{{lookup data (concat language 'Name')}}
```

**Output:**

```
Document type: Contrato
```

---

## Complex Examples

### Conditional Lists with Formatting

```handlebars
---
items:
  - name: "Consulting"
    price: 150
    quantity: 8
    taxable: true
  - name: "Materials"
    price: 50
    quantity: 2
    taxable: false
taxRate: 0.08
---

{{#each items}}
**{{name}}**
- Quantity: {{quantity}}
- Unit Price: {{formatDollar price}}
- Subtotal: {{formatDollar (multiply price quantity)}}
{{#if taxable}}
- Tax ({{formatPercent ../taxRate 0}}): {{formatDollar (multiply (multiply price quantity) ../taxRate)}}
- Total: {{formatDollar (add (multiply price quantity) (multiply (multiply price quantity) ../taxRate))}}
{{else}}
- Tax: N/A (Tax exempt)
- Total: {{formatDollar (multiply price quantity)}}
{{/if}}

{{/each}}
```

### Nested Loops with Parent Access

```handlebars
---
companyName: "ACME Corp"
departments:
  - name: "Engineering"
    employees: ["Alice", "Bob"]
  - name: "Sales"
    employees: ["Charlie", "Diana"]
---

{{#each departments}}
## {{name}} Department ({{../companyName}})

{{#each employees}}
  - {{this}} - {{../name}} at {{../../companyName}}
{{/each}}
{{/each}}
```

### Conditional Formatting Based on Values

```handlebars
--- transactions: - type: "credit" amount: 1000 - type: "debit" amount: 250 -
type: "credit" amount: 500 ---

{{#each transactions}}
  {{#if (contains type 'credit')}}
    ✓ Received:
    {{formatDollar amount}}
  {{else}}
    ✗ Paid:
    {{formatDollar amount}}
  {{/if}}
{{/each}}
```

---

## See Also

- [Special Values](special-values.md) - Loop variables (@index, @first, @last,
  etc.)
- [Utility Helpers](utility-helpers.md) - concat, trackField
- [Official Handlebars Documentation](https://handlebarsjs.com/guide/builtin-helpers.html)

---

[← Back to Helpers](README.md)
