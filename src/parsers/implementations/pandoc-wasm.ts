import { PandocParser, PandocOptions } from '../pandoc-parser';

/**
 * Pandoc WebAssembly implementation for browser
 */
export class PandocWasm implements PandocParser {
  private pandocWasm: any;
  private options: PandocOptions;

  constructor(pandocWasm: any, options: PandocOptions = {}) {
    this.pandocWasm = pandocWasm;
    this.options = {
      timeout: 10000, // 10 seconds default timeout
      verbose: false,
      ...options,
    };
  }

  /**
   * Convert content using pandoc-wasm
   */
  async convert(content: string, from: 'rst' | 'latex', to: 'markdown'): Promise<string> {
    if (!this.pandocWasm) {
      throw new Error('Pandoc WASM not initialized');
    }

    try {
      if (this.options.verbose) {
        console.log(`Converting ${from} to ${to} using pandoc-wasm`);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Pandoc WASM conversion timed out after ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      // Different pandoc-wasm versions have different APIs
      let conversionPromise: Promise<string>;

      if (typeof this.pandocWasm.convert === 'function') {
        // Direct convert method
        conversionPromise = Promise.resolve(this.pandocWasm.convert(content, from, to));
      } else if (typeof this.pandocWasm.pandoc === 'function') {
        // Pandoc function interface
        conversionPromise = Promise.resolve(this.pandocWasm.pandoc(content, { from, to }));
      } else if (typeof this.pandocWasm.run === 'function') {
        // Run interface with arguments
        const args = ['-f', from, '-t', to, '--wrap=none'];
        if (this.options.args) {
          args.push(...this.options.args);
        }
        conversionPromise = Promise.resolve(this.pandocWasm.run(args, content));
      } else {
        throw new Error('Unsupported pandoc-wasm API');
      }

      // Race between conversion and timeout
      const result = await Promise.race([conversionPromise, timeoutPromise]);

      return result;
    } catch (error: any) {
      throw new Error(`Pandoc WASM conversion failed: ${error.message}`);
    }
  }
}
