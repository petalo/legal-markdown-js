/**
 * @fileoverview Unit Tests for Enhanced Cross-References AST Plugin
 *
 * Tests for the new AST-based cross-reference system that uses custom reference nodes
 * for better performance and extensibility.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkCrossReferencesAST, CrossReferenceASTOptions } from '../../../../src/plugins/remark/cross-references-ast';
import { fieldTracker } from '../../../../src/extensions/tracking/field-tracker';

/**
 * Helper function to process markdown with enhanced cross-references plugin
 */
async function processMarkdownWithCrossRefsAST(
  markdown: string,
  options: CrossReferenceASTOptions
): Promise<{ result: string; metadata: Record<string, any> }> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkCrossReferencesAST, options)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      incrementListMarker: false,
    });

  const result = await processor.process(markdown);
  return { result: result.toString(), metadata: options.metadata };
}

describe('Enhanced Cross-References AST Plugin', () => {
  beforeEach(() => {
    // Clear field tracker before each test
    fieldTracker.clear();
  });

  describe('Basic Functionality', () => {
    it('should extract definitions and resolve references in single pass', async () => {
      const input = `# Contract Terms |terms|

This contract, as defined in |terms|, is binding.

## Payment Schedule |payment|

Payment terms in |payment| must be followed.
Reference to |terms| for definitions.`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Check that definitions were extracted
      expect(metadata['_cross_references']).toBeDefined();
      expect(metadata['_cross_references']).toHaveLength(2);
      
      const refs = metadata['_cross_references'];
      expect(refs[0]).toEqual({
        key: 'terms',
        sectionNumber: '{{undefined-level-1}}',
        sectionText: '{{undefined-level-1}} Contract Terms',
      });
      
      expect(refs[1]).toEqual({
        key: 'payment',
        sectionNumber: '{{undefined-level-2}}',
        sectionText: '{{undefined-level-2}} Payment Schedule',
      });

      // Check that references were resolved
      expect(result).toContain('This contract, as defined in {{undefined-level-1}}, is binding.');
      expect(result).toContain('Payment terms in {{undefined-level-2}} must be followed.');
      expect(result).toContain('Reference to {{undefined-level-1}} for definitions.');
      
      // Check that definition markers were removed from headers
      expect(result).toContain('# Contract Terms');
      expect(result).toContain('## Payment Schedule');
      expect(result).not.toContain('|terms|');
      expect(result).not.toContain('|payment|');
    });

    it('should handle custom level formats from metadata', async () => {
      const input = `# Introduction |intro|

See |intro| for details.

## Details |details|

As mentioned in |intro| and detailed in |details|.`;

      const metadata: Record<string, any> = {
        'level-1': 'Chapter %n:',
        'level-2': '%n.%l1'
      };
      
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      const refs = metadata['_cross_references'];
      expect(refs[0]).toEqual({
        key: 'intro',
        sectionNumber: 'Chapter 1:',
        sectionText: 'Chapter 1: Introduction',
      });
      
      expect(refs[1]).toEqual({
        key: 'details',
        sectionNumber: '1.1',
        sectionText: '1.1 Details',
      });

      // Check resolved references
      expect(result).toContain('See Chapter 1: for details.');
      expect(result).toContain('As mentioned in Chapter 1: and detailed in 1.1.');
    });

    it('should handle extended header variable system (9 levels)', async () => {
      const input = `# Level One |l1|

## Level Two |l2|

### Level Three |l3|

#### Level Four |l4|

##### Level Five |l5|

###### Level Six |l6|

References: |l1|, |l2|, |l3|, |l4|, |l5|, |l6|`;

      const metadata: Record<string, any> = {
        'level-1': 'Article %n.',
        'level-2': 'Section %n.',
        'level-3': '%n.',
        'level-4': '(%n)',
        'level-5': '(%A)',
        'level-6': '(%a)'
      };
      
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Check all definitions were extracted
      expect(metadata['_cross_references']).toHaveLength(6);
      
      const refs = metadata['_cross_references'];
      expect(refs[0].sectionNumber).toBe('Article 1.');
      expect(refs[1].sectionNumber).toBe('Section 1.');
      expect(refs[2].sectionNumber).toBe('1.');
      expect(refs[3].sectionNumber).toBe('(1)');
      expect(refs[4].sectionNumber).toBe('(A)');
      expect(refs[5].sectionNumber).toBe('(a)');

      // Check resolved references
      expect(result).toContain('References: Article 1., Section 1., 1., (1), (A), (a)');
    });
  });

  describe('Field Tracking Integration', () => {
    it('should generate HTML spans with field tracking when enabled', async () => {
      const input = `# Terms |terms|

Reference to |terms| and |undefined_ref|.`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: true
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Check that resolved reference has highlight class
      expect(result).toContain('<span class="legal-field highlight" data-field="crossref.terms">{{undefined-level-1}}</span>');
      
      // Check that unresolved reference has missing-value class
      expect(result).toContain('<span class="legal-field missing-value" data-field="crossref.undefined_ref">|undefined_ref|</span>');
      
      // Check field tracking was called
      const fields = fieldTracker.getFields();
      expect(fields.get('crossref.terms')).toBeDefined();
      expect(fields.get('crossref.terms')?.hasLogic).toBe(true);
      expect(fields.get('crossref.undefined_ref')).toBeDefined();
      expect(fields.get('crossref.undefined_ref')?.hasLogic).toBe(false);
    });

    it('should handle metadata fallback with field tracking', async () => {
      const input = `Reference to |client_name| and |amount|.`;

      const metadata: Record<string, any> = {
        client_name: 'ACME Corp',
        amount: 1500,
        payment_currency: 'USD'
      };
      
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: true
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Check metadata-based references have imported-value class
      expect(result).toContain('<span class="legal-field imported-value" data-field="crossref.client_name">ACME Corp</span>');
      expect(result).toContain('<span class="legal-field imported-value" data-field="crossref.amount">$1,500.00</span>');
    });
  });

  describe('Hierarchical Section Numbering', () => {
    it('should handle level references with %l1, %l2, etc.', async () => {
      const input = `# Main |main|

## Sub One |sub1|

### Detail One |detail1|

## Sub Two |sub2|

### Detail Two |detail2|

References: |main|, |sub1|, |detail1|, |sub2|, |detail2|`;

      const metadata: Record<string, any> = {
        'level-1': '%n.',
        'level-2': '%l1.%n',
        'level-3': '%l1.%l2.%n'
      };
      
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      const refs = metadata['_cross_references'];
      expect(refs[0].sectionNumber).toBe('1.');           // main
      expect(refs[1].sectionNumber).toBe('1.1');          // sub1
      expect(refs[2].sectionNumber).toBe('1.1.1');        // detail1
      expect(refs[3].sectionNumber).toBe('1.2');          // sub2
      expect(refs[4].sectionNumber).toBe('1.2.1');        // detail2

      expect(result).toContain('References: 1., 1.1, 1.1.1, 1.2, 1.2.1');
    });

    it('should handle roman numeral and alphabetic references', async () => {
      const input = `# Chapter |chapter|

## Section |section|

### Subsection |subsection|

References: |chapter|, |section|, |subsection|`;

      const metadata: Record<string, any> = {
        'level-1': 'Chapter %R.',
        'level-2': 'Section %A.',
        'level-3': 'Subsection %a.'
      };
      
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      const refs = metadata['_cross_references'];
      expect(refs[0].sectionNumber).toBe('Chapter I.');
      expect(refs[1].sectionNumber).toBe('Section A.');
      expect(refs[2].sectionNumber).toBe('Subsection a.');

      expect(result).toContain('References: Chapter I., Section A., Subsection a.');
    });
  });

  describe('Performance and Extensibility', () => {
    it('should handle large documents efficiently', async () => {
      // Generate a large document with many cross-references
      const headers = Array.from({ length: 50 }, (_, i) => 
        `# Header ${i + 1} |header${i + 1}|`
      ).join('\n\n');
      
      const references = Array.from({ length: 50 }, (_, i) => 
        `Reference to |header${i + 1}|`
      ).join(' and ');
      
      const input = `${headers}\n\n${references}`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const startTime = Date.now();
      const { result } = await processMarkdownWithCrossRefsAST(input, options);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);

      // Should process all definitions
      expect(metadata['_cross_references']).toHaveLength(50);

      // Should resolve all references
      expect(result).toContain('Reference to {{undefined-level-1}} and Reference to {{undefined-level-1}}');
      expect(result).toContain('Reference to {{undefined-level-1}}');
    });

    it('should handle nested and complex reference patterns', async () => {
      const input = `# Contract |contract|

This |contract| contains multiple references: |payment|, |terms|, and |schedule|.

## Payment Terms |payment|

Payment terms reference |contract| and link to |schedule|.

## Legal Terms |terms|

Legal terms in |terms| reference back to |contract|.

## Schedule |schedule|

The |schedule| is part of |contract| and affects |payment|.`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Check all cross-references were resolved correctly
      expect(result).toContain('This {{undefined-level-1}} contains multiple references: {{undefined-level-2}}, {{undefined-level-2}}, and {{undefined-level-2}}.');
      expect(result).toContain('Payment terms reference {{undefined-level-1}} and link to {{undefined-level-2}}.');
      expect(result).toContain('Legal terms in {{undefined-level-2}} reference back to {{undefined-level-1}}.');
      expect(result).toContain('The {{undefined-level-2}} is part of {{undefined-level-1}} and affects {{undefined-level-2}}.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or malformed references gracefully', async () => {
      const input = `# Valid |valid|

References: |valid|, ||, |  |, |nonexistent|`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Valid reference should resolve
      expect(result).toContain('{{undefined-level-1}}');
      
      // Invalid/empty references should remain unchanged
      expect(result).toContain('||');
      expect(result).toContain('|  |');
      expect(result).toContain('|nonexistent|');
    });

    it('should handle headers without definition references', async () => {
      const input = `# Header Without Reference

## Header With Reference |ref|

Content references |ref| but not the first header.`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Only one reference should be extracted
      expect(metadata['_cross_references']).toHaveLength(1);
      expect(metadata['_cross_references'][0].key).toBe('ref');
      
      // Reference should resolve correctly
      expect(result).toContain('Content references {{undefined-level-2}} but not the first header.');
    });

    it('should preserve original text for unresolved references when field tracking disabled', async () => {
      const input = `Reference to |unknown| and |also_unknown|.`;

      const metadata: Record<string, any> = {};
      const options: CrossReferenceASTOptions = {
        metadata,
        debug: false,
        enableFieldTracking: false
      };

      const { result } = await processMarkdownWithCrossRefsAST(input, options);

      // Unresolved references should remain as-is when field tracking is disabled
      // Note: Markdown may escape underscores
      expect(result).toMatch(/Reference to \|unknown\| and \|also\\?_unknown\|\./);
    });
  });
});