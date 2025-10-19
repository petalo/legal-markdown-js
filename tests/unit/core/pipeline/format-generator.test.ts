/**
 * Unit tests for Phase 3: Format Generator
 *
 * Tests the generateAllFormats function that creates all requested output
 * formats (HTML, PDF, Markdown, metadata) from cached processing results.
 *
 * @module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateAllFormats,
  type FormatGenerationOptions,
} from '../../../../src/core/pipeline/format-generator';
import type { LegalMarkdownProcessorResult } from '../../../../src/extensions/remark/legal-markdown-processor';
import { asMarkdown } from '../../../../src/types/content-formats';

// Mock dependencies
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
  };
});

// Mock the actual generator modules
vi.mock('../../../../src/extensions/generators/html-generator', () => ({
  HtmlGenerator: class {
    async generateHtml() {
      return '<html>Test</html>';
    }
  },
}));

vi.mock('../../../../src/extensions/generators/pdf-generator', () => ({
  PdfGenerator: class {
    async generatePdfFromHtml() {
      return;
    }
  },
}));

vi.mock('../../../../src/utils', () => ({
  writeFileSync: vi.fn(),
}));

import { writeFileSync } from '../../../../src/utils';
import * as fs from 'fs';

const mockedWriteFileSync = writeFileSync as ReturnType<typeof vi.fn>;
const mockedMkdirSync = fs.mkdirSync as ReturnType<typeof vi.fn>;

describe('Phase 3: Format Generator', () => {
  let sampleProcessedResult: LegalMarkdownProcessorResult;

  beforeEach(() => {
    vi.clearAllMocks();

    sampleProcessedResult = {
      content: asMarkdown('# Processed Content\n\nTest content'),
      metadata: {
        title: 'Test Document',
        author: 'Test Author',
      },
      stats: {
        processingTime: 100,
        pluginsUsed: ['remarkHeaders', 'remarkClauses'],
        crossReferencesFound: 0,
        fieldsTracked: 0,
      },
      warnings: [],
    };
  });

  describe('generateAllFormats', () => {
    it('should generate HTML format only', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: true,
        pdf: false,
        markdown: false,
        metadata: false,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(mockedWriteFileSync).toHaveBeenCalled();
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0]).toContain('document.html');
      expect(result.results.html?.normal).toBeDefined();
      expect(result.results.pdf).toBeUndefined();
    });

    it('should generate PDF format only', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: false,
        pdf: true,
        markdown: false,
        metadata: false,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0]).toContain('document.pdf');
      expect(result.results.pdf?.normal).toBeDefined();
    });

    it('should generate both HTML and PDF', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: true,
        pdf: true,
        markdown: false,
        metadata: false,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(result.generatedFiles.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate highlight versions when requested', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: true,
        pdf: true,
        markdown: false,
        metadata: false,
        highlight: true,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      // Should generate normal + highlight for both HTML and PDF = 4 files
      expect(result.generatedFiles).toHaveLength(4);
      expect(result.results.html?.normal).toBeDefined();
      expect(result.results.html?.highlight).toBeDefined();
      expect(result.results.pdf?.normal).toBeDefined();
      expect(result.results.pdf?.highlight).toBeDefined();

      // Verify highlight files have correct naming
      expect(result.results.html?.highlight).toContain('HIGHLIGHT.html');
      expect(result.results.pdf?.highlight).toContain('HIGHLIGHT.pdf');
    });

    it('should generate markdown output', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: false,
        pdf: false,
        markdown: true,
        metadata: false,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('document.md'),
        sampleProcessedResult.content
      );
      expect(result.results.markdown).toContain('document.md');
    });

    it('should include metadata files when available', async () => {
      const processedWithMetadata = {
        ...sampleProcessedResult,
        exportedFiles: ['/test/output/document-metadata.yaml'],
      };

      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: false,
        pdf: false,
        markdown: false,
        metadata: true,
      };

      const result = await generateAllFormats(processedWithMetadata, options);

      expect(result.results.metadata).toContain('/test/output/document-metadata.yaml');
      expect(result.generatedFiles).toContain('/test/output/document-metadata.yaml');
    });

    it('should create output directory if it does not exist', async () => {
      (fs.existsSync as any).mockReturnValue(false);

      const options: FormatGenerationOptions = {
        outputDir: '/test/new/output',
        baseFilename: 'document',
        html: true,
      };

      await generateAllFormats(sampleProcessedResult, options);

      expect(mockedMkdirSync).toHaveBeenCalledWith('/test/new/output', { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      (fs.existsSync as any).mockReturnValue(true);

      const options: FormatGenerationOptions = {
        outputDir: '/test/existing/output',
        baseFilename: 'document',
        html: true,
      };

      await generateAllFormats(sampleProcessedResult, options);

      expect(mockedMkdirSync).not.toHaveBeenCalled();
    });

    it('should handle parallel format generation', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: true,
        pdf: true,
        markdown: true,
        metadata: false,
      };

      const startTime = Date.now();
      await generateAllFormats(sampleProcessedResult, options);
      const endTime = Date.now();

      // Formats should be generated in parallel, not sequentially
      // This is a rough check - if they were sequential, we'd see much more time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should include processing statistics', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: true,
        pdf: true,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(result.stats).toBeDefined();
      expect(result.stats.totalFiles).toBeGreaterThan(0);
      expect(result.stats.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate nothing when no formats are requested', async () => {
      const options: FormatGenerationOptions = {
        outputDir: '/test/output',
        baseFilename: 'document',
        html: false,
        pdf: false,
        markdown: false,
        metadata: false,
      };

      const result = await generateAllFormats(sampleProcessedResult, options);

      expect(result.generatedFiles).toHaveLength(0);
    });
  });
});
