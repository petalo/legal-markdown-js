# Web Playground Architecture <!-- omit in toc -->

- [Overview](#overview)
- [Component Tree](#component-tree)
- [Processing Data Flow](#processing-data-flow)
- [Browser Bundle](#browser-bundle)
- [Shared Modules](#shared-modules)
- [Preview Tabs](#preview-tabs)
- [Key Files](#key-files)
- [Build and Development](#build-and-development)
- [Architectural Decisions](#architectural-decisions)

## Overview

The web playground is a single-page React application that provides an
interactive authoring environment for Legal Markdown documents. It consumes the
**same remark-based pipeline** as the CLI and Node API - there is no separate
browser-only processing path.

The playground runs entirely client-side. The processing library is bundled as a
self-contained ES module (`legal-markdown-browser.js`) loaded via a `<script>`
tag. No server or worker is required.

## Component Tree

```
App
 |-- ResizablePanelGroup  Three-panel horizontal layout
 |    |-- EditorPanel     [Header: logo + example selector | upload + clear]
 |    |                   Markdown textarea
 |    |-- CSSEditorPanel  [Header: CSS preset selector | upload + reset]
 |    |                   CSS textarea
 |    |    |-- PreviewPanel    [Header: Process + Download + Copy + Print]
 |    |    |-- Toolbar         Action bar (run, download, copy, print, options toggle)
 |    |    |-- OptionsPopover  Popover for highlight / field-tracking toggles
 |    |                        Four output tabs (Rendered, Markdown, HTML, HTML Document)
 |
 |-- StatusBar            Processing status, word count, field count, warnings
 |-- MetadataSheet        Slide-over panel showing extracted YAML metadata
 |-- Toaster              Toast notifications (sonner)
```

All state lives in the `useLegalMarkdown` custom hook. Components are
presentational - they receive data and callbacks via props.

## Processing Data Flow

```
User types markdown        User edits CSS
       |                        |
       v                        v
  [useLegalMarkdown hook]  [customCSS state]
       |                        |
       | debounce (1s)          |
       v                        |
  window.LegalMarkdown          |
    .processLegalMarkdownAsync() |
       |                        |
       v                        |
  result: {                     |
    content  (markdown)         |
    metadata (YAML object)      |
    fieldReport (tracking)      |
    warnings                    |
  }                             |
       |                        |
       v                        v
  [PreviewPanel] ---- uses both to render ---->
       |
       |-- Rendered tab:    iframe with HTML + CSS
       |-- Markdown tab:    raw pipeline markdown output
       |-- HTML tab:        formatted body fragment (js-beautify)
       |-- HTML Document:   full <!DOCTYPE html> with embedded CSS
```

**Key invariant**: the pipeline returns **markdown**. All markdown-to-HTML
conversion happens via `window.LegalMarkdown.markdownToHtmlBody()` which uses
the shared `html-format.ts` module - the same marked.js configuration and
js-beautify settings used by the Node HTML generator.

## Browser Bundle

The browser bundle is built from `src/browser-modern.ts` using Vite's library
mode. It is a single ES module that exposes:

| Export                                        | Description                            |
| --------------------------------------------- | -------------------------------------- |
| `processLegalMarkdownAsync(content, options)` | Full pipeline processing               |
| `processLegalMarkdown`                        | Alias for the above                    |
| `markdownToHtmlBody(markdown)`                | Convert markdown to HTML body fragment |
| `formatHtml(html)`                            | Prettify HTML with js-beautify         |
| `wrapHtmlDocument(body, css, title)`          | Wrap body in full HTML5 document       |
| `version`                                     | Library version string                 |
| `isModernBundle`                              | Always `true`                          |

The bundle is assigned to `window.LegalMarkdown` via a `<script>` tag in
`src/web/index.html`. The playground's Vite dev server loads it from
`src/web/public/`.

### Bundle Build Pipeline

```
src/browser-modern.ts
  imports --> src/extensions/remark/legal-markdown-processor.ts  (pipeline)
  imports --> src/utils/html-format.ts                          (shared formatting)
     |
     v
  npx vite build              (vite.config.ts - library mode)
     |
     v
  dist/legal-markdown-browser.js   (~1.3 MB, ~276 KB gzipped)
     |
     v
  node scripts/copy-web-bundle.js  (copies to src/web/public/)
```

The bundle includes: unified, remark-parse, remark-stringify, marked.js,
js-beautify, Handlebars, and all remark plugins. It does NOT include Puppeteer,
cheerio, or Node fs/path modules.

## Shared Modules

### `src/utils/html-format.ts`

This is the single source of truth for markdown-to-HTML conversion and HTML
formatting. Both the Node pipeline (`html-generator.ts`) and the browser bundle
(`browser-modern.ts`) import from this module.

It provides:

- **`configureMarkedForLegal()`** - Sets up marked.js with GFM, `breaks: true`
  (single `\n` becomes `<br>`), and silent mode. Idempotent.
- **`markdownToHtmlBody(markdown)`** - Converts processed markdown to an HTML
  body fragment using the configured marked instance.
- **`formatHtml(html)`** - Formats HTML with js-beautify using settings tuned
  for legal documents (inline elements like `<span>` stay on one line).
- **`wrapHtmlDocument(body, css, title)`** - Wraps a body fragment in a complete
  HTML5 document with embedded `<style>` block.
- **`BEAUTIFY_OPTIONS`** - The js-beautify configuration object, exported for
  reference.

The Node HTML generator (`html-generator.ts`) adds on top of this:

- Cheerio-based DOM transforms for print optimization (`no-break` classes on
  short lists, `table-responsive` wrappers, image alt attributes)
- CSS file loading from disk
- Default CSS injection from `styles/default.css`

These Node-specific features are not available in the browser bundle and are not
needed for the playground's screen preview.

## Preview Tabs

| Tab               | Content                               | Source                                           |
| ----------------- | ------------------------------------- | ------------------------------------------------ |
| **Rendered**      | Live visual preview in an iframe      | `bodyHtml` injected as `srcDoc` with CSS         |
| **Markdown**      | Raw markdown output from the pipeline | `result.content`                                 |
| **HTML**          | Formatted HTML body fragment          | `formatHtml(markdownToHtmlBody(result.content))` |
| **HTML Document** | Complete standalone HTML file         | `wrapHtmlDocument(bodyHtml, customCSS, title)`   |

The **Rendered** tab uses raw (unformatted) HTML for the iframe to avoid
js-beautify whitespace artifacts in the visual rendering. The **HTML** and
**HTML Document** tabs show formatted output for readability.

All HTML derivation (`bodyHtml`, `formattedHtml`, `htmlDocument`) and the
`activeTab` state are memoized/managed in `App.tsx` via `useMemo` and
`useState`. They are recomputed only when `result` or `customCSS` changes and
passed down to `PreviewPanel` as props.

## Key Files

```
src/
  browser-modern.ts              Browser bundle entry point
  utils/
    html-format.ts               Shared HTML formatting (marked + js-beautify)
  web/
    index.html                   SPA shell, loads browser bundle via <script>
    vite.config.ts               Vite config for playground build
    public/
      legal-markdown-browser.js  Pre-built browser bundle (copied by script)
    src/
      main.tsx                   React entry point
      App.tsx                    Root component, layout, state wiring
      hooks/
        useLegalMarkdown.ts      All processing state + actions
      components/
        EditorPanel.tsx          Markdown input textarea
        CSSEditorPanel.tsx       CSS input textarea
        PreviewPanel.tsx         Four-tab output panel
        Toolbar.tsx              Action bar (run, download, copy, print, options)
        OptionsPopover.tsx       Popover for highlight / field-tracking toggles
        StatusBar.tsx            Bottom status bar
        MetadataSheet.tsx        Metadata slide-over
      lib/
        examples.ts              Auto-discovers examples/playground/*.md via import.meta.glob
        css-examples.ts          CSS preset stylesheets
      types/
        legal-markdown.d.ts      Type declarations for window.LegalMarkdown
```

## Build and Development

```bash
# Development (hot-reload)
npm run dev:web         # Copies bundle + starts Vite dev server on :5173

# Production build
npx vite build          # Build browser bundle (library mode)
npm run build:web       # Copy bundle + build playground SPA to dist/web/

# Rebuild just the library (after changing pipeline code)
npx vite build && node scripts/copy-web-bundle.js
```

**Important**: Changes to pipeline code (`src/extensions/`, `src/utils/`, etc.)
require rebuilding the browser bundle. The Vite dev server only hot-reloads
playground component changes, not the pre-built library.

## Architectural Decisions

### Why a pre-built bundle instead of direct imports?

The processing pipeline depends on unified/remark which use complex ESM imports
with Node resolution. Vite's dev server can handle this, but bundling the
pipeline as a library avoids resolution issues and keeps the playground build
fast.

### Why `window.LegalMarkdown` instead of ES module imports?

The browser bundle needs Buffer polyfills and other global setup that must run
before any pipeline code. Loading as a `<script>` tag ensures this happens in
the right order. The playground components access it through
`window.LegalMarkdown` with TypeScript declarations in `legal-markdown.d.ts`.

### Why shared `html-format.ts`?

Before this module existed, the playground had its own hand-rolled
`markdownToHTML()` regex parser that didn't handle `<br>` for soft line breaks,
tables, or any HTML features beyond basic headings and bold. The Node HTML
generator had its own marked.js + js-beautify configuration. This duplication
caused rendering differences between the playground preview and the actual HTML
output.

The shared module ensures one configuration for both environments:

- Same marked.js settings (GFM, `breaks: true`, silent)
- Same js-beautify formatting (inline elements preserved, consistent
  indentation)
- Same document wrapper template

### Why no Web Worker?

The pipeline processes most documents in under 100ms. A Web Worker would add
complexity (message serialization, error handling, lifecycle management) for
negligible UX benefit. The 1-second debounce on the editor already prevents UI
jank during typing. If processing latency becomes an issue with very large
documents, a Worker can be added without changing the component architecture -
just move the `processLegalMarkdownAsync` call to a Worker context.
