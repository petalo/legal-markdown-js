/**
 * TypeScript interfaces for Interactive CLI
 *
 * This module defines the core data structures used throughout the interactive
 * CLI for representing user selections, configuration options, and file metadata.
 */

/**
 * Output format selection configuration
 *
 * Represents which output formats the user has selected for document generation.
 * Multiple formats can be selected simultaneously for comprehensive output.
 */
export interface OutputFormat {
  /** Generate HTML output with CSS styling support */
  html: boolean;
  /** Generate PDF output with professional formatting */
  pdf: boolean;
  /** Generate processed Markdown output */
  markdown: boolean;
  /** Export document metadata as JSON/YAML */
  metadata: boolean;
}

/**
 * Processing options configuration
 *
 * Defines additional processing features that can be enabled based on
 * the selected output formats and user preferences.
 */
export interface ProcessingOptions {
  /** Enable debug mode with verbose logging */
  debug: boolean;
  /** Include field tracking information in Markdown output */
  fieldTracking: boolean;
  /** Enable field highlighting in HTML/PDF output */
  highlight: boolean;
}

/**
 * Complete interactive configuration
 *
 * Represents the full configuration collected from the user during
 * the interactive flow, ready to be passed to the processing service.
 */
export interface InteractiveConfig {
  /** Absolute path to the selected input document */
  inputFile: string;
  /** Base filename for generated output files */
  outputFilename: string;
  /** Selected output formats configuration */
  outputFormats: OutputFormat;
  /** Processing options configuration */
  processingOptions: ProcessingOptions;
  /** Optional path to CSS file for styling HTML/PDF output */
  cssFile?: string;
}

/**
 * File system item representation
 *
 * Represents a file or directory item discovered during file scanning,
 * used for building selection menus and navigation.
 */
export interface FileItem {
  /** Display name of the file or directory */
  name: string;
  /** Absolute path to the file or directory */
  path: string;
  /** Type indicator for menu rendering and behavior */
  type: 'file' | 'directory';
}
