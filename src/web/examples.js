/**
 * Legal Markdown Examples
 * Pre-configured document examples for the web playground
 */

window.LegalMarkdownExamples = {
  'service-agreement': {
    title: 'Services Agreement',
    content: `---
title: Services Agreement
party_a: ACME Corporation
party_b: John Smith
effective_date: 2023-07-01
payment_amount: 5000
payment_currency: USD
include_confidentiality: true
include_non_compete: false
jurisdiction: California
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
meta:
  version: 1.0
  status: draft
  category: contract
meta-json-output: examples/output/metadata.json
---

# Services Agreement

This Services Agreement (the "Agreement") is entered into as of
\{\{effective_date\}\} by and between \{\{party_a\}\} ("Client") and \{\{party_b\}\}
("Service Provider").

l. SERVICES

ll. Scope of Services Service Provider agrees to provide Client with consulting
services as described in Exhibit A attached hereto (the "Services").

ll. Performance Service Provider shall perform the Services in a professional
and workmanlike manner and in accordance with industry standards.

l. COMPENSATION

ll. Fees Client shall pay Service Provider the sum of $\{\{payment_amount\}\} as
compensation for the Services.

ll. Payment Terms Payment shall be made within 30 days of receiving an invoice
from Service Provider.

l. TERM AND TERMINATION

ll. Term This Agreement shall commence on the Effective Date and shall continue
until the Services are completed, unless earlier terminated.

ll. Termination for Convenience Either party may terminate this Agreement upon
30 days written notice to the other party.

[l. CONFIDENTIALITY

ll. Definition "Confidential Information" means any information disclosed by one
party to the other, either directly or indirectly, in writing, orally or by
inspection of tangible objects, which is designated as "Confidential" or would
reasonably be understood to be confidential or proprietary.

ll. Non-Disclosure Each party agrees not to disclose any Confidential
Information of the other party to any third party and to protect the
confidentiality of the disclosed Confidential Information with the same degree
of care as it uses to protect its own confidential
information.]\{include_confidentiality\}

[l. NON-COMPETITION

ll. Restriction During the term of this Agreement and for a period of one year
thereafter, Service Provider shall not directly or indirectly engage in any
business that competes with Client.

ll. Geographic Scope This restriction shall apply within a 50-mile radius of
Client's principal place of business.]\{include_non_compete\}

l. GENERAL PROVISIONS

ll. Governing Law This Agreement shall be governed by the laws of the State of
\{\{jurisdiction\}\}.

ll. Entire Agreement This Agreement constitutes the entire agreement between the
parties with respect to the subject matter hereof.

ll. Amendments No amendment to this Agreement will be effective unless it is in
writing and signed by both parties.

ll. Counterparts This Agreement may be executed in counterparts, each of which
shall be deemed an original.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the
date first above written.

CLIENT: \{\{party_a\}\}

SERVICE PROVIDER: \{\{party_b\}\}`
  },

  'demo-contract': {
    title: 'Software Development Agreement',
    content: `---
title: Software Development Agreement
date: @today
client:
  name: Tech Innovations Inc
  address: 123 Silicon Valley Blvd, CA 94025
  contact: john.doe@techinnovations.com
vendor:
  name: DevSolutions LLC
  address: 456 Code Street, SF, CA 94105
  contact:
project:
  name: Mobile Banking App
  duration: 6 months
  budget: 150000
payment:
  terms: Net 30
  late_fee: true
  fee_percentage: 2
---

# \{\{title\}\}

**Date**: \{\{date\}\}

## PARTIES

This agreement is between:

**CLIENT**: \{\{client.name\}\}
\{\{client.address\}\}
Contact: \{\{client.contact\}\}

**VENDOR**: \{\{vendor.name\}\}
\{\{vendor.address\}\}
Contact: \{\{vendor.contact\}\}

## PROJECT DETAILS

Project Name: **\{\{project.name\}\}**
Duration: \{\{project.duration\}\}
Total Budget: $\{\{project.budget\}\}

## PAYMENT TERMS

Payment terms: \{\{payment.terms\}\}

[Late payments will incur a \{\{payment.fee_percentage\}\}% monthly fee.]{payment.late_fee}

## SIGNATURES

---

**Client Representative**

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**Vendor Representative**

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_`
  },

  'lease-contract': {
    title: 'Office Lease Agreement',
    content: `---
title: OFFICE SPACE LEASE AGREEMENT
contract:
  signing_date: 2024-01-15
  signing_city: San Francisco
lessor:
  company_name: Property Management LLC
  registered_address: 123 Main Street, San Francisco, CA 94105
  tax_id: 12-3456789
  representative:
    full_name: John Smith
    id_number: 123456789
lessee:
  company_name: Tech Startup Inc
  registered_address: 456 Innovation Way, San Francisco, CA 94107
  tax_id: 98-7654321
  representative:
    full_name: Jane Doe
    id_number: ""
property:
  address: 789 Business Plaza, Suite 500, San Francisco, CA 94108
  area_sqm: 250
  parking_spots: 5
payment:
  monthly_rent:
    text: Five Thousand
    number: 5000
  late_fee_applies: true
  late_fee_percentage: 1.5
maintenance_included: true
maintenance:
  included_services:
    - Daily cleaning
    - HVAC maintenance
    - Security services
---

# \{\{title\}\}

This agreement is entered into on \{\{contract.signing_date\}\} in \{\{contract.signing_city\}\}.

## Parties

Between:

**\{\{lessor.company_name\}\}**, with registered office at \{\{lessor.registered_address\}\}, and Tax ID \{\{lessor.tax_id\}\}, hereinafter referred to as "THE LESSOR".

Represented by \{\{lessor.representative.full_name\}\} with ID \{\{lessor.representative.id_number\}\}.

And:

**\{\{lessee.company_name\}\}**, with registered office at \{\{lessee.registered_address\}\}, and Tax ID \{\{lessee.tax_id\}\}, hereinafter referred to as "THE LESSEE".

Represented by \{\{lessee.representative.full_name\}\} with ID \{\{lessee.representative.id_number\}\}.

## Property Details

- **Address**: \{\{property.address\}\}
- **Area**: \{\{property.area_sqm\}\} square meters
- **Parking Spots**: \{\{property.parking_spots\}\}
- **Monthly Rent**: \{\{payment.monthly_rent.text\}\} (\{\{payment.monthly_rent.number\}\}) USD

[## Late Payment Clause

Late payments will incur a fee of \{\{payment.late_fee_percentage\}\}% per month.]{payment.late_fee_applies}

[## Maintenance

The following maintenance services are included:
\{\{#maintenance_included\}\}
\{\{#each maintenance.included_services\}\}
- \{\{this\}\}
\{\{/each\}\}
\{\{/maintenance_included\}\}]{maintenance_included}`
  },

  'purchase-ticket': {
    title: 'Purchase Ticket',
    content: `---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: "12345"
receiptId: RCP-2024-12345
taxRate: 8.5
items:
  - name: Laptop Computer
    price: 999.99
    onSale: false
  - name: Wireless Mouse
    price: 29.99
    onSale: true
  - name: USB Cable
    price: null
subtotal: 1029.98
taxAmount: 87.55
total: 1117.53
loyaltyMember: true
pointsEarned: 112
pointsBalance: 1523
---

# Purchase Ticket - \{\{ticketNumber\}\}

**Date:** @today **Store:** \{\{storeName\}\}
**Cashier:** \{\{cashierName\}\}

## Purchased Items

\{\{#items\}\}
- \{\{name\}\} [\$\{\{price\}\}]{price} [(ON SALE!)]{onSale}
\{\{/items\}\}

## Payment Details

- Subtotal: $\{\{subtotal\}\}
- Tax (\{\{taxRate\}\}%): $\{\{taxAmount\}\}
- **Total**: $\{\{total\}\}

\{\{#loyaltyMember\}\}
## Customer Loyalty

- Member Points Earned: \{\{pointsEarned\}\}
- Current Balance: \{\{pointsBalance\}\}
\{\{/loyaltyMember\}\}

---

Thank you for shopping with us!
Receipt ID: \{\{receiptId\}\}`
  },

  'nda': {
    title: 'Non-Disclosure Agreement',
    content: `---
title: NON-DISCLOSURE AGREEMENT
disclosing_party: TechCorp Inc.
receiving_party: John Developer
effective_date: 2024-01-01
duration_months: 24
jurisdiction: Delaware
---

# \{\{title\}\}

This \{\{title\}\} is entered into on \{\{effective_date\}\} between:

**DISCLOSING PARTY**: \{\{disclosing_party\}\}
**RECEIVING PARTY**: \{\{receiving_party\}\}

l. Definition of Confidential Information
ll. Confidential Information includes all technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.

l. Obligations of Receiving Party
ll. Protection of Confidential Information
The Receiving Party agrees to hold and maintain the Confidential Information in strict confidence.

ll. Non-Disclosure
The Receiving Party agrees not to disclose any Confidential Information to third parties without prior written consent.

ll. Use Restriction
The Receiving Party agrees to use the Confidential Information solely for the purpose of evaluating potential business opportunities.

l. Term
This Agreement shall remain in effect for \{\{duration_months\}\} months from the effective date.

l. Governing Law
This Agreement shall be governed by the laws of \{\{jurisdiction\}\}.

l. Signatures
By signing below, both parties agree to the terms and conditions of this Agreement.

**\{\{disclosing_party\}\}**

Signature: ___________________________ Date: ___________

**\{\{receiving_party\}\}**

Signature: ___________________________ Date: ___________`
  },

  'employment-contract': {
    title: 'Employment Contract',
    content: `---
title: EMPLOYMENT AGREEMENT
company: TechCorp Inc.
employee: Jane Smith
position: Senior Software Engineer
start_date: 2024-02-01
salary: 95000
benefits_package: Standard
probation_period: 3
vacation_days: 20
---

# \{\{title\}\}

This \{\{title\}\} is entered into between:

**COMPANY**: \{\{company\}\}
**EMPLOYEE**: \{\{employee\}\}

l. Position and Duties
ll. Position
The Employee is hereby employed as \{\{position\}\}.

ll. Start Date
Employment shall commence on \{\{start_date\}\}.

ll. Probationary Period
The Employee shall serve a probationary period of \{\{probation_period\}\} months.

l. Compensation and Benefits
ll. Salary
The Employee shall receive an annual salary of $\{\{salary\}\}.

ll. Benefits
The Employee shall be entitled to the \{\{benefits_package\}\} benefits package.

ll. Vacation
The Employee shall be entitled to \{\{vacation_days\}\} vacation days per year.

l. Termination
ll. Either party may terminate this agreement with 30 days written notice.

l. Confidentiality
ll. The Employee agrees to maintain the confidentiality of all company information.

l. Governing Law
This Agreement shall be governed by the laws of the state in which the Company is located.

**Signatures**

Company Representative: ___________________________ Date: ___________

Employee: ___________________________ Date: ___________`
  },

  'features-demo': {
    title: 'Legal Markdown Features Demo',
    content: `---
# This is a comprehensive playground document to demonstrate all Legal Markdown JS features
title: Legal Markdown JS - Features Playground
document_type: Interactive Demo
doc_version: v2.0

# Basic Document Information
client_name: john doe
company_name: acme corporation
project_name: legal markdown integration
contract_amount: 50000
currency: USD
payment_terms: 30
jurisdiction: California

# Date Variables
start_date: 2024-01-15
end_date: 2024-12-31
project_duration: 12

# Nested Objects
client:
  company:
    name: Acme Corporation
    address:
      street: 123 Business St
      city: San Francisco
      state: CA
      zip: 94105
  contact:
    name: John Smith
    email: john.smith@acme.com
    phone: (555) 123-4567

# Arrays for Loops
services:
  - name: Web Development
    hours: 120
    rate: 150
    description: Frontend and backend development
  - name: UI/UX Design
    hours: 60
    rate: 120
    description: User interface and experience design
  - name: Project Management
    hours: 40
    rate: 100
    description: Project coordination and management

team_members:
  - name: Alice Johnson
    role: Senior Developer
  - name: Bob Wilson
    role: Designer
  - name: Carol Davis
    role: Project Manager

# Boolean Variables
includes_warranty: true
warranty_period: 12
premium_support: true
confidentiality_required: true
international_project: false

# Numerical Variables
tax_rate: 0.21
discount_rate: 0.15
population: 1234567
sequence_number: 42

# Legal Header Levels
level-1: "%n."
level-2: "%l1.%n"
level-3: "%l1.%l2.%n"
---

# \{\{title\}\}

_This document demonstrates Legal Markdown JS features in the web playground._

**Document Type:** \{\{document_type\}\}
**Version:** \{\{doc_version\}\}
**Generated:** @today

---

l. Basic Variable Substitution

ll. Simple Variables
Client: \{\{client_name\}\}
Company: \{\{company_name\}\}
Project: \{\{project_name\}\}
Amount: $\{\{contract_amount\}\}
Currency: \{\{currency\}\}
Payment Terms: \{\{payment_terms\}\} days
Jurisdiction: \{\{jurisdiction\}\}

ll. Nested Object Access
Company Name: \{\{client.company.name\}\}
Address: \{\{client.company.address.street\}\}, \{\{client.company.address.city\}\}, \{\{client.company.address.state\}\} \{\{client.company.address.zip\}\}
Contact: \{\{client.contact.name\}\} (\{\{client.contact.email\}\})
Phone: \{\{client.contact.phone\}\}

ll. Array Access
First Service: \{\{services.0.name\}\} - \{\{services.0.hours\}\} hours at $\{\{services.0.rate\}\}/hour
Second Service: \{\{services.1.name\}\} - \{\{services.1.hours\}\} hours at $\{\{services.1.rate\}\}/hour
Third Service: \{\{services.2.name\}\} - \{\{services.2.hours\}\} hours at $\{\{services.2.rate\}\}/hour
Team Lead: \{\{team_members.0.name\}\} (\{\{team_members.0.role\}\})

l. String Helpers

ll. Case Conversion
Original: \{\{client_name\}\}
Capitalized: \{\{capitalize(client_name)\}\}
Title Case: \{\{titleCase(client_name)\}\}
Uppercase: \{\{upper(client_name)\}\}
Lowercase: \{\{lower(client_name)\}\}
Words Capitalized: \{\{capitalizeWords(client_name)\}\}
Test Simple: \{\{upper("test")\}\}

ll. String Manipulation
Initials: \{\{initials(client_name)\}\}
Truncated Project: \{\{truncate(project_name, 15, "...")\}\}
Replaced Spaces: \{\{replaceAll(client_name, " ", "_")\}\}
Cleaned Text: \{\{clean("  extra   spaces  ")\}\}

ll. Case Conversions
camelCase: \{\{camelCase(client_name)\}\}
PascalCase: \{\{pascalCase(client_name)\}\}
kebab-case: \{\{kebabCase(client_name)\}\}
snake_case: \{\{snakeCase(client_name)\}\}

l. Date Processing

ll. Today Date Processing
Today (default): @today
Today (ISO): @today[iso]
Today (long): @today[long]
Today (European): @today[european]
Today (legal): @today[legal]

ll. Date Helpers with Variables
Start Date: \{\{formatDate(start_date, "MMMM Do, YYYY")\}\}
End Date: \{\{formatDate(end_date, "MMMM Do, YYYY")\}\}
Contract Duration: \{\{project_duration\}\} months

ll. Date Calculations with Date Variables
Future Date (1 year): \{\{formatDate(addYears(start_date, 1), "YYYY-MM-DD")\}\}
Future Date (6 months): \{\{formatDate(addMonths(start_date, 6), "MMMM YYYY")\}\}
Future Date (30 days): \{\{formatDate(addDays(start_date, 30), "DD/MM/YYYY")\}\}
Payment Due: \{\{formatDate(addDays(start_date, payment_terms), "MMMM Do, YYYY")\}\}

l. Number Helpers

ll. Currency Formatting
Dollar Format: \{\{formatDollar(contract_amount)\}\}
Euro Format: \{\{formatEuro(contract_amount)\}\}
Pound Format: \{\{formatPound(contract_amount)\}\}
Currency USD: \{\{formatCurrency(contract_amount, "USD")\}\}
Currency EUR: \{\{formatCurrency(contract_amount, "EUR")\}\}
Currency GBP: \{\{formatCurrency(contract_amount, "GBP")\}\}

ll. Number Formatting
Population: \{\{formatInteger(population)\}\}
Tax Rate: \{\{formatPercent(tax_rate, 1)\}\}
Discount: \{\{formatPercent(discount_rate, 2)\}\}
Rounded Tax: \{\{round(tax_rate, 2)\}\}

ll. Numbers to Words
Sequence: \{\{numberToWords(sequence_number)\}\}
Amount: \{\{capitalize(numberToWords(contract_amount))\}\}

l. Conditional Content

ll. Basic Conditionals
[This project includes warranty coverage.]{includes_warranty}
[Premium support is included in this package.]{premium_support}
[This is a confidential project.]{confidentiality_required}
[This is an international project.]{international_project}

ll. Conditional Expressions
[Support Level: Premium Support Included]{premium_support}
[Project Type: International Project]{international_project}
[Warranty Status: Warranty Included]{includes_warranty}

l. Template Loops

ll. Services List
\{\{#services\}\}
- **\{\{name\}\}**: \{\{description\}\}
  - Hours: \{\{hours\}\}
  - Rate: $\{\{rate\}\}/hour
\{\{/services\}\}

ll. Team Members
\{\{#team_members\}\}
- **\{\{name\}\}** (\{\{role\}\})
\{\{/team_members\}\}

ll. Conditional Loop
\{\{#includes_warranty\}\}
## Warranty Information

This project includes a \{\{warranty_period\}\}-month warranty period.
Warranty expires: \{\{formatDate(addMonths(start_date, warranty_period), "MMMM Do, YYYY")\}\}
\{\{/includes_warranty\}\}

l. Advanced Features

ll. Nested Helpers
Formatted Client: \{\{upper(titleCase(client_name))\}\}
Contract ID: \{\{upper(initials(client_name))\}\}-@today[medium]
Clean Company: \{\{titleCase(replaceAll(company_name, " ", "_"))\}\}
Short Project: \{\{upper(truncate(project_name, 10, "..."))\}\}

ll. Currency Examples
First Service (120h × $150): \{\{formatDollar(18000)\}\}
Second Service (60h × $120): \{\{formatDollar(7200)\}\}
Third Service (40h × $100): \{\{formatDollar(4000)\}\}
Total Hours: \{\{services.0.hours\}\} + \{\{services.1.hours\}\} + \{\{services.2.hours\}\} = 220

ll. Pluralization
Duration: \{\{project_duration\}\} \{\{pluralize("month", project_duration)\}\}
Payment Terms: \{\{payment_terms\}\} \{\{pluralize("day", payment_terms)\}\}
Warranty: \{\{warranty_period\}\} \{\{pluralize("month", warranty_period)\}\}

l. Legal Document Structure

ll. Definitions
For purposes of this Agreement:
- "Client" means \{\{titleCase(client_name)\}\}
- "Company" means \{\{client.company.name\}\}
- "Project" means \{\{project_name\}\}
- "Effective Date" means @today[long]

ll. Terms and Conditions
This Agreement is effective as of @today[long] and shall remain in effect for \{\{project_duration\}\} months.

lll. Payment Terms
Payment shall be due within \{\{payment_terms\}\} \{\{pluralize("day", payment_terms)\}\} of invoice date.

lll. Tax Information
Applicable tax rate is \{\{formatPercent(tax_rate, 1)\}\} as determined by \{\{jurisdiction\}\} law.

ll. Governing Law
This Agreement shall be governed by the laws of \{\{jurisdiction\}\}.

l. Signature Lines

Legal Markdown automatically detects and styles signature lines (10+ underscores):

ll. Basic Signature Block
**Client Representative**

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

ll. Multiple Signatures
Client: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_\_

Witness: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_\_

l. Document Summary

**Document Information:**
- Generated: @today[legal]
- Client: \{\{titleCase(client_name)\}\} (\{\{initials(client_name)\}\})
- Project: \{\{project_name\}\}
- Duration: \{\{project_duration\}\} \{\{pluralize("month", project_duration)\}\}
- Total Value: \{\{formatDollar(contract_amount)\}\}
- Payment Terms: \{\{payment_terms\}\} \{\{pluralize("day", payment_terms)\}\}
- Tax Rate: \{\{formatPercent(tax_rate, 1)\}\}

---

_This document serves as a practical demonstration of Legal Markdown JS capabilities in the web playground._`
  }
};
