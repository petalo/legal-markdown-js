---
client:
  name: 'Acme Corporation'
  type: 'Corporation'
  industry: 'Manufacturing'
  size: 'Enterprise'
  jurisdiction: 'Delaware'
  registration_number: 'C1234567'
  established: '1985'
contact:
  primary:
    name: 'John Smith'
    title: 'Chief Technology Officer'
    email: 'john.smith@acme.com'
    phone: '+1-555-0123'
  legal:
    name: 'Sarah Johnson'
    title: 'General Counsel'
    email: 'legal@acme.com'
    phone: '+1-555-0124'
  billing:
    name: 'Michael Brown'
    title: 'Chief Financial Officer'
    email: 'billing@acme.com'
    phone: '+1-555-0125'
address:
  headquarters:
    street: '456 Industrial Ave'
    city: 'Manufacturing City'
    state: 'CA'
    zip: '90211'
    country: 'USA'
  billing:
    street: '456 Industrial Ave, Accounts Payable'
    city: 'Manufacturing City'
    state: 'CA'
    zip: '90211'
    country: 'USA'
business_details:
  tax_id: '12-3456789'
  duns_number: '123456789'
  website: 'https://www.acme.com'
  employees: 2500
  annual_revenue: 150000000
liability_cap: 2500000
payment_terms: 'Net 15'
warranty_period: '24 months'
notices:
  client_address: '456 Industrial Ave, Legal Dept, Manufacturing City, CA 90211'
security_clearance: 'required'
insurance_requirements:
  general_liability: 5000000
  professional_liability: 2000000
  cyber_liability: 1000000
compliance:
  standards: ['ISO 9001', 'ISO 27001', 'SOC 2']
  audits: 'annual third-party'
  certifications_required: true
---

## Client Information

### Company Profile

**{{client.name}}** is a {{client.size | downcase}} {{client.type | downcase}}
established in {{client.established}}, operating in the
{{client.industry | downcase}} industry.

- **Type**: {{client.type}}
- **Industry**: {{client.industry}}
- **Jurisdiction**: {{client.jurisdiction}}
- **Registration**: {{client.registration_number}}
- **Employees**: {{business_details.employees | number_with_delimiter}}
- **Annual Revenue**: ${{business_details.annual_revenue | currency}}

### Primary Contacts

#### Technical Contact

- **Name**: {{contact.primary.name}}
- **Title**: {{contact.primary.title}}
- **Email**: {{contact.primary.email}}
- **Phone**: {{contact.primary.phone}}

#### Legal Contact

- **Name**: {{contact.legal.name}}
- **Title**: {{contact.legal.title}}
- **Email**: {{contact.legal.email}}
- **Phone**: {{contact.legal.phone}}

#### Billing Contact

- **Name**: {{contact.billing.name}}
- **Title**: {{contact.billing.title}}
- **Email**: {{contact.billing.email}}
- **Phone**: {{contact.billing.phone}}

### Business Address

**Headquarters:** {{address.headquarters.street}} {{address.headquarters.city}},
{{address.headquarters.state}} {{address.headquarters.zip}}
{{address.headquarters.country}}

**Billing Address:** {{address.billing.street}} {{address.billing.city}},
{{address.billing.state}} {{address.billing.zip}} {{address.billing.country}}

### Business Details

- **Tax ID**: {{business_details.tax_id}}
- **DUNS Number**: {{business_details.duns_number}}
- **Website**: {{business_details.website}}

### Client-Specific Requirements

#### Security

{{#security_clearance}} **Security Clearance**: {{security_clearance | upcase}}
for all personnel working on this engagement. {{/security_clearance}}

#### Insurance Requirements

The following minimum insurance coverage is required:

- **General Liability**:
  ${{insurance_requirements.general_liability | currency}}
- **Professional Liability**:
  ${{insurance_requirements.professional_liability | currency}}
- **Cyber Liability**: ${{insurance_requirements.cyber_liability | currency}}

#### Compliance Standards

{{client.name}} requires compliance with the following standards:
{{#compliance.standards}}

- {{.}} {{/compliance.standards}}

**Audit Requirements**: {{compliance.audits}} **Certifications Required**:
{{compliance.certifications_required}}
