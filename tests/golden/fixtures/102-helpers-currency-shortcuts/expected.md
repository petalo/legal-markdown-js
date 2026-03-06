# Currency Shortcut Helpers

These helpers format amounts in specific currencies without needing to pass
the currency code each time.

## formatDollar

Monthly fee: $2,500.00

Consulting rate: $150.75

## formatEuro

Annual license: 18,000.50 €

Monthly fee: 2,500.00 €

## formatPound

Penalty amount: £5,000.00

Consulting rate: £150.75

## Comparison with formatCurrency

The following should produce equivalent results:

| Method   | USD       | EUR        |
| -------- | --------- | ---------- |
| Shortcut | $2,500.00 | 2,500.00 € |
| Explicit | $2,500.00 | 2,500.00 € |

## With math expressions

Total with VAT: 21,780.60 €

Quarterly fee: $4,500.13
