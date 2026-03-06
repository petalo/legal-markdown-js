# Bundling Guide

This document explains how the codebase handles bundling for the three
distribution targets - npm package, browser bundle, and standalone binary - and
the known issues with each.

## Distribution Targets

| Target            | Entry point             | Built with  | Output                           |
| ----------------- | ----------------------- | ----------- | -------------------------------- |
| npm (ESM)         | `src/index.ts`          | tsc + vite  | `dist/index.js`                  |
| npm (CJS)         | `src/index.ts`          | tsc         | `dist/index.cjs`                 |
| Browser           | `src/browser-modern.ts` | vite        | `dist/legal-markdown-browser.js` |
| Standalone binary | `src/cli/main.ts`       | Bun compile | `dist/bin/legal-md`              |

## Why Dynamic Imports Exist

Several modules are imported with `await import(...)` instead of static `import`
statements. This was done to support the browser bundle: modules like
`cosmiconfig`, `node:fs`, and `node:os` do not exist in browser environments, so
deferring their load prevents the browser bundle from failing at parse time.

The pattern in `src/config/index.ts`:

```ts
// Dynamic to avoid breaking the browser bundle
const [{ cosmiconfig }, fs, os, path] = await Promise.all([
  dynamicImport('cosmiconfig'),
  dynamicImport('node:fs'),
  dynamicImport('node:os'),
  dynamicImport('node:path'),
]);
```

This works fine for npm and browser targets. It breaks the standalone binary.

## Known Issues in the Standalone Binary

### cosmiconfig (CRITICAL)

`cosmiconfig` is dynamically imported and Bun's bundler does not include it.
This breaks **all** CLI commands that load config - which is every command,
since `loadConfig()` is called on startup.

Symptom:

```
error: Cannot find package 'cosmiconfig' from '/$bunfs/root/legal-md'
```

Root cause: The dynamic import bypasses Bun's static analysis, so the package is
never added to the bundle.

### puppeteer (EXPECTED - external dependency)

Puppeteer is intentionally not bundled. It is an optional dependency that users
install separately when they need PDF generation. The binary fails gracefully
with `PdfDependencyError` when `--pdf` is used without puppeteer installed.

This is correct behavior. See "Proposed Solutions" below for the intended setup
experience.

### pandoc-wasm (NOT A PROBLEM)

`pandoc-wasm` is only loaded when `typeof window !== 'undefined'` (browser
environment). The `PandocLoader` class returns early in Node/binary context
before ever attempting the import. No action needed.

## Module Map

| Module            | Import type | Works in binary? | Notes                       |
| ----------------- | ----------- | ---------------- | --------------------------- |
| `cosmiconfig`     | dynamic     | NO               | Config broken               |
| `node:fs/os/path` | dynamic     | YES              | Bun supports Node built-ins |
| `puppeteer`       | dynamic     | graceful fail    | Optional, expected          |
| `pandoc-wasm`     | dynamic     | YES              | Browser-only guard          |
| Local modules     | dynamic     | YES              | Bundled by Bun              |

## Proposed Solutions

### 1. Fix cosmiconfig (required for binary to work)

**Option A - Static import in config loader (implemented)**

The current `src/config/index.ts` already uses static imports for cosmiconfig
and Node built-ins (`node:fs`, `node:os`, `node:path`), with runtime state in
`src/config/runtime.ts`.

**Option B - Bun external package flag**

Tell Bun to bundle cosmiconfig explicitly:

```bash
bun build --compile src/cli/main.ts --outfile dist/bin/legal-md \
  --external puppeteer  # keep puppeteer external
# cosmiconfig gets bundled by default if statically imported
```

This is simpler but requires changing the dynamic import to a static one anyway,
which makes Option A the cleaner path.

### 2. puppeteer UX in the binary

Since puppeteer is external, `legal-md --pdf` should fail with a clear,
actionable error message pointing users to how to install it. The
`PdfDependencyError` already exists - verify its message is helpful in the
context of standalone binary users (who cannot run `npm install puppeteer`).

For binary users, the correct path is `system-chrome` or `weasyprint`
connectors, which use a locally installed browser and do not require puppeteer.
The binary help or error message should mention this:

```
PDF via puppeteer requires a separate install. Alternatively:
  --pdf-connector system-chrome   # uses your installed Chrome/Chromium
  --pdf-connector weasyprint      # uses WeasyPrint (must be installed)
```

### 3. pandoc-wasm (no action needed)

The browser guard in `PandocLoader` correctly skips the import in Node and
binary contexts. No changes required.

## build:binary Script

```bash
npm run build:binary
# expands to:
mkdir -p dist/bin && bun build --compile --target=bun-darwin-arm64 \
  src/cli/main.ts --outfile dist/bin/legal-md
```

After fixing cosmiconfig (solution 1), the binary should be fully functional for
all core CLI commands. PDF via puppeteer remains intentionally unavailable
without a separate install.
