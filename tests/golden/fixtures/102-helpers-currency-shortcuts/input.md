---
monthly_fee: 2500
annual_license: 18000.50
consulting_rate: 150.75
vat_rate: 0.21
penalty_gbp: 5000
---

# Currency Shortcut Helpers

These helpers format amounts in specific currencies without needing to pass
the currency code each time.

## formatDollar

Monthly fee: {{formatDollar monthly_fee}}

Consulting rate: {{formatDollar consulting_rate}}

## formatEuro

Annual license: {{formatEuro annual_license}}

Monthly fee: {{formatEuro monthly_fee}}

## formatPound

Penalty amount: {{formatPound penalty_gbp}}

Consulting rate: {{formatPound consulting_rate}}

## Comparison with formatCurrency

The following should produce equivalent results:

| Method | USD | EUR |
|--------|-----|-----|
| Shortcut | {{formatDollar monthly_fee}} | {{formatEuro monthly_fee}} |
| Explicit | {{formatCurrency monthly_fee "USD"}} | {{formatCurrency monthly_fee "EUR"}} |

## With math expressions

Total with VAT: {{formatEuro (add annual_license (multiply annual_license vat_rate))}}

Quarterly fee: {{formatDollar (divide annual_license 4)}}
