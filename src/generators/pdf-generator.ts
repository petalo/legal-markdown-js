/**
 * @fileoverview PDF Generation Module for Legal Markdown Documents
 *
 * This module provides functionality to convert processed Legal Markdown content
 * into professional PDF documents using Puppeteer for HTML-to-PDF conversion.
 * It builds upon the HTML generator to create print-ready documents with
 * customizable formatting, page layouts, and styling options.
 *
 * Features:
 * - HTML-to-PDF conversion using Puppeteer
 * - Multiple page formats (A4, Letter, Legal)
 * - Customizable margins and page orientation
 * - Header and footer template support
 * - Field highlighting for document review
 * - Temporary file management and cleanup
 * - Error handling and logging
 * - Dual PDF generation (normal and highlighted versions)
 *
 * @example
 * ```typescript
 * import { pdfGenerator } from './pdf-generator';
 *
 * const pdf = await pdfGenerator.generatePdf(markdownContent, './output.pdf', {
 *   format: 'A4',
 *   landscape: false,
 *   includeHighlighting: true,
 *   margin: { top: '2cm', bottom: '2cm' }
 * });
 * ```
 */

import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';
import { htmlGenerator, HtmlGeneratorOptions } from './html-generator';

/**
 * Configuration options for PDF generation
 *
 * @interface PdfGeneratorOptions
 * @extends HtmlGeneratorOptions
 */
export interface PdfGeneratorOptions extends HtmlGeneratorOptions {
  /** Page format for the PDF */
  format?: 'A4' | 'Letter' | 'Legal';
  /** Whether to use landscape orientation */
  landscape?: boolean;
  /** Page margins configuration */
  margin?: {
    /** Top margin (e.g., '1cm', '0.5in') */
    top?: string;
    /** Right margin (e.g., '1cm', '0.5in') */
    right?: string;
    /** Bottom margin (e.g., '1cm', '0.5in') */
    bottom?: string;
    /** Left margin (e.g., '1cm', '0.5in') */
    left?: string;
  };
  /** Whether to display header and footer */
  displayHeaderFooter?: boolean;
  /** HTML template for page headers */
  headerTemplate?: string;
  /** HTML template for page footers */
  footerTemplate?: string;
  /** Whether to print background colors and images */
  printBackground?: boolean;
  /** Whether to prefer CSS page size over format option */
  preferCSSPageSize?: boolean;
}

/**
 * PDF Generator for Legal Markdown Documents
 *
 * Converts processed Legal Markdown content into PDF documents using Puppeteer
 * for HTML-to-PDF conversion. Provides comprehensive formatting options and
 * supports both normal and highlighted document versions.
 *
 * @class PdfGenerator
 * @example
 * ```typescript
 * const generator = new PdfGenerator();
 * const pdf = await generator.generatePdf(content, './output.pdf', {
 *   format: 'A4',
 *   includeHighlighting: true
 * });
 * ```
 */
export class PdfGenerator {
  private puppeteerOptions: puppeteer.LaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  };

  /**
   * Creates a new PDF generator instance
   *
   * @constructor
   */
  constructor() {}

  /**
   * Generates a PDF document from Legal Markdown content
   *
   * This method orchestrates the complete PDF generation process:
   * 1. Converts markdown to HTML using the HTML generator
   * 2. Creates a temporary HTML file for Puppeteer
   * 3. Launches a headless Chrome browser
   * 4. Loads the HTML and generates PDF with specified options
   * 5. Cleans up temporary files and browser resources
   *
   * @async
   * @param {string} markdownContent - The processed Legal Markdown content
   * @param {string} outputPath - Path where the PDF will be saved
   * @param {PdfGeneratorOptions} [options={}] - Configuration options for PDF generation
   * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer
   * @throws {Error} When PDF generation fails due to browser, file system, or processing errors
   * @example
   * ```typescript
   * const pdf = await generator.generatePdf(
   *   markdownContent,
   *   './contract.pdf',
   *   {
   *     format: 'A4',
   *     landscape: false,
   *     includeHighlighting: true,
   *     margin: { top: '2cm', bottom: '2cm' }
   *   }
   * );
   * ```
   */
  async generatePdf(
    markdownContent: string,
    outputPath: string,
    options: PdfGeneratorOptions = {}
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    let tempHtmlPath: string | null = null;

    try {
      logger.debug('Starting PDF generation', {
        outputPath,
        options,
      });

      // Generate HTML content first
      const htmlContent = await htmlGenerator.generateHtml(markdownContent, options);

      // Create temporary HTML file
      const tempDir = path.join(process.cwd(), '.temp');
      await fs.mkdir(tempDir, { recursive: true });
      tempHtmlPath = path.join(tempDir, `temp-${Date.now()}.html`);
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf-8');

      // Launch browser
      logger.debug('Launching Puppeteer browser');
      browser = await puppeteer.launch(this.puppeteerOptions);
      const page = await browser.newPage();

      // Load the HTML file
      const fileUrl = `file://${path.resolve(tempHtmlPath)}`;
      await page.goto(fileUrl, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
      });

      // Configure PDF options
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        preferCSSPageSize: options.preferCSSPageSize || false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      };

      // Add header and footer if provided
      if (options.headerTemplate) {
        pdfOptions.headerTemplate = options.headerTemplate;
      }
      if (options.footerTemplate) {
        pdfOptions.footerTemplate = options.footerTemplate;
      }

      // Generate PDF
      logger.debug('Generating PDF with options', { pdfOptions });
      const pdfBuffer = await page.pdf(pdfOptions);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write PDF file
      await fs.writeFile(outputPath, pdfBuffer);

      logger.info('PDF generated successfully', {
        outputPath,
        size: pdfBuffer.length,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF', { error });
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }
      if (tempHtmlPath) {
        try {
          await fs.unlink(tempHtmlPath);
        } catch (error) {
          logger.warn('Failed to delete temporary HTML file', { error });
        }
      }
    }
  }

  /**
   * Generate two PDF versions: one normal and one with highlighting
   *
   * This method creates two PDF versions of the same document:
   * 1. A normal version without field highlighting
   * 2. A highlighted version with field annotations
   *
   * This is useful for document review processes where both clean and
   * annotated versions are needed for different purposes.
   *
   * @async
   * @param {string} markdownContent - The processed Legal Markdown content
   * @param {string} outputPath - Base path for PDF files (will be modified for each version)
   * @param {PdfGeneratorOptions} [options={}] - Configuration options for PDF generation
   * @returns {Promise<Object>} A promise that resolves to both PDF buffers
   * @returns {Buffer} returns.normal - The normal PDF without highlighting
   * @returns {Buffer} returns.highlighted - The highlighted PDF with field annotations
   * @throws {Error} When PDF generation fails for either version
   * @example
   * ```typescript
   * const { normal, highlighted } = await generator.generatePdfVersions(
   *   markdownContent,
   *   './contract.pdf',
   *   { format: 'A4' }
   * );
   * // Creates: contract.normal.pdf and contract.highlighted.pdf
   * ```
   */
  async generatePdfVersions(
    markdownContent: string,
    outputPath: string,
    options: PdfGeneratorOptions = {}
  ): Promise<{
    normal: Buffer;
    highlighted: Buffer;
  }> {
    // Generate normal PDF
    const normalPath = outputPath.replace('.pdf', '.normal.pdf');
    const normalOptions = { ...options, includeHighlighting: false };
    const normalPdf = await this.generatePdf(markdownContent, normalPath, normalOptions);

    // Generate highlighted PDF
    const highlightedPath = outputPath.replace('.pdf', '.highlighted.pdf');
    const highlightedOptions = { ...options, includeHighlighting: true };
    const highlightedPdf = await this.generatePdf(
      markdownContent,
      highlightedPath,
      highlightedOptions
    );

    return {
      normal: normalPdf,
      highlighted: highlightedPdf,
    };
  }
}

/**
 * Singleton instance of PdfGenerator for convenient importing
 *
 * @constant {PdfGenerator} pdfGenerator
 * @example
 * ```typescript
 * import { pdfGenerator } from './pdf-generator';
 * const pdf = await pdfGenerator.generatePdf(content, './output.pdf');
 * ```
 */
export const pdfGenerator = new PdfGenerator();
