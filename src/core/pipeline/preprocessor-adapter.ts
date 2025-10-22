/**
 * Preprocessor Adapter Pattern
 *
 * Generic interface and utilities for wrapping string-based preprocessors
 * as remark plugins. This allows gradual migration from string-based to
 * AST-based processing while maintaining compatibility.
 *
 * @module preprocessor-adapter
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';

/**
 * Preprocessor Adapter Interface
 *
 * Generic interface for wrapping string-based preprocessors as remark plugins.
 * This allows gradual migration from string-based to AST-based processing.
 *
 * @template TOptions - Type of options specific to this preprocessor
 */
export interface PreprocessorAdapter<TOptions = unknown> {
  /** Name of the preprocessor (for logging and debugging) */
  name: string;

  /**
   * Execute the preprocessor on string content
   *
   * @param content - Content as string
   * @param metadata - Document metadata
   * @param options - Preprocessor-specific options
   * @returns Processed content as string
   */
  execute(content: string, metadata: Record<string, unknown>, options: TOptions): string;
}

/**
 * Options for wrapped preprocessor plugins
 */
export interface PreprocessorPluginOptions {
  /** Enable debug logging */
  debug?: boolean;

  /** Document metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Wrap a preprocessor adapter as a remark plugin
 *
 * This is the GENERIC PATTERN for integrating string-based processing
 * into the remark AST pipeline. The pattern:
 *
 * 1. Serialize the AST to markdown string
 * 2. Execute the string-based preprocessor
 * 3. Parse the result back to AST
 * 4. Replace the original tree
 *
 * @param adapter - Preprocessor adapter to wrap
 * @returns Remark plugin function
 *
 * @example
 * ```typescript
 * const myAdapter: PreprocessorAdapter = {
 *   name: 'myPreprocessor',
 *   execute: (content, metadata, options) => {
 *     return content.replace(/foo/g, 'bar');
 *   }
 * };
 *
 * const myRemarkPlugin = wrapPreprocessor(myAdapter);
 *
 * processor.use(myRemarkPlugin, {
 *   metadata: { foo: 'bar' },
 *   debug: true
 * });
 * ```
 */
export function wrapPreprocessor<TOptions = unknown>(adapter: PreprocessorAdapter<TOptions>) {
  return function remarkPreprocessorPlugin(
    options: TOptions & PreprocessorPluginOptions = {} as TOptions & PreprocessorPluginOptions
  ) {
    return (tree: Root) => {
      if (options.debug) {
        console.log(`[${adapter.name}] Running preprocessor`);
      }

      // Step 1: Serialize AST to string
      const stringifier = unified().use(remarkStringify);
      const content = String(stringifier.stringify(tree));

      if (options.debug) {
        console.log(`[${adapter.name}] Input length: ${content.length} chars`);
      }

      // Step 2: Execute preprocessor
      const processed = adapter.execute(content, options.metadata || {}, options);

      if (options.debug) {
        console.log(`[${adapter.name}] Output length: ${processed.length} chars`);
      }

      // Step 3: Parse result back to AST
      const parser = unified().use(remarkParse);
      const newTree = parser.parse(processed) as Root;

      // Step 4: Replace original tree with processed tree
      // Copy properties to maintain tree structure
      tree.children = newTree.children;

      if (options.debug) {
        console.log(`[${adapter.name}] Tree replaced with ${tree.children.length} children`);
      }
    };
  };
}
