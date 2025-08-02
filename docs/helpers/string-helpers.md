# String Helpers

String helpers provide comprehensive text manipulation, formatting, and
conversion capabilities for legal documents.

## Table of Contents

- [Basic Text Formatting](#basic-text-formatting)
- [String Manipulation](#string-manipulation)
- [Text Analysis](#text-analysis)
- [Advanced Case Conversion](#advanced-case-conversion)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Basic Text Formatting

### `capitalize(str)`

Capitalizes the first letter of a string.

**Examples:**

```markdown
Name: {{capitalize(first_name)}}

<!-- Input: "john" → Output: "John" -->

Greeting: {{capitalize("hello world")}}

<!-- Output: "Hello world" -->
```

### `capitalizeWords(str)`

Capitalizes the first letter of each word.

**Examples:**

```markdown
Title: {{capitalizeWords(job_title)}}

<!-- Input: "chief executive officer" → Output: "Chief Executive Officer" -->

Full name: {{capitalizeWords(full_name)}}

<!-- Input: "john doe smith" → Output: "John Doe Smith" -->
```

### `upper(str)`

Converts to uppercase.

**Examples:**

```markdown
Code: {{upper(product_code)}}

<!-- Input: "abc123" → Output: "ABC123" -->

Emphasis: {{upper("important")}}

<!-- Output: "IMPORTANT" -->
```

### `lower(str)`

Converts to lowercase.

**Examples:**

```markdown
Email: {{lower(email_address)}}

<!-- Input: "John@EXAMPLE.COM" → Output: "john@example.com" -->

URL: {{lower(website_url)}}

<!-- Input: "HTTPS://EXAMPLE.COM" → Output: "https://example.com" -->
```

### `titleCase(str)`

Converts to title case (handles articles and prepositions correctly).

**Examples:**

```markdown
Book: {{titleCase(book_title)}}

<!-- Input: "the art of war" → Output: "The Art of War" -->

Movie: {{titleCase("lord of the rings")}}

<!-- Output: "Lord of the Rings" -->

Document: {{titleCase("agreement for the provision of services")}}

<!-- Output: "Agreement for the Provision of Services" -->
```

## String Manipulation

### `truncate(str, length, suffix)`

Truncates a string to the specified length.

**Parameters:**

- `str`: String to truncate
- `length`: Maximum length
- `suffix`: Suffix to add (default: "...")

**Examples:**

```markdown
Summary: {{truncate(description, 50)}}

<!-- Input: "This is a very long description that exceeds fifty characters"
     Output: "This is a very long description that will be..." -->

Short title: {{truncate(long_title, 20, "…")}}

<!-- Input: "A very long title that needs shortening"
     Output: "A very long titl…" -->

Preview: {{truncate(contract_text, 100, " [Read More]")}}

<!-- Truncates to 100 chars with custom suffix -->
```

### `clean(str)`

Removes extra spaces and cleans the string.

**Examples:**

```markdown
Clean text: {{clean("  multiple   spaces  ")}}

<!-- Output: "multiple spaces" -->

Name: {{clean(user_input)}}

<!-- Removes leading/trailing spaces and normalizes internal spacing -->
```

### `pluralize(word, count, plural)`

Pluralizes a word according to the count.

**Parameters:**

- `word`: Singular word
- `count`: Number to determine plural
- `plural`: Custom plural form (optional)

**Examples:**

```markdown
Articles: {{count}} {{pluralize("article", count, "articles")}}

<!-- count=1 → "1 article" -->
<!-- count=5 → "5 articles" -->

Days: {{days}} {{pluralize("day", days)}}

<!-- days=1 → "1 day" -->
<!-- days=30 → "30 days" -->

People: {{people_count}} {{pluralize("person", people_count, "people")}}

<!-- people_count=1 → "1 person" -->
<!-- people_count=5 → "5 people" -->

Children: {{child_count}} {{pluralize("child", child_count, "children")}}

<!-- Handles irregular plurals -->
```

### `initials(name)`

Extracts the initials from a name.

**Examples:**

```markdown
Initials: {{initials(full_name)}}

<!-- Input: "John Michael Doe" → Output: "JMD" -->

Signature: {{initials(signatory_name)}}

<!-- Input: "María García López" → Output: "MGL" -->

Code: {{upper(initials(client_name))}}

<!-- Input: "acme corporation" → Output: "AC" -->
```

### `padStart(str, length, char)`

Pads a string to a specified length from the start (left side).

**Parameters:**

- `str`: String to pad
- `length`: Target length of the result
- `char`: Character to use for padding (default: ' ')

**Examples:**

```markdown
ID: {{padStart(sequence_number, 5, "0")}}

<!-- Input: "42" → Output: "00042" -->

Reference: {{padStart(ref_id, 8, "0")}}

<!-- Input: "123" → Output: "00000123" -->

Aligned: {{padStart(name, 15)}}

<!-- Input: "John" → Output: "           John" -->
```

### `padEnd(str, length, char)`

Pads a string to a specified length from the end (right side).

**Parameters:**

- `str`: String to pad
- `length`: Target length of the result
- `char`: Character to use for padding (default: ' ')

**Examples:**

```markdown
Column: {{padEnd(title, 20, ".")}}

<!-- Input: "Chapter 1" → Output: "Chapter 1..........." -->

Name: {{padEnd(client_name, 25)}}

<!-- Input: "Acme Corp" → Output: "Acme Corp                " -->

Fill: {{padEnd(content, 50, "-")}}

<!-- Creates consistent width with dashes -->
```

## Text Analysis

### `contains(str, substring, caseSensitive)`

Checks if a string contains a substring with optional case sensitivity.

**Parameters:**

- `str`: String to search in
- `substring`: Substring to search for
- `caseSensitive`: Whether search is case sensitive (default: false)

**Examples:**

```markdown
Priority: {{contains(description, "urgent") ? "HIGH" : "NORMAL"}}

<!-- Checks if description contains "urgent" (case insensitive) -->

Document Type: {{contains(title, "Contract", true) ? "Legal Doc" : "Other"}}

<!-- Case sensitive search for exact "Contract" -->

{{#if contains(email, "@company.com")}} Internal employee email detected.
{{/if}}
```

### `replaceAll(str, search, replace)`

Replaces all occurrences of a substring.

**Examples:**

```markdown
Updated text: {{replaceAll(contract_text, "COMPANY", company_name)}}

<!-- Replaces all occurrences of "COMPANY" with the company name -->

Clean code: {{replaceAll(reference_code, "-", "")}}

<!-- Input: "REF-2024-001" → Output: "REF2024001" -->

Phone: {{replaceAll(phone_number, " ", "")}}

<!-- Removes all spaces from phone number -->

Template: {{replaceAll(template_text, "[CLIENT]", client_name)}}

<!-- Replaces template placeholders -->
```

## Advanced Case Conversion

### `camelCase(str)`

Converts to camelCase.

**Examples:**

```markdown
Variable: {{camelCase("first name")}}

<!-- Output: "firstName" -->

Field: {{camelCase("contract_start_date")}}

<!-- Output: "contractStartDate" -->

Property: {{camelCase("user-profile-settings")}}

<!-- Output: "userProfileSettings" -->
```

### `pascalCase(str)`

Converts to PascalCase.

**Examples:**

```markdown
Class: {{pascalCase("user profile")}}

<!-- Output: "UserProfile" -->

Component: {{pascalCase("legal-document-viewer")}}

<!-- Output: "LegalDocumentViewer" -->

Type: {{pascalCase("contract_type_enum")}}

<!-- Output: "ContractTypeEnum" -->
```

### `kebabCase(str)`

Converts to kebab-case.

**Examples:**

```markdown
URL: {{kebabCase("Company Name")}}

<!-- Output: "company-name" -->

Slug: {{kebabCase("Legal Document Title")}}

<!-- Output: "legal-document-title" -->

ID: {{kebabCase("User Profile Settings")}}

<!-- Output: "user-profile-settings" -->
```

### `snakeCase(str)`

Converts to snake_case.

**Examples:**

```markdown
DB field: {{snakeCase("Company Name")}}

<!-- Output: "company_name" -->

Variable: {{snakeCase("Legal Document Type")}}

<!-- Output: "legal_document_type" -->

Key: {{snakeCase("Client Contact Information")}}

<!-- Output: "client_contact_information" -->
```

## Examples

### Document Headers

```yaml
---
document_type: 'service agreement'
client_name: 'acme corporation'
version: '2.1'
---
```

```markdown
# {{titleCase(document_type)}}

**Client:** {{titleCase(client_name)}} **Document ID:**
{{upper(snakeCase(document_type))}}\_{{padStart(version | replace('.', ''), 3, '0')}}
**Reference:**
{{upper(initials(client_name))}}-{{upper(kebabCase(document_type))}}
```

### Contact Information

```yaml
---
contacts:
  - name: 'john michael smith'
    title: 'chief technology officer'
    email: 'JOHN.SMITH@ACME.COM'
    phone: '555 123 4567'
---
```

```markdown
## Contacts

{{#contacts}} **{{titleCase(name)}}** ({{initials(name)}})
_{{titleCase(title)}}_ Email: {{lower(email)}} Phone:
{{replaceAll(phone, " ", "-")}}

{{/contacts}}
```

### Legal Document Processing

```yaml
---
contract_template: 'This AGREEMENT is between [PARTY_A] and [PARTY_B]'
party_a: 'Legal Services LLC'
party_b: 'Acme Corporation'
urgency_keywords: ['urgent', 'priority', 'immediate']
---
```

```markdown
# Contract

{{replaceAll(replaceAll(contract_template, "[PARTY_A]", titleCase(party_a)), "[PARTY_B]", titleCase(party_b))}}

{{#urgency_keywords}} {{#if contains(document_content, .)}} **{{upper(.)}}
PROCESSING REQUIRED** {{/if}} {{/urgency_keywords}}
```

### Invoice Formatting

```yaml
---
services:
  - description: 'legal consultation services'
    code: 'LCS'
  - description: 'document review and analysis'
    code: 'DRA'
invoice_number: 42
---
```

```markdown
# Invoice {{padStart(invoice_number, 6, "0")}}

## Services

{{#services}} **{{padStart(code, 4)}}** - {{titleCase(description)}}
{{/services}}

**Invoice ID:** INV-{{padStart(invoice_number, 6, "0")}}
```

### Client Database

```yaml
---
clients:
  - name: 'john doe'
    company: 'ACME CORP'
    status: 'active'
    notes: '  VIP client with urgent   requests  '
---
```

```markdown
## Client Database

{{#clients}} **{{titleCase(name)}}** - {{titleCase(company)}} Status:
{{upper(status)}} Notes: {{clean(notes)}} Initials: {{upper(initials(name))}}
Company Code: {{upper(kebabCase(company))}}

{{/clients}}
```

### Template Processing

```yaml
---
template_variables:
  - name: 'client_full_name'
    display: 'Client Full Name'
    value: 'john michael doe'
  - name: 'contract_type'
    display: 'Contract Type'
    value: 'service agreement'
---
```

```markdown
## Template Variables

{{#template_variables}}

- **{{display}}** (`{{name}}`): {{titleCase(value)}} {{/template_variables}}

## Generated Values

{{#template_variables}}

- {{camelCase(name)}}: "{{titleCase(value)}}" {{/template_variables}}
```

## Best Practices

### 1. Use Appropriate Case Conversion

```markdown
<!-- ✅ Good - appropriate for context -->

**Document Title:** {{titleCase(document_title)}} **Email Address:**
{{lower(email)}} **Reference Code:** {{upper(reference_code)}} **URL Slug:**
{{kebabCase(page_title)}}

<!-- ❌ Avoid - inappropriate case usage -->

**Document Title:** {{upper(document_title)}} <!-- Too aggressive --> **Email
Address:** {{titleCase(email)}} <!-- Wrong format -->
```

### 2. Handle User Input Safely

```markdown
<!-- ✅ Good - clean and format user input -->

**Name:** {{titleCase(clean(user_name))}} **Email:**
{{lower(clean(email_input))}}

<!-- ❌ Avoid - using raw user input -->

**Name:** {{user_name}} **Email:** {{email_input}}
```

### 3. Combine Helpers Effectively

```markdown
<!-- Create consistent identifiers -->

**Document ID:**
{{upper(initials(client_name))}}-{{padStart(document_number, 4, "0")}}

<!-- Output: "AC-0042" -->

<!-- Format display names -->

**Contact:** {{titleCase(full_name)}} ({{upper(initials(full_name))}})

<!-- Output: "John Michael Smith (JMS)" -->
```

### 4. Use Consistent Formatting

```markdown
<!-- ✅ Good - consistent throughout document -->

{{#team_members}} **{{titleCase(name)}}** - {{titleCase(role)}}
{{/team_members}}

<!-- ❌ Avoid - inconsistent formatting -->

{{#team_members}} **{{capitalize(name)}}** - {{upper(role)}} {{/team_members}}
```

### 5. Handle Edge Cases

```markdown
<!-- Handle empty or missing values -->

**Name:** {{name ? titleCase(clean(name)) : "[Name not provided]"}}

<!-- Handle special characters -->

**Clean ID:** {{replaceAll(kebabCase(user_id), "--", "-")}}

<!-- Validate content -->

{{#if contains(description, "confidential")}} **CONFIDENTIAL DOCUMENT** {{/if}}
```

### 6. Document String Processing

```yaml
---
# String processing documentation
client_data:
  raw_name: '  john michael DOE  ' # Will be cleaned and title-cased
  raw_email: 'JOHN@EXAMPLE.COM' # Will be lowercased
  company_code: 'acme-corp-123' # Will be processed for display
---
```

### 7. Use Helpers for Validation

```markdown
<!-- Email validation -->

{{#if contains(email, "@") && contains(email, ".")}} **Valid Email:**
{{lower(email)}} {{else}} **Invalid Email Format** {{/if}}

<!-- Phone number formatting -->

**Phone:** {{replaceAll(replaceAll(phone, "(", ""), ")", "")}}
```

## Error Handling

String helpers handle errors gracefully:

- **Null/undefined values**: Return empty string or safe fallback
- **Non-string inputs**: Convert to string when possible
- **Invalid operations**: Return original value unchanged
- **Empty strings**: Handle appropriately for each operation

**Example:**

```markdown
<!-- If 'missing_value' is undefined -->

Name: {{titleCase(missing_value)}}

<!-- Output: Name: -->

<!-- If 'numeric_value' is a number -->

Code: {{upper(numeric_value)}}

<!-- Output: Code: 123 (converted to string) -->
```

## Integration with Other Helpers

### With Number Helpers

```markdown
**Amount:** {{formatCurrency(amount, "USD")}}
({{titleCase(numberToWords(amount))}})

<!-- Output: $50,000.00 (Fifty Thousand) -->
```

### With Date Helpers

```markdown
**Generated:** {{titleCase(formatDate(@today, "MMMM"))}}
{{formatDate(@today, "DD, YYYY")}}

<!-- Output: July 16, 2025 -->
```

### With Conditional Logic

```markdown
{{#if contains(status, "active")}} **Status:** {{upper(status)}} ✓ {{else}}
**Status:** {{titleCase(status)}} {{/if}}
```

## See Also

- [Date Helpers](date-helpers.md) - Date formatting and manipulation
- [Number Helpers](number-helpers.md) - Number and currency formatting
- [Special Values](special-values.md) - Special string values and processing
- [Template Loops](../features/template-loops.md) - Using strings in iterations
- [Optional Clauses](../features/optional-clauses.md) - String-based conditions
