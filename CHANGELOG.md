# [2.3.0](https://github.com/petalo/legal-markdown-js/compare/v2.2.0...v2.3.0) (2025-07-26)

### Features

- implement complete template loops with dot notation support
  ([076de84](https://github.com/petalo/legal-markdown-js/commit/076de84107d9c008c138542a71d5bc06ebda8b73))

# [2.2.0](https://github.com/petalo/legal-markdown-js/compare/v2.1.0...v2.2.0) (2025-07-26)

### Features

- implement environment-based path configuration system
  ([#18](https://github.com/petalo/legal-markdown-js/issues/18))
  ([9af1007](https://github.com/petalo/legal-markdown-js/commit/9af1007ca2bbdf61b20be8d3e5c48a174b91bad9))

# [2.1.0](https://github.com/petalo/legal-markdown-js/compare/v2.0.1...v2.1.0) (2025-07-26)

### Features

- complete PDF logo system with external URL support
  ([#17](https://github.com/petalo/legal-markdown-js/issues/17))
  ([68b8f52](https://github.com/petalo/legal-markdown-js/commit/68b8f52d3c17ac3ab355eb0a5b8d4d718d9b3a02))

## [2.0.1](https://github.com/petalo/legal-markdown-js/compare/v2.0.0...v2.0.1) (2025-07-26)

### Bug Fixes

- correct workflow triggers for release and package upload jobs
  ([6a00a92](https://github.com/petalo/legal-markdown-js/commit/6a00a92277b469a7ed9b333a67f9542a831dc909))

# [2.0.0](https://github.com/petalo/legal-markdown-js/compare/v1.5.1...v2.0.0) (2025-07-26)

### Bug Fixes

- configure semantic-release for protected branch compatibility
  ([20870d5](https://github.com/petalo/legal-markdown-js/commit/20870d57cafd009dc1b7f314176e3055ac10d276))
- disable footer-max-line-length rule for semantic-release compatibility
  ([7368a03](https://github.com/petalo/legal-markdown-js/commit/7368a03b03b771f75d466fc6511b9385b8d0f7ce))
- resolve CLI module path resolution errors
  ([1cd3a56](https://github.com/petalo/legal-markdown-js/commit/1cd3a566522ed8f142ebe932c80fb60618e708fd))

### Features

- implement force_commands for document-driven configuration
  ([#14](https://github.com/petalo/legal-markdown-js/issues/14))
  ([6505f8d](https://github.com/petalo/legal-markdown-js/commit/6505f8db21b3b76b6e7670a54ea9c823778683ed))

### BREAKING CHANGES

- Documents can now override CLI options via force_commands

## [1.5.1](https://github.com/petalo/legal-markdown-js/compare/v1.5.0...v1.5.1) (2025-07-18)

### Bug Fixes

- resolve ESLint warnings in parseHelperArguments function
  ([b952985](https://github.com/petalo/legal-markdown-js/commit/b952985381527a03a5e03887b82d6e0d917cb116))

# [1.5.0](https://github.com/petalo/legal-markdown-js/compare/v1.4.0...v1.5.0) (2025-07-18)

### Features

- implement field tracking control system
  ([e07fc1f](https://github.com/petalo/legal-markdown-js/commit/e07fc1f1b8205dadb1271ce3a54ec85de87b3393))

# [1.4.0](https://github.com/petalo/legal-markdown-js/compare/v1.3.0...v1.4.0) (2025-07-18)

### Bug Fixes

- resolve ESLint warnings and CLI import functionality bug
  ([96428cb](https://github.com/petalo/legal-markdown-js/commit/96428cb26aac667f42216d0c6e6bed649ae0736e))
- resolve multiple critical bugs in core processing
  ([4e5f6fc](https://github.com/petalo/legal-markdown-js/commit/4e5f6fc11c7fc1de46057f8767128e6e79aba650))

### Features

- update playground with corrected features demo content
  ([af36ec0](https://github.com/petalo/legal-markdown-js/commit/af36ec0481b2afee90debf345f8e1071398ddd1b))

# [1.3.0](https://github.com/petalo/legal-markdown-js/compare/v1.2.0...v1.3.0) (2025-07-17)

### Features

- add repository link to playground header
  ([3d24408](https://github.com/petalo/legal-markdown-js/commit/3d24408288f0ceceb7df83995cf4f1372a7f6f12))

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
