/**
 * @fileoverview Jest testing framework configuration
 * 
 * Configures Jest for TypeScript testing with:
 * - TypeScript compilation via ts-jest
 * - Module path mapping for clean imports
 * - Test coverage reporting
 * - Test file discovery patterns
 * - Global test setup integration
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Node.js environment for testing (not browser)
  testEnvironment: 'node',
  
  // Root directories to search for source and test files
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Pattern to match test files
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  /**
   * Module name mapping for clean imports
   * Maps @-prefixed aliases to actual source paths
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
    '^@errors$': '<rootDir>/src/errors/index.ts'
  },
  
  /**
   * Coverage collection configuration
   * Includes all source files except CLI (excluded from coverage)
   */
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli/**/*.ts'
  ],
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Global test setup file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test timeout in milliseconds
  testTimeout: 10000
};