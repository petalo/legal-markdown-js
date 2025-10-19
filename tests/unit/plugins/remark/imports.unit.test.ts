/**
 * Unit tests for remarkImports plugin - HTML preservation
 * Tests that HTML comments and elements in imported files are preserved
 * as AST nodes (Issue #119)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../../../src/extensions/remark/legal-markdown-processor';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('remarkImports - HTML Preservation', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-md-imports-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('HTML Comments', () => {
    it('should preserve HTML comments from imported files', async () => {
      // Create imported file with HTML comment
      const importedFile = path.join(tempDir, 'with-comment.md');
      const importedContent = `<!-- Page break -->
# Section Title

This is content after the comment.`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      // Create main file that imports
      const mainFile = path.join(tempDir, 'main-comment.md');
      const mainContent = `# Main Document

@import with-comment.md

# End`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      // HTML comment should be preserved (not escaped)
      expect(result.content).toContain('<!-- Page break -->');
      expect(result.content).not.toContain('&lt;!--');
      expect(result.content).not.toContain('\\<!--');
    });

    it('should preserve multiple HTML comments', async () => {
      const importedFile = path.join(tempDir, 'multiple-comments.md');
      const importedContent = `<!-- Comment 1 -->
Content here
<!-- Comment 2 -->
More content
<!-- Comment 3 -->`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-multi-comments.md');
      const mainContent = `@import multiple-comments.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      expect(result.content).toContain('<!-- Comment 1 -->');
      expect(result.content).toContain('<!-- Comment 2 -->');
      expect(result.content).toContain('<!-- Comment 3 -->');
    });
  });

  describe('HTML Elements', () => {
    it('should preserve HTML div elements from imported files', async () => {
      const importedFile = path.join(tempDir, 'with-div.md');
      const importedContent = `<div class="page-break"></div>

# After Page Break`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-div.md');
      const mainContent = `@import with-div.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      // HTML div should be preserved
      expect(result.content).toContain('<div class="page-break"></div>');
      expect(result.content).not.toContain('&lt;div');
      expect(result.content).not.toContain('\\<div');
    });

    it('should preserve span elements with classes', async () => {
      const importedFile = path.join(tempDir, 'with-span.md');
      const importedContent = `Text with <span class="highlight">highlighted content</span> here.`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-span.md');
      const mainContent = `@import with-span.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      expect(result.content).toContain('<span class="highlight">');
      expect(result.content).toContain('highlighted content</span>');
    });
  });

  describe('Complex HTML Structures', () => {
    it('should preserve nested HTML structures', async () => {
      const importedFile = path.join(tempDir, 'nested-html.md');
      const importedContent = `<div class="container">
  <div class="inner">
    <!-- Inner comment -->
    <p>Nested content</p>
  </div>
</div>`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-nested.md');
      const mainContent = `@import nested-html.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      expect(result.content).toContain('<div class="container">');
      expect(result.content).toContain('<div class="inner">');
      expect(result.content).toContain('<!-- Inner comment -->');
      expect(result.content).toContain('<p>Nested content</p>');
    });

    it('should preserve HTML mixed with markdown', async () => {
      const importedFile = path.join(tempDir, 'mixed-content.md');
      const importedContent = `# Heading

<!-- Comment -->
<div class="note">This is a note</div>

Normal **markdown** text.

<span class="important">Important</span> message.`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-mixed.md');
      const mainContent = `@import mixed-content.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      // All elements should be preserved
      expect(result.content).toContain('<!-- Comment -->');
      expect(result.content).toContain('<div class="note">');
      expect(result.content).toContain('<span class="important">');
      expect(result.content).toContain('**markdown**');
    });
  });

  describe('AST Node Insertion', () => {
    it('should insert imported content as AST nodes, not text', async () => {
      const importedFile = path.join(tempDir, 'ast-test.md');
      const importedContent = `<!-- Comment -->
# Header
<div>HTML</div>`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-ast.md');
      const mainContent = `@import ast-test.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      // If content was inserted as text, HTML would be escaped
      // If inserted as AST nodes, HTML is preserved
      expect(result.content).not.toContain('&lt;!--');
      expect(result.content).not.toContain('&lt;div&gt;');
      expect(result.content).not.toContain('\\<');

      // Should contain unescaped HTML
      expect(result.content).toContain('<!-- Comment -->');
      expect(result.content).toContain('<div>HTML</div>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty imported files', async () => {
      const importedFile = path.join(tempDir, 'empty.md');
      fs.writeFileSync(importedFile, '', 'utf-8');

      const mainFile = path.join(tempDir, 'main-empty.md');
      const mainContent = `# Before

@import empty.md

# After`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      // Should not crash, content should still be valid
      expect(result.content).toContain('# Before');
      expect(result.content).toContain('# After');
    });

    it('should handle imports with only HTML comments', async () => {
      const importedFile = path.join(tempDir, 'only-comment.md');
      const importedContent = `<!-- Just a comment -->`;
      fs.writeFileSync(importedFile, importedContent, 'utf-8');

      const mainFile = path.join(tempDir, 'main-only-comment.md');
      const mainContent = `@import only-comment.md`;
      fs.writeFileSync(mainFile, mainContent, 'utf-8');

      const result = await processLegalMarkdownWithRemark(mainContent, {
        basePath: tempDir,
      });

      expect(result.content).toContain('<!-- Just a comment -->');
    });
  });
});
