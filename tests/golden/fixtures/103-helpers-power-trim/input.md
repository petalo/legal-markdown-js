---
base_rate: 1.05
years: 3
principal: 10000
exponent: 2
side_length: 7
padded_name: "   Maria Garcia   "
padded_clause: "  Confidentiality Agreement  "
---

# Power and Trim Helpers

## Power (exponentiation)

Compound factor (1.05^3): {{power base_rate years}}

Area (7^2): {{power side_length exponent}}

Compound interest: {{multiply principal (power base_rate years)}}

## Trim (alias for clean)

The `trim` helper removes leading/trailing whitespace, same as `clean`:

- Trimmed name: "{{trim padded_name}}"
- Cleaned name: "{{clean padded_name}}"
- Trimmed clause: "{{trim padded_clause}}"

Both `trim` and `clean` produce identical results for the same input.
