---
title: 'Internal Cross-References Example'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
---

# {{title}}

This document demonstrates internal cross-referencing capabilities following the
original Ruby Legal Markdown specification.

l. **Definitions** |definitions|

For purposes of this Agreement, the following terms have the meanings set forth
below. Capitalized terms not defined herein shall have the meanings assigned in
|payment|.

l. **Scope of Work** |scope|

The services described herein are subject to the payment terms outlined in
|payment| and the termination provisions of |termination|.

ll. **Service Specifications** |specifications|

All services must comply with the standards referenced in |specifications|.

ll. **Delivery Requirements** |delivery|

Delivery schedules are subject to the force majeure provisions detailed in
|misc|.

l. **Payment Terms** |payment|

Payment obligations as defined in |payment| are binding upon both parties.

ll. **Invoice Processing** |invoicing|

Invoices shall be submitted according to the procedures outlined in |invoicing|.

ll. **Late Payment** |late_fees|

Late payment penalties are governed by |late_fees| and |governing|.

l. **Termination** |termination|

ll. **Termination for Cause** |term_cause|

Either party may terminate this Agreement for cause as defined in |term_cause|.

ll. **Termination for Convenience** |term_convenience|

Termination for convenience requires notice as specified in |term_convenience|.

lll. **Effect of Termination** |term_effect|

Upon termination, the provisions of |term_effect| shall remain in effect.

l. **Dispute Resolution** |disputes|

ll. **Governing Law** |governing|

This Agreement is subject to |governing|.

ll. **Arbitration** |arbitration|

Disputes shall be resolved through arbitration as detailed in |arbitration|.

l. **Miscellaneous** |misc|

ll. **Amendment** |amendments|

This Agreement may only be amended as provided in |amendments|.

ll. **Entire Agreement** |entire|

This Agreement, together with the documents referenced in |entire|, constitutes
the entire agreement.

---

## Cross-Reference Notes

This document demonstrates how internal cross-references work:

- `` `|definitions|` `` → References Article 1. (Definitions)
- `` `|scope|` `` → References Article 2. (Scope of Work)
- `` `|payment|` `` → References Article 3. (Payment Terms)
- `` `|termination|` `` → References Article 4. (Termination)
- `` `|disputes|` `` → References Article 5. (Dispute Resolution)
- `` `|misc|` `` → References Article 6. (Miscellaneous)
- `` `|specifications|` `` → References Section 1. (Service Specifications)
- `` `|delivery|` `` → References Section 2. (Delivery Requirements)
- `` `|invoicing|` `` → References Section 1. (Invoice Processing)
- `` `|late_fees|` `` → References Section 2. (Late Payment)
- And many more...

## Usage

Process this file to see how internal cross-references are resolved:

```bash
legal-md agreement.md agreement-output.md
```

The processor will:

1. Scan for headers with `|key|` syntax
2. Assign section numbers based on legal numbering (l., ll., lll.)
3. Replace all `|key|` references with the corresponding section numbers
4. Leave the header definitions intact
