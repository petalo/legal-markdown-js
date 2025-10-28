---
title: Service Agreement Contract
client_name: Acme Corporation
provider_name: Professional Services LLC
effective_date: 2024-01-01
contract_value: 50000
currency: USD
jurisdiction: California

# Force specific processing options for this document
force_commands: >
  --css corporate-theme.css  --output-name Contract_{{titleCase
  client_name}}_{{formatDate effective_date "YYYYMMDD"}}.pdf --pdf --highlight
  --export-yaml --export-json --title "{{title}} - {{client_name}}" --format A4
---

# {{title}}

**Document Auto-Generated with Force Commands**

This {{title}} is entered into on {{formatDate effective_date "MMMM Do, YYYY"}}
between:

**CLIENT**: {{titleCase client_name}} **PROVIDER**: {{provider_name}}

## Terms and Conditions

l. **Contract Value** The total contract value is
{{formatCurrency contract_value currency}} ({{numberToWords contract_value}}
{{currency}}).

l. **Effective Date** This agreement becomes effective on
{{formatDate effective_date "MMMM Do, YYYY"}}.

l. **Jurisdiction** This agreement shall be governed by the laws of
{{jurisdiction}}.

## Force Commands Demonstration

This document demonstrates the `force_commands` feature which automatically:

- ✅ Applies corporate CSS theme (`corporate-theme.css`)
- ✅ Generates PDF with highlighting enabled
- ✅ Creates custom output filename with processed variables
- ✅ Exports metadata in both YAML and JSON formats
- ✅ Sets document title with template variables
- ✅ Forces A4 format for PDF generation

## Template Processing

The force commands themselves support template processing:

- **Client**: `{{client_name}}` → "{{client_name}}"
- **Formatted Date**: `{{formatDate effective_date "YYYYMMDD"}}` →
  "{{formatDate effective_date "YYYYMMDD"}}"
- **Title Case**: `{{titleCase client_name}}` → "{{titleCase client_name}}"

## Expected Outputs

When processed, this document will automatically:

1. **PDF File**:
   `Contract_{{titleCase client_name}}_{{formatDate effective_date "YYYYMMDD"}}.pdf`
2. **YAML Metadata**: Document metadata exported to YAML
3. **JSON Metadata**: Document metadata exported to JSON
4. **CSS Styling**: Applied from `corporate-theme.css`
5. **Field Highlighting**: Variables highlighted for review

---

**Note**: The `force_commands` feature allows documents to be self-configuring,
ensuring consistent processing options and output formats without requiring
manual CLI flags.
