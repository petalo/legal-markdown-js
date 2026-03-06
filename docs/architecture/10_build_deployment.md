# Build System and Deployment <!-- omit in toc -->

- [Overview](#overview)
- [Build Targets](#build-targets)
- [Tooling & Scripts](#tooling--scripts)
- [Publishing Workflow](#publishing-workflow)
- [Browser Distribution](#browser-distribution)
- [Local Development Tips](#local-development-tips)

## Overview

The project ships multiple artefacts from a single TypeScript source:

- ESM + CJS bundles for Node consumers
- CLI binaries (batch + interactive)
- Web SPA assets and UMD bundles

`npm run build` orchestrates these outputs while keeping TypeScript sources as
the single truth.

## Build Targets

| Target           | Output                                               | Source Scripts                                                                     |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ESM bundle       | `dist/index.js` + `dist/index.d.ts`                  | `npm run build:esm` (tsc + `tsc-alias` + import fixer)                             |
| CJS bundle       | `dist/index.cjs`                                     | `npm run build:cjs` (tsc + `tsc-alias`)                                            |
| CLI entry points | `dist/cli/index.js`, `dist/cli/interactive/index.js` | Built as part of TypeScript compilation, then patched by `build:restore-cli`       |
| Browser bundle   | `dist/legal-markdown-browser.js` (ES module)         | `npx vite build` (vite.config.ts library mode)                                     |
| Web SPA          | `dist/web/`                                          | `npm run build:web` (copies bundle + `vite build --config src/web/vite.config.ts`) |
| Assets           | `dist/styles/`, `dist/assets/`, `dist/examples/`     | `build:styles`, `build:assets`, `build:examples`                                   |

The combined `npm run build` task runs all subtasks sequentially (TypeScript,
styles, assets, examples, Vite web build, pipeline to prepare SPA, webpack UMD,
copy UMD artefacts).

## Tooling & Scripts

- **TypeScript** - `tsconfig.esm.json` and `tsconfig.cjs.json` drive separate
  compilations; `tsc-alias` rewrites path aliases after emit
- **Fixups** - `scripts/fix-esm-imports.js` and
  `scripts/fix-build-extensions.js` adjust emitted file extensions for Node
  compatibility; `scripts/build-packages.cjs` prepares secondary package outputs
  when needed
- **Vite (library mode)** - `vite.config.ts` builds the browser ES module
  (`dist/legal-markdown-browser.js`)
- **Vite (SPA mode)** - `src/web/vite.config.ts` builds the React playground to
  `dist/web/`
- **`scripts/copy-web-bundle.js`** - BFS-traverses the browser bundle's import
  graph and copies all chunks to `src/web/public/` before dev or SPA builds
- **Utility scripts** - `scripts/build-paths.js` discovers assets/styles,
  `scripts/web-serve.cjs` serves the legacy playground locally

## Publishing Workflow

1. `npm run clean` - wipe build outputs
2. `npm run build` - produce all artefacts
3. `npm run test` / `npm run validate` - ensure suites pass
4. `npm publish` (handled by semantic-release in CI)

`package.json` exports map:

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

CLI binaries are exposed through `bin` entries pointing at the compiled outputs.

## Browser Distribution

- Browser ES module at `dist/legal-markdown-browser.js` (Vite library mode);
  loaded via `<script type="module">` or served as a static asset
- Web SPA artefacts live under `dist/web/` after `npm run build:web`
- Browser consumers import from `dist/legal-markdown-browser.js`; the web
  playground loads it via `src/web/public/` (populated by `copy-web-bundle.js`)

## Local Development Tips

- `npm run build:watch` - incremental TypeScript compilation during development
- `npm run dev` - run the CLI in watch mode with hot reload
- `npm run dev:web` - copy browser bundle + start Vite dev server for the React
  playground (hot-reloads playground components; pipeline changes require
  re-running `npx vite build` first)
- `npm run dev:web:server` - same as `dev:web` but on port 5174 (no auto-open)
- `npm run dev:web` / `npm run web:serve` - run or serve the web playground
- `npm run test:watch` / `npm run test:unit` - iterate on tests with Vitest

The build system intentionally keeps cross-platform compatibility while reusing
shared TypeScript sources to minimise drift between environments.
