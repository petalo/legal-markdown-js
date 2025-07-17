/**
 * @fileoverview Jest test setup and configuration
 * 
 * This file provides global setup and teardown for all test suites, including:
 * - Temporary directory creation and cleanup
 * - Global test utilities and helpers
 * - Test environment configuration
 */

/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

/** 
 * Path to temporary directory for test files
 * @type {string}
 */
const testDir = path.join(__dirname, 'temp');

/**
 * Global setup executed before all tests
 * Creates temporary directory structure for test files
 */
beforeAll(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

/**
 * Global teardown executed after all tests
 * Cleans up temporary files and directories created during testing
 */
afterAll(() => {
  // Clean up temporary files
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

/**
 * Global test utilities available in all test files
 * Provides access to temporary directory path for file operations
 */
(global as any).testDir = testDir;