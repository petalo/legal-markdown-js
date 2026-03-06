/**
 * Main Entry Point for Legal Markdown Processing Library
 *
 * This module provides the primary API for processing Legal Markdown documents
 * with support for YAML front matter, cross-references, optional clauses, mixins,
 * header processing, and multi-format output generation (HTML, PDF, DOCX).
 *
 * Features:
 * - YAML front matter parsing and metadata extraction
 * - Cross-reference processing and resolution
 * - Optional clause conditional rendering
 * - Mixin system for reusable content blocks
 * - Header numbering and formatting
 * - Field tracking for document highlighting
 * - HTML, PDF, and DOCX generation with styling
 * - RST and LaTeX preprocessing support
 * - Metadata export capabilities
 *
 * @example
 * ```typescript
 * import { processLegalMarkdown, generateHtml, generatePdf } from 'legal-markdown-js';
 *
 * // Basic document processing
 * const result = await processLegalMarkdown(content, {
 *   enableFieldTracking: true,
 *   basePath: './documents'
 * });
 *
 * // Generate HTML output
 * const html = await generateHtml(content, {
 *   title: 'Legal Agreement',
 *   includeHighlighting: true
 * });
 *
 * // Generate PDF output
 * const pdf = await generatePdf(content, './output.pdf', {
 *   format: 'A4',
 *   includeHighlighting: true
 * });
 * ```
 */

import { htmlGenerator } from './extensions/generators/html-generator';
import { pdfGenerator } from './extensions/generators/pdf-generator';
import { LegalMarkdownOptions } from './types';
import { processLegalMarkdown as processLegalMarkdownImpl } from './extensions/remark/legal-markdown-processor';
import { docxGenerator } from './extensions/generators/docx-generator';
import {
  resolvePdfConnector,
  type PdfConnectorPreference,
  type PdfOptions,
} from './extensions/generators/pdf-connectors';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * Process Legal Markdown content using the canonical async remark pipeline.
 *
 * @param content - Raw Legal Markdown document content.
 * @param options - Optional processing settings for parsing, plugins, tracking, and exports.
 * @returns Promise resolving to processed markdown, metadata, and optional tracking statistics.
 * @throws {ValidationError | PipelineError | ParseError | ImportError | ProcessingError | YamlParsingError | PdfDependencyError}
 * Throws typed processing errors when parsing, import resolution, or pipeline execution fails.
 * @example
 * ```typescript
 * import { processLegalMarkdown } from 'legal-markdown-js';
 *
 * const result = await processLegalMarkdown(markdown, {
 *   basePath: './docs',
 *   enableFieldTracking: true,
 * });
 *
 * console.log(result.content);
 * ```
 */
export const processLegalMarkdown = processLegalMarkdownImpl;

/**
 * Generate HTML from Legal Markdown content
 *
 * This function processes Legal Markdown content and generates a complete HTML
 * document with styling, field highlighting, and responsive design features.
 * It combines the Legal Markdown processing pipeline with HTML generation.
 *
 * @param {string} content - The raw Legal Markdown content to convert
 * @param {LegalMarkdownOptions & Object} [options={}] - Configuration options
 * @param {string} [options.cssPath] - Path to custom CSS file
 * @param {string} [options.highlightCssPath] - Path to field highlighting CSS
 * @param {boolean} [options.includeHighlighting] - Whether to include field highlighting
 * @param {string} [options.title] - Document title for HTML
 * @returns {Promise<string>} A promise that resolves to the complete HTML document
 * @throws {Error} When HTML generation fails
 * @example
 * ```typescript
 * const html = await generateHtml(content, {
 *   title: 'Service Agreement',
 *   cssPath: './custom-styles.css',
 *   includeHighlighting: true,
 *   enableFieldTracking: true
 * });
 * ```
 */
export async function generateHtml(
  content: string,
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
  } = {}
): Promise<string> {
  try {
    // Always use remark processor for HTML generation to ensure field tracking works
    // Field tracking is essential for HTML structure (headers, mixins, etc.)
    const result = await processLegalMarkdown(content, {
      ...options,
      enableFieldTracking: true, // Always enabled for HTML generation (structure)
      debug: options.debug || false,
    });

    return htmlGenerator.generateHtml(result.content, {
      cssPath: options.cssPath,
      highlightCssPath:
        options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
      includeHighlighting: options.includeHighlighting,
      title:
        options.title ||
        (typeof result.metadata?.title === 'string' ? result.metadata.title : undefined),
      metadata: result.metadata,
    });
  } catch (error) {
    console.warn('HTML generation pipeline failed, falling back to legacy processing:', error);
    return generateHtmlLegacy(content, options);
  }
}

/**
 * Legacy HTML generation as fallback
 */
async function generateHtmlLegacy(
  content: string,
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
  } = {}
): Promise<string> {
  // Process the legal markdown first (use async version for better RST/LaTeX support)
  const processed = await processLegalMarkdown(content, {
    ...options,
    enableFieldTracking: true,
  });

  // Generate HTML
  return htmlGenerator.generateHtml(processed.content, {
    cssPath: options.cssPath,
    highlightCssPath:
      options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
    includeHighlighting: options.includeHighlighting,
    title: options.title,
    metadata: processed.metadata,
  });
}

type PublicPdfGenerationOptions = LegalMarkdownOptions & {
  cssPath?: string;
  highlightCssPath?: string;
  includeHighlighting?: boolean;
  title?: string;
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  basePath?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  pdfConnector?: PdfConnectorPreference;
};

async function generatePdfFromProcessedMarkdown(
  processedContent: Parameters<typeof pdfGenerator.generatePdf>[0],
  outputPath: string,
  metadata: Record<string, unknown> | undefined,
  options: PublicPdfGenerationOptions
): Promise<Buffer> {
  const connectorPreference: PdfConnectorPreference = options.pdfConnector ?? 'auto';
  const connector = await resolvePdfConnector(connectorPreference);
  const title =
    options.title || (typeof metadata?.title === 'string' ? (metadata.title as string) : undefined);

  // Keep historical behavior for the Puppeteer connector, including template handling.
  if (connector.name === 'puppeteer') {
    return pdfGenerator.generatePdf(processedContent, outputPath, {
      cssPath: options.cssPath,
      highlightCssPath:
        options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
      includeHighlighting: options.includeHighlighting,
      title,
      metadata,
      format: options.format,
      landscape: options.landscape,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
    });
  }

  const html = await htmlGenerator.generateHtml(processedContent, {
    cssPath: options.cssPath,
    highlightCssPath:
      options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
    includeHighlighting: options.includeHighlighting,
    title,
    metadata,
  });

  const pdfOptions: PdfOptions = {
    format: options.format || 'A4',
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
    landscape: options.landscape,
    headerTemplate: options.headerTemplate,
    footerTemplate: options.footerTemplate,
  };

  await connector.generatePdf(html, outputPath, pdfOptions);
  return fs.readFile(outputPath);
}

/**
 * Generate PDF from Legal Markdown content
 *
 * This function processes Legal Markdown content and generates a PDF document
 * with professional styling, field highlighting, and customizable page formatting.
 * It combines the Legal Markdown processing pipeline with PDF generation.
 *
 * @param {string} content - The raw Legal Markdown content to convert
 * @param {string} outputPath - File path where the PDF will be saved
 * @param {LegalMarkdownOptions & Object} [options={}] - Configuration options
 * @param {string} [options.cssPath] - Path to custom CSS file
 * @param {string} [options.highlightCssPath] - Path to field highlighting CSS
 * @param {boolean} [options.includeHighlighting] - Whether to include field highlighting
 * @param {string} [options.title] - Document title for PDF
 * @param {'A4' | 'Letter' | 'Legal'} [options.format] - Page format
 * @param {boolean} [options.landscape] - Whether to use landscape orientation
 * @param {'auto' | 'puppeteer' | 'system-chrome' | 'weasyprint'} [options.pdfConnector] - PDF backend connector
 * @returns {Promise<Buffer>} A promise that resolves to the PDF buffer
 * @throws {Error} When PDF generation fails
 * @example
 * ```typescript
 * const pdf = await generatePdf(content, './contract.pdf', {
 *   title: 'Service Agreement',
 *   format: 'A4',
 *   includeHighlighting: true,
 *   enableFieldTracking: true
 * });
 * ```
 */
export async function generatePdf(
  content: string,
  outputPath: string,
  options: PublicPdfGenerationOptions = {}
): Promise<Buffer> {
  try {
    // Always use remark processor for PDF generation to ensure field tracking works
    // Field tracking is essential for PDF structure (headers, mixins, cross-references)
    const result = await processLegalMarkdown(content, {
      ...options,
      enableFieldTracking: true, // Always enabled for PDF generation (structure)
      debug: options.debug || false,
    });

    return generatePdfFromProcessedMarkdown(result.content, outputPath, result.metadata, options);
  } catch (error) {
    console.warn('PDF generation pipeline failed, falling back to legacy processing:', error);
    return generatePdfLegacy(content, outputPath, options);
  }
}

/**
 * Legacy PDF generation as fallback
 */
async function generatePdfLegacy(
  content: string,
  outputPath: string,
  options: PublicPdfGenerationOptions = {}
): Promise<Buffer> {
  // Process the legal markdown first (use async version for better RST/LaTeX support)
  const processed = await processLegalMarkdown(content, {
    ...options,
    enableFieldTracking: true,
  });

  return generatePdfFromProcessedMarkdown(
    processed.content,
    outputPath,
    processed.metadata,
    options
  );
}

/**
 * Generate both normal and highlighted PDF versions
 *
 * This function creates two PDF versions of the same Legal Markdown document:
 * one with standard formatting and another with field highlighting enabled.
 * This is useful for document review processes where both clean and annotated
 * versions are needed.
 *
 * @param {string} content - The raw Legal Markdown content to convert
 * @param {string} outputPath - Base file path for PDFs (will be modified for each version)
 * @param {LegalMarkdownOptions & Object} [options={}] - Configuration options
 * @param {string} [options.cssPath] - Path to custom CSS file
 * @param {string} [options.highlightCssPath] - Path to field highlighting CSS
 * @param {string} [options.title] - Document title for PDFs
 * @param {'A4' | 'Letter' | 'Legal'} [options.format] - Page format
 * @param {boolean} [options.landscape] - Whether to use landscape orientation
 * @param {'auto' | 'puppeteer' | 'system-chrome' | 'weasyprint'} [options.pdfConnector] - PDF backend connector
 * @returns {Promise<Object>} A promise that resolves to both PDF buffers
 * @returns {Buffer} returns.normal - The normal PDF without highlighting
 * @returns {Buffer} returns.highlighted - The highlighted PDF with field annotations
 * @throws {Error} When PDF generation fails
 * @example
 * ```typescript
 * const { normal, highlighted } = await generatePdfVersions(content, './contract.pdf', {
 *   title: 'Service Agreement',
 *   format: 'A4'
 * });
 * // Creates: contract.pdf and contract.HIGHLIGHT.pdf
 * ```
 */
export async function generatePdfVersions(
  content: string,
  outputPath: string,
  options: Omit<PublicPdfGenerationOptions, 'includeHighlighting'> = {}
): Promise<{
  normal: Buffer;
  highlighted: Buffer;
}> {
  const normalPath = outputPath;
  const highlightedPath = outputPath.replace('.pdf', '.HIGHLIGHT.pdf');

  const [normal, highlighted] = await Promise.all([
    generatePdf(content, normalPath, { ...options, includeHighlighting: false }),
    generatePdf(content, highlightedPath, { ...options, includeHighlighting: true }),
  ]);

  return { normal, highlighted };
}

/**
 * Generate DOCX from Legal Markdown content
 *
 * @param {string} content - The raw Legal Markdown content to convert
 * @param {string} outputPath - File path where the DOCX will be saved
 * @param {LegalMarkdownOptions & Object} [options={}] - Configuration options
 * @param {string} [options.cssPath] - Path to custom CSS file
 * @param {string} [options.highlightCssPath] - Path to field highlighting CSS
 * @param {boolean} [options.includeHighlighting] - Whether to include field highlighting
 * @param {string} [options.title] - Document title for DOCX
 * @param {'A4' | 'Letter' | 'Legal'} [options.format] - Page format
 * @param {boolean} [options.landscape] - Whether to use landscape orientation
 * @returns {Promise<Buffer>} A promise that resolves to the DOCX buffer
 * @throws {Error} When DOCX generation fails
 */
export async function generateDocx(
  content: string,
  outputPath: string,
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    basePath?: string;
    headerTemplate?: string;
    footerTemplate?: string;
  } = {}
): Promise<Buffer> {
  try {
    const result = await processLegalMarkdown(content, {
      ...options,
      enableFieldTracking: true,
      debug: options.debug || false,
    });

    return docxGenerator.generateDocx(result.content, outputPath, {
      cssPath: options.cssPath,
      highlightCssPath:
        options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
      includeHighlighting: options.includeHighlighting,
      title:
        options.title ||
        (typeof result.metadata?.title === 'string' ? result.metadata.title : undefined),
      metadata: result.metadata,
      format: options.format,
      landscape: options.landscape,
      basePath: options.basePath,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
      version: typeof result.metadata?.version === 'string' ? result.metadata.version : undefined,
    });
  } catch (error) {
    console.warn('DOCX generation pipeline failed, falling back to legacy processing:', error);
    return generateDocxLegacy(content, outputPath, options);
  }
}

/**
 * Legacy DOCX generation as fallback
 */
async function generateDocxLegacy(
  content: string,
  outputPath: string,
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    basePath?: string;
    headerTemplate?: string;
    footerTemplate?: string;
  } = {}
): Promise<Buffer> {
  const processed = await processLegalMarkdown(content, {
    ...options,
    enableFieldTracking: true,
  });

  return docxGenerator.generateDocx(processed.content, outputPath, {
    cssPath: options.cssPath,
    highlightCssPath:
      options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
    includeHighlighting: options.includeHighlighting,
    title: options.title,
    metadata: processed.metadata,
    format: options.format,
    landscape: options.landscape,
    basePath: options.basePath,
    headerTemplate: options.headerTemplate,
    footerTemplate: options.footerTemplate,
    version:
      typeof processed.metadata?.version === 'string' ? processed.metadata.version : undefined,
  });
}

/**
 * Generate both normal and highlighted DOCX versions
 */
export async function generateDocxVersions(
  content: string,
  outputPath: string,
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    basePath?: string;
    headerTemplate?: string;
    footerTemplate?: string;
  } = {}
): Promise<{
  normal: Buffer;
  highlighted: Buffer;
}> {
  const normalPath = outputPath;
  const highlightedPath = outputPath.replace('.docx', '.HIGHLIGHT.docx');

  const [normal, highlighted] = await Promise.all([
    generateDocx(content, normalPath, { ...options, includeHighlighting: false }),
    generateDocx(content, highlightedPath, { ...options, includeHighlighting: true }),
  ]);

  return { normal, highlighted };
}

// Export all sub-modules
export * from './types';
export * from './core/index';
export * from './errors/index';
export * from './constants/index';
export * from './utils/index';
export * from './extensions/index';

// Specific re-exports to avoid conflicts (extensions take precedence)
export { fieldTracker } from './extensions/tracking/field-tracker';
export { htmlGenerator } from './extensions/generators/html-generator';
export { pdfGenerator } from './extensions/generators/pdf-generator';
export { docxGenerator } from './extensions/generators/docx-generator';
