/**
 * @fileoverview Unit tests for format helper utilities
 */

import {
  formatConfigSummary,
  formatSuccessMessage,
  formatErrorMessage,
  formatWarningMessage,
} from '../../../../../src/cli/interactive/utils/format-helpers';
import { InteractiveConfig, ProcessingResult } from '../../../../../src/cli/interactive/types';

// Mock chalk to disable colors in tests
jest.mock('chalk', () => {
  const mockFn = (str: string) => str;
  return {
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

      expect(result).toContain('Configuration Summary:');
      expect(result).toContain('Input file: /path/to/contract.md');
      expect(result).toContain('Output filename: processed-contract');
      expect(result).toContain('Output formats: PDF, HTML, Metadata');
      expect(result).toContain('CSS file: contract.petalo.css');
      expect(result).toContain('Processing options: Debug, Highlight');
      expect(result).toContain('Source archiving: Disabled');
    });

    it('should handle configuration without CSS file', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/document.md',
        outputFilename: 'document',
        outputFormats: {
          html: true,
          pdf: false,
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

      expect(result).toContain('CSS file: None');
      expect(result).toContain('Output formats: HTML, Markdown');
      expect(result).toContain('Processing options: Field tracking');
      expect(result).toContain('Source archiving: Disabled');
    });

    it('should handle configuration with no processing options', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/simple.md',
        outputFilename: 'simple',
        outputFormats: {
          html: false,
          pdf: true,
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

      expect(result).toContain('Output formats: PDF');
      expect(result).not.toContain('Processing options:');
      expect(result).toContain('Source archiving: Disabled');
    });

    it('should show archive options when enabled with default directory', () => {
      const config: InteractiveConfig = {
        inputFile: '/path/to/document.md',
        outputFilename: 'document',
        outputFormats: {
          html: false,
          pdf: true,
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

      expect(result).toContain('Source archiving: Enabled → default archive directory');
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

      expect(result).toContain('Source archiving: Enabled → ./custom-archive');
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

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('Generated files:');
      expect(result).toContain('/output/contract.pdf');
      expect(result).toContain('/output/contract.html');
      expect(result).toContain('/output/contract-metadata.yaml');
      expect(result).not.toContain('Source file archiving:');
    });

    it('should format success message with single file and no archiving', () => {
      const outputFiles = ['/output/document.pdf'];

      const result = formatSuccessMessage(outputFiles);

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('Generated files:');
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

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('Generated files:');
      expect(result).toContain('/output/document.pdf');
      expect(result).toContain('Source file archiving:');
      expect(result).toContain('Source archived to: /archive/document.md');
      expect(result).toContain('Content unchanged - template preserved');
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

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('Generated files:');
      expect(result).toContain('/output/contract.pdf');
      expect(result).toContain('Source file archiving:');
      expect(result).toContain('Template archived to: /archive/contract.ORIGINAL.md');
      expect(result).toContain('Processed archived to: /archive/contract.PROCESSED.md');
      expect(result).toContain('Content changed - both versions preserved');
    });

    it('should format success message with failed archiving', () => {
      const outputFiles = ['/output/document.pdf'];
      const archiveResult: ProcessingResult['archiveResult'] = {
        success: false,
        error: 'Permission denied',
      };

      const result = formatSuccessMessage(outputFiles, archiveResult);

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('Generated files:');
      expect(result).toContain('/output/document.pdf');
      expect(result).toContain('Source file archiving:');
      expect(result).toContain('Archiving failed: Permission denied');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message with emoji and styling', () => {
      const error = 'File not found: input.md';

      const result = formatErrorMessage(error);

      expect(result).toContain('❌ Error: File not found: input.md');
    });
  });

  describe('formatWarningMessage', () => {
    it('should format warning message with emoji and styling', () => {
      const warning = 'No CSS files found in styles directory';

      const result = formatWarningMessage(warning);

      expect(result).toContain('⚠️  Warning: No CSS files found in styles directory');
    });
  });
});
