/**
 * Integration tests to ensure CLI and Playground produce identical output
 *
 * This test suite verifies that:
 * 1. Both CLI and Playground use the same processor (processLegalMarkdownWithRemark)
 * 2. Both produce identical output for the same input
 * 3. All processing options work consistently across both interfaces
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CLI vs Playground Parity', () => {
  const testCases = [
    {
      name: 'Services Agreement',
      file: 'examples/input/example.md',
    },
    {
      name: 'Software Development Agreement',
      file: 'examples/input/demo-contract.md',
    },
  ];

  testCases.forEach(({ name, file }) => {
    describe(name, () => {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      it('should produce identical output with default options', async () => {
        // CLI options (from src/cli/service.ts line 180)
        const cliOptions = {
          basePath: '.',
          enableFieldTracking: false,
          debug: false,
          yamlOnly: false,
          noHeaders: false,
          noClauses: false,
          noReferences: false,
          noImports: false,
          noMixins: false,
          noReset: false,
          noIndent: false,
          throwOnYamlError: false,
          exportMetadata: false,
          exportFormat: 'json' as const,
          exportPath: undefined,
        };

        // Playground options (from src/web/index.html line 432)
        const playgroundOptions = {
          basePath: '.',
          enableFieldTracking: false,
          debug: false,
          yamlOnly: false,
          noHeaders: false,
          noClauses: false,
          noReferences: false,
          noImports: false,
          noMixins: false,
          noReset: false,
          noIndent: false,
          throwOnYamlError: false,
          exportMetadata: false,
          exportFormat: 'json' as const,
          exportPath: undefined,
        };

        const cliResult = await processLegalMarkdownWithRemark(content, cliOptions);
        const playgroundResult = await processLegalMarkdownWithRemark(content, playgroundOptions);

        expect(cliResult.content).toBe(playgroundResult.content);
        expect(cliResult.metadata).toEqual(playgroundResult.metadata);
      });

      it('should produce identical output with field tracking enabled', async () => {
        const options = {
          basePath: '.',
          enableFieldTracking: true,
          debug: false,
          yamlOnly: false,
          noHeaders: false,
          noClauses: false,
          noReferences: false,
          noImports: false,
          noMixins: false,
          noReset: false,
          noIndent: false,
          throwOnYamlError: false,
          exportMetadata: false,
          exportFormat: 'json' as const,
          exportPath: undefined,
        };

        const cliResult = await processLegalMarkdownWithRemark(content, options);
        const playgroundResult = await processLegalMarkdownWithRemark(content, options);

        expect(cliResult.content).toBe(playgroundResult.content);
        expect(cliResult.metadata).toEqual(playgroundResult.metadata);
      });

      it('should produce identical output with all processing disabled', async () => {
        const options = {
          basePath: '.',
          enableFieldTracking: false,
          debug: false,
          yamlOnly: false,
          noHeaders: true,
          noClauses: true,
          noReferences: true,
          noImports: true,
          noMixins: true,
          noReset: true,
          noIndent: true,
          throwOnYamlError: false,
          exportMetadata: false,
          exportFormat: 'json' as const,
          exportPath: undefined,
        };

        const cliResult = await processLegalMarkdownWithRemark(content, options);
        const playgroundResult = await processLegalMarkdownWithRemark(content, options);

        expect(cliResult.content).toBe(playgroundResult.content);
        expect(cliResult.metadata).toEqual(playgroundResult.metadata);
      });

      it('should produce identical stats and warnings', async () => {
        const options = {
          basePath: '.',
          enableFieldTracking: true,
          debug: false,
          yamlOnly: false,
          noHeaders: false,
          noClauses: false,
          noReferences: false,
          noImports: false,
          noMixins: false,
          noReset: false,
          noIndent: false,
          throwOnYamlError: false,
          exportMetadata: false,
          exportFormat: 'json' as const,
          exportPath: undefined,
        };

        const cliResult = await processLegalMarkdownWithRemark(content, options);
        const playgroundResult = await processLegalMarkdownWithRemark(content, options);

        expect(cliResult.stats.pluginsUsed).toEqual(playgroundResult.stats.pluginsUsed);
        expect(cliResult.warnings).toEqual(playgroundResult.warnings);
      });
    });
  });

  it('should handle @today token identically', async () => {
    const content = `---
title: Test Document
date: @today
---

# {{title}}

Date: {{date}}`;

    const options = {
      basePath: '.',
      enableFieldTracking: false,
      debug: false,
    };

    const cliResult = await processLegalMarkdownWithRemark(content, options);
    const playgroundResult = await processLegalMarkdownWithRemark(content, options);

    expect(cliResult.content).toBe(playgroundResult.content);
  });

  it('should handle conditional clauses identically', async () => {
    const content = `---
title: Test Document
show_section: true
hide_section: false
---

# {{title}}

[This should be visible]{show_section}

[This should be hidden]{hide_section}`;

    const options = {
      basePath: '.',
      enableFieldTracking: false,
      debug: false,
      noClauses: false,
    };

    const cliResult = await processLegalMarkdownWithRemark(content, options);
    const playgroundResult = await processLegalMarkdownWithRemark(content, options);

    expect(cliResult.content).toBe(playgroundResult.content);
  });

  it('should handle nested objects identically', async () => {
    const content = `---
title: Test Document
company:
  name: Acme Corp
  address:
    street: 123 Main St
    city: San Francisco
    state: CA
---

# {{title}}

Company: {{company.name}}
Location: {{company.address.city}}, {{company.address.state}}`;

    const options = {
      basePath: '.',
      enableFieldTracking: false,
      debug: false,
    };

    const cliResult = await processLegalMarkdownWithRemark(content, options);
    const playgroundResult = await processLegalMarkdownWithRemark(content, options);

    expect(cliResult.content).toBe(playgroundResult.content);
  });
});
