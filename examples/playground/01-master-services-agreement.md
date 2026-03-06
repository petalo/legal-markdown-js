---
title: Master Services Agreement
referenceNumber: 2024
effectiveDate: 2026-01-15
includeNonSolicitation: true
includeEscalation: false
governingState: Delaware

provider:
  legalName: meridian consulting group llc
  shortName: Meridian
  address: 1440 G Street NW, Suite 600, Washington, DC 20005
  contact:
    name: eleanor voss
    title: managing director
    email: evoss@meridiancg.com
  taxId: 47-3821045

client:
  legalName: hargrove industrial partners inc
  shortName: Hargrove
  address: 875 W. Randolph Street, Suite 1100, Chicago, IL 60661
  contact:
    name: thomas p hargrove
    title: chief operating officer
    email: thargrove@hargrove-ind.com
  taxId: 36-4409178

services:
  - name: Digital Transformation Assessment
    description: Comprehensive audit of existing IT infrastructure and roadmap development
    fee: 48000
    duration: 3
    taxExempt: false
  - name: Systems Integration
    description: End-to-end integration of ERP and supply chain management platforms
    fee: 124000
    duration: 8
    taxExempt: false
  - name: Change Management & Training
    description: Organizational change facilitation and staff enablement programs
    fee: 31500
    duration: 4
    taxExempt: true

payment:
  retainerAmount: 25000
  netDays: 30
  lateRateDecimal: 0.015
  taxRateDecimal: 0.0875
  annualEscalationDecimal: 0.03
  totalFee: 203500

term:
  initialYears: 2
  renewalMonths: 6
  noticeDays: 90

liability:
  capMultiplier: 3
  indemnityThreshold: 10000

arbitration:
  venue: Wilmington
  rulesBody: American Arbitration Association
  arbitratorCount: 3

milestones:
  - name: Contract Execution and Retainer
    percentage: 12
    invoiceMonth: 1
  - name: Phase 1 - Assessment Delivery
    percentage: 25
    invoiceMonth: 3
  - name: Phase 2 - Integration Midpoint
    percentage: 28
    invoiceMonth: 7
  - name: Go-Live Acceptance
    percentage: 25
    invoiceMonth: 11
  - name: Final Training and Project Close
    percentage: 10
    invoiceMonth: 15

level-1: "Article %n."
level-2: "Section %n."
level-3: "(%n)"
---

# {{upper (titleCase provider.legalName)}} / {{upper (titleCase client.legalName)}}

## {{title}}

**Agreement Reference:** {{concat "MSA-" (padStart referenceNumber 5 "0")}}\
**Execution Date:** {{@today[legal]}}\
**Effective Date:** {{formatDate effectiveDate "MMMM D, YYYY"}}\
**Expiration:** {{formatDate (addYears effectiveDate term.initialYears) "MMMM D, YYYY"}}

---

This {{title}} (the "Agreement") is entered into as of {{@today[long]}} by and between:

**{{upper (titleCase provider.legalName)}}** ("{{provider.shortName}}"), a limited liability company organized under the laws of {{governingState}}, with its principal place of business at {{provider.address}}, Tax ID {{provider.taxId}}, represented herein by {{titleCase provider.contact.name}}, {{titleCase provider.contact.title}}; and

**{{upper (titleCase client.legalName)}}** ("{{client.shortName}}"), a corporation organized under the laws of the State of Illinois, with its principal place of business at {{client.address}}, Tax ID {{client.taxId}}, represented herein by {{titleCase client.contact.name}}, {{titleCase client.contact.title}}.

l. DEFINITIONS

ll. Agreement

"Agreement" means this Master Services Agreement, bearing Reference No. {{concat "MSA-" (padStart referenceNumber 5 "0")}}, effective as of {{formatDate effectiveDate "YYYY-MM-DD"}}.

ll. Engagement fee

"Engagement Fee" means the total fees payable under this Agreement, being {{formatDollar (add (add services.0.fee services.1.fee) services.2.fee)}} ({{capitalize (numberToWords (add (add services.0.fee services.1.fee) services.2.fee))}} dollars), exclusive of applicable taxes.

ll. Initial Term

"Initial Term" means the period of {{term.initialYears}} ({{numberToWords term.initialYears}}) {{pluralize "year" term.initialYears}} commencing on {{formatDate effectiveDate "MMMM D, YYYY"}} and expiring on {{formatDate (addYears effectiveDate term.initialYears) "MMMM D, YYYY"}}.

ll. Provider Contact

"Provider Contact" means {{titleCase provider.contact.name}} ({{lower provider.contact.email}}).

ll. Client Contact

"Client Contact" means {{titleCase client.contact.name}} ({{lower client.contact.email}}).

ll. Late Fee Rate

"Late Fee Rate" means {{formatPercent payment.lateRateDecimal 1}} per month applied to overdue balances.

ll. Notice Period

"Notice Period" means {{term.noticeDays}} ({{numberToWords term.noticeDays}}) calendar {{pluralize "day" term.noticeDays}}.

l. SCOPE OF SERVICES

ll. Engagement Overview

{{client.shortName}} engages {{provider.shortName}} to perform the following {{length services}} ({{numberToWords (length services)}}) {{pluralize "service" (length services)}}:

{{#each services}}
lll. {{ordinal (add @index 1)}} Service Engagement: {{name}}

{{description}}. This engagement is scoped for {{duration}} ({{numberToWords duration}}) {{pluralize "month" duration}} and carries a fixed fee of {{formatDollar fee}} ({{capitalize (numberToWords fee)}} dollars).
{{#if @first}}

This service constitutes the foundational assessment upon which subsequent engagements depend.
{{/if}}
{{#if @last}}

This service shall commence no earlier than the completion of the Systems Integration engagement described above.
{{/if}}
{{/each}}

ll. Aggregate Scope

The combined scope encompasses {{formatInteger (add (add services.0.duration services.1.duration) services.2.duration)}} months across {{length services}} distinct service lines, representing a total Engagement Fee of {{formatDollar (add (add services.0.fee services.1.fee) services.2.fee)}}.

l. COMPENSATION AND PAYMENT

ll. Retainer

Upon execution, {{client.shortName}} shall pay a non-refundable retainer of {{formatDollar payment.retainerAmount}} ({{capitalize (numberToWords payment.retainerAmount)}} dollars), which shall be credited against the first invoice issued hereunder.

ll. Invoicing and Payment Terms

{{provider.shortName}} shall issue invoices monthly in arrears. Payment shall be due within {{payment.netDays}} ({{numberToWords payment.netDays}}) calendar {{pluralize "day" payment.netDays}} of the invoice date, with the first payment due no later than {{formatDate (addDays effectiveDate payment.netDays) "MMMM Do, YYYY"}}.

ll. Late Payment

Invoices not paid by the due date shall accrue interest at {{formatPercent payment.lateRateDecimal 1}} per month ({{formatPercent (multiply payment.lateRateDecimal 12) 1}} per annum) calculated on the outstanding balance from the due date until paid in full.

ll. Taxes

All fees are exclusive of applicable taxes. {{client.shortName}} shall remit an additional {{formatPercent payment.taxRateDecimal 2}} in sales tax on each invoice, equal to approximately {{formatDollar (round (multiply (add (add services.0.fee services.1.fee) services.2.fee) payment.taxRateDecimal) 2)}} on the aggregate Engagement Fee.

ll. Per-Service Fee Schedule

The following schedule sets forth the base fee, applicable sales tax, and gross amount due for each service line. The Change Management engagement qualifies as a tax-exempt training service under applicable regulations.

| # | Service Engagement | Duration | Base Fee | Sales Tax ({{formatPercent payment.taxRateDecimal 2}}) | Total |
|---|--------------------|----------|----------|-------------------------------------------------------|-------|
{{#each services~}}
| {{add @index 1}} | {{name}} | {{duration}} {{pluralize "month" duration}} | {{formatDollar fee}} | {{#if taxExempt}}Exempt{{else}}{{formatDollar (round (multiply fee ../payment.taxRateDecimal) 2)}}{{/if}} | {{#if taxExempt}}{{formatDollar fee}}{{else}}{{formatDollar (round (add fee (multiply fee ../payment.taxRateDecimal)) 2)}}{{/if}} |
{{/each}}

ll. Payment Milestone Schedule

The Engagement Fee of {{formatDollar payment.totalFee}} ({{capitalize (numberToWords payment.totalFee)}} dollars) shall be invoiced in {{length milestones}} ({{numberToWords (length milestones)}}) installments tied to the following project milestones:

{{#each milestones~}}

- {{ordinal (add @index 1)}}. **{{name}}** - Month {{invoiceMonth}}: {{formatDollar (round (multiply ../payment.totalFee (divide percentage 100)) 0)}} ({{percentage}}% of Engagement Fee){{#unless @last}};{{/unless}}
{{/each}}

All milestone invoices are due within {{payment.netDays}} ({{numberToWords payment.netDays}}) calendar {{pluralize "day" payment.netDays}} of written milestone acceptance by {{client.shortName}}.

[ll. Annual Fee Escalation

On each anniversary of the Effective Date, fees for ongoing service lines shall increase by {{formatPercent payment.annualEscalationDecimal 1}} over the prior year's rates.]{includeEscalation}

ll. Liability Cap

{{provider.shortName}}'s aggregate liability under this Agreement shall not exceed {{formatDollar (multiply payment.retainerAmount liability.capMultiplier)}} ({{capitalize (numberToWords (multiply payment.retainerAmount liability.capMultiplier))}} dollars), being {{ordinal liability.capMultiplier}} multiples of the Retainer amount.

l. TERM AND RENEWAL

ll. Initial Term

This Agreement commences on {{@today}} and continues for {{term.initialYears}} ({{numberToWords term.initialYears}}) {{pluralize "year" term.initialYears}}, expiring on {{@today+2y[long]}}, unless earlier terminated in accordance with this Agreement.

ll. Renewal

Unless either party provides written notice of non-renewal at least {{term.noticeDays}} ({{numberToWords term.noticeDays}}) calendar {{pluralize "day" term.noticeDays}} prior to expiration, this Agreement shall automatically renew for successive periods of {{term.renewalMonths}} ({{numberToWords term.renewalMonths}}) {{pluralize "month" term.renewalMonths}} each.

ll. Post-Termination Wind-Down

Upon expiration or termination, {{provider.shortName}} shall have {{term.renewalMonths}} ({{numberToWords term.renewalMonths}}) {{pluralize "month" term.renewalMonths}} to complete any work-in-progress deliverables. The wind-down period shall end no later than {{formatDate (addMonths (addYears effectiveDate term.initialYears) term.renewalMonths) "MMMM D, YYYY"}}.

l. CONFIDENTIALITY

ll. Obligation

Each party ("Receiving Party") shall hold in strict confidence all non-public information of the other party ("Disclosing Party") disclosed in connection with this Agreement ("Confidential Information") and shall not disclose such information to any third party without prior written consent.

ll. Permitted Disclosures

A Receiving Party may disclose Confidential Information to its employees, officers, agents, and advisors on a need-to-know basis, provided such persons are bound by obligations at least as protective as those set forth herein.

ll. Survival

The obligations of this Article shall survive termination or expiration of this Agreement for a period of {{term.initialYears}} ({{numberToWords term.initialYears}}) {{pluralize "year" term.initialYears}} from the date of disclosure.

ll. Return of Materials

Upon written request or termination, the Receiving Party shall promptly return or destroy all Confidential Information and certify such destruction in writing within {{default payment.netDays "30"}} ({{numberToWords payment.netDays}}) {{pluralize "day" payment.netDays}} of such request.

l. INTELLECTUAL PROPERTY

ll. Background IP

Each party retains all right, title, and interest in and to its Background Intellectual Property. Nothing in this Agreement grants either party any license to the other's Background Intellectual Property except as expressly set forth herein.

ll. Deliverable Ownership
{{#if includeNonSolicitation}}

All Deliverables created by {{provider.shortName}} specifically for {{client.shortName}} under this Agreement shall constitute works made for hire to the fullest extent permitted by applicable law. To the extent any Deliverable does not qualify as a work made for hire, {{provider.shortName}} hereby irrevocably assigns to {{client.shortName}} all right, title, and interest therein.
{{else}}

All Deliverables created by {{provider.shortName}} under this Agreement shall be licensed to {{client.shortName}} on a non-exclusive, non-transferable, royalty-free basis for {{client.shortName}}'s internal business operations only.
{{/if}}

ll. Provider Tools and Methodologies

{{provider.shortName}} retains all right, title, and interest in its proprietary tools, methodologies, and know-how, including any improvements thereto developed during the performance of this Agreement.

l. REPRESENTATIONS AND WARRANTIES

ll. Mutual Representations

Each party represents and warrants that: (a) it is duly organized, validly existing, and in good standing under the laws of its jurisdiction of organization; (b) it has full power and authority to enter into and perform this Agreement; and (c) the execution, delivery, and performance of this Agreement does not violate any applicable law or conflict with any agreement to which such party is bound.

ll. Provider Warranties

{{provider.shortName}} additionally warrants that: (a) Services will be performed in a professional and workmanlike manner consistent with industry standards; (b) personnel assigned to this engagement possess the qualifications represented; and (c) {{provider.shortName}} shall maintain errors and omissions insurance with limits of not less than {{formatDollar (multiply payment.retainerAmount 4)}} per occurrence.

ll. Disclaimer
{{#unless includeEscalation}}

EXCEPT AS EXPRESSLY SET FORTH HEREIN, NEITHER PARTY MAKES ANY WARRANTY, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
{{/unless}}

ll. Indemnification Threshold

Claims for indemnification shall not be actionable unless and until aggregate losses exceed {{formatDollar liability.indemnityThreshold}} ({{capitalize (numberToWords liability.indemnityThreshold)}} dollars).

[l. NON-SOLICITATION

ll. Restriction

During the term of this Agreement and for a period of {{term.initialYears}} ({{numberToWords term.initialYears}}) {{pluralize "year" term.initialYears}} following expiration or termination, neither party shall, directly or indirectly, solicit or recruit for employment any personnel of the other party who was involved in the performance of this Agreement.

ll. Liquidated Damages

A breach of this Article shall entitle the non-breaching party to liquidated damages of {{formatDollar (multiply payment.retainerAmount 2)}} ({{capitalize (numberToWords (multiply payment.retainerAmount 2))}} dollars) per breach, the parties acknowledging that actual damages would be difficult to ascertain.

ll. Geographic Scope

This restriction shall apply without geographic limitation.]{includeNonSolicitation}

l. DISPUTE RESOLUTION AND GOVERNING LAW

ll. Governing Law

This Agreement shall be governed by and construed in accordance with the laws of the State of {{governingState}}, without regard to conflict-of-laws principles.

ll. Negotiation

In the event of any dispute arising out of or relating to this Agreement, the parties shall first endeavor to resolve the dispute through good-faith negotiation for a period of not less than {{term.noticeDays}} ({{numberToWords term.noticeDays}}) calendar {{pluralize "day" term.noticeDays}}.

ll. Arbitration

If negotiation fails, disputes shall be submitted to binding arbitration administered by the {{arbitration.rulesBody}} pursuant to its Commercial Arbitration Rules. The arbitration shall be conducted in {{arbitration.venue}}, {{governingState}}, before a panel of {{arbitration.arbitratorCount}} ({{numberToWords arbitration.arbitratorCount}}) {{pluralize "arbitrator" arbitration.arbitratorCount}}.

l. GENERAL PROVISIONS

ll. Entire Agreement

This Agreement, bearing Reference No. {{concat "MSA-" (padStart referenceNumber 5 "0")}}, constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, warranties, and understandings.

ll. Notices

All notices shall be in writing, addressed as follows:

To {{provider.shortName}}: {{titleCase provider.contact.name}}, {{provider.address}}, {{lower provider.contact.email}}

To {{client.shortName}}: {{titleCase client.contact.name}}, {{client.address}}, {{lower client.contact.email}}

ll. Amendments

No amendment shall be effective unless signed by authorized representatives of both parties. Authorized representatives are identified by their initials: Provider ({{upper (initials provider.contact.name)}}) and Client ({{upper (initials client.contact.name)}}).

ll. Counterparts and Electronic Execution

This Agreement may be executed in counterparts, including by electronic signature, each of which shall be deemed an original and all of which together shall constitute one and the same instrument.

ll. Severability

If any provision is held unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.

ll. Effective Date Confirmation

The parties confirm this Agreement effective as of {{@today[medium]}}, corresponding to {{@today[ISO]}}.

---

IN WITNESS WHEREOF, the parties have executed this {{title}} as of the date set forth above.

**{{upper (titleCase provider.legalName)}}**

Signature: ____________________________

Name: {{titleCase provider.contact.name}}

Title: {{truncate (titleCase provider.contact.title) 40 "..."}}

Date: {{@today[EU]}}

Tax ID: {{provider.taxId}}

---

**{{upper (titleCase client.legalName)}}**

Signature: ____________________________

Name: {{titleCase client.contact.name}}

Title: {{truncate (titleCase client.contact.title) 40 "..."}}

Date: {{@today[EU]}}

Tax ID: {{client.taxId}}
