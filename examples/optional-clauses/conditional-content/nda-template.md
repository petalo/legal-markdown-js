---
title: 'Optional Clauses Example'
include_warranties: true
include_liability: false
include_force_majeure: true
jurisdiction: 'California'
level-one: 'Section %n.'
level-two: '%n.%s'
---

# {{title}}

This document demonstrates the use of optional clauses in LegalMarkdown.

l. **Basic Services**

The Provider will deliver the agreed services as outlined in Schedule A.

[l. **Warranties**

The Provider warrants that:

ll. All services will be performed in a professional manner

ll. Services will comply with industry standards

ll. All deliverables will be free from defects for 90 days]{include_warranties}

l. **Payment Terms**

Payment is due within 30 days of invoice date.

[Late fees of 1.5% per month will apply to overdue amounts]{include_penalties}.

[l. **Limitation of Liability**

In no event shall either party be liable for:

ll. Indirect, incidental, or consequential damages

ll. Loss of profits, revenue, or business opportunities

ll. Damages exceeding the total amount paid under this
agreement]{include_liability}

l. **General Provisions**

ll. This agreement shall be governed by the laws of {{jurisdiction}}

ll. Any disputes shall be resolved through binding arbitration

[ll. **Force Majeure**

Neither party shall be liable for delays caused by circumstances beyond their
reasonable control, including but not limited to:

lll. Natural disasters or acts of God

lll. Government actions or regulations

lll. Strikes or labor disputes

lll. War, terrorism, or civil unrest]{include_force_majeure}

l. **Effective Date**

This agreement becomes effective upon execution by both parties.

---

## Example Usage

To process this document with different configurations:

```bash
# Include all optional clauses
legal-md optional-clauses.md output-full.md

# Process with custom metadata that excludes liability
echo "include_liability: false" > custom.yaml
legal-md --metadata custom.yaml optional-clauses.md output-no-liability.md
```
