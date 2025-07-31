/**
 * Unit tests for environment file discovery utility
 *
 * @module
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { vi, MockedObject, MockedFunction } from 'vitest';

// Mock modules before importing the module under test
vi.mock('fs');
vi.mock('os');
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

const mockFs = fs as MockedObject<typeof fs>;
const mockOs = os as MockedObject<typeof os>;

// Import after mocking
import { discoverAndLoadEnv, getEnvSearchPaths, ensureConfigDirectory, createSampleEnvFile } from '../../../src/utils/env-discovery';
import { config as dotenvConfig } from 'dotenv';

const mockDotenvConfig = dotenvConfig as MockedFunction<typeof dotenvConfig>;

describe('Environment Discovery Utility', () => {
  const mockHomedir = '/home/testuser';
  const mockCwd = '/current/working/dir';
  let originalCwd: () => string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOs.homedir.mockReturnValue(mockHomedir);

    // Mock process.cwd
    originalCwd = process.cwd;
    process.cwd = vi.fn(() => mockCwd);
  });

  afterEach(() => {
    // Restore original process.cwd
    process.cwd = originalCwd;
  });

  describe('discoverAndLoadEnv', () => {
    it('should load .env from current working directory first', () => {
      const cwdEnvPath = path.join(mockCwd, '.env');

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === cwdEnvPath;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = discoverAndLoadEnv();

      expect(result).toBe(cwdEnvPath);
      expect(mockDotenvConfig).toHaveBeenCalledWith({ path: cwdEnvPath, quiet: true });
    });

    it('should load .env from home directory if not found in cwd', () => {
      const homeEnvPath = path.join(mockHomedir, '.env');

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === homeEnvPath;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = discoverAndLoadEnv();

      expect(result).toBe(homeEnvPath);
      expect(mockDotenvConfig).toHaveBeenCalledWith({ path: homeEnvPath, quiet: true });
    });

    it('should load .env from config directory if not found elsewhere', () => {
      const configEnvPath = path.join(mockHomedir, '.config', 'legal-markdown-js', '.env');

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === configEnvPath;
      });

      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = discoverAndLoadEnv();

      expect(result).toBe(configEnvPath);
      expect(mockDotenvConfig).toHaveBeenCalledWith({ path: configEnvPath, quiet: true });
    });

    it('should return null if no .env file is found', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = discoverAndLoadEnv();

      expect(result).toBeNull();
      expect(mockDotenvConfig).not.toHaveBeenCalled();
    });

    it('should skip files that are not regular files', () => {
      const cwdEnvPath = path.join(mockCwd, '.env');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: () => false } as any);

      const result = discoverAndLoadEnv();

      expect(result).toBeNull();
      expect(mockDotenvConfig).not.toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = discoverAndLoadEnv();

      expect(result).toBeNull();
      expect(mockDotenvConfig).not.toHaveBeenCalled();
    });

    it('should prioritize cwd over home directory', () => {
      const cwdEnvPath = path.join(mockCwd, '.env');
      const homeEnvPath = path.join(mockHomedir, '.env');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);

      const result = discoverAndLoadEnv();

      expect(result).toBe(cwdEnvPath);
      expect(mockDotenvConfig).toHaveBeenCalledWith({ path: cwdEnvPath, quiet: true });
      expect(mockDotenvConfig).not.toHaveBeenCalledWith({ path: homeEnvPath, quiet: true });
    });
  });

  describe('getEnvSearchPaths', () => {
    it('should return all potential .env file locations', () => {
      const paths = getEnvSearchPaths();

      expect(paths).toHaveLength(3);
      expect(paths[0]).toBe(path.join(mockCwd, '.env'));
      expect(paths[1]).toBe(path.join(mockHomedir, '.env'));
      expect(paths[2]).toBe(path.join(mockHomedir, '.config', 'legal-markdown-js', '.env'));
    });
  });

  describe('ensureConfigDirectory', () => {
    it('should create config directory if it does not exist', () => {
      const configDir = path.join(mockHomedir, '.config', 'legal-markdown-js');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);

      const result = ensureConfigDirectory();

      expect(result).toBe(configDir);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(configDir, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      const configDir = path.join(mockHomedir, '.config', 'legal-markdown-js');

      mockFs.existsSync.mockReturnValue(true);

      const result = ensureConfigDirectory();

      expect(result).toBe(configDir);
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle directory creation errors gracefully', () => {
      const configDir = path.join(mockHomedir, '.config', 'legal-markdown-js');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = ensureConfigDirectory();

      expect(result).toBe(configDir);
      // Should not throw error
    });
  });

  describe('createSampleEnvFile', () => {
    it('should create sample .env file in config directory', () => {
      const configDir = path.join(mockHomedir, '.config', 'legal-markdown-js');
      const samplePath = path.join(configDir, '.env');

      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === samplePath) return false; // .env doesn't exist
        if (filePath === configDir) return true; // config directory exists
        return false;
      });

      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const result = createSampleEnvFile();

      expect(result).toBe(samplePath);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        samplePath,
        expect.stringContaining('# Legal Markdown - User Configuration'),
        'utf8'
      );
    });

    it('should not overwrite existing .env file', () => {
      const configDir = path.join(mockHomedir, '.config', 'legal-markdown-js');
      const samplePath = path.join(configDir, '.env');

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === samplePath; // .env already exists
      });

      const result = createSampleEnvFile();

      expect(result).toBe(samplePath);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file creation errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = createSampleEnvFile();

      expect(result).toBeNull();
    });
  });
});
