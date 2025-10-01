## <small>3.2.3 (2025-09-29)</small>

- fix: resolve cross-reference field tracking and processing issues (#108)
  ([0ddca47](https://github.com/petalo/legal-markdown-js/commit/0ddca47)),
  closes [#108](https://github.com/petalo/legal-markdown-js/issues/108)

## <small>3.2.2 (2025-09-25)</small>

- fix: process Roman numerals (%R, %r) in all cross-reference levels (#105)
  ([27de7cd](https://github.com/petalo/legal-markdown-js/commit/27de7cd)),
  closes [#105](https://github.com/petalo/legal-markdown-js/issues/105)

## <small>3.2.1 (2025-09-01)</small>

- fix: enable variable processing inside code blocks by default (#88)
  ([b5bf890](https://github.com/petalo/legal-markdown-js/commit/b5bf890)),
  closes [#88](https://github.com/petalo/legal-markdown-js/issues/88)

## 3.2.0 (2025-08-28)

- feat: dynamic CLI version reading from package.json (#87)
  ([559dc67](https://github.com/petalo/legal-markdown-js/commit/559dc67)),
  closes [#87](https://github.com/petalo/legal-markdown-js/issues/87)

## <small>3.1.7 (2025-08-07)</small>

- fix: resolve ESLint and Prettier quote conflict
  ([f21fe68](https://github.com/petalo/legal-markdown-js/commit/f21fe68))

## <small>3.1.6 (2025-08-07)</small>

- perf: improve test timeout handling for CI environments
  ([e706417](https://github.com/petalo/legal-markdown-js/commit/e706417))
- docs: clean up install script output by removing decorative completion message
  ([5f82602](https://github.com/petalo/legal-markdown-js/commit/5f82602))

## <small>3.1.5 (2025-08-07)</small>

- fix: Show relative paths in interactive file selector for cleaner UI (#67)
  ([679efb6](https://github.com/petalo/legal-markdown-js/commit/679efb6)),
  closes [#67](https://github.com/petalo/legal-markdown-js/issues/67)

## <small>3.1.4 (2025-08-07)</small>

- fix: reduce PDF Generator verbosity by replacing console.log with logger (#66)
  ([c787d06](https://github.com/petalo/legal-markdown-js/commit/c787d06)),
  closes [#66](https://github.com/petalo/legal-markdown-js/issues/66)

## <small>3.1.3 (2025-08-06)</small>

- fix: resolve test concurrency and Chrome detection issues for npm deployment
  (#64) ([51ef397](https://github.com/petalo/legal-markdown-js/commit/51ef397)),
  closes [#64](https://github.com/petalo/legal-markdown-js/issues/64)

## <small>3.1.2 (2025-08-06)</small>

- fix: resolve macOS PDF generation and Homebrew installation issues (#63)
  ([10a9db2](https://github.com/petalo/legal-markdown-js/commit/10a9db2)),
  closes [#63](https://github.com/petalo/legal-markdown-js/issues/63)

## <small>3.1.1 (2025-08-06)</small>

- fix: resolve FTUX configuration validation issues
  ([4e180d0](https://github.com/petalo/legal-markdown-js/commit/4e180d0))
- Enhanced FTUX with macOS installer and improved config validation (#62)
  ([279770b](https://github.com/petalo/legal-markdown-js/commit/279770b)),
  closes [#62](https://github.com/petalo/legal-markdown-js/issues/62)

## 3.1.0 (2025-08-06)

- feat: enhance interactive CLI with force commands automation and optimizations
  (#61) ([7085d14](https://github.com/petalo/legal-markdown-js/commit/7085d14)),
  closes [#61](https://github.com/petalo/legal-markdown-js/issues/61)

## <small>3.0.3 (2025-08-02)</small>

- fix: prevent indented headers from becoming code blocks in HTML/PDF (#50)
  ([1a92de1](https://github.com/petalo/legal-markdown-js/commit/1a92de1)),
  closes [#50](https://github.com/petalo/legal-markdown-js/issues/50)

## <small>3.0.2 (2025-08-02)</small>

- fix: correctly handle empty string vs undefined in header level definitions
  (#49) ([bed33e1](https://github.com/petalo/legal-markdown-js/commit/bed33e1)),
  closes [#49](https://github.com/petalo/legal-markdown-js/issues/49)
- docs: add missing v3.0.0 changelog entry with breaking changes
  ([3f305af](https://github.com/petalo/legal-markdown-js/commit/3f305af))

## <small>3.0.1 (2025-08-02)</small>

- fix: use temp directories in interactive CLI tests instead of creating
  test-fixtures in root (#48)
  ([9172b1c](https://github.com/petalo/legal-markdown-js/commit/9172b1c)),
  closes [#48](https://github.com/petalo/legal-markdown-js/issues/48)
- chore: update version to 3.0.0 and fix semantic-release configuration
  ([20657e6](https://github.com/petalo/legal-markdown-js/commit/20657e6))

## 3.0.0 (2025-08-02)

### ⚠ BREAKING CHANGES

- **remark migration**: Internal processing pipeline migrated to AST-based
  remark system
- **API changes**: Some internal APIs have changed for enhanced performance
- **field tracking**: Field tracking implementation updated for better accuracy

### Features

- **remark integration**: Complete remark migration with enhanced features and
  modern architecture (#47)
  ([a4dae11](https://github.com/petalo/legal-markdown-js/commit/a4dae11))
- **CLI integration**: Add --headers flag for auto-populating YAML front matter
- **remark processor**: Implement complete Legal Markdown processor using
  unified/remark
- **plugin architecture**: Export centralized plugin registry for consistent
  imports
- **API extensions**: Export processLegalMarkdownWithRemark for public API
- **enhanced testing**: Add comprehensive noIndent integration tests and
  enhanced coverage
- **documentation**: Update core system architecture and processing pipeline
  documentation

### Performance Improvements

- **AST processing**: Modern AST-based document processing with remark
- **single pipeline**: Combine all Legal Markdown plugins in single processing
  pipeline
- **field tracking**: Automatic field tracking integration with clearing
- **debugging**: Include debugging capabilities and error handling

### Documentation

- **architecture**: Complete remark integration architecture guide
- **processing**: Enhanced processing pipeline documentation
- **migration**: Comprehensive migration guide for remark system

## <small>2.16.3 (2025-07-31)</small>

- fix: unify archive directory behavior to be project-relative (#46)
  ([c7db8f5](https://github.com/petalo/legal-markdown-js/commit/c7db8f5)),
  closes [#46](https://github.com/petalo/legal-markdown-js/issues/46)
- ⚡ Optimize test performance by 60% with threading and smart timeouts (#44)
  ([3d0941e](https://github.com/petalo/legal-markdown-js/commit/3d0941e)),
  closes [#44](https://github.com/petalo/legal-markdown-js/issues/44)

## <small>2.16.2 (2025-07-31)</small>

- Merge branch 'fix/webpack-umd-export-configuration'
  ([70036a5](https://github.com/petalo/legal-markdown-js/commit/70036a5))
- fix: resolve webpack UMD export configuration for native browser compatibility
  ([0f0ab2e](https://github.com/petalo/legal-markdown-js/commit/0f0ab2e))

## <small>2.16.1 (2025-07-31)</small>

- fix: resolve playground compatibility issues with
  processLegalMarkdownWithRemark functions
  ([5eea375](https://github.com/petalo/legal-markdown-js/commit/5eea375))

## 2.16.0 (2025-07-31)

- feat: implement First-Time User Experience (FTUX) for interactive CLI (#43)
  ([cd6e440](https://github.com/petalo/legal-markdown-js/commit/cd6e440)),
  closes [#43](https://github.com/petalo/legal-markdown-js/issues/43)

## 2.15.0 (2025-07-31)

- fix: comprehensive CLI interactive fixes - duplicated output, imports,
  archiving
  ([b06cd54](https://github.com/petalo/legal-markdown-js/commit/b06cd54))
- fix: correct CLI path references in test files after ESM migration
  ([2b7d5d4](https://github.com/petalo/legal-markdown-js/commit/2b7d5d4))
- fix: correct JSDoc violations in src/ files to comply with
  DEVELOPMENT-GUIDELINES.md
  ([775a420](https://github.com/petalo/legal-markdown-js/commit/775a420))
- fix: correct JSDoc violations in tests/ files to comply with
  DEVELOPMENT-GUIDELINES.md
  ([01c05c8](https://github.com/petalo/legal-markdown-js/commit/01c05c8))
- fix: correct web playground and browser entry point ESM compatibility
  ([96e8684](https://github.com/petalo/legal-markdown-js/commit/96e8684))
- fix: resolve CLI test failures and deprecated callback usage
  ([52fb577](https://github.com/petalo/legal-markdown-js/commit/52fb577))
- fix: resolve ESM compatibility issues in build scripts
  ([dd88934](https://github.com/petalo/legal-markdown-js/commit/dd88934))
- fix: resolve ESM compatibility issues in build scripts
  ([3975503](https://github.com/petalo/legal-markdown-js/commit/3975503))
- fix: resolve highlight.css embedding regression in ESM builds
  ([94880ee](https://github.com/petalo/legal-markdown-js/commit/94880ee))
- fix: update CSS classes for remark migration compatibility
  ([e6cf3c2](https://github.com/petalo/legal-markdown-js/commit/e6cf3c2))
- feat: add comprehensive remark-based Legal Markdown processor
  ([ce5e54a](https://github.com/petalo/legal-markdown-js/commit/ce5e54a))
- feat: enhance build system with ESM-compatible scripts and dual build support
  ([fc91ab2](https://github.com/petalo/legal-markdown-js/commit/fc91ab2))
- feat: implement comprehensive remark plugin architecture for Legal Markdown
  ([c0afc8f](https://github.com/petalo/legal-markdown-js/commit/c0afc8f))
- feat: implement ESM migration foundation with dual ESM/CJS build support
  ([39124b2](https://github.com/petalo/legal-markdown-js/commit/39124b2))
- feat: migrate from Jest to Vitest for improved ESM compatibility and
  performance
  ([e0956b1](https://github.com/petalo/legal-markdown-js/commit/e0956b1))
- feat: migrate to remark ecosystem and Vitest for AST-based processing (#42)
  ([3f081d3](https://github.com/petalo/legal-markdown-js/commit/3f081d3)),
  closes [#42](https://github.com/petalo/legal-markdown-js/issues/42)
- feat: reorganize utilities and enhance type system for remark migration
  ([e0aa0bb](https://github.com/petalo/legal-markdown-js/commit/e0aa0bb))
- feat: update legacy processors with ESM compatibility and improved
  documentation
  ([1ca0771](https://github.com/petalo/legal-markdown-js/commit/1ca0771))
- style: fix Prettier formatting in esm-utils.ts
  ([dde948a](https://github.com/petalo/legal-markdown-js/commit/dde948a))
- refactor: address GitHub Copilot security and architecture feedback
  ([75c5fb3](https://github.com/petalo/legal-markdown-js/commit/75c5fb3))
- docs: add markdownlint directive to disable specific rule in features guide
  ([91121d2](https://github.com/petalo/legal-markdown-js/commit/91121d2))
- docs: add missing comma in markdownlint configuration
  ([35529ac](https://github.com/petalo/legal-markdown-js/commit/35529ac))
- docs: enhance generate-readmes.js with comprehensive JSDoc documentation
  ([7bf1ba5](https://github.com/petalo/legal-markdown-js/commit/7bf1ba5))
- docs: major documentation reorganization and comprehensive migration guide
  ([f55f6a8](https://github.com/petalo/legal-markdown-js/commit/f55f6a8))
- docs: reorganize ARCHITECTURE.md into modular structure
  ([9b54a84](https://github.com/petalo/legal-markdown-js/commit/9b54a84))
- docs: update CLI-REFERENCE.md with missing options and frontmatter merging
  ([8c8d9c9](https://github.com/petalo/legal-markdown-js/commit/8c8d9c9))
- chore: add .htmlhintignore configuration
  ([4070f0d](https://github.com/petalo/legal-markdown-js/commit/4070f0d))
- chore: add markdownlint configuration for sibling headers
  ([341957b](https://github.com/petalo/legal-markdown-js/commit/341957b))
- chore: update .gitignore with additional exclusion patterns
  ([791e369](https://github.com/petalo/legal-markdown-js/commit/791e369))

## <small>2.14.2 (2025-07-29)</small>

- fix: prevent malformed frontmatter comments from appearing as H1 headers (#40)
  ([e54125c](https://github.com/petalo/legal-markdown-js/commit/e54125c)),
  closes [#40](https://github.com/petalo/legal-markdown-js/issues/40)

## <small>2.14.1 (2025-07-29)</small>

- fix: prevent duplicate success messages in interactive CLI (#39)
  ([7bf6253](https://github.com/petalo/legal-markdown-js/commit/7bf6253)),
  closes [#39](https://github.com/petalo/legal-markdown-js/issues/39)

## 2.14.0 (2025-07-29)

- feat: add automatic cross-references metadata generation (#38)
  ([0286339](https://github.com/petalo/legal-markdown-js/commit/0286339)),
  closes [#38](https://github.com/petalo/legal-markdown-js/issues/38)

## 2.13.0 (2025-07-29)

- feat: add support for uppercase Roman numerals (%R) (#37)
  ([5031f59](https://github.com/petalo/legal-markdown-js/commit/5031f59)),
  closes [#37](https://github.com/petalo/legal-markdown-js/issues/37)
- docs: improve JSDoc documentation and eliminate TypeDoc warnings (#36)
  ([efa46b8](https://github.com/petalo/legal-markdown-js/commit/efa46b8)),
  closes [#36](https://github.com/petalo/legal-markdown-js/issues/36)

## <small>2.12.1 (2025-07-29)</small>

- fix: improve CLI console output formatting and eliminate duplicates (#35)
  ([68bb465](https://github.com/petalo/legal-markdown-js/commit/68bb465)),
  closes [#35](https://github.com/petalo/legal-markdown-js/issues/35)

## 2.12.0 (2025-07-28)

- feat: separate field tracking from highlighting and restore dual output
  generation (#34)
  ([79fe2cd](https://github.com/petalo/legal-markdown-js/commit/79fe2cd)),
  closes [#34](https://github.com/petalo/legal-markdown-js/issues/34)
- test: add smart test execution to pre-commit hooks
  ([cd619d1](https://github.com/petalo/legal-markdown-js/commit/cd619d1))

## 2.11.0 (2025-07-28)

- feat: implement frontmatter merging system for imports (#33)
  ([2cdaefe](https://github.com/petalo/legal-markdown-js/commit/2cdaefe)),
  closes [#33](https://github.com/petalo/legal-markdown-js/issues/33)

## 2.10.0 (2025-07-28)

- Merge pull request #32 from petalo/feat/store-processed-documents
  ([282fe4c](https://github.com/petalo/legal-markdown-js/commit/282fe4c)),
  closes [#32](https://github.com/petalo/legal-markdown-js/issues/32)
- fix: add null safety checks for archive result paths
  ([dcf0640](https://github.com/petalo/legal-markdown-js/commit/dcf0640))
- fix: remove PDF/HTML generation from archive integration tests
  ([f7f0652](https://github.com/petalo/legal-markdown-js/commit/f7f0652))
- feat: implement smart archiving system for source files
  ([50a6232](https://github.com/petalo/legal-markdown-js/commit/50a6232))

## 2.9.0 (2025-07-28)

- feat: improve .env discovery and add user-friendly setup tools (#31)
  ([06d632b](https://github.com/petalo/legal-markdown-js/commit/06d632b)),
  closes [#31](https://github.com/petalo/legal-markdown-js/issues/31)

## <small>2.8.1 (2025-07-28)</small>

- Merge pull request #30 from petalo/hotfix/dotenv-dependency
  ([5d22ef6](https://github.com/petalo/legal-markdown-js/commit/5d22ef6)),
  closes [#30](https://github.com/petalo/legal-markdown-js/issues/30)
- fix: move dotenv from devDependencies to dependencies
  ([9b515b6](https://github.com/petalo/legal-markdown-js/commit/9b515b6))

## 2.8.0 (2025-07-28)

- Merge branch 'main' into feat/interactive-cli
  ([63a9e81](https://github.com/petalo/legal-markdown-js/commit/63a9e81))
- Merge pull request #29 from petalo/feat/interactive-cli
  ([424d932](https://github.com/petalo/legal-markdown-js/commit/424d932)),
  closes [#29](https://github.com/petalo/legal-markdown-js/issues/29)
- refactor: address Copilot review suggestions
  ([c209f73](https://github.com/petalo/legal-markdown-js/commit/c209f73))
- feat: add interactive CLI with guided prompts and comprehensive testing
  ([d471ede](https://github.com/petalo/legal-markdown-js/commit/d471ede))

## 2.7.0 (2025-07-27)

- Merge branch 'main' into docs/playground-styles
  ([6c2cc3e](https://github.com/petalo/legal-markdown-js/commit/6c2cc3e))
- Merge pull request #28 from petalo/docs/playground-styles
  ([70c3016](https://github.com/petalo/legal-markdown-js/commit/70c3016)),
  closes [#28](https://github.com/petalo/legal-markdown-js/issues/28)
- feat: include all commit types in changelog when version bumps
  ([ced8181](https://github.com/petalo/legal-markdown-js/commit/ced8181))
- docs(build): improve build script logging for deployment status
  ([168ddd8](https://github.com/petalo/legal-markdown-js/commit/168ddd8))

## [2.6.4](https://github.com/petalo/legal-markdown-js/compare/v2.6.3...v2.6.4) (2025-07-27)

### Bug Fixes

- **playground:** address Copilot security and error handling suggestions
  ([df5ed04](https://github.com/petalo/legal-markdown-js/commit/df5ed04ea05cac7af155b2aa42533d1963bdb7bc))

## [2.6.3](https://github.com/petalo/legal-markdown-js/compare/v2.6.2...v2.6.3) (2025-07-27)

### Bug Fixes

- resolve CSS paths relative to STYLES_DIR environment variable
  ([#26](https://github.com/petalo/legal-markdown-js/issues/26))
  ([80c25d1](https://github.com/petalo/legal-markdown-js/commit/80c25d17111ad8028edcab0c2a1e673b811d01bf))

## [2.6.2](https://github.com/petalo/legal-markdown-js/compare/v2.6.1...v2.6.2) (2025-07-27)

### Bug Fixes

- preserve HTML spans in code blocks when field tracking is enabled
  ([#25](https://github.com/petalo/legal-markdown-js/issues/25))
  ([8cdec2d](https://github.com/petalo/legal-markdown-js/commit/8cdec2da7033cb06f601cbd4dea9478a83b3e566))

## [2.6.1](https://github.com/petalo/legal-markdown-js/compare/v2.6.0...v2.6.1) (2025-07-27)

### Bug Fixes

- use DEFAULT_INPUT_DIR and DEFAULT_OUTPUT_DIR environment variables in CLI
  ([f625ebc](https://github.com/petalo/legal-markdown-js/commit/f625ebc8ae89dcea2ee0a9d43f0eaf473afc6452))
- use DEFAULT_INPUT_DIR and DEFAULT_OUTPUT_DIR environment vars
  ([5009627](https://github.com/petalo/legal-markdown-js/commit/500962716b640577555ff6eb3f9b376c27c1677a)),
  closes [#24](https://github.com/petalo/legal-markdown-js/issues/24)

# [2.6.0](https://github.com/petalo/legal-markdown-js/compare/v2.5.0...v2.6.0) (2025-07-27)

### Features

- add Spanish date format to DateFormats
  ([e8de026](https://github.com/petalo/legal-markdown-js/commit/e8de0261ed48a6f1fce34874ef85b69403b4acfc)),
  closes [#23](https://github.com/petalo/legal-markdown-js/issues/23)
- add Spanish date format to DateFormats
  ([3d22281](https://github.com/petalo/legal-markdown-js/commit/3d2228126ba9e305259b5fb04ffd21175148f7fa))

# [2.5.0](https://github.com/petalo/legal-markdown-js/compare/v2.4.0...v2.5.0) (2025-07-27)

### Features

- implement modern pipeline architecture with AST-based processing
  ([0a9d04e](https://github.com/petalo/legal-markdown-js/commit/0a9d04eee41504cd05ee157287fc4cff17718ce8))
- implement modern pipeline architecture with AST-based processing
  ([#20](https://github.com/petalo/legal-markdown-js/issues/20))
  ([3147475](https://github.com/petalo/legal-markdown-js/commit/3147475ebbc437a52f70d078cf9c33638c8a63b1))

# [2.4.0](https://github.com/petalo/legal-markdown-js/compare/v2.3.0...v2.4.0) (2025-07-26)

### Bug Fixes

- correct double periods in cross-reference test expectations
  ([65ef15b](https://github.com/petalo/legal-markdown-js/commit/65ef15b91575bb4ce2e3633b313a90c5b5f5c46d))

### Features

- reimplement cross-references to match Ruby specification
  ([2ac491e](https://github.com/petalo/legal-markdown-js/commit/2ac491e3b781f34ad518fff59b003e3e9deec095))

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
