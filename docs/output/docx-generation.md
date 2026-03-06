# DOCX Generation

Legal Markdown JS can generate native Word documents (`.docx`) using the same
3-phase processing pipeline as Markdown/HTML/PDF.

## What This Export Provides

- Native OOXML output compatible with Microsoft Word and LibreOffice.
- Optional reviewer variant: `.HIGHLIGHT.docx`.
- CSS-to-DOCX style adaptation from `default.css` and `highlight.css`.
- Header/footer generation (logo/version/page numbers by default).
- Programmatic custom header/footer HTML templates (including images).

## Output Files and Naming

- `--docx` generates `<base>.docx`.
- `--docx --highlight` generates both `<base>.docx` and `<base>.HIGHLIGHT.docx`.

In interactive CLI (`legal-md-ui`), naming follows the same logic as PDF/HTML.

## CLI Usage

```bash
# Basic DOCX
legal-md input.md --docx

# DOCX + highlighted reviewer copy
legal-md input.md --docx --highlight

# DOCX with custom stylesheet and title
legal-md input.md --docx --css ./styles/legal.css --title "Service Agreement"

# stdin -> DOCX file (binary output must go to file)
cat input.md | legal-md --stdin --docx ./output/service-agreement.docx
```

Important CLI constraints:

- `--docx --stdout` is rejected.
- `--stdin --docx --stdout` is rejected.

DOCX is binary output and must be written to a file path.

## Force Commands

DOCX can be activated from frontmatter:

```yaml
---
title: Master Services Agreement
force_commands: --docx --highlight --css styles/legal.css --title "{{title}}"
---
```

## Programmatic API

```typescript
import { generateDocx, generateDocxVersions } from 'legal-markdown-js';

await generateDocx(content, './output/contract.docx', {
  title: 'Contract',
  cssPath: './styles/legal.css',
  includeHighlighting: false,
  format: 'A4',
  landscape: false,
});

await generateDocxVersions(content, './output/contract.docx', {
  title: 'Contract',
  cssPath: './styles/legal.css',
});
// Generates contract.docx + contract.HIGHLIGHT.docx
```

### `generateDocx` Options

| Option                | Type                          | Description                                |
| --------------------- | ----------------------------- | ------------------------------------------ |
| `title`               | `string`                      | Document title metadata                    |
| `cssPath`             | `string`                      | Base CSS used for DOCX style adaptation    |
| `highlightCssPath`    | `string`                      | CSS used for highlight styles when enabled |
| `includeHighlighting` | `boolean`                     | Enables highlight-style mapping            |
| `format`              | `'A4' \| 'Letter' \| 'Legal'` | Page size                                  |
| `landscape`           | `boolean`                     | Landscape orientation                      |
| `margin`              | `{ top,right,bottom,left }`   | Page margins                               |
| `basePath`            | `string`                      | Base path for resolving relative images    |
| `headerTemplate`      | `string`                      | Custom header HTML template                |
| `footerTemplate`      | `string`                      | Custom footer HTML template                |

### Custom DOCX Header/Footer Templates (API)

Custom header/footer templates are currently available through the API
(`generateDocx`) and internal pipeline options, not CLI flags.

```typescript
await generateDocx(content, './output/contract.docx', {
  title: 'Contract',
  basePath: './output',
  headerTemplate:
    '<p class="text-center">ACME <img src="./logo.png" width="18" height="18" /></p>',
  footerTemplate: '<p class="text-center text-muted">Confidential</p>',
});
```

Notes:

- Template HTML is converted with the same DOCX HTML converter as body content.
- Relative image paths in templates are resolved with `basePath`.
- If `headerTemplate`/`footerTemplate` is provided, it replaces default
  auto-header/auto-footer behavior.

## Styling Model (How CSS Is Used)

DOCX does not execute CSS at render time. Instead, Legal Markdown adapts CSS
tokens into DOCX styles and numbering definitions.

- CSS selectors are parsed and mapped to paragraph/run/table styles.
- CSS variables (for example `var(--color-primary)`) are resolved.
- `@media`, `:hover`, and other browser-only constructs are ignored.
- `!important` is tolerated in mapped color values.
- Field highlight runs use native Word formatting: `font color + highlight` (no
  run borders/shading).

Important architecture detail:

- No static `.styles` file is generated.
- Styles are adapted from CSS at export time and emitted into DOCX XML
  (`word/styles.xml`, `word/numbering.xml`).

## Supported Mapping (Current)

### Typography and Blocks

- Body text, headings (`h1`..`h6`), blockquotes, code blocks, inline code.
- Tables with border/fill/text styling from CSS tokens.
- Field-review classes in highlight mode:
- `.imported-value`, `.missing-value`, `.highlight`.

### Utility and Structural Classes

The following classes are recognized by DOCX generation:

| Class                 | DOCX behavior                                   |
| --------------------- | ----------------------------------------------- |
| `.text-center`        | Paragraph centered (`w:jc center`)              |
| `.text-muted`         | Run color set to muted token                    |
| `.confidential`       | Paragraph style `confidentialBanner`            |
| `.separator`          | Paragraph style `separatorBanner`               |
| `.algorithm`          | Paragraph style `algorithmBlock`                |
| `.table-of-contents`  | TOC container style and list marker suppression |
| `.signatures` (table) | Signature-table layout/borders adapted for DOCX |
| `.page-break`         | Page break before                               |
| `.page-break-before`  | Page break before                               |
| `.page-break-after`   | Page break after                                |

### Lists (`list-style-type`)

DOCX export maps `list-style-type` (global CSS and inline styles) to DOCX
numbering/bullets.

Ordered list mappings:

- `decimal`
- `lower-alpha` / `lower-latin`
- `upper-alpha` / `upper-latin`
- `lower-roman`
- `upper-roman`

Unordered list mappings:

- `disc`
- `circle`
- `square`
- `dash`

Special case:

- `list-style-type: none` suppresses list markers (used for TOC-like layouts).

Highlight palette note:

- Word highlight uses a fixed palette. CSS highlight backgrounds are mapped to
  the nearest available Word highlight color.

## Page Layout Options

DOCX options supported:

- `format`: `A4` | `Letter` | `Legal`
- `landscape`: `true|false`
- `margin`: `{ top, right, bottom, left }` with unit parsing (`cm`, `mm`, `in`,
  `pt`, `px`, twips fallback)

## Default Header/Footer and Logo Behavior

When custom templates are not provided:

- Header uses logo if `--logo-filename` is declared in CSS.
- Footer includes `v<version>` when metadata has `version`.
- Footer includes `Pg: current / total`.

Logo behavior:

- PNG required.
- Loaded from configured images directory (or URL when valid).
- If loading/validation fails, generation continues with empty header.

## HTML/CSS Features Not Fully Portable to DOCX

- Interactive/browser states: `:hover`, scripting behavior.
- Responsive layout semantics from media queries.
- Pixel-perfect browser layout parity.

DOCX export aims for semantic and visual equivalence, not exact browser
rendering.

## Troubleshooting

- Unexpected style result:
- Validate selector is directly mappable (class/tag, not interactive state).
- Prefer explicit CSS tokens over heavy cascading.
- Lists not matching expected marker:
- Check `list-style-type` on `ul`/`ol` or inline style.
- Ensure it is one of the supported values above.
- Header/footer images not rendering:
- Verify `basePath` for relative paths in templates.
- Verify the image file exists and is readable.

## Related Docs

- [Output Overview](README.md)
- [CLI Reference](../cli_reference.md)
- [Field Highlighting](field-highlighting.md)
- [CSS Classes](css-classes.md)
- [Force Commands](../features/force-commands.md)
