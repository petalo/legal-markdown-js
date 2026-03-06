---
title: "Extended Helpers Validation"
payment_day: 15
balance: -4200.75
offer_a: 18000
offer_b: 24500
penalty_a: 900
penalty_b: 650
obligations:
  - "confidentiality"
  - "audit rights"
  - "data retention"
items:
  - 1
  - 2
  - 3
optional_clause: ""
company_name: "acme legal technologies"
jurisdiction: "SPAIN"
---

# {{title}}

- Payment day ordinal: {{ordinal payment_day}}
- Absolute balance: {{abs balance}}
- Better offer: {{max offer_a offer_b}}
- Lower penalty: {{min penalty_a penalty_b}}
- Obligations list: {{join obligations ", "}}
- Item count: {{length items}}
- Optional clause: {{default optional_clause "Not specified"}}
- Company uppercase: {{uppercase company_name}}
- Jurisdiction lowercase: {{lowercase jurisdiction}}
