/**
 * @fileoverview Comprehensive tests for PDF Generator
 *
 * This file provides CRITICAL test coverage for pdf-generator.ts, which is
 * essential for v4.0 as it handles all PDF output generation.
 *
 * Test Coverage:
 * - PdfGenerator class instantiation and configuration
 * - Chrome executable detection (system, puppeteer, cache)
 * - PDF generation from markdown content
 * - PDF generation from pre-generated HTML
 * - Dual PDF generation (normal + highlighted versions)
 * - Page format and layout configuration
 * - Margin configuration
 * - Header/footer templates
 * - Temporary file management
 * - Error handling (browser launch, file system, processing)
 * - Puppeteer options configuration
 * - Logo detection integration (tested separately in pdf-logo-detection.unit.test.ts)
 */

import { describe, it, expect, beforeEach, vi, afterEach, MockedObject } from 'vitest';
import { PdfGenerator, pdfGenerator, PdfGeneratorOptions } from '../../../../src/extensions/generators/pdf-generator';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { asMarkdown } from '../../../../src/types/content-formats';

// Mock all external dependencies
vi.mock('puppeteer');
vi.mock('fs/promises');
vi.mock('fs');
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock html-generator
vi.mock('../../../../src/extensions/generators/html-generator', () => ({
  htmlGenerator: {
    generateHtml: vi.fn().mockResolvedValue('<html><body><h1>Test</h1></body></html>'),
  },
}));

const mockedPuppeteer = puppeteer as MockedObject<typeof puppeteer>;
const mockedFs = fs as MockedObject<typeof fs>;
const mockedFsSync = fsSync as MockedObject<typeof fsSync>;

describe('PdfGenerator', () => {
  let generator: PdfGenerator;
  let mockPage: any;
  let mockBrowser: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock page
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
    };

    // Setup mock browser
    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Puppeteer launch to return mock browser
    mockedPuppeteer.launch = vi.fn().mockResolvedValue(mockBrowser as any);

    // Mock file system operations
    mockedFs.mkdir = vi.fn().mockResolvedValue(undefined);
    mockedFs.writeFile = vi.fn().mockResolvedValue(undefined);
    mockedFs.unlink = vi.fn().mockResolvedValue(undefined);
    mockedFs.readFile = vi.fn().mockResolvedValue('<html><body>Test</body></html>');
    mockedFs.stat = vi.fn().mockResolvedValue({ size: 1000 } as any);

    // Mock sync fs operations
    mockedFsSync.existsSync = vi.fn().mockReturnValue(false);
    mockedFsSync.readdirSync = vi.fn().mockReturnValue([]);

    // Create generator instance
    generator = new PdfGenerator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ==========================================================================

  describe('Constructor', () => {
    it('should create PdfGenerator instance with default options', () => {
      const gen = new PdfGenerator();
      expect(gen).toBeInstanceOf(PdfGenerator);
    });

    it('should configure puppeteer with headless mode', () => {
      const gen = new PdfGenerator();
      const options = (gen as any).puppeteerOptions;
      expect(options.headless).toBe(true);
    });

    it('should configure puppeteer with security args', () => {
      const gen = new PdfGenerator();
      const options = (gen as any).puppeteerOptions;
      expect(options.args).toContain('--no-sandbox');
      expect(options.args).toContain('--disable-setuid-sandbox');
      expect(options.args).toContain('--disable-dev-shm-usage');
    });

    it('should configure puppeteer with timeout', () => {
      const gen = new PdfGenerator();
      const options = (gen as any).puppeteerOptions;
      expect(options.timeout).toBe(60000);
    });

    it('should attempt to find Chrome executable', () => {
      const gen = new PdfGenerator();
      const options = (gen as any).puppeteerOptions;
      // executablePath may be set if Chrome is found, or undefined if not
      expect(options).toHaveProperty('executablePath');
    });
  });

  // ==========================================================================
  // CHROME EXECUTABLE DETECTION
  // ==========================================================================

  describe('Chrome Executable Detection', () => {
    it('should detect system Chrome on macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      mockedFsSync.existsSync = vi.fn().mockImplementation((path: string) => {
        return path.includes('Google Chrome.app');
      });

      const gen = new PdfGenerator();
      const chromePath = (gen as any).getSystemChromeExecutable();

      expect(chromePath).toContain('Google Chrome');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect system Chrome on Linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      mockedFsSync.existsSync = vi.fn().mockImplementation((path: string) => {
        return path === '/usr/bin/google-chrome';
      });

      const gen = new PdfGenerator();
      const chromePath = (gen as any).getSystemChromeExecutable();

      expect(chromePath).toBe('/usr/bin/google-chrome');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect system Chrome on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      mockedFsSync.existsSync = vi.fn().mockImplementation((path: string) => {
        return path.includes('Google\\Chrome\\Application\\chrome.exe');
      });

      const gen = new PdfGenerator();
      const chromePath = (gen as any).getSystemChromeExecutable();

      expect(chromePath).toContain('chrome.exe');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return null when no system Chrome found', () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(false);

      const gen = new PdfGenerator();
      const chromePath = (gen as any).getSystemChromeExecutable();

      expect(chromePath).toBeNull();
    });

    it('should check puppeteer cache for Chrome', () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome']);

      const gen = new PdfGenerator();
      const cachePath = (gen as any).getAvailablePuppeteerCache();

      expect(cachePath).toBeTruthy();
    });

    it('should use global cache as default', () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(false);

      const gen = new PdfGenerator();
      const cachePath = (gen as any).getAvailablePuppeteerCache();

      expect(cachePath).toContain('.cache/puppeteer-global');
    });

    it('should detect if chromium cache exists', () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-version']);

      const gen = new PdfGenerator();
      const hasCache = (gen as any).hasChromiumCache();

      expect(hasCache).toBe(true);
    });

    it('should return false when no chromium cache exists', () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(false);

      const gen = new PdfGenerator();
      const hasCache = (gen as any).hasChromiumCache();

      expect(hasCache).toBe(false);
    });
  });

  // ==========================================================================
  // PDF GENERATION FROM MARKDOWN
  // ==========================================================================

  describe('generatePdf', () => {
    const markdown = asMarkdown('# Test Document\n\nTest content');
    const outputPath = '/tmp/test-output.pdf';

    beforeEach(() => {
      // Mock Chrome as available
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should generate PDF from markdown content', async () => {
      const result = await generator.generatePdf(markdown, outputPath);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });

    it('should create temporary HTML file', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.temp'),
        { recursive: true }
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.html'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should launch puppeteer browser', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockedPuppeteer.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: true,
          timeout: 60000,
        })
      );
    });

    it('should load HTML in browser page', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.goto).toHaveBeenCalledWith(
        expect.stringContaining('file://'),
        expect.objectContaining({
          waitUntil: ['load', 'networkidle0'],
          timeout: 30000,
        })
      );
    });

    it('should generate PDF with default A4 format', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
          path: outputPath,
        })
      );
    });

    it('should generate PDF with custom format', async () => {
      await generator.generatePdf(markdown, outputPath, { format: 'Letter' });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'Letter',
        })
      );
    });

    it('should generate PDF with landscape orientation', async () => {
      await generator.generatePdf(markdown, outputPath, { landscape: true });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          landscape: true,
        })
      );
    });

    it('should generate PDF with custom margins', async () => {
      const margins = {
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm',
      };

      await generator.generatePdf(markdown, outputPath, { margin: margins });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: margins,
        })
      );
    });

    it('should generate PDF with default margins', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm',
          },
        })
      );
    });

    it('should enable print background by default', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          printBackground: true,
        })
      );
    });

    it('should disable print background when specified', async () => {
      await generator.generatePdf(markdown, outputPath, { printBackground: false });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          printBackground: false,
        })
      );
    });

    it('should create output directory if it does not exist', async () => {
      const deepPath = '/tmp/deep/nested/path/output.pdf';
      await generator.generatePdf(markdown, deepPath);

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.dirname(deepPath),
        { recursive: true }
      );
    });

    it('should write PDF file to disk', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer),
        undefined
      );
    });

    it('should cleanup temporary HTML file', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockedFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('.html')
      );
    });

    it('should close browser after generation', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should cleanup on error', async () => {
      mockPage.pdf = vi.fn().mockRejectedValue(new Error('PDF generation failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('should throw error when browser launch fails', async () => {
      mockedPuppeteer.launch = vi.fn().mockRejectedValue(new Error('Browser launch failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should provide helpful error message on macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      mockedPuppeteer.launch = vi.fn().mockRejectedValue(new Error('Chrome not found'));
      mockedFsSync.existsSync = vi.fn().mockReturnValue(false);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue([]);

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow(/macOS/);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  // ==========================================================================
  // PDF GENERATION FROM HTML
  // ==========================================================================

  describe('generatePdfFromHtml', () => {
    const htmlContent = '<html><body><h1>Test</h1><p>Content</p></body></html>';
    const outputPath = '/tmp/test-from-html.pdf';

    beforeEach(() => {
      // Mock Chrome as available
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should generate PDF from HTML content', async () => {
      const result = await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });

    it('should create temporary HTML file from provided HTML', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.html'),
        htmlContent,
        'utf-8'
      );
    });

    it('should launch puppeteer browser', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(mockedPuppeteer.launch).toHaveBeenCalled();
    });

    it('should load HTML in browser', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(mockPage.goto).toHaveBeenCalledWith(
        expect.stringContaining('file://'),
        expect.any(Object)
      );
    });

    it('should create output directory before PDF generation', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      const callOrder = mockedFs.mkdir.mock.invocationCallOrder;
      const pdfCallOrder = mockPage.pdf.mock.invocationCallOrder;

      expect(callOrder[callOrder.length - 1]).toBeLessThan(pdfCallOrder[0]);
    });

    it('should generate PDF with specified format', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath, { format: 'Legal' });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'Legal',
        })
      );
    });

    it('should cleanup temporary HTML file', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('should close browser after generation', async () => {
      await generator.generatePdfFromHtml(htmlContent, outputPath);

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should cleanup on error', async () => {
      mockPage.pdf = vi.fn().mockRejectedValue(new Error('PDF failed'));

      await expect(generator.generatePdfFromHtml(htmlContent, outputPath)).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
      expect(mockedFs.unlink).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DUAL PDF GENERATION (NORMAL + HIGHLIGHTED)
  // ==========================================================================

  describe('generatePdfVersions', () => {
    const markdown = asMarkdown('# Contract\n\n{{client_name}} agrees to pay {{amount}}.');
    const outputPath = '/tmp/contract.pdf';

    beforeEach(() => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should generate both normal and highlighted PDFs', async () => {
      const result = await generator.generatePdfVersions(markdown, outputPath);

      expect(result).toHaveProperty('normal');
      expect(result).toHaveProperty('highlighted');
      expect(result.normal).toBeInstanceOf(Buffer);
      expect(result.highlighted).toBeInstanceOf(Buffer);
    });

    it('should call generatePdf twice', async () => {
      const spy = vi.spyOn(generator, 'generatePdf');

      await generator.generatePdfVersions(markdown, outputPath);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should generate normal PDF without highlighting', async () => {
      const spy = vi.spyOn(generator, 'generatePdf');

      await generator.generatePdfVersions(markdown, outputPath);

      expect(spy).toHaveBeenCalledWith(
        markdown,
        expect.stringContaining('.normal.pdf'),
        expect.objectContaining({
          includeHighlighting: false,
        })
      );
    });

    it('should generate highlighted PDF with highlighting', async () => {
      const spy = vi.spyOn(generator, 'generatePdf');

      await generator.generatePdfVersions(markdown, outputPath);

      expect(spy).toHaveBeenCalledWith(
        markdown,
        expect.stringContaining('.highlighted.pdf'),
        expect.objectContaining({
          includeHighlighting: true,
        })
      );
    });

    it('should use correct output paths', async () => {
      const spy = vi.spyOn(generator, 'generatePdf');

      await generator.generatePdfVersions(markdown, '/tmp/document.pdf');

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        '/tmp/document.normal.pdf',
        expect.anything()
      );
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        '/tmp/document.highlighted.pdf',
        expect.anything()
      );
    });

    it('should pass through other options to both PDFs', async () => {
      const spy = vi.spyOn(generator, 'generatePdf');
      const options: PdfGeneratorOptions = {
        format: 'Letter',
        landscape: true,
        margin: { top: '2cm', bottom: '2cm' },
      };

      await generator.generatePdfVersions(markdown, outputPath, options);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          format: 'Letter',
          landscape: true,
          margin: { top: '2cm', bottom: '2cm' },
        })
      );
    });
  });

  // ==========================================================================
  // HEADER AND FOOTER TEMPLATES
  // ==========================================================================

  describe('Header and Footer Templates', () => {
    const markdown = asMarkdown('# Test');
    const outputPath = '/tmp/test.pdf';

    beforeEach(() => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should use custom header template when provided', async () => {
      const headerTemplate = '<div>Custom Header</div>';

      await generator.generatePdf(markdown, outputPath, { headerTemplate });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate,
        })
      );
    });

    it('should use custom footer template when provided', async () => {
      const footerTemplate = '<div>Custom Footer</div>';

      await generator.generatePdf(markdown, outputPath, { footerTemplate });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          footerTemplate,
        })
      );
    });

    it('should enable displayHeaderFooter when templates provided', async () => {
      await generator.generatePdf(markdown, outputPath, {
        headerTemplate: '<div>Header</div>',
        footerTemplate: '<div>Footer</div>',
        displayHeaderFooter: true,
      });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          displayHeaderFooter: true,
        })
      );
    });

    it('should auto-generate header/footer without manual templates', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          displayHeaderFooter: true,
          headerTemplate: expect.any(String),
          footerTemplate: expect.any(String),
        })
      );
    });

    it('should increase margins when auto-generating header/footer', async () => {
      await generator.generatePdf(markdown, outputPath);

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: {
            top: '3cm',
            right: '1cm',
            bottom: '3cm',
            left: '1cm',
          },
        })
      );
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    const markdown = asMarkdown('# Test');
    const outputPath = '/tmp/test.pdf';

    beforeEach(() => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should throw error when HTML generation fails', async () => {
      const { htmlGenerator } = await import('../../../../src/extensions/generators/html-generator');
      vi.mocked(htmlGenerator.generateHtml).mockRejectedValue(new Error('HTML gen failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should throw error when browser fails to launch', async () => {
      mockedPuppeteer.launch = vi.fn().mockRejectedValue(new Error('Launch failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow();
    });

    it('should throw error when page navigation fails', async () => {
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Navigation failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should throw error when PDF generation fails', async () => {
      mockPage.pdf = vi.fn().mockRejectedValue(new Error('PDF generation failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should handle temporary file creation errors', async () => {
      mockedFs.writeFile = vi.fn().mockRejectedValue(new Error('Write failed'));

      await expect(generator.generatePdf(markdown, outputPath)).rejects.toThrow();
    });

    it('should continue despite cleanup errors', async () => {
      mockedFs.unlink = vi.fn().mockRejectedValue(new Error('Unlink failed'));

      const result = await generator.generatePdf(markdown, outputPath);

      expect(result).toBeInstanceOf(Buffer);
      // Should not throw despite unlink failure
    });
  });

  // ==========================================================================
  // SINGLETON INSTANCE
  // ==========================================================================

  describe('Singleton Instance', () => {
    it('should export singleton pdfGenerator instance', () => {
      expect(pdfGenerator).toBeInstanceOf(PdfGenerator);
    });

    it('should allow using singleton for PDF generation', async () => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);

      const result = await pdfGenerator.generatePdf(
        asMarkdown('# Test'),
        '/tmp/singleton-test.pdf'
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  // ==========================================================================
  // INTEGRATION WITH OPTIONS
  // ==========================================================================

  describe('Options Integration', () => {
    const markdown = asMarkdown('# Test');
    const outputPath = '/tmp/test.pdf';

    beforeEach(() => {
      mockedFsSync.existsSync = vi.fn().mockReturnValue(true);
      mockedFsSync.readdirSync = vi.fn().mockReturnValue(['chrome-cache']);
    });

    it('should pass all HtmlGeneratorOptions to HTML generator', async () => {
      const { htmlGenerator } = await import('../../../../src/extensions/generators/html-generator');
      const options: PdfGeneratorOptions = {
        cssPath: './styles/custom.css',
        includeHighlighting: true,
      };

      await generator.generatePdf(markdown, outputPath, options);

      expect(htmlGenerator.generateHtml).toHaveBeenCalledWith(
        markdown,
        expect.objectContaining({
          cssPath: './styles/custom.css',
          includeHighlighting: true,
        })
      );
    });

    it('should handle preferCSSPageSize option', async () => {
      await generator.generatePdf(markdown, outputPath, { preferCSSPageSize: true });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          preferCSSPageSize: true,
        })
      );
    });

    it('should use version in footer when provided', async () => {
      await generator.generatePdf(markdown, outputPath, { version: 'v1.2.3' });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          footerTemplate: expect.stringContaining('v1.2.3'),
        })
      );
    });
  });
});
