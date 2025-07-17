/**
 * Common interface for pandoc parsers
 */
export interface PandocParser {
  /**
   * Convert content from one format to another
   */
  convert(content: string, from: 'rst' | 'latex', to: 'markdown'): Promise<string>;
}

/**
 * Parser configuration options
 */
export interface PandocOptions {
  /**
   * Additional pandoc arguments
   */
  args?: string[];

  /**
   * Timeout for conversion in milliseconds
   */
  timeout?: number;

  /**
   * Enable verbose output
   */
  verbose?: boolean;
}
