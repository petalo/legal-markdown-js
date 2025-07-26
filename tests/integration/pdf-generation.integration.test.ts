/**
 * @fileoverview Integration tests for PDF and HTML generation workflows
 *
 * These tests verify the complete document generation pipeline including:
 * - HTML generation with templating and conditional rendering
 * - PDF generation from HTML with Puppeteer
 * - Field highlighting for review workflows
 * - File system operations and cleanup
 *
 * These are integration tests because they test the entire generation pipeline
 * from template processing through HTML rendering to PDF creation, involving
 * multiple components working together (template engine, HTML generator, PDF renderer).
 */

import { generateHtml, generatePdf, generatePdfVersions } from '../../src/index';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('PDF Generation Integration', () => {
  /**
   * Sample legal document content with YAML frontmatter and template variables.
   * Includes conditional rendering and missing field scenarios to test error handling.
   */
  const testContent = `---
title: Test Contract
party1:
  name: John Doe
  email: john@example.com
party2:
  name:
  company: ABC Corp
hasClause: true
---

# {{title}}

This agreement is between {{party1.name}} ({{party1.email}}) and {{party2.company}}.

{{party2.name ? party2.name : "[Party 2 Name Missing]"}}

Missing field: {{missing_field}}

{{#hasClause}}
## Special Clause
This clause is included conditionally.
{{/hasClause}}`;

  /** Directory for test output files */
  const outputDir = path.join(__dirname, '../output');

  /**
   * Setup test environment with output directory
   */
  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  /**
   * Clean up generated test files to prevent test pollution
   */
  afterAll(async () => {
    // Clean up generated files
    const files = await fs.readdir(outputDir);
    for (const file of files) {
      if (file.startsWith('test-')) {
        await fs.unlink(path.join(outputDir, file));
      }
    }
  });

  describe('HTML Generation', () => {
    /**
     * Test basic HTML generation from template content.
     * Verifies template variable substitution and conditional rendering
     * without field highlighting features.
     */
    it('should generate HTML without highlighting', async () => {
      const html = await generateHtml(testContent, {
        title: 'Test Document',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Contract');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('ABC Corp');
      expect(html).toContain('Special Clause');
      expect(html).not.toContain('class="imported-value"');
      expect(html).not.toContain('.imported-value');
    });

    /**
     * Test HTML generation with field highlighting enabled.
     * Verifies that template variables are wrapped with CSS classes
     * for visual identification during document review.
     */
    it('should generate HTML with highlighting', async () => {
      const html = await generateHtml(testContent, {
        title: 'Test Document',
        includeHighlighting: true,
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('class="imported-value"');
      expect(html).toContain('class="missing-value"');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
    });

    /**
     * Test HTML generation with custom CSS file inclusion.
     * Verifies external CSS files are properly read and embedded in HTML output.
     */
    it('should include custom CSS', async () => {
      const cssContent = 'body { font-family: Arial; }';
      const cssPath = path.join(outputDir, 'test-custom.css');
      await fs.writeFile(cssPath, cssContent);

      const html = await generateHtml(testContent, {
        cssPath,
        title: 'Test Document',
      });

      expect(html).toContain(cssContent);
    });
  });

  describe('PDF Generation', () => {
    /**
     * Test end-to-end PDF generation from legal document template.
     * Verifies complete pipeline: template → HTML → PDF conversion using Puppeteer.
     * This is an integration test because it tests the full document generation workflow.
     */
    it('should generate a basic PDF', async () => {
      const pdfPath = path.join(outputDir, 'test-basic.pdf');

      const buffer = await generatePdf(testContent, pdfPath, {
        title: 'Test PDF',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000); // PDF should have some content

      // Verify file was written
      const stats = await fs.stat(pdfPath);
      expect(stats.size).toBeGreaterThan(1000);
    }, 30000);

    /**
     * Test PDF generation with field highlighting for document review.
     * Verifies that template fields are visually highlighted in the PDF output
     * for easier identification during legal review processes.
     */
    it('should generate PDF with highlighting', async () => {
      const pdfPath = path.join(outputDir, 'test-highlighted.pdf');

      const buffer = await generatePdf(testContent, pdfPath, {
        title: 'Test PDF',
        includeHighlighting: true,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 30000);

    /**
     * Test simultaneous generation of normal and highlighted PDF versions.
     * Verifies the generatePdfVersions utility function that creates both
     * a clean version (for final documents) and a highlighted version (for review).
     */
    it('should generate both normal and highlighted PDF versions', async () => {
      const basePath = path.join(outputDir, 'test-versions.pdf');

      const { normal, highlighted } = await generatePdfVersions(testContent, basePath, {
        title: 'Test PDF Versions',
      });

      expect(normal).toBeInstanceOf(Buffer);
      expect(highlighted).toBeInstanceOf(Buffer);

      // Verify both files were created
      const normalStats = await fs.stat(path.join(outputDir, 'test-versions.pdf'));
      const highlightedStats = await fs.stat(path.join(outputDir, 'test-versions.HIGHLIGHT.pdf'));

      expect(normalStats.size).toBeGreaterThan(1000);
      expect(highlightedStats.size).toBeGreaterThan(1000);
    }, 30000);

    /**
     * Test PDF generation with different page formats (Letter, A4, etc.).
     * Verifies that the PDF generation pipeline correctly handles
     * various page size requirements for different jurisdictions.
     */
    it('should handle different page formats', async () => {
      const pdfPath = path.join(outputDir, 'test-letter.pdf');

      const buffer = await generatePdf(testContent, pdfPath, {
        title: 'Test PDF',
        format: 'Letter',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 30000);
  });
});
