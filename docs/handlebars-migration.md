# Handlebars Migration Guide

## Overview

Legal Markdown now supports **Handlebars template syntax** as the standard,
while maintaining backward compatibility with the legacy custom syntax. This
guide will help you migrate your templates to the modern Handlebars standard.

## Why Migrate?

### Benefits of Handlebars Syntax

- ✅ **Industry Standard**: Handlebars is used by millions of developers
  worldwide
- ✅ **Bug Fixes**: Nested conditionals, loop context, and subexpressions work
  correctly
- ✅ **Better Ecosystem**: VS Code extensions, syntax highlighting, and linters
- ✅ **Future-Proof**: Legacy syntax will be removed in v4.0.0
- ✅ **More Features**: Subexpressions, parent context access (`{{../parent}}`),
  and more

### Bugs Fixed Automatically

1. **Nested Conditionals**: Now work correctly

   ```handlebars
   {{#if isPremium}}
     {{#if hasDiscount}}
       Special discount applied!
     {{/if}}
   {{/if}}
   ```

2. **Loop Context**: Variables properly inherit from parent scopes
3. **Array Iteration**: `{{this}}` works in loops
4. **Subexpressions**: Chain helper functions
   ```handlebars
   {{formatDate (addYears startDate 2) 'legal'}}
   ```

---

## Syntax Comparison

### Helper Function Calls

| Legacy (Deprecated)                 | Handlebars (Recommended)          |
| ----------------------------------- | --------------------------------- |
| `{{formatDate(@today, "long")}}`    | `{{formatDate @today "long"}}`    |
| `{{addYears(startDate, 2)}}`        | `{{addYears startDate 2}}`        |
| `{{formatCurrency(amount, "USD")}}` | `{{formatCurrency amount "USD"}}` |
| `{{capitalize(title)}}`             | `{{capitalize title}}`            |

**Key Change**: Remove parentheses `()` and commas `,` from helper calls.

### Mathematical Expressions

| Legacy (Deprecated)     | Handlebars (Recommended)       |
| ----------------------- | ------------------------------ |
| `{{price * quantity}}`  | `{{multiply price quantity}}`  |
| `{{total + tax}}`       | `{{add total tax}}`            |
| `{{amount - discount}}` | `{{subtract amount discount}}` |
| `{{price / 2}}`         | `{{divide price 2}}`           |

**Available Math Helpers**: `multiply`, `divide`, `add`, `subtract`

### String Concatenation

| Legacy (Deprecated)              | Handlebars (Recommended)            |
| -------------------------------- | ----------------------------------- |
| `{{"$" + price}}`                | `{{concat "$" price}}`              |
| `{{firstName + " " + lastName}}` | `{{concat firstName " " lastName}}` |

**Helper**: `concat` - joins all arguments together

### Loops

| Legacy (Compatible)       | Handlebars (Recommended)      |
| ------------------------- | ----------------------------- |
| `{{#items}}...{{/items}}` | `{{#each items}}...{{/each}}` |

Both syntaxes work, but `{{#each}}` is the Handlebars standard.

### Conditionals

Both syntaxes are compatible:

```handlebars
{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}
```

### Variables

Simple variable substitution works the same in both:

```handlebars
{{variable}}
{{client.name}}
{{client.contact.email}}
```

---

## New Features (Handlebars Only)

### 1. Subexpressions

Chain helper functions together:

```handlebars
{{formatDate (addYears @today 2) 'legal'}}
```

Output: `January 15, 2027`

**Legacy Equivalent**: Not possible - requires intermediate steps

### 2. Parent Context Access

Access variables from outer scopes:

```handlebars
{{#each departments}}
  {{name}} department at {{../company}}:
  {{#each employees}}
    - {{this}} (works for {{../../company}})
  {{/each}}
{{/each}}
```

### 3. Loop Variables

Standard Handlebars loop variables:

```handlebars
{{#each items}}
  {{@index}}
  -
  {{name}}
  {{#if @first}}(First item){{/if}}
  {{#if @last}}(Last item){{/if}}
{{/each}}
```

---

## ISO Date Support

**NEW**: You can now use ISO date strings directly in YAML frontmatter:

```yaml
---
startDate: 2025-01-15 # ← Automatically parsed as Date object
endDate: 2027-12-31
---
Contract expires: { { formatDate (addYears startDate 2) "legal" } }
```

**Before** (still works):

```yaml
---
startDate: @today
---
```

---

## Migration Steps

### Step 1: Identify Legacy Syntax

When you process a document with legacy syntax, you'll see detailed migration
hints:

```
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  DEPRECATED: Legacy Template Syntax Detected                           ║
╚════════════════════════════════════════════════════════════════════════════╝

Found 3 legacy syntax pattern(s) that should be migrated to Handlebars:

1. Line 15:
   ❌ Legacy:     {{formatDate(@today, "long")}}
   ✅ Handlebars: {{formatDate @today "long"}}

2. Line 23:
   ❌ Legacy:     {{price * quantity}}
   ✅ Handlebars: {{multiply price quantity}}

3. Line 31:
   ❌ Legacy:     {{"$" + total}}
   ✅ Handlebars: {{concat "$" total}}
```

### Step 2: Update Templates

Use the suggestions from the migration hints to update your templates:

**Before**:

```markdown
---
price: 100
quantity: 5
tax: 0.08
---

Total: ${{(price * quantity) * (1 + tax)}}
```

**After**:

```markdown
---
price: 100
quantity: 5
tax: 0.08
---

Total: ${{multiply (multiply price quantity) (add 1 tax)}}
```

Or better yet, calculate in metadata:

```yaml
---
price: 100
quantity: 5
tax: 0.08
subtotal: 500 # price * quantity
total: 540 # subtotal * 1.08
---
Total: { { formatCurrency total "USD" } }
```

### Step 3: Test Your Changes

Run your document through legal-markdown and verify:

- ✅ No deprecation warnings
- ✅ Output is correct
- ✅ All fields are properly substituted

### Step 4: Use Modern Features

Take advantage of Handlebars features:

```handlebars
{{! Use subexpressions }}
Expiration: {{formatDate (addYears startDate 5) "legal"}}

{{! Access parent context }}
{{#each departments}}
  {{name}} - Company: {{../companyName}}
{{/each}}

{{! Use standard loop helpers }}
{{#each items}}
  {{@index}}. {{name}}{{#unless @last}},{{/unless}}
{{/each}}
```

---

## Common Migration Patterns

### Pattern 1: Date Arithmetic

**Legacy**:

```markdown
{{formatDate(addYears(@today, 2), "legal")}}
```

**Handlebars**:

```markdown
{{formatDate (addYears @today 2) "legal"}}
```

### Pattern 2: Currency Formatting

**Legacy**:

```markdown
Amount: {{formatCurrency(total, "USD")}}
```

**Handlebars**:

```markdown
Amount: {{formatCurrency total "USD"}}
```

### Pattern 3: Calculated Values

**Legacy**:

```markdown
Total: {{price * quantity}} Tax: {{(price * quantity) * 0.08}}
```

**Handlebars**:

```markdown
Total: {{multiply price quantity}} Tax:
{{multiply (multiply price quantity) 0.08}}
```

**Better Approach** - Calculate in frontmatter:

```yaml
---
price: 100
quantity: 5
total: 500
tax: 40
grandTotal: 540
---
Total: { { total } }
Tax: { { tax } }
Grand Total: { { grandTotal } }
```

### Pattern 4: Conditional Formatting

**Legacy**:

```markdown
Status: {{isPremium ? "Premium Member" : "Standard Member"}}
```

**Handlebars**:

```markdown
Status: {{#if isPremium}}Premium Member{{else}}Standard Member{{/if}}
```

---

## Automated Migration (Coming Soon)

We're working on an automated migration tool:

```bash
legal-md convert --to-handlebars input.md output.md
```

This will automatically convert legacy syntax to Handlebars.

---

## Timeline

- **v3.5.0** (Current): Dual syntax support with deprecation warnings
- **v3.x.x**: Migration tools and utilities
- **v4.0.0**: Legacy syntax removed (Handlebars only)

---

## FAQ

### Q: Will my existing templates break?

**A**: No! Legacy syntax continues to work with deprecation warnings. You have
until v4.0.0 to migrate.

### Q: Can I mix both syntaxes?

**A**: No. If you mix syntaxes, you'll get an error and the document will be
processed with legacy mode. Use one syntax consistently.

### Q: How do I disable deprecation warnings during migration?

**A**: Warnings help you identify what needs to be migrated. We recommend
addressing them rather than hiding them.

### Q: What if I have many templates to migrate?

**A**: Start with new templates using Handlebars syntax. Migrate existing
templates gradually. Use the automated tool when it's released.

### Q: Do all Handlebars features work?

**A**: We support the core Handlebars features needed for legal document
templates. Some advanced features may not be available.

---

## Getting Help

- **Documentation**: https://github.com/petalo/legal-markdown-js
- **Issues**: https://github.com/petalo/legal-markdown-js/issues
- **Examples**: See `examples/` directory for Handlebars templates

---

## Quick Reference Card

```handlebars
{{! Variables }}
{{variable}}
{{nested.property}}

{{! Helpers }}
{{helperName arg1 arg2}}
{{formatDate date "YYYY-MM-DD"}}

{{! Math }}
{{multiply a b}}
{{add a b}}
{{subtract a b}}
{{divide a b}}

{{! String }}
{{concat str1 str2 str3}}
{{capitalize text}}
{{upper text}}

{{! Conditionals }}
{{#if condition}}...{{else}}...{{/if}}

{{! Loops }}
{{#each array}}
  {{@index}}: {{this}}
{{/each}}

{{! Subexpressions }}
{{helper1 (helper2 arg1) arg2}}

{{! Parent access }}
{{#each items}}
  {{../parentVariable}}
{{/each}}

{{! Comments }}
{{! This is a comment }}
```

---

**Remember**: Migrate at your own pace, but don't delay too long - legacy syntax
will be removed in v4.0.0!
