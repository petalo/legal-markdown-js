import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    // CLI main (not auto-detected from package.json bin since bin points to dist/)
    'src/cli/main.ts',
  ],
  project: ['src/**/*.ts'],
  ignore: [
    // Web playground is a separate Vite app — analysed independently via src/web/vite.config.ts
    'src/web/**',
  ],
  ignoreDependencies: [
    // Browser bundle polyfills: injected by Vite aliases, never imported directly in TS source
    'buffer',
    'path-browserify',
    // UI/shadcn deps: used in src/web/ (playground) which is excluded from project
    'class-variance-authority',
    'clsx',
    'lucide-react',
    'next-themes',
    'radix-ui',
    'react-resizable-panels',
    'tailwind-merge',
    'tailwindcss-animate',
    // Ambient @types packages: used by TypeScript but not via explicit import statements
    '@types/cheerio',
    '@types/eslint',
    '@types/handlebars',
    '@types/marked',
    '@types/unist',
    // Type-only import (import type), installed transitively via remark packages
    'mdast-util-to-markdown',
  ],
  ignoreFiles: [
    // Vite alias target for browser bundle — injected at build time, not a direct import
    'src/utils/browser-shims.ts',
  ],
  ignoreBinaries: [
    // Used in CI via npx, not a package dependency
    'audit-ci',
  ],
};

export default config;
