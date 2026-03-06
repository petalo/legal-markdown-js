import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfDependencyError } from '../../../../../src/errors';

const availability = {
  puppeteer: false,
  systemChrome: false,
  weasyprint: false,
};

vi.mock('../../../../../src/extensions/generators/pdf-connectors/puppeteer-connector', () => ({
  PuppeteerConnector: class {
    name = 'puppeteer';
    async isAvailable() {
      return availability.puppeteer;
    }
    async generatePdf() {
      return;
    }
    async getInfo() {
      return { name: 'puppeteer', version: 'test' };
    }
  },
}));

vi.mock('../../../../../src/extensions/generators/pdf-connectors/system-chrome-connector', () => ({
  SystemChromeConnector: class {
    name = 'system-chrome';
    async isAvailable() {
      return availability.systemChrome;
    }
    async generatePdf() {
      return;
    }
    async getInfo() {
      return { name: 'system-chrome', version: 'test' };
    }
  },
}));

vi.mock('../../../../../src/extensions/generators/pdf-connectors/weasyprint-connector', () => ({
  WeasyprintConnector: class {
    name = 'weasyprint';
    async isAvailable() {
      return availability.weasyprint;
    }
    async generatePdf() {
      return;
    }
    async getInfo() {
      return { name: 'weasyprint', version: 'test' };
    }
  },
}));

describe('resolvePdfConnector', () => {
  beforeEach(() => {
    availability.puppeteer = false;
    availability.systemChrome = false;
    availability.weasyprint = false;
    vi.resetModules();
  });

  it('returns explicitly requested connector when available', async () => {
    availability.weasyprint = true;
    const { resolvePdfConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/resolver'
    );

    const connector = await resolvePdfConnector('weasyprint');
    expect(connector.name).toBe('weasyprint');
  });

  it('throws PdfDependencyError for unavailable explicit connector', async () => {
    const { resolvePdfConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/resolver'
    );

    await expect(resolvePdfConnector('puppeteer')).rejects.toMatchObject({
      name: new PdfDependencyError().name,
    });
  });

  it('auto-detects in order: puppeteer -> system-chrome -> weasyprint', async () => {
    availability.puppeteer = false;
    availability.systemChrome = true;
    availability.weasyprint = true;

    const { resolvePdfConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/resolver'
    );

    const connector = await resolvePdfConnector('auto');
    expect(connector.name).toBe('system-chrome');
  });

  it('throws friendly error when no connector is available in auto mode', async () => {
    const { resolvePdfConnector } = await import(
      '../../../../../src/extensions/generators/pdf-connectors/resolver'
    );

    await expect(resolvePdfConnector('auto')).rejects.toThrow('No PDF backend is available');
  });
});
