module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
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
    
    // Code style
    'max-len': ['warn', { code: 100, ignoreComments: true }],
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.js', 'examples/'],
};