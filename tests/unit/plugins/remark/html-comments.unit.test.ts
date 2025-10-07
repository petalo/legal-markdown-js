/**
 * Tests for HTML comment preservation in remark processing
 *
 * IMPORTANT: This test documents an architectural inconsistency related to Issue #119
 * (https://github.com/Digital-Lawyers/legal-markdown-js/issues/119)
 *
 * Current behavior:
 * - Direct remark processing: HTML comments are PRESERVED ✅
 * - Imported content: HTML comments are STRIPPED (workaround in imports.ts) ❌
 *
 * When Issue #119 is resolved (remarkImports inserts AST instead of text), the
 * stripHtmlComments() workaround should be removed and ALL comments should be preserved.
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

describe('HTML Comments Preservation - Imported Content (Issue #119 Workaround)', () => {
  /**
   * These tests document the CURRENT workaround behavior where HTML comments
   * are stripped from imported content to prevent remarkStringify escaping issues.
   *
   * TODO: When Issue #119 is resolved, these tests should FAIL and be updated
   * to verify that comments ARE preserved in imported content.
   */

  it('should strip HTML comments from imported files (current workaround)', () => {
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

      // Process with remarkImports
      const processor = unified()
        .use(remarkParse)
        .use(remarkImports, { basePath: tempDir })
        .use(remarkLegalHeadersParser)
        .use(remarkStringify);

      const mainContent = fs.readFileSync(mainFile, 'utf-8');
      const result = processor.processSync(mainContent);
      const output = String(result);

      // CURRENT BEHAVIOR (workaround): Comments should be STRIPPED from imported content
      expect(output).not.toContain('<!-- Comment before header -->');
      expect(output).not.toContain('<!-- Comment after header -->');
      expect(output).not.toContain('<!-- Footer comment -->');

      // But headers should still be converted
      expect(output).toContain('##');
      expect(output).toContain('Imported Section');

      // TODO: When Issue #119 is resolved, update this test to verify comments ARE preserved:
      // expect(output).toContain('<!-- Comment before header -->');
      // expect(output).toContain('<!-- Comment after header -->');
      // expect(output).toContain('<!-- Footer comment -->');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should document the inconsistency: direct content preserves comments, imported content strips them', () => {
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
      const result = processor.processSync(mainContent);
      const output = String(result);

      // INCONSISTENCY: Direct comment preserved, imported comment stripped
      expect(output).toContain('<!-- Direct comment -->'); // ✅ Preserved
      expect(output).not.toContain('<!-- Imported comment -->'); // ❌ Stripped (workaround)

      // TODO: When Issue #119 is resolved, both should be preserved:
      // expect(output).toContain('<!-- Direct comment -->');
      // expect(output).toContain('<!-- Imported comment -->');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
