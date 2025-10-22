/**
 * End-to-end integration tests for imports with HTML content preservation
 *
 * This test suite verifies that:
 * 1. HTML comments are preserved when importing files
 * 2. HTML elements are preserved when importing files
 * 3. HTML is not escaped or mangled during import processing
 * 4. Complete documents with imports and HTML work correctly
 *
 * Related to Issue #119: AST-based imports cleanup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Imports with HTML Preservation - End-to-End', () => {
  const tempDir = join(process.cwd(), 'tests', 'fixtures', 'temp-html-imports');
  const htmlCommentsFile = join(tempDir, 'with-comments.md');
  const htmlElementsFile = join(tempDir, 'with-elements.md');
  const mixedContentFile = join(tempDir, 'mixed-content.md');

  beforeAll(() => {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create file with HTML comments
    writeFileSync(
      htmlCommentsFile,
      `# Section with Comments

<!-- This is an important note -->
Regular content here.
<!-- Page break marker -->`
    );

    // Create file with HTML elements
    writeFileSync(
      htmlElementsFile,
      `# Section with Elements

<div class="callout">
Important information
</div>

<div class="page-break"></div>

Regular markdown content.`
    );

    // Create file with mixed content
    writeFileSync(
      mixedContentFile,
      `---
section_title: Mixed Content Section
---

# {{section_title}}

<!-- Start of special section -->
<div class="highlight">
**Bold text** inside HTML
</div>
<!-- End of special section -->

Regular paragraph.`
    );
  });

  afterAll(() => {
    try {
      unlinkSync(htmlCommentsFile);
      unlinkSync(htmlElementsFile);
      unlinkSync(mixedContentFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('HTML Comments Preservation', () => {
    it('should preserve HTML comments from imported files', async () => {
      const content = `---
---

# Main Document

@import ./with-comments.md

# Conclusion`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // Verify comments are preserved
      expect(result.content).toContain('<!-- This is an important note -->');
      expect(result.content).toContain('<!-- Page break marker -->');

      // Verify comments are NOT escaped
      expect(result.content).not.toContain('&lt;!--');
      expect(result.content).not.toContain('--&gt;');
      expect(result.content).not.toContain('\\<');
    });

    it('should preserve multiple HTML comments in sequence', async () => {
      const content = `---
---

<!-- First comment -->
@import ./with-comments.md
<!-- Second comment -->`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // All comments should be preserved
      expect(result.content).toContain('<!-- First comment -->');
      expect(result.content).toContain('<!-- This is an important note -->');
      expect(result.content).toContain('<!-- Page break marker -->');
      expect(result.content).toContain('<!-- Second comment -->');
    });
  });

  describe('HTML Elements Preservation', () => {
    it('should preserve HTML div elements from imported files', async () => {
      const content = `---
---

# Main Document

@import ./with-elements.md

# Next Section`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // Verify div elements are preserved
      expect(result.content).toContain('<div class="callout">');
      expect(result.content).toContain('</div>');
      expect(result.content).toContain('<div class="page-break"></div>');

      // Verify elements are NOT escaped
      expect(result.content).not.toContain('&lt;div');
      expect(result.content).not.toContain('&gt;');
      expect(result.content).not.toContain('\\<div');
    });

    it('should preserve HTML within markdown content', async () => {
      const content = `---
---

Regular markdown

@import ./with-elements.md

More regular markdown`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // HTML should be preserved alongside markdown
      expect(result.content).toContain('Regular markdown');
      expect(result.content).toContain('<div class="callout">');
      expect(result.content).toContain('More regular markdown');
    });
  });

  describe('Mixed Content Processing', () => {
    it('should handle imports with HTML, markdown, and template fields', async () => {
      const content = `---
section_title: My Special Section
---

# Document Start

@import ./mixed-content.md

# Document End`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // Verify template field was expanded
      expect(result.content).toContain('My Special Section');

      // Verify HTML comments preserved
      expect(result.content).toContain('<!-- Start of special section -->');
      expect(result.content).toContain('<!-- End of special section -->');

      // Verify HTML elements preserved
      expect(result.content).toContain('<div class="highlight">');

      // Verify markdown formatting preserved
      expect(result.content).toContain('**Bold text**');
    });

    it('should process nested imports with HTML', async () => {
      // Create a file that imports another file
      const nestedImportFile = join(tempDir, 'nested.md');
      writeFileSync(
        nestedImportFile,
        `# Nested Section

@import ./with-comments.md

End of nested section`
      );

      const content = `---
---

# Top Level

@import ./nested.md

# Conclusion`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // Verify nested import HTML is preserved
      expect(result.content).toContain('<!-- This is an important note -->');
      expect(result.content).toContain('Nested Section');
      expect(result.content).toContain('End of nested section');

      // Cleanup
      unlinkSync(nestedImportFile);
    });
  });

  describe('Complete Document Workflow', () => {
    it('should handle complete legal document with imports and HTML', async () => {
      const content = `---
title: Service Agreement
client_name: Acme Corporation
level-one: "Article %n."
level-two: "Section %n.%s"
---

l. **Introduction**

This agreement is between {{client_name}} and the service provider.

<!-- Legal marker: Agreement terms follow -->

ll. Standard Terms

@import ./with-elements.md

ll. Special Provisions

<!-- Important: Review with legal counsel -->
<div class="legal-notice">
This section requires special attention.
</div>

@import ./with-comments.md

l. **Conclusion**

Document executed on this date.`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
      });

      // Verify all features work together
      expect(result.content).toContain('Acme Corporation'); // Template fields
      expect(result.content).toContain('Article 1.'); // Headers
      expect(result.content).toContain('Section'); // Sub-headers

      // Verify HTML from imports is preserved
      expect(result.content).toContain('<div class="callout">');
      expect(result.content).toContain('<!-- This is an important note -->');

      // Verify inline HTML is preserved
      expect(result.content).toContain('<!-- Legal marker: Agreement terms follow -->');
      expect(result.content).toContain('<div class="legal-notice">');
      expect(result.content).toContain('<!-- Important: Review with legal counsel -->');

      // Verify no HTML escaping occurred
      expect(result.content).not.toContain('&lt;');
      expect(result.content).not.toContain('&gt;');
      expect(result.content).not.toContain('\\<');
      expect(result.content).not.toContain('\\>');

      // Verify metadata was processed
      expect(result.metadata.title).toBe('Service Agreement');
      expect(result.metadata.client_name).toBe('Acme Corporation');
    });

    it('should generate HTML output with preserved HTML from imports', async () => {
      const { htmlGenerator } = await import('../../src/extensions/generators/html-generator');

      const content = `---
title: Test Document
---

# Document

@import ./with-elements.md

Regular content.`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      const htmlOutput = await htmlGenerator.generateHtml(result.content, result.metadata, {
        includeHighlighting: false,
      });

      // Verify HTML elements appear in output (at least the callout)
      expect(htmlOutput).toContain('<div class="callout">');

      // HTML should not be double-escaped
      expect(htmlOutput).not.toContain('&amp;lt;');
      expect(htmlOutput).not.toContain('&amp;gt;');

      // Content from imported file should be present
      expect(htmlOutput).toContain('Important information');
    });
  });

  describe('Edge Cases', () => {
    it('should handle imports with only HTML comments', async () => {
      const commentsOnlyFile = join(tempDir, 'comments-only.md');
      writeFileSync(
        commentsOnlyFile,
        `<!-- Comment 1 -->
<!-- Comment 2 -->
<!-- Comment 3 -->`
      );

      const content = `---
---

Before
@import ./comments-only.md
After`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      expect(result.content).toContain('<!-- Comment 1 -->');
      expect(result.content).toContain('<!-- Comment 2 -->');
      expect(result.content).toContain('<!-- Comment 3 -->');

      unlinkSync(commentsOnlyFile);
    });

    it('should handle imports with malformed HTML gracefully', async () => {
      const malformedFile = join(tempDir, 'malformed.md');
      writeFileSync(
        malformedFile,
        `# Section

<div class="test"
Regular content
<div>`
      );

      const content = `---
---

@import ./malformed.md`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      // Should not crash, should include content
      expect(result.content).toContain('Section');
      expect(result.content).toContain('Regular content');

      unlinkSync(malformedFile);
    });

    it('should handle very long HTML comments in imports', async () => {
      const longCommentFile = join(tempDir, 'long-comment.md');
      const longComment = `<!-- ${'x'.repeat(1000)} -->`;
      writeFileSync(longCommentFile, `# Section\n\n${longComment}\n\nContent`);

      const content = `---
---

@import ./long-comment.md`;

      const result = await processLegalMarkdownWithRemark(content, {
        basePath: tempDir,
        noHeaders: true,
        noReferences: true, // Disable cross-references since headers are disabled
      });

      expect(result.content).toContain('<!--');
      expect(result.content).toContain('-->');
      expect(result.content.length).toBeGreaterThan(1000);

      unlinkSync(longCommentFile);
    });
  });
});
