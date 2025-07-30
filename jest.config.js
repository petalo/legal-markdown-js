/**
 * @fileoverview Jest testing framework configuration
 *
 * Configures Jest for ESM + TypeScript testing with:
 * - TypeScript compilation via ts-jest with ESM support
 * - Module path mapping for clean imports
 * - Test coverage reporting
 * - Test file discovery patterns
 * - Global test setup integration
 */

export default {
  // Use ts-jest preset with ESM support
  preset: 'ts-jest/presets/default-esm',

  // Node.js environment for testing (not browser)
  testEnvironment: 'node',

  // ESM support configuration
  extensionsToTreatAsEsm: ['.ts'],

  // Root directories to search for source and test files
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Speed optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  bail: false,
  verbose: false,
  silent: true,

  // Incremental testing optimizations
  watchman: true,
  forceExit: false,
  detectOpenHandles: false,
  
  // Memory and performance optimizations
  workerIdleMemoryLimit: '512MB',
  maxConcurrency: 5,

  // Pattern to match test files
  testMatch: ['**/tests/**/*.test.ts'],

  // Transform TypeScript files using ts-jest with ESM
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true
    }],
  },

  // Transform ESM modules that don't have CommonJS builds
  transformIgnorePatterns: [
    'node_modules/(?!.*)'
  ],

  /**
   * Module name mapping for clean imports
   * Maps @-prefixed aliases to actual source paths
   * ESM requires mapping to actual .ts files during test time
   */
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@core$': '<rootDir>/src/core/index.ts',
    '^@types$': '<rootDir>/src/types.ts',
    '^@extensions/(.*)$': '<rootDir>/src/extensions/$1',
    '^@extensions$': '<rootDir>/src/extensions/index.ts',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@lib$': '<rootDir>/src/lib/index.ts',
    '^@constants$': '<rootDir>/src/constants/index.ts',
    '^@errors$': '<rootDir>/src/errors/index.ts',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@utils$': '<rootDir>/src/utils/index.ts',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
    '^@plugins$': '<rootDir>/src/plugins/index.ts',
  },

  /**
   * Coverage collection configuration
   * Includes all source files except CLI (excluded from coverage)
   */
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/cli/**/*.ts'],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],

  // Global test setup file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Test timeout in milliseconds (removed duplicate)
  testTimeout: 10000,
};
