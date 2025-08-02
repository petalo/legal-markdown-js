# Headers and Numbering System

This guide explains in detail how to configure and use the hierarchical header
numbering system in Legal Markdown JS.

## Table of Contents

- [Introduction](#introduction)
- [Basic Syntax](#basic-syntax)
- [Default Formats](#default-formats)
- [Template Variables](#template-variables)
- [Custom Configuration](#custom-configuration)
- [Cross-References](#cross-references)
- [Practical Examples](#practical-examples)
- [Special Cases](#special-cases)
- [Troubleshooting](#troubleshooting)

## Introduction

The header numbering system allows creating legal documents with automatic
hierarchical structure, compatible with professional legal documentation
standards.

### Key Features

- **9 hierarchy levels** (Articles, Sections, Subsections, Sub-subsections,
  Paragraphs, Annexes, and 3 additional extended levels)
- **Automatic numbering** with intelligent reset
- **Configurable indentation** for each level
- **Customizable templates** for each format
- **Enhanced variable system** with %A, %a, %R, %r, %l1-l9, %o support
- **Undefined level fallbacks** rendered as {{undefined-level-n}} templates
- **Compatibility** with the original legal-markdown standard

## Basic Syntax

### Traditional Notation

```markdown
l. Level 1 - Article ll. Level 2 - Section lll. Level 3 - Subsection llll. Level
4 - Sub-subsection lllll. Level 5 - Paragraph llllll. Level 6 - Annex
```

### Alternative Notation

```markdown
l1. Level 1 - Article l2. Level 2 - Section l3. Level 3 - Subsection l4. Level
4 - Sub-subsection l5. Level 5 - Paragraph l6. Level 6 - Annex
```

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

## Default Formats

Legal Markdown JS now uses **undefined fallbacks** instead of hardcoded
defaults. The system only applies formatting when explicitly defined in YAML
metadata.

| Level | Notation              | Auto-Population Default | Undefined Fallback      |
| ----- | --------------------- | ----------------------- | ----------------------- |
| 1     | `l.` or `l1.`         | `Article %n.`           | `{{undefined-level-1}}` |
| 2     | `ll.` or `l2.`        | `Section %n.`           | `{{undefined-level-2}}` |
| 3     | `lll.` or `l3.`       | `%n.`                   | `{{undefined-level-3}}` |
| 4     | `llll.` or `l4.`      | `(%n)`                  | `{{undefined-level-4}}` |
| 5     | `lllll.` or `l5.`     | `(%A)`                  | `{{undefined-level-5}}` |
| 6     | `llllll.` or `l6.`    | `(%a)`                  | `{{undefined-level-6}}` |
| 7     | `lllllll.` or `l7.`   | `(%R)`                  | `{{undefined-level-7}}` |
| 8     | `llllllll.` or `l8.`  | `(%r)`                  | `{{undefined-level-8}}` |
| 9     | `lllllllll.` or `l9.` | `%n.`                   | `{{undefined-level-9}}` |

The **Auto-Population Default** patterns are defined in
`src/constants/headers.ts` and are used when the CLI `--headers` flag
automatically populates YAML front matter. Users can modify these default
patterns by editing the `DEFAULT_HEADER_PATTERNS` constant in that file.

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

**Important**: These variables are used for academic/hierarchical numbering
patterns where you need to reference specific level numbers in dotted notation.

### Special Variables (Leading Zeros)

| Variable | Description                              | Example             |
| -------- | ---------------------------------------- | ------------------- |
| `%02n`   | Current level with 2-digit leading zeros | `01`, `02`, `10`    |
| `%03n`   | Current level with 3-digit leading zeros | `001`, `002`, `010` |
| `%02l1`  | Level 1 with 2-digit leading zeros       | `01`, `02`          |
| `%02l2`  | Level 2 with 2-digit leading zeros       | `01`, `02`          |
| `%02l3`  | Level 3 with 2-digit leading zeros       | `01`, `02`          |
| `%02l4`  | Level 4 with 2-digit leading zeros       | `01`, `02`          |
| `%03l1`  | Level 1 with 3-digit leading zeros       | `001`, `002`        |
| `%03l2`  | Level 2 with 3-digit leading zeros       | `001`, `002`        |
| `%04l1`  | Level 1 with 4-digit leading zeros       | `0001`, `0002`      |

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

### Custom Format Examples

#### Academic Format (Hierarchical Dotted Numbering)

```yaml
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-five: '%l1.%l2.%l3.%l4.%l5'
level-six: 'Annex %R -'
```

**Example Output:**

```text
1. Introduction
   1.1 Background
      1.1.1 Previous Work
2. Methodology
   2.1 Data Collection
      2.1.1 Analysis Methods
         2.1.1.1 Statistical Tests
```

#### Roman Numeral Hierarchical Format (Lowercase)

```yaml
level-one: '%r.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
```

**Example Output:**

```text
i. First Main
ii. Second Main
iii. Third Main
   iii.1 Sub under third
      (1) Sub-sub
         (1a) Deep level
            (1ai) Deepest level
```

#### Roman Numeral Hierarchical Format (Uppercase)

```yaml
level-one: '%R.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%R)'
level-six: 'Annex %R -'
```

**Example Output:**

```text
I. First Main
II. Second Main
III. Third Main
   III.1 Sub under third
      (1) Sub-sub
         (1a) Deep level
            (1aI) Deepest level
               Annex I - Annex content
```

#### Alphabetic Hierarchical Format

```yaml
level-one: '%a.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l1%l4)'
level-five: '(%l1%l4%r)'
```

**Example Output:**

```text
a. Alpha
b. Bravo
c. Charlie
   c.1 Sub Charlie
      (c) Sub-sub
         (c1) Deep
            (c1i) Deepest
```

#### Mixed Custom Format

```yaml
level-one: 'Part %r'
level-two: 'Chapter %l2'
level-three: 'Section %a'
level-four: 'Subsection %l3%a'
level-five: 'Item %l3%a%r'
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

## Cross-References

Legal Markdown supports cross-references to internal sections using the
`|reference|` syntax. Cross-references allow you to reference other numbered
sections within the same document.

### Basic Cross-Reference Syntax

```markdown
l. **Introduction** |intro|

This section introduces the key concepts.

l. **Implementation** |implementation|

As discussed in |intro|, the implementation follows these principles.
```

### How Cross-References Work

1. **Section Markers**: Add `|key|` after any numbered section header
2. **References**: Use `|key|` anywhere in the document to reference that
   section
3. **Automatic Replacement**: References are replaced with the section's number
   and title

### Cross-Reference Examples

#### Simple References

```markdown
l. **Services** |services|

ll. **Scope** |scope|

The scope defined in |scope| applies to all |services|.
```

**Output:**

```markdown
Article 1. Services

Section 1. Scope

The scope defined in Section 1. Scope applies to all Article 1. Services.
```

#### Complex Document Structure

```markdown
l. **Terms and Conditions** |terms|

ll. **Payment Terms** |payment|

ll. **Delivery Terms** |delivery|

l. **Compliance** |compliance|

All obligations in |terms|, including |payment| and |delivery|, must comply with
|compliance| requirements.
```

### Important Notes

- **Unique Keys**: Each reference key must be unique within the document
- **Case Sensitive**: Reference keys are case-sensitive
- **No Spaces**: Keys cannot contain spaces or special characters
- **Fallback**: If a reference key is not found as an internal section, the
  system falls back to metadata variables

### Automatic Cross-References Metadata

When processing documents with cross-references, Legal Markdown automatically
generates metadata containing all internal section references found in the
document. This metadata is stored in the protected field `_cross_references`.

#### Metadata Structure

Each cross-reference entry contains:

- `key`: The reference key used in the document
- `sectionNumber`: The formatted section number (e.g., "Article 1.")
- `sectionText`: The complete section text including number and title

#### Example Metadata Output

For a document with cross-references:

```markdown
l. **Definitions** |definitions| l. **Payment Terms** |payment| l.
**Termination** |termination|
```

The generated metadata will be:

```yaml
_cross_references:
  - key: 'definitions'
    sectionNumber: 'Article 1.'
    sectionText: 'Article 1. **Definitions**'
  - key: 'payment'
    sectionNumber: 'Article 2.'
    sectionText: 'Article 2. **Payment Terms**'
  - key: 'termination'
    sectionNumber: 'Article 3.'
    sectionText: 'Article 3. **Termination**'
```

#### Usage

This metadata is useful for:

- **Document analysis**: Understanding the structure and references in legal
  documents
- **Export integration**: Accessing cross-references data in YAML/JSON exports
- **External systems**: Integrating with document management or analysis tools
- **Validation**: Ensuring all references are properly defined and used

The `_cross_references` field is automatically included when exporting metadata
using `meta-yaml-output` or `meta-json-output` configuration options.

### Cross-References vs Mixins

Legal Markdown uses two distinct syntaxes for different purposes:

| Syntax          | Purpose                     | Example          | Output                     |
| --------------- | --------------------------- | ---------------- | -------------------------- |
| `\|reference\|` | Internal section references | `\|payment\|`    | "Section 2. Payment Terms" |
| `{{variable}}`  | Variables and helpers       | `{{party_name}}` | "ACME Corporation"         |

## Practical Examples

### Example 1: Complete Legal Document

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

### Generated Output - Complete Legal Document

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

### Example 2: Academic Format with Decimal Numbering

```markdown
---
title: 'AI Research'
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-five: '%l1.%l2.%l3.%l4.%l5'
level-indent: 2.0
---

l. Introduction ll. Background lll. History of AI llll. Early Developments
lllll. Turing Machine

l. Methodology ll. Study Design ll. Data Collection
```

### Generated Output - Academic Format with Decimal Numbering

```markdown
1. Introduction 1.1 Background 1.1.1 History of AI 1.1.1.1 Early Developments
   1.1.1.1.1 Turing Machine

2. Methodology 2.1 Study Design 2.2 Data Collection
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

**Example with outline numbering:**

```yaml
level-five: '(%n)'
```

**Output:**

```text
      a) Subpoint A
         (1) Detail One
         (2) Detail Two
      b) Subpoint B
         (1) Another Item
```

### Leading Zero Formatting

Use leading zeros for formal document numbering:

```yaml
level-one: '%02n.'
level-two: '%02l1.%02l2'
level-three: '(%02l3)'
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

**Problem**: Numbers don't increment correctly.

**Solution**: Verify there are no extra spaces or special characters in the `l.`
notation.

#### 2. Inconsistent Indentation

**Problem**: Indentation doesn't match expectations.

**Solution**: Adjust the `level-indent` value in the front matter:

```yaml
level-indent: 1.5  # Default value
level-indent: 2.0  # More indentation
level-indent: 1.0  # Less indentation
```

#### 3. Incorrect Template Format

**Problem**: Variables `%n`, `%a`, `%r` are not replaced.

**Solution**: Verify template syntax:

```yaml
# Correct
level-four: "(%n%a)"

# Incorrect (missing %)
level-four: "(nc)"
```

#### 4. Unexpected Numbering Reset

**Problem**: Numbers reset when they shouldn't.

**Solution**: Verify hierarchical structure. Numbering resets when returning to
a higher level.

#### 5. Hierarchical Format Variables Not Working

**Problem**: Academic format with level references shows wrong numbers.

**Solution**: Use the `%l1`-`%l9` variables for hierarchical formatting:

```yaml
# Correct academic format
level-two: "%l1.%l2"        # Level 1 . Level 2
level-three: "%l1.%l2.%l3"  # Level 1 . Level 2 . Level 3

# Modern format with clear level references
level-two: "%l1.%l2"        # Level 1 . Level 2
```

#### 6. Current vs Reference Variables Confusion

**Problem**: Mixing current level variables (%n, %a, %r) with level references.

**Solution**: Understand the difference:

- **Current level**: `%n`, `%a`, `%r`, `%R`, `%A` always refer to current level
- **Level references**: `%l1`, `%l2`, `%l3`, etc. refer to specific levels

```yaml
# For level 2 format:
level-two: '%l1.%l2'  # "1.2" (level 1 number . level 2 number)
level-two: '%n'       # "2" (just current level number)
```

#### 7. Consecutive Level 5 Not Incrementing

**Problem**: Multiple level 5 items show same number.

**Solution**: This is now fixed automatically. Consecutive level 5 items
increment properly:

```markdown
lllll. Detail One # (1) lllll. Detail Two # (2) - automatically increments
```

### Format Validation

To verify the format is correct, use debug mode:

```bash
legal-md --debug input.md output.md
```

### Debugging Examples

#### Input with Error

```markdown
l . Article with extra space ll.Section without space
```

#### Correct Input

```markdown
l. Correct article ll. Correct section
```

## Quick Reference

### Minimal Syntax

```markdown
l. Level 1 # Article 1. ll. Level 2 # Section 1. lll. Level 3 # (1) llll. Level
4 # (1a) lllll. Level 5 # (1ai)
```

### Popular Format Configurations

#### Standard Legal Format

```yaml
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
level-four: '(%n%a)'
level-five: '(%n%a%r)'
```

#### Academic Format

```yaml
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-five: '%l1.%l2.%l3.%l4.%l5'
```

#### Roman Hierarchical

```yaml
level-one: '%r.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
```

### Essential Variables

| Variable | Current Level Use               | Hierarchical Use | Example              |
| -------- | ------------------------------- | ---------------- | -------------------- |
| `%n`     | Current level number            | -                | `1`, `2`             |
| `%a`     | Current level letter            | -                | `a`, `b`             |
| `%r`     | Current level roman (lowercase) | -                | `i`, `ii`            |
| `%R`     | Current level roman (uppercase) | -                | `I`, `II`            |
| `%l1`    | -                               | Level 1 number   | In `%l1.%l2`         |
| `%l2`    | -                               | Level 2 number   | In `%l1.%l2.%l3`     |
| `%l3`    | -                               | Level 3 number   | In `%l1.%l2.%l3.%l4` |
| `%l4+`   | -                               | Level 4+ numbers | Extended hierarchy   |

### Format Pattern Recognition

- **Level references** (`%l1.%l2`, `%l1.%l2.%l3`): Academic/hierarchical
  numbering with specific level references
- **Current level only** (`%n`, `%a`, `%r`, `%R`, `%A`): Simple current level
  formatting
- **Combined current + references** (`%l3%a`, `%l1.%l4%r`): Mixed patterns using
  both systems

---

**Tip**: Start with default formats and customize gradually according to your
specific needs.

**Additional Resources**:

- [README.md](../README.md) - General documentation
- [Tests](../tests/unit/processors/header-processor.unit.test.ts) - Use case
  examples
