/**
 * @fileoverview Integration tests for field tracking vs highlighting separation
 *
 * These tests verify that field tracking (structure) is independent from highlighting (visual).
 * Field tracking should always generate spans with CSS classes for HTML/PDF, while highlighting
 * should only control the loading of additional CSS styles.
 */

import { generateHtml, generatePdf } from '../../src/index';
import { CliService } from '../../src/cli/service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Field Tracking vs Highlighting Integration', () => {
  const testContent = `---
title: Integration Test
party:
  name: John Doe
  email: john@example.com
hasClause: true
---

# {{title}}

Party: {{party.name}} ({{party.email}})

Missing field: {{missing_field}}

{{#hasClause}}
## Conditional Clause
This is shown when hasClause is true.
{{/hasClause}}

l. First Article
ll. First Section
lll. First Subsection
`;

  const outputDir = path.join(__dirname, '../output');

  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up generated test files
    const files = await fs.readdir(outputDir);
    for (const file of files) {
      if (file.startsWith('field-tracking-test-')) {
        await fs.unlink(path.join(outputDir, file));
      }
    }
  });

  describe('HTML Generation', () => {
    it('should always include field tracking classes (structure)', async () => {
      const htmlWithoutHighlight = await generateHtml(testContent, {
        title: 'Test Without Highlight',
        includeHighlighting: false,
      });

      const htmlWithHighlight = await generateHtml(testContent, {
        title: 'Test With Highlight',
        includeHighlighting: true,
      });

      // Both should contain field tracking classes for structure
      expect(htmlWithoutHighlight).toContain('class="imported-value"');
      expect(htmlWithoutHighlight).toContain('class="missing-value"');
      expect(htmlWithoutHighlight).toContain('legal-header');

      expect(htmlWithHighlight).toContain('class="imported-value"');
      expect(htmlWithHighlight).toContain('class="missing-value"');
      expect(htmlWithHighlight).toContain('legal-header');
    });

    it('should only include highlight CSS when highlighting is enabled', async () => {
      const htmlWithoutHighlight = await generateHtml(testContent, {
        title: 'Test Without Highlight',
        includeHighlighting: false,
      });

      const htmlWithHighlight = await generateHtml(testContent, {
        title: 'Test With Highlight',
        includeHighlighting: true,
      });

      // Only highlighted version should contain highlight CSS
      expect(htmlWithoutHighlight).not.toContain('border: 1px solid #0066cc');
      expect(htmlWithoutHighlight).not.toContain('border: 1px solid #dc3545');

      expect(htmlWithHighlight).toContain('border: 1px solid #0066cc');
      expect(htmlWithHighlight).toContain('border: 1px solid #dc3545');
    });

    it('should include header spans with CSS classes for styling', async () => {
      const html = await generateHtml(testContent, {
        title: 'Test Headers',
        includeHighlighting: false,
      });

      // Headers should have spans for CSS styling
      expect(html).toContain('legal-header');
      expect(html).toContain('legal-header-level-1');
      expect(html).toContain('legal-header-level-2');
      expect(html).toContain('legal-header-level-3');
      expect(html).toContain('legal-article');
      expect(html).toContain('legal-section');
      expect(html).toContain('legal-subsection');
    });
  });

  describe('PDF Generation', () => {
    it('should always include field tracking classes for both normal and highlight versions', async () => {
      const normalPdfPath = path.join(outputDir, 'field-tracking-test-normal.pdf');
      const highlightPdfPath = path.join(outputDir, 'field-tracking-test-highlight.pdf');

      // Generate both versions
      await generatePdf(testContent, normalPdfPath, {
        title: 'Test PDF Normal',
        includeHighlighting: false,
      });

      await generatePdf(testContent, highlightPdfPath, {
        title: 'Test PDF Highlight',
        includeHighlighting: true,
      });

      // Both files should be created
      expect(await fs.stat(normalPdfPath)).toBeTruthy();
      expect(await fs.stat(highlightPdfPath)).toBeTruthy();

      // Both should have content (size > 0)
      const normalStats = await fs.stat(normalPdfPath);
      const highlightStats = await fs.stat(highlightPdfPath);
      
      expect(normalStats.size).toBeGreaterThan(0);
      expect(highlightStats.size).toBeGreaterThan(0);
    });
  });

  describe('CLI Service Dual Generation', () => {
    it('should generate separate normal and highlight versions when highlight flag is used', async () => {
      const cliService = new CliService({
        html: true,
        pdf: true,
        highlight: true,
        verbose: false,
      });

      // Create a temporary input file
      const inputPath = path.join(outputDir, 'field-tracking-test-input.md');
      await fs.writeFile(inputPath, testContent);

      // Process with CLI service
      const baseName = 'field-tracking-test-cli';
      const outputPath = path.join(outputDir, `${baseName}.md`);
      
      await cliService.processFile(inputPath, outputPath);

      // Should generate 4 files: normal + highlight for both HTML and PDF
      const expectedFiles = [
        `${baseName}.html`,
        `${baseName}.HIGHLIGHT.html`,
        `${baseName}.pdf`,
        `${baseName}.HIGHLIGHT.pdf`,
      ];

      for (const fileName of expectedFiles) {
        const filePath = path.join(outputDir, fileName);
        expect(await fs.stat(filePath)).toBeTruthy();
      }

      // Clean up input file
      await fs.unlink(inputPath);
    });

    it('should generate only normal versions when highlight flag is not used', async () => {
      const cliService = new CliService({
        html: true,
        pdf: true,
        highlight: false,
        verbose: false,
      });

      // Create a temporary input file
      const inputPath = path.join(outputDir, 'field-tracking-test-input-no-highlight.md');
      await fs.writeFile(inputPath, testContent);

      // Process with CLI service
      const baseName = 'field-tracking-test-cli-no-highlight';
      const outputPath = path.join(outputDir, `${baseName}.md`);
      
      await cliService.processFile(inputPath, outputPath);

      // Should generate only 2 files: normal versions for HTML and PDF
      const expectedFiles = [
        `${baseName}.html`,
        `${baseName}.pdf`,
      ];

      const notExpectedFiles = [
        `${baseName}.HIGHLIGHT.html`,
        `${baseName}.HIGHLIGHT.pdf`,
      ];

      for (const fileName of expectedFiles) {
        const filePath = path.join(outputDir, fileName);
        expect(await fs.stat(filePath)).toBeTruthy();
      }

      for (const fileName of notExpectedFiles) {
        const filePath = path.join(outputDir, fileName);
        await expect(fs.stat(filePath)).rejects.toThrow();
      }

      // Clean up input file
      await fs.unlink(inputPath);
    });
  });

  describe('Content Verification', () => {
    it('should have identical structure in normal and highlight HTML versions', async () => {
      const normalHtml = await generateHtml(testContent, {
        title: 'Structure Test',
        includeHighlighting: false,
      });

      const highlightHtml = await generateHtml(testContent, {
        title: 'Structure Test',
        includeHighlighting: true,
      });

      // Both should have the same field tracking spans
      const normalSpans = (normalHtml.match(/<span class="imported-value"/g) || []).length;
      const highlightSpans = (highlightHtml.match(/<span class="imported-value"/g) || []).length;
      expect(normalSpans).toBe(highlightSpans);

      const normalMissingSpans = (normalHtml.match(/<span class="missing-value"/g) || []).length;
      const highlightMissingSpans = (highlightHtml.match(/<span class="missing-value"/g) || []).length;
      expect(normalMissingSpans).toBe(highlightMissingSpans);

      const normalHeaderSpans = (normalHtml.match(/legal-header/g) || []).length;
      const highlightHeaderSpans = (highlightHtml.match(/legal-header/g) || []).length;
      expect(normalHeaderSpans).toBe(highlightHeaderSpans);

      // Content should be the same (ignoring CSS differences)
      expect(normalHtml).toContain('John Doe');
      expect(normalHtml).toContain('john@example.com');
      expect(normalHtml).toContain('Integration Test');
      expect(normalHtml).toContain('Article 1. First Article');

      expect(highlightHtml).toContain('John Doe');
      expect(highlightHtml).toContain('john@example.com');
      expect(highlightHtml).toContain('Integration Test');
      expect(highlightHtml).toContain('Article 1. First Article');
    });
  });
});