---
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

# {{title}}

**Date**: {{date}}

## PARTIES

This agreement is between:

**CLIENT**: {{client.name}}  
{{client.address}}  
Contact: {{client.contact}}

**VENDOR**: {{vendor.name}}  
{{vendor.address}}  
Contact: {{vendor.contact ? vendor.contact : "[Contact Required]"}}

## PROJECT DETAILS

Project Name: **{{project.name}}**  
Duration: {{project.duration}}  
Total Budget: ${{project.budget}}

## PAYMENT TERMS

Payment terms: {{payment.terms}}

{{payment.late_fee ? "Late payments will incur a " + payment.fee_percentage + "% monthly fee." : "No late fees apply."}}

## SIGNATURES

---

Client Representative  
Date: \***\*\_\_\_\_\*\***

---

Vendor Representative  
Date: \***\*\_\_\_\_\*\***
