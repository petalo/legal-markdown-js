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
{{lessee.registered_address}}, and Tax ID {{lessee.tax_id}}, hereinafter
referred to as "THE LESSEE". And on its behalf,
{{lessee.representative.full_name}} with ID {{lessee.representative.id_number}}.

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

The annual base rent for THE PREMISES shall be {{payment.annual_rent.text}}
({{payment.annual_rent.number}}) euros, payable in monthly installments of
{{payment.monthly_rent.text}} ({{payment.monthly_rent.number}}) euros.

### 3.2. Payment Schedule

Monthly rent payments shall be made in advance on or before the
{{payment.due_day}} day of each month by bank transfer to the LESSOR's
designated account.

### 3.3. Security Deposit

Upon execution of this agreement, the LESSEE shall provide a security deposit
equal to {{payment.security_deposit.text}} ({{payment.security_deposit.number}})
euros, equivalent to {{payment.security_deposit_months}} months' rent.

### 3.4. Rent Adjustments

The base rent shall be adjusted annually on the anniversary of the commencement
date according to the Consumer Price Index (CPI) published by the National
Statistics Institute, with a minimum increase of
{{payment.minimum_increase_percentage}}% and a maximum increase of
{{payment.maximum_increase_percentage}}%.

## 4. Utilities and Operating Expenses

### 4.1. Included Services

The following services are included in the base rent:

{{#services.included}}

- {{.}} {{/services.included}}

### 4.2. Additional Expenses

The LESSEE shall be responsible for:

{{#services.additional}}

- {{.}} {{/services.additional}}

## 5. Use of Premises

### 5.1. Permitted Use

THE PREMISES shall be used solely for office purposes and related business
activities. Any change in use must be approved in writing by the LESSOR.

### 5.2. Compliance with Laws

The LESSEE shall comply with all applicable laws, regulations, and building
codes regarding the use of THE PREMISES.

### 5.3. Building Access

The LESSEE shall have access to THE PREMISES 24 hours a day, 7 days a week,
subject to reasonable security procedures and building rules.

## 6. Maintenance and Repairs

### 6.1. LESSOR's Obligations

The LESSOR shall maintain in good condition and repair:

{{#maintenance.lessor_obligations}}

- {{.}} {{/maintenance.lessor_obligations}}

### 6.2. LESSEE's Obligations

The LESSEE shall maintain in good condition and repair:

{{#maintenance.lessee_obligations}}

- {{.}} {{/maintenance.lessee_obligations}}

## 7. Alterations and Improvements

### 7.1. LESSEE's Rights

The LESSEE may make non-structural alterations or improvements to THE PREMISES
with prior written consent from the LESSOR, which shall not be unreasonably
withheld.

### 7.2. Ownership of Improvements

All permanent improvements made by the LESSEE shall become the property of the
LESSOR upon installation, unless otherwise agreed in writing.

## 8. Insurance and Liability

### 8.1. LESSEE's Insurance

The LESSEE shall maintain:

{{#insurance.lessee_requirements}}

- {{.}} {{/insurance.lessee_requirements}}

### 8.2. LESSOR's Insurance

The LESSOR shall maintain:

{{#insurance.lessor_requirements}}

- {{.}} {{/insurance.lessor_requirements}}

## 9. Assignment and Subletting

The LESSEE shall not assign this lease or sublet any portion of THE PREMISES
without prior written consent from the LESSOR, which shall not be unreasonably
withheld.

## 10. Default and Remedies

### 10.1. Events of Default

The following shall constitute events of default:

{{#default.events}}

- {{.}} {{/default.events}}

### 10.2. Remedies

Upon default, the non-defaulting party shall have the following remedies:

{{#default.remedies}}

- {{.}} {{/default.remedies}}

## 11. Termination

### 11.1. Early Termination

Either party may terminate this lease upon material breach by the other party,
following a {{contract.cure_period_days}}-day cure period after written notice
of such breach.

### 11.2. Surrender of Premises

Upon termination, the LESSEE shall surrender THE PREMISES in good condition,
reasonable wear and tear excepted.

## 12. Notices

All notices shall be in writing and delivered to:

For the LESSOR: {{lessor.notice_address}}

For the LESSEE: {{lessee.notice_address}}

## 13. Governing Law and Jurisdiction

This agreement shall be governed by the laws of {{contract.governing_law}}. Any
disputes shall be resolved in the courts of {{contract.jurisdiction}}.

## 14. Signatures

In witness whereof, the parties have executed this lease agreement:

<div class="signatures">
In {{contract.signing_city}}, on {{contract.signing_date}}

| Party              | Signatory                           |
| ------------------ | ----------------------------------- |
| **For THE LESSOR** | {{lessor.representative.full_name}} |
| **For THE LESSEE** | {{lessee.representative.full_name}} |

</div>
