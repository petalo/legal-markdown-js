/**
 * @fileoverview Unit Tests for Header Leading Zero Variables
 *
 * Tests for special variables like %02n, %03n, %02s that format numbers with leading zeros
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkHeaders, RemarkHeadersOptions } from '../../../../src/plugins/remark/headers';
import { remarkLegalHeadersParser } from '../../../../src/plugins/remark/legal-headers-parser';

/**
 * Helper function to process markdown with headers plugin
 */
async function processMarkdownWithHeaders(
  markdown: string,
  options: RemarkHeadersOptions
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkLegalHeadersParser)
    .use(remarkHeaders, options)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      incrementListMarker: false,
    });

  const result = await processor.process(markdown);
  return result.toString();
}

describe('Header Leading Zero Variables', () => {
  describe('Current Level Leading Zeros (%0Xn)', () => {
    it('should handle %02n (2-digit leading zeros)', async () => {
      const input = `l. First Header
ll. Second Header
lll. Third Header`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%02n.',
          'level-2': '%02n.',
          'level-3': '%02n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 01. First Header');
      expect(result).toContain('## 01. Second Header');
      expect(result).toContain('### 01. Third Header');
    });

    it('should handle %03n (3-digit leading zeros)', async () => {
      const input = `l. Header One
ll. Header Two`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%03n.',
          'level-2': '%03n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 001. Header One');
      expect(result).toContain('## 001. Header Two');
    });

    it('should handle larger numbers with leading zeros', async () => {
      const input = `l. One
l. Two
l. Three
l. Four
l. Five
l. Six
l. Seven
l. Eight
l. Nine
l. Ten
l. Eleven`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%02n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 01. One');
      expect(result).toContain('# 10. Ten');
      expect(result).toContain('# 11. Eleven');
    });
  });

  describe('Level Reference Leading Zeros (%0Xl1, %0Xl2, etc.)', () => {
    it('should handle %02l1 (2-digit leading zeros for level 1)', async () => {
      const input = `l. First Level
ll. Second Level`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %02l1.%n.'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Article 1. First Level');
      expect(result).toContain('## Section 01.1. Second Level');
    });

    it('should handle academic format with leading zeros', async () => {
      const input = `l. Introduction
ll. Background
lll. Previous Work
ll. Methodology`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%02n.',
          'level-2': '%02l1.%02l2',
          'level-3': '%02l1.%02l2.%02l3'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 01. Introduction');
      expect(result).toContain('## 01.01 Background');
      expect(result).toContain('### 01.01.01 Previous Work');
      expect(result).toContain('## 01.02 Methodology');
    });
  });

  describe('Direct Level Reference Leading Zeros (%0Xl1, %0Xl2, etc.)', () => {
    it('should handle %02l1, %02l2 (leading zeros for direct level references)', async () => {
      const input = `l. First Level
ll. Second Level
lll. Third Level`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%02l1.',
          'level-2': '%02l1.%02l2',
          'level-3': '%02l1.%02l2.%02l3'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 01. First Level');
      expect(result).toContain('## 01.01 Second Level');
      expect(result).toContain('### 01.01.01 Third Level');
    });

    it('should handle mixed leading zero formats', async () => {
      const input = `l. Chapter One
ll. Section One
lll. Subsection One
llll. Item One`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Chapter %03l1',
          'level-2': 'Section %02l1.%02l2',
          'level-3': 'Subsection (%02n)',
          'level-4': 'Item %02l1.%02l2.%02l3.%n'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Chapter 001 Chapter One');
      expect(result).toContain('## Section 01.01 Section One');
      expect(result).toContain('### Subsection (01) Subsection One');
      expect(result).toContain('#### Item 01.01.01.1 Item One');
    });
  });

  describe('Complex Leading Zero Scenarios', () => {
    it('should handle different digit counts in same format', async () => {
      const input = `l. First
ll. Second`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': '%03n.',
          'level-2': '%02n.%02l1'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# 001. First');
      expect(result).toContain('## 01.01 Second');
    });

    it('should handle leading zeros with alphabetic and roman variables', async () => {
      const input = `l. Part One
ll. Chapter One
lll. Section One`;
      
      const options: RemarkHeadersOptions = {
        metadata: {
          'level-1': 'Part %R',
          'level-2': 'Chapter %02n (%A)',
          'level-3': 'Section %02l1.%02l2.%c'
        },
        noIndent: true
      };

      const result = await processMarkdownWithHeaders(input, options);
      
      expect(result).toContain('# Part I Part One');
      expect(result).toContain('## Chapter 01 (A) Chapter One');
      expect(result).toContain('### Section 01.01.a Section One');
    });
  });
});