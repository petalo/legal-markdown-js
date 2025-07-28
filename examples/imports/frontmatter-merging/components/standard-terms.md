---
confidentiality: true
termination_notice: '30 days'
governing_law: 'State of California'
liability_cap: 1000000
payment_terms: 'Net 30'
warranty_period: '12 months'
dispute_resolution: 'arbitration'
intellectual_property:
  ownership: 'client retains ownership'
  license: 'perpetual license to provider'
  restrictions: ['no reverse engineering', 'no redistribution']
force_majeure: true
severability: true
amendment_requirements: 'written consent of both parties'
notices:
  provider_address: '123 Provider St, Tech City, CA 90210'
  client_address: 'to be specified in main agreement'
default_penalties:
  late_payment_fee: 0.05
  grace_period_days: 15
  compound_interest: false
---

## Standard Terms and Conditions

### Confidentiality

{{#confidentiality}} All information exchanged between the parties shall remain
strictly confidential and shall not be disclosed to third parties without prior
written consent. {{/confidentiality}}

### Termination

Either party may terminate this agreement with **{{termination_notice}}**
written notice to the other party.

### Governing Law

This agreement shall be governed by the laws of **{{governing_law}}** without
regard to conflict of law principles.

### Liability Cap

The total liability of either party under this agreement shall not exceed
**${{liability_cap | currency}}**.

### Payment Terms

Payment shall be made according to **{{payment_terms}}** terms unless otherwise
specified.

### Warranty

{{#warranty_period}} Provider warrants that services will be performed in a
professional manner for a period of **{{warranty_period}}** from completion.
{{/warranty_period}}

### Dispute Resolution

{{#dispute_resolution}} Any disputes arising under this agreement shall be
resolved through **{{dispute_resolution}}**. {{/dispute_resolution}}

### Intellectual Property

- **Ownership**: {{intellectual_property.ownership}}
- **License**: {{intellectual_property.license}}
- **Restrictions**: {{intellectual_property.restrictions | join: ", "}}

### Force Majeure

{{#force_majeure}} Neither party shall be liable for delays or failures in
performance resulting from circumstances beyond their reasonable control.
{{/force_majeure}}

### Severability

{{#severability}} If any provision of this agreement is found to be
unenforceable, the remaining provisions shall remain in full force and effect.
{{/severability}}

### Amendments

This agreement may only be amended with **{{amendment_requirements}}**.

### Notices

All notices under this agreement shall be sent to:

- **Provider**: {{notices.provider_address}}
- **Client**: {{notices.client_address}}

### Default and Penalties

{{#default_penalties}} In the event of late payment:

- Late fee: {{default_penalties.late_payment_fee | percent}} per month
- Grace period: {{default_penalties.grace_period_days}} days
- Compound interest: {{default_penalties.compound_interest}}
  {{/default_penalties}}
