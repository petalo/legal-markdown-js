import { ContentDetector } from './content-detector';

/**
 * Dynamic pandoc loader with conditional loading
 */
export class PandocLoader {
  private static pandocWasm: any = null;
  private static loadingPromise: Promise<any> | null = null;

  /**
   * Loads pandoc only if content needs it
   */
  static async loadIfNeeded(content: string): Promise<boolean> {
    if (!ContentDetector.needsPandoc(content)) {
      return false; // No necesita pandoc
    }

    if (typeof window === 'undefined') {
      // Node.js environment - assume pandoc is available
      return true;
    }

    // Browser environment - load pandoc-wasm
    if (this.pandocWasm) {
      return true; // Already loaded
    }

    if (this.loadingPromise) {
      // Loading in progress, wait for it
      try {
        await this.loadingPromise;
        return this.pandocWasm !== null;
      } catch (error) {
        return false;
      }
    }

    // Start loading
    this.loadingPromise = this.loadPandocWasm();

    try {
      this.pandocWasm = await this.loadingPromise;
      return true;
    } catch (error) {
      console.warn('Failed to load pandoc-wasm:', error);
      return false;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Get loaded pandoc instance
   */
  static getPandocWasm(): any {
    return this.pandocWasm;
  }

  /**
   * Load pandoc-wasm module
   */
  private static async loadPandocWasm(): Promise<any> {
    try {
      // Dynamic import for pandoc-wasm
      const pandocModule = await import('pandoc-wasm');

      // Initialize pandoc-wasm - different pandoc-wasm versions have different APIs
      if (typeof (pandocModule as any).init === 'function') {
        return await (pandocModule as any).init();
      } else if (typeof (pandocModule as any).default === 'function') {
        return await (pandocModule as any).default();
      } else if (
        typeof (pandocModule as any).default === 'object' &&
        (pandocModule as any).default.convert
      ) {
        return (pandocModule as any).default;
      } else {
        return pandocModule;
      }
    } catch (error: any) {
      throw new Error(`Failed to load pandoc-wasm: ${error.message}`);
    }
  }

  /**
   * Reset loader state (mainly for testing)
   */
  static reset(): void {
    this.pandocWasm = null;
    this.loadingPromise = null;
  }
}
