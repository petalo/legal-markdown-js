module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  globals: {
    NodeJS: 'readonly',
  },
  rules: {
    // General rules
    'no-console': 'off', // Allow console in CLI tools
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off',
    
    // TypeScript specific rules
    'no-redeclare': 'off', // Disable base rule for TypeScript
    '@typescript-eslint/no-redeclare': 'error', // Use TypeScript version that understands overloads
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn', // Allow any but warn about it
    
    // Code style
    'max-len': ['warn', { code: 100, ignoreComments: true }],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
  overrides: [
    {
      // More permissive rules for test files
      files: ['**/*.test.ts', '**/tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-len': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.js', 'examples/'],
};