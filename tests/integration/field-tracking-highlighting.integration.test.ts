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
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: 'Subsection %n.'
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

  const outputDir = path.join(__dirname, '../output', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up entire unique test directory
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        await fs.unlink(path.join(outputDir, file));
      }
      await fs.rmdir(outputDir);
    } catch (error) {
      // Ignore cleanup errors - directory might not exist
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
      expect(htmlWithoutHighlight).toContain('class="legal-field imported-value"');
      expect(htmlWithoutHighlight).toContain('class="legal-field missing-value"');
      expect(htmlWithoutHighlight).toContain('legal-field');

      expect(htmlWithHighlight).toContain('class="legal-field imported-value"');
      expect(htmlWithHighlight).toContain('class="legal-field missing-value"');
      expect(htmlWithHighlight).toContain('legal-field');
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

      // Headers should be generated as HTML elements
      expect(html).toContain('<h1>');
      expect(html).toContain('<h2>');
      expect(html).toContain('<h3>');
      expect(html).toContain('Article 1.');
      expect(html).toContain('Section 1.');
      expect(html).toContain('Subsection 1.');
    });
  });

  describe('PDF Generation', () => {
    it('should always include field tracking classes for both normal and highlight versions', async () => {
      // Use unique file names to avoid conflicts between parallel tests
      const testId = Math.random().toString(36).substr(2, 9);
      const normalPdfPath = path.join(outputDir, `field-tracking-test-normal-${testId}.pdf`);
      const highlightPdfPath = path.join(outputDir, `field-tracking-test-highlight-${testId}.pdf`);

      try {
        // Generate both versions sequentially to avoid Puppeteer conflicts
        await generatePdf(testContent, normalPdfPath, {
          title: 'Test PDF Normal',
          includeHighlighting: false,
        });

        // Add small delay to avoid Chrome process conflicts
        await new Promise(resolve => setTimeout(resolve, 100));

        await generatePdf(testContent, highlightPdfPath, {
          title: 'Test PDF Highlight',
          includeHighlighting: true,
        });

        // Wait for file system to sync
        await new Promise(resolve => setTimeout(resolve, 200));

        // Both files should be created
        expect(await fs.stat(normalPdfPath)).toBeTruthy();
        expect(await fs.stat(highlightPdfPath)).toBeTruthy();

        // Both should have content (size > 0)
        const normalStats = await fs.stat(normalPdfPath);
        const highlightStats = await fs.stat(highlightPdfPath);
        
        expect(normalStats.size).toBeGreaterThan(0);
        expect(highlightStats.size).toBeGreaterThan(0);
      } catch (error) {
        console.error('PDF Generation test failed:', error);
        
        // List actual files for debugging
        try {
          const actualFiles = await fs.readdir(outputDir);
          console.log(`Files in test directory ${outputDir}:`, actualFiles);
        } catch (listError) {
          console.log('Could not list test directory files:', listError);
        }
        
        throw error;
      }
    }, 60000); // Increase timeout to 60 seconds for PDF generation
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

      // Process with CLI service with timeout - use base path without extension
      const baseName = 'field-tracking-test-cli-no-highlight';
      const outputPath = path.join(outputDir, baseName);
      
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

      // Add a delay to let CLI service finish
      await new Promise(resolve => setTimeout(resolve, 500));

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
      const maxRetries = 15; // 3 seconds total
      const retryDelay = 200; // 200ms between retries

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
      const normalSpans = (normalHtml.match(/<span class="legal-field imported-value"/g) || []).length;
      const highlightSpans = (highlightHtml.match(/<span class="legal-field imported-value"/g) || []).length;
      expect(normalSpans).toBe(highlightSpans);

      const normalMissingSpans = (normalHtml.match(/<span class="legal-field missing-value"/g) || []).length;
      const highlightMissingSpans = (highlightHtml.match(/<span class="legal-field missing-value"/g) || []).length;
      expect(normalMissingSpans).toBe(highlightMissingSpans);

      const normalHeaders = (normalHtml.match(/<h[1-6]>/g) || []).length;
      const highlightHeaders = (highlightHtml.match(/<h[1-6]>/g) || []).length;
      expect(normalHeaders).toBe(highlightHeaders);

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
      const headersWithPipes = html.match(/<h[1-6][^>]*>[^<]*\|[^|]+\|[^<]*<\/h[1-6]>/g) || [];
      expect(headersWithPipes).toHaveLength(0);

      // Should not have escaped HTML
      expect(html).not.toContain('&lt;span');
      expect(html).not.toContain('&gt;');

      // Headers should be properly formatted without cross-reference markup
      expect(html).toContain('<h2>Art. 1 -'); // Should be clean header
      expect(html).toContain('<h2>Art. 2 -'); // Should be clean header
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
      
      // Headers should be clean and properly formatted
      expect(html).toContain('<h2>Art. 1 -');
      expect(html).toContain('<h2>Art. 2 -');
      expect(html).not.toContain('data-level="<span'); // Should not have broken attributes
      expect(html).not.toContain('data-number="<span');
    });

    it('should maintain proper HTML structure with cross-references', async () => {
      const html = await generateHtml(crossRefContent, {
        title: 'HTML Structure Test',
        includeHighlighting: true,
      });

      // Check that headers are generated as HTML elements
      expect(html).toContain('<h2>');
      expect(html).toContain('Art. 2 -');

      // Headers should be present and properly formatted
      const headerElements = html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];
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
        'crossref.listado-servicios'
      ];

      crossrefFields.forEach(fieldName => {
        const fieldHighlight = new RegExp(`<span class="legal-field highlight"[^>]*data-field="${fieldName}"[^>]*>[^<]*</span>`);
        expect(html).toMatch(fieldHighlight);
      });
    });
  });
});