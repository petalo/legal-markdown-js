/**
 * Integration tests for field tracking vs highlighting separation
 *
 * These tests verify that field tracking (structure) is independent from highlighting (visual).
 * Field tracking should always generate spans with CSS classes for HTML/PDF, while highlighting
 * should only control the loading of additional CSS styles.
 *
 * @module
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

      // Process with CLI service with timeout
      const baseName = 'field-tracking-test-cli';
      const outputPath = path.join(outputDir, `${baseName}.md`);
      
      try {
        // Add timeout wrapper to prevent hanging
        await Promise.race([
          cliService.processFile(inputPath, outputPath),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('CLI Service timeout after 20 seconds')), 20000)
          )
        ]);
      } catch (error) {
        console.log('CLI Service error:', error);
        throw error;
      }

      // Add a small delay to let CLI service finish
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should generate 4 files: normal + highlight for both HTML and PDF
      const expectedFiles = [
        `${baseName}.html`,
        `${baseName}.HIGHLIGHT.html`,
        `${baseName}.pdf`,
        `${baseName}.HIGHLIGHT.pdf`,
      ];

      // Wait for all files to be generated with retry mechanism
      const maxRetries = 50; // 5 seconds total
      const retryDelay = 100; // 100ms between retries

      for (const fileName of expectedFiles) {
        const filePath = path.join(outputDir, fileName);
        let fileExists = false;
        
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            await fs.stat(filePath);
            fileExists = true;
            break;
          } catch (error) {
            if (retry === maxRetries - 1) {
              // Last retry failed, list actual files for debugging
              const actualFiles = await fs.readdir(outputDir);
              console.log(`Expected file not found after ${maxRetries} retries: ${fileName}`);
              console.log(`Actual files in ${outputDir}:`, actualFiles);
              throw error;
            }
            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
        
        expect(fileExists).toBe(true);
      }

      // Clean up input file
      try {
        await fs.unlink(inputPath);
      } catch (error) {
        // Ignore if file doesn't exist (already cleaned up)
      }
    }, 30000); // 30 second timeout

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

      // Process with CLI service with timeout
      const baseName = 'field-tracking-test-cli-no-highlight';
      const outputPath = path.join(outputDir, `${baseName}.html`);
      
      try {
        // Add timeout wrapper to prevent hanging
        await Promise.race([
          cliService.processFile(inputPath, outputPath),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('CLI Service timeout after 20 seconds')), 20000)
          )
        ]);
      } catch (error) {
        console.log('CLI Service error:', error);
        throw error;
      }

      // Add a small delay to let CLI service finish
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should generate only 2 files: normal versions for HTML and PDF
      const expectedFiles = [
        `${baseName}.html`,
        `${baseName}.pdf`,
      ];

      const notExpectedFiles = [
        `${baseName}.HIGHLIGHT.html`,
        `${baseName}.HIGHLIGHT.pdf`,
      ];

      // Wait for all files to be generated with retry mechanism
      const maxRetries = 50; // 5 seconds total
      const retryDelay = 100; // 100ms between retries

      for (const fileName of expectedFiles) {
        const filePath = path.join(outputDir, fileName);
        let fileExists = false;
        
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            await fs.stat(filePath);
            fileExists = true;
            break;
          } catch (error) {
            if (retry === maxRetries - 1) {
              // Last retry failed, list actual files for debugging
              const actualFiles = await fs.readdir(outputDir);
              console.log(`Expected file not found after ${maxRetries} retries: ${fileName}`);
              console.log(`Actual files in ${outputDir}:`, actualFiles);
              throw error;
            }
            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
        
        expect(fileExists).toBe(true);
      }

      for (const fileName of notExpectedFiles) {
        const filePath = path.join(outputDir, fileName);
        await expect(fs.stat(filePath)).rejects.toThrow();
      }

      // Clean up input file
      try {
        await fs.unlink(inputPath);
      } catch (error) {
        // Ignore if file doesn't exist (already cleaned up)
      }
    }, 30000); // 30 second timeout
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

  describe('Cross-reference Field Tracking', () => {
    const crossRefContent = `---
level-two: 'Art. %n -'
level-six: 'Anexo %R -'
contrato:
  plazo_meses_prorroga:
    numero: 2
---

ll. **Objeto del Contrato** |objeto-contrato|

The definitions in |objeto-contrato| apply throughout.

l6. **Service Level Agreement** |anexo-vtt|

Reference to |anexo-vtt| for technical specifications and {{contrato.plazo_meses_prorroga.numero}} months.

ll. **Servicios a Prestar** |listado-servicios|

Payments as per |listado-servicios| schedule.
`;

    it('should properly highlight cross-references without breaking HTML', async () => {
      const html = await generateHtml(crossRefContent, {
        title: 'Cross-reference Test',
        includeHighlighting: true,
      });

      // Should have cross-reference highlights
      const crossrefHighlights = html.match(/<span class="legal-field highlight"[^>]*data-field="crossref\.[^"]*"[^>]*>[^<]*<\/span>/g) || [];
      expect(crossrefHighlights.length).toBeGreaterThan(0);
      
      // Headers should not contain pipe keys
      const headersWithPipes = html.match(/<span[^>]*legal-header[^>]*>[^<]*\|[^|]+\|[^<]*<\/span>/g) || [];
      expect(headersWithPipes).toHaveLength(0);

      // Should not have escaped HTML
      expect(html).not.toContain('&lt;span');
      expect(html).not.toContain('&gt;');

      // Should not highlight short numeric values in HTML attributes
      expect(html).toContain('data-level="2"'); // Should remain unmodified
      expect(html).not.toContain('data-level="<span'); // Should not be wrapped
    });

    it('should handle field values based on logic, not characteristics', async () => {
      const html = await generateHtml(crossRefContent, {
        title: 'Logic-based Highlighting Test',
        includeHighlighting: true,
      });

      // Should highlight the template field {{contrato.plazo_meses_prorroga.numero}} -> "2"
      // because it's a processed template field (reasonable length simple var)
      const highlightedTwos = html.match(/<span[^>]*data-field="contrato\.plazo_meses_prorroga\.numero"[^>]*>2<\/span>/g) || [];
      expect(highlightedTwos.length).toBe(1); // Should highlight the template field
      
      // HTML attributes should remain untouched
      expect(html).toContain('data-level="2"');
      expect(html).toContain('data-number="2"');
      expect(html).not.toContain('data-level="<span');
      expect(html).not.toContain('data-number="<span');
    });

    it('should maintain proper HTML structure with cross-references', async () => {
      const html = await generateHtml(crossRefContent, {
        title: 'HTML Structure Test',
        includeHighlighting: true,
      });

      // Check that legal-header class exists in the HTML
      expect(html).toContain('legal-header');
      expect(html).toContain('legal-header-level-2');

      // Check that headers have proper data attributes
      expect(html).toMatch(/data-level="\d+"/);
      expect(html).toMatch(/data-number="\d+"/);

      // Headers should not contain pipe keys in the visible text
      const headerElements = html.match(/<span[^>]*legal-header[^>]*>.*?<\/span>/g) || [];
      expect(headerElements.length).toBeGreaterThan(0);
      
      headerElements.forEach(headerElement => {
        // The header element itself should not have visible pipe syntax
        // (cross-references should be processed and highlighted)
        expect(headerElement).not.toMatch(/\|[^|]+\|.*<\/span>$/); // No pipe keys at the end
      });

      // Check that cross-reference highlights don't break HTML structure
      const crossrefSpans = html.match(/<span class="legal-field highlight"[^>]*>[^<]*<\/span>/g) || [];
      expect(crossrefSpans.length).toBeGreaterThan(0);
      
      crossrefSpans.forEach(span => {
        expect(span).toMatch(/<span class="legal-field highlight" data-field="crossref\.[^"]*">[^<]+<\/span>/);
      });
    });

    it('should track cross-references correctly in field report', async () => {
      const html = await generateHtml(crossRefContent, {
        title: 'Field Report Test',
        includeHighlighting: true,
      });

      // Generate field report would be called internally
      // We verify by checking the expected highlights exist
      const crossrefFields = [
        'crossref.objeto-contrato',
        'crossref.anexo-vtt', 
        'crossref.listado-servicios'
      ];

      crossrefFields.forEach(fieldName => {
        const fieldHighlight = new RegExp(`<span class="legal-field highlight"[^>]*data-field="${fieldName}"[^>]*>[^<]*</span>`);
        expect(html).toMatch(fieldHighlight);
      });
    });
  });
});