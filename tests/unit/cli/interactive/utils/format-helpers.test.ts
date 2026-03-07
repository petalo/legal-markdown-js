/**
 * @fileoverview Unit tests for format helper utilities
 */

import { vi } from 'vitest';
import {
  formatConfigSummary,
  formatSuccessMessage,
  formatErrorMessage,
  formatWarningMessage,
} from '../../../../../src/cli/interactive/utils/format-helpers';
import { InteractiveConfig, ProcessingResult } from '../../../../../src/cli/interactive/types';

// Mock chalk to disable colors in tests
vi.mock('chalk', () => {
  const mockFn = (str: string) => str;
  return {
    default: {
      bold: Object.assign(mockFn, {
        cyan: mockFn,
        green: mockFn,
        red: mockFn,
        yellow: mockFn,
      }),
      cyan: mockFn,
      gray: mockFn,
      green: mockFn,
      red: mockFn,
      yellow: mockFn,
    },
    bold: Object.assign(mockFn, {
      cyan: mockFn,
      green: mockFn,
      red: mockFn,
      yellow: mockFn,
    }),
    cyan: mockFn,
    gray: mockFn,
    green: mockFn,
    red: mockFn,
    yellow: mockFn,
  };
});

describe('Format Helper Utilities', () => {
  describe('formatConfigSummary', () => {
    it('should format complete configuration summary', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/contract.md',
        outputFilename: 'processed-contract',
        outputFormats: {
          html: true,
          pdf: true,
          docx: false,
          markdown: false,
          metadata: true,
        },
        processingOptions: {
          debug: true,
          fieldTracking: false,
          highlight: true,
        },
        archiveOptions: {
          enabled: false,
        },
        cssFile: 'contract.petalo.css',
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Configuration summary:');
      expect(result).toContain('Input:');
      expect(result).toContain('/path/to/contract.md');
      expect(result).toContain('Output:');
      expect(result).toContain('processed-contract');
      expect(result).toContain('Formats:');
      expect(result).toContain('CSS:');
      expect(result).toContain('Options:');
      expect(result).toContain('Archiving:');
      expect(result).toContain('disabled');
    });

    it('should handle configuration without CSS file', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/document.md',
        outputFilename: 'document',
        outputFormats: {
          html: true,
          pdf: false,
          docx: false,
          markdown: true,
          metadata: false,
        },
        processingOptions: {
          debug: false,
          fieldTracking: true,
          highlight: false,
        },
        archiveOptions: {
          enabled: false,
        },
        cssFile: undefined,
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('CSS:');
      expect(result).toContain('none');
      expect(result).toContain('Formats:');
      expect(result).toContain('Options:');
      expect(result).toContain('field tracking');
      expect(result).toContain('Archiving:');
      expect(result).toContain('disabled');
    });

    it('should handle configuration with no processing options', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/simple.md',
        outputFilename: 'simple',
        outputFormats: {
          html: false,
          pdf: true,
          docx: false,
          markdown: false,
          metadata: false,
        },
        processingOptions: {
          debug: false,
          fieldTracking: false,
          highlight: false,
        },
        archiveOptions: {
          enabled: false,
        },
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Formats:');
      expect(result).not.toContain('Options:');
      expect(result).toContain('Archiving:');
      expect(result).toContain('disabled');
    });

    it('should show archive options when enabled with default directory', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/document.md',
        outputFilename: 'document',
        outputFormats: {
          html: false,
          pdf: true,
          docx: false,
          markdown: false,
          metadata: false,
        },
        processingOptions: {
          debug: false,
          fieldTracking: false,
          highlight: false,
        },
        archiveOptions: {
          enabled: true,
        },
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Archiving:');
      expect(result).toContain('enabled');
      expect(result).toContain('default archive directory');
      expect(result).toContain(
        'Smart archiving will determine file handling based on content changes'
      );
    });

    it('should show archive options when enabled with custom directory', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/document.md',
        outputFilename: 'document',
        outputFormats: {
          html: false,
          pdf: true,
          docx: false,
          markdown: false,
          metadata: false,
        },
        processingOptions: {
          debug: false,
          fieldTracking: false,
          highlight: false,
        },
        archiveOptions: {
          enabled: true,
          directory: './custom-archive',
        },
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Archiving:');
      expect(result).toContain('enabled');
      expect(result).toContain('./custom-archive');
      // eslint-disable-next-line max-len
      expect(result).toContain(
        'Smart archiving will determine file handling based on content changes'
      );
    });
  });

  describe('formatSuccessMessage', () => {
    it('should format success message with multiple files and no archiving', () => {
      const outputFiles = [
        '/output/contract.pdf',
        '/output/contract.html',
        '/output/contract-metadata.yaml',
      ];

      const result = formatSuccessMessage(outputFiles);

      expect(result).toContain('Processing complete');
      expect(result).toContain('Generated:');
      expect(result).toContain('/output/contract.pdf');
      expect(result).toContain('/output/contract.html');
      expect(result).toContain('/output/contract-metadata.yaml');
      expect(result).not.toContain('Source file archiving:');
    });

    it('should format success message with single file and no archiving', () => {
      const outputFiles = ['/output/document.pdf'];

      const result = formatSuccessMessage(outputFiles);

      expect(result).toContain('Processing complete');
      expect(result).toContain('Generated:');
      expect(result).toContain('/output/document.pdf');
      expect(result).not.toContain('Source file archiving:');
    });

    it('should format success message with archiving (identical content)', () => {
      const outputFiles = ['/output/document.pdf'];
      const archiveResult: ProcessingResult['archiveResult'] = {
        success: true,
        contentsIdentical: true,
        archivedPath: '/archive/document.md',
      };

      const result = formatSuccessMessage(outputFiles, archiveResult);

      expect(result).toContain('Processing complete');
      expect(result).toContain('Generated:');
      expect(result).toContain('/output/document.pdf');
      expect(result).not.toContain('Source file archiving:');
    });

    it('should format success message with archiving (different content)', () => {
      const outputFiles = ['/output/contract.pdf'];
      const archiveResult: ProcessingResult['archiveResult'] = {
        success: true,
        contentsIdentical: false,
        archivedOriginalPath: '/archive/contract.ORIGINAL.md',
        archivedProcessedPath: '/archive/contract.PROCESSED.md',
      };

      const result = formatSuccessMessage(outputFiles, archiveResult);

      expect(result).toContain('Processing complete');
      expect(result).toContain('Generated:');
      expect(result).toContain('/output/contract.pdf');
      expect(result).not.toContain('Source file archiving:');
    });

    it('should format success message with failed archiving', () => {
      const outputFiles = ['/output/document.pdf'];
      const archiveResult: ProcessingResult['archiveResult'] = {
        success: false,
        error: 'Permission denied',
      };

      const result = formatSuccessMessage(outputFiles, archiveResult);

      expect(result).toContain('Processing complete');
      expect(result).toContain('Generated:');
      expect(result).toContain('/output/document.pdf');
      expect(result).toContain('Archiving:');
      expect(result).toContain('Archiving failed: Permission denied');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message with symbol and styling', () => {
      const error = 'File not found: input.md';

      const result = formatErrorMessage(error);

      expect(result).toContain('✗ Error: File not found: input.md');
    });
  });

  describe('formatWarningMessage', () => {
    it('should format warning message with symbol and styling', () => {
      const warning = 'No CSS files found in styles directory';

      const result = formatWarningMessage(warning);

      expect(result).toContain('! Warning: No CSS files found in styles directory');
    });
  });
});
