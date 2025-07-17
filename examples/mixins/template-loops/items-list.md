---
contract_date: @today
amount: 50000
client_name: "john doe"
company_name: "ACME corp"
payment_terms: 30
interest_rate: 0.05
project_duration: 6
currency: "USD"
---

# {{titleCase(client_name)}} Service Agreement

**Date:** {{formatDate(contract_date, "MMMM Do, YYYY")}}  
**Client:** {{capitalizeWords(client_name)}}  
**Company:** {{titleCase(company_name)}}

## Financial Terms

**Total Amount:** {{formatCurrency(amount, currency)}}  
**Amount in Words:** {{capitalize(numberToWords(amount))}} dollars  
**Interest Rate:** {{formatPercent(interest_rate, 1)}} per annum

## Payment Schedule

**Payment Terms:** {{payment_terms}} days  
**Due Date:**
{{formatDate(addDays(contract_date, payment_terms), "MMMM Do, YYYY")}}  
**Project Duration:** {{project_duration}}
{{pluralize("month", project_duration)}}  
**Project End Date:**
{{formatDate(addMonths(contract_date, project_duration), "MMMM Do, YYYY")}}

## Additional Information

**Document ID:**
{{upper(replaceAll(kebabCase(client_name), "-", ""))}}{{formatDate(contract_date, "YYMMDD")}}  
**Client
Initials:** {{initials(client_name)}}  
**Generated:** {{formatDate(@today, "dddd, MMMM Do, YYYY")}}

## Terms and Conditions

This agreement is valid for {{project_duration}}
{{pluralize("month", project_duration)}} starting from
{{formatDate(contract_date, "MMMM Do, YYYY")}} and ending on
{{formatDate(addMonths(contract_date, project_duration), "MMMM Do, YYYY")}}.

The total amount of {{formatCurrency(amount, currency)}}
({{numberToWords(amount)}} dollars) shall be paid within {{payment_terms}} days
of the contract date.

**Signatures**

---

{{capitalizeWords(client_name)}} ({{initials(client_name)}})  
Date: {{formatDate(@today, "DD/MM/YYYY")}}
