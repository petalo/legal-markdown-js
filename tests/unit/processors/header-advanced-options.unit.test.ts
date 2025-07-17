/**
 * @fileoverview Tests for advanced header processor options
 * 
 * This test suite covers advanced configuration options for header processing:
 * - --no-reset option to maintain numbering continuity across sections
 * - --no-indent option to disable automatic indentation
 * - Combined option scenarios and metadata vs option precedence
 * - Edge cases with custom formats and mixed header styles
 */

import { processHeaders } from '../../../src/core/processors/header-processor';

describe('Header Processor Advanced Options', () => {
  describe('--no-reset option', () => {
    it('should not reset numbering when noReset is true', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true });

      expect(result).toContain('Article 1. First level');
      expect(result).toContain('Section 1. Second level');
      expect(result).toContain('Article 2. Another first level');
      expect(result).toContain('Section 2. Another second level');
    });

    it('should reset numbering when noReset is false (default)', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: false });

      expect(result).toContain('Article 1. First level');
      expect(result).toContain('Section 1. Second level');
      expect(result).toContain('Article 2. Another first level');
      expect(result).toContain('Section 1. Another second level');
    });

    it('should respect no-reset from metadata', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = { 'no-reset': true };
      const result = processHeaders(content, metadata);

      expect(result).toContain('Article 1. First level');
      expect(result).toContain('Section 1. Second level');
      expect(result).toContain('Article 2. Another first level');
      expect(result).toContain('Section 2. Another second level');
    });

    it('should work with deeper nesting', () => {
      const content = `l. First level
ll. Second level
lll. Third level
l. Another first level
ll. Another second level
lll. Another third level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true });

      expect(result).toContain('Article 1. First level');
      expect(result).toContain('Section 1. Second level');
      expect(result).toContain('(1) Third level');
      expect(result).toContain('Article 2. Another first level');
      expect(result).toContain('Section 2. Another second level');
      expect(result).toContain('(2) Another third level');
    });
  });

  describe('--no-indent option', () => {
    it('should not indent headers when noIndent is true', () => {
      const content = `l. First level
ll. Second level
lll. Third level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noIndent: true });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('Section 1. Second level');
      expect(lines[2]).toBe('(1) Third level');
    });

    it('should indent headers when noIndent is false (default)', () => {
      const content = `l. First level
ll. Second level
lll. Third level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noIndent: false });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('   Section 1. Second level');
      expect(lines[2]).toBe('      (1) Third level');
    });

    it('should respect no-indent from metadata', () => {
      const content = `l. First level
ll. Second level
lll. Third level`;

      const metadata = { 'no-indent': true };
      const result = processHeaders(content, metadata);

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('Section 1. Second level');
      expect(lines[2]).toBe('(1) Third level');
    });

    it('should work with custom indentation levels', () => {
      const content = `l. First level
ll. Second level
lll. Third level`;

      const metadata = { 'level-indent': '2.0' };
      const result = processHeaders(content, metadata, { noIndent: false });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('    Section 1. Second level');
      expect(lines[2]).toBe('        (1) Third level');
    });
  });

  describe('combined options', () => {
    it('should work with both noReset and noIndent enabled', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('Section 1. Second level');
      expect(lines[2]).toBe('Article 2. Another first level');
      expect(lines[3]).toBe('Section 2. Another second level');
    });

    it('should prioritize processing options over metadata', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = { 'no-reset': false, 'no-indent': false };
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. First level');
      expect(lines[1]).toBe('Section 1. Second level');
      expect(lines[2]).toBe('Article 2. Another first level');
      expect(lines[3]).toBe('Section 2. Another second level');
    });

    it('should work with custom formats and options', () => {
      const content = `l. First level
ll. Second level
l. Another first level
ll. Another second level`;

      const metadata = {
        'level-one': 'Chapter %n:',
        'level-two': 'Section %n.%s',
      };
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Chapter 1: First level');
      expect(lines[1]).toBe('Section 1.1 Second level');
      expect(lines[2]).toBe('Chapter 2: Another first level');
      expect(lines[3]).toBe('Section 2.2 Another second level');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const content = '';
      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });
      expect(result).toBe('');
    });

    it('should handle content with no headers', () => {
      const content = 'Just some regular text without headers.';
      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });
      expect(result).toBe('Just some regular text without headers.');
    });

    it('should handle mixed header styles', () => {
      const content = `l. Traditional first level
l2. Alternative second level
ll. Traditional second level`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Article 1. Traditional first level');
      expect(lines[1]).toBe('Section 1. Alternative second level');
      expect(lines[2]).toBe('Section 2. Traditional second level');
    });

    it('should handle level 5 headers with options', () => {
      const content = `l. Level 1
ll. Level 2
lll. Level 3
l4. Level 4
l5. Level 5
l5. Another level 5`;

      const metadata = {};
      const result = processHeaders(content, metadata, { noReset: true, noIndent: true });

      expect(result).toContain('Article 1. Level 1');
      expect(result).toContain('Section 1. Level 2');
      expect(result).toContain('(1) Level 3');
      expect(result).toContain('(1a) Level 4');
      expect(result).toContain('(1ai) Level 5');
      expect(result).toContain('(1aii) Another level 5');
    });
  });
});