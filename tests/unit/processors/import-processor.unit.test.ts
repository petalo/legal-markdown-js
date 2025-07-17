/**
 * @fileoverview Tests for the import processor and partial file inclusion
 * 
 * This test suite covers the @import directive system:
 * - Basic @import [filename] syntax with relative and absolute paths
 * - Multiple imports, nested imports, and import ordering
 * - File system integration and path resolution
 * - Import validation and error handling for missing files
 * - Edge cases like empty imports and permission errors
 */

import { processPartialImports, validateImports } from '../../../src/core/processors/import-processor';
import * as fs from 'fs';
import * as path from 'path';

describe('Partial Imports', () => {
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

  describe('Parse @import [filename] syntax', () => {
    it('should parse basic import syntax', () => {
      const importedContent = 'This is imported content.';
      const importPath = path.join(testDir, 'imported.md');
      fs.writeFileSync(importPath, importedContent);

      const content = `Main document content.
@import imported.md
More content after import.`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Main document content.');
      expect(result.content).toContain('This is imported content.');
      expect(result.content).toContain('More content after import.');
      expect(result.importedFiles).toContain(importPath);
    });

    it('should handle imports with quotes', () => {
      const importedContent = 'Quoted import content.';
      const importPath = path.join(testDir, 'quoted-import.md');
      fs.writeFileSync(importPath, importedContent);

      const content = `@import "quoted-import.md"
@import 'single-quoted-import.md'`;

      fs.writeFileSync(path.join(testDir, 'single-quoted-import.md'), 'Single quoted content.');

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Quoted import content.');
      expect(result.content).toContain('Single quoted content.');
      expect(result.importedFiles).toHaveLength(2);
    });

    it('should handle imports with extra whitespace', () => {
      const importedContent = 'Whitespace test content.';
      const importPath = path.join(testDir, 'whitespace.md');
      fs.writeFileSync(importPath, importedContent);

      const content = `@import    whitespace.md   
@import	"whitespace.md"	`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Whitespace test content.');
      expect(result.importedFiles).toContain(importPath);
    });

    it('should handle multiple imports in same document', () => {
      const import1Content = 'First import content.';
      const import2Content = 'Second import content.';
      const import1Path = path.join(testDir, 'import1.md');
      const import2Path = path.join(testDir, 'import2.md');
      
      fs.writeFileSync(import1Path, import1Content);
      fs.writeFileSync(import2Path, import2Content);

      const content = `Introduction
@import import1.md
Middle section
@import import2.md
Conclusion`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Introduction');
      expect(result.content).toContain('First import content.');
      expect(result.content).toContain('Middle section');
      expect(result.content).toContain('Second import content.');
      expect(result.content).toContain('Conclusion');
      expect(result.importedFiles).toContain(import1Path);
      expect(result.importedFiles).toContain(import2Path);
    });
  });

  describe('Support relative path imports', () => {
    it('should resolve relative paths correctly', () => {
      const subDir = path.join(testDir, 'subdirectory');
      fs.mkdirSync(subDir, { recursive: true });
      
      const importedContent = 'Relative import content.';
      const importPath = path.join(subDir, 'relative.md');
      fs.writeFileSync(importPath, importedContent);

      const content = `@import subdirectory/relative.md`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Relative import content.');
      expect(result.importedFiles).toContain(importPath);
    });

    it('should handle parent directory imports', () => {
      const subDir = path.join(testDir, 'sub');
      fs.mkdirSync(subDir, { recursive: true });
      
      const parentContent = 'Parent directory content.';
      const parentPath = path.join(testDir, 'parent.md');
      fs.writeFileSync(parentPath, parentContent);

      const content = `@import ../parent.md`;

      const result = processPartialImports(content, subDir);
      
      expect(result.content).toContain('Parent directory content.');
      expect(result.importedFiles).toContain(parentPath);
    });

    it('should handle nested relative paths', () => {
      const deepDir = path.join(testDir, 'level1', 'level2');
      fs.mkdirSync(deepDir, { recursive: true });
      
      const nestedContent = 'Deeply nested content.';
      const nestedPath = path.join(deepDir, 'nested.md');
      fs.writeFileSync(nestedPath, nestedContent);

      const content = `@import level1/level2/nested.md`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Deeply nested content.');
      expect(result.importedFiles).toContain(nestedPath);
    });

    it('should handle current directory references', () => {
      const currentContent = 'Current directory content.';
      const currentPath = path.join(testDir, 'current.md');
      fs.writeFileSync(currentPath, currentContent);

      const content = `@import ./current.md`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Current directory content.');
      expect(result.importedFiles).toContain(currentPath);
    });
  });

  describe('Support absolute path imports', () => {
    it('should handle absolute paths', () => {
      const absoluteContent = 'Absolute path content.';
      const absolutePath = path.join(testDir, 'absolute.md');
      fs.writeFileSync(absolutePath, absoluteContent);

      const content = `@import ${absolutePath}`;

      const result = processPartialImports(content);
      
      expect(result.content).toContain('Absolute path content.');
      expect(result.importedFiles).toContain(absolutePath);
    });

    it('should handle mixed absolute and relative paths', () => {
      const relativeContent = 'Relative content.';
      const absoluteContent = 'Absolute content.';
      
      const relativePath = path.join(testDir, 'relative.md');
      const absolutePath = path.join(testDir, 'absolute.md');
      
      fs.writeFileSync(relativePath, relativeContent);
      fs.writeFileSync(absolutePath, absoluteContent);

      const content = `@import relative.md
@import ${absolutePath}`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Relative content.');
      expect(result.content).toContain('Absolute content.');
      expect(result.importedFiles).toContain(relativePath);
      expect(result.importedFiles).toContain(absolutePath);
    });
  });

  describe('Handle multiple imports in same document', () => {
    it('should process imports in order', () => {
      const content1 = 'First imported section.';
      const content2 = 'Second imported section.';
      const content3 = 'Third imported section.';
      
      fs.writeFileSync(path.join(testDir, 'first.md'), content1);
      fs.writeFileSync(path.join(testDir, 'second.md'), content2);
      fs.writeFileSync(path.join(testDir, 'third.md'), content3);

      const content = `Document start
@import first.md
Middle content
@import second.md
More middle content
@import third.md
Document end`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toMatch(/Document start[\s\S]*First imported section[\s\S]*Middle content[\s\S]*Second imported section[\s\S]*More middle content[\s\S]*Third imported section[\s\S]*Document end/);
      expect(result.importedFiles).toHaveLength(3);
    });

    /**
     * Tests recursive import processing - imports within imported files
     * Important for modular document structures
     */
    it('should handle nested imports', () => {
      const nestedContent = 'Nested import content.';
      const middleContent = `Middle content with nested import:
@import nested.md`;
      
      fs.writeFileSync(path.join(testDir, 'nested.md'), nestedContent);
      fs.writeFileSync(path.join(testDir, 'middle.md'), middleContent);

      const content = `Main document
@import middle.md
End of main document`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Main document');
      expect(result.content).toContain('Middle content with nested import:');
      expect(result.content).toContain('Nested import content.');
      expect(result.content).toContain('End of main document');
      expect(result.importedFiles).toHaveLength(2);
    });

    it('should handle imports with headers and processing', () => {
      const importWithHeaders = `l. Imported Header
ll. Imported Subheader

Content with |reference|.`;
      
      fs.writeFileSync(path.join(testDir, 'with-headers.md'), importWithHeaders);

      const content = `---
reference: "test value"
---

l. Main Header
@import with-headers.md
l. Another Main Header`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('l. Imported Header');
      expect(result.content).toContain('ll. Imported Subheader');
      expect(result.content).toContain('Content with |reference|.');
      expect(result.importedFiles).toHaveLength(1);
    });
  });

  describe('Import validation', () => {
    it('should validate existing imports', () => {
      fs.writeFileSync(path.join(testDir, 'existing.md'), 'Existing content');

      const content = `@import existing.md`;
      const errors = validateImports(content, testDir);
      
      expect(errors).toEqual([]);
    });

    it('should detect missing import files', () => {
      const content = `@import nonexistent.md`;
      const errors = validateImports(content, testDir);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Import file not found');
      expect(errors[0]).toContain('nonexistent.md');
    });

    it('should validate multiple imports', () => {
      fs.writeFileSync(path.join(testDir, 'exists.md'), 'Content');

      const content = `@import exists.md
@import missing1.md
@import missing2.md`;
      
      const errors = validateImports(content, testDir);
      
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('missing1.md');
      expect(errors[1]).toContain('missing2.md');
    });

    it('should handle absolute path validation', () => {
      const absolutePath = path.join(testDir, 'absolute-test.md');
      fs.writeFileSync(absolutePath, 'Content');

      const content = `@import ${absolutePath}
@import /nonexistent/path.md`;
      
      const errors = validateImports(content);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('/nonexistent/path.md');
    });
  });

  describe('Error handling', () => {
    it('should handle missing import files gracefully', () => {
      const content = `Valid content before
@import nonexistent.md
Valid content after`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Valid content before');
      expect(result.content).toContain('<!-- Error importing nonexistent.md -->');
      expect(result.content).toContain('Valid content after');
      expect(result.importedFiles).toEqual([]);
    });

    it('should handle permission errors gracefully', () => {
      // Create a file and make it unreadable (if platform supports it)
      const restrictedPath = path.join(testDir, 'restricted.md');
      fs.writeFileSync(restrictedPath, 'Restricted content');
      
      try {
        fs.chmodSync(restrictedPath, 0o000);
      } catch (e) {
        // Skip test if chmod is not supported (Windows)
        return;
      }

      const content = `@import restricted.md`;
      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('<!-- Error importing restricted.md -->');
      
      // Restore permissions for cleanup
      fs.chmodSync(restrictedPath, 0o644);
    });

    it('should handle empty import files', () => {
      fs.writeFileSync(path.join(testDir, 'empty.md'), '');

      const content = `Before import
@import empty.md
After import`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toContain('Before import');
      expect(result.content).toContain('After import');
      expect(result.importedFiles).toHaveLength(1);
    });

    it('should handle content without imports', () => {
      const content = `This is regular content
without any imports
at all.`;

      const result = processPartialImports(content, testDir);
      
      expect(result.content).toBe(content);
      expect(result.importedFiles).toEqual([]);
    });

    it('should handle empty content', () => {
      const result = processPartialImports('', testDir);
      
      expect(result.content).toBe('');
      expect(result.importedFiles).toEqual([]);
    });
  });
});