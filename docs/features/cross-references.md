# Cross-References

Legal Markdown supports two types of cross-references for linking content within
documents and referencing variables from frontmatter.

## Table of Contents

- [Overview](#overview)
- [Internal Section References](#internal-section-references)
- [Variable References](#variable-references)
- [Automatic Cross-References Metadata](#automatic-cross-references-metadata)
- [Cross-References vs Mixins](#cross-references-vs-mixins)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)

## Overview

Legal Markdown uses two distinct syntaxes for different types of references:

| Syntax          | Purpose                     | Example          | Output                     |
| --------------- | --------------------------- | ---------------- | -------------------------- |
| `\|reference\|` | Internal section references | `\|payment\|`    | "Section 2. Payment Terms" |
| `{{variable}}`  | Variables and helpers       | `{{party_name}}` | "ACME Corporation"         |

## Internal Section References

Reference numbered sections within the same document using pipe syntax.

### Basic Syntax

```markdown
l. **Definitions** |definitions|

Terms defined in this agreement...

l. **Payment Terms** |payment|

As outlined in |definitions|, payment is due within 30 days.
```

**Output:**

```markdown
Article 1. **Definitions**

Terms defined in this agreement...

Article 2. **Payment Terms**

As outlined in Article 1., payment is due within 30 days.
```

### How Cross-References Work

1. **Section Markers**: Add `|key|` after any numbered section header
2. **References**: Use `|key|` anywhere in the document to reference that
   section
3. **Automatic Replacement**: References are replaced with the section's number
   and title

### Complex Document Structure

```markdown
l. **Terms and Conditions** |terms|

ll. **Payment Terms** |payment|

ll. **Delivery Terms** |delivery|

l. **Compliance** |compliance|

All obligations in |terms|, including |payment| and |delivery|, must comply with
|compliance| requirements.
```

**Output:**

```markdown
Article 1. **Terms and Conditions**

Section 1. **Payment Terms**

Section 2. **Delivery Terms**

Article 2. **Compliance**

All obligations in Article 1., including Section 1. and Section 2., must comply
with Article 2. requirements.
```

### Important Notes

- **Unique Keys**: Each reference key must be unique within the document
- **Case Sensitive**: Reference keys are case-sensitive
- **No Spaces**: Keys cannot contain spaces or special characters
- **Fallback**: If a reference key is not found as an internal section, the
  system falls back to metadata variables

## Variable References

Reference variables defined in YAML front matter using double-brace syntax.

### Basic Variable References

```yaml
---
client:
  name: Acme Corporation
  contact: John Smith
  email: john@acme.com
provider:
  name: Professional Services LLC
  address: 123 Service St
effective_date: 2024-01-01
payment_terms: 30
---
```

```markdown
This agreement is between |client.name| and |provider.name|.

The effective date is |effective_date|.

Payment terms are |payment_terms| days.
```

**Output:**

```markdown
This agreement is between Acme Corporation and Professional Services LLC.

The effective date is 2024-01-01.

Payment terms are 30 days.
```

### Nested Object References

```yaml
---
client:
  company:
    name: Acme Corporation
    type: enterprise
  contact:
    name: John Smith
    email: john@acme.com
    phone: '+1-555-0123'
---
```

```markdown
Company: |client.company.name| (|client.company.type|) Contact:
|client.contact.name| Email: |client.contact.email| Phone:
|client.contact.phone|
```

## Automatic Cross-References Metadata

When processing documents with internal cross-references, Legal Markdown
automatically generates a `_cross_references` field in the document metadata
containing all section references.

### Metadata Structure

Each cross-reference entry contains:

- `key`: The reference key used in the document
- `sectionNumber`: The formatted section number (e.g., "Article 1.")
- `sectionText`: The complete section text including number and title

### Example Metadata Output

For a document with cross-references:

```markdown
l. **Definitions** |definitions| l. **Payment Terms** |payment| l.
**Termination** |termination|
```

The generated metadata will be:

```yaml
_cross_references:
  - key: 'definitions'
    sectionNumber: 'Article 1.'
    sectionText: 'Article 1. **Definitions**'
  - key: 'payment'
    sectionNumber: 'Article 2.'
    sectionText: 'Article 2. **Payment Terms**'
  - key: 'termination'
    sectionNumber: 'Article 3.'
    sectionText: 'Article 3. **Termination**'
```

### Usage

This metadata is useful for:

- **Document analysis**: Understanding the structure and references in legal
  documents
- **Export integration**: Accessing cross-references data in YAML/JSON exports
- **External systems**: Integrating with document management or analysis tools
- **Validation**: Ensuring all references are properly defined and used

The `_cross_references` field is automatically included when exporting metadata
using `meta-yaml-output` or `meta-json-output` configuration options.

**Note:** The `_cross_references` field is a protected field that cannot be
overridden by imports.

## Cross-References vs Mixins

Understanding when to use each syntax:

### Internal Section References (|reference|)

Use for referencing numbered sections within the same document:

```markdown
l. **Definitions** |definitions| ll. **Software** |software| ll. **License**
|license|

l. **Grant of Rights** |grant|

The |software| and |license| terms defined in |definitions| apply to this
|grant|.
```

### Variable References ({{variable}})

Use for YAML frontmatter variables and helper functions:

```markdown
---
client_name: Acme Corporation
effective_date: 2024-01-01
license_fee: 5000
currency: USD
---

This agreement between {{titleCase(client_name)}} becomes effective on
{{formatDate(effective_date, "MMMM Do, YYYY")}}.

The license fee is {{formatCurrency(license_fee, currency)}}.
```

### Combined Usage

You can use both types in the same document:

```markdown
---
client_name: Acme Corporation
support_level: premium
---

l. **Service Terms** |service_terms|

{{titleCase(client_name)}} will receive {{support_level}} support as defined in
|service_terms|.
```

## Advanced Usage

### Conditional Cross-References

Use cross-references with conditional content:

```markdown
l. **Standard Terms** |standard| l. **Premium Terms** |premium|

{{#if isPremium}} Premium clients are subject to |premium|. {{else}} Standard
clients are subject to |standard|. {{/if}}
```

### Cross-References in Template Loops

```markdown
l. **Payment Schedule** |payment_schedule|

{{#invoices}} Invoice {{@index + 1}} follows the terms in |payment_schedule|.
{{/invoices}}
```

### Nested References

```markdown
l. **Terms** |terms| ll. **Payment** |payment| ll. **Delivery** |delivery|

l. **Compliance**

All aspects of |terms|, including both |payment| and |delivery|, must comply
with local regulations.
```

## Best Practices

### Naming Conventions

**Use descriptive, short keys:**

```markdown
# ✅ Good - clear and concise

l. **Definitions** |definitions| l. **Payment Terms** |payment| l. **Termination
Clause** |termination|

# ❌ Avoid - too long or unclear

l. **Definitions** |definitions_and_interpretations_section| l. **Payment
Terms** |pay| l. **Termination Clause** |term|
```

### Consistent Reference Style

**Be consistent with reference placement:**

```markdown
# ✅ Good - consistent placement

l. **Service Agreement** |service| ll. **Scope of Work** |scope| ll.
**Deliverables** |deliverables|

# ❌ Inconsistent - mixed placement

l. **Service Agreement** |service| ll. |scope| **Scope of Work** ll.
**Deliverables** |deliverables|
```

### Documentation

**Document complex reference relationships:**

```markdown
<!--
Reference Key Map:
- |definitions| → Article 1. Definitions
- |payment| → Section 2. Payment Terms
- |termination| → Article 5. Termination
- |compliance| → Section 8. Compliance Requirements
-->

l. **Definitions** |definitions|
```

### Validation

**Always verify references exist:**

```markdown
# Before referencing, ensure the section exists

l. **Payment Terms** |payment|

# Later in document

As specified in |payment|, invoices are due within 30 days.
```

### Combining with Variables

**Use both systems effectively:**

```markdown
---
client_name: Acme Corporation
payment_days: 30
---

l. **Payment Terms** |payment|

{{titleCase(client_name)}} agrees to the |payment| requiring payment within
{{payment_days}} days.
```

## Common Patterns

### Legal Contract Structure

```markdown
---
party_a: Legal Services Inc.
party_b: Acme Corporation
effective_date: 2024-01-01
---

l. **Parties** |parties|

This agreement is between {{party_a}} and {{party_b}}.

l. **Terms** |terms| ll. **Payment** |payment| ll. **Delivery** |delivery|

l. **Compliance** |compliance|

All |parties| must comply with |terms|, including |payment| and |delivery|
requirements as outlined in |compliance|.

This agreement becomes effective
{{formatDate(effective_date, "MMMM Do, YYYY")}}.
```

### Policy Document References

```markdown
l. **Employee Handbook** |handbook| ll. **Code of Conduct** |conduct| ll.
**Safety Policies** |safety| ll. **Privacy Guidelines** |privacy|

l. **Enforcement** |enforcement|

Violations of |conduct|, |safety|, or |privacy| as defined in |handbook| will be
subject to |enforcement| procedures.
```

## Troubleshooting

### Reference Not Found

**Problem**: Reference appears as `|undefined_reference|` in output.
**Solution**: Verify the section marker exists and keys match exactly.

### Circular References

**Problem**: References that depend on each other. **Solution**: Restructure
document to avoid circular dependencies.

### Case Sensitivity Issues

**Problem**: `|Payment|` doesn't match `|payment|`. **Solution**: Use consistent
casing for all reference keys.

## See Also

- [Headers & Numbering](headers-numbering.md) - Creating numbered sections to
  reference
- [Variables & Mixins](mixins-variables.md) - Using {{variable}} syntax
- [YAML Frontmatter](yaml-frontmatter.md) - Defining variables for reference
- [Optional Clauses](optional-clauses.md) - Using references in conditional
  content
