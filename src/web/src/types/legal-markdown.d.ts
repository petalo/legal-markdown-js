export interface ProcessingOptions {
  basePath?: string;
  enableFieldTracking?: boolean;
  debug?: boolean;
  yamlOnly?: boolean;
  noHeaders?: boolean;
  noClauses?: boolean;
  noReferences?: boolean;
  noImports?: boolean;
  noMixins?: boolean;
  noReset?: boolean;
  noIndent?: boolean;
  throwOnYamlError?: boolean;
  exportMetadata?: boolean;
  exportFormat?: 'yaml' | 'json';
}

export interface TrackedField {
  name: string;
  status: 'filled' | 'empty' | 'logic' | 'declared';
  value?: unknown;
  originalValue?: unknown;
  hasLogic: boolean;
  mixinUsed?: string;
}

export interface FieldReport {
  totalFields: number;
  uniqueFields: number;
  fields: Map<string, TrackedField>;
}

export interface ProcessingStats {
  processingTime: number;
  pluginsUsed: string[];
  crossReferencesFound: number;
  fieldsTracked: number;
}

export interface ProcessingResult {
  content: string;
  metadata?: Record<string, unknown>;
  fieldReport?: FieldReport;
  stats?: ProcessingStats;
  warnings?: string[];
}

export interface LegalMarkdownLib {
  processLegalMarkdownAsync(
    content: string,
    options?: ProcessingOptions
  ): Promise<ProcessingResult>;

  /** Convert processed markdown to an HTML body fragment */
  markdownToHtmlBody(markdown: string): string;

  /** Prettify HTML with consistent indentation */
  formatHtml(html: string): string;

  /** Wrap HTML body in a complete HTML5 document with embedded CSS */
  wrapHtmlDocument(body: string, css: string, title: string): string;

  /** Generate a DOCX buffer from HTML body and CSS strings - browser-safe */
  generateDocxBuffer(
    html: string,
    css: string,
    options?: { title?: string; format?: 'A4' | 'Letter' | 'Legal'; landscape?: boolean }
  ): Promise<Uint8Array>;
}

declare global {
  interface Window {
    LegalMarkdown: LegalMarkdownLib;
  }
}
