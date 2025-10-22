# Conditional Logic in Legal Markdown

Legal Markdown supports powerful conditional logic using Handlebars-style syntax
with **enhanced expression evaluation**.

## Table of Contents

- [Overview](#overview)
- [Basic Conditionals](#basic-conditionals)
- [Comparison Operators](#comparison-operators)
- [Boolean Operators](#boolean-operators)
- [Value Types](#value-types)
- [Else Branches](#else-branches)
- [Nested Conditionals](#nested-conditionals)
- [Unless (Negative Conditional)](#unless-negative-conditional)
- [Array Iteration with Conditionals](#array-iteration-with-conditionals)
- [Best Practices](#best-practices)
- [Comparison with Other Template Engines](#comparison-with-other-template-engines)
- [Technical Details](#technical-details)

## Overview

Legal Markdown supports full conditional expressions with comparison and boolean
operators, making it **more powerful than Handlebars** (which requires helper
functions) and on par with Liquid templates.

**Key Features:**

- ✅ Comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`
- ✅ Boolean operators: `&&`, `||`
- ✅ Nested expressions with parentheses
- ✅ Multiple value types: strings, numbers, booleans, null
- ✅ Dot notation for nested objects
- ✅ Else branches for alternative content

## Basic Conditionals

### Simple Truthiness Check

Check if a variable exists and is truthy:

```yaml
---
includeWarranty: true
---
```

```markdown
{{#if includeWarranty}}

## Warranty Clause

This product includes a warranty... {{/if}}
```

### Variable Existence

Check if an object property exists:

```yaml
---
client:
  name: 'Acme Corp'
---
```

```markdown
{{#if client.name}} Client: {{client.name}} {{/if}}
```

## Comparison Operators

Legal Markdown supports full comparison expressions (unlike Handlebars which
requires helper functions).

### Equality Comparison

Use `==` for loose equality checks:

```yaml
---
contract:
  type: 'service'
---
```

```markdown
{{#if contract.type == "service"}}

## Service Agreement Terms

This is a service agreement... {{else}}

## Product Sale Terms

This is a product sale... {{/if}}
```

### Numeric Comparisons

Compare numeric values with `>`, `<`, `>=`, `<=`:

```yaml
---
contract:
  amount: 50000
  jurisdiction: 'spain'
---
```

```markdown
{{#if contract.amount > 10000}} **High Value Contract** - Special terms apply
{{/if}}

{{#if contract.amount >= 100000}} Board approval required {{/if}}
```

### Not Equal

Use `!=` to check inequality:

```yaml
---
status: 'active'
---
```

```markdown
{{#if status != "cancelled"}} This contract is active {{/if}}
```

## Boolean Operators

Combine multiple conditions using `&&` (AND) and `||` (OR).

### AND Operator

Both conditions must be true:

```yaml
---
contract:
  amount: 50000
  jurisdiction: 'spain'
  type: 'service'
---
```

```markdown
{{#if contract.amount > 10000 && contract.jurisdiction == "spain"}}

## Spanish High-Value Contract Provisions

Special provisions for Spanish contracts over €10,000... {{/if}}
```

### OR Operator

At least one condition must be true:

```yaml
---
jurisdiction: 'madrid'
---
```

```markdown
{{#if jurisdiction == "madrid" || jurisdiction == "barcelona"}} Applicable law:
Spanish Civil Code {{/if}}
```

### Complex Expressions

Combine AND/OR with parentheses for grouping:

```yaml
---
amount: 75000
type: 'service'
vip: false
jurisdiction: 'spain'
---
```

```markdown
{{#if (amount > 50000 && type == "service") || vip == true}} VIP service terms
apply {{/if}}
```

### Operator Precedence

- **AND (`&&`)** has higher precedence than OR (`||`)
- Use parentheses to control evaluation order

```markdown
<!-- AND is evaluated first --> {{#if premium && active || trial}} Content

{{/if}}

<!-- Equivalent to: (premium && active) || trial -->

<!-- Use parentheses to change order --> {{#if premium && (active || trial)}}

Content {{/if}}
```

## Value Types

Legal Markdown correctly handles different value types in comparisons:

### Strings

Compare strings using quotes:

```yaml
---
city: 'madrid'
---
```

```markdown
{{#if city == "madrid"}} Madrid-specific clause {{/if}}
```

### Numbers

Compare numbers without quotes:

```yaml
---
amount: 15000
---
```

```markdown
{{#if amount > 1000}} High-value contract {{/if}}

{{#if amount >= 10000 && amount < 50000}} Mid-tier pricing applies {{/if}}
```

### Booleans

Use boolean values directly:

```yaml
---
active: true
premium: false
---
```

```markdown
{{#if active == true}} Active account {{/if}}

{{#if active}} Active account {{/if}}

<!-- Same as above -->

{{#if premium == false}} Standard features only {{/if}}
```

### Null/Undefined

Check for null or missing values:

```yaml
---
description: null
---
```

```markdown
{{#if description == null}} No description provided {{/if}}
```

## Else Branches

Provide alternative content when a condition is false:

```yaml
---
contract:
  type: 'service'
---
```

```markdown
{{#if contract.type == "service"}} Service agreement clauses {{else}} Standard
sale clauses {{/if}}
```

### Chained If-Else

While Legal Markdown doesn't have `else if`, you can nest conditions:

```markdown
{{#if tier == "premium"}} Premium features {{else}} {{#if tier == "standard"}}
Standard features {{else}} Basic features {{/if}} {{/if}}
```

## Nested Conditionals

Conditions can be nested for complex logic:

```yaml
---
contract:
  jurisdiction: 'spain'
  amount: 50000
---
```

```markdown
{{#if contract.jurisdiction == "spain"}} Spanish law applies

{{#if contract.amount > 10000}} High-value Spanish contract addendum {{/if}}
{{else}} {{#if contract.jurisdiction == "portugal"}} Portuguese law applies
{{/if}} {{/if}}
```

## Unless (Negative Conditional)

Use `unless` to show content when a condition is false:

```yaml
---
contract:
  expired: false
---
```

```markdown
{{#unless contract.expired}} This contract is still active {{/unless}}
```

Equivalent to:

```markdown
{{#if contract.expired == false}} This contract is still active {{/if}}
```

## Array Iteration with Conditionals

Combine conditionals with array iteration:

```yaml
---
parties:
  - name: 'Acme Corp'
    role: 'client'
    vip: true
  - name: 'Tech Solutions'
    role: 'contractor'
    vip: false
---
```

```markdown
{{#parties}}

- **{{name}}** {{#if role == "client"}} (Client - invoicing entity) {{else}}
  (Contractor - service provider) {{/if}} {{#if vip}} **VIP Client** - Priority
  support {{/if}} {{/parties}}
```

**Output:**

```markdown
- **Acme Corp** (Client - invoicing entity) **VIP Client** - Priority support

- **Tech Solutions** (Contractor - service provider)
```

## Best Practices

### 1. Pre-compute Complex Logic

For very complex conditions, consider pre-computing boolean values in metadata:

```yaml
---
contract:
  amount: 50000
  jurisdiction: 'spain'

# Pre-computed
isHighValueSpanishContract: true
---
```

```markdown
{{#if isHighValueSpanishContract}} Special provisions... {{/if}}
```

**Advantages:**

- More readable templates
- Easier to test business logic
- Reusable across multiple conditions

### 2. Use Descriptive Variable Names

```yaml
# Good
{{#if requiresBoardApproval}} Executive approval needed {{/if}}

# Less clear
{{#if amount > 100000 && type == "acquisition"}} Executive approval needed
{{/if}}
```

### 3. Keep Expressions Readable

Break complex conditions into nested ifs when appropriate:

```markdown
<!-- Instead of this -->

{{#if type == "service" && (jurisdiction == "spain" || jurisdiction ==
"portugal") && amount > 10000}} Content {{/if}}

<!-- Consider this -->

{{#if type == "service"}} {{#if jurisdiction == "spain" || jurisdiction ==
"portugal"}} {{#if amount > 10000}} Content {{/if}} {{/if}} {{/if}}
```

### 4. Comment Complex Conditions

Add comments in YAML or markdown to explain complex logic:

```yaml
---
# High-value contracts in EU require additional approvals
requiresExecutiveApproval: true # Based on amount > 100000 && region == "EU"
---
```

### 5. Test Edge Cases

Test your conditions with various values:

```yaml
# Test with:
# - Empty strings
# - Zero values
# - Null/undefined
# - Boundary values (e.g., exactly 10000)
amount: 0 # Will this work as expected?
status: '' # Is empty string falsy?
```

## Comparison with Other Template Engines

Legal Markdown has **more powerful conditionals** than Handlebars:

| Feature           | Handlebars                      | Liquid                | Legal Markdown      |
| ----------------- | ------------------------------- | --------------------- | ------------------- |
| Simple truthiness | ✅ `{{#if var}}`                | ✅ `{% if var %}`     | ✅ `{{#if var}}`    |
| Comparisons       | ❌ Requires `{{#if (eq a b)}}`  | ✅ `{% if a == b %}`  | ✅ `{{#if a == b}}` |
| Numeric           | ❌ Requires `{{#if (gt a 10)}}` | ✅ `{% if a > 10 %}`  | ✅ `{{#if a > 10}}` |
| Boolean logic     | ❌ Requires `{{#if (and a b)}}` | ✅ `{% if a and b %}` | ✅ `{{#if a && b}}` |
| Else branches     | ✅ `{{else}}`                   | ✅ `{% else %}`       | ✅ `{{else}}`       |
| Unless            | ✅ `{{#unless}}`                | ✅ `{% unless %}`     | ✅ `{{#unless}}`    |

**Why this matters:**

- **No helper functions needed** - Direct comparison syntax is more readable
- **Familiar syntax** - Similar to JavaScript, easier for developers
- **Less verbose** - Compare `{{#if a == b}}` vs `{{#if (eq a b)}}`

## Technical Details

### Processing Order

Conditional evaluation happens in **Phase 3** of the processing pipeline, after
variable expansion:

1. **Phase 1**: Context Building (parse YAML, merge options)
2. **Phase 2**: Variable Expansion (`{{variable}}` → actual values)
3. **Phase 3**: Conditional Evaluation (`{{#if}}` blocks)
4. **Phase 4**: Structure Parsing (headers, cross-references)

This ensures that conditionals evaluate against **expanded values**, not raw
`{{variable}}` syntax. (Fixes Issue #120)

### Implementation

Conditional evaluation happens in `src/extensions/template-loops.ts`:

**Main functions:**

- `evaluateCondition()` - Entry point, delegates to specialized evaluators
- `evaluateBooleanExpression()` - Handles `&&` and `||` operators
- `evaluateComparisonExpression()` - Handles `==`, `!=`, `>`, `<`, `>=`, `<=`
- `parseComparisonValue()` - Parses string/number/boolean literals and variables
- `resolveVariablePath()` - Resolves nested object paths (e.g., `client.name`)

**Evaluation logic:**

```typescript
function evaluateCondition(condition: string, metadata: Record<string, any>): boolean {
  // 1. Check for boolean operators
  if (condition.includes('&&') || condition.includes('||')) {
    return evaluateBooleanExpression(condition, metadata);
  }

  // 2. Check for comparison operators
  if (condition.includes('==') || condition.includes('!=') || ...) {
    return evaluateComparisonExpression(condition, metadata);
  }

  // 3. Fallback to truthiness check
  const value = resolveVariablePath(condition, metadata);
  return isTruthy(value);
}
```

### Performance

Expression evaluation adds minimal overhead:

- Simple variable check: < 0.1ms
- Comparison expression: < 0.5ms
- Complex boolean expression: < 1ms

No significant impact on document processing time.

## Common Patterns

### Legal Document Clauses

```yaml
---
confidentiality_required: true
jurisdiction: 'California'
contract_value: 75000
client_type: 'enterprise'
---
```

```markdown
{{#if confidentiality_required}}

## Confidentiality

All information is confidential. {{/if}}

{{#if contract_value > 50000 && client_type == "enterprise"}}

## Enterprise High-Value Terms

Special provisions for enterprise contracts over $50,000. {{/if}}

{{#if jurisdiction == "California"}} This agreement is governed by California
law. {{/if}}
```

### Service Level Variations

```yaml
---
service_tier: 'premium'
region: 'US'
active_subscription: true
---
```

```markdown
{{#if service_tier == "premium" && active_subscription}}

## Premium Service Features

- 24/7 priority support
- Dedicated account manager
- 99.9% uptime SLA

{{#if region == "US"}}

### US-Specific Benefits

- Toll-free phone support
- Business hours: All US time zones {{/if}} {{/if}}
```

### Contract Pricing Tiers

```yaml
---
contract:
  amount: 25000
  duration: 12
  region: 'EU'
---
```

```markdown
{{#if contract.amount < 10000}} Standard pricing tier {{else}} {{#if
contract.amount >= 10000 && contract.amount < 50000}} Mid-tier pricing {{else}}
Enterprise pricing {{/if}} {{/if}}

{{#if contract.duration >= 12 && contract.amount > 10000}} Annual discount
applied {{/if}}

{{#if contract.region == "EU" && contract.amount > 15000}} VAT calculation
required {{/if}}
```

## Related

- [Optional Clauses](./optional-clauses.md) - Alternative conditional syntaxes
- [Variables & Mixins](./mixins-variables.md) - Variable substitution basics
- [YAML Frontmatter](./yaml-frontmatter.md) - Defining variables for conditions
- [Helper Functions](../helpers/README.md) - Date, number, and string formatting
