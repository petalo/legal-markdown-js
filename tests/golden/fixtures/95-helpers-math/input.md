---
title: "Consulting Invoice Calculation Sheet"
subtotal: 8400
tax_amount: 1764
gross_amount: 12000
deductions: 1450
unit_price: 280
quantity: 30
total_amount: 10120
num_installments: 4
invoice_number: 3157
balance: -920
offer_a: 12500
offer_b: 13250
penalty_a: 900
penalty_b: 1250
---

# {{title}}

## Core Calculations

- Subtotal + tax = {{add subtotal tax_amount}}
- Gross - deductions = {{subtract gross_amount deductions}}
- Unit price × quantity = {{multiply unit_price quantity}}
- Installment amount = {{divide total_amount num_installments}}
- Invoice parity check (mod 2) = {{modulo invoice_number 2}}

## Settlement Analysis

- Absolute balance via conditional: {{#if (lt balance 0)}}{{multiply balance -1}}{{else}}{{balance}}{{/if}}
- Best offer value: {{#if (gt offer_a offer_b)}}{{offer_a}}{{else}}{{offer_b}}{{/if}}
- Minimum penalty: {{#if (lt penalty_a penalty_b)}}{{penalty_a}}{{else}}{{penalty_b}}{{/if}}
