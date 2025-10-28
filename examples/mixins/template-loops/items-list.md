---
# Handlebars Helper Functions Example
# This example demonstrates the current Handlebars syntax for helper functions
# See items-list-legacy.md for the deprecated legacy syntax
amount: 50000
client_name: 'john doe'
company_name: 'ACME corp'
payment_terms: 30
interest_rate: 0.05
project_duration: 6
currency: 'USD'
today: 2025-01-15  # ISO date - will be auto-parsed as Date object
---

# {{titleCase client_name}} Service Agreement

**Date:** {{formatDate today "MMMM Do, YYYY"}}
**Client:** {{capitalizeWords client_name}}
**Company:** {{titleCase company_name}}

## Financial Terms

**Total Amount:** {{formatCurrency amount currency}}
**Amount in Words:** {{capitalize (numberToWords amount)}} dollars
**Interest Rate:** {{formatPercent interest_rate 1}} per annum

## Payment Schedule

**Payment Terms:** {{payment_terms}} days
**Due Date:** {{formatDate (addDays today payment_terms) "MMMM Do, YYYY"}}
**Project Duration:** {{project_duration}} {{pluralize "month" project_duration}}
**Project End Date:** {{formatDate (addMonths today project_duration) "MMMM Do, YYYY"}}

## Additional Information

**Document ID:** {{upper (replaceAll (kebabCase client_name) "-" "")}}{{formatDate today "YYMMDD"}}
**Client Initials:** {{initials client_name}}
**Generated:** {{formatDate today "dddd, MMMM Do, YYYY"}}

## Terms and Conditions

This agreement is valid for {{project_duration}} {{pluralize "month" project_duration}} starting from
{{formatDate today "MMMM Do, YYYY"}} and ending on {{formatDate (addMonths today project_duration) "MMMM Do, YYYY"}}.

The total amount of {{formatCurrency amount currency}} ({{numberToWords amount}} dollars) shall be paid within {{payment_terms}} days of the contract date.

**Signatures**

---

{{capitalizeWords client_name}} ({{initials client_name}})
Date: {{formatDate today "DD/MM/YYYY"}}

---

## Syntax Notes

This document uses **Handlebars syntax** (current standard since v3.5.0):
- Helper functions use space-separated arguments: `{{helper arg1 arg2}}`
- Subexpressions use parentheses: `{{helper (subhelper arg1) arg2}}`
- No commas between arguments

**Examples:**
- `{{formatDate today "MMMM Do, YYYY"}}` - Date formatting
- `{{formatCurrency amount currency}}` - Currency formatting
- `{{titleCase client_name}}` - String manipulation
- `{{formatDate (addMonths today 6) "YYYY-MM-DD"}}` - Nested helpers (subexpressions)

For the deprecated legacy syntax `{{helper(arg1, arg2)}}`, see [items-list-legacy.md](items-list-legacy.md).
