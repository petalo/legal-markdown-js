import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { buildProcessingContext, generateAllFormats } from '../../src/core/pipeline';
import { processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';
import { docxGenerator } from '../../src/extensions/generators/docx-generator';
import { RESOLVED_PATHS } from '../../src/constants';

async function readZipXml(filePath: string, entryPath: string): Promise<string> {
  const buffer = readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file(entryPath);
  if (!entry) {
    throw new Error(`Missing zip entry: ${entryPath}`);
  }

  return entry.async('text');
}

async function loadZip(filePath: string): Promise<JSZip> {
  const buffer = readFileSync(filePath);
  return JSZip.loadAsync(buffer);
}

describe('DOCX generation integration', () => {
  let testDir: string;
  let defaultCssPath: string;
  let highlightCssPath: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), 'legal-md-docx-test-'));
    defaultCssPath = join(process.cwd(), 'src', 'styles', 'default.css');
    highlightCssPath = join(process.cwd(), 'src', 'styles', 'highlight.css');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('generates DOCX files through the 3-phase pipeline with valid OOXML internals', async () => {
    const content = `---
title: Master Services Agreement
version: 2.5.1
client_name: ACME Corp
---

# Master Services Agreement

Client: {{client_name}}

Pending value: {{missing_field}}
`;

    const context = await buildProcessingContext(content, { highlight: true, docx: true }, testDir);
    const processedResult = await processLegalMarkdown(context.content, {
      ...context.options,
      additionalMetadata: context.metadata,
      noIndent: true,
    });

    const formatResult = await generateAllFormats(processedResult, {
      outputDir: testDir,
      baseFilename: 'pipeline-docx',
      docx: true,
      highlight: true,
      title: 'Master Services Agreement',
      cssPath: defaultCssPath,
      highlightCssPath,
    });

    expect(formatResult.results.docx?.normal).toBeDefined();
    expect(formatResult.results.docx?.highlight).toBeDefined();

    const normalDocxPath = formatResult.results.docx!.normal!;
    const documentXml = await readZipXml(normalDocxPath, 'word/document.xml');
    const stylesXml = await readZipXml(normalDocxPath, 'word/styles.xml');
    const footerXml = await readZipXml(normalDocxPath, 'word/footer1.xml');
    const contentTypesXml = await readZipXml(normalDocxPath, '[Content_Types].xml');

    expect(contentTypesXml).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
    );
    expect(documentXml).toContain('Master Services Agreement');
    expect(stylesXml).toContain('legalBody');
    expect(stylesXml).toContain('inlineCode');
    expect(footerXml).toContain('Pg:');
    expect(footerXml).toContain('v2.5.1');
  });

  it('maps highlight CSS classes to DOCX run styles', async () => {
    const outputPath = join(testDir, 'highlight-styles.docx');

    const htmlContent = `<!doctype html>
<html>
<body>
  <p>Imported: <span class="imported-value">ACME Corp</span></p>
  <p>Missing: <span class="missing-value">{{missing_field}}</span></p>
  <p>Logic: <span class="highlight">Winner branch</span></p>
</body>
</html>`;

    await docxGenerator.generateDocxFromHtml(htmlContent, outputPath, {
      title: 'Highlight style mapping',
      includeHighlighting: true,
      cssPath: defaultCssPath,
      highlightCssPath,
      version: '1.0.0',
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');
    const stylesXml = await readZipXml(outputPath, 'word/styles.xml');

    expect(documentXml).toContain('importedValue');
    expect(documentXml).toContain('missingValue');
    expect(documentXml).toContain('logicHighlight');
    expect(stylesXml).toContain('importedValue');
    expect(stylesXml).toContain('missingValue');
    expect(stylesXml).toContain('logicHighlight');
  });

  it('styles raw unresolved placeholders as missing values in highlight mode', async () => {
    const outputPath = join(testDir, 'raw-placeholder-highlight.docx');
    const htmlContent = `<!doctype html>
<html>
<body>
  <p>Company: {{company.name}}</p>
  <div class="signatures">
    <table>
      <tr><td>Signer</td><td>{{signer.full_name}}</td></tr>
    </table>
  </div>
</body>
</html>`;

    await docxGenerator.generateDocxFromHtml(htmlContent, outputPath, {
      title: 'Raw Placeholder Highlight',
      includeHighlighting: true,
      cssPath: defaultCssPath,
      highlightCssPath,
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');

    expect(documentXml).toContain('{{company.name}}');
    expect(documentXml).toContain('{{signer.full_name}}');
    expect((documentXml.match(/w:rStyle w:val=\"missingValue\"/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('embeds header logo image when --logo-filename is present in CSS', async () => {
    const outputPath = join(testDir, 'logo-header.docx');
    const cssPath = join(testDir, 'logo-style.css');
    const logoName = `docx-test-logo-${Date.now()}.png`;
    const logoPath = join(RESOLVED_PATHS.IMAGES_DIR, logoName);

    mkdirSync(RESOLVED_PATHS.IMAGES_DIR, { recursive: true });
    writeFileSync(
      logoPath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAQEAx2wAAAAASUVORK5CYII=',
        'base64'
      )
    );
    writeFileSync(
      cssPath,
      `:root { --logo-filename: "${logoName}"; }
body { font-family: Arial; font-size: 12pt; }`
    );

    try {
      await docxGenerator.generateDocxFromHtml('<html><body><p>Logo Header Test</p></body></html>', outputPath, {
        title: 'Logo Header Test',
        cssPath,
      });

      const headerXml = await readZipXml(outputPath, 'word/header1.xml');
      const zip = await loadZip(outputPath);
      const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));

      expect(headerXml).toContain('<w:drawing>');
      expect(mediaEntries.length).toBeGreaterThan(0);
    } finally {
      unlinkSync(logoPath);
    }
  });

  it('renders page breaks, nested lists, tables and inline images in OOXML', async () => {
    const outputPath = join(testDir, 'structure-check.docx');
    const htmlContent = `<!doctype html>
<html>
<body>
  <p>Before break</p>
  <div class="page-break-before"></div>
  <ol>
    <li>Level 1
      <ul>
        <li>Level 2 bullet</li>
      </ul>
    </li>
  </ol>
  <table>
    <tr><th>Col A</th><th>Col B</th></tr>
    <tr><td>A1</td><td>B1</td></tr>
  </table>
  <p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAQEAx2wAAAAASUVORK5CYII=" /></p>
</body>
</html>`;

    await docxGenerator.generateDocxFromHtml(htmlContent, outputPath, {
      title: 'Structure Check',
      cssPath: defaultCssPath,
      highlightCssPath,
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');

    expect(documentXml).toContain('<w:pageBreakBefore/>');
    expect(documentXml).toContain('<w:numPr>');
    expect(documentXml).toContain('<w:ilvl w:val="1"/>');
    expect(documentXml).toContain('<w:tbl>');
    expect(documentXml).toContain('<w:drawing>');
  });

  it('supports DOCX-oriented classes, signatures/toc structures and list-style-type mapping', async () => {
    const outputPath = join(testDir, 'docx-class-mapping.docx');
    const htmlContent = `<!doctype html>
<html>
<body>
  <p class="text-center text-muted">Centered muted paragraph</p>
  <div class="confidential">CONFIDENTIAL</div>
  <div class="separator">SECTION</div>
  <div class="algorithm">for i in range(3): print(i)</div>
  <p class="page-break-after">Break here</p>
  <div class="table-of-contents">
    <ol>
      <li>Introduction</li>
      <li>Scope</li>
    </ol>
  </div>
  <ul style="list-style-type: square">
    <li>Square bullet</li>
  </ul>
  <ol style="list-style-type: upper-roman">
    <li>Roman numeral</li>
  </ol>
  <table class="signatures">
    <tr><th>Role</th><th>Signature</th></tr>
    <tr><td>Provider</td><td></td></tr>
  </table>
</body>
</html>`;

    await docxGenerator.generateDocxFromHtml(htmlContent, outputPath, {
      title: 'DOCX class mapping',
      cssPath: defaultCssPath,
      highlightCssPath,
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');
    const numberingXml = await readZipXml(outputPath, 'word/numbering.xml');

    expect(documentXml).toContain('confidentialBanner');
    expect(documentXml).toContain('separatorBanner');
    expect(documentXml).toContain('algorithmBlock');
    expect(documentXml).toContain('<w:jc w:val="center"/>');
    expect(documentXml).toContain('<w:color w:val="64748B"/>');
    expect(documentXml).toContain('<w:pageBreakBefore/>');
    expect(documentXml).toContain('Square bullet');
    expect(documentXml).toContain('Roman numeral');
    expect(documentXml).toContain('Provider');
    expect(documentXml).not.toContain('Role');

    const numberingEntries = (documentXml.match(/<w:numPr>/g) ?? []).length;
    expect(numberingEntries).toBe(2);
    expect(numberingXml).toContain('<w:numFmt w:val="upperRoman"/>');
    expect(numberingXml).toContain('<w:lvlText w:val="▪"/>');
  });

  it('applies page size, landscape orientation and custom margins in section properties', async () => {
    const outputPath = join(testDir, 'layout-check.docx');
    await docxGenerator.generateDocxFromHtml('<html><body><p>Layout Check</p></body></html>', outputPath, {
      title: 'Layout Check',
      format: 'Legal',
      landscape: true,
      margin: {
        top: '2cm',
        right: '1.5cm',
        bottom: '3cm',
        left: '1cm',
      },
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');

    expect(documentXml).toContain('w:orient="landscape"');
    expect(documentXml).toContain('w:w="12240"');
    expect(documentXml).toContain('w:h="20160"');
    expect(documentXml).toContain('w:top="1134"');
    expect(documentXml).toContain('w:right="850"');
    expect(documentXml).toContain('w:bottom="1701"');
    expect(documentXml).toContain('w:left="567"');
  });

  it('loads bundled default DOCX CSS when cssPath is omitted', async () => {
    const outputPath = join(testDir, 'default-css-fallback.docx');
    await docxGenerator.generateDocxFromHtml('<html><body><h1>Fallback</h1><p>Body</p></body></html>', outputPath, {
      title: 'Default CSS Fallback',
    });

    const stylesXml = await readZipXml(outputPath, 'word/styles.xml');

    expect(stylesXml).toContain('w:rFonts w:ascii="Segoe UI"');
    expect(stylesXml).toContain('w:color w:val="334155"');
    expect(stylesXml).toContain('w:pBdr');
    expect(stylesXml).toContain('w:color="0891B2"');
  });

  it('resolves relative inline image paths with basePath when converting HTML to DOCX', async () => {
    const outputPath = join(testDir, 'relative-image.docx');
    const imagePath = join(testDir, 'inline-local.png');
    writeFileSync(
      imagePath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAQEAx2wAAAAASUVORK5CYII=',
        'base64'
      )
    );

    await docxGenerator.generateDocxFromHtml(
      '<html><body><p>Image <img src="./inline-local.png" width="24" height="24" /></p></body></html>',
      outputPath,
      {
        title: 'Relative Image',
        basePath: testDir,
      }
    );

    const documentXml = await readZipXml(outputPath, 'word/document.xml');
    const zip = await loadZip(outputPath);
    const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));

    expect(documentXml).toContain('<w:drawing>');
    expect(mediaEntries.length).toBeGreaterThan(0);
  });

  it('falls back to empty header when logo filename is configured but asset cannot be resolved', async () => {
    const outputPath = join(testDir, 'missing-logo-header.docx');
    const cssPath = join(testDir, 'missing-logo-style.css');
    writeFileSync(
      cssPath,
      `:root { --logo-filename: "logo-not-found.png"; }
body { font-family: Arial; font-size: 12pt; }`
    );

    await docxGenerator.generateDocxFromHtml('<html><body><p>Missing Logo</p></body></html>', outputPath, {
      title: 'Missing Logo',
      cssPath,
    });

    const headerXml = await readZipXml(outputPath, 'word/header1.xml');
    const zip = await loadZip(outputPath);
    const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));

    expect(headerXml).not.toContain('<w:drawing>');
    expect(mediaEntries.length).toBe(0);
  });

  it('supports custom DOCX header/footer templates with inline images', async () => {
    const outputPath = join(testDir, 'custom-header-footer.docx');
    const imagePath = join(testDir, 'header-inline.png');
    writeFileSync(
      imagePath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAQEAx2wAAAAASUVORK5CYII=',
        'base64'
      )
    );

    await docxGenerator.generateDocxFromHtml('<html><body><p>Body</p></body></html>', outputPath, {
      title: 'Custom Header/Footer',
      basePath: testDir,
      headerTemplate:
        '<p class="text-center">Custom Header <img src="./header-inline.png" width="18" height="18" /></p>',
      footerTemplate: '<p class="text-center">Custom Footer</p>',
    });

    const headerXml = await readZipXml(outputPath, 'word/header1.xml');
    const footerXml = await readZipXml(outputPath, 'word/footer1.xml');
    const zip = await loadZip(outputPath);
    const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));

    expect(headerXml).toContain('Custom Header');
    expect(headerXml).toContain('<w:drawing>');
    expect(footerXml).toContain('Custom Footer');
    expect(footerXml).not.toContain('Pg:');
    expect(mediaEntries.length).toBeGreaterThan(0);
  });

  it('normalizes soft line breaks inside paragraphs to avoid stretched justified spacing', async () => {
    const outputPath = join(testDir, 'soft-break-normalization.docx');
    const htmlContent = `<html><body><p>First sentence
second sentence
third sentence</p></body></html>`;

    await docxGenerator.generateDocxFromHtml(htmlContent, outputPath, {
      title: 'Soft Break Normalization',
      cssPath: defaultCssPath,
    });

    const documentXml = await readZipXml(outputPath, 'word/document.xml');

    expect(documentXml).toContain('First sentence second sentence third sentence');
    expect(documentXml).not.toContain('First sentence\nsecond sentence');
  });
});
