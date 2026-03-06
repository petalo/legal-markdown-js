---
title: "Master Services Billing Schedule"
amount: 125000.5
amount_eur: 98350.4
interest_rate: 0.0875
total_units: 1450000
unit_price: 79.987
total_amount: 125000.5
invoice_number: 4281
ref_code: "EU-9X"
tax_rate: 0.21
---

# {{title}}

This schedule records financial terms for recurring legal automation services.

## Headline Amounts

- USD amount: {{formatCurrency amount "USD"}}
- EUR amount: {{formatCurrency amount_eur "EUR" 2}}
- Interest rate: {{formatPercent interest_rate}}
- Units committed: {{formatInteger total_units}}
- Rounded unit price: {{round unit_price 2}}
- Amount in words: {{numberToWords total_amount}}
- Invoice code: {{padStart invoice_number 6 "0"}}
- Reference code: {{padEnd ref_code 10 "."}}

## Numeric Presentation Table

| Metric | Value |
| --- | --- |
| Base service fee (USD) | {{formatCurrency amount "USD"}} |
| Base service fee (EUR) | {{formatCurrency amount_eur "EUR" 2}} |
| Statutory interest | {{formatPercent interest_rate}} |
| Total billable units | {{formatInteger total_units}} |
| Rounded unit cost | {{round unit_price 2}} |
| Tax estimate | {{formatCurrency (multiply amount tax_rate) "USD"}} |
| Gross estimate | {{formatCurrency (add amount (multiply amount tax_rate)) "USD"}} |
