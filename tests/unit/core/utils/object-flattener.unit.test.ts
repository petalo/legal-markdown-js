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
  getObjectPaths 
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