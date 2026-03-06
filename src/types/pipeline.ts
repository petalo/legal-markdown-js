import type { LegalMarkdownOptions, YamlValue } from '../types';

export interface ProcessingContext {
  content: string;
  rawContent: string;
  metadata: Record<string, YamlValue>;
  options: ProcessingOptions;
  basePath: string;
}

export interface ProcessingOptions extends LegalMarkdownOptions {
  verbose?: boolean;
  pdf?: boolean;
  html?: boolean;
  docx?: boolean;
  highlight?: boolean;
  css?: string;
  title?: string;
  archiveSource?: string | boolean;
  toMarkdown?: boolean;
  exportYaml?: boolean;
  exportJson?: boolean;
  output?: string;
  outputPath?: string;
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  additionalMetadata?: Record<string, YamlValue>;
  includeHighlighting?: boolean;
  cssPath?: string;
  highlightCssPath?: string;
  silent?: boolean;
  enableFieldTrackingInMarkdown?: boolean;
  astFieldTracking?: boolean;
  logicBranchHighlighting?: boolean;
  autoPopulateHeaders?: boolean;
}
