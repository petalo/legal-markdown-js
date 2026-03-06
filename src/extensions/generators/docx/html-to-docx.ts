import * as path from 'path';
import * as fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { ImageRun, type ParagraphChild } from 'docx';
import {
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type INumberingOptions,
} from 'docx';
import type { AnyNode, Element as DomElement } from 'domhandler';
import type { DocxStylesPreset } from './css-style-adapter';

type OrderedListStyle = DocxStylesPreset['lists']['ordered'];
type BulletListStyle = DocxStylesPreset['lists']['bullet'];
type NumberingLevelFormat = (typeof LevelFormat)[keyof typeof LevelFormat];

const ORDERED_REFERENCES: Record<OrderedListStyle, string> = {
  decimal: 'legalOrderedDecimal',
  lowerLetter: 'legalOrderedLowerLetter',
  upperLetter: 'legalOrderedUpperLetter',
  lowerRoman: 'legalOrderedLowerRoman',
  upperRoman: 'legalOrderedUpperRoman',
};

const BULLET_REFERENCES: Record<BulletListStyle, string> = {
  disc: 'legalBulletDisc',
  circle: 'legalBulletCircle',
  square: 'legalBulletSquare',
  dash: 'legalBulletDash',
};

interface RunFormatting {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  underline?: boolean;
  style?: string;
  color?: string;
  preserveWhitespace?: boolean;
}

interface BlockContext {
  inTableOfContents: boolean;
}

export interface HtmlToDocxConversionOptions {
  styles: DocxStylesPreset;
  includeHighlighting: boolean;
  basePath?: string;
}

function isElement(node: AnyNode): node is DomElement {
  return node.type === 'tag';
}

function getTextNodeData(node: AnyNode): string | null {
  const maybeText = node as { type?: string; data?: unknown };
  if (maybeText.type !== 'text') {
    return null;
  }

  return typeof maybeText.data === 'string' ? maybeText.data : null;
}

function normalizeText(input: string, preserveWhitespace = false): string {
  const normalized = input.replace(/\u00a0/g, ' ');

  if (preserveWhitespace) {
    return normalized;
  }

  return normalized.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ');
}

function getClassList(node: DomElement): string[] {
  return (node.attribs?.class ?? '')
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseStyleAttribute(styleAttribute: string | undefined): Map<string, string> {
  const declarations = new Map<string, string>();

  if (!styleAttribute) {
    return declarations;
  }

  for (const declaration of styleAttribute.split(';')) {
    const separator = declaration.indexOf(':');
    if (separator <= 0) {
      continue;
    }

    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration
      .slice(separator + 1)
      .replace(/\s*!important\s*$/i, '')
      .trim();
    if (!property || !value) {
      continue;
    }

    declarations.set(property, value);
  }

  return declarations;
}

function getInlineStyleProperty(node: DomElement, property: string): string | undefined {
  return parseStyleAttribute(node.attribs?.style).get(property.toLowerCase());
}

function parsePixelDimension(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value.replace('px', '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.round(parsed);
}

function isBreakDirective(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'always' ||
    normalized === 'page' ||
    normalized === 'left' ||
    normalized === 'right'
  );
}

function hasPageBreakBefore(node: DomElement, classList: string[]): boolean {
  if (classList.includes('page-break') || classList.includes('page-break-before')) {
    return true;
  }

  return (
    isBreakDirective(getInlineStyleProperty(node, 'page-break-before')) ||
    isBreakDirective(getInlineStyleProperty(node, 'break-before'))
  );
}

function hasPageBreakAfter(node: DomElement, classList: string[]): boolean {
  if (classList.includes('page-break-after')) {
    return true;
  }

  return (
    isBreakDirective(getInlineStyleProperty(node, 'page-break-after')) ||
    isBreakDirective(getInlineStyleProperty(node, 'break-after'))
  );
}

function resolveParagraphAlignment(
  node: DomElement,
  classList: string[]
): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  if (classList.includes('text-center')) {
    return AlignmentType.CENTER;
  }

  const inlineAlignment = getInlineStyleProperty(node, 'text-align')?.toLowerCase();
  if (!inlineAlignment) {
    return undefined;
  }

  if (inlineAlignment === 'center') return AlignmentType.CENTER;
  if (inlineAlignment === 'right' || inlineAlignment === 'end') return AlignmentType.RIGHT;
  if (inlineAlignment === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function resolveRunFormattingFromClasses(
  classList: string[],
  options: HtmlToDocxConversionOptions
): RunFormatting {
  const formatting: RunFormatting = {};

  if (classList.includes('text-muted')) {
    formatting.color = options.styles.colors.muted;
  }

  return formatting;
}

function resolveParagraphStyleId(
  classList: string[],
  options: HtmlToDocxConversionOptions,
  fallbackStyle: string
): string {
  if (classList.includes('confidential')) {
    return options.styles.styleIds.confidentialBanner;
  }

  if (classList.includes('separator')) {
    return options.styles.styleIds.separatorBanner;
  }

  if (classList.includes('algorithm')) {
    return options.styles.styleIds.algorithmBlock;
  }

  if (classList.includes('table-of-contents')) {
    return options.styles.styleIds.tocContainer;
  }

  return fallbackStyle;
}

function parseOrderedListStyle(rawValue: string | undefined): OrderedListStyle | undefined {
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.trim().toLowerCase();
  if (value === 'decimal') return 'decimal';
  if (value === 'lower-alpha' || value === 'lower-latin') return 'lowerLetter';
  if (value === 'upper-alpha' || value === 'upper-latin') return 'upperLetter';
  if (value === 'lower-roman') return 'lowerRoman';
  if (value === 'upper-roman') return 'upperRoman';
  return undefined;
}

function parseBulletListStyle(rawValue: string | undefined): BulletListStyle | undefined {
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.trim().toLowerCase();
  if (value === 'disc') return 'disc';
  if (value === 'circle') return 'circle';
  if (value === 'square') return 'square';
  if (value === 'dash') return 'dash';
  return undefined;
}

function suppressListMarkers(
  context: BlockContext,
  listStyleType: string | undefined,
  listNode: DomElement,
  classList: string[]
): boolean {
  if (context.inTableOfContents || classList.includes('table-of-contents')) {
    return true;
  }

  if (listStyleType?.trim().toLowerCase() === 'none') {
    return true;
  }

  const liStyleType = getInlineStyleProperty(listNode, 'list-style')?.trim().toLowerCase();
  if (liStyleType === 'none') {
    return true;
  }

  return false;
}

function createPageBreakParagraph(): Paragraph {
  return new Paragraph({
    pageBreakBefore: true,
    children: [new TextRun('')],
  });
}

function createTextRun(text: string, formatting: RunFormatting): TextRun {
  return new TextRun({
    text,
    bold: formatting.bold,
    italics: formatting.italics,
    strike: formatting.strike,
    underline: formatting.underline ? {} : undefined,
    style: formatting.style,
    color: formatting.color,
  });
}

function placeholderAwareRuns(
  text: string,
  options: HtmlToDocxConversionOptions,
  formatting: RunFormatting
): TextRun[] {
  if (!options.includeHighlighting || formatting.style) {
    return [createTextRun(text, formatting)];
  }

  const matches = Array.from(text.matchAll(/\{\{[^}]+\}\}/g));
  if (!matches.length) {
    return [createTextRun(text, formatting)];
  }

  const runs: TextRun[] = [];
  let cursor = 0;
  for (const match of matches) {
    const token = match[0];
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }

    if (start > cursor) {
      runs.push(createTextRun(text.slice(cursor, start), formatting));
    }

    runs.push(
      createTextRun(token, {
        ...formatting,
        style: options.styles.styleIds.missingValue,
      })
    );
    cursor = start + token.length;
  }

  if (cursor < text.length) {
    runs.push(createTextRun(text.slice(cursor), formatting));
  }

  return runs.length ? runs : [createTextRun(text, formatting)];
}

async function loadImageData(source: string, basePath?: string): Promise<Buffer | undefined> {
  if (!source) {
    return undefined;
  }

  if (source.startsWith('data:image/')) {
    const commaIndex = source.indexOf(',');
    if (commaIndex < 0) {
      return undefined;
    }

    const encoded = source.slice(commaIndex + 1);
    return Buffer.from(encoded, 'base64');
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) {
      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const resolved = path.isAbsolute(source)
    ? source
    : path.resolve(basePath ?? process.cwd(), source);

  try {
    return await fs.readFile(resolved);
  } catch {
    return undefined;
  }
}

function headingForTag(
  tagName: string
): (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined {
  switch (tagName) {
    case 'h1':
      return HeadingLevel.HEADING_1;
    case 'h2':
      return HeadingLevel.HEADING_2;
    case 'h3':
      return HeadingLevel.HEADING_3;
    case 'h4':
      return HeadingLevel.HEADING_4;
    case 'h5':
      return HeadingLevel.HEADING_5;
    case 'h6':
      return HeadingLevel.HEADING_6;
    default:
      return undefined;
  }
}

function getHighlightStyleId(
  classList: string[],
  stylePreset: DocxStylesPreset,
  includeHighlighting: boolean
): string | undefined {
  if (!includeHighlighting) {
    return undefined;
  }

  if (classList.includes('imported-value')) {
    return stylePreset.styleIds.importedValue;
  }

  if (classList.includes('missing-value')) {
    return stylePreset.styleIds.missingValue;
  }

  if (classList.includes('highlight')) {
    return stylePreset.styleIds.logicHighlight;
  }

  return undefined;
}

async function runFromImage(node: DomElement, basePath?: string): Promise<ImageRun | undefined> {
  const attributes = node.attribs ?? {};
  const src = attributes.src;
  if (!src) {
    return undefined;
  }

  const data = await loadImageData(src, basePath);
  if (!data) {
    return undefined;
  }

  const width = parsePixelDimension(attributes.width, 160);
  const height = parsePixelDimension(attributes.height, 48);
  const lowerSrc = src.toLowerCase();
  const imageType =
    lowerSrc.includes('image/jpeg') || lowerSrc.endsWith('.jpg') || lowerSrc.endsWith('.jpeg')
      ? 'jpg'
      : lowerSrc.includes('image/gif') || lowerSrc.endsWith('.gif')
        ? 'gif'
        : lowerSrc.includes('image/bmp') || lowerSrc.endsWith('.bmp')
          ? 'bmp'
          : 'png';

  return new ImageRun({
    data,
    type: imageType,
    transformation: {
      width,
      height,
    },
  });
}

async function nodesToRuns(
  $: cheerio.CheerioAPI,
  nodes: AnyNode[],
  options: HtmlToDocxConversionOptions,
  formatting: RunFormatting = {}
): Promise<ParagraphChild[]> {
  const runs: ParagraphChild[] = [];

  for (const node of nodes) {
    const textData = getTextNodeData(node);
    if (textData !== null) {
      const text = normalizeText(textData, formatting.preserveWhitespace === true);
      if (!text) {
        continue;
      }

      runs.push(...placeholderAwareRuns(text, options, formatting));
      continue;
    }

    if (!isElement(node)) {
      continue;
    }

    const tagName = node.name.toLowerCase();
    const children = $(node).contents().toArray();

    if (tagName === 'br') {
      runs.push(new TextRun({ break: 1 }));
      continue;
    }

    if (tagName === 'img') {
      const image = await runFromImage(node, options.basePath);
      if (image) {
        runs.push(image);
      }
      continue;
    }

    if (tagName === 'a') {
      const link = node.attribs?.href;
      const linkChildren = await nodesToRuns($, children, options, formatting);
      if (!linkChildren.length) {
        continue;
      }

      if (link && /^(https?:)?\/\//i.test(link)) {
        runs.push(
          new ExternalHyperlink({
            link,
            children: linkChildren,
          })
        );
      } else {
        runs.push(...linkChildren);
      }
      continue;
    }

    const classList = getClassList(node);
    const nextFormatting: RunFormatting = {
      ...formatting,
      ...resolveRunFormattingFromClasses(classList, options),
    };

    if (tagName === 'strong' || tagName === 'b') {
      nextFormatting.bold = true;
    }

    if (tagName === 'em' || tagName === 'i') {
      nextFormatting.italics = true;
    }

    if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
      nextFormatting.strike = true;
    }

    if (tagName === 'u') {
      nextFormatting.underline = true;
    }

    if (tagName === 'code') {
      nextFormatting.style = options.styles.styleIds.inlineCode;
    }

    const highlightStyle = getHighlightStyleId(
      classList,
      options.styles,
      options.includeHighlighting
    );
    if (highlightStyle) {
      nextFormatting.style = highlightStyle;
    }

    const childRuns = await nodesToRuns($, children, options, nextFormatting);
    runs.push(...childRuns);
  }

  return runs;
}

async function elementToParagraph(
  $: cheerio.CheerioAPI,
  node: DomElement,
  options: HtmlToDocxConversionOptions,
  fallbackStyle: string,
  runFormatting: RunFormatting = {}
): Promise<Paragraph> {
  const classList = getClassList(node);
  const style = resolveParagraphStyleId(classList, options, fallbackStyle);
  const alignment = resolveParagraphAlignment(node, classList);
  const classRunFormatting = resolveRunFormattingFromClasses(classList, options);
  const children = await nodesToRuns($, $(node).contents().toArray(), options, {
    ...runFormatting,
    ...classRunFormatting,
  });

  return new Paragraph({
    style,
    ...(alignment ? { alignment } : {}),
    ...(hasPageBreakBefore(node, classList) ? { pageBreakBefore: true } : {}),
    children: children.length ? children : [new TextRun('')],
  });
}

async function listToParagraphs(
  $: cheerio.CheerioAPI,
  listNode: DomElement,
  options: HtmlToDocxConversionOptions,
  ordered: boolean,
  level: number,
  context: BlockContext
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const listClassList = getClassList(listNode);
  const inlineListStyle = getInlineStyleProperty(listNode, 'list-style-type');
  const hideMarkers = suppressListMarkers(context, inlineListStyle, listNode, listClassList);

  const orderedStyle = parseOrderedListStyle(inlineListStyle) ?? options.styles.lists.ordered;
  const bulletStyle = parseBulletListStyle(inlineListStyle) ?? options.styles.lists.bullet;
  const numberingReference = hideMarkers
    ? undefined
    : ordered
      ? ORDERED_REFERENCES[orderedStyle]
      : BULLET_REFERENCES[bulletStyle];

  const liElements = $(listNode).children('li').toArray().filter(isElement);

  for (const li of liElements) {
    const allChildren = $(li).contents().toArray();

    const inlineNodes = allChildren.filter(node => {
      if (!isElement(node)) {
        return true;
      }
      const tag = node.name.toLowerCase();
      return tag !== 'ul' && tag !== 'ol';
    });

    const liClassList = getClassList(li);
    const runs = await nodesToRuns(
      $,
      inlineNodes,
      options,
      resolveRunFormattingFromClasses(liClassList, options)
    );
    const alignment = resolveParagraphAlignment(li, liClassList);
    const liListStyle = getInlineStyleProperty(li, 'list-style-type');
    const liHideMarker = liListStyle?.trim().toLowerCase() === 'none';

    paragraphs.push(
      new Paragraph({
        style: options.styles.styleIds.body,
        ...(alignment ? { alignment } : {}),
        children: runs.length ? runs : [new TextRun('')],
        ...(!liHideMarker && numberingReference
          ? {
              numbering: {
                reference: numberingReference,
                level: Math.min(level, 8),
              },
            }
          : {}),
      })
    );

    const nestedLists = allChildren.filter(
      (node): node is DomElement =>
        isElement(node) && (node.name.toLowerCase() === 'ul' || node.name.toLowerCase() === 'ol')
    );

    for (const nested of nestedLists) {
      const nestedOrdered = nested.name.toLowerCase() === 'ol';
      const nestedParagraphs = await listToParagraphs(
        $,
        nested,
        options,
        nestedOrdered,
        level + 1,
        context
      );
      paragraphs.push(...nestedParagraphs);
    }
  }

  return paragraphs;
}

async function tableFromElement(
  $: cheerio.CheerioAPI,
  tableNode: DomElement,
  options: HtmlToDocxConversionOptions,
  context: BlockContext
): Promise<Table> {
  const classList = getClassList(tableNode);
  const isSignaturesTable = classList.includes('signatures');
  const rowElements = $(tableNode).find('tr').toArray().filter(isElement);

  const rows: TableRow[] = [];

  for (const rowElement of rowElements) {
    const cellElements = $(rowElement).children('th,td').toArray().filter(isElement);

    if (!cellElements.length) {
      continue;
    }

    if (isSignaturesTable && cellElements.every(cell => cell.name.toLowerCase() === 'th')) {
      continue;
    }

    const cells: TableCell[] = [];

    for (const [cellIndex, cellElement] of cellElements.entries()) {
      const tag = cellElement.name.toLowerCase();
      const blocks = await nodesToBlocks($, $(cellElement).contents().toArray(), options, context);
      const blockChildren = blocks.length
        ? blocks
        : [new Paragraph({ style: options.styles.styleIds.body, children: [new TextRun('')] })];

      const signatureBottomBorder = {
        style: BorderStyle.SINGLE,
        color: options.styles.colors.primary,
        size: 10,
      };

      const defaultBorders = {
        top: {
          style: BorderStyle.SINGLE,
          color: options.styles.table.borderColor,
          size: 4,
        },
        bottom: {
          style: BorderStyle.SINGLE,
          color: options.styles.table.borderColor,
          size: 4,
        },
        left: {
          style: BorderStyle.SINGLE,
          color: options.styles.table.borderColor,
          size: 4,
        },
        right: {
          style: BorderStyle.SINGLE,
          color: options.styles.table.borderColor,
          size: 4,
        },
      };

      cells.push(
        new TableCell({
          children: blockChildren,
          ...(isSignaturesTable
            ? {}
            : {
                shading:
                  tag === 'th'
                    ? {
                        fill: options.styles.table.headerFill,
                        type: ShadingType.CLEAR,
                        color: options.styles.table.headerTextColor,
                      }
                    : {
                        fill: options.styles.table.cellFill,
                        type: ShadingType.CLEAR,
                        color: options.styles.table.headerTextColor,
                      },
              }),
          margins: {
            top: 80,
            bottom: 80,
            left: 120,
            right: 120,
          },
          ...(isSignaturesTable
            ? {
                width: {
                  size: cellIndex === 0 ? 33 : 67,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: {
                    style: BorderStyle.NONE,
                    color: 'FFFFFF',
                    size: 0,
                  },
                  bottom: signatureBottomBorder,
                  left: {
                    style: BorderStyle.NONE,
                    color: 'FFFFFF',
                    size: 0,
                  },
                  right: {
                    style: BorderStyle.NONE,
                    color: 'FFFFFF',
                    size: 0,
                  },
                },
              }
            : { borders: defaultBorders }),
        })
      );
    }

    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: isSignaturesTable
      ? {
          top: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
          bottom: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
          left: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
          right: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
          insideHorizontal: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
          insideVertical: {
            style: BorderStyle.NONE,
            color: 'FFFFFF',
            size: 0,
          },
        }
      : {
          top: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
          bottom: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
          left: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
          right: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            color: options.styles.table.borderColor,
            size: 4,
          },
        },
  });
}

function appendPageBreakAfterIfNeeded(
  blocks: Array<Paragraph | Table>,
  node: DomElement,
  classList: string[]
): void {
  if (hasPageBreakAfter(node, classList)) {
    blocks.push(createPageBreakParagraph());
  }
}

export async function nodesToBlocks(
  $: cheerio.CheerioAPI,
  nodes: AnyNode[],
  options: HtmlToDocxConversionOptions,
  context: BlockContext = { inTableOfContents: false }
): Promise<Array<Paragraph | Table>> {
  const blocks: Array<Paragraph | Table> = [];

  for (const node of nodes) {
    const textData = getTextNodeData(node);
    if (textData !== null) {
      const text = normalizeText(textData).trim();
      if (!text) {
        continue;
      }

      blocks.push(
        new Paragraph({
          style: options.styles.styleIds.body,
          children: placeholderAwareRuns(text, options, {}),
        })
      );
      continue;
    }

    if (!isElement(node)) {
      continue;
    }

    const tagName = node.name.toLowerCase();
    const classList = getClassList(node);

    if (tagName === 'ul' || tagName === 'ol') {
      if (hasPageBreakBefore(node, classList)) {
        blocks.push(createPageBreakParagraph());
      }
      const paragraphs = await listToParagraphs($, node, options, tagName === 'ol', 0, context);
      blocks.push(...paragraphs);
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'table') {
      if (hasPageBreakBefore(node, classList)) {
        blocks.push(createPageBreakParagraph());
      }
      blocks.push(await tableFromElement($, node, options, context));
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'hr') {
      blocks.push(
        new Paragraph({
          style: resolveParagraphStyleId(classList, options, options.styles.styleIds.body),
          border: {
            top: {
              style: BorderStyle.SINGLE,
              color: options.styles.table.borderColor,
              size: 6,
            },
          },
          spacing: {
            before: 200,
            after: 200,
          },
          ...(hasPageBreakBefore(node, classList) ? { pageBreakBefore: true } : {}),
        })
      );
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'pre') {
      const fallbackStyle = classList.includes('algorithm')
        ? options.styles.styleIds.algorithmBlock
        : options.styles.styleIds.codeBlock;
      blocks.push(
        await elementToParagraph($, node, options, fallbackStyle, {
          preserveWhitespace: true,
        })
      );
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'blockquote') {
      blocks.push(await elementToParagraph($, node, options, options.styles.styleIds.blockQuote));
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'div') {
      const nextContext: BlockContext = {
        inTableOfContents: context.inTableOfContents || classList.includes('table-of-contents'),
      };
      const renderAsSingleParagraph =
        classList.includes('confidential') ||
        classList.includes('separator') ||
        classList.includes('algorithm');

      if (!renderAsSingleParagraph && hasPageBreakBefore(node, classList)) {
        blocks.push(createPageBreakParagraph());
      }

      if (renderAsSingleParagraph) {
        blocks.push(await elementToParagraph($, node, options, options.styles.styleIds.body));
      } else {
        const nested = await nodesToBlocks($, $(node).contents().toArray(), options, nextContext);
        blocks.push(...nested);
      }

      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'img') {
      const image = await runFromImage(node, options.basePath);
      if (image) {
        blocks.push(
          new Paragraph({
            alignment: resolveParagraphAlignment(node, classList) ?? AlignmentType.CENTER,
            ...(hasPageBreakBefore(node, classList) ? { pageBreakBefore: true } : {}),
            children: [image],
          })
        );
      }
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    const headingLevel = headingForTag(tagName);
    if (headingLevel) {
      const headingAlignment = resolveParagraphAlignment(node, classList);
      const headingChildren = await nodesToRuns(
        $,
        $(node).contents().toArray(),
        options,
        resolveRunFormattingFromClasses(classList, options)
      );
      blocks.push(
        new Paragraph({
          heading: headingLevel,
          style: `heading${tagName.slice(1)}Legal`,
          ...(headingAlignment ? { alignment: headingAlignment } : {}),
          ...(hasPageBreakBefore(node, classList) ? { pageBreakBefore: true } : {}),
          children: headingChildren.length ? headingChildren : [new TextRun($(node).text())],
        })
      );
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (tagName === 'p' || tagName === 'section' || tagName === 'article') {
      blocks.push(await elementToParagraph($, node, options, options.styles.styleIds.body));
      appendPageBreakAfterIfNeeded(blocks, node, classList);
      continue;
    }

    if (hasPageBreakBefore(node, classList)) {
      blocks.push(createPageBreakParagraph());
    }

    const nextContext: BlockContext = {
      inTableOfContents: context.inTableOfContents || classList.includes('table-of-contents'),
    };
    const fallbackBlocks = await nodesToBlocks(
      $,
      $(node).contents().toArray(),
      options,
      nextContext
    );
    blocks.push(...fallbackBlocks);
    appendPageBreakAfterIfNeeded(blocks, node, classList);
  }

  return blocks;
}

export async function convertHtmlToDocxBlocks(
  htmlContent: string,
  options: HtmlToDocxConversionOptions
): Promise<Array<Paragraph | Table>> {
  const $ = cheerio.load(htmlContent);
  const rootNodes =
    $('body').length > 0 ? $('body').contents().toArray() : $.root().contents().toArray();
  return nodesToBlocks($, rootNodes, options);
}

function orderedLevelSequence(style: OrderedListStyle): NumberingLevelFormat[] {
  switch (style) {
    case 'lowerLetter':
      return [LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN, LevelFormat.DECIMAL];
    case 'upperLetter':
      return [LevelFormat.UPPER_LETTER, LevelFormat.UPPER_ROMAN, LevelFormat.DECIMAL];
    case 'lowerRoman':
      return [LevelFormat.LOWER_ROMAN, LevelFormat.LOWER_LETTER, LevelFormat.DECIMAL];
    case 'upperRoman':
      return [LevelFormat.UPPER_ROMAN, LevelFormat.UPPER_LETTER, LevelFormat.DECIMAL];
    case 'decimal':
    default:
      return [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN];
  }
}

function bulletSequence(style: BulletListStyle): string[] {
  switch (style) {
    case 'circle':
      return ['◦', '•', '▪'];
    case 'square':
      return ['▪', '•', '◦'];
    case 'dash':
      return ['-', '•', '◦'];
    case 'disc':
    default:
      return ['•', '◦', '▪'];
  }
}

export function createDefaultNumbering(styles?: DocxStylesPreset): INumberingOptions {
  const orderedStyles = Object.keys(ORDERED_REFERENCES) as OrderedListStyle[];
  const bulletStyles = Object.keys(BULLET_REFERENCES) as BulletListStyle[];

  if (styles?.lists.ordered) {
    orderedStyles.sort((left, right) => {
      if (left === styles.lists.ordered) return -1;
      if (right === styles.lists.ordered) return 1;
      return 0;
    });
  }

  if (styles?.lists.bullet) {
    bulletStyles.sort((left, right) => {
      if (left === styles.lists.bullet) return -1;
      if (right === styles.lists.bullet) return 1;
      return 0;
    });
  }

  const orderedConfigs = orderedStyles.map(style => {
    const sequence = orderedLevelSequence(style);
    return {
      reference: ORDERED_REFERENCES[style],
      levels: Array.from({ length: 9 }, (_entry, level) => ({
        level,
        format: sequence[level % sequence.length],
        text: `%${level + 1}.`,
        alignment: AlignmentType.LEFT,
      })),
    };
  });

  const bulletConfigs = bulletStyles.map(style => {
    const sequence = bulletSequence(style);
    return {
      reference: BULLET_REFERENCES[style],
      levels: Array.from({ length: 9 }, (_entry, level) => ({
        level,
        format: LevelFormat.BULLET,
        text: sequence[level % sequence.length],
        alignment: AlignmentType.LEFT,
      })),
    };
  });

  return {
    config: [...orderedConfigs, ...bulletConfigs],
  };
}
