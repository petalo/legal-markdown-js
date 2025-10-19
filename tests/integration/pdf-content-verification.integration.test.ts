/**
 * Integration tests for PDF content verification
 *
 * These tests verify that generated PDFs contain the correct content,
 * not just that the files were created. This catches bugs like the
 * format-generator double-conversion issue where HTML was passed to
 * generatePdf instead of Markdown.
 *
 * TODO: Install pdf-parse dependency to enable these tests:
 *   npm install --save-dev pdf-parse @types/pdf-parse
 *
 * Related issues:
 * - Bug where format-generator.ts passed HTML to generatePdf
 * - Pipeline 3-phase tests only checked file existence, not content
 *
 * @module
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { buildProcessingContext, generateAllFormats } from '../../src/core/pipeline';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';

// TODO: Uncomment when pdf-parse is installed
// import pdfParse from 'pdf-parse';

/**
 * Helper to extract text from PDF buffer
 *
 * TODO: Implement using pdf-parse library
 *
 * @param pdfBuffer - The PDF file buffer
 * @returns Promise resolving to extracted text content
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // TODO: Uncomment when pdf-parse is installed
  // const data = await pdfParse(pdfBuffer);
  // return data.text;

  throw new Error('pdf-parse not installed. Run: npm install --save-dev pdf-parse');
}

describe.skip('PDF Content Verification', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pdf-content-test-'));
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Content Accuracy', () => {
    it('should generate PDF with correct legal header numbering', async () => {
      const content = `---
title: Test Agreement
level-one: 'Article %n.'
level-two: 'Section %n.%s'
---

l. **First Article**

This is the first article.

ll. First Section

Content here.

ll. Second Section

More content.

l. **Second Article**

Final content.`;

      // PHASE 1: Build context
      const context = await buildProcessingContext(content, {}, testDir);

      // PHASE 2: Process content
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata,
        noIndent: true,
      });

      // PHASE 3: Generate PDF
      const formatResult = await generateAllFormats(processedResult, {
        outputDir: testDir,
        baseFilename: 'test-headers',
        pdf: true,
        html: false,
        markdown: false,
      });

      // Read and verify PDF content
      const pdfBuffer = readFileSync(formatResult.results.pdf!.normal);
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // Verify header numbering
      expect(pdfText).toContain('Article 1.');
      expect(pdfText).toContain('Article 2.');
      expect(pdfText).toContain('Section 1.');
      expect(pdfText).toContain('Section 2.');
    });

    it('should NOT contain HTML tags in PDF text', async () => {
      const content = `---
title: Test Document
---

# Simple Document

This is **bold** and this is *italic*.

- List item 1
- List item 2`;

      const context = await buildProcessingContext(content, {}, testDir);
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata,
        noIndent: true,
      });

      const formatResult = await generateAllFormats(processedResult, {
        outputDir: testDir,
        baseFilename: 'test-no-html',
        pdf: true,
      });

      const pdfBuffer = readFileSync(formatResult.results.pdf!.normal);
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // PDF text should NOT contain HTML tags
      expect(pdfText).not.toContain('<html>');
      expect(pdfText).not.toContain('<body>');
      expect(pdfText).not.toContain('<h1>');
      expect(pdfText).not.toContain('<p>');
      expect(pdfText).not.toContain('<strong>');
      expect(pdfText).not.toContain('<em>');
      expect(pdfText).not.toContain('<ul>');
      expect(pdfText).not.toContain('<li>');

      // Should NOT contain escaped HTML
      expect(pdfText).not.toContain('&lt;');
      expect(pdfText).not.toContain('&gt;');
      expect(pdfText).not.toContain('&amp;');

      // Should contain actual text content
      expect(pdfText).toContain('Simple Document');
      expect(pdfText).toContain('bold');
      expect(pdfText).toContain('italic');
    });

    it('should preserve template field values in PDF', async () => {
      const content = `---
party_a: Alice Corporation
party_b: Bob LLC
amount: $10,000.00
---

# Agreement

This agreement is between {{party_a}} and {{party_b}}.

The total amount is {{amount}}.`;

      const context = await buildProcessingContext(content, {}, testDir);
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata,
        noIndent: true,
      });

      const formatResult = await generateAllFormats(processedResult, {
        outputDir: testDir,
        baseFilename: 'test-fields',
        pdf: true,
      });

      const pdfBuffer = readFileSync(formatResult.results.pdf!.normal);
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // Verify template fields were expanded
      expect(pdfText).toContain('Alice Corporation');
      expect(pdfText).toContain('Bob LLC');
      expect(pdfText).toContain('$10,000.00');

      // Should NOT contain template syntax
      expect(pdfText).not.toContain('{{party_a}}');
      expect(pdfText).not.toContain('{{party_b}}');
      expect(pdfText).not.toContain('{{amount}}');
    });
  });

  describe('Comparison: PDF vs HTML Content', () => {
    it('should have same textual content in PDF and HTML outputs', async () => {
      const content = `---
title: Comparison Test
---

# Document Title

First paragraph with important content.

l. First Header

Content under first header.

ll. Subheader

Nested content.`;

      const context = await buildProcessingContext(content, {}, testDir);
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        additionalMetadata: context.metadata,
        noIndent: true,
      });

      const formatResult = await generateAllFormats(processedResult, {
        outputDir: testDir,
        baseFilename: 'test-comparison',
        pdf: true,
        html: true,
      });

      // Extract PDF text
      const pdfBuffer = readFileSync(formatResult.results.pdf!.normal);
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // Read HTML and extract text (simple approach - strip tags)
      const htmlContent = readFileSync(formatResult.results.html!.normal, 'utf-8');
      const htmlText = htmlContent
        .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Both should contain the same key content
      const keyPhrases = [
        'Document Title',
        'First paragraph',
        'important content',
        'First Header',
        'Subheader',
        'Nested content',
      ];

      for (const phrase of keyPhrases) {
        expect(pdfText).toContain(phrase);
        expect(htmlText).toContain(phrase);
      }
    });
  });

  describe('Regression Tests', () => {
    it('should detect double-conversion bug (HTML passed to generatePdf)', async () => {
      // This test would have caught the format-generator.ts bug where
      // HTML was generated first and then passed to generatePdf

      const content = `---
---

# Test

**Bold text** and *italic text*.`;

      const context = await buildProcessingContext(content, {}, testDir);
      const processedResult = await processLegalMarkdownWithRemark(context.content, {
        ...context.options,
        noIndent: true,
      });

      const formatResult = await generateAllFormats(processedResult, {
        outputDir: testDir,
        baseFilename: 'test-regression',
        pdf: true,
      });

      const pdfBuffer = readFileSync(formatResult.results.pdf!.normal);
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // If HTML was wrongly passed to generatePdf, we'd see HTML tags or escaped tags
      expect(pdfText).not.toContain('<strong>');
      expect(pdfText).not.toContain('&lt;strong&gt;');
      expect(pdfText).not.toContain('&lt;em&gt;');

      // Should contain the actual formatted text
      expect(pdfText).toContain('Bold text');
      expect(pdfText).toContain('italic text');
    });
  });
});
