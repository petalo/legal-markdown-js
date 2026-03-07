# Export Format Buttons (DOCX + PDF) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Add `.docx` and `.pdf` download buttons to the third column toolbar of
the playground UI.

**Architecture:** A new browser-safe `generateDocxBuffer(html, css, options)`
function is added to `src/extensions/generators/docx-browser.ts`, exported from
the browser entry point (`src/browser-modern.ts`), and exposed on
`window.LegalMarkdown`. The playground hook gets a `downloadDocx()` helper; the
`.pdf` button reuses the existing `printDocument` flow. The bundle is rebuilt
after each change to `browser-modern.ts`.

**Tech Stack:** React, TypeScript, `docx` npm package (Packer -
browser-compatible), Vite (browser bundle), lucide-react icons, Tailwind CSS.

---

### Task 1: Create browser-safe `generateDocxBuffer`

**Files:**

- Create: `src/extensions/generators/docx-browser.ts`

**Context:** `DocxGenerator.generateDocxFromHtml` cannot run in the browser
because it calls `fs.mkdir`, `fs.readFile` (for CSS), and `fs.writeFile`. Those
are shimmed to throw in the browser bundle. The sub-modules it depends on
(`adaptCssToDocxStyles`, `convertHtmlToDocxBlocks`, `docx` `Packer`) are all
browser-compatible. We create a thin, `fs`-free wrapper around them.

**Step 1: Create the file**

```typescript
// src/extensions/generators/docx-browser.ts
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
  type IPageMarginAttributes,
  type IPageSizeAttributes,
} from 'docx';
import { adaptCssToDocxStyles } from './docx/css-style-adapter';
import {
  convertHtmlToDocxBlocks,
  createDefaultNumbering,
} from './docx/html-to-docx';

const PAGE_SIZES: Record<
  'A4' | 'Letter' | 'Legal',
  { width: number; height: number }
> = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
  Legal: { width: 12240, height: 20160 },
};

export interface DocxBrowserOptions {
  title?: string;
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
}

/**
 * Generate a DOCX buffer from HTML and CSS strings - browser-safe.
 *
 * Does not touch the filesystem. CSS is accepted as a string instead
 * of a file path. Returns a Uint8Array that can be wrapped in a Blob
 * and downloaded via URL.createObjectURL.
 */
export async function generateDocxBuffer(
  html: string,
  css: string,
  options: DocxBrowserOptions = {}
): Promise<Uint8Array> {
  const stylePreset = adaptCssToDocxStyles(css);

  const blocks = await convertHtmlToDocxBlocks(html, {
    styles: stylePreset,
    includeHighlighting: false,
    basePath: '',
  });

  const header = new Header({
    children: [new Paragraph({ children: [new TextRun('')] })],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun('Pg: '),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun(' / '),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ],
  });

  const selectedFormat = options.format ?? 'A4';
  const pageDims = PAGE_SIZES[selectedFormat] ?? PAGE_SIZES.A4;
  const size: IPageSizeAttributes = options.landscape
    ? {
        width: pageDims.height,
        height: pageDims.width,
        orientation: PageOrientation.LANDSCAPE,
      }
    : {
        width: pageDims.width,
        height: pageDims.height,
        orientation: PageOrientation.PORTRAIT,
      };

  const margins: IPageMarginAttributes = {
    top: 1440,
    right: 1440,
    bottom: 1440,
    left: 1440,
    header: 720,
    footer: 720,
    gutter: 0,
  };

  const document = new Document({
    title: options.title,
    description: options.title,
    styles: stylePreset.styles,
    numbering: createDefaultNumbering(stylePreset),
    sections: [
      {
        properties: { page: { size, margin: margins } },
        headers: { default: header },
        footers: { default: footer },
        children: blocks,
      },
    ],
  });

  return Packer.toBuffer(document);
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep docx-browser
```

Expected: no output (no errors).

**Step 3: Commit**

```bash
git add src/extensions/generators/docx-browser.ts
git commit -m "feat: add browser-safe generateDocxBuffer function"
```

---

### Task 2: Export from the browser bundle entry point

**Files:**

- Modify: `src/browser-modern.ts`

**Context:** `src/browser-modern.ts` is the entry point for
`dist/legal-markdown-browser.js`. Anything added to the default export object
and re-exported as a named export becomes available on `window.LegalMarkdown` in
the playground.

**Step 1: Add import and export**

At the top of `src/browser-modern.ts`, after the existing imports, add:

```typescript
import { generateDocxBuffer } from './extensions/generators/docx-browser';
export type { DocxBrowserOptions } from './extensions/generators/docx-browser';
export { generateDocxBuffer };
```

Then add `generateDocxBuffer` to the `LegalMarkdown` default export object:

```typescript
const LegalMarkdown = {
  processLegalMarkdownAsync,
  processLegalMarkdown,
  process: processLegalMarkdownAsync,
  markdownToHtmlBody,
  formatHtml,
  wrapHtmlDocument,
  generateDocxBuffer, // <-- add this line
  version: __LEGAL_MARKDOWN_VERSION__,
  isModernBundle: true,
};
```

**Step 2: Rebuild the browser bundle**

```bash
npm run build:vite && node scripts/copy-web-bundle.js
```

Expected: `Copied legal-markdown-browser.js -> src/web/public/` (plus any chunk
files).

**Step 3: Verify the export is present in the bundle**

```bash
grep -c "generateDocxBuffer" src/web/public/legal-markdown-browser.js
```

Expected: a number greater than 0.

**Step 4: Commit**

```bash
git add src/browser-modern.ts src/web/public/
git commit -m "feat: expose generateDocxBuffer in browser bundle"
```

---

### Task 3: Update the TypeScript interface for the browser library

**Files:**

- Modify: `src/web/src/types/legal-markdown.d.ts`

**Context:** The playground is a separate Vite app. It declares
`window.LegalMarkdown` via this `.d.ts` file. Without updating it, TypeScript
will complain when we call `window.LegalMarkdown.generateDocxBuffer(...)`.

**Step 1: Add the method signature**

In `src/web/src/types/legal-markdown.d.ts`, inside `LegalMarkdownLib`, add after
`wrapHtmlDocument`:

```typescript
/** Generate a DOCX buffer from HTML body and CSS strings - browser-safe */
generateDocxBuffer(
  html: string,
  css: string,
  options?: { title?: string; format?: 'A4' | 'Letter' | 'Legal'; landscape?: boolean }
): Promise<Uint8Array>;
```

**Step 2: Verify TypeScript is happy**

```bash
cd src/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors mentioning `generateDocxBuffer`.

**Step 3: Commit**

```bash
git add src/web/src/types/legal-markdown.d.ts
git commit -m "feat: add generateDocxBuffer to LegalMarkdownLib type"
```

---

### Task 4: Add `downloadDocx` to the hook

**Files:**

- Modify: `src/web/src/hooks/useLegalMarkdown.ts`

**Context:** The hook currently exposes `downloadContent(content, filename)` for
text-based formats. DOCX is binary, so we need a dedicated helper. The
`bodyHtml` and `customCSS` live in `App.tsx` (derived from `result` and
`customCSS`), so `downloadDocx` needs to receive them as arguments - or we pass
them through from `App.tsx` at call time. The cleanest approach: expose a
`downloadDocx(html, css, title)` function from the hook that handles the Blob
creation and download trigger.

**Step 1: Add `downloadDocx` to the interface**

In `UseLegalMarkdownReturn` (around line 23), add:

```typescript
downloadDocx: (html: string, css: string, title: string) => Promise<void>;
```

**Step 2: Implement `downloadDocx`**

After the existing `downloadContent` implementation (around line 99), add:

```typescript
const downloadDocx = useCallback(
  async (html: string, css: string, title: string) => {
    const buffer = await window.LegalMarkdown.generateDocxBuffer(html, css, {
      title,
    });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  },
  []
);
```

**Step 3: Add to the return object**

In the `return { ... }` at the bottom of `useLegalMarkdown`, add `downloadDocx`.

**Step 4: Verify TypeScript**

```bash
cd src/web && npx tsc --noEmit 2>&1 | grep -i docx
```

Expected: no output.

**Step 5: Commit**

```bash
git add src/web/src/hooks/useLegalMarkdown.ts
git commit -m "feat: add downloadDocx helper to useLegalMarkdown hook"
```

---

### Task 5: Add the two buttons to the toolbar

**Files:**

- Modify: `src/web/src/App.tsx`

**Context:** The third column toolbar (lines 241-284 in `App.tsx`) already has
an `IconButton` component. We need two new buttons after the existing print
button:

- `.docx` - triggers `downloadDocx(bodyHtml, css, title)` with a loading state
- `.pdf` - triggers `printDocument()` (existing), just relabeled

Both are ghost buttons with a `Download` icon and text label. The `Download`
icon is already imported.

**Step 1: Add `isDocxLoading` state**

After the existing `useState` calls (around line 73), add:

```typescript
const [isDocxLoading, setIsDocxLoading] = useState(false);
```

**Step 2: Add `handleDownloadDocx` handler**

After `handleCopy` (around line 120), add:

```typescript
const handleDownloadDocx = useCallback(async () => {
  if (!result || !bodyHtml) return;
  setIsDocxLoading(true);
  try {
    const title = (result.metadata?.title as string) || 'legal-document';
    const effectiveCss = ensureHighlightCss(
      customCSS,
      Boolean(options.enableFieldTracking)
    );
    await downloadDocx(bodyHtml, effectiveCss, title);
  } catch (err) {
    toast.error('DOCX generation failed', {
      description: err instanceof Error ? err.message : String(err),
    });
  } finally {
    setIsDocxLoading(false);
  }
}, [result, bodyHtml, customCSS, options.enableFieldTracking, downloadDocx]);
```

Note: `toast` is already available from `sonner` via the hook - but `App.tsx`
doesn't import it directly. Import it at the top:

```typescript
import { toast } from 'sonner';
```

**Step 3: Destructure `downloadDocx` from the hook**

In the `useLegalMarkdown()` destructure (around line 57), add `downloadDocx`:

```typescript
const { ...downloadDocx } = useLegalMarkdown();
```

**Step 4: Add the two buttons to the toolbar JSX**

After the existing print `IconButton` (around line 268), and before the
`Options` separator, add:

```tsx
<Separator orientation="vertical" className="h-5 bg-slate-700 mx-0.5" />
<Button
  variant="ghost"
  size="sm"
  onClick={handleDownloadDocx}
  disabled={!result || isDocxLoading}
  className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100 px-2"
>
  <Download className="h-3.5 w-3.5 mr-1" />
  {isDocxLoading ? '...' : '.docx'}
</Button>
<Button
  variant="ghost"
  size="sm"
  onClick={printDocument}
  disabled={!result}
  className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100 px-2"
>
  <Download className="h-3.5 w-3.5 mr-1" />
  .pdf
</Button>
```

**Step 5: Verify TypeScript**

```bash
cd src/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

**Step 6: Commit**

```bash
git add src/web/src/App.tsx
git commit -m "feat: add .docx and .pdf download buttons to playground toolbar"
```

---

### Task 6: Build and smoke-test in the browser

**Step 1: Build the web app**

```bash
npm run build:web
```

Expected: build completes with no errors.

**Step 2: Start dev server and open browser**

```bash
npm run dev:web
```

Open the playground and:

1. Load an example (e.g. "Master Services Agreement")
2. Click **Process**
3. Click **.docx** - Word should open a valid document
4. Click **.pdf** - browser print dialog should appear

**Step 3: Verify no console errors**

Open DevTools → Console. Expected: no errors related to `generateDocxBuffer` or
`fs`.

**Step 4: Final commit if anything was fixed**

```bash
git add -p
git commit -m "fix: address any smoke-test issues"
```
