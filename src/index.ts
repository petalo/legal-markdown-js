/**
 * Main Entry Point for Legal Markdown Processing Library
 *
 * This module provides the primary API for processing Legal Markdown documents
 * with support for YAML front matter, cross-references, optional clauses, mixins,
 * header processing, and multi-format output generation (HTML, PDF).
 *
 * Features:
 * - YAML front matter parsing and metadata extraction
 * - Cross-reference processing and resolution
 * - Optional clause conditional rendering
 * - Mixin system for reusable content blocks
 * - Header numbering and formatting
 * - Field tracking for document highlighting
 * - HTML and PDF generation with styling
 * - RST and LaTeX preprocessing support
 * - Metadata export capabilities
 *
 * @example
 * ```typescript
 * import { processLegalMarkdown, generateHtml, generatePdf } from 'legal-markdown-js';
 *
 * // Basic document processing
 * const result = processLegalMarkdown(content, {
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

import { parseYamlFrontMatter } from './core/parsers/yaml-parser';
import { processHeaders } from './core/processors/header-processor';
import { processOptionalClauses } from './core/processors/clause-processor';
import { processCrossReferences } from './core/processors/reference-processor';
import { processPartialImports } from './core/processors/import-processor';
import { processMixins } from './extensions/ast-mixin-processor';
import { processTemplateLoops } from './extensions/template-loops';
import { exportMetadata } from './core/exporters/metadata-exporter';
import { convertRstToLegalMarkdownSync, convertRstToLegalMarkdown } from './extensions/rst-parser';
import {
  convertLatexToLegalMarkdownSync,
  convertLatexToLegalMarkdown,
} from './extensions/latex-parser';
import { fieldTracker } from './extensions/tracking/field-tracker';
import { htmlGenerator } from './extensions/generators/html-generator';
import { pdfGenerator } from './extensions/generators/pdf-generator';
import { LegalMarkdownOptions } from './types';
import { createDefaultPipeline, createHtmlPipeline } from './extensions/pipeline/pipeline-config';
import path from 'path';
import { getCurrentDir } from './utils/esm-utils.js';

// ESM/CJS compatible directory resolution
const currentDir = getCurrentDir();

/**
 * Main function to process a Legal Markdown document (async version)
 *
 * This function orchestrates the complete processing pipeline for Legal Markdown
 * documents, including YAML parsing, content preprocessing, clause processing,
 * cross-reference resolution, mixin expansion, header formatting, and metadata export.
 *
 * @param {string} content - The raw Legal Markdown content to process
 * @param {LegalMarkdownOptions} [options={}] - Configuration options for processing
 * @returns {Promise<Object>} Processing result containing processed content, metadata, and reports
 * @returns {string} returns.content - The processed document content
 * @returns {Record<string, any>} [returns.metadata] - Extracted YAML metadata
 * @returns {string[]} [returns.exportedFiles] - Array of exported metadata files
 * @returns {Object} [returns.fieldReport] - Field tracking report if enabled
 * @example
 * ```typescript
 * const result = await processLegalMarkdownAsync(content, {
 *   enableFieldTracking: true,
 *   basePath: './documents',
 *   noClauses: false,
 *   noReferences: false
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // YAML front matter
 * console.log(result.fieldReport); // Field usage report
 * ```
 */
export async function processLegalMarkdownAsync(
  content: string,
  options: LegalMarkdownOptions = {}
): Promise<{
  content: string;
  metadata?: Record<string, any>;
  exportedFiles?: string[];
  fieldReport?: ReturnType<typeof fieldTracker.generateReport>;
}> {
  try {
    // Use the new pipeline system for processing
    const pipeline = createDefaultPipeline();
    const metadata: Record<string, any> = {};

    const pipelineOptions = {
      legalMarkdownOptions: options,
      enableStepProfiling: process.env.NODE_ENV === 'development',
    };

    const result = await pipeline.execute(content, metadata, pipelineOptions);

    if (!result.success) {
      console.warn('Pipeline execution had errors, falling back to legacy processing');
      return processLegalMarkdownLegacy(content, options);
    }

    // Convert pipeline result to expected format
    return {
      content: result.content,
      metadata: result.metadata,
      exportedFiles: result.exportedFiles || [],
      fieldReport: result.fieldReport,
    };
  } catch (error) {
    console.warn('Pipeline system failed, falling back to legacy processing:', error);
    return processLegalMarkdownLegacy(content, options);
  }
}

/**
 * Legacy processing function as fallback
 *
 * This function contains the original processing logic and serves as a
 * reliable fallback if the new pipeline system encounters issues.
 */
async function processLegalMarkdownLegacy(
  content: string,
  options: LegalMarkdownOptions = {}
): Promise<{
  content: string;
  metadata?: Record<string, any>;
  exportedFiles?: string[];
  fieldReport?: ReturnType<typeof fieldTracker.generateReport>;
}> {
  // Clear field tracker for new document
  fieldTracker.clear();
  // Convert RST or LaTeX to legal markdown if needed (before YAML parsing)
  let preprocessedContent = await convertRstToLegalMarkdown(content);
  preprocessedContent = await convertLatexToLegalMarkdown(preprocessedContent);

  // Parse YAML Front Matter
  const { content: contentWithoutYaml, metadata } = parseYamlFrontMatter(
    preprocessedContent,
    options.throwOnYamlError
  );

  // If only processing YAML, return early
  if (options.yamlOnly) {
    return { content: contentWithoutYaml, metadata };
  }

  // Process partial imports (must be done early)
  let processedContent = contentWithoutYaml;
  let exportedFiles: string[] = [];

  if (!options.noImports) {
    const importResult = processPartialImports(
      processedContent,
      options.basePath,
      metadata,
      options
    );
    processedContent = importResult.content;
    exportedFiles = importResult.importedFiles;

    // Merge imported frontmatter unless explicitly disabled
    if (options.disableFrontmatterMerge !== true && importResult.mergedMetadata) {
      Object.assign(metadata, importResult.mergedMetadata);
    }
  }

  // Process optional clauses
  if (!options.noClauses) {
    processedContent = processOptionalClauses(processedContent, metadata);
  }

  // Process cross references
  if (!options.noReferences) {
    processedContent = processCrossReferences(processedContent, metadata);
  }

  // Process mixins first (AST-based, no contamination)
  if (!options.noMixins) {
    processedContent = processMixins(processedContent, metadata, options);
  }

  // Process template loops after mixins (now separated from mixin processor)
  processedContent = processTemplateLoops(
    processedContent,
    metadata,
    undefined,
    options.enableFieldTrackingInMarkdown || false
  );

  // Process headers (numbering, etc)
  if (!options.noHeaders) {
    processedContent = processHeaders(processedContent, metadata, {
      noReset: options.noReset,
      noIndent: options.noIndent,
      enableFieldTrackingInMarkdown: options.enableFieldTrackingInMarkdown,
    });
  }

  // Export metadata if requested or specified in metadata
  if (
    options.exportMetadata ||
    (metadata as any)['meta-yaml-output'] ||
    (metadata as any)['meta-json-output']
  ) {
    const exportResult = exportMetadata(metadata, options.exportFormat, options.exportPath);
    exportedFiles = [...exportedFiles, ...exportResult.exportedFiles];
  }

  // Apply field tracking to content if highlighting is enabled
  // NOTE: This applies post-processing field tracking for HTML/PDF output
  // Individual processors use enableFieldTrackingInMarkdown for markdown output
  // Skip if enableFieldTrackingInMarkdown is true (already processed by AST processor)
  if (options.enableFieldTracking && !options.enableFieldTrackingInMarkdown) {
    processedContent = fieldTracker.applyFieldTracking(processedContent);
  }

  return {
    content: processedContent,
    metadata,
    exportedFiles,
    fieldReport: options.enableFieldTracking ? fieldTracker.generateReport() : undefined,
  };
}

/**
 * Main function to process a Legal Markdown document (sync version with fallback)
 *
 * This function uses the legacy processing approach to maintain synchronous operation.
 * For better performance, debugging, and features, consider using the async version
 * `processLegalMarkdownAsync` which uses the new pipeline system.
 *
 * @param {string} content - The raw Legal Markdown content to process
 * @param {LegalMarkdownOptions} [options={}] - Configuration options for processing
 * @returns {Object} Processing result containing processed content, metadata, and reports
 * @returns {string} returns.content - The processed document content
 * @returns {Record<string, any>} [returns.metadata] - Extracted YAML metadata
 * @returns {string[]} [returns.exportedFiles] - Array of exported metadata files
 * @returns {Object} [returns.fieldReport] - Field tracking report if enabled
 * @example
 * ```typescript
 * const result = processLegalMarkdown(content, {
 *   enableFieldTracking: true,
 *   basePath: './documents',
 *   noClauses: false,
 *   noReferences: false
 * });
 *
 * console.log(result.content); // Processed markdown
 * console.log(result.metadata); // YAML front matter
 * console.log(result.fieldReport); // Field usage report
 * ```
 */
export function processLegalMarkdown(
  content: string,
  options: LegalMarkdownOptions = {}
): {
  content: string;
  metadata?: Record<string, any>;
  exportedFiles?: string[];
  fieldReport?: ReturnType<typeof fieldTracker.generateReport>;
} {
  // Clear field tracker for new document
  fieldTracker.clear();
  // Convert RST or LaTeX to legal markdown if needed (before YAML parsing)
  let preprocessedContent = convertRstToLegalMarkdownSync(content);
  preprocessedContent = convertLatexToLegalMarkdownSync(preprocessedContent);

  // Parse YAML Front Matter
  const { content: contentWithoutYaml, metadata } = parseYamlFrontMatter(
    preprocessedContent,
    options.throwOnYamlError
  );

  // If only processing YAML, return early
  if (options.yamlOnly) {
    return { content: contentWithoutYaml, metadata };
  }

  // Process partial imports (must be done early)
  let processedContent = contentWithoutYaml;
  let exportedFiles: string[] = [];

  if (!options.noImports) {
    const importResult = processPartialImports(
      processedContent,
      options.basePath,
      metadata,
      options
    );
    processedContent = importResult.content;
    exportedFiles = importResult.importedFiles;

    // Merge imported frontmatter unless explicitly disabled
    if (options.disableFrontmatterMerge !== true && importResult.mergedMetadata) {
      Object.assign(metadata, importResult.mergedMetadata);
    }
  }

  // Process optional clauses
  if (!options.noClauses) {
    processedContent = processOptionalClauses(processedContent, metadata);
  }

  // Process cross references
  if (!options.noReferences) {
    processedContent = processCrossReferences(processedContent, metadata);
  }

  // Process mixins first (AST-based, no contamination)
  if (!options.noMixins) {
    processedContent = processMixins(processedContent, metadata, options);
  }

  // Process template loops after mixins (now separated from mixin processor)
  processedContent = processTemplateLoops(
    processedContent,
    metadata,
    undefined,
    options.enableFieldTrackingInMarkdown || false
  );

  // Process headers (numbering, etc)
  if (!options.noHeaders) {
    processedContent = processHeaders(processedContent, metadata, {
      noReset: options.noReset,
      noIndent: options.noIndent,
      enableFieldTrackingInMarkdown: options.enableFieldTrackingInMarkdown,
    });
  }

  // Export metadata if requested or specified in metadata
  if (options.exportMetadata || metadata['meta-yaml-output'] || metadata['meta-json-output']) {
    // Use exportPath if specified, otherwise fall back to basePath for better relative path resolution
    const effectiveExportPath = options.exportPath || options.basePath;
    const exportResult = exportMetadata(metadata, options.exportFormat, effectiveExportPath);
    exportedFiles = [...exportedFiles, ...exportResult.exportedFiles];
  }

  // Apply field tracking to content if highlighting is enabled
  // NOTE: This applies post-processing field tracking for HTML/PDF output
  // Individual processors use enableFieldTrackingInMarkdown for markdown output
  // Skip if enableFieldTrackingInMarkdown is true (already processed by AST processor)
  if (options.enableFieldTracking && !options.enableFieldTrackingInMarkdown) {
    processedContent = fieldTracker.applyFieldTracking(processedContent);
  }

  return {
    content: processedContent,
    metadata,
    exportedFiles,
    fieldReport: options.enableFieldTracking ? fieldTracker.generateReport() : undefined,
  };
}

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
    // Use HTML-optimized pipeline for better performance and field tracking
    // Field tracking is always enabled for HTML generation
    const pipeline = createHtmlPipeline({
      enableFieldTracking: true,
      includeHighlighting: options.includeHighlighting,
    });

    const metadata: Record<string, any> = {};

    const pipelineOptions = {
      legalMarkdownOptions: {
        ...options,
        enableFieldTracking: true,
        enableFieldTrackingInMarkdown: true, // Always enabled for HTML generation (structure)
        _htmlGeneration: true, // Flag to indicate HTML generation context
      },
      enableStepProfiling: process.env.NODE_ENV === 'development',
    };

    const result = await pipeline.execute(content, metadata, pipelineOptions);

    if (!result.success) {
      console.warn('HTML pipeline failed, falling back to legacy processing');
      return generateHtmlLegacy(content, options);
    }

    // Generate HTML using the processed content
    return htmlGenerator.generateHtml(result.content, {
      cssPath: options.cssPath,
      highlightCssPath:
        options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
      includeHighlighting: options.includeHighlighting,
      title: options.title,
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
  const processed = await processLegalMarkdownAsync(content, {
    ...options,
    enableFieldTracking: true,
    enableFieldTrackingInMarkdown: true, // Always enabled for HTML legacy generation (structure)
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
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
  } = {}
): Promise<Buffer> {
  try {
    // Use PDF-optimized pipeline (same as HTML pipeline for now)
    // Field tracking is always enabled for PDF generation
    const pipeline = createHtmlPipeline({
      enableFieldTracking: true,
      includeHighlighting: options.includeHighlighting,
    });

    const metadata: Record<string, any> = {};

    const pipelineOptions = {
      legalMarkdownOptions: {
        ...options,
        enableFieldTracking: true,
        enableFieldTrackingInMarkdown: true, // Always enabled for PDF generation (structure)
        _htmlGeneration: true, // Flag to indicate PDF generation context
      },
      enableStepProfiling: process.env.NODE_ENV === 'development',
    };

    const result = await pipeline.execute(content, metadata, pipelineOptions);

    if (!result.success) {
      console.warn('PDF pipeline failed, falling back to legacy processing');
      return generatePdfLegacy(content, outputPath, options);
    }

    // Generate PDF using the processed content
    return pdfGenerator.generatePdf(result.content, outputPath, {
      cssPath: options.cssPath,
      highlightCssPath:
        options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
      includeHighlighting: options.includeHighlighting,
      title: options.title,
      metadata: result.metadata,
      format: options.format,
      landscape: options.landscape,
    });
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
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    includeHighlighting?: boolean;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
  } = {}
): Promise<Buffer> {
  // Process the legal markdown first (use async version for better RST/LaTeX support)
  const processed = await processLegalMarkdownAsync(content, {
    ...options,
    enableFieldTracking: true,
    enableFieldTrackingInMarkdown: true, // Always enabled for PDF legacy generation (structure)
  });

  // Generate PDF
  return pdfGenerator.generatePdf(processed.content, outputPath, {
    cssPath: options.cssPath,
    highlightCssPath:
      options.highlightCssPath || path.join(process.cwd(), 'src/styles/highlight.css'),
    includeHighlighting: options.includeHighlighting,
    title: options.title,
    metadata: processed.metadata,
    format: options.format,
    landscape: options.landscape,
  });
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
  options: LegalMarkdownOptions & {
    cssPath?: string;
    highlightCssPath?: string;
    title?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
  } = {}
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

// Remark-based processing functions
export {
  processLegalMarkdownWithRemark,
  processLegalMarkdownWithRemarkSync,
} from './extensions/remark/legal-markdown-processor';

/**
 * Wrapper function that provides legacy API compatibility with remark processing
 *
 * This function bridges the gap between the legacy `processLegalMarkdown` interface
 * and the new remark-based processor. It maintains 100% API compatibility while
 * internally using the modern remark pipeline.
 *
 * @param content - The raw Legal Markdown content to process
 * @param options - Legacy LegalMarkdownOptions (will be mapped to remark options)
 * @returns Processing result in legacy format
 */
