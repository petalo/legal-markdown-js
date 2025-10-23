/**
 * Integration test to verify 3-phase pipeline doesn't reprocess content
 *
 * This test ensures that the pipeline honors its "process once, output many" promise:
 * - Phase 2 should process markdown ONCE
 * - Phase 3 should generate HTML ONCE per variant (normal/highlight)
 * - Phase 3 should NEVER call generatePdf(markdown) which would reprocess
 *
 * @module tests/integration/no-reprocessing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildProcessingContext, processLegalMarkdownWithRemark, generateAllFormats } from '../../src/core/pipeline';
import * as HtmlGeneratorModule from '../../src/extensions/generators/html-generator';
import * as PdfGeneratorModule from '../../src/extensions/generators/pdf-generator';
import * as path from 'path';
import * as fs from 'fs';

// Use sequential execution to avoid Puppeteer race conditions (Issue #144)
describe.sequential('3-Phase Pipeline: No Reprocessing', () => {
  const outputDir = path.join(__dirname, '../output/no-reprocessing');

  beforeEach(async () => {
    // Ensure output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('should generate HTML exactly once per variant (reuse for PDF)', async () => {
    const content = `# Test Document

This is a test with {{field1}} and {{field2}}.`;

    const metadata = {
      field1: 'value1',
      field2: 'value2',
    };

    // Spy on HtmlGenerator.generateHtml
    const generateHtmlSpy = vi.spyOn(HtmlGeneratorModule.HtmlGenerator.prototype, 'generateHtml');

    // Phase 1: Build context
    const context = await buildProcessingContext(content, {}, __dirname);

    // Phase 2: Process ONCE
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: metadata,
    });

    // Phase 3: Generate all formats (HTML + PDF, both with normal + highlight)
    await generateAllFormats(processedResult, {
      outputDir,
      baseFilename: 'test',
      html: true,
      pdf: true,
      highlight: true,
    });

    // ASSERTION: HTML should be generated ONLY 2 times:
    // - 1 for normal HTML file (reused for normal PDF)
    // - 1 for highlight HTML file (reused for highlight PDF)
    // This is the IDEAL pipeline: process once, generate HTML once per variant, reuse for PDF
    expect(generateHtmlSpy).toHaveBeenCalledTimes(2);

    // Verify ALL calls used the SAME processed content (no markdown reprocessing)
    generateHtmlSpy.mock.calls.forEach(call => {
      expect(call[0]).toBe(processedResult.content);
    });

    generateHtmlSpy.mockRestore();
  });

  it('should use generatePdfFromHtml() not generatePdf() to avoid reprocessing', async () => {
    const content = `# Test Document

Content here.`;

    // Spy on both PDF generation methods
    const generatePdfSpy = vi.spyOn(PdfGeneratorModule.PdfGenerator.prototype, 'generatePdf');
    const generatePdfFromHtmlSpy = vi.spyOn(PdfGeneratorModule.PdfGenerator.prototype, 'generatePdfFromHtml');

    // Phase 1 & 2
    const context = await buildProcessingContext(content, {}, __dirname);
    const processedResult = await processLegalMarkdownWithRemark(context.content, context.options);

    // Phase 3
    await generateAllFormats(processedResult, {
      outputDir,
      baseFilename: 'test',
      pdf: true,
      highlight: false,
    });

    // ASSERTION: Should call generatePdfFromHtml, NOT generatePdf
    expect(generatePdfFromHtmlSpy).toHaveBeenCalledTimes(1);
    expect(generatePdfSpy).not.toHaveBeenCalled();

    // Verify it received HTML string, not markdown
    const pdfFromHtmlCall = generatePdfFromHtmlSpy.mock.calls[0];
    const htmlContent = pdfFromHtmlCall[0];

    // HTML should contain DOCTYPE and html tags
    expect(htmlContent).toContain('<!DOCTYPE');
    expect(htmlContent).toContain('<html');

    generatePdfSpy.mockRestore();
    generatePdfFromHtmlSpy.mockRestore();
  });

  it('should process markdown exactly once regardless of output formats', async () => {
    const content = `# Test

l. Header One
ll. Header Two

{{field}}`;

    const metadata = { field: 'test value' };

    // Spy on the remark processor
    const processLegalMarkdownSpy = vi.spyOn(
      await import('../../src/extensions/remark/legal-markdown-processor'),
      'processLegalMarkdownWithRemark'
    );

    // Phase 1
    const context = await buildProcessingContext(content, {}, __dirname);

    // Phase 2 - Called ONCE
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: metadata,
    });

    // Phase 3 - Multiple outputs
    await generateAllFormats(processedResult, {
      outputDir,
      baseFilename: 'test',
      html: true,
      pdf: true,
      markdown: true,
      highlight: true,
    });

    // ASSERTION: Remark processor should be called exactly ONCE
    // (The spy sees the call we made above, so expect 1 total)
    expect(processLegalMarkdownSpy).toHaveBeenCalledTimes(1);

    processLegalMarkdownSpy.mockRestore();
  });

  it('should reuse the same AST for all format generations', async () => {
    const content = `# Document

l. Section One
ll. Subsection

Content with {{var}}.`;

    const metadata = { var: 'value' };

    // Phase 1 & 2
    const context = await buildProcessingContext(content, {}, __dirname);
    const processedResult = await processLegalMarkdownWithRemark(context.content, {
      ...context.options,
      additionalMetadata: metadata,
    });

    // Capture the AST reference
    const originalAst = processedResult.ast;

    // Phase 3
    const result = await generateAllFormats(processedResult, {
      outputDir,
      baseFilename: 'test',
      html: true,
      pdf: true,
      markdown: true,
    });

    // ASSERTION: AST should remain unchanged (same reference)
    expect(processedResult.ast).toBe(originalAst);

    // ASSERTION: All outputs should be generated
    expect(result.generatedFiles.length).toBeGreaterThan(0);
  });
});
