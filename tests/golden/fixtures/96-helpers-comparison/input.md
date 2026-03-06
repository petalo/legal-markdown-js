---
title: "Conditional Jurisdiction Addendum"
jurisdiction: "spain"
amount: 12500
is_premium: true
years_active: 7
status: "active"
---

# {{title}}

{{#if (eq jurisdiction "spain")}}
This contract is governed by Spanish law.
{{else if (eq jurisdiction "france")}}
Ce contrat est régi par le droit français.
{{/if}}

{{#if (gt amount 10000)}}
This transaction requires board approval.
{{/if}}

{{#if (and is_premium (gte years_active 5))}}
Loyalty discount of 15% applies.
{{/if}}

{{#unless (eq status "terminated")}}
This agreement remains in full force.
{{/unless}}

{{#if (or (lt amount 5000) (neq jurisdiction "spain"))}}
Cross-border screening may be required.
{{else}}
Cross-border screening is not required for this filing.
{{/if}}

{{#if (not (lte years_active 1))}}
Enhanced due diligence profile: established counterparty.
{{/if}}
