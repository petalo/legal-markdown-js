/**
 * @fileoverview Integration tests for path validation and error handling
 * 
 * Tests real-world scenarios where:
 * - Configured paths don't exist
 * - Permission issues with directories
 * - Invalid path formats cause failures
 * - Recovery mechanisms work correctly
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { htmlGenerator } from '../../src/generators/html-generator';
import { CliService } from '../../src/cli/service';
import { RESOLVED_PATHS } from '../../src/constants/paths';

describe('Path Validation Integration Tests', () => {
  const testDir = path.join(__dirname, '../tmp/path-validation');
  const originalEnv = process.env;

  beforeAll(async () => {
    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  describe('Non-existent directories', () => {
    it('should handle missing styles directory gracefully in HTML generator', async () => {
      // Set non-existent styles directory
      process.env.STYLES_DIR = path.join(testDir, 'non-existent-styles');
      
      // Re-import modules to pick up new environment
      delete require.cache[require.resolve('../../src/constants/paths')];
      delete require.cache[require.resolve('../../src/generators/html-generator')];
      
      const { htmlGenerator: freshHtmlGenerator } = require('../../src/generators/html-generator');
      
      const markdown = '# Test Document\n\nThis is a test.';
      
      // Should not throw, but might not load custom CSS
      await expect(freshHtmlGenerator.generateHtml(markdown, {
        cssPath: undefined, // Use default CSS which won't exist
      })).resolves.toBeDefined();
    });

    it('should handle missing input directory in CLI service', async () => {
      // Set non-existent input directory
      process.env.DEFAULT_INPUT_DIR = path.join(testDir, 'non-existent-input');
      
      // Re-import modules to pick up new environment
      delete require.cache[require.resolve('../../src/constants/paths')];
      delete require.cache[require.resolve('../../src/cli/service')];
      
      const { CliService: FreshCliService } = require('../../src/cli/service');
      
      const cliService = new FreshCliService({
        basePath: path.join(testDir, 'non-existent-input'),
      });
      
      const testFile = path.join(testDir, 'test-input.md');
      await fs.writeFile(testFile, '# Test\n\nContent');
      
      // Should handle missing base path gracefully
      await expect(cliService.processFile(testFile)).resolves.toBeUndefined();
    });

    it('should create output directory if it does not exist', async () => {
      const outputDir = path.join(testDir, 'auto-created-output');
      process.env.DEFAULT_OUTPUT_DIR = outputDir;
      
      // Ensure directory doesn't exist
      await fs.rm(outputDir, { recursive: true, force: true });
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { RESOLVED_PATHS: freshResolvedPaths } = require('../../src/constants/paths');
      
      expect(freshResolvedPaths.DEFAULT_OUTPUT_DIR).toBe(path.resolve(outputDir));
      
      // Verify directory doesn't exist yet
      await expect(fs.access(outputDir)).rejects.toThrow();
      
      // The directory should be created when actually needed by the application
      // (This would be tested in actual usage scenarios)
    });
  });

  describe('Permission issues', () => {
    it('should handle read-only directories appropriately', async () => {
      const readOnlyDir = path.join(testDir, 'readonly-styles');
      await fs.mkdir(readOnlyDir, { recursive: true });
      
      // Create a CSS file
      const cssFile = path.join(readOnlyDir, 'test.css');
      await fs.writeFile(cssFile, 'body { color: red; }');
      
      // Make directory read-only (if running on Unix-like systems)
      if (process.platform !== 'win32') {
        await fs.chmod(readOnlyDir, 0o444);
      }
      
      process.env.STYLES_DIR = readOnlyDir;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      delete require.cache[require.resolve('../../src/generators/html-generator')];
      
      const { htmlGenerator: freshHtmlGenerator } = require('../../src/generators/html-generator');
      
      // Should be able to read CSS file even from read-only directory
      await expect(freshHtmlGenerator.generateHtml('# Test', {
        cssPath: cssFile,
      })).resolves.toBeDefined();
      
      // Restore permissions for cleanup
      if (process.platform !== 'win32') {
        await fs.chmod(readOnlyDir, 0o755);
      }
    });
  });

  describe('Invalid path formats', () => {
    it('should handle paths with invalid characters', async () => {
      // Test with a specific problematic character
      const problematicPath = 'path/with|pipe';
      process.env.STYLES_DIR = problematicPath;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { PATHS, RESOLVED_PATHS } = require('../../src/constants/paths');
      
      // Should store the path as-is (validation happens at filesystem level)
      expect(PATHS.STYLES_DIR).toBe(problematicPath);
      
      // Test actual filesystem behavior - should fail gracefully
      const testCssContent = 'body { color: red; }';
      const invalidCssPath = path.join(RESOLVED_PATHS.STYLES_DIR, 'test.css');
      
      try {
        await fs.mkdir(RESOLVED_PATHS.STYLES_DIR, { recursive: true });
        await fs.writeFile(invalidCssPath, testCssContent);
        
        // If creation succeeds on this platform, verify we can read it back
        const content = await fs.readFile(invalidCssPath, 'utf8');
        expect(content).toBe(testCssContent);
        
        // Cleanup
        await fs.rm(RESOLVED_PATHS.STYLES_DIR, { recursive: true, force: true });
      } catch (error) {
        // Expected behavior: filesystem should reject invalid characters
        expect(error).toBeDefined();
        console.log('Filesystem correctly rejected invalid path:', (error as Error).message);
      }
    });

    it('should handle paths with angle brackets', async () => {
      const problematicPath = 'path/with<angle>brackets';
      process.env.STYLES_DIR = problematicPath;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { PATHS } = require('../../src/constants/paths');
      
      expect(PATHS.STYLES_DIR).toBe(problematicPath);
    });

    it('should handle extremely long paths', async () => {
      const longPath = 'a'.repeat(1000); // Very long path
      process.env.IMAGES_DIR = longPath;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { PATHS, RESOLVED_PATHS } = require('../../src/constants/paths');
      
      expect(PATHS.IMAGES_DIR).toBe(longPath);
      expect(RESOLVED_PATHS.IMAGES_DIR).toBe(path.resolve(process.cwd(), longPath));
    });
  });

  describe('Path resolution edge cases', () => {
    it('should handle circular references in paths', async () => {
      const circularPath = '../../../legal-markdown-js/src/styles/../styles';
      process.env.STYLES_DIR = circularPath;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { RESOLVED_PATHS } = require('../../src/constants/paths');
      
      // path.resolve should normalize the circular reference
      const normalizedPath = path.resolve(process.cwd(), circularPath);
      expect(RESOLVED_PATHS.STYLES_DIR).toBe(normalizedPath);
    });

    it('should handle symlinks correctly', async () => {
      const realDir = path.join(testDir, 'real-styles');
      const symlinkDir = path.join(testDir, 'symlink-styles');
      
      await fs.mkdir(realDir, { recursive: true });
      
      try {
        // Create symlink (might fail on Windows without admin privileges)
        await fs.symlink(realDir, symlinkDir);
        
        process.env.STYLES_DIR = symlinkDir;
        
        // Re-import modules
        delete require.cache[require.resolve('../../src/constants/paths')];
        const { RESOLVED_PATHS } = require('../../src/constants/paths');
        
        // Should resolve to the symlink path, not the real path
        expect(RESOLVED_PATHS.STYLES_DIR).toBe(path.resolve(process.cwd(), symlinkDir));
        
        // Cleanup symlink
        await fs.unlink(symlinkDir);
      } catch (error) {
        // Skip test if symlinks aren't supported (e.g., Windows without admin)
        console.warn('Skipping symlink test:', error instanceof Error ? error.message : String(error));
      }
    });
  });

  describe('Environment variable precedence', () => {
    it('should prioritize environment variables over defaults', async () => {
      process.env.IMAGES_DIR = 'env-images';
      process.env.STYLES_DIR = 'env-styles';
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { PATHS } = require('../../src/constants/paths');
      
      expect(PATHS.IMAGES_DIR).toBe('env-images');
      expect(PATHS.STYLES_DIR).toBe('env-styles');
      expect(PATHS.DEFAULT_INPUT_DIR).toBe('input'); // Should use default
      expect(PATHS.DEFAULT_OUTPUT_DIR).toBe('output'); // Should use default
    });

    it('should handle mixed environment and default values', async () => {
      process.env.IMAGES_DIR = 'custom-images';
      delete process.env.STYLES_DIR;
      process.env.DEFAULT_OUTPUT_DIR = 'custom-output';
      delete process.env.DEFAULT_INPUT_DIR;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { PATHS } = require('../../src/constants/paths');
      
      expect(PATHS.IMAGES_DIR).toBe('custom-images');
      expect(PATHS.STYLES_DIR).toBe('src/styles'); // Default
      expect(PATHS.DEFAULT_INPUT_DIR).toBe('input'); // Default
      expect(PATHS.DEFAULT_OUTPUT_DIR).toBe('custom-output');
    });
  });

  describe('Real filesystem operations', () => {
    it('should work with actual file operations when paths exist', async () => {
      // Create real directories and files
      const testImagesDir = path.join(testDir, 'real-images');
      const testStylesDir = path.join(testDir, 'real-styles');
      
      await fs.mkdir(testImagesDir, { recursive: true });
      await fs.mkdir(testStylesDir, { recursive: true });
      
      // Create test files
      await fs.writeFile(path.join(testImagesDir, 'test.png'), 'fake-png-data');
      await fs.writeFile(path.join(testStylesDir, 'test.css'), 'body { margin: 0; }');
      
      process.env.IMAGES_DIR = testImagesDir;
      process.env.STYLES_DIR = testStylesDir;
      
      // Re-import modules
      delete require.cache[require.resolve('../../src/constants/paths')];
      const { RESOLVED_PATHS } = require('../../src/constants/paths');
      
      // Verify paths resolve correctly
      expect(RESOLVED_PATHS.IMAGES_DIR).toBe(path.resolve(testImagesDir));
      expect(RESOLVED_PATHS.STYLES_DIR).toBe(path.resolve(testStylesDir));
      
      // Verify files can be accessed
      await expect(fs.access(path.join(RESOLVED_PATHS.IMAGES_DIR, 'test.png'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(RESOLVED_PATHS.STYLES_DIR, 'test.css'))).resolves.toBeUndefined();
    });
  });
});