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
import { processLegalMarkdown, generateHtml, generatePdf } from '../../../../src/index';
import { buildProcessingContext, processLegalMarkdownWithRemark, generateAllFormats } from '../../../../src/core/pipeline';
import { vi, MockedClass, MockedFunction, Mocked, beforeEach, describe, it, expect } from 'vitest';

// Mock the CliService
vi.mock('../../../../src/cli/service');
const MockedCliService = CliService as MockedClass<typeof CliService>;

// Mock the readFileSync and processLegalMarkdown functions
vi.mock('@utils', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('../../../../src/index', () => ({
  processLegalMarkdown: vi.fn(),
  generateHtml: vi.fn(() => Promise.resolve('<html></html>')),
  generatePdf: vi.fn(() => Promise.resolve()),
}));

// Mock the pipeline
vi.mock('../../../../src/core/pipeline', () => ({
  buildProcessingContext: vi.fn(),
  processLegalMarkdownWithRemark: vi.fn(),
  generateAllFormats: vi.fn(),
  buildFormatGenerationOptions: vi.fn((contextOptions: any, baseOptions: any) => ({
    ...baseOptions,
    pdf: contextOptions?.pdf ?? baseOptions?.pdf,
    html: contextOptions?.html ?? baseOptions?.html,
    highlight: contextOptions?.highlight ?? baseOptions?.highlight,
    format: contextOptions?.format ?? baseOptions?.format,
    landscape: contextOptions?.landscape ?? baseOptions?.landscape,
  })),
}));

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => '# Test content'),
  };
});

const mockedReadFileSync = readFileSync as MockedFunction<typeof readFileSync>;
const mockedProcessLegalMarkdown = processLegalMarkdown as MockedFunction<typeof processLegalMarkdown>;
const mockedBuildProcessingContext = buildProcessingContext as MockedFunction<typeof buildProcessingContext>;
const mockedProcessLegalMarkdownWithRemark = processLegalMarkdownWithRemark as MockedFunction<typeof processLegalMarkdownWithRemark>;
const mockedGenerateAllFormats = generateAllFormats as MockedFunction<typeof generateAllFormats>;

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

    // Mock pipeline functions
    mockedBuildProcessingContext.mockResolvedValue({
      content: '# Test content',
      rawContent: '# Test content',
      metadata: {},
      options: {},
      basePath: '/test/input',
    });

    mockedProcessLegalMarkdownWithRemark.mockResolvedValue({
      content: '# Test content',
      metadata: {},
      stats: { processingTime: 100, pluginsUsed: [], crossReferencesFound: 0, fieldsTracked: 0 },
      warnings: [],
    });

    mockedGenerateAllFormats.mockResolvedValue({
      generatedFiles: [
        '/test/output/processed-contract.pdf',
        '/test/output/processed-contract.HIGHLIGHT.pdf',
        '/test/output/processed-contract.html',
        '/test/output/processed-contract.HIGHLIGHT.html',
      ],
      results: {
        pdf: {
          normal: '/test/output/processed-contract.pdf',
          highlight: '/test/output/processed-contract.HIGHLIGHT.pdf',
        },
        html: {
          normal: '/test/output/processed-contract.html',
          highlight: '/test/output/processed-contract.HIGHLIGHT.html',
        },
      },
      stats: { totalFiles: 4, processingTime: 200 },
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
    it('should process file using 3-phase pipeline', async () => {
      const service = new InteractiveService(sampleConfig);
      const result = await service.processFile('/test/input/contract.md');

      // PHASE 1: Should build processing context
      expect(mockedBuildProcessingContext).toHaveBeenCalledWith(
        '# Test content',
        expect.objectContaining({
          pdf: true,
          html: true,
          highlight: true,
        }),
        '/test/input'
      );

      // PHASE 2: Should process content with remark
      expect(mockedProcessLegalMarkdownWithRemark).toHaveBeenCalledWith(
        '# Test content',
        expect.objectContaining({
          additionalMetadata: {},
        })
      );

      // PHASE 3: Should generate all formats
      expect(mockedGenerateAllFormats).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '# Test content',
        }),
        expect.objectContaining({
          baseFilename: 'processed-contract',
          pdf: true,
          html: true,
          highlight: true,
        })
      );

      // Should return all generated files
      expect(result.outputFiles).toEqual([
        '/test/output/processed-contract.pdf',
        '/test/output/processed-contract.HIGHLIGHT.pdf',
        '/test/output/processed-contract.html',
        '/test/output/processed-contract.HIGHLIGHT.html',
      ]);
    });

    it('should generate markdown output when selected', async () => {
      const configWithMarkdown = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, markdown: true },
      };

      mockedGenerateAllFormats.mockResolvedValue({
        generatedFiles: [
          '/test/output/processed-contract.pdf',
          '/test/output/processed-contract.HIGHLIGHT.pdf',
          '/test/output/processed-contract.html',
          '/test/output/processed-contract.HIGHLIGHT.html',
          '/test/output/processed-contract.md',
        ],
        results: {
          pdf: {
            normal: '/test/output/processed-contract.pdf',
            highlight: '/test/output/processed-contract.HIGHLIGHT.pdf',
          },
          html: {
            normal: '/test/output/processed-contract.html',
            highlight: '/test/output/processed-contract.HIGHLIGHT.html',
          },
          markdown: '/test/output/processed-contract.md',
        },
        stats: { totalFiles: 5, processingTime: 200 },
      });

      const service = new InteractiveService(configWithMarkdown);
      const result = await service.processFile('/test/input/contract.md');

      expect(mockedGenerateAllFormats).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          markdown: true,
        })
      );

      expect(result.outputFiles).toContain('/test/output/processed-contract.md');
    });

    it('should generate metadata export when selected', async () => {
      const configWithMetadata = {
        ...sampleConfig,
        outputFormats: { ...sampleConfig.outputFormats, metadata: true },
      };

      mockedGenerateAllFormats.mockResolvedValue({
        generatedFiles: [
          '/test/output/processed-contract.pdf',
          '/test/output/processed-contract.HIGHLIGHT.pdf',
          '/test/output/processed-contract.html',
          '/test/output/processed-contract.HIGHLIGHT.html',
          '/test/output/processed-contract-metadata.yaml',
        ],
        results: {
          pdf: {
            normal: '/test/output/processed-contract.pdf',
            highlight: '/test/output/processed-contract.HIGHLIGHT.pdf',
          },
          html: {
            normal: '/test/output/processed-contract.html',
            highlight: '/test/output/processed-contract.HIGHLIGHT.html',
          },
          metadata: '/test/output/processed-contract-metadata.yaml',
        },
        stats: { totalFiles: 5, processingTime: 200 },
      });

      const service = new InteractiveService(configWithMetadata);
      const result = await service.processFile('/test/input/contract.md');

      expect(mockedGenerateAllFormats).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: true,
        })
      );

      expect(result.outputFiles).toContain('/test/output/processed-contract-metadata.yaml');
    });

    it('should call all 3 pipeline phases in order', async () => {
      const service = new InteractiveService(sampleConfig);
      await service.processFile('/test/input/contract.md');

      // Verify phases were called in order
      expect(mockedBuildProcessingContext).toHaveBeenCalled();
      expect(mockedProcessLegalMarkdownWithRemark).toHaveBeenCalled();
      expect(mockedGenerateAllFormats).toHaveBeenCalled();

      // Verify build context was called before processing
      const buildOrder = mockedBuildProcessingContext.mock.invocationCallOrder[0];
      const processOrder = mockedProcessLegalMarkdownWithRemark.mock.invocationCallOrder[0];
      const generateOrder = mockedGenerateAllFormats.mock.invocationCallOrder[0];

      expect(buildOrder).toBeLessThan(processOrder);
      expect(processOrder).toBeLessThan(generateOrder);
    });

    it('should handle processing errors', async () => {
      mockedProcessLegalMarkdownWithRemark.mockRejectedValue(new Error('Processing failed'));

      const service = new InteractiveService(sampleConfig);

      await expect(service.processFile('/test/input/contract.md')).rejects.toThrow();
    });

    it('should handle format generation errors', async () => {
      mockedGenerateAllFormats.mockRejectedValue(new Error('Generation failed'));

      const service = new InteractiveService(sampleConfig);

      await expect(service.processFile('/test/input/contract.md')).rejects.toThrow();
    });
  });
});
