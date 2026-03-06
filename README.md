# Legal Markdown JS

TypeScript/Node.js implementation of
[LegalMarkdown](https://github.com/compleatang/legal-markdown)

**Check out the [playground](https://petalo.github.io/legal-markdown-js/) for an
interactive experience!**

## What It Does

Legal Markdown JS processes legal markdown documents and can generate:

- Processed markdown
- HTML
- PDF
- DOCX

Core syntax supported:

- Variables/helpers (`{{field}}`, helpers, loops)
- Legal headers (`l.`, `ll.`, `lll.`, ...)
- Optional clauses (`[text]{condition}`)
- Cross references between sections (`|reference|`)
- Imports (`@import path/to/file.md`)

![Legal Markdown JS Playground](docs/playground-master-services-agreement.png)

## Quick Start

### 1. Install

```bash
npm install legal-markdown-js
```

### 2. Quick example

```bash
npx legal-md contract.md output.md
```

<table>
<tr>
<th>Input (<code>contract.md</code>)</th>
<th>Output markdown</th>
<th>Output HTML</th>
</tr>
<tr>
<td>
<pre><code class="language-md">---
client: ACME Corp
amount: 5000
include_warranty: true
---

l. Parties

Agreement with **{{client}}**.

l. Services

ll. Payment

Total due: ${{amount}}.

[ll. Warranty

Full warranty included.]{include_warranty} </code></pre>

</td>
<td>
<pre><code class="language-md">
&#35; 1. Parties
Agreement with **ACME Corp**.
&#35; 2. Services
&#35;&#35; 2.1. Payment Total due: $5000.
&#35;&#35; 2.2. Warranty Full warranty included. </code></pre>

</td>
<td>
<pre><code class="language-html">&lt;h1&gt;1. Parties&lt;/h1&gt;
&lt;p&gt;Agreement with
  &lt;strong&gt;ACME Corp&lt;/strong&gt;.
&lt;/p&gt;
&lt;h1&gt;2. Services&lt;/h1&gt;
&lt;h2&gt;2.1. Payment&lt;/h2&gt;
&lt;p&gt;Total due: $5000.&lt;/p&gt;
&lt;h2&gt;2.2. Warranty&lt;/h2&gt;
&lt;p&gt;Full warranty included.&lt;/p&gt;
</code></pre>
</td>
</tr>
</table>

### 3. Generate PDF

```bash
npx legal-md input.md output.pdf --pdf
```

## Installation Options

### npm package (recommended)

```bash
npm install legal-markdown-js
```

Available binaries:

- `legal-md`
- `legal-md-ui`
- `legal-md-playground`

### macOS standalone binary

```bash
brew tap petalo/legal-markdown
brew install legal-md
```

Or install script:

```bash
curl -fsSL https://github.com/petalo/legal-markdown-js/releases/latest/download/install.sh | sh
```

## CLI Usage

### Basic processing

```bash
# Input -> output markdown
legal-md input.md output.md

# Input -> stdout markdown
legal-md input.md

# Read from stdin
cat input.md | legal-md --stdin --stdout
```

### Output formats

```bash
# HTML
legal-md input.md --html

# PDF
legal-md input.md --pdf

# DOCX
legal-md input.md --docx

# Highlighted review variants
legal-md input.md --pdf --highlight
legal-md input.md --docx --highlight
```

### PDF connector selection

```bash
# Auto (default)
legal-md input.md --pdf

# Force specific backend
legal-md input.md --pdf --pdf-connector puppeteer
legal-md input.md --pdf --pdf-connector system-chrome
legal-md input.md --pdf --pdf-connector weasyprint
```

`auto` resolution order is:

1. `puppeteer`
2. `system-chrome`
3. `weasyprint`

### Interactive mode

```bash
legal-md-ui
```

### Local playground

```bash
legal-md-playground
# or
npm run web:serve
```

## Programmatic API

```ts
import {
  processLegalMarkdown,
  generateHtml,
  generatePdf,
  generatePdfVersions,
  generateDocx,
  generateDocxVersions,
} from 'legal-markdown-js';

const source = `---\ntitle: Service Agreement\nclient: ACME\n---\n\nl. Parties\n\nAgreement with {{client}}.`;

const processed = await processLegalMarkdown(source, {
  enableFieldTracking: true,
});

const html = await generateHtml(source, {
  title: 'Service Agreement',
  includeHighlighting: true,
});

const pdf = await generatePdf(source, './output/agreement.pdf', {
  format: 'A4',
  includeHighlighting: false,
  pdfConnector: 'auto', // auto | puppeteer | system-chrome | weasyprint
});

const { normal, highlighted } = await generatePdfVersions(
  source,
  './output/agreement.pdf',
  {
    format: 'Letter',
    pdfConnector: 'weasyprint',
  }
);

const docx = await generateDocx(source, './output/agreement.docx', {
  title: 'Service Agreement',
});

const docxPair = await generateDocxVersions(source, './output/agreement.docx');

console.log(
  processed.content,
  html.length,
  pdf.length,
  normal.length,
  highlighted.length
);
console.log(docx.length, docxPair.normal.length, docxPair.highlighted.length);
```

## PDF Backends

Supported backends:

- `puppeteer`
- `system-chrome`
- `weasyprint`

Installation examples:

```bash
# Puppeteer browser install (if needed)
npx puppeteer browsers install chrome

# macOS
brew install weasyprint

# Ubuntu/Debian
sudo apt-get install -y weasyprint
```

## Configuration

Configuration loading supports:

- `package.json` (`legalmd` key)
- `.legalmdrc`
- `.legalmdrc.yaml`
- `.legalmdrc.json`
- `legalmd.config.js`
- `legalmd.config.ts`

Useful env overrides:

- `LEGAL_MD_PDF_CONNECTOR`
- `LEGAL_MD_VALIDATION_MODE`
- `LOG_LEVEL`
- `DEBUG`
- `IMAGES_DIR`
- `STYLES_DIR`
- `DEFAULT_INPUT_DIR`
- `DEFAULT_OUTPUT_DIR`
- `ARCHIVE_DIR`

Example:

```bash
LEGAL_MD_PDF_CONNECTOR=weasyprint legal-md input.md --pdf
```

## Testing

```bash
# Full local suite
npm test

# CI-like run (includes PDF backend precheck)
npm run test:ci

# Backend availability check only
npm run test:pdf:backends

# Targeted suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:e2e:cli
```

`test:e2e` and `test:ci` require both PDF paths to be available:

- Puppeteer launchable Chrome/Chromium
- WeasyPrint executable

## Documentation

- [Getting Started](docs/getting_started.md)
- [CLI Reference](docs/cli_reference.md)
- [Features Overview](docs/features/README.md)
- [Output Guides](docs/output/README.md)
- [PDF Generation](docs/output/pdf-generation.md)
- [DOCX Generation](docs/output/docx-generation.md)
- [Configuration](docs/advanced/configuration.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development Guide](docs/development/development-guide.md)
- [Contributing](docs/development/contributing.md)

## Contributing

See [docs/development/contributing.md](docs/development/contributing.md).

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgments

Based on the original
[LegalMarkdown](https://github.com/compleatang/legal-markdown) project by Casey
Kuhlman.
