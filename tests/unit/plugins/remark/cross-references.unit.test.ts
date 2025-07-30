/**
 * Unit tests for remark cross-references plugin
 *
 * These tests verify the functionality of the remark-based cross-reference
 * processing system, including header extraction, section numbering, and
 * reference resolution.
 *
 * @module
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkCrossReferences from '@plugins/remark/cross-references';
import { fieldTracker } from '@extensions/tracking/field-tracker';

describe('Remark Cross-References Plugin', () => {
  beforeEach(() => {
    // Clear field tracker before each test
    fieldTracker.clear();
  });

  describe('Header Extraction and Section Numbering', () => {
    it('should extract cross-reference definitions from headers', async () => {
      const content = `
# Introduction |intro|

This is the introduction section.

## Payment Terms |payment|

Payment is due within 30 days.

### Details |details|

Specific payment details.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check metadata was populated with cross-references
      expect(metadata['_cross_references']).toBeDefined();
      expect(metadata['_cross_references']).toHaveLength(3);
      
      const refs = metadata['_cross_references'];
      expect(refs[0]).toEqual({
        key: 'intro',
        sectionNumber: 'Article 1.',
        sectionText: 'Article 1. Introduction',
      });
      
      expect(refs[1]).toEqual({
        key: 'payment',
        sectionNumber: 'Section 1.',
        sectionText: 'Section 1. Payment Terms',
      });
      
      expect(refs[2]).toEqual({
        key: 'details',
        sectionNumber: '(1)',
        sectionText: '(1) Details',
      });
    });

    it('should use custom level formats from metadata', async () => {
      const content = `
# Contract Terms |terms|

## Payment Schedule |schedule|
`;

      const metadata: Record<string, any> = {
        'level-one': 'CONTRATO %n.',
        'level-two': 'Art. %n -',
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      const refs = metadata['_cross_references'];
      expect(refs[0]).toEqual({
        key: 'terms',
        sectionNumber: 'CONTRATO 1.',
        sectionText: 'CONTRATO 1. Contract Terms',
      });
      
      expect(refs[1]).toEqual({
        key: 'schedule',
        sectionNumber: 'Art. 1 -',
        sectionText: 'Art. 1 - Payment Schedule',
      });
    });

    it('should handle hierarchical section numbering correctly', async () => {
      const content = `
# First |first|

## Sub-first |sub1|

### Detail-first |detail1|

## Sub-second |sub2|

# Second |second|

## Sub-third |sub3|
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      const refs = metadata['_cross_references'];
      expect(refs).toHaveLength(6);
      
      // Check hierarchical numbering resets correctly
      expect(refs[0].sectionNumber).toBe('Article 1.');  // first
      expect(refs[1].sectionNumber).toBe('Section 1.');  // sub1
      expect(refs[2].sectionNumber).toBe('(1)');         // detail1
      expect(refs[3].sectionNumber).toBe('Section 2.');  // sub2
      expect(refs[4].sectionNumber).toBe('Article 2.');  // second
      expect(refs[5].sectionNumber).toBe('Section 1.');  // sub3 (reset)
    });
  });

  describe('Cross-Reference Resolution', () => {
    it('should replace cross-reference usage with section numbers', async () => {
      const content = `
# Payment Terms |payment|

Payment details are outlined here.

# General Provisions

As specified in |payment|, all payments must be made within 30 days.
The terms in |payment| are binding.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      const result = await processor.process(content);
      const processedContent = String(result);

      // Check that references were replaced
      expect(processedContent).toContain('As specified in Article 1., all payments');
      expect(processedContent).toContain('The terms in Article 1. are binding');
      expect(processedContent).not.toContain('|payment|');
    });

    it('should track cross-references as fields for highlighting', async () => {
      const content = `
# Definitions |defs|

# Usage

See |defs| for more information.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      // Check that field was tracked
      const fields = fieldTracker.getFields();
      expect(fields.has('crossref.defs')).toBe(true);
      
      const field = fields.get('crossref.defs');
      expect(field?.value).toBe('Article 1.');
      expect(field?.hasLogic).toBe(true);
      expect(field?.originalValue).toBe('|defs|');
    });

    it('should fall back to metadata values for unresolved references', async () => {
      const content = `
# Contract |contract|

This contract is between |client_name| and |provider_name|.
Reference to |contract| applies throughout.
`;

      const metadata: Record<string, any> = {
        client_name: 'Acme Corp',
        provider_name: 'Service Ltd',
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      const result = await processor.process(content);
      const processedContent = String(result);

      // Check mixed resolution
      expect(processedContent).toContain('between Acme Corp and Service Ltd');
      expect(processedContent).toContain('Reference to Article 1. applies');
      
      // Check field tracking for both types
      const fields = fieldTracker.getFields();
      expect(fields.has('crossref.contract')).toBe(true);
      expect(fields.has('crossref.client_name')).toBe(true);
      expect(fields.has('crossref.provider_name')).toBe(true);
      
      expect(fields.get('crossref.contract')?.hasLogic).toBe(true);
      expect(fields.get('crossref.client_name')?.hasLogic).toBe(false);
    });

    it('should preserve unresolved references unchanged', async () => {
      const content = `
# Known Section |known|

Reference to |known| and |unknown| references.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      const result = await processor.process(content);
      const processedContent = String(result);

      expect(processedContent).toContain('Reference to Article 1. and |unknown| references');
      
      // Check field tracking for unresolved reference
      const fields = fieldTracker.getFields();
      expect(fields.has('crossref.unknown')).toBe(true);
      expect(fields.get('crossref.unknown')?.value).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should not replace references in defining headers', async () => {
      const content = `
# Section A |section_a|

# Section B references |section_a| |section_b|

Content referencing |section_a| and |section_b|.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      const result = await processor.process(content);
      const processedContent = String(result);

      // Header defining section_b should preserve the reference to section_a
      // but remove the definition section_b (markdown may escape underscores)
      expect(
        processedContent.includes('Section B references |section_a|') ||
        processedContent.includes('Section B references |section\\_a|')
      ).toBeTruthy();
      
      // Content should resolve both references
      expect(processedContent).toContain('Content referencing Article 1. and Article 2.');
    });

    it('should handle empty metadata gracefully', async () => {
      const content = `
# Simple Header |simple|

Reference to |simple|.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      const result = await processor.process(content);

      expect(metadata['_cross_references']).toBeDefined();
      expect(metadata['_cross_references']).toHaveLength(1);
      expect(String(result)).toContain('Reference to Article 1.');
    });

    it('should handle no cross-references gracefully', async () => {
      const content = `
# Regular Header

No cross-references here.
`;

      const metadata: Record<string, any> = {};
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      expect(metadata['_cross_references']).toBeDefined();
      expect(metadata['_cross_references']).toHaveLength(0);
    });
  });

  describe('Advanced Formatting', () => {
    it('should handle Roman numerals and alphabetic formats', async () => {
      const content = `
# Level 1 |l1|

## Level 2 |l2|

### Level 3 |l3|

#### Level 4 |l4|

##### Level 5 |l5|

###### Level 6 |l6|
`;

      const metadata: Record<string, any> = {
        'level-four': '(%r)',    // Roman numerals (lowercase)
        'level-five': '(%R%c)',  // Roman + alphabetic
        'level-six': 'Annex %R', // Roman (uppercase)
      };
      
      const processor = unified()
        .use(remarkParse)
        .use(remarkCrossReferences, { metadata })
        .use(remarkStringify);

      await processor.process(content);

      const refs = metadata['_cross_references'];
      expect(refs[3].sectionNumber).toBe('(i)');      // level 4 roman
      expect(refs[4].sectionNumber).toBe('(Ia)');     // level 5 roman + alpha
      expect(refs[5].sectionNumber).toBe('Annex I');  // level 6 roman uppercase
    });
  });
});