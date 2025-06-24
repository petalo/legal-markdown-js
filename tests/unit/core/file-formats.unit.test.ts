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
    it('should support basic Markdown input files', () => {
      const content = `---
title: Test Document
---

# Test Header

This is a test document.

l. First Level
ll. Second Level`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('# Test Header');
      expect(result.content).toContain('This is a test document.');
      expect(result.content).toContain('Article 1. First Level');
      expect(result.metadata?.title).toBe('Test Document');
    });

    it('should handle Markdown with complex formatting', () => {
      const content = `---
title: Complex Document
---

# Main Title

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`javascript
console.log('code block');
\`\`\`

l. Legal Header`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('**Bold text**');
      expect(result.content).toContain('*italic text*');
      expect(result.content).toContain('- List item 1');
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('Article 1. Legal Header');
    });

    it('should preserve Markdown links and images', () => {
      const content = `---
title: Test Links
---

[Link text](https://example.com)

![Alt text](image.png)

l. Header with [inline link](https://example.com)`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('[Link text](https://example.com)');
      expect(result.content).toContain('![Alt text](image.png)');
      expect(result.content).toContain('Article 1. Header with [inline link](https://example.com)');
    });
  });

  describe('ASCII (.txt) input files', () => {
    it('should support basic ASCII text input files', () => {
      const content = `---
title: ASCII Document
author: Test Author
---

Simple ASCII text document.

l. First section
ll. Subsection

Plain text content without markdown formatting.`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('Simple ASCII text document.');
      expect(result.content).toContain('Article 1. First section');
      expect(result.content).toContain('Section 1. Subsection');
      expect(result.content).toContain('Plain text content');
      expect(result.metadata?.title).toBe('ASCII Document');
      expect(result.metadata?.author).toBe('Test Author');
    });

    it('should handle ASCII with special characters', () => {
      const content = `---
title: Special Characters
---

Text with special characters: àáâãäåæçèéêë

l. Section with special chars: ñóôõöø
ll. Subsection with symbols: @#$%^&*()`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('àáâãäåæçèéêë');
      expect(result.content).toContain('Article 1. Section with special chars: ñóôõöø');
      expect(result.content).toContain('Section 1. Subsection with symbols: @#$%^&*()');
    });

    it('should handle ASCII with line breaks and spacing', () => {
      const content = `---
title: Spacing Test
---

First paragraph.

Second paragraph with multiple lines.

l. Section one
   
ll. Section two with spacing

lll. Section three`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('First paragraph.');
      expect(result.content).toContain('Second paragraph with multiple lines.');
      expect(result.content).toContain('Article 1. Section one');
      expect(result.content).toContain('Section 1. Section two with spacing');
      expect(result.content).toContain('(1) Section three');
    });
  });

  describe('File reading integration', () => {
    it('should handle .md files from filesystem', () => {
      const mdContent = `---
title: File System Test
---

# Markdown Document

l. Header from file`;

      const mdPath = path.join(testDir, 'test.md');
      fs.writeFileSync(mdPath, mdContent);
      
      const fileContent = fs.readFileSync(mdPath, 'utf8');
      const result = processLegalMarkdown(fileContent);
      
      expect(result.content).toContain('# Markdown Document');
      expect(result.content).toContain('Article 1. Header from file');
      expect(result.metadata?.title).toBe('File System Test');
    });

    it('should handle .txt files from filesystem', () => {
      const txtContent = `---
title: Text File Test
---

Plain text document

l. Text file header`;

      const txtPath = path.join(testDir, 'test.txt');
      fs.writeFileSync(txtPath, txtContent);
      
      const fileContent = fs.readFileSync(txtPath, 'utf8');
      const result = processLegalMarkdown(fileContent);
      
      expect(result.content).toContain('Plain text document');
      expect(result.content).toContain('Article 1. Text file header');
      expect(result.metadata?.title).toBe('Text File Test');
    });
  });

  describe('Error handling', () => {
    it('should handle empty files gracefully', () => {
      const result = processLegalMarkdown('');
      
      expect(result.content).toBe('');
      expect(result.metadata).toEqual({});
    });

    it('should handle files with only whitespace', () => {
      const result = processLegalMarkdown('   \n\n  \t  \n  ');
      
      expect(result.content.trim()).toBe('');
      expect(result.metadata).toEqual({});
    });

    it('should handle files without YAML front matter', () => {
      const content = `# Regular Document

l. Header without YAML
ll. Subsection`;

      const result = processLegalMarkdown(content);
      
      expect(result.content).toContain('# Regular Document');
      expect(result.content).toContain('Article 1. Header without YAML');
      expect(result.metadata).toEqual({});
    });
  });
});