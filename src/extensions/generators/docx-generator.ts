import * as fs from 'fs/promises';
import * as path from 'path';
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
  type IPageMarginAttributes,
  type IPageSizeAttributes,
} from 'docx';
import { logger } from '../../utils/logger';
import { htmlGenerator, type HtmlGeneratorOptions } from './html-generator';
import { PDF_TEMPLATE_CONSTANTS, RESOLVED_PATHS } from '../../constants';
import { adaptCssToDocxStyles, type DocxStylesPreset } from './docx/css-style-adapter';
import { convertHtmlToDocxBlocks, createDefaultNumbering } from './docx/html-to-docx';
import type { MarkdownString } from '../../types/content-formats';
import { getCurrentDir } from '../../utils/esm-utils';

const MODULE_DIR = getCurrentDir();

const PAGE_SIZES: Record<'A4' | 'Letter' | 'Legal', { width: number; height: number }> = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
  Legal: { width: 12240, height: 20160 },
};

interface MarginOptions {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface DocxGeneratorOptions extends HtmlGeneratorOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: MarginOptions;
  cssPath?: string;
  version?: string;
  basePath?: string;
  headerTemplate?: string;
  footerTemplate?: string;
}

function isPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

function toTwips(rawValue: string | undefined, fallbackTwips: number): number {
  if (!rawValue) {
    return fallbackTwips;
  }

  const normalized = rawValue.trim().toLowerCase();
  const number = Number.parseFloat(normalized.replace(/[a-z%]+/g, ''));
  if (!Number.isFinite(number)) {
    return fallbackTwips;
  }

  if (normalized.endsWith('cm')) {
    return Math.round(number * 566.929);
  }

  if (normalized.endsWith('mm')) {
    return Math.round(number * 56.6929);
  }

  if (normalized.endsWith('in')) {
    return Math.round(number * 1440);
  }

  if (normalized.endsWith('pt')) {
    return Math.round(number * 20);
  }

  if (normalized.endsWith('px')) {
    return Math.round(number * 15);
  }

  return Math.round(number);
}

async function readCssFile(cssPath: string | undefined): Promise<string> {
  if (!cssPath) {
    return '';
  }

  try {
    return await fs.readFile(cssPath, 'utf8');
  } catch (error) {
    logger.warn('Could not load CSS for DOCX generation', {
      cssPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return '';
  }
}

async function resolveFirstReadablePath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue to next candidate.
    }
  }

  return undefined;
}

function getDefaultCssCandidates(): string[] {
  return [
    path.join(RESOLVED_PATHS.STYLES_DIR, 'default.css'),
    path.join(process.cwd(), 'src', 'styles', 'default.css'),
    path.resolve(MODULE_DIR, '..', '..', 'styles', 'default.css'),
  ];
}

function getHighlightCssCandidates(): string[] {
  return [
    path.join(RESOLVED_PATHS.STYLES_DIR, 'highlight.css'),
    path.join(process.cwd(), 'src', 'styles', 'highlight.css'),
    path.resolve(MODULE_DIR, '..', '..', 'styles', 'highlight.css'),
  ];
}

function detectLogoFromCss(cssContent: string): string | null {
  const match = cssContent.match(/--logo-filename:\s*([^;]+);/i);
  if (!match) {
    return null;
  }

  const value = match[1].trim().replace(/['"]/g, '');
  return value || null;
}

async function loadLogoData(logoRef: string): Promise<Buffer | null> {
  try {
    if (logoRef.startsWith('http://') || logoRef.startsWith('https://')) {
      const response = await fetch(logoRef);
      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!isPng(buffer) || buffer.length > PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE) {
        return null;
      }

      return buffer;
    }

    const logoPath = path.join(RESOLVED_PATHS.IMAGES_DIR, logoRef);
    const file = await fs.readFile(logoPath);
    if (!isPng(file) || file.length > PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE) {
      return null;
    }

    return file;
  } catch {
    return null;
  }
}

function buildPageSize(options: DocxGeneratorOptions): IPageSizeAttributes {
  const selectedFormat = options.format ?? 'A4';
  const format = PAGE_SIZES[selectedFormat] ?? PAGE_SIZES.A4;
  if (options.landscape) {
    return {
      width: format.height,
      height: format.width,
      orientation: PageOrientation.LANDSCAPE,
    };
  }

  return {
    width: format.width,
    height: format.height,
    orientation: PageOrientation.PORTRAIT,
  };
}

function buildMargins(options: DocxGeneratorOptions): IPageMarginAttributes {
  const margin = options.margin;
  return {
    top: toTwips(margin?.top, 1440),
    right: toTwips(margin?.right, 1440),
    bottom: toTwips(margin?.bottom, 1440),
    left: toTwips(margin?.left, 1440),
    header: 720,
    footer: 720,
    gutter: 0,
  };
}

function buildConversionOptions(
  stylePreset: DocxStylesPreset,
  includeHighlighting: boolean,
  basePath: string
) {
  return {
    styles: stylePreset,
    includeHighlighting,
    basePath,
  };
}

async function createHeader(
  logoData: Buffer | null,
  options: {
    headerTemplate?: string;
    stylePreset: DocxStylesPreset;
    includeHighlighting: boolean;
    basePath: string;
  }
): Promise<Header> {
  if (options.headerTemplate?.trim()) {
    const blocks = await convertHtmlToDocxBlocks(
      options.headerTemplate,
      buildConversionOptions(options.stylePreset, options.includeHighlighting, options.basePath)
    );

    return new Header({
      children: blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })],
    });
  }

  if (!logoData) {
    return new Header({
      children: [new Paragraph({ children: [new TextRun('')] })],
    });
  }

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: logoData,
            type: 'png',
            transformation: {
              width: 120,
              height: 40,
            },
          }),
        ],
      }),
    ],
  });
}

async function createFooter(options: {
  footerTemplate?: string;
  version?: string;
  stylePreset: DocxStylesPreset;
  includeHighlighting: boolean;
  basePath: string;
}): Promise<Footer> {
  if (options.footerTemplate?.trim()) {
    const blocks = await convertHtmlToDocxBlocks(
      options.footerTemplate,
      buildConversionOptions(options.stylePreset, options.includeHighlighting, options.basePath)
    );
    return new Footer({
      children: blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })],
    });
  }

  const children: Paragraph[] = [];

  if (options.version) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: `v${options.version}`,
            size: 16,
            color: '666666',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun('Pg: '),
        new TextRun({ children: [PageNumber.CURRENT] }),
        new TextRun(' / '),
        new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
      ],
    })
  );

  return new Footer({ children });
}

async function resolveCssBundle(
  options: DocxGeneratorOptions
): Promise<{ combined: string; baseCss: string }> {
  const baseCssPath =
    options.cssPath ??
    (await resolveFirstReadablePath(getDefaultCssCandidates())) ??
    path.join(RESOLVED_PATHS.STYLES_DIR, 'default.css');
  const baseCss = await readCssFile(baseCssPath);

  let combined = baseCss;
  if (options.includeHighlighting) {
    const highlightPath =
      options.highlightCssPath ??
      (await resolveFirstReadablePath(getHighlightCssCandidates())) ??
      path.join(RESOLVED_PATHS.STYLES_DIR, 'highlight.css');
    const highlightCss = await readCssFile(highlightPath);
    if (highlightCss) {
      combined += `\n${highlightCss}`;
    }
  }

  return {
    combined,
    baseCss,
  };
}

export class DocxGenerator {
  async generateDocx(
    markdownContent: MarkdownString,
    outputPath: string,
    options: DocxGeneratorOptions = {}
  ): Promise<Buffer> {
    const htmlContent = await htmlGenerator.generateHtml(markdownContent, options);
    return this.generateDocxFromHtml(htmlContent, outputPath, options);
  }

  async generateDocxFromHtml(
    htmlContent: string,
    outputPath: string,
    options: DocxGeneratorOptions = {}
  ): Promise<Buffer> {
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    const cssBundle = await resolveCssBundle(options);
    const stylePreset = adaptCssToDocxStyles(cssBundle.combined);
    const includeHighlighting = options.includeHighlighting ?? false;
    const basePath = options.basePath ?? path.dirname(outputPath);

    const logoRef = detectLogoFromCss(cssBundle.baseCss);
    const logoData = logoRef ? await loadLogoData(logoRef) : null;

    const blocks = await convertHtmlToDocxBlocks(htmlContent, {
      styles: stylePreset,
      includeHighlighting,
      basePath,
    });

    const header = await createHeader(logoData, {
      headerTemplate: options.headerTemplate,
      stylePreset,
      includeHighlighting,
      basePath,
    });

    const footer = await createFooter({
      footerTemplate: options.footerTemplate,
      version: options.version,
      stylePreset,
      includeHighlighting,
      basePath,
    });

    const document = new Document({
      title: options.title,
      description: options.title,
      styles: stylePreset.styles,
      numbering: createDefaultNumbering(stylePreset),
      sections: [
        {
          properties: {
            page: {
              size: buildPageSize(options),
              margin: buildMargins(options),
            },
          },
          headers: {
            default: header,
          },
          footers: {
            default: footer,
          },
          children: blocks,
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);
    await fs.writeFile(outputPath, buffer);

    logger.info('DOCX generated successfully', {
      outputPath,
      size: buffer.length,
    });

    return buffer;
  }
}

export const docxGenerator = new DocxGenerator();
