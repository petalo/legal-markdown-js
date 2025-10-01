# Signature Lines

Signature lines are automatically detected and wrapped with CSS classes for
styling. This feature identifies long sequences of underscores (typically used
to indicate where signatures should be placed) and adds HTML markup for
consistent styling.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [CSS Styling](#css-styling)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Legal Markdown automatically detects sequences of 10 or more consecutive
underscores and wraps them with a `<span class="signature-line">` element. This
allows you to style signature lines consistently across your documents using
CSS.

**Input:**

```markdown
Signature: ************\_\_************
```

**Output:**

```markdown
Signature: <span class="signature-line">************\_\_************</span>
```

## Basic Usage

### Simple Signature Line

```markdown
**Client Representative**

Signature: ************\_\_************

Date: ********\_\_\_\_********
```

The longer underscore sequence (26 underscores) and shorter one (20 underscores)
are both detected and wrapped with CSS classes.

### Multiple Signature Lines

```markdown
**Party A**

Signature: ************\_\_************ Date: ****\_\_****

**Party B**

Signature: ************\_\_************ Date: ****\_\_****
```

All signature lines in the document are automatically detected and styled.

### Signature Blocks

```markdown
## SIGNATURES

---

**Client Representative**

Name: ************\_\_************

Signature: ************\_\_************

Date: ********\_\_\_\_********

**Service Provider**

Name: ************\_\_************

Signature: ************\_\_************

Date: ********\_\_\_\_********
```

## Configuration

The signature line detection behavior can be customized through the remark
plugin options:

### Minimum Underscores

By default, sequences of 10 or more underscores are treated as signature lines.
You can adjust this threshold:

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkSignatureLines from '@legal-markdown/signature-lines';

const processor = unified()
  .use(remarkParse)
  .use(remarkSignatureLines, { minUnderscores: 15 })
  .use(remarkStringify);
```

### Custom CSS Class

Change the CSS class applied to signature lines:

```typescript
.use(remarkSignatureLines, {
  cssClassName: 'document-signature-line'
})
```

### Disable CSS Wrapping

Process signature lines without adding CSS classes:

```typescript
.use(remarkSignatureLines, {
  addCssClass: false
})
```

## CSS Styling

### Default Styles

Add these styles to your CSS to customize signature line appearance:

```css
.signature-line {
  display: inline-block;
  border-bottom: 1px solid #000;
  min-width: 200px;
}
```

### Print-Optimized Styles

Ensure signature lines appear correctly in printed documents:

```css
@media print {
  .signature-line {
    border-bottom: 1px solid #000;
    min-width: 3in; /* Minimum 3 inches for signatures */
  }
}
```

### Styled Example

```css
.signature-line {
  display: inline-block;
  border-bottom: 2px solid #333;
  min-width: 250px;
  padding: 0 5px;
  margin: 0 10px;
  position: relative;
  bottom: -2px;
}

/* Remove underscores visually, keeping them for structure */
.signature-line {
  font-size: 0;
  line-height: 0;
}
```

### Accessibility Styles

Add aria labels for screen readers:

```html
<span class="signature-line" aria-label="Signature line"
  >__________________________</span
>
```

## Examples

### Contract Signature Block

```markdown
# SERVICE AGREEMENT

This agreement is entered into on {{contract_date}}.

## SIGNATURES

The parties have executed this agreement as of the date first written above.

**CLIENT**

Name: ************\_\_************

Signature: ************\_\_************

Date: ********\_\_\_\_********

**SERVICE PROVIDER**

Name: ************\_\_************

Signature: ************\_\_************

Date: ********\_\_\_\_********
```

### Witness Section

```markdown
## WITNESSES

The undersigned witnesses have witnessed the execution of this document.

**Witness 1**

Signature: ************\_\_************ Date: ****\_\_****

Print Name: ************\_\_************

**Witness 2**

Signature: ************\_\_************ Date: ****\_\_****

Print Name: ************\_\_************
```

### Notary Block

```markdown
## NOTARY ACKNOWLEDGMENT

**Notary Public**

Signature: ************\_\_************

Print Name: ************\_\_************

My Commission Expires: ********\_\_\_\_********

Notary Seal: ************\_\_************
```

### Table Format

```markdown
| Party   | Signature                    | Date         |
| ------- | ---------------------------- | ------------ |
| Party A | ************\_\_************ | ****\_\_**** |
| Party B | ************\_\_************ | ****\_\_**** |
| Witness | ************\_\_************ | ****\_\_**** |
```

## Best Practices

### 1. Use Consistent Lengths

Use consistent underscore lengths for signature lines throughout your document:

```markdown
<!-- ✅ Good - consistent lengths -->

Signature: ************\_\_************ Date: ********\_\_\_\_********

<!-- ❌ Avoid - inconsistent lengths -->

Signature: ******\_****** Date: **\_\_\_**
```

### 2. Minimum 10 Underscores

Use at least 10 underscores to ensure detection:

```markdown
<!-- ✅ Good - 10+ underscores -->

Signature: ****\_\_****

<!-- ❌ Won't be detected - only 9 underscores -->

Signature: ****\_****
```

### 3. Label Signature Lines

Always label what each signature line is for:

```markdown
<!-- ✅ Good - clear labels -->

**Client Representative** Signature: ************\_\_************ Date:
********\_\_\_\_********

<!-- ❌ Avoid - unlabeled -->

---

---
```

### 4. Group Related Signatures

Keep related signature lines together:

```markdown
**Party A**

Name: ************\_\_************ Signature: ************\_\_************ Date:
********\_\_\_\_********
```

### 5. Add Spacing

Add whitespace around signature blocks for readability:

```markdown
## SIGNATURES

---

**Client**

Signature: ************\_\_************

---

**Provider**

Signature: ************\_\_************
```

### 6. Print Considerations

Test your signature lines in print preview to ensure adequate space:

```markdown
<!-- Provide enough underscores for physical signatures -->

Signature: ************\_\_************ <!-- ~26 underscores = ~3 inches -->
```

### 7. Accessibility

Include descriptive text near signature lines:

```markdown
**Sign below to indicate agreement:**

Signature: ************\_\_************
```

## Advanced Usage

### Combining with Field Tracking

When field tracking is enabled, signature lines are preserved:

```markdown
---
enableFieldTracking: true
---

Client: {{client_name}} Signature: ************\_\_************
```

The signature line will be wrapped with CSS while the `{{client_name}}` field is
tracked separately.

### Dynamic Signature Blocks

Use template loops to generate multiple signature lines:

```yaml
---
parties:
  - name: 'Client A'
    role: 'Buyer'
  - name: 'Client B'
    role: 'Seller'
---
```

```markdown
{{#parties}} **{{name}}** ({{role}})

Signature: ************\_\_************

Date: ********\_\_\_\_********

{{/parties}}
```

### Conditional Signatures

Show signature lines only when needed:

```markdown
{{#if requires_witness}} **Witness**

Signature: ************\_\_************

Date: ********\_\_\_\_******** {{/if}}
```

## Integration with Other Features

### With Cross-References

```markdown
As stated in Section |introduction|, the parties agree to the terms below.

**Signatures** (see |signatures|)

|signatures| **Client**: ************\_\_************
```

### With Headers

```markdown
l. Agreement Terms

ll. Signatures

lll. Client Signature

---
```

## Troubleshooting

### Signature Lines Not Detected

**Problem**: Underscores are not being wrapped with CSS class.

**Solutions**:

1. Ensure you have at least 10 consecutive underscores
2. Check that signature lines are not inside code blocks
3. Verify the plugin is enabled in your pipeline

### Underscores Escaped in Output

**Problem**: Output shows `\_\_\_\_` instead of `____`.

**Solution**: This is normal behavior when CSS wrapping is disabled. Enable
`addCssClass: true` to preserve underscores in HTML.

### Styling Not Applied

**Problem**: Signature lines appear as plain underscores in output.

**Solution**: Add CSS rules for the `.signature-line` class to your stylesheet.

### Lines Too Short/Long

**Problem**: Signature lines are not the right length when printed.

**Solution**: Adjust the number of underscores or use CSS to set `min-width`:

```css
.signature-line {
  min-width: 3in; /* Adjust as needed */
}
```

## See Also

- [Field Tracking](../processing/field-tracking.md) - Track template fields
- [CSS Classes](../output/css-classes.md) - Available CSS classes
- [HTML Generation](../output/html-generation.md) - HTML output options
- [PDF Generation](../output/pdf-generation.md) - PDF output with signatures
