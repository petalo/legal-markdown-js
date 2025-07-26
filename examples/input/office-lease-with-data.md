---
contract:
  title: Office Lease Agreement
  date: @today
  number: OL-2024-001
  type: Office Lease
  version: 1.0
  status: Draft
  language: EN
  cure_period_days: 30
  end_date: January 31st 2027
  governing_law: England and Wales
  initial_term_years: 3
  jurisdiction: London
  renewal_notice_months: 6
  renewal_term_years: 2
  signing_city: London
  signing_date: @today
  start_date: February 1st 2024
default:
  events:
    - Failure to pay rent within 5 days of due date
    - "" # Empty - will be highlighted
    - Filing for bankruptcy or insolvency
    - Abandonment of the premises
  remedies:
    - Right to terminate the lease
    - Right to recover all unpaid rent
    - Right to recover damages
    - Right to re-enter and take possession
insurance:
  lessee_requirements:
    - "" # Empty field 1
    - "" # Empty field 2
    - "" # Empty field 3
    - Workers' compensation insurance
  lessor_requirements:
    - Building insurance
    - Public liability insurance
    - Property damage insurance
lessee:
  company_name: TechStart Solutions Ltd
  notice_address: "Legal Department, TechStart Solutions Ltd, 100 Liverpool Street, London EC2M 2RH"
  registered_address: "100 Liverpool Street, London EC2M 2RH"
  representative:
    full_name: "" # Empty - will be highlighted
    id_number: PB654321C
  tax_id: "" # Empty - will be highlighted
lessor:
  company_name: Canary Office Spaces Ltd
  notice_address: "Legal Department, Canary Office Spaces Ltd, 25 Canada Square, Canary Wharf, London E14 5LQ"
  registered_address: "25 Canada Square, Canary Wharf, London E14 5LQ"
  representative:
    full_name: James William Smith
    id_number: PA123456B
  tax_id: GB123456789
payment:
  annual_rent:
    number: 270000
    text: two hundred and seventy thousand
  due_day: 5
  maximum_increase_percentage: 5
  minimum_increase_percentage: 2
  monthly_rent:
    number: 22500
    text: twenty-two thousand five hundred
  security_deposit_months: 2
  security_deposit:
    number: 45000
    text: forty-five thousand
property:
  name: Innovation Tower
  address: "789 Business Blvd, New York, NY 10002"
  floor_number: 15
  area_sqm: 232.26
  parking_spots: 2
maintenance:
  lessee_obligations:
    - Interior walls and finishes
    - Floor coverings
    - Light fixtures
    - Internal electrical systems
    - Office furniture and equipment
  lessor_obligations:
    - Structural elements
    - Building envelope
    - Common areas
    - HVAC systems
    - Elevators
services:
  included:
    - Water
    - Electricity
    - Internet
    - Heating
    - Air Conditioning
    - Cleaning
    - Security
    - Maintenance
  additional:
    - Electricity consumption
    - Internet and telecommunications
    - Additional cleaning services
    - Contents insurance
    - Business rates
---

# OFFICE SPACE LEASE AGREEMENT <!-- omit in toc -->

<p class="confidential" id="confidential-header">PRIVATE AND CONFIDENTIAL</p>

In {{contract.signing_city}}, on {{contract.signing_date}}

Between:

**{{lessor.company_name}}**, with registered office at
{{lessor.registered_address}}, and Tax ID {{lessor.tax_id}}, hereinafter
referred to as "THE LESSOR". And on its behalf, acknowledging having legal
capacity to sign this agreement, {{lessor.representative.full_name}} with ID
{{lessor.representative.id_number}}.

And:

**{{lessee.company_name}}**, with registered office at
{{lessee.registered_address}}, and Tax ID
{{lessee.tax_id ? lessee.tax_id : "[TAX ID REQUIRED]"}}, hereinafter referred to
as "THE LESSEE". And on its behalf,
{{lessee.representative.full_name ? lessee.representative.full_name : "[REPRESENTATIVE NAME REQUIRED]"}}
with ID {{lessee.representative.id_number}}.

**The following is hereby agreed**:

## 1. Object of the Agreement

The LESSOR hereby leases to the LESSEE, who accepts, the office space located at
{{property.address}}, with a total area of {{property.area_sqm}} square meters,
distributed across {{property.floor_number}} floor(s), including
{{property.parking_spots}} parking spaces, hereinafter referred to as "THE
PREMISES".

## 2. Term and Renewal

This lease agreement shall commence on {{contract.start_date}} and shall
continue for an initial term of {{contract.initial_term_years}} years, ending on
{{contract.end_date}}.

The LESSEE shall have the option to extend this lease for additional periods of
{{contract.renewal_term_years}} years each, by providing written notice to the
LESSOR at least {{contract.renewal_notice_months}} months prior to the
expiration of the then-current term.

## 3. Rent and Payment Terms

### 3.1. Base Rent

The monthly rent shall be **£{{payment.monthly_rent.number}}**
({{payment.monthly_rent.text}} pounds sterling).

The annual rent shall be **£{{payment.annual_rent.number}}**
({{payment.annual_rent.text}} pounds sterling).

### 3.2. Payment Schedule

Rent is due and payable on the {{payment.due_day}}th day of each month, in
advance, without any deduction or set-off whatsoever.

### 3.3. Rent Increases

The rent shall be subject to annual review and may be increased by a minimum of
{{payment.minimum_increase_percentage}}% and a maximum of
{{payment.maximum_increase_percentage}}% per annum.

### 3.4. Security Deposit

The LESSEE shall provide a security deposit equivalent to
{{payment.security_deposit_months}} months' rent, totaling
**£{{payment.security_deposit.number}}** ({{payment.security_deposit.text}}
pounds sterling).

## 4. Services and Utilities

### 4.1. Included Services

The following services are included in the monthly rent:

{{#services.included}}

- {{.}} {{/services.included}}

### 4.2. Additional Services

The following services shall be contracted and paid for separately by the
LESSEE:

{{#services.additional}}

- {{.}} {{/services.additional}}

## 5. Maintenance and Repairs

### 5.1. Lessor's Obligations

The LESSOR shall be responsible for maintaining:

{{#maintenance.lessor_obligations}}

- {{.}} {{/maintenance.lessor_obligations}}

### 5.2. Lessee's Obligations

The LESSEE shall be responsible for maintaining:

{{#maintenance.lessee_obligations}}

- {{.}} {{/maintenance.lessee_obligations}}

## 6. Insurance Requirements

### 6.1. Lessor's Insurance

The LESSOR shall maintain the following insurance coverage:

{{#insurance.lessor_requirements}}

- {{.}} {{/insurance.lessor_requirements}}

### 6.2. Lessee's Insurance

The LESSEE shall obtain and maintain:

{{#insurance.lessee_requirements}}

- {{.}} {{/insurance.lessee_requirements}}

## 7. Default and Remedies

### 7.1. Events of Default

The following shall constitute events of default:

{{#default.events}}

- {{.}} {{/default.events}}

### 7.2. Remedies

Upon an event of default, the LESSOR may exercise the following remedies:

{{#default.remedies}}

- {{.}} {{/default.remedies}}

### 7.3. Cure Period

The LESSEE shall have {{contract.cure_period_days}} days to cure any default
after written notice from the LESSOR.

## 8. General Provisions

### 8.1. Governing Law

This agreement shall be governed by the laws of {{contract.governing_law}}.

### 8.2. Jurisdiction

The courts of {{contract.jurisdiction}} shall have exclusive jurisdiction over
any disputes arising from this agreement.

### 8.3. Notices

All notices shall be sent to:

**LESSOR**: {{lessor.notice_address}}

**LESSEE**: {{lessee.notice_address}}

## 9. Signatures

IN WITNESS WHEREOF, the parties have executed this agreement on the date first
written above.

**THE LESSOR**

---

{{lessor.representative.full_name}}  
ID: {{lessor.representative.id_number}}  
Date: **\*\***\_**\*\***

**THE LESSEE**

---

{{lessee.representative.full_name ? lessee.representative.full_name : "[Name]"}}  
ID:
{{lessee.representative.id_number}}  
Date: **\*\***\_**\*\***
