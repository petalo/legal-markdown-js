---
title: 'Professional Services Agreement'
document_type: 'Master Service Agreement'
version: '3.1'
effective_date: '@today'
expiration_date: '2025-12-31'
parties:
  provider:
    name: 'TechServices Inc.'
    type: 'Corporation'
    state: 'Delaware'
    registration: 'DE-2019-123456'
    address: '789 Technology Blvd, Innovation City, CA 94105'
  client:
    name: 'Default Client Name'
    type: 'Corporation'
project:
  name: 'Enterprise Digital Transformation'
  description: 'Comprehensive digital transformation initiative'
  duration: '18 months'
  start_date: '@today'
  end_date: '2026-06-30'
  budget: 750000
  currency: 'USD'
  project_manager: 'Alex Rodriguez'
liability_cap: 500000
payment_terms: 'Net 45'
governing_law: 'State of New York'
signature_required: true
witnesses_required: false
notarization_required: false
meta-json-output: 'output/contract-metadata.json'
meta-yaml-output: 'output/contract-metadata.yaml'
level-one: 'Article %n.'
level-two: 'Section %n.%s'
level-three: 'Subsection %n.%s.%t'
level-four: '(%n)'
---

l. {{title}}

**Document Type:** {{document_type}}  
**Version:** {{version}}  
**Effective Date:** {{effective_date}}  
**Expiration Date:** {{expiration_date}}

---

## Agreement Overview

This {{document_type}} ("Agreement") is entered into on {{effective_date}}
between:

**Provider:** {{parties.provider.name}}, a {{parties.provider.type}} organized
under the laws of {{parties.provider.state}} (Registration:
{{parties.provider.registration}})

**Client:** {{client.name}}, a {{client.type}}

For the {{project.name}} project with a total budget of
${{project.budget | currency}} over {{project.duration}}.

---

l. Project Scope

ll. Project Overview The **{{project.name}}** is {{project.description}}
scheduled to run from {{project.start_date}} to {{project.end_date}}.

- **Project Manager:** {{project.project_manager}}
- **Duration:** {{project.duration}}
- **Budget:** ${{project.budget | currency}} {{project.currency}}

ll. Deliverables Project deliverables and milestones will be defined in separate
Statements of Work (SOW) that reference this master agreement.

---

@import components/client-info.md

---

@import components/standard-terms.md

---

@import components/service-levels.md

---

l. Financial Terms

ll. Project Budget The total project budget is **${{project.budget | currency}}
{{project.currency}}** payable according to the payment schedule defined in
individual SOWs.

ll. Payment Terms  
Payment terms for this agreement are **{{payment_terms}}** from invoice date.

ll. Liability Cap Total liability under this agreement is capped at
**${{liability_cap | currency}}**.

{{#liability_cap}} _Note: This liability cap represents the final agreed amount
after client negotiations and supersedes any conflicting terms in imported
components._ {{/liability_cap}}

---

l. Execution

{{#signature_required}} ll. Signatures

**PROVIDER:**

{{parties.provider.name}}

By: ****************\_****************  
Name: [Name]  
Title: [Title]  
Date: ******\_\_\_******

**CLIENT:**

{{client.name}}

By: ****************\_****************  
Name: {{contact.legal.name}}  
Title: {{contact.legal.title}}  
Date: ******\_\_\_******

{{#witnesses_required}} ll. Witnesses

Witness 1: ****************\_****************  
Date: ******\_\_\_******

Witness 2: ****************\_****************  
Date: ******\_\_\_****** {{/witnesses_required}}

{{#notarization_required}} ll. Notarization

State of: ******\_\_\_******  
County of: ******\_\_\_******

On this **\_** day of **\_\_\_\_**, 2024, before me personally appeared [Names]
who proved to me on the basis of satisfactory evidence to be the persons whose
names are subscribed to the within instrument and acknowledged to me that they
executed the same in their authorized capacities.

---

Notary Public {{/notarization_required}}

{{/signature_required}}

---

_This {{document_type}} contains {{@word_count}} words and supersedes all
previous agreements between the parties. Generated on {{@today}} using Legal
Markdown with frontmatter merging._

**Key Merged Metadata Summary:**

- **Governing Law:** {{governing_law}} _(main document preference)_
- **Liability Cap:** ${{liability_cap | currency}} _(main document wins over
  {{client.name}} preference)_
- **Payment Terms:** {{payment_terms}} _(main document preference)_
- **Client Contact:** {{contact.legal.name}} at {{contact.legal.email}}
- **Service Level:** {{service_levels.availability.uptime_guarantee}}% uptime
  guarantee
