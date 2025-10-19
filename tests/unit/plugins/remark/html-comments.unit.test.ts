/**
 * Tests for HTML comment preservation in remark processing
 *
 * Tests verify that HTML comments are preserved in both:
 * - Direct remark processing ✅
 * - Imported content (AST-based imports) ✅
 *
 * The remarkImports plugin now inserts AST nodes instead of plain text,
 * which preserves HTML structure including comments.
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkLegalHeadersParser } from '../../../../src/plugins/remark/legal-headers-parser';
import { remarkImports } from '../../../../src/plugins/remark/imports';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('HTML Comments Preservation - Direct Processing', () => {
  it('should preserve HTML comments when processing legal headers', () => {
    const input = `<!-- This is a comment -->

ll. - Section Title

Some content here.

<!-- Another comment -->`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkStringify);

    const result = processor.processSync(input);
    const output = String(result);

    // Comments should be preserved as HTML comments, not escaped
    expect(output).toContain('<!-- This is a comment -->');
    expect(output).toContain('<!-- Another comment -->');
    expect(output).not.toContain('&lt;!--');
    expect(output).not.toContain('--&gt;');
  });

  it('should preserve HTML comments in complex documents', () => {
    const input = `<!-- Header comment -->
ll. - First Section

Content for first section.

<!-- Middle comment -->
lll. Subsection

Subsection content.

<!-- Footer comment -->`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkStringify);

    const result = processor.processSync(input);
    const output = String(result);

    // All comments should be preserved
    expect(output).toContain('<!-- Header comment -->');
    expect(output).toContain('<!-- Middle comment -->');
    expect(output).toContain('<!-- Footer comment -->');

    // Headers should still be converted
    expect(output).toContain('##');
    expect(output).toContain('###');
  });

  it('should handle comments inline with text', () => {
    const input = `ll. - Section <!-- inline comment --> Title

Content here.`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkLegalHeadersParser)
      .use(remarkStringify);

    const result = processor.processSync(input);
    const output = String(result);

    // Inline comments should be preserved
    expect(output).toContain('<!-- inline comment -->');
    expect(output).not.toContain('&lt;!--');
  });
});

describe('HTML Comments Preservation - Imported Content (AST-based)', () => {
  /**
   * These tests verify that HTML comments are now preserved in imported content.
   * remarkImports now inserts AST nodes instead of text, preserving HTML comments.
   */

  it('should preserve HTML comments from imported files', async () => {
    // Create temporary directory and files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-comments-test-'));
    const importedFile = path.join(tempDir, 'imported.md');
    const mainFile = path.join(tempDir, 'main.md');

    try {
      // Create imported file with HTML comments and legal headers
      fs.writeFileSync(
        importedFile,
        `<!-- Comment before header -->
ll. - Imported Section
<!-- Comment after header -->

Content from imported file.

<!-- Footer comment -->`
      );

      // Create main file that imports the file with comments
      fs.writeFileSync(
        mainFile,
        `# Main Document

@import imported.md`
      );

      // Process with remarkImports (now async!)
      const processor = unified()
        .use(remarkParse)
        .use(remarkImports, { basePath: tempDir })
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const mainContent = fs.readFileSync(mainFile, 'utf-8');
      const result = await processor.process(mainContent);
      const output = String(result);

      // Comments should be PRESERVED from imported content
      expect(output).toContain('<!-- Comment before header -->');
      expect(output).toContain('<!-- Comment after header -->');
      expect(output).toContain('<!-- Footer comment -->');

      // Headers should still be converted
      expect(output).toContain('##');
      expect(output).toContain('Imported Section');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should preserve comments consistently in both direct and imported content', async () => {
    // Create temporary directory and files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-comments-test-'));
    const importedFile = path.join(tempDir, 'imported.md');
    const mainFile = path.join(tempDir, 'main.md');

    try {
      // Imported file with comment
      fs.writeFileSync(
        importedFile,
        `<!-- Imported comment -->
ll. - Imported Section`
      );

      // Main file with direct comment AND import
      fs.writeFileSync(
        mainFile,
        `<!-- Direct comment -->
ll. - Direct Section

@import imported.md`
      );

      const processor = unified()
        .use(remarkParse)
        .use(remarkImports, { basePath: tempDir })
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const mainContent = fs.readFileSync(mainFile, 'utf-8');
      const result = await processor.process(mainContent);
      const output = String(result);

      // CONSISTENT BEHAVIOR: Both comments should be preserved
      expect(output).toContain('<!-- Direct comment -->'); // ✅ Preserved
      expect(output).toContain('<!-- Imported comment -->'); // ✅ Now preserved with AST-based imports
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
