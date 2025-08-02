# Custom Header Formats

Advanced header formatting and numbering systems for legal documents, academic
papers, and international legal standards with multi-language support and
jurisdiction-specific templates.

## Table of Contents

- [Overview](#overview)
- [Custom Format Configuration](#custom-format-configuration)
- [Template Variables](#template-variables)
- [Format Examples](#format-examples)
- [Multi-Language Support](#multi-language-support)
- [Jurisdiction Templates](#jurisdiction-templates)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

## Overview

Legal Markdown JS provides a flexible header formatting system that can be
customized for different legal systems, academic standards, and international
requirements. The system supports:

- **Variable-based formatting** - Use template variables for dynamic numbering
- **Hierarchical references** - Cross-level number references (e.g., 1.2.3)
- **Multiple numbering systems** - Arabic, Roman, alphabetic, and ordinal
- **Custom indentation** - Configurable spacing and alignment
- **Jurisdiction-specific formats** - Templates for different legal systems

## Custom Format Configuration

### Basic Configuration

Configure custom header formats in YAML frontmatter:

```yaml
---
title: 'Custom Legal Document'
# Custom formats for each level
level-one: 'Chapter %n:'
level-two: 'Section %l1.%l2'
level-three: 'Subsection (%n)'
level-four: 'Part %n%a'
level-five: 'Item %n%a%r'
level-six: 'Annex %R -'
# Custom indentation (em units)
level-indent: 2.0
---
```

### Format Validation

Test your custom formats:

```bash
# Use debug mode to verify formatting
legal-md --debug document.md output.md

# Check specific level processing
legal-md --debug --log-level verbose document.md
```

## Template Variables

### Current Level Variables

Variables that refer to the current header level:

| Variable | Description                          | Example | Output        |
| -------- | ------------------------------------ | ------- | ------------- |
| `%n`     | Current level number                 | `%n.`   | 1., 2., 3.    |
| `%a`     | Current level alphabetic (lowercase) | `%a)`   | a), b), c)    |
| `%A`     | Current level alphabetic (uppercase) | `%A.`   | A., B., C.    |
| `%r`     | Current level Roman (lowercase)      | `%r.`   | i., ii., iii. |
| `%R`     | Current level Roman (uppercase)      | `%R.`   | I., II., III. |
| `%o`     | Current level ordinal                | `%o`    | 1st, 2nd, 3rd |

### Hierarchical Reference Variables

Variables that reference specific levels for hierarchical numbering:

| Variable  | Description    | Example Format    | Output        |
| --------- | -------------- | ----------------- | ------------- |
| `%l1`     | Level 1 number | `%l1.`            | 1., 2., 3.    |
| `%l2`     | Level 2 number | `%l1.%l2`         | 1.1, 1.2, 2.1 |
| `%l3`     | Level 3 number | `%l1.%l2.%l3`     | 1.1.1, 1.1.2  |
| `%l4-%l9` | Levels 4-9     | `%l1.%l2.%l3.%l4` | 1.1.1.1       |

### Extended Variables

Advanced formatting options:

| Variable | Description         | Example | Output             |
| -------- | ------------------- | ------- | ------------------ |
| `%02n`   | Zero-padded numbers | `%02n.` | 01., 02., 03.      |
| `%03n`   | Three-digit padding | `%03n`  | 001, 002, 003      |
| `%l1+`   | Level 1 and higher  | Custom  | Extended hierarchy |

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
level-indent: 1.5
---
```

**Output:**

```text
1. Introduction
1.1 Background
1.1.1 Literature Review
1.1.1.1 Historical Context
1.1.1.1.1 Early Studies
```

### Legal Contract Format

```yaml
---
title: 'Service Agreement'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
level-four: '(%n%a)'
level-five: '(%n%a%r)'
level-indent: 1.5
---
```

**Output:**

```text
Article 1. Definitions
Section 1. General Terms
(1) Basic Definitions
(1a) Software
(1ai) Licensed Software
```

### Roman Numeral Hierarchical Format

```yaml
---
title: 'Classical Legal Document'
level-one: '%R.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
level-indent: 2.0
---
```

**Output:**

```text
I. Title
I.1 Section
(1) Subsection
(1a) Part
(1ai) Item
```

### Alphabetic Hierarchical Format

```yaml
---
title: 'Structured Document'
level-one: '%A.'
level-two: '%l1.%l2'
level-three: '(%l3)'
level-four: '(%l3%a)'
level-five: '(%l3%a%r)'
level-indent: 1.8
---
```

**Output:**

```text
A. Chapter
A.1 Section
(1) Subsection
(1a) Part
(1ai) Detail
```

### Mixed Custom Format

```yaml
---
title: 'Complex Document'
level-one: 'Part %r'
level-two: 'Chapter %l2'
level-three: 'Section %a'
level-four: 'Item %n'
level-five: 'Point %r'
level-indent: 2.5
---
```

**Output:**

```text
Part i
Chapter 1
Section a
Item 1
Point i
```

### Leading Zero Format

```yaml
---
title: 'Formal Document'
level-one: '%02n.'
level-two: '%02l1.%02l2'
level-three: '%02l1.%02l2.%02l3'
level-indent: 1.0
---
```

**Output:**

```text
01. Introduction
01.01 Background
01.01.01 Context
```

## Multi-Language Support

### Spanish Legal Format

```yaml
---
title: 'Contrato de Servicios'
language: 'es'
level-one: 'Artículo %n.'
level-two: 'Sección %n.'
level-three: '(%n)'
level-four: 'Apartado %n%a'
level-five: 'Punto %n%a%r'
level-indent: 1.5
---
```

### French Legal Format

```yaml
---
title: 'Contrat de Service'
language: 'fr'
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'
level-four: 'Paragraphe %n%a'
level-five: 'Point %n%a%r'
level-indent: 1.5
---
```

### German Legal Format

```yaml
---
title: 'Dienstleistungsvertrag'
language: 'de'
level-one: 'Artikel %n.'
level-two: 'Abschnitt %n.'
level-three: '(%n)'
level-four: 'Absatz %n%a'
level-five: 'Punkt %n%a%r'
level-indent: 1.5
---
```

### Multi-Language Document

```yaml
---
title: 'International Agreement'
# English structure with multi-language support
level-one: 'Article %n. / Artículo %n. / Article %n.'
level-two: 'Section %n. / Sección %n. / Section %n.'
level-three: '(%n)'
level-indent: 1.5
---
```

## Jurisdiction Templates

### United States Legal Format

```yaml
---
title: 'US Legal Document'
jurisdiction: 'US'
level-one: 'Article %R'
level-two: 'Section %l1.%l2'
level-three: 'Subsection (%a)'
level-four: 'Paragraph (%n)'
level-five: 'Subparagraph (%r)'
level-indent: 2.0
---
```

### European Union Legal Format

```yaml
---
title: 'EU Regulation'
jurisdiction: 'EU'
level-one: 'Article %n'
level-two: 'Paragraph %n'
level-three: 'Point (%a)'
level-four: 'Subpoint (%r)'
level-five: 'Item (%n)'
level-indent: 1.5
---
```

### United Kingdom Legal Format

```yaml
---
title: 'UK Statute'
jurisdiction: 'UK'
level-one: '%n.'
level-two: '(%n)'
level-three: '(%a)'
level-four: '(%r)'
level-five: '(%n)'
level-indent: 1.8
---
```

### Common Law Format

```yaml
---
title: 'Common Law Document'
jurisdiction: 'CommonLaw'
level-one: 'Article %R'
level-two: 'Section %n'
level-three: 'Subsection (%a)'
level-four: 'Clause (%r)'
level-five: 'Subclause (%n)'
level-indent: 2.0
---
```

### Civil Law Format

```yaml
---
title: 'Civil Code Document'
jurisdiction: 'CivilLaw'
level-one: 'Título %R'
level-two: 'Capítulo %R'
level-three: 'Artículo %n'
level-four: 'Párrafo %n'
level-five: 'Inciso %a'
level-indent: 1.5
---
```

## Advanced Patterns

### Conditional Formatting

```yaml
---
title: 'Adaptive Document'
document_type: 'contract'
# Conditional formats based on document type
level-one: '{{document_type == "contract" ? "Article %n." : "Chapter %n."}}'
level-two: 'Section %n.'
level-three: '(%n)'
---
```

### Dynamic Format Selection

```typescript
// Programmatically set formats based on jurisdiction
function getJurisdictionFormat(jurisdiction: string) {
  const formats = {
    US: {
      'level-one': 'Article %R',
      'level-two': 'Section %l1.%l2',
      'level-three': 'Subsection (%a)',
    },
    EU: {
      'level-one': 'Article %n',
      'level-two': 'Paragraph %n',
      'level-three': 'Point (%a)',
    },
    UK: {
      'level-one': '%n.',
      'level-two': '(%n)',
      'level-three': '(%a)',
    },
  };

  return formats[jurisdiction] || formats['US'];
}
```

### Context-Aware Formatting

```yaml
---
title: 'Smart Contract'
contract_type: 'employment'
region: 'EU'
# Context-aware format selection
level-one: '{{region == "EU" ? "Article %n" : "Section %R"}}'
level-two: '{{contract_type == "employment" ? "Clause %n" : "Section %n"}}'
level-three: '(%n)'
---
```

### Template Inheritance

```yaml
---
title: 'Child Document'
# Inherit from base template
extends: './templates/base-legal.yaml'
# Override specific levels
level-one: 'Special Article %n.'
# Other levels inherited from base
---
```

## Best Practices

### 1. Choose Appropriate Numbering Systems

```yaml
# ✅ Good - Match system to document type
# Academic papers
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'

# Legal contracts
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'

# ❌ Avoid - Inconsistent or confusing systems
level-one: '%R.'
level-two: '%l1.%a'  # Mixing systems confusingly
```

### 2. Consider Cultural and Legal Conventions

```yaml
# ✅ Good - Respect local conventions
# US Legal
level-one: 'Article %R'
level-two: 'Section %l1.%l2'

# European Legal
level-one: 'Article %n'
level-two: 'Paragraph %n'

# Academic (International)
level-one: '%l1.'
level-two: '%l1.%l2'
```

### 3. Maintain Consistency

```yaml
# ✅ Good - Consistent formatting philosophy
level-one: 'Chapter %n:'
level-two: 'Section %l1.%l2'
level-three: 'Subsection %l1.%l2.%l3'
level-four: 'Part %l1.%l2.%l3.%l4'

# ❌ Avoid - Mixed styles without clear pattern
level-one: 'Chapter %n:'
level-two: 'Section %a'
level-three: '(%R)'
level-four: 'Item %r'
```

### 4. Test Across Different Depths

```yaml
# Test with various nesting levels
---
level-one: 'Article %n.'
level-two: 'Section %l1.%l2'
level-three: 'Subsection %l1.%l2.%l3'
level-four: 'Part %l1.%l2.%l3.%l4'
level-five: 'Item %l1.%l2.%l3.%l4.%l5'
---
# Test content
l. Article One ll. First Section lll. First Subsection llll. First Part lllll.
First Item lllll. Second Item llll. Second Part lll. Second Subsection ll.
Second Section l. Article Two
```

### 5. Document Format Choices

```yaml
---
# Document format rationale
format_notes: |
  Using hierarchical academic format (1.1.1) for technical specification.
  Chosen for compatibility with IEEE standards and international recognition.
  Alternative considered: Legal format (Article/Section) but rejected due to
  technical nature of content.

level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
---
```

### 6. Validate Format Correctness

```typescript
// Validation function for custom formats
function validateHeaderFormat(format: string): boolean {
  const validVariables = /%[nrRaAol1-9]|%\d+[nl]/g;
  const invalidPatterns = /{{|}}|\[|\]/;

  // Check for valid variables only
  const hasValidVars = validVariables.test(format);
  const hasInvalidChars = invalidPatterns.test(format);

  return hasValidVars && !hasInvalidChars;
}

// Test formats
const formats = [
  'Article %n.', // ✅ Valid
  'Section %l1.%l2', // ✅ Valid
  'Part {{level}}', // ❌ Invalid - uses {{ }}
  'Chapter %x', // ❌ Invalid - unknown variable
];
```

### 7. Performance Considerations

```yaml
# ✅ Good - Simple, efficient patterns
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: '(%n)'

# ⚠️ Caution - Complex patterns may impact performance
level-one: 'Article %R ({{titleCase(document_type)}})'
level-two: 'Section %l1.%l2 - {{formatDate(@today, "YYYY")}}'
```

## Troubleshooting

### Common Issues

**Variables not replaced:**

- Check variable syntax: `%n` not `%N`
- Verify variable exists: `%l3` only works at level 3+
- Escape special characters in format strings

**Incorrect hierarchical numbering:**

- Use `%l1.%l2.%l3` for academic format
- Use `%n` for current level only
- Check level depth matches variable references

**Format validation errors:**

```bash
# Debug format processing
legal-md --debug --log-level verbose document.md

# Check specific format
legal-md --validate-headers document.md
```

**Performance issues with complex formats:**

- Simplify format patterns
- Avoid dynamic variables in headers
- Use static formats for better performance

### Debug Mode

```bash
# Enable comprehensive header debugging
legal-md --debug --log-headers document.md output.md

# Validate format syntax
legal-md --validate-format --check-headers document.md
```

## Template Library

### Ready-to-Use Templates

Save these as reusable template files:

**templates/us-legal.yaml:**

```yaml
level-one: 'Article %R'
level-two: 'Section %l1.%l2'
level-three: 'Subsection (%a)'
level-four: 'Paragraph (%n)'
level-indent: 2.0
```

**templates/academic.yaml:**

```yaml
level-one: '%l1.'
level-two: '%l1.%l2'
level-three: '%l1.%l2.%l3'
level-four: '%l1.%l2.%l3.%l4'
level-indent: 1.5
```

**templates/eu-legal.yaml:**

```yaml
level-one: 'Article %n'
level-two: 'Paragraph %n'
level-three: 'Point (%a)'
level-four: 'Subpoint (%r)'
level-indent: 1.5
```

### Using Templates

```yaml
---
title: 'My Document'
# Import header format from template
extends: './templates/us-legal.yaml'
# Override specific settings
level-indent: 2.5
---
```

## See Also

- [Headers & Numbering](../features/headers-numbering.md) - Basic header
  functionality
- [YAML Frontmatter](../features/yaml-frontmatter.md) - Configuration syntax
- [Best Practices](best-practices.md) - Document organization guidelines
- [Configuration](configuration.md) - Global and project settings
