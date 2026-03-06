import {
  AlignmentType,
  Document,
  Footer,
  Header,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
  type IPageMarginAttributes,
  type IPageSizeAttributes,
} from 'docx';
import { adaptCssToDocxStyles } from './docx/css-style-adapter';
import { convertHtmlToDocxBlocks, createDefaultNumbering } from './docx/html-to-docx';

const PAGE_SIZES: Record<'A4' | 'Letter' | 'Legal', { width: number; height: number }> = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
  Legal: { width: 12240, height: 20160 },
};

export interface DocxBrowserOptions {
  title?: string;
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
}

/**
 * Generate a DOCX buffer from HTML and CSS strings - browser-safe.
 *
 * Does not touch the filesystem. CSS is accepted as a string instead
 * of a file path. Returns a Uint8Array that can be wrapped in a Blob
 * and downloaded via URL.createObjectURL.
 */
export async function generateDocxBuffer(
  html: string,
  css: string,
  options: DocxBrowserOptions = {}
): Promise<Uint8Array> {
  const stylePreset = adaptCssToDocxStyles(css);

  const blocks = await convertHtmlToDocxBlocks(html, {
    styles: stylePreset,
    includeHighlighting: false,
    basePath: '',
  });

  const header = new Header({
    children: [new Paragraph({ children: [new TextRun('')] })],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun('Pg: '),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun(' / '),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ],
  });

  const selectedFormat = options.format ?? 'A4';
  const pageDims = PAGE_SIZES[selectedFormat] ?? PAGE_SIZES.A4;
  const size: IPageSizeAttributes = options.landscape
    ? { width: pageDims.height, height: pageDims.width, orientation: PageOrientation.LANDSCAPE }
    : { width: pageDims.width, height: pageDims.height, orientation: PageOrientation.PORTRAIT };

  const margins: IPageMarginAttributes = {
    top: 1440,
    right: 1440,
    bottom: 1440,
    left: 1440,
    header: 720,
    footer: 720,
    gutter: 0,
  };

  const document = new Document({
    title: options.title,
    description: options.title,
    styles: stylePreset.styles,
    numbering: createDefaultNumbering(stylePreset),
    sections: [
      {
        properties: { page: { size, margin: margins } },
        headers: { default: header },
        footers: { default: footer },
        children: blocks,
      },
    ],
  });

  return Packer.toBuffer(document);
}
