---
title: 'Basic Service Agreement'
document_type: 'Service Agreement'
version: '1.0'
effective_date: '@today'
parties:
  provider:
    name: 'Service Provider Inc.'
    type: 'Corporation'
    state: 'California'
  client:
    name: 'Default Client'
project:
  name: 'Professional Services'
  description: 'General professional services engagement'
  duration: '12 months'
  budget: 100000
  currency: 'USD'
liability_cap: 100000
payment_terms: 'Net 30'
governing_law: 'State of California'
warranty_period: '6 months'
level-one: 'Section %n.'
level-two: '%n.%s'
level-three: '(%n)'
---

l. {{title}}

**Document Type:** {{document_type}}  
**Version:** {{version}}  
**Effective Date:** {{effective_date}}

This agreement is between {{parties.provider.name}} and {{parties.client.name}}
for {{project.description}}.

---

l. Project Details

**Project:** {{project.name}}  
**Duration:** {{project.duration}}  
**Budget:** ${{project.budget | currency}} {{project.currency}}

---

@import ../components/client-info.md

---

@import ../components/standard-terms.md

---

l. Financial Terms

ll. Total Project Cost The total cost for this engagement is
**${{project.budget | currency}} {{project.currency}}**.

ll. Payment Terms Payment terms are **{{payment_terms}}** from invoice date.

ll. Liability Total liability is capped at **${{liability_cap | currency}}**.

---

l. Execution

This agreement becomes effective on {{effective_date}} and is governed by
**{{governing_law}}**.

**PROVIDER:** {{parties.provider.name}}

Signature: ************\_************ Date: ******\_******

**CLIENT:** {{parties.client.name}}

Signature: ************\_************ Date: ******\_******

---

_Template demonstrates basic frontmatter merging where client-info.md overrides
the default client name and other client-specific terms, while standard-terms.md
provides common legal clauses._
