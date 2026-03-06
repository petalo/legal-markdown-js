/**
 * @fileoverview Unit tests for Object Flattener utilities
 *
 * This test suite validates the object flattening and unflattening functionality
 * used for granular frontmatter merging in Legal Markdown processing.
 */

import {
  flattenObject,
  unflattenObject,
  isReversible,
  getObjectPaths,
  _isAtomicValue,
} from '../../../../src/core/utils/object-flattener';

describe('Object Flattener Utilities', () => {
  describe('flattenObject', () => {
    it('should flatten simple nested objects', () => {
      const input = {
        user: {
          name: 'John Doe',
          profile: {
            age: 30,
            city: 'New York'
          }
        }
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        'user.name': 'John Doe',
        'user.profile.age': 30,
        'user.profile.city': 'New York'
      });
    });

    it('should handle arrays as atomic values', () => {
      const input = {
        tags: ['legal', 'contract', 'important'],
        config: {
          items: [1, 2, 3],
          enabled: true
        }
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        'tags': ['legal', 'contract', 'important'],
        'config.items': [1, 2, 3],
        'config.enabled': true
      });
    });

    it('should preserve null and undefined values', () => {
      const input = {
        nullable: null,
        undefined_field: undefined,
        nested: {
          also_null: null,
          has_value: 'test'
        }
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        'nullable': null,
        'undefined_field': undefined,
        'nested.also_null': null,
        'nested.has_value': 'test'
      });
    });

    it('should handle empty objects', () => {
      expect(flattenObject({})).toEqual({});
      expect(flattenObject(null)).toEqual({});
      expect(flattenObject(undefined)).toEqual({});
    });

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        'level1.level2.level3.level4.value': 'deep'
      });
    });

    it('should handle objects with special characters in keys', () => {
      const input = {
        'key-with-dashes': 'value1',
        'key_with_underscores': 'value2',
        'key with spaces': {
          'nested-key': 'nested-value'
        }
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        'key-with-dashes': 'value1',
        'key_with_underscores': 'value2',
        'key with spaces.nested-key': 'nested-value'
      });
    });
  });

  describe('unflattenObject', () => {
    it('should reconstruct nested objects from dot notation', () => {
      const input = {
        'user.name': 'John Doe',
        'user.profile.age': 30,
        'user.profile.city': 'New York',
        'settings.theme': 'dark'
      };

      const result = unflattenObject(input);

      expect(result).toEqual({
        user: {
          name: 'John Doe',
          profile: {
            age: 30,
            city: 'New York'
          }
        },
        settings: {
          theme: 'dark'
        }
      });
    });

    it('should handle arrays as atomic values', () => {
      const input = {
        'tags': ['legal', 'contract'],
        'config.items': [1, 2, 3],
        'config.enabled': true
      };

      const result = unflattenObject(input);

      expect(result).toEqual({
        tags: ['legal', 'contract'],
        config: {
          items: [1, 2, 3],
          enabled: true
        }
      });
    });

    it('should handle conflicting paths by preferring objects', () => {
      const input = {
        'config': 'primitive value',
        'config.nested': 'nested value'
      };

      const result = unflattenObject(input);

      expect(result).toEqual({
        config: {
          nested: 'nested value'
        }
      });
    });

    it('should handle empty and null inputs', () => {
      expect(unflattenObject({})).toEqual({});
      expect(unflattenObject(null as any)).toEqual(null);
      expect(unflattenObject(undefined as any)).toEqual(undefined);
    });

    it('should preserve null and undefined values', () => {
      const input = {
        'nullable': null,
        'undefined_field': undefined,
        'nested.also_null': null
      };

      const result = unflattenObject(input);

      expect(result).toEqual({
        nullable: null,
        undefined_field: undefined,
        nested: {
          also_null: null
        }
      });
    });
  });

  describe('Roundtrip Compatibility', () => {
    it('should be reversible for simple objects', () => {
      const original = {
        client: {
          name: 'Acme Corp',
          contact: {
            email: 'contact@acme.com',
            phone: '555-0123'
          }
        },
        contract: {
          type: 'service agreement',
          value: 10000
        }
      };

      const flattened = flattenObject(original);
      const restored = unflattenObject(flattened);

      expect(restored).toEqual(original);
    });

    it('should be reversible for objects with arrays', () => {
      const original = {
        parties: ['Company A', 'Company B'],
        terms: {
          duration: '12 months',
          conditions: ['condition 1', 'condition 2']
        }
      };

      const flattened = flattenObject(original);
      const restored = unflattenObject(flattened);

      expect(restored).toEqual(original);
    });

    it('should be reversible for complex nested structures', () => {
      const original = {
        document: {
          metadata: {
            title: 'Legal Agreement',
            version: '1.0',
            authors: ['John Doe', 'Jane Smith']
          },
          sections: {
            introduction: 'This agreement...',
            terms: {
              payment: {
                amount: 5000,
                currency: 'USD',
                schedule: ['monthly', 'quarterly']
              }
            }
          }
        }
      };

      const flattened = flattenObject(original);
      const restored = unflattenObject(flattened);

      expect(restored).toEqual(original);
    });
  });

  describe('isReversible', () => {
    it('should return true for reversible objects', () => {
      const reversibleObjects = [
        { a: { b: { c: 1 } } },
        { items: [1, 2, 3], config: { debug: true } },
        { simple: 'value' },
        {}
      ];

      reversibleObjects.forEach(obj => {
        expect(isReversible(obj)).toBe(true);
      });
    });

    it('should handle edge cases gracefully', () => {
      expect(isReversible(null)).toBe(false); // null flattens to {} but restores to {}
      expect(isReversible(undefined)).toBe(false); // undefined flattens to {} but restores to {}
      expect(isReversible('string')).toBe(false); // primitives don't round-trip through object flattening
      expect(isReversible(123)).toBe(false); // primitives don't round-trip through object flattening
    });
  });

  describe('isAtomicValue (via _isAtomicValue)', () => {
    describe('primitive values return true', () => {
      it('should return true for null', () => {
        expect(_isAtomicValue(null)).toBe(true);
      });

      it('should return true for undefined', () => {
        expect(_isAtomicValue(undefined)).toBe(true);
      });

      it('should return true for strings', () => {
        expect(_isAtomicValue('')).toBe(true);
        expect(_isAtomicValue('hello')).toBe(true);
      });

      it('should return true for numbers', () => {
        expect(_isAtomicValue(0)).toBe(true);
        expect(_isAtomicValue(42)).toBe(true);
        expect(_isAtomicValue(-1)).toBe(true);
        expect(_isAtomicValue(NaN)).toBe(true);
        expect(_isAtomicValue(Infinity)).toBe(true);
      });

      it('should return true for booleans', () => {
        expect(_isAtomicValue(true)).toBe(true);
        expect(_isAtomicValue(false)).toBe(true);
      });

      it('should return true for symbols', () => {
        expect(_isAtomicValue(Symbol('test'))).toBe(true);
      });

      it('should return true for bigints', () => {
        expect(_isAtomicValue(BigInt(42))).toBe(true);
      });
    });

    describe('arrays return true', () => {
      it('should return true for empty arrays', () => {
        expect(_isAtomicValue([])).toBe(true);
      });

      it('should return true for non-empty arrays', () => {
        expect(_isAtomicValue([1, 2, 3])).toBe(true);
        expect(_isAtomicValue(['a', 'b'])).toBe(true);
      });

      it('should return true for nested arrays', () => {
        expect(_isAtomicValue([[1], [2]])).toBe(true);
      });
    });

    describe('special object types return true', () => {
      it('should return true for Date objects', () => {
        expect(_isAtomicValue(new Date())).toBe(true);
      });

      it('should return true for RegExp objects', () => {
        expect(_isAtomicValue(/test/)).toBe(true);
        expect(_isAtomicValue(new RegExp('test'))).toBe(true);
      });

      it('should return true for Error objects', () => {
        expect(_isAtomicValue(new Error('test'))).toBe(true);
        expect(_isAtomicValue(new TypeError('test'))).toBe(true);
      });

      it('should return true for Set and WeakSet', () => {
        expect(_isAtomicValue(new Set([1, 2]))).toBe(true);
        expect(_isAtomicValue(new WeakSet())).toBe(true);
      });

      it('should return true for Map and WeakMap', () => {
        expect(_isAtomicValue(new Map())).toBe(true);
        expect(_isAtomicValue(new WeakMap())).toBe(true);
      });

      it('should return true for typed arrays', () => {
        expect(_isAtomicValue(new Int8Array(2))).toBe(true);
        expect(_isAtomicValue(new Uint8Array(2))).toBe(true);
        expect(_isAtomicValue(new Float64Array(2))).toBe(true);
        expect(_isAtomicValue(new Int32Array(2))).toBe(true);
      });

      it('should return true for Buffer', () => {
        expect(_isAtomicValue(Buffer.from('test'))).toBe(true);
      });

      it('should return true for BigInt typed arrays', () => {
        expect(_isAtomicValue(new BigInt64Array(2))).toBe(true);
        expect(_isAtomicValue(new BigUint64Array(2))).toBe(true);
      });
    });

    describe('plain objects return false', () => {
      it('should return false for empty plain objects', () => {
        expect(_isAtomicValue({})).toBe(false);
      });

      it('should return false for non-empty plain objects', () => {
        expect(_isAtomicValue({ a: 1 })).toBe(false);
        expect(_isAtomicValue({ nested: { deep: true } })).toBe(false);
      });

      it('should return false for objects created with Object.create(null)', () => {
        expect(_isAtomicValue(Object.create(null))).toBe(false);
      });
    });
  });

  describe('getObjectPaths', () => {
    it('should return all dot notation paths', () => {
      const input = {
        user: {
          profile: {
            name: 'John'
          },
          settings: {
            theme: 'dark'
          }
        },
        items: ['a', 'b']
      };

      const paths = getObjectPaths(input);

      expect(paths).toEqual([
        'user.profile.name',
        'user.settings.theme',
        'items'
      ]);
    });

    it('should handle empty objects', () => {
      expect(getObjectPaths({})).toEqual([]);
      expect(getObjectPaths(null)).toEqual([]);
    });

    it('should work with prefixes', () => {
      const input = { nested: { value: 1 } };
      const paths = getObjectPaths(input, 'root');

      expect(paths).toEqual(['root.nested.value']);
    });
  });
});