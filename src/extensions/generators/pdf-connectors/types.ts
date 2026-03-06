export interface PdfConnector {
  name: string;
  isAvailable(): Promise<boolean>;
  generatePdf(html: string, outputPath: string, options: PdfOptions): Promise<void>;
  getInfo(): Promise<ConnectorInfo>;
}

export interface PdfOptions {
  format: 'A4' | 'Letter' | 'Legal';
  margin: { top: string; bottom: string; left: string; right: string };
  landscape?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface ConnectorInfo {
  name: string;
  version: string;
  executablePath?: string;
}

export type PdfConnectorPreference = 'auto' | 'puppeteer' | 'system-chrome' | 'weasyprint';
