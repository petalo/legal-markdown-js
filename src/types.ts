/**
 * Options for processing a LegalMarkdown document
 */
export interface LegalMarkdownOptions {
  /**
   * Base path for resolving imports
   */
  basePath?: string;
  
  /**
   * Process only YAML front matter
   */
  yamlOnly?: boolean;
  
  /**
   * Skip processing headers
   */
  noHeaders?: boolean;
  
  /**
   * Skip processing optional clauses
   */
  noClauses?: boolean;
  
  /**
   * Skip processing cross references
   */
  noReferences?: boolean;
  
  /**
   * Skip processing imports
   */
  noImports?: boolean;
  
  /**
   * Export metadata to a file
   */
  exportMetadata?: boolean;
  
  /**
   * Format for metadata export (yaml or json)
   */
  exportFormat?: 'yaml' | 'json';
  
  /**
   * Path for metadata export
   */
  exportPath?: string;
  
  /**
   * Enable debug mode
   */
  debug?: boolean;
  
  /**
   * Throw errors on invalid YAML instead of handling gracefully
   */
  throwOnYamlError?: boolean;
}

/**
 * Structure for YAML Front Matter parsing result
 */
export interface YamlParsingResult {
  /**
   * Content without the YAML front matter
   */
  content: string;
  
  /**
   * Parsed metadata from YAML front matter
   */
  metadata: Record<string, any>;
}

/**
 * Structure for header processing options from metadata
 */
export interface HeaderOptions {
  /**
   * Format for level one headers
   */
  levelOne?: string;
  
  /**
   * Format for level two headers
   */
  levelTwo?: string;
  
  /**
   * Format for level three headers
   */
  levelThree?: string;
  
  /**
   * Format for level four headers
   */
  levelFour?: string;
  
  /**
   * Format for level five headers
   */
  levelFive?: string;
  
  /**
   * Indentation level for headers
   */
  levelIndent?: number;
}

/**
 * Structure for import processing result
 */
export interface ImportProcessingResult {
  /**
   * Content with imports processed
   */
  content: string;
  
  /**
   * List of imported files
   */
  importedFiles: string[];
}

/**
 * Structure for metadata export result
 */
export interface MetadataExportResult {
  /**
   * List of exported files
   */
  exportedFiles: string[];
}