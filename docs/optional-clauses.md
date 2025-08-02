# Complete Guide to Optional Clauses in Legal Markdown JS

This guide documents all available ways to generate optional clauses in Legal Markdown JS,
providing practical examples and use cases for each syntax.

## Table of Contents

1. [Supported Syntaxes](#supported-syntaxes)
2. [Conditional Syntax {{#if}}](#conditional-syntax-if)
3. [Simple Syntax {{#variable}}](#simple-syntax-variable)
4. [Bracket Syntax [content]{condition}](#bracket-syntax-contentcondition)
5. [Original Legal Markdown [{{condition}}content]](#original-legal-markdown-conditioncontent)
6. [Operators and Expressions](#operators-and-expressions)
7. [Advanced Use Cases](#advanced-use-cases)
8. [Array Loops](#array-loops)
9. [Best Practices](#best-practices)

## Supported Syntaxes

Legal Markdown JS supports **4 different syntaxes** for generating optional clauses, each with
its own advantages and specific use cases:

| Syntax                      | Format                              | Advantages                  | Use Cases                        |
| --------------------------- | ----------------------------------- | --------------------------- | -------------------------------- |
| **Conditional {{#if}}**     | `{{#if condition}}content{{/if}}`   | More readable, else support | Complex conditions               |
| **Simple {{#variable}}**    | `{{#variable}}content{{/variable}}` | Concise, automatic loops    | Simple boolean variables         |
| **Modern brackets**         | `[content]{condition}`              | Compact, natural            | Inline text, expressions         |
| **Original Legal Markdown** | `[{{condition}}content]`            | Legacy compatible           | Migration from previous versions |

## Conditional Syntax {{#if}}

### Basic Format

```markdown
{{#if condition}}
Content to show if the condition is true
{{/if}}
```

### With Else Clause

```markdown
{{#if premium}}
Premium features enabled
{{else}}
Using basic version
{{/if}}
```

### Practical Examples

#### Simple Conditions

```markdown
{{#if includeWarranty}}
**Warranty**: This warranty covers manufacturing defects for a period of 12 months.
{{/if}}
```

**Required metadata:**

```yaml
includeWarranty: true
```

#### Conditions with Comparison

```markdown
{{#if status == "active"}}
Your account is active and you can access all services.
{{else}}
Your account is suspended. Contact support to reactivate.
{{/if}}
```

**Required metadata:**

```yaml
status: "active"
```

#### Complex Conditions with Logical Operators

```markdown
{{#if premium && jurisdiction == "US"}}
Special terms for premium users in the United States:
- 24/7 phone support
- Extended 24-month warranty
{{/if}}
```

**Required metadata:**

```yaml
premium: true
jurisdiction: "US"
```

## Simple Syntax {{#variable}}

### Format

```markdown
{{#variable}}
Content to show if variable is true
{{/variable}}
```

### Practical Examples

#### Boolean Variables

```markdown
{{#includeStandardTerms}}
l. **Standard Terms**

The company's standard terms and conditions apply.
{{/includeStandardTerms}}
```

**Required metadata:**

```yaml
includeStandardTerms: true
```

#### Variables with Underscores

```markdown
{{#client_has_premium}}
ll. **Premium Services**

As a premium client, you have access to:
- Priority support
- Advanced features
- Exclusive discounts
{{/client_has_premium}}
```

**Required metadata:**

```yaml
client_has_premium: true
```

#### Automatic Array Detection (Loops)

```markdown
{{#services}}
- {{name}}: ${{price}} {{currency}}
{{/services}}
```

**Required metadata:**

```yaml
services:
  - name: "Legal Consulting"
    price: 150
    currency: "USD"
  - name: "Contract Review"
    price: 200
    currency: "USD"
```

**Result:**

```
- Legal Consulting: $150 USD
- Contract Review: $200 USD
```

## Bracket Syntax [content]{condition}

### Format

```markdown
[Conditional content]{condition}
```

### Practical Examples

#### Simple Inline Text

```markdown
The client [will receive a 10% discount]{isLoyalCustomer} on future purchases.
```

**Required metadata:**

```yaml
isLoyalCustomer: true
```

#### Conditions with Complex Expressions

```markdown
[Special terms will apply]{premium && region == "EU"} according to European legislation.
```

**Required metadata:**

```yaml
premium: true
region: "EU"
```

#### Multiple Conditions in the Same Paragraph

```markdown
Services include: basic consulting[, phone support]{hasPhoneSupport}[, and access to premium resources]{isPremiumClient}.
```

**Required metadata:**

```yaml
hasPhoneSupport: true
isPremiumClient: false
```

**Result:**

```
Services include: basic consulting, phone support.
```

## Original Legal Markdown [{{condition}}content]

### Format

```markdown
[{{condition}}content to show]
```

### Practical Examples

#### Compatibility with Legacy Documents

```markdown
[{{showLegalNotice}}This document is legally binding and has been reviewed by certified attorneys.]
```

**Required metadata:**

```yaml
showLegalNotice: true
```

#### Variables with Underscores

```markdown
[{{client_has_warranty}}Warranty terms apply as described in Appendix A.]
```

**Required metadata:**

```yaml
client_has_warranty: true
```

#### Content with Cross References

```markdown
[{{includeDetails}}For more information, see Section 5.2 of this document.]
```

**Required metadata:**

```yaml
includeDetails: true
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
{{#if premium && status == "active" && region == "US"}}
Special terms for active premium users in the United States.
{{/if}}
```

#### Multiple OR Conditions

```markdown
[Discount applicable]{isStudent || isSenior || isVeteran}
```

#### Nested Conditions with Parentheses

```markdown
{{#if (premium || enterprise) && status == "active"}}
Access to advanced features enabled.
{{/if}}
```

## Advanced Use Cases

### Combining Multiple Syntaxes

It's possible to use different syntaxes in the same document:

```markdown
l. **Terms and Conditions**

{{#if premium}}
ll. **Premium Features**
Premium users have access to advanced features.
{{/if}}

{{#standardWarranty}}
ll. **Warranty**
Standard warranty terms apply.
{{/standardWarranty}}

ll. **Additional Terms**
[See Appendix A]{hasAppendix} for additional terms.

[{{showLegalNotice}}This document is legally binding.]
```

### Using Nested Variables (Dot Notation)

```markdown
{{#if client.subscription.isPremium}}
**Premium Client Detected**
- Level: {{client.subscription.level}}
- Valid until: {{client.subscription.expiryDate}}
{{/if}}
```

**Required metadata:**

```yaml
client:
  subscription:
    isPremium: true
    level: "Gold"
    expiryDate: "2024-12-31"
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

## Array Loops

### Basic Loop Syntax

```markdown
{{#items}}
l. {{name}} - ${{price}}
{{description}}
{{/items}}
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

{{#services}}
{{@index}}. **{{name}}** - ${{price}} {{currency}}
   {{description}}
   {{#if @last}}

   *All prices include taxes*
   {{/if}}
{{/services}}
```

**Required metadata:**

```yaml
services:
  - name: "Legal Consulting"
    price: 150
    currency: "USD"
    description: "General legal advice"
  - name: "Contract Review"
    price: 200
    currency: "USD"
    description: "Detailed analysis of contractual documents"
```

### Nested Loops

```markdown
{{#departments}}
l. **{{name}}**

{{#employees}}
   - {{name}} ({{position}})
{{/employees}}
{{/departments}}
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
- Maintaining compatibility with legacy documents

### 2. Metadata Organization

```yaml
# Group related variables
client:
  isPremium: true
  hasSupport: true
  region: "US"

terms:
  includeWarranty: true
  includeStandardTerms: false
  showLegalNotice: true

services:
  - name: "Service A"
    price: 100
  - name: "Service B"
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
includeWarrantyClause: true    # Show warranty terms
showPremiumFeatures: false     # Hide premium features
clientRegion: "EU"             # Determines applicable legislation
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
npx legal-markdown process document.md --debug
```

## Integration with Other Features

### With Cross References

```markdown
{{#if includeReferences}}
For more details, see |terms| and |conditions|.
{{/if}}
```

### With Helper Functions

```markdown
{{#if showDate}}
Effective date: {{formatDate(@today, "long")}}
{{/if}}
```

### With Header System

```markdown
{{#if includeSection}}
l. Conditional Section

This content only appears when includeSection is true.
{{/if}}
```

---

This documentation covers all available ways to generate optional clauses in Legal Markdown JS.
For additional examples and specific use cases, see the unit tests in
`tests/unit/plugins/remark/clause-syntaxes.test.ts` and
`tests/unit/plugins/remark/clauses.unit.test.ts`.
