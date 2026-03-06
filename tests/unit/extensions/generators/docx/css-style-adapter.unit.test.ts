import { describe, expect, it } from 'vitest';
import { adaptCssToDocxStyles } from '../../../../../src/extensions/generators/docx/css-style-adapter';

function getCharacterStyle(preset: ReturnType<typeof adaptCssToDocxStyles>, id: string) {
  return preset.styles.characterStyles?.find(style => style.id === id);
}

describe('adaptCssToDocxStyles', () => {
  it('resolves CSS variables for highlight run styles', () => {
    const css = `
      :root {
        --highlight-imported-border: #1188cc;
        --highlight-imported-bg: #eaf7ff;
        --highlight-imported-text: #004466;
      }

      .imported-value {
        border-color: var(--highlight-imported-border);
        background-color: var(--highlight-imported-bg);
        color: var(--highlight-imported-text);
      }
    `;

    const preset = adaptCssToDocxStyles(css);
    const imported = getCharacterStyle(preset, 'importedValue');

    expect(imported).toBeDefined();
    expect(imported?.run?.color).toBe('004466');
    expect(imported?.run?.highlight).toBe('lightGray');
    expect(imported?.run?.border).toBeUndefined();
    expect(imported?.run?.shading).toBeUndefined();
  });

  it('keeps base selector values when hover/media rules are present', () => {
    const css = `
      :root {
        --highlight-missing-border: #dc3545;
      }

      .missing-value {
        border-color: var(--highlight-missing-border);
        background-color: #fff5f5;
        color: #dc3545;
      }

      .missing-value:hover {
        border-color: #00ff00;
      }

      @media print {
        .missing-value {
          border-color: #0000ff;
        }
      }
    `;

    const preset = adaptCssToDocxStyles(css);
    const missing = getCharacterStyle(preset, 'missingValue');

    expect(missing).toBeDefined();
    expect(missing?.run?.color).toBe('DC3545');
    expect(missing?.run?.highlight).toBe('lightGray');
  });

  it('maps heading and table styles from CSS tokens', () => {
    const css = `
      body {
        font-family: "Source Serif Pro", serif;
        font-size: 12pt;
        color: #222222;
      }

      .legal-header-level-1 {
        color: #0a3c70;
        font-size: 20pt;
        font-weight: 700;
      }

      table {
        border-color: #123456;
      }

      th {
        background-color: #f3f6f9;
        color: #102030;
      }

      td {
        background-color: #ffffff;
      }
    `;

    const preset = adaptCssToDocxStyles(css);
    const heading1 = preset.styles.paragraphStyles?.find(style => style.id === 'heading1Legal');
    const defaultRun = preset.styles.default?.document?.run;

    expect(heading1).toBeDefined();
    expect(heading1?.run?.color).toBe('0A3C70');
    expect(heading1?.run?.bold).toBe(true);
    expect(defaultRun?.font).toBe('Source Serif Pro');
    expect(defaultRun?.color).toBe('222222');

    expect(preset.table.borderColor).toBe('123456');
    expect(preset.table.headerFill).toBe('F3F6F9');
    expect(preset.table.headerTextColor).toBe('102030');
    expect(preset.table.cellFill).toBe('FFFFFF');
  });

  it('falls back to body font/color and supports named colors', () => {
    const css = `
      body {
        font-family: "Courier New", monospace;
        color: red;
      }
      a {
        color: navy;
      }
      pre, code {
        font-family: "Fira Code", monospace;
      }
    `;

    const preset = adaptCssToDocxStyles(css);
    const defaultRun = preset.styles.default?.document?.run;
    const hyperlinkRun = preset.styles.default?.hyperlink?.run;
    const inlineCode = preset.styles.characterStyles?.find(style => style.id === 'inlineCode');

    expect(defaultRun?.font).toBe('Courier New');
    expect(defaultRun?.color).toBe('FF0000');
    expect(hyperlinkRun?.color).toBe('000080');
    expect(inlineCode?.run?.font).toBe('Fira Code');
  });

  it('extracts DOCX list-style presets and structural banner styles', () => {
    const css = `
      ul {
        list-style-type: square;
      }

      ol {
        list-style-type: upper-roman;
      }

      .confidential {
        background-color: #123456;
      }

      .separator {
        background-color: #0891b2 !important;
      }
    `;

    const preset = adaptCssToDocxStyles(css);
    const confidentialStyle = preset.styles.paragraphStyles?.find(style => style.id === 'confidentialBanner');
    const separatorStyle = preset.styles.paragraphStyles?.find(style => style.id === 'separatorBanner');

    expect(preset.lists.bullet).toBe('square');
    expect(preset.lists.ordered).toBe('upperRoman');
    expect(confidentialStyle?.paragraph?.shading?.fill).toBe('123456');
    expect(separatorStyle?.paragraph?.shading?.fill).toBe('0891B2');
  });
});
