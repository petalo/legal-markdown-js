/**
 * @fileoverview Unit tests for Interactive CLI Service
 */

import { InteractiveService } from '../../../../src/cli/interactive/service';
import { CliService } from '../../../../src/cli/service';
import { InteractiveConfig } from '../../../../src/cli/interactive/types';
import { RESOLVED_PATHS } from '@constants';

// Mock the CliService
jest.mock('../../../../src/cli/service');
const MockedCliService = CliService as jest.MockedClass<typeof CliService>;

// Mock constants
jest.mock('@constants', () => ({
  RESOLVED_PATHS: {
    DEFAULT_INPUT_DIR: '/test/input',
    DEFAULT_OUTPUT_DIR: '/test/output',
    STYLES_DIR: '/test/styles',
    IMAGES_DIR: '/test/images',
  },
}));

describe('InteractiveService', () => {
  let mockCliService: jest.Mocked<CliService>;
  let sampleConfig: InteractiveConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCliService = {
      processFile: jest.fn(),
    } as any;
    MockedCliService.mockImplementation(() => mockCliService);

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
    it('should initialize with correct CLI options mapping', () => {
      new InteractiveService(sampleConfig);

      expect(MockedCliService).toHaveBeenCalledWith({
        debug: false,
        yamlOnly: false,
        noHeaders: false,
        noClauses: false,
        noReferences: false,
        noImports: false,
        noMixins: false,
        noReset: false,
        noIndent: false,
        throwOnYamlError: false,
        toMarkdown: false,
        exportMetadata: false,
        exportFormat: 'yaml',
        basePath: '/test/input',
        verbose: false,
        pdf: true,
        html: true,
        highlight: true,
        enableFieldTrackingInMarkdown: false,
        css: '/test/styles/contract.petalo.css',
        title: 'processed-contract',
        archiveSource: false,
      });
    });

    it('should handle configuration without CSS file', () => {
      const configWithoutCSS = { ...sampleConfig, cssFile: undefined };

      new InteractiveService(configWithoutCSS);

      expect(MockedCliService).toHaveBeenCalledWith(
        expect.objectContaining({
          css: undefined,
        })
      );
    });

    it('should map markdown output format correctly', () => {
      const configWithMarkdown = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, markdown: true },
      };

      new InteractiveService(configWithMarkdown);

      expect(MockedCliService).toHaveBeenCalledWith(
        expect.objectContaining({
          toMarkdown: true,
        })
      );
    });

    it('should map metadata export correctly', () => {
      const configWithMetadata = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, metadata: true },
      };

      new InteractiveService(configWithMetadata);

      expect(MockedCliService).toHaveBeenCalledWith(
        expect.objectContaining({
          exportMetadata: true,
          exportFormat: 'yaml',
        })
      );
    });

    it('should map field tracking correctly', () => {
      const configWithFieldTracking = {
        ...sampleConfig,
        processingOptions: { ...sampleConfig.processingOptions, fieldTracking: true },
      };

      new InteractiveService(configWithFieldTracking);

      expect(MockedCliService).toHaveBeenCalledWith(
        expect.objectContaining({
          enableFieldTrackingInMarkdown: true,
        })
      );
    });
  });

  describe('processFile', () => {
    it('should process all selected output formats', async () => {
      mockCliService.processFile.mockResolvedValue(undefined);

      const service = new InteractiveService(sampleConfig);
      const result = await service.processFile('/test/input/contract.md');

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

      // Should create a new service instance for metadata export  
      expect(MockedCliService).toHaveBeenCalledTimes(3); // Non-archiving service + metadata service + constructor
      expect(result.outputFiles).toContain('/test/output/processed-contract-metadata.yaml');
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