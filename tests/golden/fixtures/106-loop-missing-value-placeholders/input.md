---
insurance:
  lessee_requirements:
    - ''
    - ''
    - ''
    - Workers' compensation insurance
services:
  - Integration testing
  - ''
  - Quality assurance
company: '\[Acme Corp\]'
other_party: '[Other Party]'
---

# Coverage Requirements

The lessee shall maintain:

{{#each insurance.lessee_requirements}}

- {{.}}
{{/each}}

# Service Items

{{#each services}}

- {{.}}
{{/each}}

# Parties

Company: {{company}}

Other: {{other_party}}
