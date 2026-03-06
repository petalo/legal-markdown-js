/**
 * @fileoverview Tests for file format handling in the legal-markdown system
 *
 * This test suite verifies that the system correctly processes different input formats:
 * - Markdown (.md) files with various formatting elements
 * - Plain text (.txt) files with special characters and spacing
 * - File system integration and error handling
 * - Preservation of content formatting across different file types
 */

import { processLegalMarkdown } from '../../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('File Formats', () => {
  const testDir = path.join(__dirname, 'temp');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Markdown (.md) input files', () => {
    it('should support basic Markdown input files', async () => {
      const content = `---
title: Test Document
level-one: "Article %n."
level-two: "Section %n."
---

# Test Header

This is a test document.

l. First Level
ll. Second Level`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('# Test Header');
      expect(result.content).toContain('This is a test document.');
      expect(result.content).toContain('Article 1. First Level');
      expect(result.metadata?.title).toBe('Test Document');
    });

    it('should handle Markdown with complex formatting', async () => {
      const content = `---
title: Complex Document
level-one: "Article %n."
---

# Main Title

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`javascript
console.log('code block');
\`\`\`

l. Legal Header`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('**Bold text**');
      expect(result.content).toContain('*italic text*');
      expect(result.content).toContain('- List item 1');
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('Article 1. Legal Header');
    });

    it('should preserve Markdown links and images', async () => {
      const content = `---
title: Test Links
level-one: "Article %n."
---

[Link text](https://example.com)

![Alt text](image.png)

l. Header with [inline link](https://example.com)`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('[Link text](https://example.com)');
      expect(result.content).toContain('![Alt text](image.png)');
      expect(result.content).toContain('# Article 1. Header with inline link');
    });
  });

  describe('ASCII (.txt) input files', () => {
    it('should support basic ASCII text input files', async () => {
      const content = `---
title: ASCII Document
author: Test Author
level-one: "Article %n."
level-two: "Section %n."
---

Simple ASCII text document.

l. First section
ll. Subsection

Plain text content without markdown formatting.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Simple ASCII text document.');
      expect(result.content).toContain('Article 1. First section');
      expect(result.content).toContain('Section 1. Subsection');
      expect(result.content).toContain('Plain text content');
      expect(result.metadata?.title).toBe('ASCII Document');
      expect(result.metadata?.author).toBe('Test Author');
    });

    it('should handle ASCII with special characters', async () => {
      const content = `---
title: Special Characters
level-one: "Article %n."
level-two: "Section %n."
---

Text with special characters: àáâãäåæçèéêë

l. Section with special chars: ñóôõöø
ll. Subsection with symbols: @#$%^&*()`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('àáâãäåæçèéêë');
      expect(result.content).toContain('Article 1. Section with special chars: ñóôõöø');
      expect(result.content).toContain('Section 1. Subsection with symbols: @#$%^&*()');
    });

    it('should handle ASCII with line breaks and spacing', async () => {
      const content = `---
title: Spacing Test
level-one: "Article %n."
level-two: "Section %n."
level-three: "(%n)"
---

First paragraph.

Second paragraph with multiple lines.

l. Section one
   
ll. Section two with spacing

lll. Section three`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('First paragraph.');
      expect(result.content).toContain('Second paragraph with multiple lines.');
      expect(result.content).toContain('Article 1. Section one');
      expect(result.content).toContain('Section 1. Section two with spacing');
      expect(result.content).toContain('(1) Section three');
    });
  });

  describe('File reading integration', () => {
    it('should handle .md files from filesystem', async () => {
      const mdContent = `---
title: File System Test
level-one: "Article %n."
---

# Markdown Document

l. Header from file`;

      const mdPath = path.join(testDir, 'test.md');
      fs.writeFileSync(mdPath, mdContent);

      const fileContent = fs.readFileSync(mdPath, 'utf8');
      const result = await processLegalMarkdown(fileContent);

      expect(result.content).toContain('# Markdown Document');
      expect(result.content).toContain('Article 1. Header from file');
      expect(result.metadata?.title).toBe('File System Test');
    });

    it('should handle .txt files from filesystem', async () => {
      const txtContent = `---
title: Text File Test
level-one: "Article %n."
---

Plain text document

l. Text file header`;

      const txtPath = path.join(testDir, 'test.txt');
      fs.writeFileSync(txtPath, txtContent);

      const fileContent = fs.readFileSync(txtPath, 'utf8');
      const result = await processLegalMarkdown(fileContent);

      expect(result.content).toContain('Plain text document');
      expect(result.content).toContain('Article 1. Text file header');
      expect(result.metadata?.title).toBe('Text File Test');
    });
  });

  describe('Error handling', () => {
    it('should handle empty files gracefully', async () => {
      const result = await processLegalMarkdown('');

      expect(result.content).toBe('');
      expect(result.metadata).toHaveProperty("_cross_references");
      expect(result.metadata).toHaveProperty("_field_mappings");
    });

    it('should handle files with only whitespace', async () => {
      const result = await processLegalMarkdown('   \n\n  \t  \n  ');

      expect(result.content.trim()).toBe('');
      expect(result.metadata).toHaveProperty("_cross_references");
      expect(result.metadata).toHaveProperty("_field_mappings");
    });

    it('should handle files without YAML front matter', async () => {
      const content = `# Regular Document

Article 1. Header without YAML
ll. Subsection`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('# Regular Document');
      expect(result.content).toContain('Article 1. Header without YAML');
      expect(result.metadata).toHaveProperty("_cross_references");
      expect(result.metadata).toHaveProperty("_field_mappings");
    });
  });
});
