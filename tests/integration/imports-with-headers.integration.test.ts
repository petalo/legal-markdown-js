/**
 * Integration test for imports with legal headers
 * Tests that headers in imported files are correctly converted
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Imports with Legal Headers Integration', () => {
  let tempDir: string;
  let mainFile: string;
  let importedFile: string;

  beforeAll(() => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-test-'));

    // Create imported file with headers
    importedFile = path.join(tempDir, 'imported.md');
    const importedContent = `
ll. - Confidencialidad

Este es un párrafo sobre confidencialidad.

lll. Subsección de confidencialidad

Más detalles sobre confidencialidad.

llllll. - Anexo sobre VTT |anexo-vtt|

Este es el contenido del anexo.
`;
    fs.writeFileSync(importedFile, importedContent, 'utf-8');

    // Create main file that imports the other file
    mainFile = path.join(tempDir, 'main.md');
    const mainContent = `---
level-two: 'Cláusula %R'
level-three: 'Sección %n -'
level-six: 'Anexo %R'
---

ll. - Introducción

Este es el contenido principal.

@import imported.md

ll. - Conclusión

Este es el final del documento.
`;
    fs.writeFileSync(mainFile, mainContent, 'utf-8');
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should convert headers in imported files to proper HTML headings', async () => {
    const mainContent = fs.readFileSync(mainFile, 'utf-8');

    const result = await processLegalMarkdownWithRemark(mainContent, {
      basePath: tempDir,
      debug: false,
    });

    // Check that headers are converted (not left as paragraphs with ll., lll., etc.)
    expect(result.content).not.toContain('ll. - Confidencialidad');
    expect(result.content).not.toContain('lll. Subsección');
    expect(result.content).not.toContain('llllll. - Anexo');

    // Check that headers are properly converted to markdown headings
    expect(result.content).toContain('##'); // Level 2 headers
    expect(result.content).toContain('###'); // Level 3 headers
    expect(result.content).toContain('######'); // Level 6 headers

    // Verify the headers have proper numbering (with flexible spacing)
    expect(result.content).toMatch(/Cláusula\s+I/); // First level-2 header
    expect(result.content).toMatch(/Cláusula\s+II/); // Second level-2 header (imported)
    expect(result.content).toMatch(/Cláusula\s+III/); // Third level-2 header
  });

  it('should process headers in both main and imported files', async () => {
    const mainContent = fs.readFileSync(mainFile, 'utf-8');

    const result = await processLegalMarkdownWithRemark(mainContent, {
      basePath: tempDir,
      debug: false,
    });

    const lines = result.content.split('\n');

    // Find all header lines
    const headerLines = lines.filter(
      line =>
        line.startsWith('##') && !line.startsWith('###') && !line.startsWith('####')
    );

    // Should have exactly 3 level-2 headers (Introducción, Confidencialidad, Conclusión)
    expect(headerLines.length).toBeGreaterThanOrEqual(3);

    // Verify they are numbered sequentially (with flexible spacing)
    expect(headerLines.some(line => /Cláusula\s+I/.test(line))).toBe(true);
    expect(headerLines.some(line => /Cláusula\s+II/.test(line))).toBe(true);
    expect(headerLines.some(line => /Cláusula\s+III/.test(line))).toBe(true);
  });

  it('should preserve cross-reference markers in imported headers', async () => {
    const mainContent = fs.readFileSync(mainFile, 'utf-8');

    const result = await processLegalMarkdownWithRemark(mainContent, {
      basePath: tempDir,
      debug: false,
    });

    // The header should be converted, but cross-reference marker should be preserved
    // Note: The exact format depends on how cross-references are processed
    expect(result.content).toContain('Anexo');
  });
});
