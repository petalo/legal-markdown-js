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

| Target           | Output                                                   | Source Scripts                                                               |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ESM bundle       | `dist/index.js` + `dist/index.d.ts`                      | `npm run build:esm` (tsc + `tsc-alias` + import fixer)                       |
| CJS bundle       | `dist/index.cjs`                                         | `npm run build:cjs` (tsc + `tsc-alias`)                                      |
| CLI entry points | `dist/cli/index.js`, `dist/cli/interactive/index.js`     | Built as part of TypeScript compilation, then patched by `build:restore-cli` |
| Web SPA          | `dist/web/`                                              | `npm run build:vite` + `npm run build:web`                                   |
| UMD bundle       | `dist/legal-markdown.umd.min.js` + copies in `dist/web/` | `npm run build:umd` + `npm run build:copy-umd`                               |
| Assets           | `dist/styles/`, `dist/assets/`, `dist/examples/`         | `build:styles`, `build:assets`, `build:examples`                             |

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
- **Vite** - handles the SPA build (`npm run build:vite`)
- **Webpack** - produces the minified UMD bundle consumed by the browser API
- **Utility scripts** - `scripts/build-paths.js` discovers assets/styles,
  `scripts/build-web.js` assembles SPA artefacts, `scripts/web-serve.cjs` serves
  the playground locally

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

- UMD bundle located at `dist/legal-markdown.umd.min.js` and referenced via
  `package.json` `jsdelivr`/`unpkg` fields
- Web SPA artefacts (Vite + supplemental scripts) live under `dist/web/`
- Browser consumers import from the UMD bundle or leverage the Vite-generated
  assets for self-hosted interfaces

## Local Development Tips

- `npm run build:watch` - incremental TypeScript compilation during development
- `npm run dev` - run the CLI in watch mode with hot reload
- `npm run web` - serve the playground/web UI with live reload
- `npm run test:watch` / `npm run test:unit` - iterate on tests with Vitest

The build system intentionally keeps cross-platform compatibility while reusing
shared TypeScript sources to minimise drift between environments.
