# [1.2.0](https://github.com/petalo/legal-markdown-js/compare/v1.1.1...v1.2.0) (2025-07-17)

### Features

- add GitHub Pages deployment for Legal Markdown playground
  ([25b14c9](https://github.com/petalo/legal-markdown-js/commit/25b14c9ac8e4967417cfc6d6f1f1e043f123e343))

## [1.1.1](https://github.com/petalo/legal-markdown-js/compare/v1.1.0...v1.1.1) (2025-07-17)

### Bug Fixes

- update Node.js version requirements and CI matrix
  ([c5acf3a](https://github.com/petalo/legal-markdown-js/commit/c5acf3a98076aa90eaf3794c276f1df905150763))

# [1.1.0](https://github.com/petalo/legal-markdown-js/compare/v1.0.1...v1.1.0) (2025-07-17)

### Features

- enhance package discoverability with additional keywords
  ([3e4cc5f](https://github.com/petalo/legal-markdown-js/commit/3e4cc5f0cc4fbc174e1e96dc83f6c1cfc2398847))

## [1.0.1](https://github.com/petalo/legal-markdown-js/compare/v1.0.0...v1.0.1) (2025-07-17)

### Bug Fixes

- update package description and force republication with correct metadata
  ([f000935](https://github.com/petalo/legal-markdown-js/commit/f000935a51b3b27dd8aa23d5f9ae6d370f52d8ad))

# 1.0.0 (2025-07-17)

### Bug Fixes

- add ESLint disable comments for remaining quote and indent issues
  ([3be2487](https://github.com/petalo/legal-markdown-js/commit/3be24870859fabddbec330630e105f2fc337d041))
- add ESLint disable comments to prevent quote formatting conflicts
  ([dc28c3e](https://github.com/petalo/legal-markdown-js/commit/dc28c3e873e8419c446d0ae2be404e33142eafe9))
- configure ESLint switch case indentation and VSCode TypeScript formatting
  ([a5e7a47](https://github.com/petalo/legal-markdown-js/commit/a5e7a47cc9b1bf34b5bf8d846d8edbdf75e95763))
- downgrade chalk to v4.1.2 for CommonJS compatibility
  ([7b10f6e](https://github.com/petalo/legal-markdown-js/commit/7b10f6eb1016866b43fd303ad0e66ccf296ec507))
- increase commitlint body-max-line-length for semantic-release compatibility
  ([2bff400](https://github.com/petalo/legal-markdown-js/commit/2bff4008f0bbca2346e2dfed8f81eff0b90d3623))
- resolve all ESLint formatting issues
  ([e68f5fa](https://github.com/petalo/legal-markdown-js/commit/e68f5fae694e4d788e652785e1b30d90d9b07858))
- resolve all ESLint formatting issues
  ([b18fec2](https://github.com/petalo/legal-markdown-js/commit/b18fec27ba1c80bcf29a1bb26548236bcb5fd158))
- update Node.js version to 20 for semantic-release compatibility
  ([0a72b14](https://github.com/petalo/legal-markdown-js/commit/0a72b14ace0150f6eded5cc1aa8d2021354211d2))
- upgrade [@typescript-eslint](https://github.com/typescript-eslint) to support
  TypeScript 5.8.3 and resolve all formatting issues
  ([bf5d0d0](https://github.com/petalo/legal-markdown-js/commit/bf5d0d00566b30dc536d2fc39e5682f94b469e34))

### Features

- enable automatic npm publishing with semantic-release
  ([4f100ff](https://github.com/petalo/legal-markdown-js/commit/4f100ff6bd5891f4481bda2d99b5a5418fa1870f))
- initial release of legal-markdown-js v1.0.0 - Node.js port of LegalMarkdown
  ([fa97a4e](https://github.com/petalo/legal-markdown-js/commit/fa97a4ed246289757cee43977c1a2c393ba7bd9d))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-17

### Added

- Initial implementation of LegalMarkdown JS with complete feature parity
- YAML front matter parsing and processing
- Header numbering system with automatic formatting
- Optional clauses processing with boolean logic
- Cross-references support for internal document linking
- Import functionality for modular document composition
- Metadata export capabilities for document analysis
- Command-line interface with comprehensive options
- Web interface with CSS editor and live preview
- TypeScript support with full type definitions
- Node.js API for programmatic usage
- Multiple output formats (HTML, PDF, Markdown)
- Template loops for array iteration
- Mixin system for helper functions
- Comprehensive test suite with unit, integration, and E2E tests
- CI/CD pipeline with GitHub Actions
- Automated releases with semantic-release
- Validation and error handling throughout the pipeline

### Features

- Complete compatibility with original LegalMarkdown Ruby implementation
- Browser-compatible UMD bundle for CDN usage
- Puppeteer-based PDF generation
- Extensible parser system with fallback support
- Field tracking for document analysis
- Batch processing capabilities
- LaTeX and RestructuredText parsing extensions
