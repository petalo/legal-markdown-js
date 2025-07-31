/**
 * Tests for the internal cross-reference processor
 *
 * This test suite covers the |reference| internal section reference system:
 * - Pipe notation |key| for defining and referencing internal sections
 * - Section header capture and numbering
 * - Cross-reference resolution throughout the document
 * - Integration with legal document structure (l., ll., lll.)
 * - Edge cases like missing references and malformed syntax
 */

import { processCrossReferences } from '../../../src/core/processors/reference-processor';

describe('Internal Cross-References', () => {
  describe('Basic section reference capture and replacement', () => {
    it('should capture section references from headers and replace them', () => {
      const content = `l. **Contract Terms** |terms|

As specified in |terms|, this agreement is binding.

l. **Payment Conditions** |payment|

Payment terms are defined in |payment| above.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
        'level-three': '(%n)',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('As specified in Article 1., this agreement is binding.');
      expect(result).toContain('Payment terms are defined in Article 2. above.');
    });

    it('should handle multiple references to the same section', () => {
      const content = `l. **Definitions** |definitions|

For purposes of |definitions|, the following terms apply.
Reference back to |definitions| for clarification.

l. **Scope** |scope|

The |scope| includes all activities mentioned in |definitions|.`;

      const metadata = {};

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('For purposes of Article 1., the following terms apply.');
      expect(result).toContain('Reference back to Article 1. for clarification.');
      expect(result).toContain('The Article 2. includes all activities mentioned in Article 1.');
    });

    it('should preserve original references when no matching header found', () => {
      const content = `Reference to |undefined_section| should remain unchanged.

l. **Valid Section** |valid|

This refers to |valid| and |undefined_section|.`;

      const metadata = {};

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to |undefined_section| should remain unchanged.');
      expect(result).toContain('This refers to Article 1. and |undefined_section|.');
    });
  });

  describe('Multi-level section handling', () => {
    it('should handle level-one (l.) sections', () => {
      const content = `l. **First Article** |first|

Content for |first|.

l. **Second Article** |second|

Reference to |first| and |second|.`;

      const metadata = { 'level-one': 'Article %n.' };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Content for Article 1.');
      expect(result).toContain('Reference to Article 1. and Article 2.');
    });

    it('should handle alternative format (l6.) sections', () => {
      const content = `l. **Main Article** |main|

l6. **Annex Section** |annex|

Reference to |main| and |annex|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-six': 'Annex %r -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to Article 1. and Annex i -.');
    });

    it('should handle level-two (ll.) sections', () => {
      const content = `l. **Main Section** |main|

ll. **Subsection A** |suba|

ll. **Subsection B** |subb|

Refer to |main|, |suba|, and |subb|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Refer to Article 1., Section 1., and Section 2.');
    });

    it('should handle level-three (lll.) sections', () => {
      const content = `l. **Article** |art|

ll. **Section** |sec|

lll. **Subsection** |sub|

References: |art|, |sec|, |sub|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
        'level-three': '(%n)',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Article 1., Section 1., (1).');
    });
  });

  describe('Section counter reset behavior', () => {
    it('should reset lower-level counters when higher level increments', () => {
      const content = `l. **Article One** |art1|

ll. **Section A** |sec1a|

ll. **Section B** |sec1b|

l. **Article Two** |art2|

ll. **Section A** |sec2a|

References: |art1|, |sec1a|, |sec1b|, |art2|, |sec2a|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain(
        'References: Article 1., Section 1., Section 2., Article 2., Section 1.'
      );
    });

    it('should handle complex nested section structure', () => {
      const content = `l. **Main** |main|

ll. **Sub** |sub|

lll. **Detail** |detail|

l. **Another** |another|

ll. **Another Sub** |anothersub|

Refer to |main|, |sub|, |detail|, |another|, |anothersub|.`;

      const metadata = {
        'level-one': 'Part %n.',
        'level-two': 'Chapter %n.',
        'level-three': 'Section %n.',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Refer to Part 1., Chapter 1., Section 1., Part 2., Chapter 1..');
    });
  });

  describe('Custom level formats', () => {
    it('should use default formats when metadata not provided', () => {
      const content = `l. **Default Format** |default|

Reference to |default|.`;

      const metadata = {};

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to Article 1.');
    });

    it('should respect custom level formats from metadata', () => {
      const content = `l. **Custom** |custom|

ll. **Sub Custom** |subcustom|

References: |custom| and |subcustom|.`;

      const metadata = {
        'level-one': 'Chapter %n',
        'level-two': 'Section %n',
        'level-three': 'Paragraph %n',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Chapter 1 and Section 1.');
    });

    it('should handle formats without %n placeholder', () => {
      const content = `l. **Static** |static|

Reference to |static|.`;

      const metadata = {
        'level-one': 'Fixed Text',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to Fixed Text.');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle content without any references', () => {
      const content = `This is regular content without any cross-references.`;
      const metadata = {};

      const result = processCrossReferences(content, metadata);

      expect(result).toBe(content);
    });

    it('should handle empty content', () => {
      const result = processCrossReferences('', {});

      expect(result).toBe('');
    });

    it('should handle malformed header references', () => {
      const content = `l. **Missing Pipe** |unclosed

l. **Extra Pipes** ||double||

l. **Valid Section** |valid|

Reference to |unclosed|, |double|, and |valid|.`;

      const metadata = {};

      const result = processCrossReferences(content, metadata);

      // Only valid should be processed
      expect(result).toContain('Reference to |unclosed|, |double|, and Article 1.');
    });

    it('should handle references with whitespace in keys', () => {
      const content = `l. **Test** |test|

Reference to |spaced key| should resolve from metadata.`;

      const metadata = { 'spaced key': 'resolved value' };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to resolved value should resolve from metadata.');
    });
  });

  describe('Extended cross-reference support', () => {
    it('should handle keys with hyphens', () => {
      const content = `l. **Test Section** |test-section|

ll. **Another Section** |another-section|

Reference to |test-section| and |another-section|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to Article 1. and Section 1.');
    });

    it('should handle keys with dots', () => {
      const content = `l. **Test Section** |test.section|

l6. **Annex Section** |annex.vtt|

Reference to |test.section| and |annex.vtt|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-six': 'Annex %r -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('Reference to Article 1. and Annex i -.');
    });

    it('should handle all six levels with alternative formats', () => {
      const content = `l1. **Level 1** |level1|

l2. **Level 2** |level2|

l3. **Level 3** |level3|

l4. **Level 4** |level4|

l5. **Level 5** |level5|

l6. **Level 6** |level6|

References: |level1|, |level2|, |level3|, |level4|, |level5|, |level6|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
        'level-three': '(%n)',
        'level-four': '(%n)',
        'level-five': '(%n%c)',
        'level-six': 'Annex %r -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Article 1., Section 1., (1), (1), (1a), Annex i -.');
    });

    it('should handle Roman numerals in level 6 (uppercase)', () => {
      const content = `l6. **First Annex** |annex1|

l6. **Second Annex** |annex2|

l6. **Third Annex** |annex3|

References: |annex1|, |annex2|, |annex3|.`;

      const metadata = {
        'level-six': 'Annex %R -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Annex I -, Annex II -, Annex III -.');
    });

    it('should handle Roman numerals in level 6 (lowercase)', () => {
      const content = `l6. **First Annex** |annex1|

l6. **Second Annex** |annex2|

l6. **Fourth Annex** |annex4|

References: |annex1|, |annex2|, |annex4|.`;

      const metadata = {
        'level-six': 'Annex %r -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Annex i -, Annex ii -, Annex iii -.');
    });

    it('should handle mixed traditional and alternative formats', () => {
      const content = `l. **Traditional Level 1** |trad1|

ll. **Traditional Level 2** |trad2|

l4. **Alternative Level 4** |alt4|

l6. **Alternative Level 6** |alt6|

References: |trad1|, |trad2|, |alt4|, |alt6|.`;

      const metadata = {
        'level-one': 'Article %n.',
        'level-two': 'Section %n.',
        'level-four': 'Point %n.',
        'level-six': 'Annex %R -',
      };

      const result = processCrossReferences(content, metadata);

      expect(result).toContain('References: Article 1., Section 1., Point 1., Annex I -.');
    });
  });

  describe('Field tracking integration', () => {
    it('should track cross-references for field highlighting', async () => {
      const content = `l. **Contract Terms** |terms|

As specified in |terms|, this agreement is binding.

l. **Payment Conditions** |payment|

Payment terms are defined in |payment| above.`;

      const metadata = {
        'level-one': 'Article %n.',
      };

      // Import field tracker to verify tracking
      const { fieldTracker } = await import('../../../src/extensions/tracking/field-tracker');
      
      // Clear any existing tracked fields
      fieldTracker.clear();

      const result = processCrossReferences(content, metadata);

      // Verify content processing worked
      expect(result).toContain('As specified in Article 1., this agreement is binding.');
      expect(result).toContain('Payment terms are defined in Article 2. above.');

      // Verify field tracking occurred
      const report = fieldTracker.generateReport();
      expect(report.logic).toBeGreaterThan(0); // Cross-references should be tracked as logic fields
      
      // Apply field tracking to see highlighted content
      const highlightedContent = fieldTracker.applyFieldTracking(result);
      
      // Verify that resolved cross-references are highlighted
      expect(highlightedContent).toContain('<span class="legal-field highlight"');
      expect(highlightedContent).toContain('data-field="crossref.terms"');
      expect(highlightedContent).toContain('data-field="crossref.payment"');
    });

    it('should track unresolved cross-references as empty fields', async () => {
      const content = `Reference to |undefined_section| should remain unchanged and be tracked.`;

      const metadata = {};

      // Import field tracker to verify tracking
      const { fieldTracker } = await import('../../../src/extensions/tracking/field-tracker');
      
      // Clear any existing tracked fields
      fieldTracker.clear();

      const result = processCrossReferences(content, metadata);

      // Verify unresolved reference is unchanged
      expect(result).toContain('Reference to |undefined_section| should remain unchanged and be tracked.');

      // Verify field tracking occurred for unresolved reference
      const report = fieldTracker.generateReport();
      expect(report.empty).toBeGreaterThan(0); // Unresolved references should be tracked as empty fields
    });

    it('should track metadata-based cross-references as filled fields', async () => {
      const content = `Client name is |client_name| as specified in metadata.`;

      const metadata = { client_name: 'ACME Corporation' };

      // Import field tracker to verify tracking
      const { fieldTracker } = await import('../../../src/extensions/tracking/field-tracker');
      
      // Clear any existing tracked fields
      fieldTracker.clear();

      const result = processCrossReferences(content, metadata);

      // Verify metadata resolution worked
      expect(result).toContain('Client name is ACME Corporation as specified in metadata.');

      // Verify field tracking occurred for metadata-based reference
      const report = fieldTracker.generateReport();
      expect(report.filled).toBeGreaterThan(0); // Metadata references should be tracked as filled fields
      
      // Apply field tracking to see highlighted content
      const highlightedContent = fieldTracker.applyFieldTracking(result);
      
      // Verify that resolved metadata cross-references are highlighted
      expect(highlightedContent).toContain('<span class="legal-field imported-value"');
      expect(highlightedContent).toContain('data-field="crossref.client_name"');
    });
  });
});
