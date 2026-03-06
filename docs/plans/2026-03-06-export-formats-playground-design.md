# Design: Export Format Buttons in Playground (DOCX + PDF)

## Context

The playground UI has three resizable columns:

1. Legal MD editor (`EditorPanel`)
2. CSS editor (`CSSEditorPanel`)
3. Preview/output panel - toolbar + `PreviewPanel` tabs

The third column toolbar currently has: Process, Download (HTML/MD), Copy,
Print, Options, Metadata.

The request is to add dedicated `.pdf` and `.docx` download buttons with a
download icon.

## Decision

### DOCX

Use the project's own `DocxGenerator` pipeline - the same one used by the CLI
(`--docx` flag). Quality was validated against the `office-lease-complete`
example and confirmed good.

The generator currently requires `fs` to read CSS from disk and write the output
file. For the browser, we add a `generateDocxBuffer(html, css, options)` method
that:

- Accepts CSS as a string (no file read)
- Returns a `Buffer` / `Uint8Array` instead of writing to disk
- Uses the same internal `convertHtmlToDocxBlocks` + `docx` (Packer) logic

This method gets exposed via the browser bundle
(`window.LegalMarkdown.generateDocxBuffer`).

In the playground, `useLegalMarkdown` gets a `downloadDocx()` helper that:

1. Calls
   `window.LegalMarkdown.generateDocxBuffer(bodyHtml, customCSS, { title })`
2. Creates a `Blob` with DOCX MIME type
3. Triggers download via `URL.createObjectURL`

### PDF

Reuse the existing `printDocument` logic surfaced as a dedicated button. The
browser print dialog allows saving as PDF. No server or Puppeteer required. A
`@media print` stylesheet is already applied via the CSS editor.

## UI

Two buttons added to the third column toolbar, after the existing Print button:

```
[ Play Process ] | [ Download ] Copy HTML [ Print ] [ .docx ] [ .pdf ] | Options | Metadata
```

- Both use `lucide-react`'s `Download` icon + label text (`.docx` / `.pdf`)
- Style: `ghost`, `sm`, same as existing Copy button
- Disabled when `result` is null
- Tooltip on hover
- Loading state on `.docx` button while buffer is generating (async)

## Files to Change

| File                                          | Change                                                   |
| --------------------------------------------- | -------------------------------------------------------- |
| `src/extensions/generators/docx-generator.ts` | Add `generateDocxBuffer()` method                        |
| `src/web/src/types/legal-markdown.d.ts`       | Add `generateDocxBuffer` to `LegalMarkdownLib` interface |
| `src/web/public/legal-markdown-loader.js`     | Expose `generateDocxBuffer` from the bundle              |
| `src/web/src/hooks/useLegalMarkdown.ts`       | Add `downloadDocx()` to the hook return                  |
| `src/web/src/App.tsx`                         | Add the two buttons to the toolbar                       |

## Out of Scope

- Server-side generation
- PDF via Puppeteer in the browser
- DOCX highlight variant (only normal version for now)
