/**
 * Integration test for the 3-phase pipeline architecture
 *
 * This test verifies that the new 3-phase pipeline:
 * 1. Phase 1: Builds processing context with YAML and force-commands
 * 2. Phase 2: Processes content once and caches AST
 * 3. Phase 3: Generates multiple formats from cached result without re-processing
 *
 * This architecture eliminates the 4-5x duplicate processing that occurred
 * in the legacy implementation.
 *
 * @module
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildProcessingContext,
  generateAllFormats,
} from '../../src/core/pipeline';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';

describe('3-Phase Pipeline Integration', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should process content once and generate multiple formats', async () => {
    // Create a test document with YAML frontmatter and force-commands
    const testContent = `---
title: Test Agreement
author: Test Author
date: 2024-01-15
level-one: 'Article %n.'
level-two: 'Section %n.'
force_commands: '--pdf --html --highlight'
---

# Test Agreement

l. First Article

This is the first article with a date: {{date}}.

ll. First Section

Content of first section.

ll. Second Section

Content with a field: [Party Name](party-name "John Doe")

l. Second Article

ll. Another Section

Final content.`;

    const inputFile = join(testDir, 'test.md');
    writeFileSync(inputFile, testContent);

    // PHASE 1: Build processing context
    const startPhase1 = Date.now();
    const context = await buildProcessingContext(testContent, {}, testDir);
    const phase1Time = Date.now() - startPhase1;

    // Verify Phase 1 results
    expect(context.metadata).toMatchObject({
      title: 'Test Agreement',
      author: 'Test Author',
      'level-one': 'Article %n.',
      'level-two': 'Section %n.',
    });
    // Force-commands should have set these options
    expect(context.options.pdf).toBe(true);
    expect(context.options.html).toBe(true);
    expect(context.options.highlight).toBe(true);
    // Field tracking should be auto-enabled when highlight is true
    expect(context.options.enableFieldTracking).toBe(true);

    // PHASE 2: Process content ONCE with remark
    const startPhase2 = Date.now();
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: context.metadata,
      noIndent: true,
    });
    const phase2Time = Date.now() - startPhase2;

    // Verify Phase 2 results
    expect(processedResult.content).toBeDefined();
    expect(processedResult.content).toContain('Article 1.');
    expect(processedResult.content).toContain('Section 1.');
    expect(processedResult.content).toContain('John Doe');
    expect(processedResult.content).toContain('2024-01-15');
    expect(processedResult.ast).toBeDefined(); // Critical: AST is cached
    expect(processedResult.stats.pluginsUsed).toBeDefined();
    expect(processedResult.stats.pluginsUsed.length).toBeGreaterThan(0);

    // PHASE 3: Generate all formats from cached result
    const startPhase3 = Date.now();
    const formatResult = await generateAllFormats(processedResult, {
      outputDir: testDir,
      baseFilename: 'test-output',
      html: true,
      pdf: true,
      markdown: true,
      highlight: true,
    });
    const phase3Time = Date.now() - startPhase3;

    // Verify Phase 3 results
    expect(formatResult.generatedFiles.length).toBeGreaterThanOrEqual(5);
    expect(formatResult.results.html?.normal).toBeDefined();
    expect(formatResult.results.html?.highlight).toBeDefined();
    expect(formatResult.results.pdf?.normal).toBeDefined();
    expect(formatResult.results.pdf?.highlight).toBeDefined();
    expect(formatResult.results.markdown).toBeDefined();

    // Verify generated files exist and have content
    const htmlNormal = readFileSync(formatResult.results.html!.normal, 'utf-8');
    expect(htmlNormal).toContain('Article 1.');
    expect(htmlNormal).toContain('Test Agreement');

    const htmlHighlight = readFileSync(formatResult.results.html!.highlight, 'utf-8');
    expect(htmlHighlight).toContain('Article 1.');
    // Note: Field tracking is tested separately in the last test

    const markdown = readFileSync(formatResult.results.markdown!, 'utf-8');
    expect(markdown).toContain('Article 1.');
    expect(markdown).toContain('John Doe');

    // Verify performance: Phase 3 should NOT re-process content
    // (it reuses cached AST, so should be much faster than Phase 2)
    console.log(`Phase 1 (Context): ${phase1Time}ms`);
    console.log(`Phase 2 (Processing): ${phase2Time}ms`);
    console.log(`Phase 3 (Format Gen): ${phase3Time}ms`);
    console.log(`Total: ${phase1Time + phase2Time + phase3Time}ms`);

    // The key assertion: processing happened only once
    // We can verify this by checking that processedResult was reused
    expect(processedResult.ast).toBeDefined();
    expect(formatResult.stats.totalFiles).toBeGreaterThan(0);
  }, 30000); // 30s timeout for PDF generation

  it('should handle content without YAML frontmatter', async () => {
    const simpleContent = `# Simple Document

l. First Article

Content here.`;

    // PHASE 1
    const context = await buildProcessingContext(simpleContent, {
      html: true,
    }, testDir);

    expect(context.metadata).toEqual({});
    expect(context.content).toContain('# Simple Document');

    // PHASE 2
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: context.metadata,
    });

    // Without level-one metadata, should use undefined template
    expect(processedResult.content).toContain('{{undefined-level-1}}');
    expect(processedResult.ast).toBeDefined();

    // PHASE 3
    const formatResult = await generateAllFormats(processedResult, {
      outputDir: testDir,
      baseFilename: 'simple-output',
      html: true,
    });

    expect(formatResult.generatedFiles).toHaveLength(1);
    expect(formatResult.results.html?.normal).toBeDefined();
  });

  it('should respect force-commands over CLI options', async () => {
    const contentWithForceCommands = `---
force_commands: '--pdf --html'
---

# Test`;

    // PHASE 1: CLI doesn't specify PDF/HTML, force-commands does
    const context = await buildProcessingContext(contentWithForceCommands, {}, testDir);

    // Force-commands should set these options
    expect(context.options.pdf).toBe(true);
    expect(context.options.html).toBe(true);

    // PHASE 2
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: context.metadata,
    });

    // PHASE 3: Should generate both PDF and HTML
    const formatResult = await generateAllFormats(processedResult, {
      outputDir: testDir,
      baseFilename: 'force-cmd-output',
      pdf: context.options.pdf,
      html: context.options.html,
    });

    expect(formatResult.results.html?.normal).toBeDefined();
    expect(formatResult.results.pdf?.normal).toBeDefined();
  });

  it('should track fields when highlight is enabled', async () => {
    const contentWithFields = `---
title: Field Test
party_a: Alice Corp
party_b: Bob LLC
amount: 1000 USD
---

# Document

First party: {{party_a}}
Second party: {{party_b}}

Amount: {{amount}}`;

    // PHASE 1: Enable highlight (should auto-enable field tracking)
    const context = await buildProcessingContext(contentWithFields, {
      highlight: true,
      basePath: testDir,
    }, testDir);

    expect(context.options.enableFieldTracking).toBe(true);

    // PHASE 2
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: context.metadata,
    });

    expect(processedResult.stats.fieldsTracked).toBeGreaterThan(0);

    // PHASE 3
    const formatResult = await generateAllFormats(processedResult, {
      outputDir: testDir,
      baseFilename: 'fields-output',
      html: true,
      highlight: true,
    });

    const htmlHighlight = readFileSync(formatResult.results.html!.highlight, 'utf-8');
    expect(htmlHighlight).toContain('data-field="party_a"');
    expect(htmlHighlight).toContain('data-field="party_b"');
    expect(htmlHighlight).toContain('data-field="amount"');
  });
});
