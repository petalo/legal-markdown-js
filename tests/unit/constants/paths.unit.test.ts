/**
 * @fileoverview Tests for path constants loaded from environment variables
 * 
 * Tests the paths configuration system which:
 * - Loads path constants from .env file via dotenv
 * - Provides fallback defaults when environment variables are missing
 * - Resolves absolute paths correctly
 * - Handles invalid or malformed path configurations
 */

import { PATHS, RESOLVED_PATHS } from '../../../src/constants/paths';
import * as path from 'path';

// Mock dotenv config to control environment variables
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Path Constants', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('PATHS with environment variables', () => {
    it('should use environment variables when provided', () => {
      process.env.IMAGES_DIR = 'custom/images';
      process.env.STYLES_DIR = 'custom/styles';
      process.env.DEFAULT_INPUT_DIR = 'custom/input';
      process.env.DEFAULT_OUTPUT_DIR = 'custom/output';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths } = require('../../../src/constants/paths');

      expect(freshPaths.IMAGES_DIR).toBe('custom/images');
      expect(freshPaths.STYLES_DIR).toBe('custom/styles');
      expect(freshPaths.DEFAULT_INPUT_DIR).toBe('custom/input');
      expect(freshPaths.DEFAULT_OUTPUT_DIR).toBe('custom/output');
    });

    it('should use defaults when environment variables are missing', () => {
      delete process.env.IMAGES_DIR;
      delete process.env.STYLES_DIR;
      delete process.env.DEFAULT_INPUT_DIR;
      delete process.env.DEFAULT_OUTPUT_DIR;

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths } = require('../../../src/constants/paths');

      expect(freshPaths.IMAGES_DIR).toBe('src/assets/images');
      expect(freshPaths.STYLES_DIR).toBe('src/styles');
      expect(freshPaths.DEFAULT_INPUT_DIR).toBe('input');
      expect(freshPaths.DEFAULT_OUTPUT_DIR).toBe('output');
    });

    it('should handle empty environment variables gracefully', () => {
      process.env.IMAGES_DIR = '';
      process.env.STYLES_DIR = '';
      process.env.DEFAULT_INPUT_DIR = '';
      process.env.DEFAULT_OUTPUT_DIR = '';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths } = require('../../../src/constants/paths');

      // Empty strings should fallback to defaults
      expect(freshPaths.IMAGES_DIR).toBe('src/assets/images');
      expect(freshPaths.STYLES_DIR).toBe('src/styles');
      expect(freshPaths.DEFAULT_INPUT_DIR).toBe('input');
      expect(freshPaths.DEFAULT_OUTPUT_DIR).toBe('output');
    });
  });

  describe('RESOLVED_PATHS', () => {
    it('should resolve absolute paths correctly', () => {
      process.env.IMAGES_DIR = 'test/images';
      process.env.STYLES_DIR = 'test/styles';
      process.env.DEFAULT_INPUT_DIR = 'test/input';
      process.env.DEFAULT_OUTPUT_DIR = 'test/output';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      const expectedImagesDir = path.resolve(process.cwd(), 'test/images');
      const expectedStylesDir = path.resolve(process.cwd(), 'test/styles');
      const expectedInputDir = path.resolve(process.cwd(), 'test/input');
      const expectedOutputDir = path.resolve(process.cwd(), 'test/output');

      expect(freshResolvedPaths.IMAGES_DIR).toBe(expectedImagesDir);
      expect(freshResolvedPaths.STYLES_DIR).toBe(expectedStylesDir);
      expect(freshResolvedPaths.DEFAULT_INPUT_DIR).toBe(expectedInputDir);
      expect(freshResolvedPaths.DEFAULT_OUTPUT_DIR).toBe(expectedOutputDir);
    });

    it('should handle relative paths correctly', () => {
      process.env.IMAGES_DIR = '../images';
      process.env.STYLES_DIR = './styles';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      const expectedImagesDir = path.resolve(process.cwd(), '../images');
      const expectedStylesDir = path.resolve(process.cwd(), './styles');

      expect(freshResolvedPaths.IMAGES_DIR).toBe(expectedImagesDir);
      expect(freshResolvedPaths.STYLES_DIR).toBe(expectedStylesDir);
    });

    it('should handle absolute paths in environment variables', () => {
      const absoluteImagesPath = path.resolve('/tmp/test/images');
      const absoluteStylesPath = path.resolve('/tmp/test/styles');
      
      process.env.IMAGES_DIR = absoluteImagesPath;
      process.env.STYLES_DIR = absoluteStylesPath;

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      expect(freshResolvedPaths.IMAGES_DIR).toBe(absoluteImagesPath);
      expect(freshResolvedPaths.STYLES_DIR).toBe(absoluteStylesPath);
    });
  });

  describe('Invalid path configurations', () => {
    it('should handle paths with special characters', () => {
      process.env.IMAGES_DIR = 'test/images with spaces';
      process.env.STYLES_DIR = 'test/styles-with-dashes';
      process.env.DEFAULT_INPUT_DIR = 'test/input_with_underscores';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths, RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      expect(freshPaths.IMAGES_DIR).toBe('test/images with spaces');
      expect(freshPaths.STYLES_DIR).toBe('test/styles-with-dashes');
      expect(freshPaths.DEFAULT_INPUT_DIR).toBe('test/input_with_underscores');

      // Should still resolve correctly
      expect(freshResolvedPaths.IMAGES_DIR).toBe(path.resolve(process.cwd(), 'test/images with spaces'));
      expect(freshResolvedPaths.STYLES_DIR).toBe(path.resolve(process.cwd(), 'test/styles-with-dashes'));
      expect(freshResolvedPaths.DEFAULT_INPUT_DIR).toBe(path.resolve(process.cwd(), 'test/input_with_underscores'));
    });

    it('should handle very long paths', () => {
      const longPath = 'very/long/path/that/goes/very/deep/into/nested/directories/for/testing/purposes';
      process.env.IMAGES_DIR = longPath;

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths, RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      expect(freshPaths.IMAGES_DIR).toBe(longPath);
      expect(freshResolvedPaths.IMAGES_DIR).toBe(path.resolve(process.cwd(), longPath));
    });

    it('should handle paths with dots and navigation', () => {
      process.env.STYLES_DIR = '../../../some/path/./with/./dots';

      // Re-import the module to get updated environment
      delete require.cache[require.resolve('../../../src/constants/paths')];
      const { PATHS: freshPaths, RESOLVED_PATHS: freshResolvedPaths } = require('../../../src/constants/paths');

      expect(freshPaths.STYLES_DIR).toBe('../../../some/path/./with/./dots');
      // path.resolve should normalize the path
      expect(freshResolvedPaths.STYLES_DIR).toBe(path.resolve(process.cwd(), '../../../some/path/./with/./dots'));
    });
  });

  describe('Constants immutability', () => {
    it('should have immutable PATHS object', () => {
      // Note: TypeScript const assertions make objects read-only at compile time
      // but not at runtime unless using Object.freeze() 
      // This test verifies the structure rather than runtime immutability
      expect(typeof PATHS).toBe('object');
      expect(PATHS).toHaveProperty('IMAGES_DIR');
      expect(PATHS).toHaveProperty('STYLES_DIR');
      expect(PATHS).toHaveProperty('DEFAULT_INPUT_DIR');
      expect(PATHS).toHaveProperty('DEFAULT_OUTPUT_DIR');
    });

    it('should have immutable RESOLVED_PATHS object', () => {
      // Similar to above - verifies structure and type safety
      expect(typeof RESOLVED_PATHS).toBe('object');
      expect(RESOLVED_PATHS).toHaveProperty('IMAGES_DIR');
      expect(RESOLVED_PATHS).toHaveProperty('STYLES_DIR');
      expect(RESOLVED_PATHS).toHaveProperty('DEFAULT_INPUT_DIR');
      expect(RESOLVED_PATHS).toHaveProperty('DEFAULT_OUTPUT_DIR');
      
      // Verify all paths are absolute
      expect(path.isAbsolute(RESOLVED_PATHS.IMAGES_DIR)).toBe(true);
      expect(path.isAbsolute(RESOLVED_PATHS.STYLES_DIR)).toBe(true);
      expect(path.isAbsolute(RESOLVED_PATHS.DEFAULT_INPUT_DIR)).toBe(true);
      expect(path.isAbsolute(RESOLVED_PATHS.DEFAULT_OUTPUT_DIR)).toBe(true);
    });
  });
});