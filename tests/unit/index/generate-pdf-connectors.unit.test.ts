import { afterEach, describe, expect, it, vi } from 'vitest';

describe('public generatePdf connector routing', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('uses non-puppeteer connectors through HTML + connector pipeline', async () => {
    const processMock = vi.fn().mockResolvedValue({
      content: '# Agreement',
      metadata: { title: 'Agreement Title' },
    });
    const htmlMock = vi.fn().mockResolvedValue('<html><body>ok</body></html>');
    const puppeteerPdfMock = vi.fn().mockResolvedValue(Buffer.from('puppeteer'));
    const connectorGenerateMock = vi.fn().mockResolvedValue(undefined);
    const resolveConnectorMock = vi.fn().mockResolvedValue({
      name: 'weasyprint',
      generatePdf: connectorGenerateMock,
    });
    const readFileMock = vi.fn().mockResolvedValue(Buffer.from('connector'));

    vi.doMock('../../../src/extensions/remark/legal-markdown-processor', () => ({
      processLegalMarkdown: processMock,
    }));
    vi.doMock('../../../src/extensions/generators/html-generator', () => ({
      htmlGenerator: {
        generateHtml: htmlMock,
      },
    }));
    vi.doMock('../../../src/extensions/generators/pdf-generator', () => ({
      pdfGenerator: {
        generatePdf: puppeteerPdfMock,
      },
    }));
    vi.doMock('../../../src/extensions/generators/pdf-connectors', () => ({
      resolvePdfConnector: resolveConnectorMock,
    }));
    vi.doMock('fs/promises', () => ({
      readFile: readFileMock,
    }));

    const { generatePdf } = await import('../../../src/index');
    const result = await generatePdf('input', '/tmp/generated.pdf', { pdfConnector: 'weasyprint' });

    expect(resolveConnectorMock).toHaveBeenCalledWith('weasyprint');
    expect(htmlMock).toHaveBeenCalled();
    expect(connectorGenerateMock).toHaveBeenCalledWith(
      '<html><body>ok</body></html>',
      '/tmp/generated.pdf',
      expect.objectContaining({
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      })
    );
    expect(readFileMock).toHaveBeenCalledWith('/tmp/generated.pdf');
    expect(puppeteerPdfMock).not.toHaveBeenCalled();
    expect(result).toEqual(Buffer.from('connector'));
  });

  it('keeps puppeteer flow when resolver selects puppeteer', async () => {
    const processMock = vi.fn().mockResolvedValue({
      content: '# Agreement',
      metadata: { title: 'Agreement Title' },
    });
    const htmlMock = vi.fn();
    const puppeteerPdfMock = vi.fn().mockResolvedValue(Buffer.from('puppeteer'));
    const connectorGenerateMock = vi.fn();
    const resolveConnectorMock = vi.fn().mockResolvedValue({
      name: 'puppeteer',
      generatePdf: connectorGenerateMock,
    });

    vi.doMock('../../../src/extensions/remark/legal-markdown-processor', () => ({
      processLegalMarkdown: processMock,
    }));
    vi.doMock('../../../src/extensions/generators/html-generator', () => ({
      htmlGenerator: {
        generateHtml: htmlMock,
      },
    }));
    vi.doMock('../../../src/extensions/generators/pdf-generator', () => ({
      pdfGenerator: {
        generatePdf: puppeteerPdfMock,
      },
    }));
    vi.doMock('../../../src/extensions/generators/pdf-connectors', () => ({
      resolvePdfConnector: resolveConnectorMock,
    }));

    const { generatePdf } = await import('../../../src/index');
    const result = await generatePdf('input', '/tmp/generated.pdf');

    expect(resolveConnectorMock).toHaveBeenCalledWith('auto');
    expect(puppeteerPdfMock).toHaveBeenCalledWith('# Agreement', '/tmp/generated.pdf', {
      cssPath: undefined,
      highlightCssPath: expect.stringContaining('src/styles/highlight.css'),
      includeHighlighting: undefined,
      title: 'Agreement Title',
      metadata: { title: 'Agreement Title' },
      format: undefined,
      landscape: undefined,
      headerTemplate: undefined,
      footerTemplate: undefined,
    });
    expect(htmlMock).not.toHaveBeenCalled();
    expect(connectorGenerateMock).not.toHaveBeenCalled();
    expect(result).toEqual(Buffer.from('puppeteer'));
  });
});
