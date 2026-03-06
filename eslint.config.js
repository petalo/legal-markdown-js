import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Global ignores (replaces ignorePatterns)
  {
    ignores: ['dist/', 'dist-cjs/', 'node_modules/', 'coverage/', '**/*.js', '**/*.cjs', '**/*.mjs', 'examples/'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript source files
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Spread @typescript-eslint/recommended rules
      ...tsPlugin.configs['recommended'].rules,

      // General rules
      'no-console': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',

      // New ESLint v10 recommended rules — disable to preserve pre-existing code behavior
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',

      // TypeScript-specific rules
      '@typescript-eslint/no-redeclare': 'error',
      // Allow _-prefixed params/vars to signal intentional non-use
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Style (non-Prettier)
      'max-len': ['warn', { code: 100, ignoreComments: true }],
    },
  },

  // Web (browser) source files
  {
    files: ['src/web/**/*.ts', 'src/web/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Test files — more permissive overrides
  {
    files: ['**/*.test.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-len': 'off',
    },
  },

  // Prettier config last (disables conflicting formatting rules)
  prettierConfig,
];
