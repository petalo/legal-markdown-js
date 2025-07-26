/**
 * @fileoverview Main Entry Point for Legal Markdown Processing Library
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

import { parseYamlFrontMatter } from '@core/parsers/yaml-parser';
import { processHeaders } from '@core/processors/header-processor';
import { processOptionalClauses } from '@core/processors/clause-processor';
import { processCrossReferences } from '@core/processors/reference-processor';
import { processPartialImports } from '@core/processors/import-processor';
import { processMixins } from '@core/processors/mixin-processor';
import { exportMetadata } from '@core/exporters/metadata-exporter';
import { convertRstToLegalMarkdownSync, convertRstToLegalMarkdown } from '@extensions/rst-parser';
import {
  convertLatexToLegalMarkdownSync,
  convertLatexToLegalMarkdown,
} from '@extensions/latex-parser';
import { fieldTracker } from './tracking/field-tracker';
import { htmlGenerator } from './generators/html-generator';
import { pdfGenerator } from './generators/pdf-generator';
import { LegalMarkdownOptions } from '@types';
import path from 'path';

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
    const importResult = processPartialImports(processedContent, options.basePath);
    processedContent = importResult.content;
    exportedFiles = importResult.importedFiles;
  }

  // Process optional clauses
  if (!options.noClauses) {
    processedContent = processOptionalClauses(processedContent, metadata);
  }

  // Process cross references
  if (!options.noReferences) {
    processedContent = processCrossReferences(processedContent, metadata);
  }

  // Process mixins
  if (!options.noMixins) {
    processedContent = processMixins(processedContent, metadata, options);
  }

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
    const exportResult = exportMetadata(metadata, options.exportFormat, options.exportPath);
    exportedFiles = [...exportedFiles, ...exportResult.exportedFiles];
  }

  // Apply field tracking to content if highlighting is enabled
  // NOTE: This applies post-processing field tracking for HTML/PDF output
  // Individual processors use enableFieldTrackingInMarkdown for markdown output
  if (options.enableFieldTracking) {
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
 * This function uses fallback parsers for RST/LaTeX to maintain backward compatibility
 * and ensure the library works without pandoc dependencies.
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
    const importResult = processPartialImports(processedContent, options.basePath);
    processedContent = importResult.content;
    exportedFiles = importResult.importedFiles;
  }

  // Process optional clauses
  if (!options.noClauses) {
    processedContent = processOptionalClauses(processedContent, metadata);
  }

  // Process cross references
  if (!options.noReferences) {
    processedContent = processCrossReferences(processedContent, metadata);
  }

  // Process mixins
  if (!options.noMixins) {
    processedContent = processMixins(processedContent, metadata, options);
  }

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
    const exportResult = exportMetadata(metadata, options.exportFormat, options.exportPath);
    exportedFiles = [...exportedFiles, ...exportResult.exportedFiles];
  }

  // Apply field tracking to content if highlighting is enabled
  // NOTE: This applies post-processing field tracking for HTML/PDF output
  // Individual processors use enableFieldTrackingInMarkdown for markdown output
  if (options.enableFieldTracking) {
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
 * @async
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
  // Process the legal markdown first (use async version for better RST/LaTeX support)
  const processed = await processLegalMarkdownAsync(content, {
    ...options,
    enableFieldTracking: options.includeHighlighting,
  });

  // Generate HTML
  return htmlGenerator.generateHtml(processed.content, {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath || path.join(__dirname, 'styles/highlight.css'),
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
 * @async
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
  // Process the legal markdown first (use async version for better RST/LaTeX support)
  const processed = await processLegalMarkdownAsync(content, {
    ...options,
    enableFieldTracking: options.includeHighlighting,
  });

  // Generate PDF
  return pdfGenerator.generatePdf(processed.content, outputPath, {
    cssPath: options.cssPath,
    highlightCssPath: options.highlightCssPath || path.join(__dirname, 'styles/highlight.css'),
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
 * @async
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
export * from '@types';
export * from '@core';
export * from '@errors';
export * from '@constants';
export * from '@lib';
export * from '@extensions';
export { fieldTracker } from './tracking/field-tracker';
export { htmlGenerator } from './generators/html-generator';
export { pdfGenerator } from './generators/pdf-generator';
