# Date Helpers

Helpers for formatting and manipulating dates in legal documents.

## Table of Contents

- [`today`](#today) - Current date
- [`formatDate`](#formatdate) - Format dates with multiple formats
- [`addYears`](#addyears) - Add/subtract years
- [`addMonths`](#addmonths) - Add/subtract months
- [`addDays`](#adddays) - Add/subtract days
- [`formatBasicDate`](#formatbasicdate) - Simple date formatting

---

## `today`

Returns the current date as a Date object.

### Syntax

```handlebars
{{today}}
```

### Examples

```handlebars
Current date:
{{formatDate today 'YYYY-MM-DD'}}
Next year:
{{formatDate (addYears today 1) 'legal'}}
```

### Output

```
Current date: 2025-10-26
Next year: October 26, 2026
```

### Notes

- Returns a JavaScript Date object
- Must be used with `formatDate` or date arithmetic helpers to display
- Use `@today` in frontmatter or special contexts

---

## `formatDate`

Formats a date according to a specified format string.

### Syntax

```handlebars
{{formatDate date format}}
```

### Parameters

- **`date`** (Date | string) - Date object or ISO date string
- **`format`** (string) - Format specification

### Format Options

| Format           | Output Example   | Description                  |
| ---------------- | ---------------- | ---------------------------- |
| `"YYYY-MM-DD"`   | 2025-10-26       | ISO format                   |
| `"legal"`        | October 26, 2025 | Legal format (long)          |
| `"long"`         | October 26, 2025 | Long format                  |
| `"medium"`       | Oct 26, 2025     | Medium format                |
| `"short"`        | Oct 26, 25       | Short format                 |
| `"US"`           | 10/26/2025       | US format (MM/DD/YYYY)       |
| `"EU"`           | 26/10/2025       | European format (DD/MM/YYYY) |
| `"MMMM D, YYYY"` | October 26, 2025 | Custom format                |
| `"MMM DD, YY"`   | Oct 26, 25       | Custom short format          |

### Examples

```handlebars
{{formatDate startDate 'legal'}}
{{formatDate contractDate 'YYYY-MM-DD'}}
{{formatDate effectiveDate 'MMMM D, YYYY'}}
{{formatDate @today 'US'}}
```

### Output

```
October 26, 2025
2025-10-26
October 26, 2025
10/26/2025
```

### With Subexpressions

```handlebars
Expiration:
{{formatDate (addYears startDate 2) 'legal'}}
Deadline:
{{formatDate (addDays @today 30) 'MMMM D, YYYY'}}
```

---

## `addYears`

Adds a specified number of years to a date.

### Syntax

```handlebars
{{addYears date years}}
```

### Parameters

- **`date`** (Date | string) - Base date
- **`years`** (number) - Number of years to add (can be negative)

### Examples

```handlebars
{{formatDate (addYears startDate 2) 'legal'}}
{{formatDate (addYears @today -1) 'YYYY-MM-DD'}}
{{formatDate (addYears contractDate 5) 'MMMM D, YYYY'}}
```

### Output

```
October 26, 2027
2024-10-26
October 26, 2030
```

### Notes

- Returns a Date object (use with `formatDate` to display)
- Negative numbers subtract years
- Handles leap years correctly

---

## `addMonths`

Adds a specified number of months to a date.

### Syntax

```handlebars
{{addMonths date months}}
```

### Parameters

- **`date`** (Date | string) - Base date
- **`months`** (number) - Number of months to add (can be negative)

### Examples

```handlebars
{{formatDate (addMonths startDate 6) 'legal'}}
{{formatDate (addMonths @today -3) 'YYYY-MM-DD'}}
{{formatDate (addMonths effectiveDate 12) 'MMMM D, YYYY'}}
```

### Output

```
April 26, 2026
July 26, 2025
October 26, 2026
```

### Notes

- Returns a Date object (use with `formatDate` to display)
- Negative numbers subtract months
- Handles month boundaries (e.g., Jan 31 + 1 month = Feb 28/29)

---

## `addDays`

Adds a specified number of days to a date.

### Syntax

```handlebars
{{addDays date days}}
```

### Parameters

- **`date`** (Date | string) - Base date
- **`days`** (number) - Number of days to add (can be negative)

### Examples

```handlebars
{{formatDate (addDays startDate 30) 'legal'}}
{{formatDate (addDays @today -7) 'YYYY-MM-DD'}}
{{formatDate (addDays dueDate 90) 'MMMM D, YYYY'}}
```

### Output

```
November 25, 2025
October 19, 2025
January 24, 2026
```

### Notes

- Returns a Date object (use with `formatDate` to display)
- Negative numbers subtract days
- Most commonly used for payment terms, notice periods, deadlines

---

## `formatBasicDate`

Simple date formatting (legacy compatibility helper).

### Syntax

```handlebars
{{formatBasicDate date}}
```

### Parameters

- **`date`** (Date | string) - Date to format

### Example

```handlebars
{{formatBasicDate @today}}
{{formatBasicDate startDate}}
```

### Output

```
October 26, 2025
October 26, 2025
```

### Notes

- Always outputs in "Month Day, Year" format
- For more control, use `formatDate` instead
- Provided for backward compatibility

---

## Complex Date Examples

### Contract Duration

```handlebars
--- startDate: 2025-01-15 duration: 24 --- This agreement begins on
{{formatDate startDate 'legal'}}
and expires on
{{formatDate (addMonths startDate duration) 'legal'}}, unless renewed.
```

**Output:**

```
This agreement begins on January 15, 2025 and expires on
January 15, 2027, unless renewed.
```

### Payment Terms

```handlebars
--- invoiceDate: 2025-10-26 paymentDays: 30 --- Invoice Date:
{{formatDate invoiceDate 'MMMM D, YYYY'}}
Payment Due:
{{formatDate (addDays invoiceDate paymentDays) 'MMMM D, YYYY'}}
```

**Output:**

```
Invoice Date: October 26, 2025
Payment Due: November 25, 2025
```

### Notice Period

```handlebars
--- terminationDate: 2025-12-31 noticeDays: 60 --- To terminate this agreement
effective
{{formatDate terminationDate 'legal'}}, notice must be provided no later than
{{formatDate (addDays terminationDate (multiply noticeDays -1)) 'legal'}}.
```

**Output:**

```
To terminate this agreement effective December 31, 2025,
notice must be provided no later than November 1, 2025.
```

---

## See Also

- [Number Helpers](number-helpers.md) - For formatting numbers with dates
- [Special Values](special-values.md) - Details on `@today`
- [String Helpers](string-helpers.md) - For text formatting

---

[← Back to Helpers](README.md)
