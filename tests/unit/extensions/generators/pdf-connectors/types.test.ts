import { describe, expect, it } from 'vitest';
import type {
  ConnectorInfo,
  PdfConnector,
  PdfConnectorPreference,
  PdfOptions,
} from '../../../../../src/extensions/generators/pdf-connectors';

describe('pdf connector types', () => {
  it('supports the expected connector preference values', () => {
    const values: PdfConnectorPreference[] = ['auto', 'puppeteer', 'system-chrome', 'weasyprint'];

    expect(values).toHaveLength(4);
  });

  it('matches the PdfConnector contract shape', async () => {
    const info: ConnectorInfo = {
      name: 'mock',
      version: '1.0.0',
      executablePath: '/tmp/mock-bin',
    };

    const options: PdfOptions = {
      format: 'A4',
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
      landscape: false,
    };

    const connector: PdfConnector = {
      name: 'mock',
      isAvailable: async () => true,
      generatePdf: async (_html: string, _outputPath: string, _opts: PdfOptions) => undefined,
      getInfo: async () => info,
    };

    await expect(connector.isAvailable()).resolves.toBe(true);
    await expect(connector.getInfo()).resolves.toEqual(info);
    await expect(connector.generatePdf('<html></html>', '/tmp/test.pdf', options)).resolves.toBe(
      undefined
    );
  });
});
