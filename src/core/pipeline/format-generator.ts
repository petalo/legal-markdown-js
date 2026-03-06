/**
 * Phase 3: Format Generation from Cached AST
 *
 * This module implements Phase 3 of the 3-phase pipeline architecture.
 * It generates all requested output formats (HTML, PDF, DOCX, Markdown, Metadata)
 * from the cached AST and processed content produced by Phase 2.
 *
 * Key benefits:
 * - Single processing run regardless of output formats
 * - Parallel format generation from cached AST
 * - ~75% reduction in processing time for multi-format output
 * - Compatible with existing HTML/PDF/DOCX generation
 *
 * @module core/pipeline/format-generator
 */

import * as path from 'path';
import * as fs from 'fs';
import { writeFileSync } from '../../utils';
import type { ProcessingOptions } from '../../types';
import { LegalMarkdownProcessorResult } from '../../extensions/remark/legal-markdown-processor';
import { ProcessingError } from '../../errors';
import { logger } from '../../utils/logger';
import type { PdfConnector, PdfOptions } from '../../extensions/generators/pdf-connectors';
import { resolvePdfConnector } from '../../extensions/generators/pdf-connectors';

/**
 * Configuration for format generation
 */
export interface FormatGenerationOptions {
  /** Output directory for generated files */
  outputDir: string;

  /** Base filename (without extension) */
  baseFilename: string;

  /** Generate PDF output */
  pdf?: boolean;

  /** Generate HTML output */
  html?: boolean;

  /** Generate DOCX output */
  docx?: boolean;

  /** Generate Markdown output */
  markdown?: boolean;

  /** Generate metadata output */
  metadata?: boolean;

  /** Enable field highlighting */
  highlight?: boolean;

  /** CSS file path for styling */
  cssPath?: string;

  /** Highlight CSS path */
  highlightCssPath?: string;

  /** Document title */
  title?: string;

  /** Include highlighting in output */
  includeHighlighting?: boolean;

  /** PDF format */
  format?: 'A4' | 'Letter' | 'Legal';

  /** Landscape orientation */
  landscape?: boolean;

  /** Custom DOCX header HTML template */
  docxHeaderTemplate?: string;

  /** Custom DOCX footer HTML template */
  docxFooterTemplate?: string;

  pdfConnector?: PdfConnector;

  pdfMargin?: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };

  /** Export format for metadata */
  exportFormat?: 'yaml' | 'json';

  /** Metadata export path */
  exportPath?: string;
}

/**
 * Build format generation options with force-commands support
 *
 * This helper ensures that options from force-commands (in context.options)
 * take precedence over CLI/interactive options. This prevents bugs where
 * force-commands are ignored in Phase 3.
 *
 * @param contextOptions - Options from Phase 1 (includes force-commands)
 * @param baseOptions - Partial options to merge with context
 * @returns Complete FormatGenerationOptions with force-commands applied
 *
 * @example
 * ```typescript
 * // In CLI service:
 * const formatOptions = buildFormatGenerationOptions(context.options, {
 *   outputDir: dirName,
 *   baseFilename: baseName,
 *   pdf: options.pdf,
 *   html: options.html,
 *   // ... other base options
 * });
 *
 * await generateAllFormats(processedResult, formatOptions);
 * ```
 */
export function buildFormatGenerationOptions(
  contextOptions: ProcessingOptions,
  baseOptions: Partial<FormatGenerationOptions>
): FormatGenerationOptions {
  return {
    // Required fields from baseOptions
    outputDir: baseOptions.outputDir!,
    baseFilename: baseOptions.baseFilename!,

    // Format flags: prioritize context.options (force-commands) over base options
    pdf: contextOptions.pdf ?? baseOptions.pdf,
    html: contextOptions.html ?? baseOptions.html,
    docx: contextOptions.docx ?? baseOptions.docx,
    markdown: baseOptions.markdown,
    metadata: baseOptions.metadata,

    // Processing options: prioritize context.options (force-commands)
    highlight: contextOptions.highlight ?? baseOptions.highlight,
    format: contextOptions.format ?? baseOptions.format,
    landscape: contextOptions.landscape ?? baseOptions.landscape,
    pdfConnector: baseOptions.pdfConnector,
    pdfMargin: baseOptions.pdfMargin,
    docxHeaderTemplate: baseOptions.docxHeaderTemplate,
    docxFooterTemplate: baseOptions.docxFooterTemplate,

    // Paths and other options
    cssPath: baseOptions.cssPath,
    highlightCssPath: baseOptions.highlightCssPath,
    title: baseOptions.title,
    includeHighlighting: baseOptions.includeHighlighting,
    exportFormat: baseOptions.exportFormat,
    exportPath: baseOptions.exportPath,
  };
}

/**
 * Result from format generation
 */
export interface FormatGenerationResult {
  /** Generated file paths */
  generatedFiles: string[];

  /** Format-specific results */
  results: {
    pdf?: {
      normal?: string;
      highlight?: string;
    };
    html?: {
      normal?: string;
      highlight?: string;
    };
    docx?: {
      normal?: string;
      highlight?: string;
    };
    markdown?: string;
    metadata?: string[];
  };

  /** Generation statistics */
  stats: {
    totalFiles: number;
    processingTime: number;
  };
}

/**
 * Generate all requested formats from cached processing result
 *
 * This is the main entry point for Phase 3. It takes the cached result
 * from Phase 2 and generates all requested output formats in parallel
 * without re-running the processing pipeline.
 *
 * @param processedResult - Result from Phase 2 (with cached AST)
 * @param options - Format generation options
 * @returns Promise resolving to generation result with file paths
 *
 * @example
 * ```typescript
 * // After Phase 2 processing:
 * const processed = await processLegalMarkdown(content, options);
 *
 * // Generate all formats:
 * const result = await generateAllFormats(processed, {
 *   outputDir: '/path/to/output',
 *   baseFilename: 'contract',
 *   pdf: true,
 *   html: true,
 *   highlight: true
 * });
 *
 * console.log(`Generated ${result.stats.totalFiles} files`);
 * ```
 */
export async function generateAllFormats(
  processedResult: LegalMarkdownProcessorResult,
  options: FormatGenerationOptions
): Promise<FormatGenerationResult> {
  const startTime = Date.now();
  const generatedFiles: string[] = [];
  const results: FormatGenerationResult['results'] = {};

  // Ensure output directory exists (create parent directories if needed)
  try {
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }
  } catch (error) {
    // If we can't create the directory, throw a more helpful error
    throw new ProcessingError(
      `Failed to create output directory "${options.outputDir}": ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Orchestration logic: If HTML plus PDF and/or DOCX are requested,
  // execute sequentially to reuse HTML content.
  if (options.html && (options.pdf || options.docx)) {
    logger.debug('[Phase 3] Orchestrating HTML→(PDF/DOCX) pipeline (sequential for HTML reuse)');

    // Step 1: Generate HTML (cache content for PDF reuse)
    const htmlResults = await generateHtmlFormats(processedResult, options);
    results.html = {
      normal: htmlResults.normal?.path,
      highlight: htmlResults.highlight?.path,
    };
    if (htmlResults.normal?.path) generatedFiles.push(htmlResults.normal.path);
    if (htmlResults.highlight?.path) generatedFiles.push(htmlResults.highlight.path);

    // Step 2: Generate PDF/DOCX using cached HTML (NO HTML regeneration!)
    const dependentFormats: Promise<void>[] = [];

    if (options.pdf) {
      dependentFormats.push(
        generatePdfFormats(processedResult, options, htmlResults).then(pdfResults => {
          results.pdf = pdfResults;
          if (pdfResults.normal) generatedFiles.push(pdfResults.normal);
          if (pdfResults.highlight) generatedFiles.push(pdfResults.highlight);
        })
      );
    }

    if (options.docx) {
      dependentFormats.push(
        generateDocxFormats(processedResult, options, htmlResults).then(docxResults => {
          results.docx = docxResults;
          if (docxResults.normal) generatedFiles.push(docxResults.normal);
          if (docxResults.highlight) generatedFiles.push(docxResults.highlight);
        })
      );
    }

    await Promise.all(dependentFormats);

    // Step 3: Generate other formats in parallel
    const otherFormats: Promise<void>[] = [];
    if (options.markdown) {
      otherFormats.push(
        generateMarkdownFormat(processedResult, options).then(mdPath => {
          results.markdown = mdPath;
          generatedFiles.push(mdPath);
        })
      );
    }
    await Promise.all(otherFormats);
  } else {
    // Execute all formats in parallel (no HTML reuse needed)
    const formatPromises: Promise<void>[] = [];

    // Generate HTML if requested
    if (options.html) {
      formatPromises.push(
        generateHtmlFormats(processedResult, options).then(htmlResults => {
          results.html = {
            normal: htmlResults.normal?.path,
            highlight: htmlResults.highlight?.path,
          };
          if (htmlResults.normal?.path) generatedFiles.push(htmlResults.normal.path);
          if (htmlResults.highlight?.path) generatedFiles.push(htmlResults.highlight.path);
        })
      );
    }

    // Generate PDF if requested
    if (options.pdf) {
      formatPromises.push(
        generatePdfFormats(processedResult, options).then(pdfResults => {
          results.pdf = pdfResults;
          if (pdfResults.normal) generatedFiles.push(pdfResults.normal);
          if (pdfResults.highlight) generatedFiles.push(pdfResults.highlight);
        })
      );
    }

    // Generate DOCX if requested
    if (options.docx) {
      formatPromises.push(
        generateDocxFormats(processedResult, options).then(docxResults => {
          results.docx = docxResults;
          if (docxResults.normal) generatedFiles.push(docxResults.normal);
          if (docxResults.highlight) generatedFiles.push(docxResults.highlight);
        })
      );
    }

    // Generate Markdown if requested
    if (options.markdown) {
      formatPromises.push(
        generateMarkdownFormat(processedResult, options).then(mdPath => {
          results.markdown = mdPath;
          generatedFiles.push(mdPath);
        })
      );
    }

    // Wait for all formats to complete
    await Promise.all(formatPromises);
  }

  // Generate Metadata if requested (always separate, doesn't need orchestration)
  if (options.metadata && processedResult.exportedFiles) {
    results.metadata = processedResult.exportedFiles;
    generatedFiles.push(...processedResult.exportedFiles);
  }

  const processingTime = Date.now() - startTime;

  return {
    generatedFiles,
    results,
    stats: {
      totalFiles: generatedFiles.length,
      processingTime,
    },
  };
}

/**
 * Result from HTML generation including both file paths and content
 * @internal
 */
interface HtmlGenerationResult {
  normal?: { path: string; content: string };
  highlight?: { path: string; content: string };
}

/**
 * Generate HTML formats (normal and/or highlight)
 *
 * @param processedResult - Processed result with cached content
 * @param options - Generation options
 * @returns Promise resolving to HTML file paths and content (for reuse in PDF generation)
 * @internal
 */
async function generateHtmlFormats(
  processedResult: LegalMarkdownProcessorResult,
  options: FormatGenerationOptions
): Promise<HtmlGenerationResult> {
  // Use HtmlGenerator directly to avoid re-processing content
  const { HtmlGenerator } = await import('../../extensions/generators/html-generator');
  const generator = new HtmlGenerator();
  const result: HtmlGenerationResult = {};

  const generateOptions = {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath,
    title: options.title || options.baseFilename,
    metadata: processedResult.metadata,
  };

  if (options.highlight) {
    // Generate both normal and highlight versions
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.html`);
    const highlightPath = path.join(options.outputDir, `${options.baseFilename}.HIGHLIGHT.html`);

    // Normal version (without field highlighting)
    const normalHtml = await generator.generateHtml(processedResult.content, {
      ...generateOptions,
      includeHighlighting: false,
    });
    writeFileSync(normalPath, normalHtml);
    result.normal = { path: normalPath, content: normalHtml };

    // Highlight version (with field highlighting)
    const highlightHtml = await generator.generateHtml(processedResult.content, {
      ...generateOptions,
      includeHighlighting: true,
    });
    writeFileSync(highlightPath, highlightHtml);
    result.highlight = { path: highlightPath, content: highlightHtml };
  } else {
    // Single normal version
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.html`);
    const normalHtml = await generator.generateHtml(processedResult.content, {
      ...generateOptions,
      includeHighlighting: false,
    });
    writeFileSync(normalPath, normalHtml);
    result.normal = { path: normalPath, content: normalHtml };
  }

  return result;
}

/**
 * Generate DOCX formats (normal and/or highlight)
 *
 * Reuses cached HTML when available to avoid duplicated HTML generation.
 *
 * @param processedResult - Processed result with cached content
 * @param options - Generation options
 * @param cachedHtml - Optional pre-generated HTML content to reuse
 * @returns Promise resolving to DOCX file paths
 * @internal
 */
async function generateDocxFormats(
  processedResult: LegalMarkdownProcessorResult,
  options: FormatGenerationOptions,
  cachedHtml?: HtmlGenerationResult
): Promise<{ normal?: string; highlight?: string }> {
  const { HtmlGenerator } = await import('../../extensions/generators/html-generator');
  const { DocxGenerator } = await import('../../extensions/generators/docx-generator');

  const htmlGenerator = new HtmlGenerator();
  const generator = new DocxGenerator();
  const result: { normal?: string; highlight?: string } = {};

  const htmlGeneratorOptions = {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath,
    title: options.title || options.baseFilename,
    metadata: processedResult.metadata,
  };

  const version =
    processedResult.metadata && typeof processedResult.metadata.version === 'string'
      ? processedResult.metadata.version
      : undefined;

  const docxOptions = {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath,
    title: options.title || options.baseFilename,
    metadata: processedResult.metadata,
    format: options.format,
    landscape: options.landscape,
    margin: options.pdfMargin,
    headerTemplate: options.docxHeaderTemplate,
    footerTemplate: options.docxFooterTemplate,
    version,
  };

  if (options.highlight) {
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.docx`);
    const highlightPath = path.join(options.outputDir, `${options.baseFilename}.HIGHLIGHT.docx`);

    const normalHtml =
      cachedHtml?.normal?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: false,
      }));
    await generator.generateDocxFromHtml(normalHtml, normalPath, {
      ...docxOptions,
      includeHighlighting: false,
    });
    result.normal = normalPath;

    const highlightHtml =
      cachedHtml?.highlight?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: true,
      }));
    await generator.generateDocxFromHtml(highlightHtml, highlightPath, {
      ...docxOptions,
      includeHighlighting: true,
    });
    result.highlight = highlightPath;
  } else {
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.docx`);
    const normalHtml =
      cachedHtml?.normal?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: false,
      }));
    await generator.generateDocxFromHtml(normalHtml, normalPath, {
      ...docxOptions,
      includeHighlighting: false,
    });
    result.normal = normalPath;
  }

  return result;
}

/**
 * Generate PDF formats (normal and/or highlight)
 *
 * Uses the 3-phase pipeline approach: generates HTML once, then converts to PDF.
 * This avoids re-processing the markdown and ensures the PDF uses exactly the
 * same HTML that would be saved to disk.
 *
 * IMPORTANT: This function calls generatePdfFromHtml() to avoid double-conversion.
 * The old approach called generatePdf(markdown) which would regenerate HTML internally,
 * violating the 3-phase pipeline's "process once, output many" principle.
 *
 * When cachedHtml is provided, it will be reused instead of regenerating HTML,
 * achieving the ideal "process once, output many" architecture.
 *
 * @param processedResult - Processed result with cached content
 * @param options - Generation options
 * @param cachedHtml - Optional pre-generated HTML content to reuse
 * @returns Promise resolving to PDF file paths
 * @internal
 */
async function generatePdfFormats(
  processedResult: LegalMarkdownProcessorResult,
  options: FormatGenerationOptions,
  cachedHtml?: HtmlGenerationResult
): Promise<{ normal?: string; highlight?: string }> {
  const connector = options.pdfConnector ?? (await resolvePdfConnector('auto'));

  const { HtmlGenerator } = await import('../../extensions/generators/html-generator');

  const htmlGenerator = new HtmlGenerator();
  const result: { normal?: string; highlight?: string } = {};

  if (cachedHtml) {
    logger.debug(
      '[Phase 3] PDF generation using cached HTML from previous HTML generation - NO HTML regeneration!'
    );
  } else {
    logger.debug('[Phase 3] PDF generation starting - will generate HTML once per variant');
  }

  const htmlGeneratorOptions = {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath,
    title: options.title || options.baseFilename,
    metadata: processedResult.metadata,
  };

  // Extract version from metadata for PDF footer
  const version = processedResult.metadata?.version;

  const normalizedPdfFormat: PdfOptions['format'] = options.format === 'Letter' ? 'Letter' : 'A4';

  const pdfGenerationOptions: PdfOptions = {
    format: normalizedPdfFormat,
    margin: options.pdfMargin ?? {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
    landscape: options.landscape,
    footerTemplate: version
      ? `<div style="font-size:8px;width:100%;text-align:right;">${version}</div>`
      : undefined,
  };

  if (options.highlight) {
    // Generate both normal and highlight versions
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.pdf`);
    const highlightPath = path.join(options.outputDir, `${options.baseFilename}.HIGHLIGHT.pdf`);

    // Get or generate HTML for normal version
    const normalHtml =
      cachedHtml?.normal?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: false,
      }));

    // Convert pre-generated HTML to PDF (no re-processing!)
    await connector.generatePdf(normalHtml, normalPath, pdfGenerationOptions);
    result.normal = normalPath;

    // Get or generate HTML for highlight version
    const highlightHtml =
      cachedHtml?.highlight?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: true,
      }));

    // Convert pre-generated HTML to PDF (no re-processing!)
    await connector.generatePdf(highlightHtml, highlightPath, pdfGenerationOptions);
    result.highlight = highlightPath;
  } else {
    // Single normal version
    const normalPath = path.join(options.outputDir, `${options.baseFilename}.pdf`);

    // Get or generate HTML
    const normalHtml =
      cachedHtml?.normal?.content ||
      (await htmlGenerator.generateHtml(processedResult.content, {
        ...htmlGeneratorOptions,
        includeHighlighting: false,
      }));

    // Convert pre-generated HTML to PDF (no re-processing!)
    await connector.generatePdf(normalHtml, normalPath, pdfGenerationOptions);
    result.normal = normalPath;
  }

  return result;
}

/**
 * Generate Markdown format
 *
 * @param processedResult - Processed result with cached content
 * @param options - Generation options
 * @returns Promise resolving to Markdown file path
 * @internal
 */
async function generateMarkdownFormat(
  processedResult: LegalMarkdownProcessorResult,
  options: FormatGenerationOptions
): Promise<string> {
  const mdPath = path.join(options.outputDir, `${options.baseFilename}.md`);
  writeFileSync(mdPath, processedResult.content);
  return mdPath;
}

// Exported for testing - not part of public API
export {
  generateHtmlFormats as _generateHtmlFormats,
  generatePdfFormats as _generatePdfFormats,
  generateDocxFormats as _generateDocxFormats,
};
