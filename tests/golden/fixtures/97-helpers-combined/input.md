---
title: "Mutual Non-Disclosure Agreement"
disclosing_party: "north atlantic biotech ltd"
receiving_party: "Sierra Legal Analytics LLC"
effective_date: "2026-02-01"
term_years: 4
notice_days: 45
penalty_base: 15000
violation_multiplier: 1.5
materiality_threshold: 250000
jurisdiction: "spain"
is_cross_border: true
minimum_security_score: 82
security_score: 88
expenses_cap: 120000
expense_reduction: 17500
obligations:
  - "Use Confidential Information only for evaluating the transaction."
  - "Restrict disclosure to employees with a strict need to know."
  - "Apply industry-standard technical and organizational safeguards."
  - "Notify the disclosing party promptly after unauthorized access."
signatory_disclosing: "Elena Martín"
signatory_receiving: "David Kim"
---

# {{titleCase title}}

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on {{formatDate effective_date "MMMM DD, YYYY"}} by and between **{{capitalizeWords disclosing_party}}** ("Disclosing Party") and **{{upper receiving_party}}** ("Receiving Party").

## l. Term

The confidentiality obligations commence on {{formatDate effective_date "YYYY-MM-DD"}} and continue until {{formatDate (addYears effective_date term_years) "YYYY-MM-DD"}}.

Either party may terminate negotiations with {{notice_days}} days written notice, with a notice deadline of {{formatDate (addDays effective_date notice_days) "DD/MM/YYYY"}} for this initial cycle.

## l. Obligations

The Receiving Party shall comply with the following obligations:
{{#each obligations}}
- {{capitalize this}}
{{/each}}

## l. Financial Protections

Material disclosure threshold: {{formatCurrency materiality_threshold "EUR" 0}}.

Contractual penalty per verified breach: {{formatCurrency (multiply penalty_base violation_multiplier) "EUR" 2}}.

Maximum reimbursable expenses after reduction: {{formatCurrency (subtract expenses_cap expense_reduction) "EUR" 2}}.

## l. Jurisdiction and Compliance

{{#if (eq jurisdiction "spain")}}
This Agreement is governed by the laws of Spain, and the courts of Madrid shall have exclusive jurisdiction.
{{else}}
The parties shall determine governing law in a separate venue addendum.
{{/if}}

{{#if (and is_cross_border (gte security_score minimum_security_score))}}
Cross-border transfer is authorized, subject to documented transfer impact assessments.
{{else}}
Cross-border transfer is suspended pending additional safeguards.
{{/if}}

Reference code: {{concat "NDA-" (padStart minimum_security_score 3 "0") "-" (lower jurisdiction)}}

## l. Signatures

Signed for {{titleCase disclosing_party}} by {{signatory_disclosing}} ({{initials signatory_disclosing}}): ____________

Signed for {{titleCase receiving_party}} by {{signatory_receiving}} ({{initials signatory_receiving}}): ____________
