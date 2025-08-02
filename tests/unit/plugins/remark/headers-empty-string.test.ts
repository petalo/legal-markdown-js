/**
 * @fileoverview Unit Tests for Headers Empty String Handling
 *
 * Tests for proper handling of empty string values in header level definitions.
 * Empty strings should be treated as valid formats, not as undefined.
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

describe('Headers Empty String Handling', () => {
  it('should treat empty string as valid format, not undefined', async () => {
    const input = `l. First Level
ll. Second Level
lll. Third Level`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-1': 'Article %n.',
        'level-2': '',  // Empty string - should be treated as valid
        'level-3': 'Section %n.'
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    expect(result).toContain('# Article 1. First Level');
    // Should NOT contain undefined-level-2, should just have empty prefix
    expect(result).not.toContain('{{undefined-level-2}}');
    expect(result).toContain('## &#x20;Second Level'); // Empty string becomes encoded space
    expect(result).toContain('### Section 1. Third Level');
  });

  it('should distinguish between undefined and empty string', async () => {
    const input = `l. One
ll. Two
lll. Three
llll. Four`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-1': 'Chapter %n:',
        'level-2': '',      // Empty string
        // level-3 not defined (undefined)
        'level-4': '   '    // Whitespace only
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    expect(result).toContain('# Chapter 1: One');
    expect(result).toContain('## &#x20;Two');  // Empty string prefix becomes encoded space
    expect(result).not.toContain('## {{undefined-level-2}}');
    expect(result).toContain('### {{undefined-level-3}} Three');  // Undefined
    expect(result).toContain('####     Four');  // Whitespace preserved
  });

  it('should handle empty string with numbering variables', async () => {
    const input = `l. Main
ll. Sub One
ll. Sub Two`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-1': 'Part %n:',
        'level-2': '%n. '  // Just the number and dot
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    expect(result).toContain('# Part 1: Main');
    expect(result).toContain('## 1.  Sub One');  // Note the extra space after dot
    expect(result).toContain('## 2.  Sub Two');
  });

  it('should handle all variations of empty values', async () => {
    const input = `l. Test One
ll. Test Two
lll. Test Three
llll. Test Four
lllll. Test Five`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-1': '',         // Empty string
        'level-2': null,       // Explicit null
        'level-3': undefined,  // Explicit undefined
        // level-4 not present (implicit undefined)
        'level-5': '(%n)'      // Normal format
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    // Empty string - encoded space prefix
    expect(result).toContain('# &#x20;Test One');
    expect(result).not.toContain('# {{undefined-level-1}}');
    
    // Null - undefined template
    expect(result).toContain('## {{undefined-level-2}} Test Two');
    
    // Explicit undefined - undefined template  
    expect(result).toContain('### {{undefined-level-3}} Test Three');
    
    // Not present - undefined template
    expect(result).toContain('#### {{undefined-level-4}} Test Four');
    
    // Normal format
    expect(result).toContain('##### (1) Test Five');
  });

  it('should work with alternative key formats', async () => {
    const input = `l. Header One
ll. Header Two`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-one': '',      // Empty string with dash format
        'level_two': ''       // Empty string with underscore format
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    expect(result).toContain('# &#x20;Header One');
    expect(result).toContain('## &#x20;Header Two');
    expect(result).not.toContain('{{undefined-level-');
  });

  it('should handle complex empty string scenarios', async () => {
    const input = `l. Article
ll. Section
lll. Subsection with reference |key|`;

    const options: RemarkHeadersOptions = {
      metadata: {
        'level-1': '%n. ',
        'level-2': '',
        'level-3': '- '
      },
      noIndent: true
    };

    const result = await processMarkdownWithHeaders(input, options);
    
    expect(result).toContain('# 1.  Article');  // Note extra space after dot
    expect(result).toContain('## &#x20;Section');
    expect(result).toContain('### -  Subsection with reference');
  });
});