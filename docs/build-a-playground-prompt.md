# Prompt: Rebuild the Legal Markdown JS Playground

> **Purpose:** Hand this document to an LLM to rebuild the `src/web/` playground
> from scratch. It is a living spec - update it when the design or feature set
> evolves.

---

## Context

**Legal Markdown JS** is a TypeScript library that processes legal documents
written in a contract-friendly markdown dialect plus YAML frontmatter. It
resolves template variables, toggles optional clauses, numbers legal headers,
tracks field usage, and exports to HTML/PDF.

The library ships a browser bundle at `dist/legal-markdown-browser.js` (copied
during build to `src/web/public/legal-markdown-browser.js`). The playground
loads that bundle and calls its async API directly in the browser - no server,
no build pipeline required at runtime.

The current playground (`src/web/`) works correctly but has poor visual design,
fragile custom JS resizers, and no metadata/diagnostics panel. **Rebuild it
entirely** using the stack and design system described below. Treat the existing
app as a _behavioral reference_, not a structural template.

---

## Mission

Build a **professional developer-tool playground** that:

1. Lets legal document authors write and preview Legal Markdown in real time
2. Serves as a **reference implementation of shadcn/ui** for developers
   integrating the library
3. Looks polished enough to be the public face of the project on GitHub Pages

---

## Tech Stack

| Layer          | Choice                                                         |
| -------------- | -------------------------------------------------------------- |
| Framework      | React 18 + TypeScript                                          |
| Build tool     | Vite 5                                                         |
| UI components  | shadcn/ui (latest)                                             |
| Styling        | Tailwind CSS v3 (via shadcn)                                   |
| Icons          | Lucide React (already a shadcn dependency)                     |
| Toasts         | Sonner (shadcn's recommended toast)                            |
| Library bundle | `./legal-markdown-browser.js` (ES module, loaded via `import`) |

**Do not** introduce Monaco Editor, CodeMirror, or any other heavy dependency.
Plain `<textarea>` elements are fine - the goal is to showcase shadcn, not a
code editor.

---

## Design System

### Colors - "Code Dark + Run Green"

```css
/* Tailwind equivalents shown in comments */
--background: #0f172a; /* slate-950 */
--surface: #1e293b; /* slate-800 */
--surface-2: #334155; /* slate-700 */
--border: #475569; /* slate-600 */
--text-primary: #f8fafc; /* slate-50  */
--text-muted: #94a3b8; /* slate-400 */
--accent: #22c55e; /* green-500 - "run green" */
--accent-hover: #16a34a; /* green-600 */
--destructive: #ef4444; /* red-500   */
```

Configure these as shadcn CSS variables in `src/web/src/index.css`:

```css
@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 142.1 76.2% 36.3%; /* green-600 */
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142.1 76.2% 36.3%;
    --radius: 0.5rem;
  }
}
```

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

body {
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

Use `JetBrains Mono` for: textarea editors, code/pre blocks, metadata values,
the app title/logo. Use `IBM Plex Sans` for: all other UI text (labels,
tooltips, buttons, descriptions).

### Style rules

- Dark mode only (no light mode toggle required)
- All panel backgrounds: `bg-slate-900` or `bg-slate-800`
- Panel borders: `border-slate-700`
- No emojis as icons - use Lucide icons exclusively
- All interactive elements: `cursor-pointer` + `transition-colors duration-200`
- Focus rings must be visible (shadcn default handles this)
- Minimum touch target: 44×44 px

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                │
│  [⚖ Legal MD]  [Examples ▾]  [CSS Presets ▾]  [Options ▾]  [Metadata] │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│  INPUT EDITOR    │  CSS EDITOR      │  PREVIEW                          │
│  ResizablePanel  │  ResizablePanel  │  ResizablePanel                   │
│                  │                  │  [Markdown] [HTML] ← Tabs         │
│  <textarea>      │  <textarea>      │                                   │
│  font-mono       │  font-mono       │  Rendered output here             │
│                  │                  │                                   │
│  [Upload .md]    │  [Upload .css]   │  [Copy MD] [Copy HTML]            │
│  [Clear]         │  [Reset]         │  [Download] [Print]               │
├──────────────────┴──────────────────┴───────────────────────────────────┤
│  STATUS BAR: processing indicator | field count | word count | warnings │
└─────────────────────────────────────────────────────────────────────────┘
                                    ← Sheet slides in from right for Metadata
```

**Implementation notes:**

- Use shadcn `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` - do
  **not** write custom mouse-drag resizing logic
- The three panels have default sizes `[30, 20, 50]` (percent)
- The Metadata panel is a shadcn `Sheet` (side="right", width ~480px), not a
  permanent column
- Toolbar is a fixed-height `header` (48px) above the panels
- Status bar is a fixed-height `footer` (32px) below the panels

---

## shadcn Component Map

Install these components with `npx shadcn@latest add <name>`:

| UI element             | shadcn component               | Notes                                                               |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------- |
| 3-panel layout         | `resizable`                    | `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`          |
| Output tab switcher    | `tabs`                         | "Markdown" / "HTML" tabs                                            |
| Metadata side panel    | `sheet`                        | `side="right"`                                                      |
| Example selector       | `select`                       |                                                                     |
| CSS preset selector    | `select`                       |                                                                     |
| Processing options     | `popover` + `switch` + `label` | one `Popover` with all toggles inside                               |
| Toolbar buttons        | `button`                       | `variant="ghost"` for icon buttons, `variant="default"` for primary |
| Tooltips               | `tooltip`                      | wrap every icon-only button                                         |
| Toasts / notifications | `sonner`                       | replaces the custom message div                                     |
| Field tracking badges  | `badge`                        | colored: filled=green, empty=yellow, unused=slate                   |
| Collapsible sections   | `collapsible`                  | for raw JSON in Metadata sheet                                      |
| Separator              | `separator`                    | panel header dividers                                               |
| Loading state          | `skeleton`                     | show while processing                                               |

---

## Library API

The library bundle exports from `window.LegalMarkdown` (loaded via ES module
import). Use the following function exclusively:

```typescript
const result = await window.LegalMarkdown.processLegalMarkdownWithRemark(
  content: string,
  options: ProcessingOptions
);
```

**`ProcessingOptions` interface** (match CLI options exactly):

```typescript
interface ProcessingOptions {
  basePath?: string; // default: '.'
  enableFieldTracking?: boolean; // default: true
  debug?: boolean;
  yamlOnly?: boolean; // skip YAML substitution
  noHeaders?: boolean; // disable header numbering
  noClauses?: boolean;
  noReferences?: boolean;
  noImports?: boolean;
  noMixins?: boolean;
  noReset?: boolean;
  noIndent?: boolean;
  throwOnYamlError?: boolean;
  exportMetadata?: boolean;
  exportFormat?: 'yaml' | 'json';
  exportPath?: undefined; // always undefined in browser
}
```

**Result shape:**

```typescript
interface ProcessingResult {
  content: string; // processed markdown
  metadata?: object; // extracted YAML frontmatter + computed fields
  fieldReport?: {
    fields: Array<{
      name: string;
      value: unknown;
      status: 'filled' | 'empty' | 'unused';
      occurrences: number;
    }>;
  };
  stats?: {
    wordCount: number;
    sectionCount: number;
    processingTimeMs: number;
  };
  warnings?: string[];
}
```

---

## Processing Options (all 11 toggles)

Render these inside a `Popover` triggered from the toolbar. Group them with a
`Separator` and section labels:

**Processing Control**

| ID                    | Label          | Default | Description                                             |
| --------------------- | -------------- | ------- | ------------------------------------------------------- |
| `enableFieldTracking` | Field tracking | `true`  | Adds HTML spans around template variables for debugging |
| `debug`               | Debug mode     | `false` | Logs step-by-step processing info to the console        |
| `yamlOnly`            | Skip YAML      | `false` | Returns raw markdown with `{{variables}}` unresolved    |
| `noHeaders`           | No headers     | `false` | Disables automatic `l.` / `ll.` / `lll.` numbering      |

**Clause & Content**

| ID             | Label         | Default | Description                                       |
| -------------- | ------------- | ------- | ------------------------------------------------- |
| `noClauses`    | No clauses    | `false` | Disables `[text]{condition}` conditional blocks   |
| `noReferences` | No references | `false` | Disables cross-reference processing               |
| `noMixins`     | No mixins     | `false` | Disables helper functions like `{{formatDate()}}` |
| `noImports`    | No imports    | `false` | Disables `@import` of external markdown files     |

**Header Formatting**

| ID                 | Label       | Default | Description                                      |
| ------------------ | ----------- | ------- | ------------------------------------------------ |
| `noReset`          | No reset    | `false` | Prevents resetting header counters               |
| `noIndent`         | No indent   | `false` | Disables automatic indentation of nested headers |
| `throwOnYamlError` | Strict YAML | `false` | Stops processing on malformed YAML               |

---

## Features

### Auto-processing

Process the document automatically 1 second after the user stops typing
(debounce). Also trigger immediately on `Ctrl+Enter` / `Cmd+Enter`. The Process
button in the toolbar triggers manually as well. During processing, disable the
button and show a spinner via the `Sonner` loading toast or an inline spinner in
the status bar.

### Examples dropdown

Populate from a `lib/examples.ts` file. Include these 7 examples (copy content
verbatim from the existing `src/web/src/lib/examples.ts`):

| Key                   | Label                                                         |
| --------------------- | ------------------------------------------------------------- |
| `demo-contract`       | Software Development Agreement _(load by default on startup)_ |
| `service-agreement`   | Services Agreement                                            |
| `lease-contract`      | Office Lease Agreement                                        |
| `purchase-ticket`     | Purchase Ticket                                               |
| `nda`                 | Non-Disclosure Agreement                                      |
| `employment-contract` | Employment Contract                                           |
| `features-demo`       | Features Demo                                                 |

### CSS Presets dropdown

Populate from `lib/css-examples.ts`. Include these 4 presets:

| Key       | Label                                    |
| --------- | ---------------------------------------- |
| `default` | Default Legal Styles _(load by default)_ |
| `modern`  | Modern                                   |
| `classic` | Classic Legal                            |
| `minimal` | Minimal                                  |

The CSS editor textarea starts populated with the selected preset. Changes in
the textarea apply to the preview in real time (500 ms debounce). The Reset
button restores the active preset.

### Preview panel tabs

Three tabs:

| Tab                      | Content                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Rendered** _(default)_ | The processed markdown converted to HTML and rendered in an `<iframe>` or `<div>` with custom CSS applied |
| **Markdown**             | Raw processed markdown in a `<pre>` block with `font-mono`                                                |
| **HTML**                 | The generated HTML source code in a `<pre>` block                                                         |

For the Rendered tab, apply the custom CSS inside the preview area. Use
`dangerouslySetInnerHTML` or an `<iframe srcDoc>` so styles are scoped to the
preview.

### Metadata / Diagnostics Sheet

Triggered by a "Metadata" button in the toolbar (opens `Sheet` from the right).
Contains:

**1. YAML Variables** - a table with columns: Field | Value | Type | Status
Status is shown as a colored `Badge`: `filled` (green), `empty` (yellow/amber),
`unused` (slate)

**2. Processing Stats** - word count, section count, processing time, warning
count

**3. Warnings** - list of warning strings from `result.warnings`, shown as amber
alert rows

**4. Raw Metadata** - a `Collapsible` section with the full `result.metadata` as
formatted JSON in a `<pre>` block

Update the sheet contents after each successful processing run.

### File upload

- `.md` file upload replaces the input editor content
- `.css` file upload replaces the CSS editor content
- Both use `<input type="file" className="sr-only">` triggered by a `Button`

### Export actions

| Action            | Keyboard | Behavior                                                        |
| ----------------- | -------- | --------------------------------------------------------------- |
| Download Markdown | `Ctrl+S` | Download `result.content` as `<title>.md`                       |
| Print             | `Ctrl+P` | Open print dialog with HTML preview + custom CSS                |
| Download PDF      | `Ctrl+D` | Print-to-PDF via hidden iframe (same as current implementation) |
| Copy Markdown     | -        | `navigator.clipboard.writeText(result.content)`                 |
| Copy HTML         | -        | Copy the formatted HTML string                                  |

### Status bar

Always visible at the bottom. Shows (left to right):

- Processing indicator: spinning icon while processing, green checkmark when
  done, red X on error
- Word count: `{n} words`
- Field count: `{n} fields` (from fieldReport)
- Warning count: `{n} warnings` in amber if > 0

---

## File Structure

Produce these files under `src/web/`:

```
src/web/
├── index.html                    ← Vite entry, loads fonts, sets dark bg
├── vite.config.ts                ← Vite config, no special plugins needed
├── tsconfig.json                 ← strict: true, jsx: react-jsx
├── components.json               ← shadcn config (style: default, baseColor: slate, cssVariables: true)
├── src/
│   ├── main.tsx                  ← ReactDOM.createRoot, ThemeProvider wrapper
│   ├── App.tsx                   ← Root layout: Toolbar + ResizablePanelGroup + StatusBar
│   ├── components/
│   │   ├── Toolbar.tsx           ← Header with all dropdowns and buttons
│   │   ├── EditorPanel.tsx       ← Left panel: textarea + upload + clear
│   │   ├── CSSEditorPanel.tsx    ← Middle panel: textarea + upload + reset
│   │   ├── PreviewPanel.tsx      ← Right panel: Tabs (Rendered / Markdown / HTML)
│   │   ├── MetadataSheet.tsx     ← Sheet: variables table + stats + warnings + raw JSON
│   │   └── OptionsPopover.tsx    ← Popover: all 11 Switch toggles
│   ├── hooks/
│   │   └── useLegalMarkdown.ts   ← state + debounce + processContent()
│   └── lib/
│       ├── examples.ts           ← Example documents (typed, not on window)
│       └── css-examples.ts       ← CSS preset strings
└── public/
    └── legal-markdown-browser.js ← symlink or copy of dist/browser bundle
```

---

## `useLegalMarkdown` Hook

Centralise all processing logic here. Signature:

```typescript
interface UseLegalMarkdownReturn {
  // Editor state
  content: string;
  setContent: (v: string) => void;
  customCSS: string;
  setCustomCSS: (v: string) => void;
  options: ProcessingOptions;
  setOptions: (o: Partial<ProcessingOptions>) => void;

  // Result state
  result: ProcessingResult | null;
  isProcessing: boolean;
  error: string | null;

  // Actions
  processNow: () => Promise<void>;
  downloadMarkdown: (title?: string) => void;
  printDocument: () => void;
  copyMarkdown: () => void;
  copyHTML: () => void;
}
```

The hook debounces `content` and `customCSS` changes with a 1 000 ms delay, then
calls `processLegalMarkdownWithRemark`. On success it updates `result`; on error
it sets `error` and shows a destructive Sonner toast.

---

## Quality Checklist

Before delivering the code, verify:

- [ ] No emojis used as icons - all icons from Lucide React
- [ ] `cursor-pointer` on every clickable element
- [ ] All icon-only buttons have `aria-label` and a `Tooltip`
- [ ] Hover states use `transition-colors duration-200`
- [ ] Focus rings visible (shadcn handles via `ring-ring`)
- [ ] `ResizableHandle` has `withHandle` prop for the drag indicator
- [ ] `Sheet` closes on Escape and on backdrop click
- [ ] `Sonner` `<Toaster>` mounted once in `main.tsx`
- [ ] `ThemeProvider` wraps the whole app (default theme: dark)
- [ ] No hardcoded pixel widths on panels - use `ResizablePanel` defaultSize
- [ ] Textarea in editors uses `font-mono`, `bg-slate-900`, `text-slate-50`,
      `resize-none`, `h-full`
- [ ] The `fieldReport.fields` array is rendered as a proper `<table>` inside
      the Sheet, not a `<ul>`
- [ ] Processing options default values match the table above exactly
- [ ] The app loads the demo-contract example on startup

---

## What NOT to Build

- No Monaco / CodeMirror / other code editor
- No server, no API routes, no SSR
- No PDF generation via Puppeteer (print-to-PDF via `window.print()` is
  sufficient)
- No light mode (dark only for now)
- No permalink / share URL feature
- No drag-and-drop file upload (click-to-upload is enough)
- No syntax highlighting in the editor textareas
