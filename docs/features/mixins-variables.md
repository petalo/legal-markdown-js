# Variables and Mixins System

The mixins system allows template substitution using `{{variable}}` syntax with
advanced features for nested objects, arrays, and conditional logic.

## Table of Contents

- [Basic Variable Substitution](#basic-variable-substitution)
- [Nested Object Access](#nested-object-access)
- [Array Access](#array-access)
- [Conditional Mixins](#conditional-mixins)
- [Helper Functions Integration](#helper-functions-integration)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

## Basic Variable Substitution

Replace variables from YAML frontmatter using double-brace syntax:

### Simple Variables

```yaml
---
title: Software License Agreement
client_name: Acme Corp
license_fee: 5000
currency: USD
payment_terms: 30
---
```

```markdown
# {{title}}

This agreement is with {{client_name}}. The license fee is
{{formatCurrency(license_fee, currency)}}.

Payment is due within {{payment_terms}} days.
```

**Output:**

```markdown
# Software License Agreement

This agreement is with Acme Corp. The license fee is $5,000.00.

Payment is due within 30 days.
```

### String Variables

```yaml
---
company_name: 'Legal Services Inc.'
document_type: 'Service Agreement'
version: '2.1'
status: 'draft'
---
```

```markdown
**{{document_type}}** (Version {{version}}) **Status:** {{upper(status)}}
**Prepared by:** {{company_name}}
```

**Output:**

```markdown
**Service Agreement** (Version 2.1) **Status:** DRAFT **Prepared by:** Legal
Services Inc.
```

## Nested Object Access

Access deeply nested properties using dot notation:

### Basic Nested Objects

```yaml
---
client:
  company:
    name: Acme Corporation
    address:
      street: 123 Business St
      city: San Francisco
      state: CA
      zip: '94105'
  contact:
    name: John Smith
    email: john@acme.com
    phone: '+1-555-0123'
---
```

```markdown
**Company:** {{client.company.name}} **Address:**
{{client.company.address.street}}, {{client.company.address.city}},
{{client.company.address.state}} {{client.company.address.zip}} **Contact:**
{{client.contact.name}} ({{client.contact.email}}) **Phone:**
{{client.contact.phone}}
```

**Output:**

```markdown
**Company:** Acme Corporation **Address:** 123 Business St, San Francisco, CA
94105 **Contact:** John Smith (john@acme.com) **Phone:** +1-555-0123
```

### Complex Nested Structures

```yaml
---
contract:
  parties:
    provider:
      name: 'Legal Services LLC'
      address:
        street: '456 Professional Ave'
        city: 'Los Angeles'
        state: 'CA'
      contact:
        email: 'contracts@legalservices.com'
    client:
      name: 'Acme Corporation'
      type: 'enterprise'
      billing:
        address:
          street: '789 Corporate Blvd'
          city: 'New York'
          state: 'NY'
        terms: 'Net 15'
---
```

```markdown
**Provider:** {{contract.parties.provider.name}} **Provider Address:**
{{contract.parties.provider.address.street}},
{{contract.parties.provider.address.city}},
{{contract.parties.provider.address.state}}

**Client:** {{contract.parties.client.name}}
({{titleCase(contract.parties.client.type)}}) **Billing Address:**
{{contract.parties.client.billing.address.street}},
{{contract.parties.client.billing.address.city}},
{{contract.parties.client.billing.address.state}} **Payment Terms:**
{{contract.parties.client.billing.terms}}
```

## Array Access

Access array elements using index notation:

### Array by Index

```yaml
---
parties:
  - name: John Smith
    role: Client
    email: john@acme.com
  - name: Jane Doe
    role: Provider
    email: jane@provider.com
services:
  - 'Legal Consulting'
  - 'Contract Review'
  - 'Compliance Audit'
---
```

```markdown
**First Party:** {{parties.0.name}} ({{parties.0.role}}) **Email:**
{{parties.0.email}}

**Second Party:** {{parties.1.name}} ({{parties.1.role}}) **Email:**
{{parties.1.email}}

**Primary Service:** {{services.0}} **Additional Services:** {{services.1}},
{{services.2}}
```

**Output:**

```markdown
**First Party:** John Smith (Client) **Email:** john@acme.com

**Second Party:** Jane Doe (Provider) **Email:** jane@provider.com

**Primary Service:** Legal Consulting **Additional Services:** Contract Review,
Compliance Audit
```

### Mixed Array and Object Access

```yaml
---
projects:
  - name: 'Website Redesign'
    client:
      name: 'Acme Corp'
      contact: 'john@acme.com'
    budget: 50000
    timeline: '3 months'
  - name: 'Mobile App'
    client:
      name: 'Beta Inc'
      contact: 'mary@beta.com'
    budget: 75000
    timeline: '6 months'
---
```

```markdown
**Project 1:** {{projects.0.name}} **Client:** {{projects.0.client.name}}
({{projects.0.client.contact}}) **Budget:**
{{formatCurrency(projects.0.budget, "USD")}} **Timeline:**
{{projects.0.timeline}}

**Project 2:** {{projects.1.name}} **Client:** {{projects.1.client.name}}
({{projects.1.client.contact}}) **Budget:**
{{formatCurrency(projects.1.budget, "USD")}} **Timeline:**
{{projects.1.timeline}}
```

## Conditional Mixins

Use conditional logic within variable expressions:

### Ternary Operators

```yaml
---
client_name: Acme Corp
support_level: premium
payment_terms: 30
has_warranty: true
contract_type: enterprise
---
```

```markdown
**Client:** {{client_name}} **Support:**
{{support_level ? "Premium support included" : "Standard support"}} **Payment:**
{{payment_terms ? "Net " + payment_terms + " days" : "Payment terms to be negotiated"}}
**Warranty:** {{has_warranty ? "Warranty included" : "No warranty"}} **Type:**
{{contract_type == "enterprise" ? "Enterprise Agreement" : "Standard Agreement"}}
```

**Output:**

```markdown
**Client:** Acme Corp **Support:** Premium support included **Payment:** Net 30
days **Warranty:** Warranty included **Type:** Enterprise Agreement
```

### Complex Conditional Logic

```yaml
---
client:
  type: 'enterprise'
  region: 'US'
  support_level: 'premium'
contract:
  value: 100000
  duration: 12
features:
  priority_support: true
  dedicated_manager: true
  sla_99_9: true
---
```

```markdown
**Client Type:**
{{client.type == "enterprise" ? "Enterprise Client" : "Standard Client"}}

**Support Level:**
{{client.support_level == "premium" && client.type == "enterprise" ? "Premium Enterprise Support" : "Standard Support"}}

**Contract Value:** {{formatCurrency(contract.value, "USD")}}
{{contract.value >= 50000 ? " (High-value contract)" : " (Standard contract)"}}

**Features:**

- Priority Support: {{features.priority_support ? "Included" : "Not included"}}
- Dedicated Manager:
  {{features.dedicated_manager && client.type == "enterprise" ? "Assigned" : "Not assigned"}}
- 99.9% SLA: {{features.sla_99_9 ? "Guaranteed" : "Best effort"}}
```

## Helper Functions Integration

Combine variables with helper functions for advanced formatting:

### Date Formatting

```yaml
---
contract_date: '@today'
start_date: '2024-01-15'
end_date: '2024-12-31'
renewal_date: '@today+1y'
---
```

```markdown
**Contract Date:** {{formatDate(contract_date, "MMMM Do, YYYY")}} **Start
Date:** {{formatDate(start_date, "DD/MM/YYYY")}} **End Date:**
{{formatDate(end_date, "DD/MM/YYYY")}} **Next Renewal:**
{{formatDate(renewal_date, "MMMM Do, YYYY")}} **Duration:**
{{formatDate(start_date, "MMM YYYY")}} - {{formatDate(end_date, "MMM YYYY")}}
```

### Number and Currency Formatting

```yaml
---
amounts:
  base_fee: 25000
  additional_services: 5000
  tax_rate: 0.08
  discount_percent: 10
currency: 'USD'
quantities:
  licenses: 100
  users: 1250
---
```

```markdown
**Base Fee:** {{formatCurrency(amounts.base_fee, currency)}} **Additional
Services:** {{formatCurrency(amounts.additional_services, currency)}} **Tax
Rate:** {{formatPercent(amounts.tax_rate, 1)}} **Discount:**
{{amounts.discount_percent}}%

**Total Before Tax:**
{{formatCurrency(amounts.base_fee + amounts.additional_services, currency)}}
**Tax Amount:**
{{formatCurrency((amounts.base_fee + amounts.additional_services) * amounts.tax_rate, currency)}}

**Licenses:** {{formatInteger(quantities.licenses)}} **Users:**
{{formatInteger(quantities.users)}}
```

### String Formatting

```yaml
---
client:
  name: 'john doe'
  company: 'ACME CORPORATION'
  title: 'chief technology officer'
contact:
  email: 'JOHN.DOE@ACME.COM'
  phone: '555-123-4567'
---
```

```markdown
**Client:** {{titleCase(client.name)}} **Company:**
{{titleCase(client.company)}} **Title:** {{titleCase(client.title)}} **Email:**
{{lower(contact.email)}} **Phone:** {{contact.phone}} **Initials:**
{{initials(client.name)}}
```

**Output:**

```markdown
**Client:** John Doe **Company:** Acme Corporation **Title:** Chief Technology
Officer **Email:** john.doe@acme.com **Phone:** 555-123-4567 **Initials:** JD
```

## Advanced Patterns

### Calculated Values

```yaml
---
project:
  hours: 160
  rate: 150
  expenses: 2500
tax_rate: 0.085
currency: 'USD'
---
```

```markdown
**Project Details:**

- Hours: {{project.hours}}
- Rate: {{formatCurrency(project.rate, currency)}} per hour
- Expenses: {{formatCurrency(project.expenses, currency)}}

**Calculations:**

- Labor Cost: {{formatCurrency(project.hours * project.rate, currency)}}
- Total Before Tax:
  {{formatCurrency(project.hours * project.rate + project.expenses, currency)}}
- Tax:
  {{formatCurrency((project.hours * project.rate + project.expenses) * tax_rate, currency)}}
- **Grand Total:
  {{formatCurrency((project.hours * project.rate + project.expenses) * (1 + tax_rate), currency)}}**
```

### Dynamic Content Generation

```yaml
---
client:
  name: 'Acme Corporation'
  type: 'enterprise'
document:
  type: 'service_agreement'
  version: '2.1'
generated:
  date: '@today'
  by: 'Legal Department'
reference:
  id:
    "{{upper(initials(client.name))}}{{formatDate(generated.date,
    'YYMMDD')}}{{document.version | replace('.', '')}}"
---
```

```markdown
# {{titleCase(document.type | replace('_', ' '))}}

**Document Reference:** {{reference.id}} **Client:** {{titleCase(client.name)}}
({{titleCase(client.type)}}) **Version:** {{document.version}} **Generated:**
{{formatDate(generated.date, "MMMM Do, YYYY")}} by {{generated.by}}

**Document ID Pattern:**

- Client Initials: {{upper(initials(client.name))}}
- Date: {{formatDate(generated.date, 'YYMMDD')}}
- Version: {{document.version | replace('.', '')}}
- Full ID: {{reference.id}}
```

### Nested Calculations

```yaml
---
pricing:
  tiers:
    basic:
      monthly: 100
      annual_discount: 0.15
    premium:
      monthly: 250
      annual_discount: 0.20
    enterprise:
      monthly: 500
      annual_discount: 0.25
selected_tier: 'premium'
---
```

```markdown
**Selected Tier:** {{titleCase(selected_tier)}}

**Monthly Price:**
{{formatCurrency(pricing.tiers[selected_tier].monthly, "USD")}} **Annual
Discount:** {{formatPercent(pricing.tiers[selected_tier].annual_discount, 0)}}

**Annual Calculations:**

- Full Annual Cost:
  {{formatCurrency(pricing.tiers[selected_tier].monthly * 12, "USD")}}
- Discount Amount:
  {{formatCurrency(pricing.tiers[selected_tier].monthly * 12 * pricing.tiers[selected_tier].annual_discount, "USD")}}
- **Annual Price:
  {{formatCurrency(pricing.tiers[selected_tier].monthly * 12 * (1 - pricing.tiers[selected_tier].annual_discount), "USD")}}**
```

## Best Practices

### 1. Variable Naming

**Use descriptive, hierarchical names:**

```yaml
# ✅ Good - clear hierarchy
client:
  company:
    name: 'Acme Corp'
    legal_name: 'Acme Corporation Inc.'
  contact:
    primary:
      name: 'John Smith'
      email: 'john@acme.com'

# ❌ Avoid - flat, unclear names
client_company_name: 'Acme Corp'
client_legal_name: 'Acme Corporation Inc.'
contact_name: 'John Smith'
contact_email: 'john@acme.com'
```

### 2. Error Handling

**Provide fallbacks for missing values:**

```yaml
---
client:
  name: 'Acme Corp'
  # contact might be missing
---
```

```markdown
**Client:** {{client.name}} **Contact:**
{{client.contact.name || "[Contact information not provided]"}} **Email:**
{{client.contact.email || "[Email not available]"}}
```

### 3. Type Consistency

**Be consistent with data types:**

```yaml
---
# ✅ Good - consistent types
amounts:
  base: 1000 # Number
  tax: 80 # Number
  total: 1080 # Number

dates:
  start: '2024-01-01' # String (ISO date)
  end: '2024-12-31' # String (ISO date)

flags:
  premium: true # Boolean
  trial: false # Boolean

# ❌ Avoid - mixed types
amount: '1000' # String that should be number
date: 20240101 # Number that should be string
premium: 'true' # String that should be boolean
```

### 4. Documentation

**Comment complex variable structures:**

```yaml
---
# Client information hierarchy
client:
  # Company details
  company:
    name: 'Acme Corporation'
    legal_name: 'Acme Corporation Inc.' # Full legal entity name
    tax_id: '12-3456789' # Federal tax ID

  # Primary contact
  contact:
    name: 'John Smith'
    title: 'CTO'
    email: 'john@acme.com'
    phone: '+1-555-0123'

  # Service configuration
  service:
    tier: 'enterprise' # Determines available features
    region: 'US' # Affects compliance requirements
    support_level: 'premium' # 24/7 vs business hours
---
```

### 5. Validation

**Use helper functions to validate and format data:**

```markdown
**Email:** {{lower(clean(client.contact.email))}} **Phone:**
{{client.contact.phone || "[Phone not provided]"}} **Name:**
{{titleCase(client.contact.name) || "[Name required]"}}
```

## Common Patterns

### Contract Header Template

```yaml
---
document:
  title: 'Professional Services Agreement'
  type: 'service_agreement'
  version: '3.1'
  reference:
    "PSA-{{formatDate(@today, 'YYYYMMDD')}}-{{upper(initials(client.name))}}"

parties:
  provider:
    name: 'Legal Services LLC'
    address: '123 Professional Ave, Los Angeles, CA 90210'
    email: 'contracts@legalservices.com'
  client:
    name: 'Acme Corporation'
    address: '456 Business St, San Francisco, CA 94105'
    email: 'legal@acme.com'

effective_date: '@today'
---
```

```markdown
# {{document.title}}

**Document Reference:** {{document.reference}} **Document Type:**
{{titleCase(document.type | replace('_', ' '))}} **Version:**
{{document.version}} **Effective Date:**
{{formatDate(effective_date, "MMMM Do, YYYY")}}

## Parties

**Provider:** {{parties.provider.name}} {{parties.provider.address}} Email:
{{parties.provider.email}}

**Client:** {{parties.client.name}} {{parties.client.address}} Email:
{{parties.client.email}}
```

### Invoice Template

```yaml
---
invoice:
  number: "INV-{{formatDate(@today, 'YYYYMMDD')}}-001"
  date: '@today'
  due_date: '{{addDays(@today, 30)}}'

client:
  name: 'Acme Corporation'
  billing_address: '789 Corporate Blvd, New York, NY 10001'

items:
  - description: 'Legal Consulting Services'
    hours: 40
    rate: 300
  - description: 'Document Review'
    hours: 20
    rate: 250

tax_rate: 0.08
currency: 'USD'
---
```

```markdown
# Invoice {{invoice.number}}

**Date:** {{formatDate(invoice.date, "MMMM Do, YYYY")}} **Due Date:**
{{formatDate(invoice.due_date, "MMMM Do, YYYY")}}

**Bill To:** {{client.name}} {{client.billing_address}}

## Items

{{#items}}

- {{description}}: {{hours}} hours @ {{formatCurrency(rate, currency)}} =
  {{formatCurrency(hours * rate, currency)}} {{/items}}

**Subtotal:**
{{formatCurrency(items.0.hours * items.0.rate + items.1.hours * items.1.rate, currency)}}
**Tax ({{formatPercent(tax_rate, 0)}}):**
{{formatCurrency((items.0.hours * items.0.rate + items.1.hours * items.1.rate) * tax_rate, currency)}}
**Total:**
{{formatCurrency((items.0.hours * items.0.rate + items.1.hours * items.1.rate) * (1 + tax_rate), currency)}}
```

## See Also

- [YAML Frontmatter](yaml-frontmatter.md) - Defining variables for use in mixins
- [Helper Functions](../helpers/README.md) - Available formatting and
  manipulation functions
- [Optional Clauses](optional-clauses.md) - Using variables in conditional
  content
- [Template Loops](template-loops.md) - Iterating over arrays and objects
