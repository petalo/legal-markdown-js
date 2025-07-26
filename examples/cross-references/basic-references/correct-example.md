---
title: 'Cross-References Example - Correct Implementation'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
---

# {{title}}

This document demonstrates the correct usage of cross-references in Legal
Markdown.

l. **Definitions**

ll. **Payment Terms** |payment_terms|

Payment shall be made within thirty (30) days of invoice receipt.

ll. **Confidentiality** |confidentiality|

All information shared under this agreement shall remain confidential.

ll. **Standard Definitions**

For purposes of this Agreement, standard terms apply as defined in the industry.

l. **Obligations**

ll. **Payment Obligations**

As specified in |payment_terms|, all amounts must be paid promptly.

ll. **Confidentiality Obligations**

lll. **Protection Requirements**

As outlined in |confidentiality|, parties must protect shared information.

lll. **Survival**

This obligation survives termination of the agreement.

l. **Final Provisions**

ll. **Integration**

This agreement incorporates the payment terms from |payment_terms| and
confidentiality requirements from |confidentiality|.

## How Cross-References Work

In this document:

- `|payment_terms|` references "Section 1." (Payment Terms)
- `|confidentiality|` references "Section 2." (Confidentiality)

The system replaces the reference with the section number, so:

- "As specified in |payment_terms|" becomes "As specified in Section 1."
- "As outlined in |confidentiality|" becomes "As outlined in Section 2."
