/**
 * Base Processor Interface for Legal Markdown Processing Pipeline
 *
 * This module defines the fundamental interface that all processors in the Legal Markdown
 * pipeline must implement. It provides a standardized contract for processing steps,
 * enabling the pipeline manager to orchestrate document processing in a consistent manner.
 *
 * Features:
 * - Standardized processor interface
 * - Enable/disable logic per processor
 * - Consistent processing contract
 * - Pipeline orchestration support
 * - Backward compatibility with existing processors
 *
 * @example
 * ```typescript
 * import { BaseProcessor } from './base-processor';
 *
 * class MyCustomProcessor implements BaseProcessor {
 *   name = 'my-custom-processor';
 *
 *   isEnabled(options: LegalMarkdownOptions): boolean {
 *     return !options.noCustomProcessing;
 *   }
 *
 *   process(content: string, metadata: Record<string, any>, options: any): string {
 *     // Custom processing logic
 *     return processedContent;
 *   }
 * }
 * ```
 *
 * @module
 */

import { LegalMarkdownOptions } from '../../types';

/**
 * Base interface that all processors in the Legal Markdown pipeline must implement
 *
 * This interface ensures consistency across all processing steps and enables
 * the pipeline manager to coordinate document processing effectively.
 *
 * @interface BaseProcessor
 * @example
 * ```typescript
 * class MixinProcessor implements BaseProcessor {
 *   name = 'mixins';
 *
 *   isEnabled(options: LegalMarkdownOptions): boolean {
 *     return !options.noMixins;
 *   }
 *
 *   process(content: string, metadata: Record<string, any>, options: LegalMarkdownOptions): string {
 *     return processMixins(content, metadata, options);
 *   }
 * }
 * ```
 */
export interface BaseProcessor {
  /** Unique name identifier for this processor */
  readonly name: string;

  /**
   * Determines whether this processor should be executed based on the provided options
   *
   * @param options - The Legal Markdown processing options
   * @returns True if the processor should be executed, false otherwise
   * @example
   * ```typescript
   * // Processor that runs unless explicitly disabled
   * isEnabled(options: LegalMarkdownOptions): boolean {
   *   return !options.noMixins;
   * }
   *
   * // Processor that only runs when specific option is enabled
   * isEnabled(options: LegalMarkdownOptions): boolean {
   *   return options.enableAdvancedFeatures;
   * }
   * ```
   */
  isEnabled(options: LegalMarkdownOptions): boolean;

  /**
   * Processes the document content according to this processor's specific logic
   *
   * @param content - The document content to process
   * @param metadata - The document metadata (YAML front matter, etc.)
   * @param options - The Legal Markdown processing options
   * @returns The processed content
   * @throws {Error} When processing fails critically
   * @example
   * ```typescript
   * process(content: string, metadata: Record<string, any>, options: LegalMarkdownOptions): string {
   *   if (!this.isEnabled(options)) {
   *     return content; // Return unchanged if disabled
   *   }
   *
   *   try {
   *     return this.performProcessing(content, metadata, options);
   *   } catch (error) {
   *     console.warn(`Processor ${this.name} failed, returning original content:`, error);
   *     return content; // Graceful fallback
   *   }
   * }
   * ```
   */
  process(content: string, metadata: Record<string, any>, options: LegalMarkdownOptions): string;
}

/**
 * Abstract base class that provides common functionality for processors
 *
 * This class implements common patterns and provides utility methods that
 * most processors will need, reducing boilerplate code.
 *
 * @abstract
 * @class AbstractProcessor
 * @example
 * ```typescript
 * class MyProcessor extends AbstractProcessor {
 *   name = 'my-processor';
 *
 *   isEnabled(options: LegalMarkdownOptions): boolean {
 *     return !options.noMyProcessor;
 *   }
 *
 *   protected performProcessing(content: string, metadata: Record<string, any>, options: LegalMarkdownOptions): string {
 *     // Actual processing logic here
 *     return processedContent;
 *   }
 * }
 * ```
 */
export abstract class AbstractProcessor implements BaseProcessor {
  abstract readonly name: string;
  abstract isEnabled(options: LegalMarkdownOptions): boolean;

  /**
   * Template method that handles common processing patterns
   *
   * This method provides error handling, logging, and other common functionality,
   * delegating the actual processing to the performProcessing method.
   */
  process(content: string, metadata: Record<string, any>, options: LegalMarkdownOptions): string {
    if (!this.isEnabled(options)) {
      return content;
    }

    try {
      return this.performProcessing(content, metadata, options);
    } catch (error) {
      console.warn(`Processor '${this.name}' failed, returning original content:`, error);
      return content;
    }
  }

  /**
   * Abstract method where subclasses implement their specific processing logic
   *
   * @param content - The document content to process
   * @param metadata - The document metadata
   * @param options - The processing options
   * @returns The processed content
   * @protected
   */
  protected abstract performProcessing(
    content: string,
    metadata: Record<string, any>,
    options: LegalMarkdownOptions
  ): string;

  /**
   * Utility method to check if content has already been processed by another step
   *
   * This helps prevent double-processing and conflicts between processors.
   *
   * @param content - The content to check
   * @returns True if content appears to have been processed (contains spans, etc.)
   * @protected
   */
  protected hasBeenProcessed(content: string): boolean {
    return (
      content.includes('class="imported-value"') ||
      content.includes('class="legal-field imported-value"') ||
      content.includes('class="missing-value"') ||
      content.includes('class="legal-field missing-value"') ||
      content.includes('class="highlight"') ||
      content.includes('class="legal-field highlight"')
    );
  }

  /**
   * Utility method to log processing information in debug mode
   *
   * @param message - The message to log
   * @param data - Optional data to include in the log
   * @protected
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.name.toUpperCase()}] ${message}`, data || '');
    }
  }
}
