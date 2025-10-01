feat: add signature lines detection and styling

Implement automatic detection and CSS wrapping of signature lines in legal
documents.

## Features

- ✨ Automatic detection of signature lines (10+ consecutive underscores)
- 🎨 Wraps detected lines with `<span class="signature-line">` for CSS styling
- ⚙️ Configurable threshold, CSS class name, and behavior options
- 🔒 CSS class name sanitization to prevent XSS vulnerabilities
- 🔧 Integrated into remark processing pipeline
- 📝 Preserves code blocks and inline code

## Plugin Implementation

**New Plugin:** `src/plugins/remark/signature-lines.ts`

### Configuration Options

```typescript
interface SignatureLinesOptions {
  minUnderscores?: number; // default: 10
  addCssClass?: boolean; // default: true
  cssClassName?: string; // default: "signature-line"
  debug?: boolean; // default: false
}
```

### Security

- **CSS class name sanitization** to prevent XSS attacks
- Validates class names match pattern: `[a-zA-Z_][\w-]*`
- Falls back to default "signature-line" for invalid input
- Rejects special characters, spaces, and names starting with numbers

### Integration

- Added to `legal-markdown-processor.ts` pipeline after dates plugin
- Processes text nodes while preserving document structure
- Does not process code blocks or inline code

## Testing

✅ **26 comprehensive unit tests - all passing**

### Coverage

- Basic detection (10, 20, 100+ underscores)
- Custom configuration options
- Real-world scenarios (signature blocks, lists, tables)
- Edge cases (empty input, code blocks, very long sequences)
- Integration with formatting (bold, italic, links)
- **Security tests** (XSS attempts, invalid class names)

### Security Test Cases

- XSS attempt with `<script>` tags
- Class names starting with numbers
- Class names with spaces
- Empty class names
- Valid patterns (hyphens, underscores, alphanumeric)

## Documentation

📚 **Complete feature documentation**

- **Feature guide:** `docs/features/signature-lines.md`
  - Usage examples for common scenarios
  - CSS styling guide with print optimization
  - Best practices and troubleshooting
  - Security considerations
- **Updated:** `docs/features/README.md` with signature lines entry

## Examples

### Playground Updates

- Added dedicated section in features-demo example
- Shows basic signature blocks and multiple signatures
- Existing signature blocks in contracts now automatically styled

### Usage Example

**Input:**

```markdown
**Client Representative**

Signature: ************\_\_************

Date: ********\_\_\_\_********
```

**Output:**

```html
<strong>Client Representative</strong>

Signature: <span class="signature-line">__________________________</span>

Date: <span class="signature-line">____________________</span>
```

## CSS Styling

Users can customize appearance with CSS:

```css
.signature-line {
  display: inline-block;
  border-bottom: 1px solid #000;
  min-width: 200px;
}

/* Print optimization */
@media print {
  .signature-line {
    border-bottom: 1px solid #000;
    min-width: 3in;
  }
}
```

## Use Cases

- Legal document signature blocks
- Contract execution pages
- Witness and notary sections
- Any document requiring signature lines
- Forms with signature fields

## Breaking Changes

None - this is a new feature that enhances existing functionality without
breaking compatibility.

## Security Considerations

- All CSS class names are validated against XSS attacks
- Invalid class names trigger console warnings and fall back to safe defaults
- Plugin is safe to use with user-provided configuration
