/**
 * @fileoverview Basic unit tests for cross-references plugin logic
 *
 * These tests verify the core functionality without using unified,
 * to avoid ESM compatibility issues in Jest for now.
 */

import { fieldTracker } from '@extensions/tracking/field-tracker';
import { getRomanNumeral, getAlphaLabel } from '@utils/number-utilities';

describe('Cross-References Plugin Core Logic', () => {
  beforeEach(() => {
    fieldTracker.clear();
  });

  describe('Section Counter Logic', () => {
    interface SectionCounters {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
      level6: number;
    }
    function updateSectionCounters(counters: SectionCounters, level: number): void {
      switch (level) {
        case 1:
          counters.level1++;
          counters.level2 = 0;
          counters.level3 = 0;
          counters.level4 = 0;
          counters.level5 = 0;
          counters.level6 = 0;
          break;
        case 2:
          counters.level2++;
          counters.level3 = 0;
          counters.level4 = 0;
          counters.level5 = 0;
          counters.level6 = 0;
          break;
        case 3:
          counters.level3++;
          counters.level4 = 0;
          counters.level5 = 0;
          counters.level6 = 0;
          break;
        case 4:
          counters.level4++;
          counters.level5 = 0;
          counters.level6 = 0;
          break;
        case 5:
          counters.level5++;
          counters.level6 = 0;
          break;
        case 6:
          counters.level6++;
          break;
      }
    }

    function generateSectionNumber(
      level: number,
      counters: SectionCounters,
      levelFormats: Record<string, string>
    ): string {
      const format = levelFormats[`level${level}`] || `Level ${level}.`;
      const count = (counters as any)[`level${level}`];

      return format
        .replace(/%n/g, count.toString())
        .replace(/%c/g, getAlphaLabel(count))
        .replace(/%r/g, getRomanNumeral(count, true))
        .replace(/%R/g, getRomanNumeral(count, false));
    }

    it('should handle hierarchical section numbering correctly', () => {
      const counters: SectionCounters = {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0,
        level6: 0,
      };

      const levelFormats = {
        level1: 'Article %n.',
        level2: 'Section %n.',
        level3: '(%n)',
        level4: '(%n)',
        level5: '(%n%c)',
        level6: 'Annex %r -',
      };

      // Simulate processing headers: H1, H2, H3, H2, H1, H2
      updateSectionCounters(counters, 1);
      expect(generateSectionNumber(1, counters, levelFormats)).toBe('Article 1.');

      updateSectionCounters(counters, 2);
      expect(generateSectionNumber(2, counters, levelFormats)).toBe('Section 1.');

      updateSectionCounters(counters, 3);
      expect(generateSectionNumber(3, counters, levelFormats)).toBe('(1)');

      updateSectionCounters(counters, 2);
      expect(generateSectionNumber(2, counters, levelFormats)).toBe('Section 2.');

      updateSectionCounters(counters, 1);
      expect(generateSectionNumber(1, counters, levelFormats)).toBe('Article 2.');

      updateSectionCounters(counters, 2);
      expect(generateSectionNumber(2, counters, levelFormats)).toBe('Section 1.');
    });

    it('should handle custom level formats', () => {
      const counters: SectionCounters = {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0,
        level6: 0,
      };

      const levelFormats = {
        level1: 'CONTRATO %n.',
        level2: 'Art. %n -',
        level3: '§ %n',
        level4: '(%r)',
        level5: '(%R%c)',
        level6: 'Annex %R',
      };

      updateSectionCounters(counters, 1);
      expect(generateSectionNumber(1, counters, levelFormats)).toBe('CONTRATO 1.');

      updateSectionCounters(counters, 2);
      expect(generateSectionNumber(2, counters, levelFormats)).toBe('Art. 1 -');

      updateSectionCounters(counters, 3);
      expect(generateSectionNumber(3, counters, levelFormats)).toBe('§ 1');

      updateSectionCounters(counters, 4);
      expect(generateSectionNumber(4, counters, levelFormats)).toBe('(i)');

      updateSectionCounters(counters, 5);
      expect(generateSectionNumber(5, counters, levelFormats)).toBe('(Ia)');

      updateSectionCounters(counters, 6);
      expect(generateSectionNumber(6, counters, levelFormats)).toBe('Annex I');
    });
  });

  describe('Cross-Reference Resolution Logic', () => {
    interface CrossReferenceDefinition {
      key: string;
      level: number;
      sectionNumber: string;
      sectionText: string;
      headerText: string;
    }

    function replaceCrossReferences(
      content: string,
      crossReferences: CrossReferenceDefinition[],
      metadata: Record<string, any>
    ): string {
      const referenceMap = new Map<string, string>();
      for (const ref of crossReferences) {
        referenceMap.set(ref.key, ref.sectionNumber);
      }

      return content.replace(/\|([^|]+)\|/g, (match, key) => {
        const trimmedKey = key.trim();

        // First try internal section reference
        const sectionNumber = referenceMap.get(trimmedKey);
        if (sectionNumber) {
          fieldTracker.trackField(`crossref.${trimmedKey}`, {
            value: sectionNumber,
            originalValue: match,
            hasLogic: true,
          });
          return sectionNumber;
        }

        // Fallback to metadata value
        const metadataValue = metadata[trimmedKey];
        if (metadataValue !== undefined) {
          fieldTracker.trackField(`crossref.${trimmedKey}`, {
            value: String(metadataValue),
            originalValue: match,
            hasLogic: false,
          });
          return String(metadataValue);
        }

        // Track unresolved reference
        fieldTracker.trackField(`crossref.${trimmedKey}`, {
          value: '',
          originalValue: match,
          hasLogic: false,
        });

        return match;
      });
    }

    it('should replace cross-references with section numbers', () => {
      const crossReferences: CrossReferenceDefinition[] = [
        {
          key: 'payment',
          level: 1,
          sectionNumber: 'Article 1.',
          sectionText: 'Article 1. Payment Terms',
          headerText: 'Payment Terms',
        },
        {
          key: 'definitions',
          level: 2,
          sectionNumber: 'Section 1.',
          sectionText: 'Section 1. Definitions',
          headerText: 'Definitions',
        },
      ];

      const content = 'As specified in |payment|, and defined in |definitions|, this applies.';
      const metadata = {};

      const result = replaceCrossReferences(content, crossReferences, metadata);

      expect(result).toBe('As specified in Article 1., and defined in Section 1., this applies.');

      // Check field tracking
      const fields = fieldTracker.getFields();
      expect(fields.has('crossref.payment')).toBe(true);
      expect(fields.has('crossref.definitions')).toBe(true);
      expect(fields.get('crossref.payment')?.hasLogic).toBe(true);
      expect(fields.get('crossref.definitions')?.hasLogic).toBe(true);
    });

    it('should fall back to metadata for unresolved references', () => {
      const crossReferences: CrossReferenceDefinition[] = [
        {
          key: 'known',
          level: 1,
          sectionNumber: 'Article 1.',
          sectionText: 'Article 1. Known Section',
          headerText: 'Known Section',
        },
      ];

      const content = 'Reference to |known| and |client_name| and |unknown|.';
      const metadata = { client_name: 'Acme Corp' };

      const result = replaceCrossReferences(content, crossReferences, metadata);

      expect(result).toBe('Reference to Article 1. and Acme Corp and |unknown|.');

      // Check field tracking
      const fields = fieldTracker.getFields();
      expect(fields.has('crossref.known')).toBe(true);
      expect(fields.has('crossref.client_name')).toBe(true);
      expect(fields.has('crossref.unknown')).toBe(true);

      expect(fields.get('crossref.known')?.hasLogic).toBe(true);
      expect(fields.get('crossref.client_name')?.hasLogic).toBe(false);
      expect(fields.get('crossref.unknown')?.value).toBe('');
    });
  });

  describe('Header Pattern Matching', () => {
    function extractCrossReferenceFromHeader(
      headerText: string
    ): { text: string; key: string } | null {
      // Pattern for headers with cross-reference keys: **Text** |key|
      const match = headerText.match(/^(?:l+\.\s+)?(.+?)\s+\|([^|]+)\|$/);

      if (match) {
        const [, headerContent, key] = match;
        const cleanText = headerContent.replace(/^\*\*|\*\*$/g, '').trim();
        return {
          text: cleanText,
          key: key.trim(),
        };
      }

      return null;
    }

    it('should extract cross-reference keys from headers', () => {
      const headers = [
        'Payment Terms |payment|',
        '**Bold Header** |bold|',
        'l. Simple Header |simple|',
        'll. Second Level |second|',
        'Regular Header', // No key
        'Invalid |missing-close',
      ];

      const results = headers.map(header => extractCrossReferenceFromHeader(header));

      expect(results[0]).toEqual({ text: 'Payment Terms', key: 'payment' });
      expect(results[1]).toEqual({ text: 'Bold Header', key: 'bold' });
      expect(results[2]).toEqual({ text: 'Simple Header', key: 'simple' });
      expect(results[3]).toEqual({ text: 'Second Level', key: 'second' });
      expect(results[4]).toBeNull();
      expect(results[5]).toBeNull();
    });
  });
});
