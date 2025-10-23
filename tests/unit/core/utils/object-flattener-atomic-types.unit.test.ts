/**
 * Unit tests for atomic value handling in object-flattener (Issue #141)
 *
 * Tests that special object types (Date, RegExp, Error, Buffer, typed arrays, etc.)
 * are treated as atomic values and not recursively flattened.
 */

import { describe, it, expect } from 'vitest';
import { flattenObject, unflattenObject } from '../../../../src/core/utils/object-flattener';

describe('Object Flattener - Atomic Types', () => {
  describe('Date Objects', () => {
    it('should treat Date objects as atomic values', () => {
      const testDate = new Date('2025-01-15T10:00:00Z');
      const obj = {
        created: testDate,
        nested: {
          modified: new Date('2025-02-20T15:30:00Z'),
        },
      };

      const flattened = flattenObject(obj);

      // Date objects should be preserved, not flattened into their properties
      expect(flattened.created).toBeInstanceOf(Date);
      expect(flattened.created).toEqual(testDate);
      expect(flattened['nested.modified']).toBeInstanceOf(Date);
    });

    it('should preserve Date objects through flatten/unflatten cycle', () => {
      const testDate = new Date('2025-01-15T10:00:00Z');
      const obj = {
        timestamp: testDate,
        data: { value: 42 },
      };

      const flattened = flattenObject(obj);
      const unflattened = unflattenObject(flattened);

      expect(unflattened.timestamp).toBeInstanceOf(Date);
      expect(unflattened.timestamp).toEqual(testDate);
      expect(unflattened.data.value).toBe(42);
    });
  });

  describe('RegExp Objects', () => {
    it('should treat RegExp objects as atomic values', () => {
      const testRegex = /test-pattern/gi;
      const obj = {
        pattern: testRegex,
        config: {
          validation: /\d{3}-\d{4}/,
        },
      };

      const flattened = flattenObject(obj);

      expect(flattened.pattern).toBeInstanceOf(RegExp);
      expect(flattened.pattern).toEqual(testRegex);
      expect(flattened['config.validation']).toBeInstanceOf(RegExp);
    });

    it('should preserve RegExp objects through flatten/unflatten cycle', () => {
      const testRegex = /abc/i;
      const obj = {
        regex: testRegex,
        other: 'value',
      };

      const flattened = flattenObject(obj);
      const unflattened = unflattenObject(flattened);

      expect(unflattened.regex).toBeInstanceOf(RegExp);
      expect(unflattened.regex.source).toBe('abc');
      expect(unflattened.regex.flags).toBe('i');
    });
  });

  describe('Error Objects', () => {
    it('should treat Error objects as atomic values', () => {
      const testError = new Error('Test error message');
      const obj = {
        lastError: testError,
        status: {
          error: new TypeError('Type mismatch'),
        },
      };

      const flattened = flattenObject(obj);

      expect(flattened.lastError).toBeInstanceOf(Error);
      expect(flattened.lastError.message).toBe('Test error message');
      expect(flattened['status.error']).toBeInstanceOf(TypeError);
    });
  });

  describe('Buffer Objects', () => {
    it('should treat Buffer objects as atomic values', () => {
      const testBuffer = Buffer.from('Hello, World!', 'utf8');
      const obj = {
        data: testBuffer,
        meta: {
          binary: Buffer.from([0x01, 0x02, 0x03]),
        },
      };

      const flattened = flattenObject(obj);

      expect(Buffer.isBuffer(flattened.data)).toBe(true);
      expect(flattened.data.toString()).toBe('Hello, World!');
      expect(Buffer.isBuffer(flattened['meta.binary'])).toBe(true);
    });
  });

  describe('Set and Map Objects', () => {
    it('should treat Set objects as atomic values', () => {
      const testSet = new Set([1, 2, 3]);
      const obj = {
        items: testSet,
        config: {
          tags: new Set(['a', 'b']),
        },
      };

      const flattened = flattenObject(obj);

      expect(flattened.items).toBeInstanceOf(Set);
      expect(flattened.items.size).toBe(3);
      expect(flattened['config.tags']).toBeInstanceOf(Set);
    });

    it('should treat Map objects as atomic values', () => {
      const testMap = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      const obj = {
        lookup: testMap,
        data: {
          cache: new Map([['cached', true]]),
        },
      };

      const flattened = flattenObject(obj);

      expect(flattened.lookup).toBeInstanceOf(Map);
      expect(flattened.lookup.size).toBe(2);
      expect(flattened['data.cache']).toBeInstanceOf(Map);
    });
  });

  describe('Typed Arrays', () => {
    it('should treat Int32Array as atomic values', () => {
      const testArray = new Int32Array([1, 2, 3, 4]);
      const obj = {
        numbers: testArray,
        nested: {
          values: new Uint8Array([10, 20, 30]),
        },
      };

      const flattened = flattenObject(obj);

      expect(flattened.numbers).toBeInstanceOf(Int32Array);
      expect(flattened.numbers.length).toBe(4);
      expect(flattened['nested.values']).toBeInstanceOf(Uint8Array);
    });

    it('should treat Float64Array as atomic values', () => {
      const testArray = new Float64Array([1.5, 2.7, 3.9]);
      const obj = {
        floats: testArray,
      };

      const flattened = flattenObject(obj);

      expect(flattened.floats).toBeInstanceOf(Float64Array);
      expect(flattened.floats[0]).toBe(1.5);
    });

    it('should treat BigInt64Array as atomic values', () => {
      const testArray = new BigInt64Array([1n, 2n, 3n]);
      const obj = {
        bigints: testArray,
      };

      const flattened = flattenObject(obj);

      expect(flattened.bigints).toBeInstanceOf(BigInt64Array);
      expect(flattened.bigints.length).toBe(3);
    });
  });

  describe('Mixed Special Types', () => {
    it('should handle objects with multiple special types', () => {
      const obj = {
        date: new Date('2025-01-15'),
        regex: /test/i,
        error: new Error('Failed'),
        buffer: Buffer.from('data'),
        set: new Set([1, 2]),
        map: new Map([['key', 'val']]),
        typedArray: new Int32Array([1, 2, 3]),
        normal: { nested: 'value' },
      };

      const flattened = flattenObject(obj);

      // Special types should be atomic
      expect(flattened.date).toBeInstanceOf(Date);
      expect(flattened.regex).toBeInstanceOf(RegExp);
      expect(flattened.error).toBeInstanceOf(Error);
      expect(Buffer.isBuffer(flattened.buffer)).toBe(true);
      expect(flattened.set).toBeInstanceOf(Set);
      expect(flattened.map).toBeInstanceOf(Map);
      expect(flattened.typedArray).toBeInstanceOf(Int32Array);

      // Normal objects should still be flattened
      expect(flattened['normal.nested']).toBe('value');
      expect(flattened.normal).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined correctly', () => {
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        date: new Date(),
      };

      const flattened = flattenObject(obj);

      expect(flattened.nullValue).toBeNull();
      expect(flattened.undefinedValue).toBeUndefined();
      expect(flattened.date).toBeInstanceOf(Date);
    });

    it('should handle arrays containing special types', () => {
      const obj = {
        mixed: [new Date(), /regex/, 'string', 42],
      };

      const flattened = flattenObject(obj);

      // Array itself is atomic, so the whole array is preserved
      expect(Array.isArray(flattened.mixed)).toBe(true);
      expect(flattened.mixed[0]).toBeInstanceOf(Date);
      expect(flattened.mixed[1]).toBeInstanceOf(RegExp);
    });

    it('should not flatten properties of Date objects', () => {
      const testDate = new Date('2025-01-15T10:00:00Z');
      const obj = {
        timestamp: testDate,
      };

      const flattened = flattenObject(obj);

      // Should NOT have flattened properties like timestamp.getTime, timestamp.constructor, etc.
      expect(Object.keys(flattened)).toEqual(['timestamp']);
      expect(flattened.timestamp).toBe(testDate);
    });
  });
});
