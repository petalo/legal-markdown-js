# Headers and Numbering System

The hierarchical header numbering system allows creating legal documents with
automatic structure, compatible with professional legal documentation standards.

## Table of Contents

- [Introduction](#introduction)
- [Basic Syntax](#basic-syntax)
- [9-Level Hierarchy](#9-level-hierarchy)
- [Template Variables](#template-variables)
- [Custom Configuration](#custom-configuration)
- [Format Examples](#format-examples)
- [Practical Examples](#practical-examples)
- [Special Cases](#special-cases)
- [Troubleshooting](#troubleshooting)

## Introduction

Legal Markdown supports hierarchical numbering with automatic indentation and
intelligent reset capabilities. The system provides flexible formatting for
different legal document styles.

### Key Features

- **9 hierarchy levels** (Articles, Sections, Subsections, Sub-subsections,
  Paragraphs, Annexes, and 3 additional extended levels)
- **Automatic numbering** with intelligent reset
- **Configurable indentation** for each level
- **Customizable templates** for each format
- **Enhanced variable system** with %A, %a, %R, %r, %l1-l9, %o support
- **Undefined level fallbacks** rendered as {{undefined-level-n}} templates
- **Auto-population**: CLI `--headers` flag automatically populates YAML front
  matter

## Basic Syntax

### Traditional Notation

Use repeated 'l' characters followed by a period:

```markdown
l. Level 1 - Article ll. Level 2 - Section lll. Level 3 - Subsection llll. Level
4 - Sub-subsection lllll. Level 5 - Paragraph llllll. Level 6 - Annex lllllll.
Level 7 - Extended Level 1 llllllll. Level 8 - Extended Level 2 lllllllll. Level
9 - Extended Level 3
```

### Alternative Notation

Use 'l' followed by the level number:

```markdown
l1. Level 1 - Article l2. Level 2 - Section l3. Level 3 - Subsection l4. Level
4 - Sub-subsection l5. Level 5 - Paragraph l6. Level 6 - Annex l7. Level 7 -
Extended Level 1 l8. Level 8 - Extended Level 2 l9. Level 9 - Extended Level 3
```

## 9-Level Hierarchy

### Level Definitions

| Level | Notation              | Default Format | Typical Use      |
| ----- | --------------------- | -------------- | ---------------- |
| 1     | `l.` or `l1.`         | `Article %n.`  | Main articles    |
| 2     | `ll.` or `l2.`        | `Section %n.`  | Sections         |
| 3     | `lll.` or `l3.`       | `%n.`          | Subsections      |
| 4     | `llll.` or `l4.`      | `(%n)`         | Sub-subsections  |
| 5     | `lllll.` or `l5.`     | `(%A)`         | Paragraphs       |
| 6     | `llllll.` or `l6.`    | `(%a)`         | Annexes          |
| 7     | `lllllll.` or `l7.`   | `(%R)`         | Extended Level 1 |
| 8     | `llllllll.` or `l8.`  | `(%r)`         | Extended Level 2 |
| 9     | `lllllllll.` or `l9.` | `%n.`          | Extended Level 3 |

### Input Example

```markdown
---
title: 'Service Agreement'
---

l. SERVICES ll. Scope of Services The provider will provide consulting services
as described in Annex A.

ll. Performance Standards Services will be performed professionally and in
accordance with industry standards.

l. COMPENSATION ll. Fees The client will pay the provider the sum of $5,000 as
compensation.

ll. Payment Terms Payment will be made within 30 days after receipt of the
invoice.
```

### Generated Output

```markdown
Article 1. SERVICES Section 1. Scope of Services The provider will provide
consulting services as described in Annex A.

Section 2. Performance Standards Services will be performed professionally and
in accordance with industry standards.

Article 2. COMPENSATION Section 1. Fees The client will pay the provider the sum
of $5,000 as compensation.

Section 2. Payment Terms Payment will be made within 30 days after receipt of
the invoice.
```

## Template Variables

### Basic Variables

| Variable | Description                     | Example             |
| -------- | ------------------------------- | ------------------- |
| `%n`     | Number of current level         | `1`, `2`, `3`       |
| `%R`     | Roman numeral (uppercase)       | `I`, `II`, `III`    |
| `%r`     | Roman numeral (lowercase)       | `i`, `ii`, `iii`    |
| `%A`     | Alphabetic letter (uppercase)   | `A`, `B`, `C`       |
| `%a`     | Alphabetic letter (lowercase)   | `a`, `b`, `c`       |
| `%o`     | Ordinal number (fallback to %n) | `1st`, `2nd`, `3rd` |

### Variable Behavior by Context

#### Standard Formats (Current Level Variables)

All basic variables (`%n`, `%r`, `%R`, `%A`, `%a`, `%o`) refer to the current
level number:

- `%n` = current level number
- `%a` = current level as lowercase letter
- `%A` = current level as uppercase letter
- `%r` = current level as lowercase roman numeral
- `%R` = current level as uppercase roman numeral
- `%o` = current level as ordinal (fallback to %n)

#### Hierarchical Formats (Level Reference Variables)

For academic/dotted notation or cross-level references, use the `%l1` through
`%l9` variables:

- `%l1` = level 1 number, `%l2` = level 2 number, etc.
- **Format pattern**: `%l1.%l2`, `%l1.%l2.%l3`, etc.
- **Example**: `level-three: "%l1.%l2.%l3"` → "1.2.3"

### Extended Level Variables (Direct Level References)

| Variable | Description    | Reference Level | Example Use                         |
| -------- | -------------- | --------------- | ----------------------------------- |
| `%l1`    | Level 1 number | First Level     | `%l1` → "1"                         |
| `%l2`    | Level 2 number | Second Level    | `%l1.%l2` → "1.2"                   |
| `%l3`    | Level 3 number | Third Level     | `%l1.%l2.%l3` → "1.2.3"             |
| `%l4`    | Level 4 number | Fourth Level    | `%l1.%l2.%l3.%l4` → "1.2.3.4"       |
| `%l5`    | Level 5 number | Fifth Level     | `%l1.%l2.%l3.%l4.%l5` → "1.2.3.4.5" |
| `%l6`    | Level 6 number | Sixth Level     | `%l1.%l6` → "1.6"                   |
| `%l7`    | Level 7 number | Seventh Level   | `%l1.%l7` → "1.7"                   |
| `%l8`    | Level 8 number | Eighth Level    | `%l1.%l8` → "1.8"                   |
| `%l9`    | Level 9 number | Ninth Level     | `%l1.%l9` → "1.9"                   |

### Special Variables (Leading Zeros)

| Variable | Description                              | Example             |
| -------- | ---------------------------------------- | ------------------- |
| `%02n`   | Current level with 2-digit leading zeros | `01`, `02`, `10`    |
| `%03n`   | Current level with 3-digit leading zeros | `001`, `002`, `010` |
| `%02l1`  | Level 1 with 2-digit leading zeros       | `01`, `02`          |
| `%02l2`  | Level 2 with 2-digit leading zeros       | `01`, `02`          |
| `%02l3`  | Level 3 with 2-digit leading zeros       | `01`, `02`          |
| `%03l1`  | Level 1 with 3-digit leading zeros       | `001`, `002`        |

**Pattern**: Use `%0Xn` for current level or `%0Xl1` through `%0Xl9` for
specific level references, where X is the number of digits.

## Custom Configuration

### Configuration in YAML Front Matter

```yaml
---
title: 'My Legal Document'
# Custom formats for each level
level-one: 'Chapter %n:'
level-two: 'Section %l1.%l2'
level-three: 'Subsection (%n)'
level-four: 'Part %n%a'
level-five: 'Item %n%a%r'
level-six: 'Annex %R -'
# Custom indentation (em)
level-indent: 2.0
---
```

### Undefined Level Fallbacks

Legal Markdown JS uses **undefined fallbacks** instead of hardcoded defaults.
The system only applies formatting when explicitly defined in YAML metadata.

| Level | Auto-Population Default | Undefined Fallback      |
| ----- | ----------------------- | ----------------------- |
| 1     | `Article %n.`           | `{{undefined-level-1}}` |
| 2     | `Section %n.`           | `{{undefined-level-2}}` |
| 3     | `%n.`                   | `{{undefined-level-3}}` |
| 4     | `(%n)`                  | `{{undefined-level-4}}` |
| 5     | `(%A)`                  | `{{undefined-level-5}}` |
| 6     | `(%a)`                  | `{{undefined-level-6}}` |
| 7     | `(%R)`                  | `{{undefined-level-7}}` |
| 8     | `(%r)`                  | `{{undefined-level-8}}` |
| 9     | `%n.`                   | `{{undefined-level-9}}` |

**Important**: Levels without metadata definitions will render as
`{{undefined-level-n}}` templates instead of hardcoded values. This ensures
templates remain reusable and don't produce unexpected formatting.

### Default Indentation

- **Level 1**: No indentation
- **Level 2**: 3 spaces (1.5 × 2)
- **Level 3**: 6 spaces (3.0 × 2)
- **Level 4**: 9 spaces (4.5 × 2)
- **Level 5**: 12 spaces (6.0 × 2)
- **Level 6**: 15 spaces (7.5 × 2)
- **Level 7**: 18 spaces (9.0 × 2)
- **Level 8**: 21 spaces (10.5 × 2)
- **Level 9**: 24 spaces (12.0 × 2)

> Indentation is calculated as: `(level - 1) × level-indent × 2` spaces

## Format Examples

### Academic Format (Hierarchical Dotted Numbering)

```yaml
---
title: 'Research Paper'
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-five: '%l1.%l2.%l3.%l4.%l5'
level-six: 'Annex %R -'
level-indent: 2.0
---
```

**Example Output:**

```text
1. Introduction
   1.1 Background
      1.1.1 Previous Work
         1.1.1.1 Statistical Methods
            1.1.1.1.1 Data Analysis
2. Methodology
   2.1 Study Design
   2.2 Data Collection
```

### Roman Numeral Format

```yaml
---
title: 'Legal Brief'
level-one: '%R.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
level-six: 'Annex %R -'
---
```

**Example Output:**

```text
I. First Main Section
II. Second Main Section
III. Third Main Section
     III.1 Sub under third
        (1) Sub-sub
           (1a) Deep level
              (1ai) Deepest level
                 Annex I - Annex content
```

### Mixed Custom Format

```yaml
---
title: 'Policy Manual'
level-one: 'Part %r'
level-two: 'Chapter %l2'
level-three: 'Section %a'
level-four: 'Subsection %l3%a'
level-five: 'Item %l3%a%r'
---
```

**Example Output:**

```text
Part i Introduction
   Chapter 1 Overview
      Section a Scope
         Subsection 1a Limitations
            Item 1ai Technical Constraints
Part ii Main Content
   Chapter 1 Analysis
      Section a Results
```

## Practical Examples

### Complete Legal Document

```markdown
---
title: 'Software License Agreement'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
level-four: '(%n%a)'
level-five: '(%n%a%r)'
level-indent: 1.5
---

l. DEFINITIONS ll. Software "Software" means the computer program licensed under
this Agreement.

ll. License "License" means the terms and conditions for use, reproduction and
distribution.

l. LICENSE GRANT ll. Rights Granted lll. Personal Use The licensee may use the
Software for personal purposes.

lll. Commercial Use llll. Restrictions Commercial use requires separate license.

llll. Conditions lllll. Notification The licensor must be notified before
commercial use.

lllll. Payment Commercial fees will apply according to the current price table.

l. LIMITATIONS ll. Use Restrictions The Software may not be used for illegal
activities.
```

**Generated Output:**

```markdown
Article 1. DEFINITIONS Section 1. Software "Software" means the computer program
licensed under this Agreement.

Section 2. License "License" means the terms and conditions for use,
reproduction and distribution.

Article 2. LICENSE GRANT Section 1. Rights Granted (1) Personal Use The licensee
may use the Software for personal purposes.

      (2) Commercial Use
         (2a) Restrictions

Commercial use requires separate license.

         (2b) Conditions
            (2bi) Notification

The licensor must be notified before commercial use.

            (2bii) Payment

Commercial fees will apply according to the current price table.

Article 3. LIMITATIONS Section 1. Use Restrictions The Software may not be used
for illegal activities.
```

## Special Cases

### Skipped Level Numbering

When a level is skipped in the hierarchy, the system automatically initializes
intermediate levels:

```markdown
l. Level 1 lll. Level 3 (skipped level 2)
```

Output:

```markdown
Article 1. Level 1 (1) Level 3 (skipped level 2)
```

### Numbering Reset

Numbering automatically resets when returning to a higher level:

```markdown
l. First Article ll. First Section ll. Second Section l. Second Article ll.
First Section (resets to 1)
```

### Consecutive Level 5 Numbering

Level 5 elements have special handling for consecutive items:

- **Consecutive level 5 items**: Automatically increment the level 5 number
- **Roman numerals**: Always use lowercase (`i`, `ii`, `iii`)
- **Custom formats**: Work correctly with simple patterns like `(%n)`

```markdown
llll. Subpoint A lllll. Detail One # Output: (1) Detail One lllll. Detail Two #
Output: (2) Detail Two llll. Subpoint B lllll. Another Item # Output: (1)
Another Item (resets)
```

### Leading Zero Formatting

Use leading zeros for formal document numbering:

```yaml
---
level-one: '%02n.'
level-two: '%02l1.%02l2'
level-three: '(%02l3)'
---
```

**Example Output:**

```text
01. First Section
    01.01 First Subsection
       (01) First Item
11. Eleventh Section
    11.01 First Under Eleven
```

## Troubleshooting

### Common Problems

#### 1. Incorrect Numbering

**Problem**: Numbers don't increment correctly. **Solution**: Verify there are
no extra spaces or special characters in the `l.` notation.

#### 2. Inconsistent Indentation

**Problem**: Indentation doesn't match expectations. **Solution**: Adjust the
`level-indent` value in the front matter:

```yaml
level-indent: 1.5  # Default value
level-indent: 2.0  # More indentation
level-indent: 1.0  # Less indentation
```

#### 3. Incorrect Template Format

**Problem**: Variables `%n`, `%a`, `%r` are not replaced. **Solution**: Verify
template syntax:

```yaml
# Correct
level-four: "(%n%a)"

# Incorrect (missing %)
level-four: "(nc)"
```

#### 4. Hierarchical Format Variables Not Working

**Problem**: Academic format with level references shows wrong numbers.
**Solution**: Use the `%l1`-`%l9` variables for hierarchical formatting:

```yaml
# Correct academic format
level-two: '%l1.%l2' # Level 1 . Level 2
level-three: '%l1.%l2.%l3' # Level 1 . Level 2 . Level 3
```

#### 5. Current vs Reference Variables Confusion

**Problem**: Mixing current level variables (%n, %a, %r) with level references.
**Solution**: Understand the difference:

- **Current level**: `%n`, `%a`, `%r`, `%R`, `%A` always refer to current level
- **Level references**: `%l1`, `%l2`, `%l3`, etc. refer to specific levels

```yaml
# For level 2 format:
level-two: '%l1.%l2'  # "1.2" (level 1 number . level 2 number)
level-two: '%n'       # "2" (just current level number)
```

### Format Validation

To verify the format is correct, use debug mode:

```bash
legal-md --debug input.md output.md
```

### Quick Reference

#### Popular Format Configurations

**Standard Legal Format:**

```yaml
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
level-four: '(%n%a)'
level-five: '(%n%a%r)'
```

**Academic Format:**

```yaml
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-five: '%l1.%l2.%l3.%l4.%l5'
```

**Roman Hierarchical:**

```yaml
level-one: '%r.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
```

## CSS Classes for Styling

Legal headers automatically receive CSS classes that allow you to style them by
level:

```html
<!-- Generated HTML for legal headers -->
<h1 class="legal-header-level-1">Article 1. Introduction</h1>
<h2 class="legal-header-level-2">Section 1. Scope</h2>
<h3 class="legal-header-level-3">1. Definitions</h3>
```

These classes (`legal-header-level-1` through `legal-header-level-9`) allow you
to:

- Style headers by their hierarchy level
- Apply consistent formatting across documents
- Create print-friendly styles for PDF generation

**Example CSS:**

```css
.legal-header-level-1 {
  font-size: 1.6em;
  font-weight: bold;
  page-break-after: avoid;
}

.legal-header-level-2 {
  font-size: 1.3em;
  font-weight: 600;
}
```

For complete documentation on CSS classes and styling options, see the
[CSS Classes Reference](../output/css-classes.md).

## See Also

- [CSS Classes Reference](../output/css-classes.md) - Complete CSS styling guide
- [YAML Frontmatter](yaml-frontmatter.md) - Configuring header formats
- [Cross-References](cross-references.md) - Referencing numbered sections
- [CLI Reference](../cli_reference.md) - `--headers` flag for auto-population
- [Custom Headers](../advanced/custom-headers.md) - Advanced header
  customization
