/**
 * @fileoverview Unit tests for format helper utilities
 */

import { formatConfigSummary, formatSuccessMessage, formatErrorMessage, formatWarningMessage } from '../../../../../src/cli/interactive/utils/format-helpers';
import { InteractiveConfig } from '../../../../../src/cli/interactive/types';

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
        cssFile: 'contract.petalo.css',
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Configuration Summary:');
      expect(result).toContain('Input file: /path/to/contract.md');
      expect(result).toContain('Output filename: processed-contract');
      expect(result).toContain('Output formats: PDF, HTML, Metadata');
      expect(result).toContain('CSS file: contract.petalo.css');
      expect(result).toContain('Processing options: Debug, Highlight');
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
        cssFile: undefined,
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('CSS file: None');
      expect(result).toContain('Output formats: HTML, Markdown');
      expect(result).toContain('Processing options: Field tracking');
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
      };

      const result = formatConfigSummary(config);

      expect(result).toContain('Output formats: PDF');
      expect(result).not.toContain('Processing options:');
    });
  });

  describe('formatSuccessMessage', () => {
    it('should format success message with multiple files', () => {
      const outputFiles = [
        '/output/contract.pdf',
        '/output/contract.html',
        '/output/contract-metadata.yaml',
      ];

      const result = formatSuccessMessage(outputFiles);

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('/output/contract.pdf');
      expect(result).toContain('/output/contract.html');
      expect(result).toContain('/output/contract-metadata.yaml');
    });

    it('should format success message with single file', () => {
      const outputFiles = ['/output/document.pdf'];

      const result = formatSuccessMessage(outputFiles);

      expect(result).toContain('Files generated successfully!');
      expect(result).toContain('/output/document.pdf');
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