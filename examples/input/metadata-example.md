# Using External Metadata Files

This document demonstrates how to use external metadata files with
LegalMarkdown.

## Template Document

l. **Parties**

This agreement is between {{client_name}} and {{provider_name}}.

ll. Effective Date

This agreement becomes effective on {{effective_date}}.

l. **Payment Terms**

Payment is due within {{payment_days}} days.

[Late fees of 1.5% per month will apply to overdue amounts.]{late_fees_apply}

[l. **Warranty**

The provider warrants that all services will be performed
professionally.]{include_warranty}

l. **Governing Law**

This agreement is governed by {{jurisdiction}} law.

---

## Usage Examples

### With JSON Metadata

```bash
# Use the agreement-metadata.json file
legal-md metadata-example.md output.md --metadata agreement-metadata.json
```

This will process the document using:

- `client_name`: "ClientCorp LLC"
- `effective_date`: "2024-01-01"
- `payment_days`: 30
- `late_fees_apply`: true
- `include_warranty`: false

### With YAML Metadata

```bash
# Use the metadata.yaml file
legal-md metadata-example.md output.md --metadata metadata.yaml
```

### Advanced Features

```bash
# Use advanced metadata with complex numbering
legal-md metadata-example.md output.md --metadata advanced-metadata.json
```

## Creating Custom Metadata

Create a JSON file with your variables:

```json
{
  "client_name": "Your Client Name",
  "provider_name": "Your Company",
  "effective_date": "2024-12-01",
  "jurisdiction": "Delaware",
  "payment_days": 15,
  "late_fees_apply": false,
  "include_warranty": true,
  "level-one": "Section %n.",
  "level-two": "%n.%s"
}
```

Or use YAML format:

```yaml
client_name: 'Your Client Name'
provider_name: 'Your Company'
effective_date: '2024-12-01'
jurisdiction: 'Delaware'
payment_days: 15
late_fees_apply: false
include_warranty: true
level-one: 'Section %n.'
level-two: '%n.%s'
```
