# Utility Helpers

General-purpose utility helpers for string concatenation and field tracking.

## Table of Contents

- [`concat`](#concat) - Concatenate strings
- [`trackField`](#trackfield) - Field tracking for highlighting

---

## `concat`

Concatenates multiple strings together.

### Syntax

```handlebars
{{concat str1 str2 str3 ...}}
```

### Parameters

- **`str1, str2, ...`** (string | number) - Values to concatenate

### Examples

```handlebars
{{concat '$' price}}
{{concat firstName ' ' lastName}}
{{concat '(' areaCode ') ' phone}}
{{concat 'REF-' year '-' id}}
```

### Output

```
$100
John Doe
(555) 123-4567
REF-2025-042
```

### Notes

- Accepts any number of arguments
- Automatically converts numbers to strings
- **Different from `add`**: `concat` joins strings, `add` performs arithmetic

### Comparison: concat vs add

```handlebars
{{concat '10' '5'}}
→ "105" (string concatenation)
{{add '10' '5'}}
→ 15 (arithmetic addition)
{{add 10 5}}
→ 15
{{concat 10 5}}
→ "105"
```

### Legacy Syntax

**Legacy (Deprecated):**

```handlebars
{{"$" + price}}
{{firstName + " " + lastName}}
```

**Current (Handlebars):**

```handlebars
{{concat '$' price}}
{{concat firstName ' ' lastName}}
```

### Complex Examples

#### Building Reference Numbers

```handlebars
--- contractType: "SVC" year: 2025 month: 10 contractId: 42 --- Reference:
{{concat
  contractType
  '-'
  year
  (padStart month 2 '0')
  '-'
  (padStart contractId 4 '0')
}}
```

**Output:**

```
Reference: SVC-202510-0042
```

#### Formatting Names

```handlebars
--- title: "Dr." firstName: "Jane" middleInitial: "M" lastName: "Smith" suffix:
"PhD" ---

{{concat title ' ' firstName ' ' middleInitial '. ' lastName ', ' suffix}}
```

**Output:**

```
Dr. Jane M. Smith, PhD
```

#### Building URLs or Identifiers

```handlebars
--- domain: "example.com" username: "john.doe" year: 2025 --- Email:
{{concat username '@' domain}}
Profile:
{{concat 'https://' domain '/users/' username}}
Archive:
{{concat 'backup-' year '.zip'}}
```

**Output:**

```
Email: john.doe@example.com
Profile: https://example.com/users/john.doe
Archive: backup-2025.zip
```

---

## `trackField`

Wraps content with a field tracking span for document highlighting and
validation.

### Syntax

```handlebars
{{#trackField 'fieldName'}}{{value}}{{/trackField}}
```

### Parameters

- **`fieldName`** (string) - The name of the field being tracked
- **Content** - The value to wrap

### Examples

```handlebars
Client:
{{#trackField 'clientName'}}{{clientName}}{{/trackField}}
Amount:
{{#trackField 'paymentAmount'}}{{formatDollar amount}}{{/trackField}}
Date:
{{#trackField 'effectiveDate'}}{{formatDate date 'legal'}}{{/trackField}}
```

### Output (HTML)

```html
Client:
<span class="legal-md-field" data-field="clientName" data-status="filled"
  >ACME Corp</span
>
Amount:
<span class="legal-md-field" data-field="paymentAmount" data-status="filled"
  >$5,000.00</span
>
Date:
<span class="legal-md-field" data-field="effectiveDate" data-status="filled"
  >October 26, 2025</span
>
```

### Field Status Classes

The `data-status` attribute indicates the field state:

- **`filled`** - Field has a valid value
- **`empty`** - Field is empty or undefined
- **`logic`** - Field contains logic/helper calls (for highlighting)

### Use Cases

#### Document Validation

Track all required fields to ensure completion before finalizing:

```handlebars
**Parties:** - Provider:
{{#trackField 'providerName'}}{{providerName}}{{/trackField}}
- Client:
{{#trackField 'clientName'}}{{clientName}}{{/trackField}}

**Payment:** Amount:
{{#trackField 'amount'}}{{formatDollar amount}}{{/trackField}}
```

#### Field Highlighting in UI

Enable visual highlighting of fillable fields in a document editor:

```css
.legal-md-field[data-status='empty'] {
  background-color: #fee;
  border-bottom: 2px solid #f00;
}

.legal-md-field[data-status='filled'] {
  background-color: #efe;
}

.legal-md-field[data-status='logic'] {
  background-color: #fef7e0;
}
```

#### Field Extraction

Extract all tracked fields for form generation or API integration:

```javascript
const fields = document.querySelectorAll('.legal-md-field');
const fieldData = Array.from(fields).map(el => ({
  name: el.dataset.field,
  value: el.textContent,
  status: el.dataset.status,
}));
```

### Notes

- Enabled automatically when using `enableFieldTracking` option
- Only affects HTML output (not PDF or Markdown)
- Block helper syntax (requires `{{#trackField}}...{{/trackField}}`)
- Nested tracking is not recommended

### Automatic Field Tracking

In many cases, field tracking happens automatically without explicit
`trackField` usage:

```handlebars
{{clientName}} <!-- Automatically tracked if enableFieldTracking: true -->
```

Use explicit `trackField` when you need:

- Custom field names that differ from variable names
- Tracking complex expressions
- Grouping multiple values under one field name

---

## See Also

- [String Helpers](string-helpers.md) - For additional string manipulation
- [Mathematical Helpers](math-helpers.md) - For concatenating with calculations
- [Architecture: Field Tracking](../architecture/) - Internal field tracking
  implementation

---

[← Back to Helpers](README.md)
