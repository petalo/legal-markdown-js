/**
 * Integration tests for force-commands with 3-phase pipeline
 *
 * These tests verify that:
 * 1. Force-commands are correctly applied in Phase 1
 * 2. Phase 3 respects force-commands options (not just CLI options)
 * 3. PDF HIGHLIGHT works correctly with force-commands
 * 4. No reprocessing occurs regardless of force-commands
 *
 * @module tests/integration/force-commands-pipeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildProcessingContext, processLegalMarkdownWithRemark, generateAllFormats } from '../../src/core/pipeline';
import * as HtmlGeneratorModule from '../../src/extensions/generators/html-generator';
import * as PdfGeneratorModule from '../../src/extensions/generators/pdf-generator';
import * as path from 'path';
import * as fs from 'fs';

describe('Force-Commands with 3-Phase Pipeline', () => {
  const outputDir = path.join(__dirname, '../output/force-commands-pipeline');

  beforeEach(async () => {
    await fs.promises.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Force-Commands Option Propagation', () => {
    it('should apply force-commands highlight option in Phase 3', async () => {
      const content = `---
title: "Test Contract"
force_commands: >
  --highlight
---

# Contract

This is {{field1}}.`;

      const metadata = { field1: 'test value' };

      // Phase 1: Build context with force-commands
      const context = await buildProcessingContext(content, {}, __dirname);

      // ASSERTION: Force-commands should enable highlight
      expect(context.options.highlight).toBe(true);

      // Phase 2: Process
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: metadata,
      });

      // Phase 3: Generate formats
      // This should use context.options.highlight (from force-commands)
      // NOT the original empty options
      const result = await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        html: true,
        pdf: true,
        highlight: context.options.highlight, // ← Should be true from force-commands
        highlightCssPath: path.join(__dirname, '../../src/styles/highlight.css'),
      });

      // ASSERTION: Should generate BOTH normal and highlight versions
      expect(result.results.html?.normal).toBeDefined();
      expect(result.results.html?.highlight).toBeDefined();
      expect(result.results.pdf?.normal).toBeDefined();
      expect(result.results.pdf?.highlight).toBeDefined();
    });

    it('should apply force-commands pdf/html options in Phase 3', async () => {
      const content = `---
title: "Test"
force_commands: >
  --pdf --html
---

# Test`;

      // Phase 1 with empty CLI options
      const context = await buildProcessingContext(content, {}, __dirname);

      // ASSERTION: Force-commands should enable pdf and html
      expect(context.options.pdf).toBe(true);
      expect(context.options.html).toBe(true);

      // Phase 2
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      // Phase 3 - Must use context.options, not original empty options
      const result = await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf ?? false,  // Would be false if we used original options
        html: context.options.html ?? false,
        highlight: false,
      });

      // ASSERTION: Both formats should be generated
      expect(result.results.pdf?.normal).toBeDefined();
      expect(result.results.html?.normal).toBeDefined();
    });

    it('should prioritize force-commands over CLI options', async () => {
      const content = `---
force_commands: >
  --highlight
---

# Document`;

      // CLI says highlight: false
      const cliOptions = { highlight: false };

      // Phase 1
      const context = await buildProcessingContext(content, cliOptions, __dirname);

      // ASSERTION: Force-commands should override CLI
      expect(context.options.highlight).toBe(true);
    });
  });

  describe('PDF HIGHLIGHT with Force-Commands', () => {
    it('should generate correct PDF HIGHLIGHT when force-commands enables it', async () => {
      const content = `---
force_commands: >
  --pdf --highlight
field1: "value1"
---

# Contract

Field: {{field1}}
Missing: {{field2}}`;

      // Spy to verify no reprocessing
      const generateHtmlSpy = vi.spyOn(HtmlGeneratorModule.HtmlGenerator.prototype, 'generateHtml');
      const generatePdfFromHtmlSpy = vi.spyOn(
        PdfGeneratorModule.PdfGenerator.prototype,
        'generatePdfFromHtml'
      );

      // Phase 1
      const context = await buildProcessingContext(content, {}, __dirname);
      expect(context.options.highlight).toBe(true);
      expect(context.options.pdf).toBe(true);

      // Phase 2
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata,
      });

      // Phase 3
      await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'contract',
        pdf: context.options.pdf,
        html: false, // Only PDF
        highlight: context.options.highlight,
        highlightCssPath: path.join(__dirname, '../../src/styles/highlight.css'),
      });

      // ASSERTION: Should generate HTML twice (normal + highlight) for PDF
      expect(generateHtmlSpy).toHaveBeenCalledTimes(2);

      // ASSERTION: Should use generatePdfFromHtml (no reprocessing)
      expect(generatePdfFromHtmlSpy).toHaveBeenCalledTimes(2);

      // ASSERTION: Both HTML calls should receive the SAME markdown (no reprocessing)
      const call1 = generateHtmlSpy.mock.calls[0];
      const call2 = generateHtmlSpy.mock.calls[1];
      expect(call1[0]).toBe(processedResult.content);
      expect(call2[0]).toBe(processedResult.content);

      // ASSERTION: Second call should have includeHighlighting: true
      expect(call2[1]).toMatchObject({ includeHighlighting: true });

      generateHtmlSpy.mockRestore();
      generatePdfFromHtmlSpy.mockRestore();
    });

    it('should include highlightCssPath in HTML generation for PDF', async () => {
      const content = `---
force_commands: >
  --pdf --highlight
---

# Test`;

      const generateHtmlSpy = vi.spyOn(HtmlGeneratorModule.HtmlGenerator.prototype, 'generateHtml');

      const highlightCssPath = path.join(__dirname, '../../src/styles/highlight.css');

      // Full pipeline
      const context = await buildProcessingContext(content, {}, __dirname);
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf,
        html: false,
        highlight: context.options.highlight,
        highlightCssPath,
      });

      // ASSERTION: The highlight version should receive highlightCssPath
      const highlightCall = generateHtmlSpy.mock.calls.find(
        call => call[1]?.includeHighlighting === true
      );

      expect(highlightCall).toBeDefined();
      expect(highlightCall![1]).toMatchObject({
        includeHighlighting: true,
        highlightCssPath,
      });

      generateHtmlSpy.mockRestore();
    });
  });

  describe('No Reprocessing with Force-Commands', () => {
    it('should process markdown exactly once regardless of force-commands', async () => {
      const content = `---
force_commands: >
  --pdf --html --highlight
---

# Document

{{field}}`;

      const processLegalMarkdownSpy = vi.spyOn(
        await import('../../src/extensions/remark/legal-markdown-processor'),
        'processLegalMarkdownWithRemark'
      );

      // Phase 1
      const context = await buildProcessingContext(content, {}, __dirname);

      // Phase 2 - Called ONCE
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: { field: 'value' },
      });

      // Phase 3 - Multiple outputs
      await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf,
        html: context.options.html,
        highlight: context.options.highlight,
        highlightCssPath: path.join(__dirname, '../../src/styles/highlight.css'),
      });

      // ASSERTION: Remark processor called exactly ONCE
      expect(processLegalMarkdownSpy).toHaveBeenCalledTimes(1);

      processLegalMarkdownSpy.mockRestore();
    });

    it('should generate HTML from same markdown source for both PDF variants', async () => {
      const content = `---
force_commands: >
  --pdf --highlight
---

# Test`;

      const generateHtmlSpy = vi.spyOn(HtmlGeneratorModule.HtmlGenerator.prototype, 'generateHtml');

      const context = await buildProcessingContext(content, {}, __dirname);
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf,
        html: false,
        highlight: context.options.highlight,
        highlightCssPath: path.join(__dirname, '../../src/styles/highlight.css'),
      });

      // ASSERTION: Both HTML generations use the exact same markdown
      expect(generateHtmlSpy).toHaveBeenCalledTimes(2);
      const markdown1 = generateHtmlSpy.mock.calls[0][0];
      const markdown2 = generateHtmlSpy.mock.calls[1][0];

      expect(markdown1).toBe(processedResult.content);
      expect(markdown2).toBe(processedResult.content);
      expect(markdown1).toBe(markdown2); // Same reference

      generateHtmlSpy.mockRestore();
    });
  });

  describe('CSS Path Resolution with Force-Commands', () => {
    it('should respect custom CSS from force-commands', async () => {
      const content = `---
force_commands: >
  --css custom.css --pdf
---

# Test`;

      const context = await buildProcessingContext(content, {}, __dirname);

      // ASSERTION: CSS path should be set from force-commands
      expect(context.options.cssPath).toBeDefined();
      expect(context.options.cssPath).toContain('custom.css');
    });

    it('should use highlightCssPath for PDF HIGHLIGHT regardless of custom CSS', async () => {
      const content = `---
force_commands: >
  --css custom.css --pdf --highlight
---

# Test`;

      const generateHtmlSpy = vi.spyOn(HtmlGeneratorModule.HtmlGenerator.prototype, 'generateHtml');

      const customCssPath = '/path/to/custom.css';
      const highlightCssPath = path.join(__dirname, '../../src/styles/highlight.css');

      const context = await buildProcessingContext(content, {}, __dirname);
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf,
        html: false,
        highlight: context.options.highlight,
        cssPath: customCssPath,
        highlightCssPath,
      });

      // ASSERTION: Normal version uses custom CSS
      const normalCall = generateHtmlSpy.mock.calls[0];
      expect(normalCall[1]).toMatchObject({
        cssPath: customCssPath,
        includeHighlighting: false,
      });

      // ASSERTION: Highlight version uses both custom CSS AND highlightCssPath
      const highlightCall = generateHtmlSpy.mock.calls[1];
      expect(highlightCall[1]).toMatchObject({
        cssPath: customCssPath,
        highlightCssPath,
        includeHighlighting: true,
      });

      generateHtmlSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle force-commands with no options gracefully', async () => {
      const content = `---
force_commands: ""
---

# Test`;

      const context = await buildProcessingContext(content, {}, __dirname);
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      const result = await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: false,
        html: true,
        highlight: false,
      });

      // Should work without errors
      expect(result.generatedFiles.length).toBeGreaterThan(0);
    });

    it('should handle missing force_commands field', async () => {
      const content = `---
title: "Test"
---

# Test`;

      const context = await buildProcessingContext(content, { pdf: true }, __dirname);
      const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

      const result = await generateAllFormats(processedResult, {
        outputDir,
        baseFilename: 'test',
        pdf: context.options.pdf,
        html: false,
        highlight: false,
      });

      // CLI options should work normally
      expect(result.results.pdf?.normal).toBeDefined();
    });

    it('should handle conflicting force-commands and CLI options correctly', async () => {
      const content = `---
force_commands: >
  --highlight
---

# Test`;

      // CLI explicitly disables highlight
      const cliOptions = { highlight: false, pdf: true };

      const context = await buildProcessingContext(content, cliOptions, __dirname);

      // ASSERTION: Force-commands should win
      expect(context.options.highlight).toBe(true);
      expect(context.options.pdf).toBe(true); // CLI option preserved
    });
  });
});
