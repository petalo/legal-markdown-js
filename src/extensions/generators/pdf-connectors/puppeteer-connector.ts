import { PdfGenerator } from '../pdf-generator';
import type { ConnectorInfo, PdfConnector, PdfOptions } from './types';

export class PuppeteerConnector implements PdfConnector {
  public readonly name = 'puppeteer';

  async isAvailable(): Promise<boolean> {
    try {
      await import('puppeteer');
      return true;
    } catch {
      return false;
    }
  }

  async generatePdf(html: string, outputPath: string, options: PdfOptions): Promise<void> {
    const generator = new PdfGenerator();
    await generator.generatePdfFromHtml(html, outputPath, {
      format: options.format,
      margin: options.margin,
      landscape: options.landscape,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
      displayHeaderFooter: Boolean(options.headerTemplate || options.footerTemplate),
    });
  }

  async getInfo(): Promise<ConnectorInfo> {
    let version = 'unknown';
    try {
      const pkg = await import('puppeteer/package.json');
      version = (pkg as { version?: string }).version ?? 'unknown';
    } catch {
      /* optional import - version unknown is fine */
    }

    const generator = new PdfGenerator();
    // `getChromeExecutable` is an internal method on PdfGenerator that exposes
    // the path resolved by the bundled Puppeteer. It is not part of the public
    // type, so we use a structural cast to read it without modifying PdfGenerator's
    // public surface.
    const executablePath = (
      generator as unknown as { getChromeExecutable?: () => string | null }
    ).getChromeExecutable?.();

    return {
      name: this.name,
      version,
      executablePath: executablePath ?? undefined,
    };
  }
}
