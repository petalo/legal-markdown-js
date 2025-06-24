# Headers & Numbering System

This guide explains in detail how to configure and use the hierarchical header numbering system in Legal Markdown Wizard.

## 📋 Table of Contents

- [Introduction](#introduction)
- [Basic Syntax](#basic-syntax)
- [Default Formats](#default-formats)
- [Template Variables](#template-variables)
- [Custom Configuration](#custom-configuration)
- [Practical Examples](#practical-examples)
- [Special Cases](#special-cases)
- [Troubleshooting](#troubleshooting)

## Introduction

The header numbering system allows creating legal documents with automatic hierarchical structure, compatible with professional legal documentation standards.

### Key Features

- **5 hierarchy levels** (Articles, Sections, Subsections, Sub-subsections, Paragraphs)
- **Automatic numbering** with intelligent reset
- **Configurable indentation** for each level
- **Customizable templates** for each format
- **Compatibility** with the original legal-markdown standard

## Basic Syntax

### Traditional Notation

```markdown
l. Level 1 - Article
ll. Level 2 - Section
lll. Level 3 - Subsection
llll. Level 4 - Sub-subsection
lllll. Level 5 - Paragraph
```

### Alternative Notation

```markdown
l1. Level 1 - Article
l2. Level 2 - Section
l3. Level 3 - Subsection
l4. Level 4 - Sub-subsection
l5. Level 5 - Paragraph
```

### Input Example

```markdown
---
title: "Service Agreement"
---

l. SERVICES
ll. Scope of Services
The provider will provide consulting services as described in Annex A.

ll. Performance Standards
Services will be performed professionally and in accordance with industry standards.

l. COMPENSATION
ll. Fees
The client will pay the provider the sum of $5,000 as compensation.

ll. Payment Terms
Payment will be made within 30 days after receipt of the invoice.
```

### Generated Output

```markdown
Article 1. SERVICES
   Section 1. Scope of Services
The provider will provide consulting services as described in Annex A.

   Section 2. Performance Standards
Services will be performed professionally and in accordance with industry standards.

Article 2. COMPENSATION
   Section 1. Fees
The client will pay the provider the sum of $5,000 as compensation.

   Section 2. Payment Terms
Payment will be made within 30 days after receipt of the invoice.
```

## Default Formats

| Level | Notation          | Default Format | Output Example |
| ----- | ----------------- | -------------- | -------------- |
| 1     | `l.` or `l1.`     | `Article %n.`  | `Article 1.`   |
| 2     | `ll.` or `l2.`    | `Section %n.`  | `Section 1.`   |
| 3     | `lll.` or `l3.`   | `(%n)`         | `(1)`          |
| 4     | `llll.` or `l4.`  | `(%n%c)`       | `(1a)`         |
| 5     | `lllll.` or `l5.` | `(%n%c%r)`     | `(1ai)`        |

### Default Indentation

- **Level 1**: No indentation
- **Level 2**: 3 spaces (1.5 × 2)
- **Level 3**: 6 spaces (3.0 × 2)
- **Level 4**: 9 spaces (4.5 × 2)
- **Level 5**: 12 spaces (6.0 × 2)

> Indentation is calculated as: `(level - 1) × level-indent × 2` spaces

## Template Variables

### Basic Variables

| Variable | Description                                                 | Example          |
| -------- | ----------------------------------------------------------- | ---------------- |
| `%n`     | Number of current level OR level 1 in hierarchical formats | `1`, `2`, `3`    |
| `%c`     | Alphabetic letter of current level OR level 1 reference    | `a`, `b`, `c`    |
| `%r`     | Roman numeral (lowercase for level 5)                      | `i`, `ii`, `iii` |

### Variable Behavior by Context

#### Standard Formats (Default behavior)
- **Levels 1-3**: `%n` = number of current level
- **Level 4**: `%n` = number of level 3, `%c` = letter of level 4 (format: `(%n%c)`)
- **Level 5**: `%n` = number of level 3, `%c` = letter of level 4, `%r` = roman of level 5 (format: `(%n%c%r)`)

#### Hierarchical Formats (Academic/Dotted notation)
- **Format pattern**: `%n.%s`, `%n.%s.%t`, etc.
- **Level 1**: `%n` = level 1 number
- **Level 2+**: `%n` = level 1 number, `%s`/`%t`/`%f`/`%i` = respective level numbers

#### Mixed Hierarchical Formats (Roman/Alphabetic with dots)
- **Format pattern**: `%r.%n`, `%c.%n`
- **`%r` or `%c` before dot**: References level 1 value
- **`%n` after dot**: Current level number

### Reference Variables (for Hierarchical Formats)

| Variable | Description                    | Reference Level | Example Use |
| -------- | ------------------------------ | --------------- | ----------- |
| `%s`     | Level 2 number                 | Second Level    | `%n.%s` → "2.1" |
| `%t`     | Level 3 number                 | Third Level     | `%n.%s.%t` → "2.1.1" |
| `%f`     | Level 4 number                 | Fourth Level    | `%n.%s.%t.%f` → "2.1.1.1" |
| `%i`     | Level 5 number                 | Fifth Level     | `%n.%s.%t.%f.%i` → "2.1.1.1.1" |

**Important**: These variables are used for academic/hierarchical numbering patterns where you need to reference specific level numbers in dotted notation.

### Special Variables

| Variable | Description                | Example             |
| -------- | -------------------------- | ------------------- |
| `%02n`   | Number with leading zeros  | `01`, `02`, `10`    |
| `%03n`   | Number with 3 digits       | `001`, `002`, `010` |
| `%02s`   | Section with leading zeros | `01`, `02`          |

## Custom Configuration

### Configuration in YAML Front Matter

```yaml
---
title: "My Legal Document"
# Custom formats for each level
level-one: "Chapter %n:"
level-two: "Section %n.%s"
level-three: "Subsection (%n)"
level-four: "Part %n%c"
level-five: "Item %n%c%r"
# Custom indentation (em)
level-indent: 2.0
---
```

### Custom Format Examples

#### Academic Format (Hierarchical Dotted Numbering)
```yaml
level-one: "%n."
level-two: "%n.%s"
level-three: "%n.%s.%t"
level-four: "%n.%s.%t.%f"
level-five: "%n.%s.%t.%f.%i"
```

**Example Output:**
```
1. Introduction
   1.1 Background
      1.1.1 Previous Work
2. Methodology
   2.1 Data Collection
      2.1.1 Analysis Methods
         2.1.1.1 Statistical Tests
```

#### Roman Numeral Hierarchical Format
```yaml
level-one: "%r."
level-two: "%r.%n"
level-three: "(%n)"
level-four: "(%n%c)"
level-five: "(%n%c%r)"
```

**Example Output:**
```
i. First Main
ii. Second Main
iii. Third Main
   iii.1 Sub under third
      (1) Sub-sub
         (1a) Deep level
            (1ai) Deepest level
```

#### Alphabetic Hierarchical Format
```yaml
level-one: "%c."
level-two: "%c.%n"
level-three: "(%c)"
level-four: "(%c%n)"
level-five: "(%c%n%r)"
```

**Example Output:**
```
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
level-one: "Part %r"
level-two: "Chapter %n"
level-three: "Section %c"
level-four: "Subsection %n%c"
level-five: "Item %n%c%r"
```

**Example Output:**
```
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

### Example 1: Complete Legal Document

```markdown
---
title: "Software License Agreement"
level-one: "Article %n."
level-two: "Section %n."
level-three: "(%n)"
level-four: "(%n%c)"
level-five: "(%n%c%r)"
level-indent: 1.5
---

l. DEFINITIONS
ll. Software
"Software" means the computer program licensed under this Agreement.

ll. License
"License" means the terms and conditions for use, reproduction and distribution.

l. LICENSE GRANT
ll. Rights Granted
lll. Personal Use
The licensee may use the Software for personal purposes.

lll. Commercial Use
llll. Restrictions
Commercial use requires separate license.

llll. Conditions
lllll. Notification
The licensor must be notified before commercial use.

lllll. Payment
Commercial fees will apply according to the current price table.

l. LIMITATIONS
ll. Use Restrictions
The Software may not be used for illegal activities.
```

### Generated Output

```markdown
Article 1. DEFINITIONS
   Section 1. Software
"Software" means the computer program licensed under this Agreement.

   Section 2. License
"License" means the terms and conditions for use, reproduction and distribution.

Article 2. LICENSE GRANT
   Section 1. Rights Granted
      (1) Personal Use
The licensee may use the Software for personal purposes.

      (2) Commercial Use
         (2a) Restrictions
Commercial use requires separate license.

         (2b) Conditions
            (2bi) Notification
The licensor must be notified before commercial use.

            (2bii) Payment
Commercial fees will apply according to the current price table.

Article 3. LIMITATIONS
   Section 1. Use Restrictions
The Software may not be used for illegal activities.
```

### Example 2: Academic Format with Decimal Numbering

```markdown
---
title: "AI Research"
level-one: "%n."
level-two: "%n.%s"
level-three: "%n.%s.%t"
level-four: "%n.%s.%t.%f"
level-five: "%n.%s.%t.%f.%i"
level-indent: 2.0
---

l. Introduction
ll. Background
lll. History of AI
llll. Early Developments
lllll. Turing Machine

l. Methodology
ll. Study Design
ll. Data Collection
```

### Generated Output

```markdown
1. Introduction
    1.1 Background
        1.1.1 History of AI
            1.1.1.1 Early Developments
                1.1.1.1.1 Turing Machine

2. Methodology
    2.1 Study Design
    2.2 Data Collection
```

## Special Cases

### Skipped Level Numbering

When a level is skipped in the hierarchy, the system automatically initializes intermediate levels:

```markdown
l. Level 1
lll. Level 3 (skipped level 2)
```

Output:
```markdown
Article 1. Level 1
      (1) Level 3 (skipped level 2)
```

### Numbering Reset

Numbering automatically resets when returning to a higher level:

```markdown
l. First Article
ll. First Section
ll. Second Section
l. Second Article
ll. First Section (resets to 1)
```

### Consecutive Level 5 Numbering

Level 5 elements have special handling for consecutive items:

- **Consecutive level 5 items**: Automatically increment the level 5 number
- **Roman numerals**: Always use lowercase (`i`, `ii`, `iii`)
- **Custom formats**: Work correctly with simple patterns like `(%n)`

```markdown
llll. Subpoint A
lllll. Detail One    # Output: (1) Detail One
lllll. Detail Two    # Output: (2) Detail Two
llll. Subpoint B
lllll. Another Item  # Output: (1) Another Item (resets)
```

**Example with outline numbering:**
```yaml
level-five: "(%n)"
```

**Output:**
```
      a) Subpoint A
         (1) Detail One
         (2) Detail Two
      b) Subpoint B
         (1) Another Item
```

### Leading Zero Formatting

Use leading zeros for formal document numbering:

```yaml
level-one: "%02n."
level-two: "%02n.%02s"
level-three: "(%02n)"
```

**Example Output:**
```
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

**Solution**: Verify there are no extra spaces or special characters in the `l.` notation.

#### 2. Inconsistent Indentation

**Problem**: Indentation doesn't match expectations.

**Solution**: Adjust the `level-indent` value in the front matter:

```yaml
level-indent: 1.5  # Default value
level-indent: 2.0  # More indentation
level-indent: 1.0  # Less indentation
```

#### 3. Incorrect Template Format

**Problem**: Variables `%n`, `%c`, `%r` are not replaced.

**Solution**: Verify template syntax:

```yaml
# Correct
level-four: "(%n%c)"

# Incorrect (missing %)
level-four: "(nc)"
```

#### 4. Unexpected Numbering Reset

**Problem**: Numbers reset when they shouldn't.

**Solution**: Verify hierarchical structure. Numbering resets when returning to a higher level.

#### 5. Hierarchical Format Variables Not Working

**Problem**: Academic format `%n.%s.%t` shows wrong numbers.

**Solution**: Ensure you're using the correct pattern:

```yaml
# Correct academic format
level-two: "%n.%s"    # Level 1 number . Level 2 number
level-three: "%n.%s.%t"  # Level 1 . Level 2 . Level 3

# Common mistake
level-two: "%s.%n"    # Wrong order
```

#### 6. Roman/Alphabetic Hierarchical Issues

**Problem**: Format `%r.%n` shows wrong level 1 reference.

**Solution**: In hierarchical formats like `%r.%n` or `%c.%n`:
- Variable before the dot (`.`) refers to level 1
- Variable after the dot refers to current level

```yaml
# For level 2 under level 1 "iii"
level-two: "%r.%n"  # Produces: "iii.1" (correct)
```

#### 7. Consecutive Level 5 Not Incrementing

**Problem**: Multiple level 5 items show same number.

**Solution**: This is now fixed automatically. Consecutive level 5 items increment properly:

```markdown
lllll. Detail One    # (1)
lllll. Detail Two    # (2) - automatically increments
```

### Format Validation

To verify the format is correct, use debug mode:

```bash
legal-md --debug input.md output.md
```

### Debugging Examples

#### Input with Error
```markdown
l . Article with extra space
ll.Section without space
```

#### Correct Input
```markdown
l. Correct article
ll. Correct section
```

## Quick Reference

### Minimal Syntax
```markdown
l. Level 1                    # Article 1.
ll. Level 2                   #   Section 1.
lll. Level 3                  #     (1)
llll. Level 4                 #       (1a)
lllll. Level 5                #         (1ai)
```

### Popular Format Configurations

#### Standard Legal Format
```yaml
level-one: "Article %n."
level-two: "Section %n."
level-three: "(%n)"
level-four: "(%n%c)"
level-five: "(%n%c%r)"
```

#### Academic Format
```yaml
level-one: "%n."
level-two: "%n.%s"
level-three: "%n.%s.%t"
level-four: "%n.%s.%t.%f"
level-five: "%n.%s.%t.%f.%i"
```

#### Roman Hierarchical
```yaml
level-one: "%r."
level-two: "%r.%n"
level-three: "(%n)"
level-four: "(%n%c)"
level-five: "(%n%c%r)"
```

### Essential Variables

| Variable | Standard Use | Hierarchical Use | Example |
|----------|-------------|------------------|---------|
| `%n` | Current level number | Level 1 number (in dotted formats) | `1`, `2` |
| `%c` | Current level letter | Level 1 letter (before dots) | `a`, `b` |
| `%r` | Current level roman | Level 1 roman (before dots) | `i`, `ii` |
| `%s` | - | Level 2 number | In `%n.%s` |
| `%t` | - | Level 3 number | In `%n.%s.%t` |
| `%f` | - | Level 4 number | In `%n.%s.%t.%f` |
| `%i` | - | Level 5 number | In `%n.%s.%t.%f.%i` |

### Format Pattern Recognition

- **Dotted with references** (`%n.%s`, `%n.%s.%t`): Academic/hierarchical numbering
- **Variable + dot + n** (`%r.%n`, `%c.%n`): Mixed hierarchical (level 1 reference + current number)
- **Combined variables** (`%n%c`, `%n%c%r`): Standard legal format

---

**💡 Tip**: Start with default formats and customize gradually according to your specific needs.

**📚 Additional Resources**: 
- [README.md](../README.md) - General documentation
- [Tests](../tests/unit/processors/header-processor.unit.test.ts) - Use case examples