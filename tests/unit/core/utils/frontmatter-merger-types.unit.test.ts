/**
 * Unit tests for enhanced type detection in frontmatter-merger
 *
 * Tests that getValueType() correctly identifies special object types
 * and that type compatibility checking works for date/string conversions.
 */

import { describe, it, expect } from 'vitest';
import { mergeFlattened, validateMergeCompatibility, MergeValidationError } from '../../../../src/core/utils/frontmatter-merger';

describe('Frontmatter Merger - Enhanced Type Detection', () => {
  describe('Special Type Preservation', () => {
    it('should preserve Date objects during merge', () => {
      const testDate = new Date('2025-01-15T10:00:00Z');
      const current = {
        created: testDate,
      };
      const imported = {
        modified: new Date('2025-02-20T15:30:00Z'),
      };

      const result = mergeFlattened(current, imported);

      expect(result.created).toBeInstanceOf(Date);
      expect(result.created).toEqual(testDate);
      expect(result.modified).toBeInstanceOf(Date);
    });

    it('should preserve RegExp objects during merge', () => {
      const testRegex = /test-pattern/gi;
      const current = {
        pattern: testRegex,
      };
      const imported = {
        validation: /\d{3}-\d{4}/,
      };

      const result = mergeFlattened(current, imported);

      expect(result.pattern).toBeInstanceOf(RegExp);
      expect(result.pattern).toEqual(testRegex);
      expect(result.validation).toBeInstanceOf(RegExp);
    });

    it('should preserve Error objects during merge', () => {
      const testError = new Error('Test error');
      const current = {
        lastError: testError,
      };
      const imported = {
        previousError: new TypeError('Type error'),
      };

      const result = mergeFlattened(current, imported);

      expect(result.lastError).toBeInstanceOf(Error);
      expect(result.lastError.message).toBe('Test error');
      expect(result.previousError).toBeInstanceOf(TypeError);
    });

    it('should preserve Buffer objects during merge', () => {
      const testBuffer = Buffer.from('Hello');
      const current = {
        data: testBuffer,
      };
      const imported = {
        binary: Buffer.from([0x01, 0x02]),
      };

      const result = mergeFlattened(current, imported);

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.toString()).toBe('Hello');
      expect(Buffer.isBuffer(result.binary)).toBe(true);
    });

    it('should preserve typed arrays during merge', () => {
      const testArray = new Int32Array([1, 2, 3]);
      const current = {
        numbers: testArray,
      };
      const imported = {
        bytes: new Uint8Array([10, 20]),
      };

      const result = mergeFlattened(current, imported);

      expect(result.numbers).toBeInstanceOf(Int32Array);
      expect(result.numbers.length).toBe(3);
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Type Conflict Detection', () => {
    it('should detect Date vs Object conflicts', () => {
      const testDate = new Date('2025-01-15');
      const obj = { nested: 'value' };

      expect(() => {
        validateMergeCompatibility(testDate, obj, 'field');
      }).toThrow(MergeValidationError);
    });

    it('should detect RegExp vs String conflicts as incompatible', () => {
      const regex = /test/;
      const str = 'test';

      expect(() => {
        validateMergeCompatibility(regex, str, 'pattern');
      }).toThrow(MergeValidationError);
    });

    it('should detect Array vs Date conflicts', () => {
      const arr = [1, 2, 3];
      const date = new Date();

      expect(() => {
        validateMergeCompatibility(arr, date, 'field');
      }).toThrow(MergeValidationError);
    });
  });

  describe('Date-String Type Compatibility', () => {
    it('should allow Date vs String (compatible combination)', () => {
      const date = new Date('2025-01-15');
      const str = '2025-01-15';

      // Should not throw - date and string are compatible
      expect(() => {
        validateMergeCompatibility(date, str, 'dateField');
      }).not.toThrow();
    });

    it('should allow String vs Date (compatible combination)', () => {
      const str = '2025-01-15';
      const date = new Date('2025-01-15');

      // Should not throw - string and date are compatible
      expect(() => {
        validateMergeCompatibility(str, date, 'dateField');
      }).not.toThrow();
    });

    it('should merge Date and String without error', () => {
      const current = {
        dateField: new Date('2025-01-15'),
      };
      const imported = {
        dateField: '2020-01-01 (should be ignored)',
        stringField: '2025-02-20',
      };

      // Should not throw due to date/string compatibility
      const result = mergeFlattened(current, imported, {
        validateTypes: true,
      });

      // Current Date wins
      expect(result.dateField).toBeInstanceOf(Date);
      expect(result.stringField).toBe('2025-02-20');
    });
  });

  describe('Complex Type Scenarios', () => {
    it('should handle nested objects with mixed special types', () => {
      const current = {
        config: {
          timeout: new Date('2025-12-31'),
          pattern: /test/,
        },
        data: 'value',
      };
      const imported = {
        config: {
          timeout: '2026-06-30', // Date vs String - compatible
          retries: 3,
        },
        extra: 'field',
      };

      const result = mergeFlattened(current, imported, {
        validateTypes: true,
      });

      // Current Date wins over imported string
      expect(result.config.timeout).toBeInstanceOf(Date);
      // Current regex preserved
      expect(result.config.pattern).toBeInstanceOf(RegExp);
      // Imported field added
      expect(result.config.retries).toBe(3);
      expect(result.extra).toBe('field');
    });

    it('should preserve special types in deeply nested structures', () => {
      const testDate = new Date('2025-01-15');
      const current = {
        level1: {
          level2: {
            level3: {
              timestamp: testDate,
            },
          },
        },
      };
      const imported = {
        level1: {
          level2: {
            level3: {
              timestamp: '2020-01-01', // Date vs String - compatible
              other: 'value',
            },
          },
        },
      };

      const result = mergeFlattened(current, imported);

      // Current Date should win and be preserved
      expect(result.level1.level2.level3.timestamp).toBeInstanceOf(Date);
      expect(result.level1.level2.level3.timestamp).toEqual(testDate);
      expect(result.level1.level2.level3.other).toBe('value');
    });
  });

  describe('Source Always Wins with Special Types', () => {
    it('should apply "source wins" for Date conflicts', () => {
      const currentDate = new Date('2025-01-15');
      const importedDate = new Date('2020-01-01');

      const current = {
        created: currentDate,
      };
      const imported = {
        created: importedDate,
      };

      const result = mergeFlattened(current, imported);

      // Current Date should win
      expect(result.created).toEqual(currentDate);
      expect(result.created).not.toEqual(importedDate);
    });

    it('should apply "source wins" for RegExp conflicts', () => {
      const currentRegex = /main-pattern/i;
      const importedRegex = /import-pattern/g;

      const current = {
        pattern: currentRegex,
      };
      const imported = {
        pattern: importedRegex,
      };

      const result = mergeFlattened(current, imported);

      // Current RegExp should win
      expect(result.pattern.source).toBe('main-pattern');
      expect(result.pattern.flags).toBe('i');
    });

    it('should apply "source wins" when main has Date and import has string', () => {
      const currentDate = new Date('2025-01-15T10:00:00Z');

      const current = {
        timestamp: currentDate,
      };
      const imported = {
        timestamp: '2020-01-01 (from import)',
      };

      const result = mergeFlattened(current, imported, {
        validateTypes: true,
      });

      // Current Date should win over imported string
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp).toEqual(currentDate);
    });

    it('should apply "source wins" when main has string and import has Date', () => {
      const importedDate = new Date('2020-01-01');

      const current = {
        timestamp: '2025-01-15 (custom format)',
      };
      const imported = {
        timestamp: importedDate,
      };

      const result = mergeFlattened(current, imported, {
        validateTypes: true,
      });

      // Current string should win over imported Date
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp).toBe('2025-01-15 (custom format)');
    });
  });

  describe('Null Compatibility with Special Types', () => {
    it('should allow null to replace any special type', () => {
      const current = {
        dateField: null,
        regexField: null,
        errorField: null,
      };
      const imported = {
        dateField: new Date(),
        regexField: /test/,
        errorField: new Error('test'),
      };

      const result = mergeFlattened(current, imported);

      // Null should win (source wins)
      expect(result.dateField).toBeNull();
      expect(result.regexField).toBeNull();
      expect(result.errorField).toBeNull();
    });

    it('should allow special types to replace null from import', () => {
      const testDate = new Date('2025-01-15');
      const current = {
        dateField: testDate,
        regexField: /pattern/,
      };
      const imported = {
        dateField: null,
        regexField: null,
      };

      const result = mergeFlattened(current, imported);

      // Current special types should win
      expect(result.dateField).toBeInstanceOf(Date);
      expect(result.dateField).toEqual(testDate);
      expect(result.regexField).toBeInstanceOf(RegExp);
    });
  });
});
