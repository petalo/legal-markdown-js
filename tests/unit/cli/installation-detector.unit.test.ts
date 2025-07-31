/**
 * Unit tests for Installation Detection Utilities
 *
 * Tests the functionality for detecting global vs local npm installations
 * and determining appropriate configuration file locations.
 *
 * @module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';

// Mock fs and os modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn().mockReturnValue('/home/testuser'),
}));

import * as fs from 'fs';
import * as os from 'os';
import {
  isGlobalInstallation,
  getConfigDirectory,
  getEnvFilePath,
  getInstallationDescription,
} from '../../../src/cli/interactive/utils/installation-detector';

describe('Installation Detector', () => {
  const originalProcessArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.argv to a clean state
    process.argv = ['node', '/default/script.js'];
    
    // Default mock implementations
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
  });

  afterEach(() => {
    process.argv = originalProcessArgv;
  });

  describe('isGlobalInstallation', () => {
    it('should detect global installation from script path with node_modules', () => {
      process.argv = ['node', '/usr/local/lib/node_modules/legal-markdown-js/dist/cli/interactive/index.js'];
      
      const result = isGlobalInstallation();
      
      expect(result).toBe(true);
    });

    it('should detect global installation from npm-global path', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/user');
      process.argv = ['node', '/home/user/.npm-global/lib/node_modules/legal-markdown-js/dist/cli/interactive/index.js'];
      
      const result = isGlobalInstallation();
      
      expect(result).toBe(true);
    });

    it('should detect local installation when package.json contains dependency', () => {
      process.argv = ['node', '/home/user/project/node_modules/.bin/legal-md-ui'];
      
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().includes('package.json');
      });
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        dependencies: {
          'legal-markdown-js': '^2.0.0'
        }
      }));
      
      const result = isGlobalInstallation();
      
      expect(result).toBe(false);
    });

    it('should detect local installation when local node_modules exists', () => {
      process.argv = ['node', '/home/user/project/scripts/run.js'];
      
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        if (filePath.toString().includes('package.json')) {
          return false;
        }
        if (filePath.toString().includes('node_modules/legal-markdown-js')) {
          return true;
        }
        return false;
      });
      
      const result = isGlobalInstallation();
      
      expect(result).toBe(false);
    });

    it('should default to global installation when detection fails', () => {
      process.argv = [];
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const result = isGlobalInstallation();
      
      expect(result).toBe(true);
    });

    it('should handle JSON parsing errors gracefully', () => {
      process.argv = ['node', '/local/project/script.js'];
      
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().includes('package.json');
      });
      
      // Mock invalid JSON
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json content');
      
      const result = isGlobalInstallation();
      
      // Should continue with other detection methods and default to global
      expect(result).toBe(true);
    });
  });

  describe('getConfigDirectory', () => {
    it('should return user config directory for global installation', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/testuser');
      process.argv = ['node', '/usr/local/lib/node_modules/legal-markdown-js/cli.js'];
      
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const result = getConfigDirectory();
      
      expect(result).toBe(path.join('/home/testuser', '.config', 'legal-markdown-js'));
      expect(vi.mocked(fs.mkdirSync)).toHaveBeenCalledWith(
        path.join('/home/testuser', '.config', 'legal-markdown-js'),
        { recursive: true }
      );
    });

    it('should return current directory for local installation', () => {
      const mockCwd = '/home/user/project';
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockCwd);
      
      process.argv = ['node', '/local/project/script.js'];
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().includes('package.json');
      });
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        dependencies: { 'legal-markdown-js': '^2.0.0' }
      }));
      
      const result = getConfigDirectory();
      
      expect(result).toBe(mockCwd);
      
      process.cwd = originalCwd;
    });

    it('should not create directory if it already exists for global installation', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/testuser');
      process.argv = ['node', '/usr/local/lib/node_modules/legal-markdown-js/cli.js'];
      
      vi.mocked(fs.existsSync).mockReturnValue(true); // Directory already exists
      
      const result = getConfigDirectory();
      
      expect(result).toBe(path.join('/home/testuser', '.config', 'legal-markdown-js'));
      expect(vi.mocked(fs.mkdirSync)).not.toHaveBeenCalled();
    });
  });

  describe('getEnvFilePath', () => {
    it('should return .env path in config directory for global installation', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/testuser');
      process.argv = ['node', '/usr/local/lib/node_modules/legal-markdown-js/cli.js'];
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const result = getEnvFilePath();
      
      expect(result).toBe(path.join('/home/testuser', '.config', 'legal-markdown-js', '.env'));
    });

    it('should return .env path in current directory for local installation', () => {
      const mockCwd = '/home/user/project';
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockCwd);
      
      process.argv = ['node', '/local/project/script.js'];
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().includes('package.json');
      });
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        dependencies: { 'legal-markdown-js': '^2.0.0' }
      }));
      
      const result = getEnvFilePath();
      
      expect(result).toBe(path.join(mockCwd, '.env'));
      
      process.cwd = originalCwd;
    });
  });

  describe('getInstallationDescription', () => {
    it('should return global installation description', () => {
      vi.mocked(os.homedir).mockReturnValue('/home/testuser');
      process.argv = ['node', '/usr/local/lib/node_modules/legal-markdown-js/cli.js'];
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const result = getInstallationDescription();
      
      expect(result).toContain('Global installation');
      expect(result).toContain(path.join('/home/testuser', '.config', 'legal-markdown-js', '.env'));
    });

    it('should return local installation description', () => {
      const mockCwd = '/home/user/project';
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockCwd);
      
      process.argv = ['node', '/local/project/script.js'];
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().includes('package.json');
      });
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        dependencies: { 'legal-markdown-js': '^2.0.0' }
      }));
      
      const result = getInstallationDescription();
      
      expect(result).toContain('Local installation');
      expect(result).toContain(path.join(mockCwd, '.env'));
      
      process.cwd = originalCwd;
    });

    it('should format description correctly', () => {
      const result = getInstallationDescription();
      
      expect(result).toMatch(/^(Global|Local) installation - Configuration will be saved to:\n.*\.env$/);
    });
  });
});