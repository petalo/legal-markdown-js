# Security Considerations <!-- omit in toc -->

- [Overview](#overview)
- [Input & Metadata Handling](#input--metadata-handling)
- [File-System Boundaries](#file-system-boundaries)
- [Runtime Safeguards](#runtime-safeguards)
- [Dependency & Release Hygiene](#dependency--release-hygiene)

## Overview

Legal Markdown JS processes untrusted markdown/YAML supplied by authors.
Security controls focus on preventing prototype pollution, directory traversal
and script injection while keeping the CLI/browser experiences predictable.

## Input & Metadata Handling

- YAML parsing uses `js-yaml` in safe mode; Phase 1 merges metadata through
  `mergeMetadata`, which copies plain objects and filters out `__proto__` keys
- Force-commands run as string templates only; there is no evaluation of raw
  JavaScript - helper functions exposed to templates are whitelisted and
  implemented in TypeScript
- Template field resolution escapes values when necessary; HTML/PDF outputs rely
  on remark-stringify + HtmlGenerator, which avoid injecting raw script blocks
- Frontmatter merges honour `disableFrontmatterMerge`, `validateImportTypes` and
  `logImportOperations` flags so operators can inspect or block potentially
  unsafe metadata coming from imports

## File-System Boundaries

- CLI resolves paths relative to the provided `basePath` and rejects missing
  files early
- The import plugin is limited to markdown documents on disk; future work
  tracked in `docs/legacy-deprecation-plan.md` covers additional restrictions
  (e.g., import allowlists)
- Archive manager writes to user-chosen directories but never deletes source
  files

## Runtime Safeguards

- Debug logging is gated behind `options.debug` to avoid leaking metadata in
  standard runs
- Plugin order validation prevents misconfiguration that could surface raw
  template expressions or bypass sanitising plugins
- Browser bundle runs inside a web worker so unexpected long-running processing
  does not freeze the UI thread

## Dependency & Release Hygiene

- Dependency updates run through `npm audit` and GitHub Dependabot alerts
- Release automation (`semantic-release`) executes linting, type checking and
  the full Vitest suite before publishing
- Optional downloads such as Puppeteer are pinned to known-good versions and can
  be skipped via environment variables in hardened environments

Security is an ongoing effort. Any feature that touches metadata parsing,
filesystem access or external execution should start with a threat analysis and
update this document with new mitigations.
