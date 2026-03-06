import { PdfDependencyError } from '../../../errors';
import { PuppeteerConnector } from './puppeteer-connector';
import { SystemChromeConnector } from './system-chrome-connector';
import { WeasyprintConnector } from './weasyprint-connector';
import type { PdfConnector, PdfConnectorPreference } from './types';

const CONNECTOR_FACTORIES: Record<Exclude<PdfConnectorPreference, 'auto'>, () => PdfConnector> = {
  puppeteer: () => new PuppeteerConnector(),
  'system-chrome': () => new SystemChromeConnector(),
  weasyprint: () => new WeasyprintConnector(),
};

export function createPdfConnector(
  preference: Exclude<PdfConnectorPreference, 'auto'>
): PdfConnector {
  return CONNECTOR_FACTORIES[preference]();
}

export async function resolvePdfConnector(
  preference: PdfConnectorPreference
): Promise<PdfConnector> {
  if (preference !== 'auto') {
    const connector = createPdfConnector(preference);
    if (await connector.isAvailable()) {
      return connector;
    }

    throw new PdfDependencyError(
      `Requested PDF connector "${preference}" is not available on this system.`
    );
  }

  // Auto-resolution priority: puppeteer first (self-contained, most
  // reproducible across environments), then system-chrome (zero-install for
  // users with a browser), then weasyprint (Python-based, least common).
  const chain: PdfConnector[] = [
    createPdfConnector('puppeteer'),
    createPdfConnector('system-chrome'),
    createPdfConnector('weasyprint'),
  ];

  for (const connector of chain) {
    if (await connector.isAvailable()) {
      return connector;
    }
  }

  throw new PdfDependencyError(
    'No PDF backend is available. Install one of:\n' +
      '  - npm install puppeteer\n' +
      '  - Install Chrome/Chromium/Edge/Brave/Arc\n' +
      '  - brew install weasyprint (or pip install weasyprint)'
  );
}
