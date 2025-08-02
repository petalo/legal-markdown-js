/**
 * @fileoverview Integration Tests for CLI HTML Generation with No-Indent
 *
 * Tests that verify HTML generation correctly uses noIndent: true to prevent
 * indented headers from being interpreted as code blocks by remark.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { CLI_PATHS } from '../utils/cli-paths.js';

describe('CLI HTML Generation No-Indent Integration', () => {
  const testInputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-html-test-input-'));
  const testOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-html-test-output-'));
  const cliPath = CLI_PATHS.main;

  beforeAll(() => {
    // Create test document with multiple header levels
    const testContent = `---
title: Test Document for HTML Generation
level-one: 'Article %n.'
level-two: 'Section %n.'
level-three: 'Subsection %n.'
level-four: 'Point %n.'
---

l. First Article

ll. First Section
Content under first section.

lll. Deep Subsection
Content under subsection.

llll. Even Deeper
Content under point.

ll. Second Section
More content.

l. Second Article
Final content.`;

    fs.writeFileSync(path.join(testInputDir, 'test-headers.md'), testContent);
  });

  afterAll(() => {
    // Clean up test files
    try {
      fs.rmSync(testInputDir, { recursive: true, force: true });
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should generate HTML without code blocks for indented headers', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, 'test-headers.md', '--html'], {
        cwd: __dirname,
        env: {
          ...process.env,
          DEFAULT_INPUT_DIR: testInputDir,
          DEFAULT_OUTPUT_DIR: testOutputDir,
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          if (code !== 0) {
            reject(new Error(`CLI process failed with code ${code}. Stderr: ${stderr}`));
            return;
          }

          expect(stdout).toContain('Files generated successfully!');

          // Check that HTML file was generated
          const htmlPath = path.join(testOutputDir, 'test-headers.html');
          expect(fs.existsSync(htmlPath)).toBe(true);

          // Read the generated HTML
          const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

          // Verify headers are properly formatted (not in code blocks)
          expect(htmlContent).toContain('Article 1. First Article');
          expect(htmlContent).toContain('Section 1. First Section');
          expect(htmlContent).toContain('Subsection 1. Deep Subsection');
          expect(htmlContent).toContain('Point 1. Even Deeper');

          // Verify headers have proper CSS classes (indicating field tracking worked)
          expect(htmlContent).toContain('class="legal-header legal-header-level-1 legal-article"');
          expect(htmlContent).toContain('class="legal-header legal-header-level-2 legal-section"');
          expect(htmlContent).toContain('class="legal-header legal-header-level-3 legal-subsection"');
          expect(htmlContent).toContain('class="legal-header legal-header-level-4 legal-sub-subsection"');

          // Verify headers are wrapped in spans, not in code blocks
          expect(htmlContent).toContain('<span class="legal-header');
          expect(htmlContent).not.toContain('<pre><code>  <span class="legal-header');

          // Verify data attributes are present
          expect(htmlContent).toContain('data-level="1"');
          expect(htmlContent).toContain('data-level="2"');
          expect(htmlContent).toContain('data-level="3"');
          expect(htmlContent).toContain('data-level="4"');

          resolve(void 0);
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 30000);

  it('should generate PDF without issues using same pipeline', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, 'test-headers.md', '--pdf'], {
        cwd: __dirname,
        env: {
          ...process.env,
          DEFAULT_INPUT_DIR: testInputDir,
          DEFAULT_OUTPUT_DIR: testOutputDir,
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          if (code !== 0) {
            reject(new Error(`CLI process failed with code ${code}. Stderr: ${stderr}`));
            return;
          }

          expect(stdout).toContain('Files generated successfully!');

          // Check that PDF file was generated
          const pdfPath = path.join(testOutputDir, 'test-headers.pdf');
          expect(fs.existsSync(pdfPath)).toBe(true);

          // Basic check that the PDF file has some content
          const pdfStats = fs.statSync(pdfPath);
          expect(pdfStats.size).toBeGreaterThan(1000); // PDF should be at least 1KB

          resolve(void 0);
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 30000);

  it('should still preserve indentation in markdown output when --to-markdown is used', async () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, 'test-headers.md', '--to-markdown'], {
        cwd: __dirname,
        env: {
          ...process.env,
          DEFAULT_INPUT_DIR: testInputDir,
          DEFAULT_OUTPUT_DIR: testOutputDir,
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          if (code !== 0) {
            reject(new Error(`CLI process failed with code ${code}. Stderr: ${stderr}`));
            return;
          }

          // For --to-markdown, content may be sent to stdout directly
          // so we check for either success message or markdown content
          const hasSuccessMessage = stdout.includes('Files generated successfully!');
          const hasMarkdownContent = stdout.includes('Article 1. First Article');
          expect(hasSuccessMessage || hasMarkdownContent).toBe(true);

          // Verify markdown output preserves indentation for readability
          // This is tested by checking that deeper levels have indentation in stdout
          expect(stdout).toContain('Article 1. First Article');
          expect(stdout).toMatch(/\s+Section 1\. First Section/); // Should have indentation
          expect(stdout).toMatch(/\s+Subsection 1\. Deep Subsection/); // Should have more indentation

          resolve(void 0);
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }, 30000);
});