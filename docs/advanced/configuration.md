# Configuration

Legal Markdown JS uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)
for configuration discovery. Settings are merged in order of precedence (highest
wins):

```text
CLI flags > project config > global config > defaults
```

## Quick start

```bash
# Scaffold a config file interactively
legal-md init

# Inspect effective resolved configuration
legal-md config
```

## Config file locations

### Global (user-wide)

`~/.config/legal-md/config.yaml`

Applied to every invocation regardless of working directory. Useful for personal
preferences like locale, log level, or preferred PDF connector.

### Project (per-directory)

cosmiconfig searches the current directory upward for the first matching file:

| File                | Format        |
| ------------------- | ------------- |
| `.legalmdrc`        | JSON or YAML  |
| `.legalmdrc.yaml`   | YAML          |
| `.legalmdrc.json`   | JSON          |
| `legalmd.config.js` | JS (CommonJS) |
| `legalmd.config.ts` | TypeScript    |
| `package.json`      | `legalmd` key |

## All configuration options

### `paths`

Directory paths used during processing. Relative paths are resolved from the
current working directory.

```yaml
paths:
  images: src/assets/images # images referenced in documents
  styles: src/styles # CSS files for HTML/PDF output
  input: input # default input directory
  output: output # default output directory
  archive: processed # destination when --archive-source is used
```

| Key             | Type            | Default | Description              |
| --------------- | --------------- | ------- | ------------------------ |
| `paths.images`  | `string` (path) | `.`     | Directory for images     |
| `paths.styles`  | `string` (path) | `.`     | Directory for CSS files  |
| `paths.input`   | `string` (path) | `.`     | Default input directory  |
| `paths.output`  | `string` (path) | `.`     | Default output directory |
| `paths.archive` | `string` (path) | `.`     | Archive destination      |

### `logging`

Controls log verbosity during processing.

```yaml
logging:
  level: error
  debug: false
```

| Key             | Type            | Values                        | Default | Description                  |
| --------------- | --------------- | ----------------------------- | ------- | ---------------------------- |
| `logging.level` | `string` (enum) | `error` `warn` `info` `debug` | `error` | Minimum log level to display |
| `logging.debug` | `boolean`       | `true` `false`                | `false` | Enable verbose debug output  |

`logging.level` controls the minimum severity shown. Setting `debug` shows all
messages including internal pipeline steps.

### `processing`

Controls how documents are processed.

```yaml
processing:
  highlight: false
  enableFieldTracking: false
  astFieldTracking: false
  logicBranchHighlighting: false
  validationMode: auto
  locale: es-ES
```

| Key                                           | Type              | Values                       | Default       | Description                                                        |
| --------------------------------------------- | ----------------- | ---------------------------- | ------------- | ------------------------------------------------------------------ |
| `processing.highlight`                        | `boolean`         | `true` `false`               | `false`       | Include highlighting CSS for HTML/PDF output                       |
| `processing.enableFieldTracking`              | `boolean`         | `true` `false`               | `false`       | Add tracking spans in markdown output                              |
| `processing.astFieldTracking`                 | `boolean`         | `true` `false`               | `false`       | AST-first tracking route (Phase 2 tokens -> Phase 3)              |
| `processing.logicBranchHighlighting`          | `boolean`         | `true` `false`               | `false`       | Winner-branch annotations for conditionals                         |
| `processing.validationMode`                   | `string` (enum)   | `strict` `permissive` `auto` | `auto`        | YAML validation strictness                                         |
| `processing.locale`                           | `string` (BCP 47) | -                            | system locale | Locale for number and date formatting                              |

#### `processing.locale`

Accepts a [BCP 47 language tag](https://www.ietf.org/rfc/bcp/bcp47.txt). This
controls how numbers, currencies, and dates are formatted in template helpers
(`formatDate`, `formatCurrency`, `formatNumber`, etc.).

```yaml
# Examples
processing:
  locale: es-ES    # Spanish (Spain)   - 1.234.567,89 - 2 de marzo de 2026
  locale: en-US    # English (US)      - 1,234,567.89 - March 2, 2026
  locale: fr-FR    # French (France)   - 1 234 567,89 - 2 mars 2026
  locale: de-DE    # German (Germany)  - 1.234.567,89 - 2. Marz 2026
  locale: pt-BR    # Portuguese (Brazil) - 1.234.567,89 - 2 de marco de 2026
```

If not set, defaults to the system locale detected at startup via
`Intl.DateTimeFormat().resolvedOptions().locale`. Setting it explicitly in the
config ensures consistent output regardless of where the document is processed.

#### `processing.validationMode`

| Value        | Behavior                                                     |
| ------------ | ------------------------------------------------------------ |
| `auto`       | Permissive for most fields, strict for known reserved fields |
| `strict`     | Fails on any YAML type mismatch or unknown field             |
| `permissive` | Accepts any YAML structure without errors                    |

### `pdf`

Controls PDF generation behavior.

```yaml
pdf:
  connector: auto
  format: A4
  margin:
    top: 1in
    bottom: 1in
    left: 1in
    right: 1in
```

| Key                 | Type                  | Values                                          | Default | Description           |
| ------------------- | --------------------- | ----------------------------------------------- | ------- | --------------------- |
| `pdf.connector`     | `string` (enum)       | `auto` `puppeteer` `system-chrome` `weasyprint` | `auto`  | PDF rendering backend |
| `pdf.format`        | `string` (enum)       | `A4` `Letter`                                   | `A4`    | Page size             |
| `pdf.margin.top`    | `string` (CSS length) | -                                               | `1in`   | Top margin            |
| `pdf.margin.bottom` | `string` (CSS length) | -                                               | `1in`   | Bottom margin         |
| `pdf.margin.left`   | `string` (CSS length) | -                                               | `1in`   | Left margin           |
| `pdf.margin.right`  | `string` (CSS length) | -                                               | `1in`   | Right margin          |

#### `pdf.connector`

| Value           | Requires                   | Notes                                                           |
| --------------- | -------------------------- | --------------------------------------------------------------- |
| `auto`          | -                          | Tries connectors in order: puppeteer, system-chrome, weasyprint |
| `puppeteer`     | `npm install puppeteer`    | Bundled Chromium, best compatibility                            |
| `system-chrome` | Chrome/Chromium installed  | Uses system browser, no extra install                           |
| `weasyprint`    | `weasyprint` CLI installed | Python-based, best CSS support                                  |

#### `pdf.margin` CSS length units

Accepted units: `in` (inches), `cm`, `mm`, `px`, `pt`.

```yaml
pdf:
  margin:
    top: 2.5cm
    bottom: 2.5cm
    left: 3cm
    right: 2cm
```

## Environment variable overrides

Environment variables take precedence over config files. Useful for CI/CD or
temporary overrides without modifying config files.

| Variable                   | Config key                  | Values                                          |
| -------------------------- | --------------------------- | ----------------------------------------------- |
| `LOG_LEVEL`                | `logging.level`             | `error` `warn` `info` `debug`                   |
| `DEBUG`                    | `logging.debug`             | `true` `1`                                      |
| `IMAGES_DIR`               | `paths.images`              | any path                                        |
| `STYLES_DIR`               | `paths.styles`              | any path                                        |
| `DEFAULT_INPUT_DIR`        | `paths.input`               | any path                                        |
| `DEFAULT_OUTPUT_DIR`       | `paths.output`              | any path                                        |
| `ARCHIVE_DIR`              | `paths.archive`             | any path                                        |
| `LEGAL_MD_VALIDATION_MODE` | `processing.validationMode` | `strict` `permissive` `auto`                    |
| `LEGAL_MD_PDF_CONNECTOR`   | `pdf.connector`             | `auto` `puppeteer` `system-chrome` `weasyprint` |

```bash
# Example: run with debug output without changing config files
LOG_LEVEL=debug legal-md input.md output.md

# Example: override PDF connector in CI
LEGAL_MD_PDF_CONNECTOR=system-chrome legal-md input.md --pdf
```

## Full example

```yaml
# ~/.config/legal-md/config.yaml  (global)
# or .legalmdrc.yaml              (project)

paths:
  input: docs/source
  output: docs/output
  styles: assets/css
  archive: docs/archive

logging:
  level: warn
  debug: false

processing:
  locale: es-ES
  validationMode: auto
  highlight: false
  enableFieldTracking: false
  astFieldTracking: false
  logicBranchHighlighting: false

pdf:
  connector: system-chrome
  format: A4
  margin:
    top: 2.5cm
    bottom: 2.5cm
    left: 3cm
    right: 2cm
```

## See also

- [`legal-md config`](../cli_reference.md) - inspect effective resolved
  configuration
- [`legal-md init`](../cli_reference.md) - scaffold a config file interactively
- [CLI Reference](../cli_reference.md) - all CLI flags
