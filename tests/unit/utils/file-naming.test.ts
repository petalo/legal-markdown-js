/**
 * @fileoverview Unit tests for file naming utilities
 */

import { 
  addSuffixToFilename, 
  generateArchivePaths, 
  generateHighlightPath,
  areContentsIdentical,
  FILE_SUFFIXES 
} from '../../../src/utils/file-naming';

describe('File Naming Utilities', () => {
  describe('addSuffixToFilename', () => {
    it('should add suffix to simple filename', () => {
      expect(addSuffixToFilename('document.md', 'ORIGINAL'))
        .toBe('document.ORIGINAL.md');
    });

    it('should add suffix to filename with path', () => {
      expect(addSuffixToFilename('/path/to/document.pdf', 'HIGHLIGHT'))
        .toBe('/path/to/document.HIGHLIGHT.pdf');
    });

    it('should handle relative paths', () => {
      expect(addSuffixToFilename('docs/contract.md', 'PROCESSED'))
        .toBe('docs/contract.PROCESSED.md');
    });

    it('should handle files without extension', () => {
      expect(addSuffixToFilename('README', 'ORIGINAL'))
        .toBe('README.ORIGINAL');
    });

    it('should handle current directory path', () => {
      expect(addSuffixToFilename('./document.md', 'HIGHLIGHT'))
        .toBe('./document.HIGHLIGHT.md');
    });
  });

  describe('generateArchivePaths', () => {
    it('should generate both original and processed paths', () => {
      const result = generateArchivePaths('/archive/document.md');
      
      expect(result.original).toBe('/archive/document.ORIGINAL.md');
      expect(result.processed).toBe('/archive/document.PROCESSED.md');
    });

    it('should work with different file extensions', () => {
      const result = generateArchivePaths('contract.pdf');
      
      expect(result.original).toBe('contract.ORIGINAL.pdf');
      expect(result.processed).toBe('contract.PROCESSED.pdf');
    });
  });

  describe('generateHighlightPath', () => {
    it('should generate highlight path for PDF', () => {
      expect(generateHighlightPath('document.pdf'))
        .toBe('document.HIGHLIGHT.pdf');
    });

    it('should generate highlight path for HTML', () => {
      expect(generateHighlightPath('/path/contract.html'))
        .toBe('/path/contract.HIGHLIGHT.html');
    });
  });

  describe('areContentsIdentical', () => {
    it('should return true for identical content', () => {
      const content1 = 'Hello World\nThis is a test';
      const content2 = 'Hello World\nThis is a test';
      
      expect(areContentsIdentical(content1, content2)).toBe(true);
    });

    it('should return false for different content', () => {
      const content1 = 'Hello World';
      const content2 = 'Hello Universe';
      
      expect(areContentsIdentical(content1, content2)).toBe(false);
    });

    it('should normalize line endings', () => {
      const content1 = 'Hello World\nTest';
      const content2 = 'Hello World\r\nTest';
      
      expect(areContentsIdentical(content1, content2)).toBe(true);
    });

    it('should ignore trailing whitespace', () => {
      const content1 = 'Hello World  \n  ';
      const content2 = 'Hello World';
      
      expect(areContentsIdentical(content1, content2)).toBe(true);
    });

    it('should return true for empty content', () => {
      expect(areContentsIdentical('', '')).toBe(true);
      expect(areContentsIdentical('   ', '\t\n')).toBe(true);
    });
  });

  describe('FILE_SUFFIXES', () => {
    it('should have expected suffix constants', () => {
      expect(FILE_SUFFIXES.HIGHLIGHT).toBe('HIGHLIGHT');
      expect(FILE_SUFFIXES.ORIGINAL).toBe('ORIGINAL');
      expect(FILE_SUFFIXES.PROCESSED).toBe('PROCESSED');
    });
  });
});