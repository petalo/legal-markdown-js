/**
 * Unit tests for Interactive CLI Service
 *
 * @module
 */

import { InteractiveService } from '../../../../src/cli/interactive/service';
import { CliService } from '../../../../src/cli/service';
import { InteractiveConfig } from '../../../../src/cli/interactive/types';
import { RESOLVED_PATHS } from '@constants';
import { readFileSync } from '@utils';
import { processLegalMarkdown } from '../../../../src/index';
import { vi, MockedClass, MockedFunction, Mocked } from 'vitest';

// Mock the CliService
vi.mock('../../../../src/cli/service');
const MockedCliService = CliService as MockedClass<typeof CliService>;

// Mock the readFileSync and processLegalMarkdown functions
vi.mock('@utils', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('../../../../src/index', () => ({
  processLegalMarkdown: vi.fn(),
}));

const mockedReadFileSync = readFileSync as MockedFunction<typeof readFileSync>;
const mockedProcessLegalMarkdown = processLegalMarkdown as MockedFunction<typeof processLegalMarkdown>;

// Mock constants
vi.mock('@constants', () => ({
  RESOLVED_PATHS: {
    DEFAULT_INPUT_DIR: '/test/input',
    DEFAULT_OUTPUT_DIR: '/test/output',
    STYLES_DIR: '/test/styles',
    IMAGES_DIR: '/test/images',
  },
}));

describe('InteractiveService', () => {
  let mockCliService: Mocked<CliService>;
  let sampleConfig: InteractiveConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCliService = {
      processFile: vi.fn(),
    } as any;
    MockedCliService.mockImplementation(() => mockCliService);

    // Setup mocks
    mockedReadFileSync.mockReturnValue('# Test content');
    mockedProcessLegalMarkdown.mockReturnValue({
      content: '# Test content',
      metadata: {},
      exportedFiles: ['/test/output/processed-contract-metadata.yaml']
    });

    sampleConfig = {
      inputFile: '/test/input/contract.md',
      outputFilename: 'processed-contract',
      outputFormats: {
        html: true,
        pdf: true,
        markdown: false,
        metadata: false,
      },
      processingOptions: {
        debug: false,
        fieldTracking: false,
        highlight: true,
      },
      archiveOptions: {
        enabled: false,
      },
      cssFile: 'contract.petalo.css',
    };
  });

  describe('constructor', () => {
    it('should initialize without creating CliService instance', () => {
      const service = new InteractiveService(sampleConfig);

      // Constructor should not create CliService instances anymore
      expect(MockedCliService).not.toHaveBeenCalled();
      expect(service).toBeInstanceOf(InteractiveService);
    });

    it('should store configuration correctly', () => {
      const service = new InteractiveService(sampleConfig);
      
      // Test that the service stores the config (we can't access private members directly,
      // but we can verify behavior indirectly through processFile)
      expect(service).toBeInstanceOf(InteractiveService);
    });
  });

  describe('processFile', () => {
    it('should process all selected output formats with silent flag', async () => {
      mockCliService.processFile.mockResolvedValue(undefined);

      const service = new InteractiveService(sampleConfig);
      const result = await service.processFile('/test/input/contract.md');

      // Should create CliService instance with silent flag
      expect(MockedCliService).toHaveBeenCalledWith(
        expect.objectContaining({
          silent: true,
          archiveSource: false,
          pdf: true,
          html: true,
          highlight: true,
        })
      );

      expect(mockCliService.processFile).toHaveBeenCalledTimes(2); // PDF + HTML
      expect(mockCliService.processFile).toHaveBeenCalledWith(
        '/test/input/contract.md',
        '/test/output/processed-contract.pdf'
      );
      expect(mockCliService.processFile).toHaveBeenCalledWith(
        '/test/input/contract.md',
        '/test/output/processed-contract.html'
      );

      expect(result).toEqual({
        outputFiles: [
          '/test/output/processed-contract.pdf',
          '/test/output/processed-contract.HIGHLIGHT.pdf',
          '/test/output/processed-contract.html',
          '/test/output/processed-contract.HIGHLIGHT.html',
        ],
        archiveResult: undefined,
      });
    });

    it('should process markdown output when selected', async () => {
      const configWithMarkdown = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, markdown: true },
      };

      mockCliService.processFile.mockResolvedValue(undefined);

      const service = new InteractiveService(configWithMarkdown);
      const result = await service.processFile('/test/input/contract.md');

      expect(mockCliService.processFile).toHaveBeenCalledWith(
        '/test/input/contract.md',
        '/test/output/processed-contract.md'
      );

      expect(result.outputFiles).toContain('/test/output/processed-contract.md');
    });

    it('should process metadata export when selected', async () => {
      const configWithMetadata = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, metadata: true },
      };

      mockCliService.processFile.mockResolvedValue(undefined);

      const service = new InteractiveService(configWithMetadata);
      const result = await service.processFile('/test/input/contract.md');

      // Should only create nonArchivingService (constructor)
      expect(MockedCliService).toHaveBeenCalledTimes(1);
      // Should call processLegalMarkdown directly for metadata
      expect(mockedProcessLegalMarkdown).toHaveBeenCalledWith(
        '# Test content',
        expect.objectContaining({
          exportMetadata: true,
          exportFormat: 'yaml',
          exportPath: '/test/output/processed-contract-metadata.yaml'
        })
      );
      expect(result.outputFiles).toContain('/test/output/processed-contract-metadata.yaml');
    });

    it('should handle metadata export failure', async () => {
      const configWithMetadata = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, metadata: true },
      };

      mockCliService.processFile.mockResolvedValue(undefined);
      // Mock metadata export failure
      mockedProcessLegalMarkdown.mockReturnValue({
        content: '# Test content',
        metadata: {},
        exportedFiles: [] // No exported files indicates failure
      });

      const service = new InteractiveService(configWithMetadata);

      await expect(service.processFile('/test/input/contract.md')).rejects.toThrow(
        'Failed to export metadata to: /test/output/processed-contract-metadata.yaml'
      );
    });

    it('should handle processing errors', async () => {
      mockCliService.processFile.mockRejectedValue(new Error('Processing failed'));

      const service = new InteractiveService(sampleConfig);

      await expect(service.processFile('/test/input/contract.md')).rejects.toThrow(
        'Processing failed: Processing failed'
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockCliService.processFile.mockRejectedValue('String error');

      const service = new InteractiveService(sampleConfig);

      await expect(service.processFile('/test/input/contract.md')).rejects.toThrow(
        'Processing failed: String error'
      );
    });
  });
});