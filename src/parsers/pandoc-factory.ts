import { PandocParser, PandocOptions } from './pandoc-parser';
import { PandocLoader } from './pandoc-loader';
import { PandocNative } from './implementations/pandoc-native';
import { PandocWasm } from './implementations/pandoc-wasm';

/**
 * @fileoverview Pandoc Parser Factory for Cross-Platform Document Processing
 *
 * This module provides a factory pattern implementation for creating appropriate
 * Pandoc parser instances based on the runtime environment. It automatically
 * selects between native Pandoc (Node.js) and WASM-based Pandoc (browser)
 * implementations to enable document conversion across platforms.
 *
 * Features:
 * - Environment-aware parser selection (Node.js vs Browser)
 * - Native Pandoc integration for server-side processing
 * - WASM Pandoc support for client-side processing
 * - Graceful fallback handling when Pandoc is unavailable
 * - Lazy loading of WASM modules for performance
 * - Unified interface across different implementations
 *
 * @example
 * ```typescript
 * import { PandocFactory } from './pandoc-factory';
 *
 * // Create a parser instance appropriate for the environment
 * const parser = await PandocFactory.create({
 *   from: 'rst',
 *   to: 'json'
 * });
 *
 * if (parser) {
 *   const result = await parser.parse(content);
 * }
 * ```
 */

/**
 * Factory class for creating appropriate Pandoc parser instances
 *
 * Provides static methods to create Pandoc parser instances based on the
 * runtime environment, automatically choosing between native and WASM
 * implementations for optimal performance and compatibility.
 *
 * @class PandocFactory
 * @example
 * ```typescript
 * // Server-side usage (Node.js)
 * const nodeParser = await PandocFactory.create({ from: 'latex' });
 *
 * // Client-side usage (Browser)
 * const wasmParser = await PandocFactory.create({ from: 'rst' });
 * ```
 */
export class PandocFactory {
  /**
   * Creates a Pandoc parser instance based on the runtime environment
   *
   * Automatically selects the appropriate implementation:
   * - Node.js: Uses native Pandoc binary via child process
   * - Browser: Uses Pandoc WASM module for client-side processing
   * Returns null if no suitable parser can be created.
   *
   * @static
   * @async
   * @param {PandocOptions} [options={}] - Configuration options for the parser
   * @returns {Promise<PandocParser | null>} A promise that resolves to a parser instance or null
   * @example
   * ```typescript
   * // Create parser for RST to JSON conversion
   * const parser = await PandocFactory.create({
   *   from: 'rst',
   *   to: 'json'
   * });
   *
   * if (parser) {
   *   const ast = await parser.parse(rstContent);
   *   console.log('Parsed AST:', ast);
   * } else {
   *   console.log('Pandoc not available in this environment');
   * }
   * ```
   */
  static async create(options: PandocOptions = {}): Promise<PandocParser | null> {
    if (typeof window === 'undefined') {
      // Node.js environment - use native pandoc
      return new PandocNative(options);
    } else {
      // Browser environment - try to load pandoc-wasm
      const pandocWasm = PandocLoader.getPandocWasm();

      if (pandocWasm) {
        return new PandocWasm(pandocWasm, options);
      } else {
        // Try to load pandoc-wasm if not already loaded
        const loaded = await PandocLoader.loadIfNeeded('# dummy content to trigger loading');
        if (loaded) {
          const wasmInstance = PandocLoader.getPandocWasm();
          if (wasmInstance) {
            return new PandocWasm(wasmInstance, options);
          }
        }
        return null;
      }
    }
  }

  /**
   * Create parser for specific content if pandoc is available
   */
  static async createForContent(
    content: string,
    options: PandocOptions = {}
  ): Promise<PandocParser | null> {
    // Try to load pandoc only if content needs it
    const loaded = await PandocLoader.loadIfNeeded(content);

    if (!loaded) {
      return null;
    }

    return this.create(options);
  }

  /**
   * Check if pandoc is available in current environment
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const parser = await this.create();
      return parser !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get environment info for debugging
   */
  static getEnvironmentInfo(): {
    environment: 'node' | 'browser';
    pandocWasmLoaded: boolean;
    pandocWasmInstance: any;
  } {
    const environment = typeof window === 'undefined' ? 'node' : 'browser';
    const pandocWasmInstance = PandocLoader.getPandocWasm();
    const pandocWasmLoaded = pandocWasmInstance !== null;

    return {
      environment,
      pandocWasmLoaded,
      pandocWasmInstance,
    };
  }
}
