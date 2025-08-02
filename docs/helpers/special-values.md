# Special Values

Special values in Legal Markdown provide dynamic content generation, with
`@today` being the primary special value for date operations.

## Table of Contents

- [Overview](#overview)
- [@today Special Value](#today-special-value)
- [Format Specifiers](#format-specifiers)
- [Date Arithmetic](#date-arithmetic)
- [Combined Operations](#combined-operations)
- [Integration with Helpers](#integration-with-helpers)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Special values are predefined dynamic values that get resolved during document
processing. They provide a convenient way to insert current information without
requiring manual updates.

**Available Special Values:**

- `@today` - Current date with extensive formatting and arithmetic support

## @today Special Value

The `@today` special value resolves to the current date and supports direct
format specifiers and arithmetic operations.

### Basic Usage

```markdown
Today's date: @today

<!-- Output: 2025-07-16 (ISO format by default) -->

Contract generated: @today

<!-- Provides current date in ISO format -->
```

### In YAML Frontmatter

```yaml
---
contract_date: @today
generation_date: @today
expiry_date: @today+1y
---

**Contract Date:** {{formatDate(contract_date, "MMMM Do, YYYY")}}
**Generated:** {{formatDate(generation_date, "YYYY-MM-DD")}}
**Expires:** {{formatDate(expiry_date, "MMMM Do, YYYY")}}
```

## Format Specifiers

Use `@today[format]` to specify output format directly without helpers.

### Available Format Specifiers

| Format  | Pattern      | Example Output |
| ------- | ------------ | -------------- |
| `legal` | Legal format | July 16, 2025  |
| `US`    | MM/DD/YYYY   | 07/16/2025     |
| `EU`    | DD/MM/YYYY   | 16/07/2025     |
| `ISO`   | YYYY-MM-DD   | 2025-07-16     |

### Format Examples

```markdown
Legal format: @today[legal]

<!-- Output: July 16, 2025 -->

US format: @today[US]

<!-- Output: 07/16/2025 -->

European format: @today[EU]

<!-- Output: 16/07/2025 -->

ISO format: @today[ISO]

<!-- Output: 2025-07-16 -->
```

## Date Arithmetic

Add or subtract time periods using `+` and `-` operators.

### Arithmetic Operators

| Suffix      | Description | Example                  |
| ----------- | ----------- | ------------------------ |
| `d` or none | Days        | `@today+30`, `@today-7d` |
| `m`         | Months      | `@today+6m`, `@today-3m` |
| `y`         | Years       | `@today+1y`, `@today-2y` |

### Arithmetic Examples

```markdown
30 days from now: @today+30

<!-- Output: 2025-08-15 -->

7 days ago: @today-7

<!-- Output: 2025-07-09 -->

6 months from now: @today+6m

<!-- Output: 2026-01-16 -->

1 year ago: @today-1y

<!-- Output: 2024-07-16 -->

2 years from now: @today+2y

<!-- Output: 2027-07-16 -->

90 days ago: @today-90d

<!-- Output: 2025-04-17 -->
```

## Combined Operations

Combine arithmetic operations with format specifiers for powerful date
generation.

### Combined Syntax

Format: `@today[+/-period][format]` or `@today[format][+/-period]`

```markdown
Payment due: @today+30[US]

<!-- Output: 08/15/2025 -->

Contract signed: @today-90[legal]

<!-- Output: April 17, 2025 -->

Expiration: @today+1y[EU]

<!-- Output: 16/07/2026 -->

Review date: @today+6m[ISO]

<!-- Output: 2026-01-16 -->

Notice period: @today+30[legal]

<!-- Output: August 15, 2025 -->
```

### Complex Combinations

```markdown
<!-- Multiple operations -->

Quarterly review: @today+3m[US] Annual review: @today+1y[US] Final deadline:
@today+18m[legal]

<!-- Negative operations with formats -->

Previous quarter: @today-3m[EU] Last year: @today-1y[ISO] 90-day lookback:
@today-90[legal]
```

## Integration with Helpers

You can use `@today` with helper functions for advanced formatting that goes
beyond the built-in format specifiers.

### With formatDate Helper

```markdown
Generation date: {{formatDate(@today, "DD/MM/YYYY")}}

<!-- Output: 16/07/2025 -->

Full date: {{formatDate(@today, "dddd, MMMM Do, YYYY")}}

<!-- Output: Wednesday, July 16th, 2025 -->

Custom format: {{formatDate(@today, "Do day of MMMM, YYYY")}}

<!-- Output: 16th day of July, 2025 -->

Spanish format: {{formatDate(@today, "D de MMMM_ES de YYYY")}}

<!-- Output: 16 de julio de 2025 -->
```

### With Date Arithmetic Helpers

```markdown
Expiry: {{formatDate(addYears(@today, 1), "MMMM Do, YYYY")}}

<!-- Output: July 16th, 2026 -->

Deadline: {{formatDate(addDays(@today, 45), "dddd, MMMM Do, YYYY")}}

<!-- Output: Saturday, August 30th, 2025 -->

Review: {{formatDate(addMonths(@today, 6), "MMMM YYYY")}}

<!-- Output: January 2026 -->
```

### In Conditional Logic

```markdown
{{#if formatDate(@today, "MM") == "12"}} **Year-end processing applies** {{/if}}

{{#if formatDate(@today, "dddd") == "Friday"}} **Weekend processing schedule**
{{/if}}
```

## Examples

### Contract Templates

```yaml
---
contract_date: @today
effective_date: @today
termination_date: @today+1y
review_date: @today+6m
---
```

```markdown
# Service Agreement

**Contract Date:** @today[legal] **Effective Date:**
{{formatDate(effective_date, "MMMM Do, YYYY")}} **Termination Date:**
@today+1y[legal] **Review Date:** @today+6m[US]

This agreement is effective as of @today[legal] and shall remain in effect until
@today+1y[legal].

## Key Dates

- **Execution:** @today[ISO]
- **First Review:** @today+3m[legal]
- **Mid-term Review:** @today+6m[legal]
- **Final Review:** @today+9m[legal]
- **Expiration:** @today+1y[legal]
```

### Invoice Generation

```yaml
---
invoice_date: @today
due_date: @today+30
terms: 30
---
```

```markdown
# Invoice

**Invoice Date:** @today[US] **Due Date:** @today+30[US] **Terms:** Net
{{terms}} days

Payment is due by @today+30[legal]. Late fees apply after @today+45[legal].

**Generated:** {{formatDate(@today, "dddd, MMMM Do, YYYY at h:mm A")}}
```

### Legal Documents

```yaml
---
execution_date: @today
witness_date: @today
notary_date: @today
filing_deadline: @today+10
---
```

```markdown
# Legal Agreement

Executed on this {{formatDate(execution_date, "Do")}} day of
{{formatDate(execution_date, "MMMM")}}, {{formatDate(execution_date, "YYYY")}}.

**Signatures:**

**Party A:** ************\_************ Date: @today[US]

**Party B:** ************\_************ Date: @today[US]

**Witness:** ************\_************ Date: @today[US]

**Notary:** ************\_\_************ Date: @today[US]

**Filing Deadline:** @today+10[legal]
```

### Time-Sensitive Documents

```yaml
---
notice_date: @today
response_deadline: @today+30
appeal_deadline: @today+60
final_deadline: @today+90
---
```

```markdown
# Legal Notice

**Date of Notice:** @today[legal]

## Important Deadlines

- **Response Required By:** @today+30[legal]
- **Appeal Deadline:** @today+60[legal]
- **Final Deadline:** @today+90[legal]

This notice was issued on @today[legal]. You have {{formatInteger(30)}} days
from @today[legal] to respond.

**Time Sensitive:** Response must be received by @today+30[US] at 5:00 PM.
```

### Reporting Templates

```yaml
---
report_date: @today
period_start: @today-1m
period_end: @today
next_report: @today+1m
---
```

```markdown
# Monthly Report

**Report Date:** @today[legal] **Reporting Period:** @today-1m[US] to @today[US]
**Next Report Due:** @today+1m[legal]

## Summary

This report covers the period from @today-1m[legal] through @today[legal].

**Generated:** {{formatDate(@today, "dddd, MMMM Do, YYYY at h:mm A")}} **Next
Review:** @today+1m[legal]
```

### Workflow Documents

```yaml
---
stage_1_start: @today
stage_1_end: @today+2w
stage_2_start: @today+2w
stage_2_end: @today+6w
project_end: @today+8w
---
```

```markdown
# Project Timeline

## Phase 1: Initial Development

**Start:** @today[US] **End:** @today+14[US]

## Phase 2: Testing & Review

**Start:** @today+14[US] **End:** @today+42[US]

## Project Completion

**Final Deadline:** @today+56[legal]

**Status as of @today[legal]:**

- Days since start: 0
- Days until Phase 2: 14
- Days until completion: 56
```

## Best Practices

### 1. Choose Appropriate Formats

```markdown
<!-- ✅ Good - format matches context -->

**Legal Date:** @today[legal] <!-- For legal documents --> **Form Date:**
@today[US] <!-- For US forms --> **Database Date:** @today[ISO]
<!-- For technical systems --> **European Date:** @today[EU]
<!-- For European documents -->

<!-- ❌ Avoid - inappropriate formats -->

**Legal Document:** @today[US] <!-- Too casual for legal --> **Database:**
@today[legal] <!-- Too verbose for data -->
```

### 2. Use Arithmetic for Future/Past Dates

```markdown
<!-- ✅ Good - dynamic date calculation -->

**Contract Expires:** @today+1y[legal] **Payment Due:** @today+30[US] **Review
Date:** @today+6m[legal]

<!-- ❌ Avoid - hardcoded future dates -->

**Contract Expires:** July 16, 2026 **Payment Due:** August 15, 2025
```

### 3. Combine with YAML Variables

```yaml
---
# Use @today in YAML for complex processing
contract_start: @today
contract_duration_years: 2
review_frequency_months: 6
---
```

```markdown
**Start Date:** {{formatDate(contract_start, "MMMM Do, YYYY")}} **End Date:**
{{formatDate(addYears(contract_start, contract_duration_years), "MMMM Do, YYYY")}}
**First Review:**
{{formatDate(addMonths(contract_start, review_frequency_months), "MMMM Do, YYYY")}}
```

### 4. Document Date Logic

```yaml
---
# Date calculation documentation
notice_period_days: 30 # Notice required before termination
grace_period_days: 15 # Additional time for responses
review_cycle_months: 6 # Regular review frequency
contract_term_years: 2 # Total contract duration
---
```

```markdown
**Termination Notice:** {{notice_period_days}} days notice required
({{@today+notice_period_days[US]}}) **Grace Period:** Additional
{{grace_period_days}} days ({{@today+grace_period_days+notice_period_days[US]}})
```

### 5. Handle Time Zones Appropriately

```markdown
<!-- ✅ Good - specify time zone when relevant -->

**Generated:** {{formatDate(@today, "MMMM Do, YYYY")}} (UTC) **Deadline:**
@today+30[US] 11:59 PM EST

<!-- Consider your audience's time zone -->

{{#if client_timezone == "PST"}} **Deadline:** @today+30[US] 11:59 PM PST
{{else}} **Deadline:** @today+30[US] 11:59 PM EST {{/if}}
```

### 6. Validate Date Logic

```markdown
<!-- Use conditional logic to validate dates -->

{{#if formatDate(@today, "dddd") == "Friday"}} **Note:** This document was
generated on a Friday. Next business day processing applies. {{/if}}

<!-- Handle month-end scenarios -->

{{#if formatDate(@today+30, "MM") != formatDate(@today, "MM")}} **Notice:**
Payment due date crosses month boundary. {{/if}}
```

### 7. Provide Date Context

```markdown
<!-- ✅ Good - provide context for dates -->

**Generated:** @today[legal] (automatically updated daily) **Valid Through:**
@today+30[legal] (30 days from generation) **Last Updated:** @today[ISO] (system
timestamp)

<!-- Help users understand date meaning -->

**Response Deadline:** @today+30[legal] _You have 30 calendar days from today
(@today[legal]) to respond._
```

## Error Handling

Special values handle errors gracefully:

- **Invalid arithmetic**: Falls back to base `@today` value
- **Invalid formats**: Uses default ISO format
- **System date issues**: Uses safe fallback date
- **Parsing errors**: Returns unprocessed special value

## Integration with Other Features

### With Template Loops

```yaml
---
milestones:
  - name: 'Phase 1'
    offset_days: 30
  - name: 'Phase 2'
    offset_days: 60
---
```

```markdown
{{#milestones}} **{{name}}:**
{{formatDate(addDays(@today, offset_days), "MMMM Do, YYYY")}} {{/milestones}}
```

### With Conditional Clauses

```markdown
{{#if formatDate(@today, "MM") == "12"}} **Year-End Terms Apply** Special
year-end processing rules are in effect. {{/if}}
```

## See Also

- [Date Helpers](date-helpers.md) - Advanced date formatting and manipulation
- [YAML Frontmatter](../features/yaml-frontmatter.md) - Using special values in
  metadata
- [Variables & Mixins](../features/mixins-variables.md) - Combining special
  values with variables
- [Template Loops](../features/template-loops.md) - Using special values in
  iterations
