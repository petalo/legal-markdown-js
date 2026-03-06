import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: './src/browser-modern.ts',
      name: 'LegalMarkdown',
      formats: ['es'],
      fileName: () => 'legal-markdown-browser.js',
    },
    rollupOptions: {
      external: [
        'child_process',
        'node:child_process',
        'puppeteer',
        'puppeteer-core',
        'worker_threads',
        'node:worker_threads',
        'pandoc-wasm',
      ],
      output: {
        // Provide empty modules for Node.js builtins
        globals: {
          fs: '{}',
          'fs/promises': '{}',
          path: '{}',
          crypto: '{}',
          stream: '{}',
          util: '{}',
          events: '{}',
          buffer: '{}',
        },
      },
    },
    minify: false, // Disable for easier debugging
    sourcemap: true,
    target: 'esnext', // Use modern JavaScript
    emptyOutDir: false, // Don't clear dist/ - preserve CLI files from TypeScript build
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@extensions': path.resolve(__dirname, 'src/extensions'),
      '@errors': path.resolve(__dirname, 'src/errors'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      // Provide browser shims for Node.js modules
      cosmiconfig: path.resolve(__dirname, 'src/utils/cosmiconfig-shim.ts'),
      'fs/promises': path.resolve(__dirname, 'src/utils/browser-shims.ts'),
      fs: path.resolve(__dirname, 'src/utils/browser-shims.ts'),
      path: 'path-browserify',
      buffer: 'buffer',
    },
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
  optimizeDeps: {
    include: [
      'unified',
      'remark-parse',
      'remark-stringify',
      'unist-util-visit',
      'unist-util-visit-parents',
      'unist-util-is',
      'mdast-util-to-string',
      'js-yaml',
      'extend',
      'path-browserify',
      'buffer',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    __LEGAL_MARKDOWN_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.DEBUG': JSON.stringify(false),
    process: JSON.stringify({ env: { NODE_ENV: 'production', DEBUG: false } }),
    global: 'globalThis',
  },
});
