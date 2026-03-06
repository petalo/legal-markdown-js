import {
  AlignmentType,
  BorderStyle,
  HighlightColor,
  LineRuleType,
  ShadingType,
  UnderlineType,
  type ICharacterStyleOptions,
  type IParagraphStyleOptions,
  type IStylesOptions,
} from 'docx';

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
]);

const NAMED_COLORS: Record<string, string> = {
  black: '000000',
  white: 'FFFFFF',
  red: 'FF0000',
  green: '008000',
  blue: '0000FF',
  navy: '000080',
  teal: '008080',
  maroon: '800000',
  purple: '800080',
  gray: '808080',
  grey: '808080',
  silver: 'C0C0C0',
  yellow: 'FFFF00',
  orange: 'FFA500',
  cyan: '00FFFF',
  magenta: 'FF00FF',
  transparent: 'FFFFFF',
};

export interface DocxStylesPreset {
  styles: IStylesOptions;
  styleIds: {
    body: string;
    codeBlock: string;
    algorithmBlock: string;
    blockQuote: string;
    confidentialBanner: string;
    separatorBanner: string;
    tocContainer: string;
    inlineCode: string;
    importedValue: string;
    missingValue: string;
    logicHighlight: string;
  };
  colors: {
    primary: string;
    text: string;
    muted: string;
    inverse: string;
  };
  lists: {
    ordered: 'decimal' | 'lowerLetter' | 'upperLetter' | 'lowerRoman' | 'upperRoman';
    bullet: 'disc' | 'circle' | 'square' | 'dash';
  };
  table: {
    borderColor: string;
    headerFill: string;
    headerTextColor: string;
    cellFill: string;
  };
}

interface RuleMap {
  selectors: Map<string, Map<string, string>>;
  variables: Map<string, string>;
}

type DocxHighlightColor = (typeof HighlightColor)[keyof typeof HighlightColor];

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripAtRuleBlocks(css: string): string {
  let output = '';
  let index = 0;

  while (index < css.length) {
    if (css[index] !== '@') {
      output += css[index];
      index += 1;
      continue;
    }

    let cursor = index;
    while (cursor < css.length && css[cursor] !== '{' && css[cursor] !== ';') {
      cursor += 1;
    }

    if (cursor >= css.length) {
      break;
    }

    if (css[cursor] === ';') {
      index = cursor + 1;
      continue;
    }

    cursor += 1;
    let depth = 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }

    index = cursor;
  }

  return output;
}

function parseDeclarations(input: string): Map<string, string> {
  const declarations = new Map<string, string>();

  for (const declaration of input.split(';')) {
    const index = declaration.indexOf(':');
    if (index <= 0) {
      continue;
    }

    const property = declaration.slice(0, index).trim().toLowerCase();
    const rawValue = declaration.slice(index + 1).trim();
    if (!property || !rawValue) {
      continue;
    }

    declarations.set(property, rawValue);
  }

  return declarations;
}

function parseRules(css: string): RuleMap {
  const selectors = new Map<string, Map<string, string>>();
  const variables = new Map<string, string>();
  const cleanCss = stripAtRuleBlocks(stripComments(css));
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;

  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(cleanCss))) {
    const selectorList = match[1].trim();
    const declarationBlock = match[2].trim();

    if (!selectorList || !declarationBlock || selectorList.startsWith('@')) {
      continue;
    }

    const declarations = parseDeclarations(declarationBlock);

    for (const [property, value] of declarations.entries()) {
      if (property.startsWith('--')) {
        variables.set(property, value);
      }
    }

    for (const selector of selectorList.split(',')) {
      const normalizedSelector = selector.trim().replace(/\s+/g, ' ');
      if (!normalizedSelector) {
        continue;
      }

      const existing = selectors.get(normalizedSelector) ?? new Map<string, string>();
      for (const [property, value] of declarations.entries()) {
        existing.set(property, value);
      }
      selectors.set(normalizedSelector, existing);
    }
  }

  return {
    selectors,
    variables,
  };
}

function resolveCssValue(value: string, variables: Map<string, string>): string {
  const replaced = value.replace(
    /var\((--[^,\s)]+)(?:,\s*([^)]+))?\)/g,
    (_m, variable, fallback) => {
      const found = variables.get(variable);
      if (found) {
        return found;
      }
      return (fallback ?? '').trim();
    }
  );

  return replaced.trim();
}

function getDeclaration(
  rules: RuleMap,
  selectors: readonly string[],
  property: string,
  fallback: string
): string {
  for (const selector of selectors) {
    const declaration = rules.selectors.get(selector)?.get(property);
    if (!declaration) {
      continue;
    }

    const resolved = resolveCssValue(declaration, rules.variables);
    if (resolved) {
      return resolved;
    }
  }

  return fallback;
}

function normalizeColor(rawColor: string, fallback: string): string {
  const trimmed = rawColor.replace(/\s*!important\s*$/i, '').trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith('#')) {
    const color = trimmed.slice(1);
    if (color.length === 3) {
      return `${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`.toUpperCase();
    }

    return color.toUpperCase();
  }

  const rgbMatch = trimmed.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const red = Number(rgbMatch[1]).toString(16).padStart(2, '0');
    const green = Number(rgbMatch[2]).toString(16).padStart(2, '0');
    const blue = Number(rgbMatch[3]).toString(16).padStart(2, '0');
    return `${red}${green}${blue}`.toUpperCase();
  }

  const rgbaMatch = trimmed.match(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
  if (rgbaMatch) {
    const red = Number(rgbaMatch[1]).toString(16).padStart(2, '0');
    const green = Number(rgbaMatch[2]).toString(16).padStart(2, '0');
    const blue = Number(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `${red}${green}${blue}`.toUpperCase();
  }

  const named = NAMED_COLORS[trimmed.toLowerCase()];
  if (named) {
    return named;
  }

  return fallback;
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

const DOCX_HIGHLIGHT_RGB: ReadonlyArray<{
  color: DocxHighlightColor;
  red: number;
  green: number;
  blue: number;
}> = [
  { color: HighlightColor.YELLOW, red: 255, green: 255, blue: 0 },
  { color: HighlightColor.GREEN, red: 0, green: 255, blue: 0 },
  { color: HighlightColor.CYAN, red: 0, green: 255, blue: 255 },
  { color: HighlightColor.MAGENTA, red: 255, green: 0, blue: 255 },
  { color: HighlightColor.BLUE, red: 0, green: 0, blue: 255 },
  { color: HighlightColor.RED, red: 255, green: 0, blue: 0 },
  { color: HighlightColor.DARK_BLUE, red: 0, green: 0, blue: 128 },
  { color: HighlightColor.DARK_CYAN, red: 0, green: 128, blue: 128 },
  { color: HighlightColor.DARK_GREEN, red: 0, green: 128, blue: 0 },
  { color: HighlightColor.DARK_MAGENTA, red: 128, green: 0, blue: 128 },
  { color: HighlightColor.DARK_RED, red: 128, green: 0, blue: 0 },
  { color: HighlightColor.DARK_YELLOW, red: 128, green: 128, blue: 0 },
  { color: HighlightColor.DARK_GRAY, red: 128, green: 128, blue: 128 },
  { color: HighlightColor.LIGHT_GRAY, red: 192, green: 192, blue: 192 },
  { color: HighlightColor.BLACK, red: 0, green: 0, blue: 0 },
];

function mapBackgroundToDocxHighlight(hexColor: string): DocxHighlightColor {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return HighlightColor.LIGHT_GRAY;
  }

  let winner = DOCX_HIGHLIGHT_RGB[0];
  let winnerDistance = Number.POSITIVE_INFINITY;

  for (const candidate of DOCX_HIGHLIGHT_RGB) {
    const dr = rgb.red - candidate.red;
    const dg = rgb.green - candidate.green;
    const db = rgb.blue - candidate.blue;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < winnerDistance) {
      winner = candidate;
      winnerDistance = distance;
    }
  }

  return winner.color;
}

function parseFontFamily(rawFont: string, fallback = 'Calibri'): string {
  const families = rawFont
    .split(',')
    .map(family => family.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  for (const family of families) {
    const normalized = family.toLowerCase();
    if (normalized.startsWith('-apple-system')) {
      continue;
    }
    if (GENERIC_FAMILIES.has(normalized)) {
      continue;
    }
    return family;
  }

  return families[0] ?? fallback;
}

function parseLengthToPt(rawValue: string, basePt = 12): number {
  const value = rawValue.trim().toLowerCase();

  if (value.endsWith('pt')) {
    return Number.parseFloat(value.slice(0, -2));
  }

  if (value.endsWith('px')) {
    return Number.parseFloat(value.slice(0, -2)) * 0.75;
  }

  if (value.endsWith('em')) {
    return Number.parseFloat(value.slice(0, -2)) * basePt;
  }

  if (value.endsWith('rem')) {
    return Number.parseFloat(value.slice(0, -3)) * basePt;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : basePt;
}

function parseFontSizeToHalfPoints(rawValue: string, basePt = 12): number {
  return Math.max(8, Math.round(parseLengthToPt(rawValue, basePt) * 2));
}

function parseSpacingToTwips(rawValue: string, basePt = 12): number {
  return Math.max(0, Math.round(parseLengthToPt(rawValue, basePt) * 20));
}

function parseLineHeightToTwips(rawValue: string, fontPt: number): number {
  const value = rawValue.trim().toLowerCase();

  if (value === 'normal') {
    return Math.round(fontPt * 20 * 1.2);
  }

  if (/^[\d.]+$/.test(value)) {
    return Math.round(fontPt * 20 * Number.parseFloat(value));
  }

  return parseSpacingToTwips(value, fontPt);
}

function parseFontWeight(rawValue: string): boolean {
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'bold') {
    return true;
  }

  const numeric = Number.parseInt(normalized, 10);
  return Number.isFinite(numeric) && numeric >= 600;
}

function parseAlignment(rawValue: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const alignment = rawValue.trim().toLowerCase();
  if (alignment === 'center') return AlignmentType.CENTER;
  if (alignment === 'right' || alignment === 'end') return AlignmentType.RIGHT;
  if (alignment === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function parseOrderedListStyle(rawValue: string): DocxStylesPreset['lists']['ordered'] {
  const value = rawValue.trim().toLowerCase();
  if (value === 'lower-alpha' || value === 'lower-latin') return 'lowerLetter';
  if (value === 'upper-alpha' || value === 'upper-latin') return 'upperLetter';
  if (value === 'lower-roman') return 'lowerRoman';
  if (value === 'upper-roman') return 'upperRoman';
  return 'decimal';
}

function parseBulletListStyle(rawValue: string): DocxStylesPreset['lists']['bullet'] {
  const value = rawValue.trim().toLowerCase();
  if (value === 'circle') return 'circle';
  if (value === 'square') return 'square';
  if (value === 'dash') return 'dash';
  return 'disc';
}

function buildHeadingStyle(
  level: number,
  rules: RuleMap,
  baseFontPt: number,
  fallbackColor: string,
  fallbackAccent: string
): IParagraphStyleOptions {
  const tag = `h${level}`;
  const selectors = [tag, `.legal-header-level-${level}`];
  const fontSize = parseFontSizeToHalfPoints(
    getDeclaration(rules, selectors, 'font-size', `${Math.max(10, 24 - level * 2)}pt`),
    baseFontPt
  );
  const color = normalizeColor(
    getDeclaration(rules, selectors, 'color', fallbackColor),
    fallbackColor
  );
  const bold = parseFontWeight(getDeclaration(rules, selectors, 'font-weight', '600'));
  const marginTop = parseSpacingToTwips(
    getDeclaration(rules, selectors, 'margin-top', level <= 2 ? '24pt' : '12pt'),
    baseFontPt
  );
  const marginBottom = parseSpacingToTwips(
    getDeclaration(rules, selectors, 'margin-bottom', level <= 2 ? '12pt' : '8pt'),
    baseFontPt
  );

  const borderBottom = getDeclaration(rules, selectors, 'border-bottom', '').trim();
  const paragraph = {
    spacing: {
      before: marginTop,
      after: marginBottom,
    },
    keepLines: true,
    keepNext: true,
    alignment: parseAlignment(
      getDeclaration(rules, selectors, 'text-align', level === 1 ? 'center' : 'left')
    ),
    border: borderBottom
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              borderBottom.match(/#([\da-f]{3,8})/i)?.[0] ?? fallbackAccent,
              fallbackAccent
            ),
            size: 6,
          },
        }
      : undefined,
  };

  const style: IParagraphStyleOptions = {
    id: `heading${level}Legal`,
    name: `Heading ${level} Legal`,
    basedOn: 'Normal',
    next: 'Normal',
    quickFormat: true,
    run: {
      bold,
      size: fontSize,
      color,
    },
    paragraph,
  };

  return style;
}

function buildHighlightCharacterStyle(
  id: string,
  name: string,
  selectors: readonly string[],
  rules: RuleMap,
  defaults: {
    color: string;
    background: string;
  }
): ICharacterStyleOptions {
  const color = normalizeColor(
    getDeclaration(rules, selectors, 'color', defaults.color),
    defaults.color
  );
  const background = normalizeColor(
    getDeclaration(rules, selectors, 'background-color', defaults.background),
    defaults.background
  );
  const highlight = mapBackgroundToDocxHighlight(background);

  return {
    id,
    name,
    basedOn: 'DefaultParagraphFont',
    run: {
      color,
      highlight,
    },
  };
}

export function adaptCssToDocxStyles(cssContent: string): DocxStylesPreset {
  const rules = parseRules(cssContent);

  const colorText = normalizeColor(
    rules.variables.get('--color-text') ?? getDeclaration(rules, ['body'], 'color', '#334155'),
    '334155'
  );
  const colorPrimary = normalizeColor(
    rules.variables.get('--color-primary') ??
      getDeclaration(rules, ['h1', '.legal-header-level-1', 'strong', 'b'], 'color', colorText),
    '1E293B'
  );
  const colorAccent = normalizeColor(rules.variables.get('--color-accent') ?? '#0891b2', '0891B2');
  const colorMuted = normalizeColor(
    rules.variables.get('--color-muted') ??
      getDeclaration(rules, ['.text-muted'], 'color', '#64748B'),
    '64748B'
  );
  const colorInverse = normalizeColor('#FFFFFF', 'FFFFFF');
  const colorLink = normalizeColor(
    rules.variables.get('--color-link') ?? getDeclaration(rules, ['a'], 'color', '#0891b2'),
    '0891B2'
  );
  const tableBorderColor = normalizeColor(
    rules.variables.get('--docx-table-border-color') ??
      getDeclaration(rules, ['table', 'th', 'td'], 'border-color', '#E2E8F0'),
    'E2E8F0'
  );
  const tableHeaderFill = normalizeColor(
    rules.variables.get('--docx-table-header-fill') ??
      getDeclaration(rules, ['th'], 'background-color', '#F8FAFC'),
    'F8FAFC'
  );
  const tableHeaderTextColor = normalizeColor(
    rules.variables.get('--docx-table-header-text') ??
      getDeclaration(rules, ['th'], 'color', colorPrimary),
    colorPrimary
  );
  const tableCellFill = normalizeColor(
    rules.variables.get('--docx-table-cell-fill') ??
      getDeclaration(rules, ['table'], 'background-color', 'FFFFFF'),
    'FFFFFF'
  );

  const fontFamily = parseFontFamily(
    resolveCssValue(
      rules.variables.get('--font-primary') ??
        getDeclaration(rules, ['body'], 'font-family', 'Calibri, sans-serif'),
      rules.variables
    )
  );
  const monoFamily = parseFontFamily(
    resolveCssValue(
      rules.variables.get('--font-mono') ??
        getDeclaration(rules, ['pre', 'code'], 'font-family', 'Consolas, monospace'),
      rules.variables
    ),
    'Consolas'
  );

  const bodySelectors = ['body'];
  const bodyFontSizePt = parseLengthToPt(getDeclaration(rules, bodySelectors, 'font-size', '12pt'));
  const bodyFontSize = Math.round(bodyFontSizePt * 2);
  const bodyLineHeight = parseLineHeightToTwips(
    getDeclaration(rules, bodySelectors, 'line-height', '1.6'),
    bodyFontSizePt
  );

  const paragraphStyles: IParagraphStyleOptions[] = [
    {
      id: 'legalBody',
      name: 'Legal Body',
      basedOn: 'Normal',
      next: 'Legal Body',
      quickFormat: true,
      paragraph: {
        alignment: parseAlignment(getDeclaration(rules, ['p'], 'text-align', 'justify')),
        spacing: {
          after: parseSpacingToTwips(
            getDeclaration(rules, ['p'], 'margin-bottom', '10pt'),
            bodyFontSizePt
          ),
          line: bodyLineHeight,
          lineRule: LineRuleType.AUTO,
        },
      },
      run: {
        color: colorText,
        size: bodyFontSize,
      },
    },
    {
      id: 'codeBlock',
      name: 'Code Block',
      basedOn: 'Normal',
      paragraph: {
        spacing: {
          before: parseSpacingToTwips(
            getDeclaration(rules, ['pre'], 'margin-top', '8pt'),
            bodyFontSizePt
          ),
          after: parseSpacingToTwips(
            getDeclaration(rules, ['pre'], 'margin-bottom', '8pt'),
            bodyFontSizePt
          ),
          line: parseLineHeightToTwips(
            getDeclaration(rules, ['pre'], 'line-height', '1.4'),
            bodyFontSizePt
          ),
        },
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['pre'], 'background-color', '#F8FAFC'),
            'F8FAFC'
          ),
          type: ShadingType.CLEAR,
          color: colorText,
        },
        border: {
          top: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              getDeclaration(rules, ['pre'], 'border-color', '#E2E8F0'),
              'E2E8F0'
            ),
            size: 4,
          },
          right: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              getDeclaration(rules, ['pre'], 'border-color', '#E2E8F0'),
              'E2E8F0'
            ),
            size: 4,
          },
          bottom: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              getDeclaration(rules, ['pre'], 'border-color', '#E2E8F0'),
              'E2E8F0'
            ),
            size: 4,
          },
          left: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              getDeclaration(rules, ['pre'], 'border-color', '#E2E8F0'),
              'E2E8F0'
            ),
            size: 4,
          },
        },
      },
      run: {
        font: monoFamily,
        size: parseFontSizeToHalfPoints(
          getDeclaration(rules, ['pre'], 'font-size', '10pt'),
          bodyFontSizePt
        ),
      },
    },
    {
      id: 'algorithmBlock',
      name: 'Algorithm Block',
      basedOn: 'codeBlock',
      paragraph: {
        spacing: {
          before: parseSpacingToTwips(
            getDeclaration(rules, ['.algorithm'], 'margin-top', '8pt'),
            bodyFontSizePt
          ),
          after: parseSpacingToTwips(
            getDeclaration(rules, ['.algorithm'], 'margin-bottom', '8pt'),
            bodyFontSizePt
          ),
          line: parseLineHeightToTwips(
            getDeclaration(rules, ['.algorithm'], 'line-height', '1.4'),
            bodyFontSizePt
          ),
        },
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['.algorithm'], 'background-color', '#F8FAFC'),
            'F8FAFC'
          ),
          type: ShadingType.CLEAR,
          color: colorText,
        },
        border: {
          left: {
            style: BorderStyle.SINGLE,
            color: normalizeColor(
              getDeclaration(rules, ['.algorithm'], 'border-left-color', colorAccent),
              colorAccent
            ),
            size: 10,
          },
        },
      },
      run: {
        font: monoFamily,
        size: parseFontSizeToHalfPoints(
          getDeclaration(rules, ['.algorithm'], 'font-size', '10pt'),
          bodyFontSizePt
        ),
      },
    },
    {
      id: 'blockQuote',
      name: 'Block Quote',
      basedOn: 'Legal Body',
      paragraph: {
        indent: {
          left: 720,
        },
      },
      run: {
        italics: true,
        color: normalizeColor(getDeclaration(rules, ['blockquote'], 'color', '#64748b'), '64748B'),
      },
    },
    {
      id: 'confidentialBanner',
      name: 'Confidential Banner',
      basedOn: 'Normal',
      quickFormat: true,
      paragraph: {
        alignment: AlignmentType.CENTER,
        spacing: {
          before: parseSpacingToTwips(
            getDeclaration(rules, ['.confidential'], 'margin-top', '14pt'),
            bodyFontSizePt
          ),
          after: parseSpacingToTwips(
            getDeclaration(rules, ['.confidential'], 'margin-bottom', '14pt'),
            bodyFontSizePt
          ),
        },
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['.confidential'], 'background-color', colorAccent),
            colorAccent
          ),
          type: ShadingType.CLEAR,
          color: colorInverse,
        },
      },
      run: {
        bold: true,
        color: colorInverse,
      },
    },
    {
      id: 'separatorBanner',
      name: 'Separator Banner',
      basedOn: 'Normal',
      quickFormat: true,
      paragraph: {
        alignment: AlignmentType.CENTER,
        spacing: {
          before: parseSpacingToTwips(
            getDeclaration(rules, ['.separator'], 'margin-top', '10pt'),
            bodyFontSizePt
          ),
          after: parseSpacingToTwips(
            getDeclaration(rules, ['.separator'], 'margin-bottom', '8pt'),
            bodyFontSizePt
          ),
        },
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['.separator'], 'background-color', colorPrimary),
            colorPrimary
          ),
          type: ShadingType.CLEAR,
          color: colorInverse,
        },
      },
      run: {
        bold: true,
        color: colorInverse,
      },
    },
    {
      id: 'tocContainer',
      name: 'Table Of Contents Container',
      basedOn: 'Legal Body',
      paragraph: {
        spacing: {
          before: parseSpacingToTwips(
            getDeclaration(rules, ['.table-of-contents'], 'margin-top', '8pt'),
            bodyFontSizePt
          ),
          after: parseSpacingToTwips(
            getDeclaration(rules, ['.table-of-contents'], 'margin-bottom', '8pt'),
            bodyFontSizePt
          ),
        },
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['.table-of-contents'], 'background-color', '#F8FAFC'),
            'F8FAFC'
          ),
          type: ShadingType.CLEAR,
          color: colorText,
        },
      },
      run: {
        color: colorText,
      },
    },
    ...Array.from({ length: 6 }, (_, index) =>
      buildHeadingStyle(index + 1, rules, bodyFontSizePt, colorPrimary, colorAccent)
    ),
  ];

  const characterStyles: ICharacterStyleOptions[] = [
    {
      id: 'inlineCode',
      name: 'Inline Code',
      basedOn: 'DefaultParagraphFont',
      run: {
        font: monoFamily,
        size: parseFontSizeToHalfPoints(
          getDeclaration(rules, ['code'], 'font-size', '10pt'),
          bodyFontSizePt
        ),
        color: colorPrimary,
        shading: {
          fill: normalizeColor(
            getDeclaration(rules, ['code'], 'background-color', '#F1F5F9'),
            'F1F5F9'
          ),
          type: ShadingType.CLEAR,
          color: colorPrimary,
        },
      },
    },
    buildHighlightCharacterStyle(
      'importedValue',
      'Imported Value',
      ['.imported-value', '.legal-field.imported-value'],
      rules,
      {
        color: normalizeColor(
          rules.variables.get('--highlight-imported-text') ?? '#004085',
          '004085'
        ),
        background: normalizeColor(
          rules.variables.get('--highlight-imported-bg') ?? '#E6F3FF',
          'E6F3FF'
        ),
      }
    ),
    buildHighlightCharacterStyle(
      'missingValue',
      'Missing Value',
      ['.missing-value', '.legal-field.missing-value'],
      rules,
      {
        color: normalizeColor(
          rules.variables.get('--highlight-missing-text') ?? '#DC3545',
          'DC3545'
        ),
        background: normalizeColor(
          rules.variables.get('--highlight-missing-bg') ?? '#FFF5F5',
          'FFF5F5'
        ),
      }
    ),
    buildHighlightCharacterStyle(
      'logicHighlight',
      'Logic Highlight',
      ['.highlight', '.legal-field.highlight'],
      rules,
      {
        color: normalizeColor(rules.variables.get('--highlight-logic-text') ?? '#856404', '856404'),
        background: normalizeColor(
          rules.variables.get('--highlight-logic-bg') ?? '#F9F3DF',
          'F9F3DF'
        ),
      }
    ),
  ];

  const heading1 = paragraphStyles.find(style => style.id === 'heading1Legal');
  const heading2 = paragraphStyles.find(style => style.id === 'heading2Legal');
  const heading3 = paragraphStyles.find(style => style.id === 'heading3Legal');
  const heading4 = paragraphStyles.find(style => style.id === 'heading4Legal');
  const heading5 = paragraphStyles.find(style => style.id === 'heading5Legal');
  const heading6 = paragraphStyles.find(style => style.id === 'heading6Legal');

  const styles: IStylesOptions = {
    default: {
      document: {
        run: {
          font: fontFamily,
          size: bodyFontSize,
          color: colorText,
        },
        paragraph: {
          spacing: {
            line: bodyLineHeight,
            lineRule: LineRuleType.AUTO,
          },
          alignment: parseAlignment(getDeclaration(rules, ['body'], 'text-align', 'left')),
        },
      },
      hyperlink: {
        run: {
          color: colorLink,
          underline: {
            type: UnderlineType.SINGLE,
            color: colorLink,
          },
        },
      },
      heading1: {
        run: heading1?.run,
        paragraph: heading1?.paragraph,
      },
      heading2: {
        run: heading2?.run,
        paragraph: heading2?.paragraph,
      },
      heading3: {
        run: heading3?.run,
        paragraph: heading3?.paragraph,
      },
      heading4: {
        run: heading4?.run,
        paragraph: heading4?.paragraph,
      },
      heading5: {
        run: heading5?.run,
        paragraph: heading5?.paragraph,
      },
      heading6: {
        run: heading6?.run,
        paragraph: heading6?.paragraph,
      },
      strong: {
        run: {
          bold: true,
          color: colorPrimary,
        },
      },
      listParagraph: {
        run: {
          color: colorText,
          size: bodyFontSize,
        },
      },
    },
    paragraphStyles,
    characterStyles,
  };

  return {
    styles,
    styleIds: {
      body: 'legalBody',
      codeBlock: 'codeBlock',
      algorithmBlock: 'algorithmBlock',
      blockQuote: 'blockQuote',
      confidentialBanner: 'confidentialBanner',
      separatorBanner: 'separatorBanner',
      tocContainer: 'tocContainer',
      inlineCode: 'inlineCode',
      importedValue: 'importedValue',
      missingValue: 'missingValue',
      logicHighlight: 'logicHighlight',
    },
    colors: {
      primary: colorPrimary,
      text: colorText,
      muted: colorMuted,
      inverse: colorInverse,
    },
    lists: {
      ordered: parseOrderedListStyle(getDeclaration(rules, ['ol'], 'list-style-type', 'decimal')),
      bullet: parseBulletListStyle(getDeclaration(rules, ['ul'], 'list-style-type', 'disc')),
    },
    table: {
      borderColor: tableBorderColor,
      headerFill: tableHeaderFill,
      headerTextColor: tableHeaderTextColor,
      cellFill: tableCellFill,
    },
  };
}
