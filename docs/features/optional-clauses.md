# Optional Clauses

Legal Markdown JS supports **multiple syntaxes** for conditional content based
on YAML variables. Each syntax offers different advantages for various use
cases.

## Table of Contents

- [Supported Syntaxes](#supported-syntaxes)
- [Modern Bracket Syntax](#modern-bracket-syntax-contentcondition)
- [Block Conditional Syntax](#block-conditional-syntax-if-condition)
- [Simple Variable Syntax](#simple-variable-syntax-variable)
- [Legacy Bracket Syntax](#legacy-bracket-syntax-conditioncontent)
- [Operators and Expressions](#operators-and-expressions)
- [Advanced Use Cases](#advanced-use-cases)
- [Template Loops](#template-loops)
- [Best Practices](#best-practices)

## Supported Syntaxes

Legal Markdown JS supports **4 different syntaxes** for generating optional
clauses, each with its own advantages and specific use cases:

| Syntax                   | Format                              | Advantages                  | Use Cases                        |
| ------------------------ | ----------------------------------- | --------------------------- | -------------------------------- |
| **Modern brackets**      | `[content]{condition}`              | Compact, natural            | Inline text, expressions         |
| **Conditional {{#if}}**  | `{{#if condition}}content{{/if}}`   | More readable, else support | Complex conditions               |
| **Simple {{#variable}}** | `{{#variable}}content{{/variable}}` | Concise, automatic loops    | Simple boolean variables         |
| **Legacy brackets**      | `[{{condition}}content]`            | Legacy compatible           | Migration from previous versions |

## Modern Bracket Syntax `[content]{condition}`

The recommended syntax for inline conditional content:

### Basic Usage

```markdown
[This clause appears only if confidentiality is required.]{confidentiality}

[Premium support is included for enterprise clients.]{client.type ==
"enterprise"}

[This applies to California residents only.]{jurisdiction == "California"}

The service [includes priority support]{isPremium} and [24/7
availability]{hasExtendedSupport}.
```

### With Complex Expressions

```markdown
[Special terms will apply]{premium && region == "EU"} according to European
legislation.

[A {{discountPercent}}% discount will be applied]{amount >= 1000}

[Volume discount applies]{quantity >= 100} for large orders.
```

### Multiple Conditions in Same Paragraph

```markdown
Services include: basic consulting[, phone support]{hasPhoneSupport}[, and
access to premium resources]{isPremiumClient}.
```

**Required metadata:**

```yaml
hasPhoneSupport: true
isPremiumClient: false
```

**Result:**

```text
Services include: basic consulting, phone support.
```

## Block Conditional Syntax `{{#if condition}}`

For complex conditions with logical operators and optional else clauses:

### Basic If/Else

```markdown
{{#if premium && region == "US"}} **Premium US Terms:**

- 24/7 phone support
- Priority handling
- Extended warranty

{{else}} **Standard Terms:**

- Email support
- Standard processing
- Basic warranty {{/if}}
```

### Nested Conditions

```markdown
{{#if client.type == "enterprise"}} {{#if client.region == "US"}} Special US
enterprise terms apply. {{else}} International enterprise terms apply. {{/if}}
{{/if}}
```

### Complex Logical Expressions

```markdown
{{#if (premium || enterprise) && status == "active"}} Advanced features are
available for your account type. {{/if}}

{{#if premium && status == "active" && region == "US"}} Special terms for active
premium users in the United States. {{/if}}
```

## Simple Variable Syntax `{{#variable}}`

Concise syntax for boolean variables and automatic array iteration:

### Boolean Variables

```markdown
{{#includeWarranty}} **Warranty Terms:** This product includes a 12-month
warranty covering defects. {{/includeWarranty}}

{{#includeStandardTerms}} l. **Standard Terms**

The company's standard terms and conditions apply. {{/includeStandardTerms}}
```

### Automatic Array Detection

The system automatically detects arrays and iterates over them:

```markdown
{{#services}}

- {{name}}: {{formatCurrency(price, currency)}} {{/services}}
```

**Required metadata:**

```yaml
services:
  - name: 'Legal Consulting'
    price: 150
    currency: 'USD'
  - name: 'Contract Review'
    price: 200
    currency: 'USD'
```

**Result:**

```text
- Legal Consulting: $150.00
- Contract Review: $200.00
```

### Variables with Underscores

```markdown
{{#client_has_premium}} ll. **Premium Services**

As a premium client, you have access to:

- Priority support
- Advanced features
- Exclusive discounts {{/client_has_premium}}
```

## Legacy Bracket Syntax `[{{condition}}content]`

For compatibility with legacy document syntax:

### Basic Usage

```markdown
[{{confidentiality}}This information is confidential and proprietary.]

[{{showLegalNotice}}This document is legally binding and has been reviewed by
certified attorneys.]

[{{client_has_warranty}}Warranty terms apply as described in Appendix A.]
```

### With Cross References

```markdown
[{{includeDetails}}For more information, see Section 5.2 of this document.]
```

## Operators and Expressions

### Supported Comparison Operators

| Operator | Description           | Example              |
| -------- | --------------------- | -------------------- |
| `==`     | Equal to              | `status == "active"` |
| `!=`     | Not equal to          | `type != "trial"`    |
| `>`      | Greater than          | `amount > 1000`      |
| `<`      | Less than             | `users < 50`         |
| `>=`     | Greater than or equal | `score >= 80`        |
| `<=`     | Less than or equal    | `age <= 65`          |

### Logical Operators

| Operator | Description | Example              |
| -------- | ----------- | -------------------- |
| `&&`     | Logical AND | `premium && active`  |
| `\|\|`   | Logical OR  | `trial \|\| premium` |

### Complex Expression Examples

#### Multiple AND Conditions

```markdown
{{#if premium && status == "active" && region == "US"}} Special terms for active
premium users in the United States. {{/if}}
```

#### Multiple OR Conditions

```markdown
[Discount applicable]{isStudent || isSenior || isVeteran}
```

#### Nested Conditions with Parentheses

```markdown
{{#if (premium || enterprise) && status == "active"}} Access to advanced
features enabled. {{/if}}
```

#### Numeric Comparisons

```markdown
[Volume discount applies]{quantity >= 100} for large orders.

{{#if amount > 10000}} Executive approval required for high-value contracts.
{{/if}}
```

## Advanced Use Cases

### Combining Multiple Syntaxes

You can use different syntaxes in the same document:

```markdown
l. **Terms and Conditions**

{{#if premium}} ll. **Premium Features** Premium users have access to advanced
features. {{/if}}

{{#standardWarranty}} ll. **Warranty** Standard warranty terms apply.
{{/standardWarranty}}

ll. **Additional Terms** [See Appendix A]{hasAppendix} for additional terms.

[{{showLegalNotice}}This document is legally binding.]
```

### Using Nested Variables (Dot Notation)

```markdown
{{#if client.subscription.isPremium}} **Premium Client Detected**

- Level: {{client.subscription.level}}
- Valid until: {{client.subscription.expiryDate}} {{/if}}
```

**Required metadata:**

```yaml
client:
  subscription:
    isPremium: true
    level: 'Gold'
    expiryDate: '2024-12-31'
```

### Conditions with Numeric Values

```markdown
[A {{discountPercent}}% discount will be applied]{amount >= 1000}
```

**Required metadata:**

```yaml
amount: 1500
discountPercent: 15
```

## Template Loops

### Basic Loop Syntax

```markdown
{{#items}} l. {{name}} - ${{price}} {{description}} {{/items}}
```

### Loop Context Variables

Within loops, special variables are available:

| Variable | Description              | Example                           |
| -------- | ------------------------ | --------------------------------- |
| `@index` | Current index (0-based)  | `Item #{{@index}}`                |
| `@first` | Is the first element     | `{{#if @first}}First item{{/if}}` |
| `@last`  | Is the last element      | `{{#if @last}}Last item{{/if}}`   |
| `@total` | Total number of elements | `{{@index}} of {{@total}}`        |

### Complete Loop Example

```markdown
**Service List:**

{{#services}} {{@index + 1}}. **{{name}}** - {{formatCurrency(price, currency)}}
{{description}} {{#if @last}}

_All prices include taxes_ {{/if}} {{/services}}
```

**Required metadata:**

```yaml
services:
  - name: 'Legal Consulting'
    price: 150
    currency: 'USD'
    description: 'General legal advice'
  - name: 'Contract Review'
    price: 200
    currency: 'USD'
    description: 'Detailed analysis of contractual documents'
```

### Nested Loops

```markdown
{{#departments}} l. **{{name}}**

{{#employees}}

- {{name}} ({{position}}) {{/employees}} {{/departments}}
```

## Best Practices

### 1. Syntax Selection

**Use {{#if condition}} when:**

- You need complex logic with operators
- You require an `else` clause
- The condition is long or complex

**Use {{#variable}} when:**

- Working with simple boolean variables
- You need automatic loops over arrays
- You want concise syntax

**Use [content]{condition} when:**

- The content is inline text
- You need multiple conditions in a paragraph
- You prefer compact syntax

**Use [{{condition}}content] when:**

- Migrating from previous versions of Legal Markdown
- Supporting legacy document formats

### 2. Metadata Organization

```yaml
# Group related variables
client:
  isPremium: true
  hasSupport: true
  region: 'US'

terms:
  includeWarranty: true
  includeStandardTerms: false
  showLegalNotice: true

services:
  - name: 'Service A'
    price: 100
  - name: 'Service B'
    price: 200
```

### 3. Descriptive Names

```markdown
# ✅ Good - descriptive names

{{#if includeWarrantyClause}}

# ❌ Bad - generic names

{{#if flag1}}
```

### 4. Comments in Metadata

```yaml
# Optional clauses configuration
includeWarrantyClause: true # Show warranty terms
showPremiumFeatures: false # Hide premium features
clientRegion: 'EU' # Determines applicable legislation
```

### 5. Error Handling

Invalid conditions or non-existent variables fail safely:

- False conditions or non-existent objects don't show content
- Malformed conditions include content by default (safe behavior)
- Missing variables show as unprocessed `{{variable}}`

### 6. Testing and Validation

Always verify that your conditions work correctly:

```bash
# Use debug mode to see condition evaluation
legal-md document.md --debug
```

## Integration with Other Features

### With Cross References

```markdown
{{#if includeReferences}} For more details, see |terms| and |conditions|.
{{/if}}
```

### With Helper Functions

```markdown
{{#if showDate}} Effective date: {{formatDate(@today, "MMMM Do, YYYY")}} {{/if}}
```

### With Header System

```markdown
{{#if includeSection}} l. Conditional Section

This content only appears when includeSection is true. {{/if}}
```

## Common Patterns

### Legal Document Clauses

```markdown
---
confidentiality_required: true
warranty_included: true
jurisdiction: 'California'
client_type: 'enterprise'
---

{{#if confidentiality_required}} l. **Confidentiality**

All information shared under this agreement is confidential. {{/if}}

{{#if warranty_included}} l. **Warranty**

[Extended warranty applies]{client_type == "enterprise"} to this agreement.
{{/if}}

[California law applies]{jurisdiction == "California"} to this agreement.
```

### Service Agreement Variations

```markdown
---
service_level: 'premium'
support_24x7: true
region: 'US'
---

l. **Service Level**

You will receive {{service_level}} service[, including 24/7
support]{support_24x7}.

{{#if service_level == "premium" && region == "US"}} ll. **Premium US Benefits**

- Priority phone support
- Dedicated account manager
- Same-day response guarantee {{/if}}
```

## See Also

- [YAML Frontmatter](yaml-frontmatter.md) - Defining variables for conditions
- [Variables & Mixins](mixins-variables.md) - Using variables in content
- [Template Loops](template-loops.md) - Advanced looping and iteration
- [Cross-References](cross-references.md) - Using references in conditional
  content
