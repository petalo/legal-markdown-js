/**
 * @fileoverview Unit tests for mixed headers (regular + legal) in playground
 * 
 * Tests that the remark processor correctly handles both regular markdown headers
 * and legal headers (l., ll., etc.) without interfering with each other.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../../src/extensions/remark/legal-markdown-processor';

describe('Mixed Headers Processing', () => {
  it('should only process legal headers, not regular markdown headers', async () => {
    const input = `# Regular Header

l. Legal Header

## Another Regular Header

ll. Legal Subsection`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      debug: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.'
      }
    });

    // Regular headers should remain unchanged
    expect(result.content).toContain('# Regular Header');
    expect(result.content).toContain('## Another Regular Header');
    
    // Legal headers should be processed
    expect(result.content).toContain('# Article 1. Legal Header');
    expect(result.content).toContain('## Section 1. Legal Subsection');
  });

  it('should handle custom header formats only for legal headers', async () => {
    const input = `---
level-one: 'Chapter %n:'
level-two: 'Section %l1.%l2'
---

# Normal Markdown Title

l. First Chapter

## Normal Subsection

ll. Chapter Subsection`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      debug: false,
      noIndent: true
    });

    // Regular headers unchanged
    expect(result.content).toContain('# Normal Markdown Title');
    expect(result.content).toContain('## Normal Subsection');
    
    // Legal headers with custom format
    expect(result.content).toContain('# Chapter 1: First Chapter');
    expect(result.content).toContain('## Section 1.1 Chapter Subsection');
  });

  it('should maintain correct numbering across mixed headers', async () => {
    const input = `l. First Legal Header

# Regular Header (should not affect numbering)

l. Second Legal Header

## Regular Subsection

ll. Legal Subsection of Second

### Regular Sub-subsection

lll. Legal Sub-subsection`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: false,
      debug: false,
      noIndent: true,
      additionalMetadata: {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.',
        'level-3': '(%n)'
      }
    });

    // Check numbering is correct despite regular headers
    expect(result.content).toContain('# Article 1. First Legal Header');
    expect(result.content).toContain('# Article 2. Second Legal Header');
    expect(result.content).toContain('## Section 1. Legal Subsection of Second');
    expect(result.content).toContain('### (1) Legal Sub-subsection');
    
    // Regular headers unchanged
    expect(result.content).toContain('# Regular Header');
    expect(result.content).toContain('## Regular Subsection');
    expect(result.content).toContain('### Regular Sub-subsection');
  });

  it('should handle headers with template fields correctly', async () => {
    const input = `# {{title}}

l. {{section_title}}`;

    const result = await processLegalMarkdownWithRemark(input, {
      enableFieldTracking: true,
      debug: false,
      additionalMetadata: {
        title: 'Document Title',
        section_title: 'Legal Section',
        'level-1': 'Article %n.'
      }
    });

    // Regular header with template field (not numbered)
    expect(result.content).toContain('# ');
    expect(result.content).toContain('Document Title');
    expect(result.content).not.toContain('Article 1. Document Title');
    
    // Legal header with template field (numbered)
    expect(result.content).toContain('# Article 1.');
    expect(result.content).toContain('Legal Section');
  });
});