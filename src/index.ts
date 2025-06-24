import { parseYamlFrontMatter } from './core/parsers/yaml-parser';
import { processHeaders } from './core/processors/header-processor';
import { processOptionalClauses } from './core/processors/clause-processor';
import { processCrossReferences } from './core/processors/reference-processor';
import { processPartialImports } from './core/processors/import-processor';
import { exportMetadata } from './core/exporters/metadata-exporter';
import { LegalMarkdownOptions } from './types';

/**
 * Main function to process a LegalMarkdown document
 * 
 * @param content - The content of the document to process
 * @param options - Processing options
 * @returns The processed document
 */
export function processLegalMarkdown(
  content: string,
  options: LegalMarkdownOptions = {}
): { 
  content: string; 
  metadata?: Record<string, any>;
  exportedFiles?: string[];
} {
  // Parse YAML Front Matter
  const { content: contentWithoutYaml, metadata } = parseYamlFrontMatter(content, options.throwOnYamlError);
  
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
  
  // Process headers (numbering, etc)
  if (!options.noHeaders) {
    processedContent = processHeaders(processedContent, metadata);
  }
  
  // Export metadata if requested or specified in metadata
  if (options.exportMetadata || 
      metadata['meta-yaml-output'] || 
      metadata['meta-json-output']) {
    const exportResult = exportMetadata(metadata, options.exportFormat, options.exportPath);
    exportedFiles = [...exportedFiles, ...exportResult.exportedFiles];
  }
  
  return {
    content: processedContent,
    metadata,
    exportedFiles
  };
}

// Export all sub-modules
export * from './types';
export * from './core';