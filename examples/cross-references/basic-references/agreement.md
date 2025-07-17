---
title: 'Cross-References Example'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
references:
  payment_section: 'Article 3'
  termination_clause: 'Section 4.2'
  governing_law: 'Article 7'
---

# {{title}}

This document demonstrates cross-referencing capabilities in LegalMarkdown.

l. **Definitions**

For purposes of this Agreement, the following terms have the meanings set forth
below. Capitalized terms not defined herein shall have the meanings assigned in
|payment_section|.

l. **Scope of Work**

The services described herein are subject to the payment terms outlined in
|payment_section| and the termination provisions of |termination_clause|.

ll. Service Specifications

All services must comply with the standards referenced in |quality_standards|.

ll. Delivery Requirements

Delivery schedules are subject to the force majeure provisions detailed in
|force_majeure_clause|.

l. **Payment Terms** {#payment_section}

ll. Invoice Processing

Invoices shall be submitted according to the procedures outlined in
|invoice_procedures|.

ll. Late Payment

Late payment penalties are governed by |late_payment_terms| and |governing_law|.

l. **Termination**

ll. Termination for Cause

Either party may terminate this Agreement for cause as defined in
|cause_definition|.

ll. Termination for Convenience {#termination_clause}

Termination for convenience requires notice as specified in
|notice_requirements|.

lll. Effect of Termination

Upon termination, the provisions of |survival_clause| shall remain in effect.

l. **Dispute Resolution**

ll. Governing Law

This Agreement is subject to |governing_law|.

ll. Arbitration

Disputes shall be resolved through arbitration as detailed in
|arbitration_procedures|.

l. **Miscellaneous**

ll. Amendment

This Agreement may only be amended as provided in |amendment_procedures|.

ll. Entire Agreement

This Agreement, together with the documents referenced in
|incorporated_documents|, constitutes the entire agreement.

l. **Governing Law** {#governing_law}

This Agreement shall be governed by the laws of Delaware, without regard to
conflict of law principles.

---

## Cross-Reference Notes

The following references are used in this document:

- `|payment_section|` → References Article 3 (Payment Terms)
- `|termination_clause|` → References Section 4.2 (Termination for Convenience)
- `|governing_law|` → References Article 7 (Governing Law)
- `|quality_standards|` → Placeholder reference (would link to external
  document)
- `|force_majeure_clause|` → Placeholder reference
- `|invoice_procedures|` → Placeholder reference
- `|late_payment_terms|` → Placeholder reference
- `|cause_definition|` → Placeholder reference
- `|notice_requirements|` → Placeholder reference
- `|survival_clause|` → Placeholder reference
- `|arbitration_procedures|` → Placeholder reference
- `|amendment_procedures|` → Placeholder reference
- `|incorporated_documents|` → Placeholder reference

## Usage

Process this file to see how cross-references are resolved:

```bash
legal-md cross-references.md output.md
```
