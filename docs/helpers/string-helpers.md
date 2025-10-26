# String Helpers

Helpers for text manipulation and formatting in legal documents.

## Table of Contents

### Capitalization

- [`capitalize`](#capitalize) - Capitalize first letter
- [`capitalizeWords`](#capitalizewords) - Capitalize each word
- [`titleCase`](#titlecase) - Smart title casing
- [`upper`](#upper) - Convert to uppercase
- [`lower`](#lower) - Convert to lowercase

### Formatting

- [`truncate`](#truncate) - Truncate with suffix
- [`clean`](#clean) - Remove extra whitespace
- [`pluralize`](#pluralize) - Convert to plural

### Case Conversion

- [`kebabCase`](#kebabcase) - Convert to kebab-case
- [`snakeCase`](#snakecase) - Convert to snake_case
- [`camelCase`](#camelcase) - Convert to camelCase
- [`pascalCase`](#pascalcase) - Convert to PascalCase

### Padding & Search

- [`padStart`](#padstart) - Pad string at start
- [`padEnd`](#padend) - Pad string at end
- [`contains`](#contains) - Check substring
- [`replaceAll`](#replaceall) - Replace all occurrences
- [`initials`](#initials) - Extract initials

---

## Capitalization Helpers

### `capitalize`

Capitalizes the first letter of a string.

**Syntax:** `{{capitalize text}}`

**Example:**

```handlebars
{{capitalize 'hello world'}} → Hello world
```

---

### `capitalizeWords`

Capitalizes the first letter of each word.

**Syntax:** `{{capitalizeWords text}}`

**Example:**

```handlebars
{{capitalizeWords 'hello world'}} → Hello World
```

---

### `titleCase`

Converts text to title case (smart capitalization).

**Syntax:** `{{titleCase text}}`

**Example:**

```handlebars
{{titleCase 'the quick brown fox'}} → The Quick Brown Fox
```

---

### `upper`

Converts text to uppercase.

**Syntax:** `{{upper text}}`

**Example:**

```handlebars
{{upper 'hello'}} → HELLO
```

---

### `lower`

Converts text to lowercase.

**Syntax:** `{{lower text}}`

**Example:**

```handlebars
{{lower 'HELLO'}} → hello
```

---

## Formatting Helpers

### `truncate`

Truncates text to a specified length.

**Syntax:** `{{truncate text length suffix}}`

**Parameters:**

- `text` - Text to truncate
- `length` - Maximum length
- `suffix` - Suffix to add (default: "...")

**Example:**

```handlebars
{{truncate description 50 '...'}}
→ This is a very long description that will be tr...
```

---

### `clean`

Removes extra whitespace and normalizes text.

**Syntax:** `{{clean text}}`

**Example:**

```handlebars
{{clean '  hello   world  '}} → hello world
```

---

### `pluralize`

Converts a word to plural form based on count.

**Syntax:** `{{pluralize word count customPlural}}`

**Parameters:**

- `word` - Word to pluralize
- `count` - Number determining singular/plural
- `customPlural` - Optional custom plural form

**Examples:**

```handlebars
{{pluralize 'item' 1}}
→ item
{{pluralize 'item' 5}}
→ items
{{pluralize 'person' 10 'people'}}
→ people
```

---

## Case Conversion Helpers

### `kebabCase`

Converts text to kebab-case.

**Syntax:** `{{kebabCase text}}`

**Example:**

```handlebars
{{kebabCase 'Hello World'}} → hello-world
```

---

### `snakeCase`

Converts text to snake_case.

**Syntax:** `{{snakeCase text}}`

**Example:**

```handlebars
{{snakeCase 'Hello World'}} → hello_world
```

**Note:** Avoid using snake_case in variable names as underscores are escaped in
markdown. Use camelCase instead.

---

### `camelCase`

Converts text to camelCase.

**Syntax:** `{{camelCase text}}`

**Examples:**

```handlebars
{{camelCase 'hello world'}}
→ helloWorld
{{camelCase 'hello-world'}}
→ helloWorld
{{camelCase 'HelloWorld'}}
→ helloWorld
```

---

### `pascalCase`

Converts text to PascalCase.

**Syntax:** `{{pascalCase text}}`

**Examples:**

```handlebars
{{pascalCase 'hello world'}}
→ HelloWorld
{{pascalCase 'hello-world'}}
→ HelloWorld
{{pascalCase 'helloWorld'}}
→ HelloWorld
```

---

## Padding & Search Helpers

### `padStart`

Pads the start of a string to a specified length.

**Syntax:** `{{padStart text length padChar}}`

**Parameters:**

- `text` - String or number to pad
- `length` - Desired total length
- `padChar` - Character to pad with (default: " ")

**Examples:**

```handlebars
{{padStart '42' 5 '0'}}
→ 00042
{{padStart invoiceId 6 '0'}}
→ 000123
{{padStart 7 3 '0'}}
→ 007
```

---

### `padEnd`

Pads the end of a string to a specified length.

**Syntax:** `{{padEnd text length padChar}}`

**Parameters:**

- `text` - String or number to pad
- `length` - Desired total length
- `padChar` - Character to pad with (default: " ")

**Examples:**

```handlebars
{{padEnd 'Name' 20 '.'}}
→ Name................
{{padEnd contractId 10 '-'}}
→ 123-------
```

---

### `contains`

Checks if a string contains a substring (case-sensitive).

**Syntax:** `{{contains text substring}}`

**Examples:**

```handlebars
{{#if (contains email '@gmail.com')}}
  Gmail address detected
{{/if}}

{{#if (contains status 'pending')}}
  Status is pending
{{/if}}
```

---

### `replaceAll`

Replaces all occurrences of a substring.

**Syntax:** `{{replaceAll text search replacement}}`

**Examples:**

```handlebars
{{replaceAll phoneNumber '-' ''}}
→ 5551234567
{{replaceAll text 'old' 'new'}}
```

---

### `initials`

Extracts initials from a name.

**Syntax:** `{{initials name}}`

**Examples:**

```handlebars
{{initials 'John Doe'}}
→ JD
{{initials 'ACME Corp Services'}}
→ ACS
{{upper (initials clientName)}}
→ JD
```

---

## Complex Examples

### Document Reference Generation

```handlebars
--- clientName: "Acme Corporation" contractType: "service agreement" year: 2025
contractId: 42 --- Reference:
{{upper (initials clientName)}}-{{upper
  (kebabCase contractType)
}}-{{year}}-{{padStart contractId 4 '0'}}
```

**Output:** `Reference: AC-SERVICE-AGREEMENT-2025-0042`

### Name Formatting

```handlebars
--- firstName: "john" lastName: "doe" --- **Full Name:**
{{titleCase (concat firstName ' ' lastName)}}
**Initials:**
{{upper (concat (padStart firstName 1) (padStart lastName 1))}}
**Username:**
{{kebabCase (concat firstName '-' lastName)}}
```

**Output:**

```
Full Name: John Doe
Initials: JD
Username: john-doe
```

---

## See Also

- [Utility Helpers](utility-helpers.md) - For concat
- [Number Helpers](number-helpers.md) - For number formatting
- [Built-in Handlebars](handlebars-builtins.md) - For conditionals

---

[← Back to Helpers](README.md)
