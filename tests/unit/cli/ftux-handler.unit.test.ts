/**
 * Unit tests for First-Time User Experience (FTUX) Handler
 *
 * Tests the core FTUX functionality including setup wizard, demo examples,
 * help system, and integration with installation detection.
 *
 * @module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  confirm: vi.fn(),
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock utility modules
vi.mock('../../../src/cli/interactive/utils/file-input-helpers', () => ({
  handleBrowseFolder: vi.fn(),
  handleManualInput: vi.fn(),
}));

vi.mock('../../../src/cli/interactive/utils/installation-detector', () => ({
  getEnvFilePath: vi.fn().mockReturnValue('/mock/.config/legal-markdown-js/.env'),
  getInstallationDescription: vi.fn().mockReturnValue('Global installation - Configuration will be saved to:\n/mock/.config/legal-markdown-js/.env'),
}));

vi.mock('../../../src/cli/interactive/utils/file-scanner', () => ({
  scanDirectory: vi.fn(),
}));

vi.mock('../../../src/constants/index.js', () => ({
  RESOLVED_PATHS: {
    DEFAULT_INPUT_DIR: '/mock/input',
    DEFAULT_OUTPUT_DIR: '/mock/output',
  },
}));

import { select, input, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { handleBrowseFolder, handleManualInput } from '../../../src/cli/interactive/utils/file-input-helpers';
import { getEnvFilePath, getInstallationDescription } from '../../../src/cli/interactive/utils/installation-detector';
import { scanDirectory } from '../../../src/cli/interactive/utils/file-scanner';
import { handleFirstTimeUserExperience } from '../../../src/cli/interactive/prompts/ftux-handler';

describe('FTUX Handler', () => {
  const mockSelect = select as ReturnType<typeof vi.fn>;
  const mockInput = input as ReturnType<typeof vi.fn>;
  const mockConfirm = confirm as ReturnType<typeof vi.fn>;
  const mockHandleBrowseFolder = handleBrowseFolder as ReturnType<typeof vi.fn>;
  const mockHandleManualInput = handleManualInput as ReturnType<typeof vi.fn>;
  const mockGetEnvFilePath = getEnvFilePath as ReturnType<typeof vi.fn>;
  const mockGetInstallationDescription = getInstallationDescription as ReturnType<typeof vi.fn>;
  const mockScanDirectory = scanDirectory as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockGetEnvFilePath.mockReturnValue('/mock/.config/legal-markdown-js/.env');
    mockGetInstallationDescription.mockReturnValue('Global installation - Configuration will be saved to:\n/mock/.config/legal-markdown-js/.env');
    mockScanDirectory.mockReturnValue([]);
    
    // Mock console methods to avoid output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Main menu selection', () => {
    it('should handle setup configuration option', async () => {
      mockSelect.mockResolvedValueOnce('setup');
      mockInput
        .mockResolvedValueOnce('/mock/input-dir') // input directory
        .mockResolvedValueOnce('/mock/output-dir') // output directory
        .mockResolvedValueOnce('/mock/styles-dir') // styles directory
        .mockResolvedValueOnce('/mock/archive-dir'); // archive directory
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockStatSync = vi.mocked(fs.statSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockImplementation((filePath: string) => {
        if (filePath.includes('.env')) {
          return false; // .env doesn't exist
        }
        return true; // directories exist
      });
      
      mockStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);
      mockWriteFileSync.mockImplementation(() => {});
      mockScanDirectory.mockReturnValue([
        { name: 'test.md', path: '/mock/input-dir/test.md' }
      ]);
      
      mockSelect.mockResolvedValueOnce('/mock/input-dir/test.md'); // file selection
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to do?',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: 'setup' }),
            expect.objectContaining({ value: 'demo' }),
            expect.objectContaining({ value: 'browse' }),
            expect.objectContaining({ value: 'manual' }),
            expect.objectContaining({ value: 'help' }),
            expect.objectContaining({ value: 'exit' }),
          ]),
        })
      );
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/mock/.config/legal-markdown-js/.env',
        expect.stringContaining('DEFAULT_INPUT_DIR')
      );
      
      expect(result).toBe('/mock/input-dir/test.md');
    });

    it('should handle demo example option', async () => {
      mockSelect.mockResolvedValueOnce('demo');
      
      // Mock example file existence
      const mockExistsSync = vi.mocked(fs.existsSync);
      mockExistsSync.mockImplementation((filePath: string) => {
        if (filePath.includes('dist/examples')) {
          return true;
        }
        if (filePath.includes('basic-processing/simple-document/example.md')) {
          return true;
        }
        return false;
      });
      
      mockSelect.mockResolvedValueOnce('/mock/examples/basic-processing/simple-document/example.md');
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockSelect).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          message: 'Choose a demo example:',
          choices: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining('Basic Document Processing'),
            }),
          ]),
        })
      );
      
      expect(result).toBe('/mock/examples/basic-processing/simple-document/example.md');
    });

    it('should handle browse folder option', async () => {
      mockSelect.mockResolvedValueOnce('browse');
      mockHandleBrowseFolder.mockResolvedValue('/mock/browsed/file.md');
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockHandleBrowseFolder).toHaveBeenCalled();
      expect(result).toBe('/mock/browsed/file.md');
    });

    it('should handle manual input option', async () => {
      mockSelect.mockResolvedValueOnce('manual');
      mockHandleManualInput.mockResolvedValue('/mock/manual/file.md');
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockHandleManualInput).toHaveBeenCalled();
      expect(result).toBe('/mock/manual/file.md');
    });

    it('should handle help option and return to main menu', async () => {
      mockSelect
        .mockResolvedValueOnce('help') // First selection: help
        .mockResolvedValueOnce('exit'); // Second selection: exit after help
      
      mockInput.mockResolvedValueOnce(''); // Press enter to continue after help
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(mockInput).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Press Enter to continue...',
        })
      );
    });

    it('should handle exit option', async () => {
      mockSelect.mockResolvedValueOnce('exit');
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should throw error for invalid option', async () => {
      mockSelect.mockResolvedValueOnce('invalid-option');
      
      await expect(handleFirstTimeUserExperience()).rejects.toThrow('Invalid option selected');
    });
  });

  describe('Setup configuration workflow', () => {
    beforeEach(() => {
      mockSelect.mockResolvedValueOnce('setup');
    });

    it('should validate input directory exists', async () => {
      mockInput.mockResolvedValueOnce('/nonexistent/directory');
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      mockExistsSync.mockReturnValue(false);
      
      // Mock the validation function call
      const mockValidation = mockInput.mock.calls[0]?.[0]?.validate;
      if (mockValidation) {
        const result = mockValidation('/nonexistent/directory');
        expect(result).toBe('Directory does not exist. Please enter a valid path.');
      }
    });

    it('should validate input path is a directory', async () => {
      mockInput.mockResolvedValueOnce('/path/to/file.txt');
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockStatSync = vi.mocked(fs.statSync);
      
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
      
      // Mock the validation function call
      const mockValidation = mockInput.mock.calls[0]?.[0]?.validate;
      if (mockValidation) {
        const result = mockValidation('/path/to/file.txt');
        expect(result).toBe('Path is not a directory.');
      }
    });

    it('should handle existing .env file with overwrite confirmation', async () => {
      mockInput
        .mockResolvedValueOnce('/mock/input')
        .mockResolvedValueOnce('/mock/output')
        .mockResolvedValueOnce('/mock/styles')
        .mockResolvedValueOnce('/mock/archive');
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockStatSync = vi.mocked(fs.statSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockImplementation((filePath: string) => {
        if (filePath.includes('.env')) {
          return true; // .env exists
        }
        return true; // directories exist
      });
      
      mockStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);
      mockConfirm.mockResolvedValueOnce(true); // Overwrite confirmed
      mockWriteFileSync.mockImplementation(() => {});
      mockScanDirectory.mockReturnValue([]);
      
      mockSelect.mockResolvedValueOnce('exit'); // Exit after no files found
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A .env file already exists. Overwrite it?',
          default: false,
        })
      );
      
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should handle existing .env file with overwrite declined', async () => {
      mockInput
        .mockResolvedValueOnce('/mock/input')
        .mockResolvedValueOnce('/mock/output')
        .mockResolvedValueOnce('/mock/styles')
        .mockResolvedValueOnce('/mock/archive');
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockStatSync = vi.mocked(fs.statSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockImplementation((filePath: string) => {
        if (filePath.includes('.env')) {
          return true; // .env exists
        }
        return true; // directories exist
      });
      
      mockStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);
      mockConfirm.mockResolvedValueOnce(false); // Overwrite declined
      mockWriteFileSync.mockImplementation(() => {});
      mockScanDirectory.mockReturnValue([]);
      
      mockSelect.mockResolvedValueOnce('exit'); // Exit after no files found
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should create output directory if it does not exist', async () => {
      mockInput
        .mockResolvedValueOnce('/mock/input')
        .mockResolvedValueOnce('/mock/nonexistent-output')
        .mockResolvedValueOnce('/mock/styles')
        .mockResolvedValueOnce('/mock/archive');
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockStatSync = vi.mocked(fs.statSync);
      const mockMkdirSync = vi.mocked(fs.mkdirSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockImplementation((filePath: string) => {
        if (filePath.includes('.env')) {
          return false; // .env doesn't exist
        }
        if (filePath.includes('nonexistent-output')) {
          return false; // output directory doesn't exist
        }
        return true; // input directory exists
      });
      
      mockStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);
      mockMkdirSync.mockImplementation(() => '');
      mockWriteFileSync.mockImplementation(() => {});
      mockScanDirectory.mockReturnValue([]);
      
      mockSelect.mockResolvedValueOnce('exit'); // Exit after no files found
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(mockMkdirSync).toHaveBeenCalledWith(
        '/mock/nonexistent-output',
        { recursive: true }
      );
    });
  });

  describe('Demo examples workflow', () => {
    beforeEach(() => {
      mockSelect.mockResolvedValueOnce('demo');
    });

    it('should create fallback demo when no examples are found', async () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockReturnValue(false); // No examples found
      mockWriteFileSync.mockImplementation(() => {});
      
      mockSelect.mockResolvedValueOnce('/mock/current/legal-markdown-demo.md');
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('legal-markdown-demo.md'),
        expect.stringContaining('Sample Legal Document')
      );
      
      expect(result).toBe('/mock/current/legal-markdown-demo.md');
    });

    it('should handle back to main menu from demo selection', async () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      mockExistsSync.mockReturnValue(true);
      
      mockSelect
        .mockResolvedValueOnce('back') // Back to main menu from demo
        .mockResolvedValueOnce('exit'); // Exit from main menu
      
      await expect(async () => {
        await handleFirstTimeUserExperience();
      }).rejects.toThrow('process.exit called');
      
      expect(mockSelect).toHaveBeenCalledTimes(3); // Main menu, demo selection, main menu again
    });

    it('should handle no examples available gracefully', async () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      
      mockExistsSync.mockReturnValue(false); // No examples directory
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write failed'); // Simulate write failure
      });
      
      mockHandleManualInput.mockResolvedValue('/mock/manual/fallback.md');
      
      const result = await handleFirstTimeUserExperience();
      
      expect(mockHandleManualInput).toHaveBeenCalled();
      expect(result).toBe('/mock/manual/fallback.md');
    });
  });

  describe('Error handling', () => {
    it('should handle user cancellation gracefully', async () => {
      const mockError = new Error('User force closed the prompt with Ctrl+C');
      mockSelect.mockRejectedValueOnce(mockError);
      
      await expect(handleFirstTimeUserExperience()).rejects.toThrow('User force closed');
    });

    it('should handle general errors', async () => {
      mockSelect.mockRejectedValueOnce(new Error('General error'));
      
      await expect(handleFirstTimeUserExperience()).rejects.toThrow('General error');
    });
  });
});