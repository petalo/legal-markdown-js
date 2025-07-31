/**
 * @fileoverview Optimized Vitest test setup and configuration
 * 
 * This file provides fast global setup and teardown for all test suites:
 * - Lazy temporary directory creation
 * - Optimized cleanup strategies
 * - Performance monitoring
 * - Memory leak prevention
 */

/// <reference types="vitest/globals" />
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

// Provide __dirname and __filename for ESM compatibility
if (typeof globalThis !== 'undefined' && typeof globalThis.__dirname === 'undefined') {
  // This is for ESM modules - they don't have __dirname by default
  Object.defineProperty(globalThis, '__dirname', {
    get() {
      // This will be overridden by specific test files if needed
      return process.cwd();
    },
    configurable: true,
  });
  
  Object.defineProperty(globalThis, '__filename', {
    get() {
      return path.join(process.cwd(), 'vitest-setup.js');
    },
    configurable: true,
  });
}

/** 
 * Optimized path to temporary directory for test files
 * Uses OS temp directory for better performance
 */
const testDir = path.join(os.tmpdir(), 'legal-markdown-tests', process.pid.toString());

/**
 * Performance monitoring
 */
const performanceStart = Date.now();
let testCount = 0;

/**
 * Global setup executed before all tests
 * Creates temporary directory structure only when needed
 */
beforeAll(() => {
  // Only create directory if it doesn't exist (lazy creation)
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Performance tracking
  console.log(`🚀 Test setup completed in ${Date.now() - performanceStart}ms`);
});

/**
 * Global teardown executed after all tests
 * Optimized cleanup with error handling
 */
afterAll(async () => {
  const cleanupStart = Date.now();
  
  try {
    // Async cleanup for better performance
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    console.log(`🧹 Cleanup completed in ${Date.now() - cleanupStart}ms (${testCount} tests)`);
  } catch (error) {
    // Don't fail tests due to cleanup issues
    console.warn('⚠️  Cleanup warning:', error);
  }
});

/**
 * Performance tracking for individual tests
 */
beforeEach(() => {
  testCount++;
});

/**
 * Global test utilities available in all test files
 * Provides optimized access to temporary directory path
 */
(global as any).testDir = testDir;

/**
 * Directory existence cache for performance optimization
 */
const dirCache = new Set<string>();

/**
 * Optimized file creation utility for tests with directory caching
 */
(global as any).createTestFile = (filename: string, content: string): string => {
  const filePath = path.join(testDir, filename);
  const dir = path.dirname(filePath);
  
  // Use cached directory existence check
  if (!dirCache.has(dir)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    dirCache.add(dir);
  }
  
  fs.writeFileSync(filePath, content);
  return filePath;
};

/**
 * Fast cleanup utility for individual tests
 */
(global as any).cleanupTestFiles = (patterns: string[]): void => {
  for (const pattern of patterns) {
    const files = fs.readdirSync(testDir).filter(file => file.includes(pattern));
    for (const file of files) {
      const filePath = path.join(testDir, file);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
};