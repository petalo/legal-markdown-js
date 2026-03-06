/**
 * Unit tests for internal functions in format-generator.ts
 *
 * Tests generateHtmlFormats and generatePdfFormats directly,
 * mocking HtmlGenerator and PDF connector dependencies.
 */

import type { LegalMarkdownProcessorResult } from '../../../../src/extensions/remark/legal-markdown-processor';
import type { FormatGenerationOptions } from '../../../../src/core/pipeline/format-generator';

// ---------------------------------------------------------------------------
// Mocks - use vi.hoisted() so variables are available in vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockGenerateHtml,
  mockPdfGeneratePdf,
  mockGenerateDocxFromHtml,
  mockPdfIsAvailable,
  mockResolvePdfConnector,
} = vi.hoisted(() => {
  const mockGenerateHtml = vi.fn();
  const mockPdfGeneratePdf = vi.fn();
  const mockGenerateDocxFromHtml = vi.fn();
  const mockPdfIsAvailable = vi.fn().mockResolvedValue(true);
  const mockResolvePdfConnector = vi.fn().mockResolvedValue({
    name: 'mock-connector',
    isAvailable: mockPdfIsAvailable,
    generatePdf: mockPdfGeneratePdf,
    getInfo: vi.fn(),
  });
  return {
    mockGenerateHtml,
    mockPdfGeneratePdf,
    mockGenerateDocxFromHtml,
    mockPdfIsAvailable,
    mockResolvePdfConnector,
  };
});

vi.mock('../../../../src/extensions/generators/html-generator', () => ({
  HtmlGenerator: vi.fn().mockImplementation(function () {
    return { generateHtml: mockGenerateHtml };
  }),
}));

vi.mock('../../../../src/extensions/generators/pdf-connectors', () => ({
  resolvePdfConnector: mockResolvePdfConnector,
}));

vi.mock('../../../../src/extensions/generators/docx-generator', () => ({
  DocxGenerator: vi.fn().mockImplementation(function () {
    return { generateDocxFromHtml: mockGenerateDocxFromHtml };
  }),
}));

vi.mock('../../../../src/utils', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('../../../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Import after mocks are set up
import {
  _generateHtmlFormats as generateHtmlFormats,
  _generatePdfFormats as generatePdfFormats,
  _generateDocxFormats as generateDocxFormats,
} from '../../../../src/core/pipeline/format-generator';
import { writeFileSync } from '../../../../src/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProcessedResult(
  overrides: Partial<LegalMarkdownProcessorResult> = {}
): LegalMarkdownProcessorResult {
  return {
    content: '# Test Document\n\nHello {{name}}' as never,
    metadata: { version: '1.0.0' },
    ...overrides,
  } as LegalMarkdownProcessorResult;
}

function makeOptions(overrides: Partial<FormatGenerationOptions> = {}): FormatGenerationOptions {
  return {
    outputDir: '/tmp/test-output',
    baseFilename: 'contract',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateHtmlFormats
// ---------------------------------------------------------------------------
describe('generateHtmlFormats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateHtml.mockResolvedValue('<html>normal</html>');
  });

  it('generates a single normal HTML file when highlight is not set', async () => {
    const result = await generateHtmlFormats(makeProcessedResult(), makeOptions());

    expect(mockGenerateHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includeHighlighting: false })
    );

    expect(result.normal).toBeDefined();
    expect(result.normal!.path).toBe('/tmp/test-output/contract.html');
    expect(result.normal!.content).toBe('<html>normal</html>');
    expect(result.highlight).toBeUndefined();

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test-output/contract.html',
      '<html>normal</html>'
    );
  });

  it('generates both normal and highlight HTML when highlight is true', async () => {
    mockGenerateHtml
      .mockResolvedValueOnce('<html>normal</html>')
      .mockResolvedValueOnce('<html>highlight</html>');

    const result = await generateHtmlFormats(
      makeProcessedResult(),
      makeOptions({ highlight: true })
    );

    expect(mockGenerateHtml).toHaveBeenCalledTimes(2);
    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includeHighlighting: false })
    );
    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includeHighlighting: true })
    );

    expect(result.normal!.path).toBe('/tmp/test-output/contract.html');
    expect(result.normal!.content).toBe('<html>normal</html>');
    expect(result.highlight!.path).toBe('/tmp/test-output/contract.HIGHLIGHT.html');
    expect(result.highlight!.content).toBe('<html>highlight</html>');

    expect(writeFileSync).toHaveBeenCalledTimes(2);
  });

  it('passes title from options (falls back to baseFilename)', async () => {
    await generateHtmlFormats(
      makeProcessedResult(),
      makeOptions({ title: 'My Contract Title' })
    );

    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: 'My Contract Title' })
    );
  });

  it('uses baseFilename as title when title is not provided', async () => {
    await generateHtmlFormats(makeProcessedResult(), makeOptions());

    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: 'contract' })
    );
  });

  it('passes cssPath and highlightCssPath to generator', async () => {
    await generateHtmlFormats(
      makeProcessedResult(),
      makeOptions({ cssPath: '/styles/main.css', highlightCssPath: '/styles/hl.css' })
    );

    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cssPath: '/styles/main.css',
        highlightCssPath: '/styles/hl.css',
      })
    );
  });

  it('passes metadata from processedResult to generator', async () => {
    const meta = { version: '2.0.0', title: 'Test' };
    await generateHtmlFormats(
      makeProcessedResult({ metadata: meta }),
      makeOptions()
    );

    expect(mockGenerateHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ metadata: meta })
    );
  });

  it('propagates errors from HtmlGenerator', async () => {
    mockGenerateHtml.mockRejectedValueOnce(new Error('HTML generation failed'));

    await expect(generateHtmlFormats(makeProcessedResult(), makeOptions())).rejects.toThrow(
      'HTML generation failed'
    );
  });
});

// ---------------------------------------------------------------------------
// generatePdfFormats
// ---------------------------------------------------------------------------
describe('generatePdfFormats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateHtml.mockResolvedValue('<html>generated</html>');
    mockPdfGeneratePdf.mockResolvedValue(undefined);
    mockResolvePdfConnector.mockResolvedValue({
      name: 'mock-connector',
      isAvailable: mockPdfIsAvailable,
      generatePdf: mockPdfGeneratePdf,
      getInfo: vi.fn(),
    });
  });

  it('generates a single normal PDF without highlight', async () => {
    const result = await generatePdfFormats(makeProcessedResult(), makeOptions());

    expect(mockResolvePdfConnector).toHaveBeenCalledWith('auto');
    expect(mockPdfGeneratePdf).toHaveBeenCalledTimes(1);
    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      '<html>generated</html>',
      '/tmp/test-output/contract.pdf',
      expect.objectContaining({ format: 'A4' })
    );
    expect(result.normal).toBe('/tmp/test-output/contract.pdf');
    expect(result.highlight).toBeUndefined();
  });

  it('generates both normal and highlight PDFs when highlight is true', async () => {
    mockGenerateHtml
      .mockResolvedValueOnce('<html>normal</html>')
      .mockResolvedValueOnce('<html>highlight</html>');

    const result = await generatePdfFormats(
      makeProcessedResult(),
      makeOptions({ highlight: true })
    );

    expect(mockPdfGeneratePdf).toHaveBeenCalledTimes(2);
    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      '<html>normal</html>',
      '/tmp/test-output/contract.pdf',
      expect.anything()
    );
    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      '<html>highlight</html>',
      '/tmp/test-output/contract.HIGHLIGHT.pdf',
      expect.anything()
    );
    expect(result.normal).toBe('/tmp/test-output/contract.pdf');
    expect(result.highlight).toBe('/tmp/test-output/contract.HIGHLIGHT.pdf');
  });

  it('reuses cached HTML instead of regenerating', async () => {
    const cachedHtml = {
      normal: { path: '/cached/normal.html', content: '<html>cached-normal</html>' },
      highlight: { path: '/cached/hl.html', content: '<html>cached-highlight</html>' },
    };

    const result = await generatePdfFormats(
      makeProcessedResult(),
      makeOptions({ highlight: true }),
      cachedHtml
    );

    // Should NOT call generateHtml since cached HTML is provided
    expect(mockGenerateHtml).not.toHaveBeenCalled();

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      '<html>cached-normal</html>',
      expect.stringContaining('contract.pdf'),
      expect.anything()
    );
    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      '<html>cached-highlight</html>',
      expect.stringContaining('contract.HIGHLIGHT.pdf'),
      expect.anything()
    );
    expect(result.normal).toBeDefined();
    expect(result.highlight).toBeDefined();
  });

  it('uses provided pdfConnector instead of resolving', async () => {
    const customConnector = {
      name: 'custom',
      isAvailable: vi.fn().mockResolvedValue(true),
      generatePdf: vi.fn().mockResolvedValue(undefined),
      getInfo: vi.fn(),
    };

    await generatePdfFormats(
      makeProcessedResult(),
      makeOptions({ pdfConnector: customConnector })
    );

    // Should NOT call resolvePdfConnector since a connector was provided
    expect(mockResolvePdfConnector).not.toHaveBeenCalled();
    expect(customConnector.generatePdf).toHaveBeenCalledTimes(1);
  });

  it('uses Letter format when specified', async () => {
    await generatePdfFormats(
      makeProcessedResult(),
      makeOptions({ format: 'Letter' })
    );

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ format: 'Letter' })
    );
  });

  it('defaults to A4 format', async () => {
    await generatePdfFormats(makeProcessedResult(), makeOptions());

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ format: 'A4' })
    );
  });

  it('includes footer template when version metadata is present', async () => {
    await generatePdfFormats(
      makeProcessedResult({ metadata: { version: '3.1.0' } }),
      makeOptions()
    );

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        footerTemplate: expect.stringContaining('3.1.0'),
      })
    );
  });

  it('omits footer template when version metadata is absent', async () => {
    await generatePdfFormats(
      makeProcessedResult({ metadata: {} }),
      makeOptions()
    );

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ footerTemplate: undefined })
    );
  });

  it('passes custom margins to PDF connector', async () => {
    const margin = { top: '2cm', bottom: '2cm', left: '1.5cm', right: '1.5cm' };
    await generatePdfFormats(
      makeProcessedResult(),
      makeOptions({ pdfMargin: margin })
    );

    expect(mockPdfGeneratePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ margin })
    );
  });

  it('propagates errors from PDF connector', async () => {
    mockPdfGeneratePdf.mockRejectedValueOnce(new Error('PDF engine crashed'));

    await expect(generatePdfFormats(makeProcessedResult(), makeOptions())).rejects.toThrow(
      'PDF engine crashed'
    );
  });
});

// ---------------------------------------------------------------------------
// generateDocxFormats
// ---------------------------------------------------------------------------
describe('generateDocxFormats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateHtml.mockResolvedValue('<html>generated</html>');
    mockGenerateDocxFromHtml.mockResolvedValue(Buffer.from('docx'));
  });

  it('generates a single normal DOCX without highlight', async () => {
    const result = await generateDocxFormats(makeProcessedResult(), makeOptions());

    expect(mockGenerateDocxFromHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateDocxFromHtml).toHaveBeenCalledWith(
      '<html>generated</html>',
      '/tmp/test-output/contract.docx',
      expect.objectContaining({ includeHighlighting: false })
    );
    expect(result.normal).toBe('/tmp/test-output/contract.docx');
    expect(result.highlight).toBeUndefined();
  });

  it('generates normal and highlight DOCX when highlight is true', async () => {
    mockGenerateHtml
      .mockResolvedValueOnce('<html>normal</html>')
      .mockResolvedValueOnce('<html>highlight</html>');

    const result = await generateDocxFormats(
      makeProcessedResult(),
      makeOptions({ highlight: true })
    );

    expect(mockGenerateDocxFromHtml).toHaveBeenCalledTimes(2);
    expect(mockGenerateDocxFromHtml).toHaveBeenCalledWith(
      '<html>normal</html>',
      '/tmp/test-output/contract.docx',
      expect.objectContaining({ includeHighlighting: false })
    );
    expect(mockGenerateDocxFromHtml).toHaveBeenCalledWith(
      '<html>highlight</html>',
      '/tmp/test-output/contract.HIGHLIGHT.docx',
      expect.objectContaining({ includeHighlighting: true })
    );
    expect(result.normal).toBe('/tmp/test-output/contract.docx');
    expect(result.highlight).toBe('/tmp/test-output/contract.HIGHLIGHT.docx');
  });

  it('reuses cached HTML when provided', async () => {
    const cachedHtml = {
      normal: { path: '/cached/normal.html', content: '<html>cached-normal</html>' },
      highlight: { path: '/cached/highlight.html', content: '<html>cached-highlight</html>' },
    };

    await generateDocxFormats(
      makeProcessedResult(),
      makeOptions({ highlight: true }),
      cachedHtml
    );

    expect(mockGenerateHtml).not.toHaveBeenCalled();
    expect(mockGenerateDocxFromHtml).toHaveBeenCalledWith(
      '<html>cached-normal</html>',
      expect.stringContaining('contract.docx'),
      expect.anything()
    );
    expect(mockGenerateDocxFromHtml).toHaveBeenCalledWith(
      '<html>cached-highlight</html>',
      expect.stringContaining('contract.HIGHLIGHT.docx'),
      expect.anything()
    );
  });
});
