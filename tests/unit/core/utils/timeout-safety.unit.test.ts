/**
 * @fileoverview Timeout Safety Tests
 *
 * This test suite validates that timeout protections work correctly
 * to prevent infinite loops from complex nested structures or circular references.
 */

import { flattenObject } from '../../../../src/core/utils/object-flattener';
import { mergeFlattened } from '../../../../src/core/utils/frontmatter-merger';
import { vi } from 'vitest';

describe('Timeout Safety Tests', () => {
  describe('Object Flattener Timeout', () => {
    it('should timeout on extremely deep nesting', () => {
      // Create a moderately deep nested object that will timeout but not exhaust memory
      let deepObject: any = { value: 'final' };
      for (let i = 0; i < 50; i++) {  // Reduced from 1000 to 50
        deepObject = { [`level_${i}`]: deepObject };
      }

      // Mock Date.now to simulate timeout
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = vi.fn(() => {
        callCount++;
        // Return increasing time to trigger timeout after a few calls
        return originalDateNow() + (callCount > 3 ? 200 : 0);
      });

      expect(() => {
        flattenObject(deepObject, '', new WeakSet(), originalDateNow(), 100); // 100ms timeout
      }).toThrow(/timed out after 100ms/);

      Date.now = originalDateNow;
    });

    it('should handle circular references with warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const circular: any = { name: 'test' };
      circular.self = circular;

      const result = flattenObject(circular);
      
      expect(result).toEqual({
        name: 'test',
        self: '[Circular Reference]'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Circular reference detected at path 'self'")
      );

      consoleSpy.mockRestore();
    });

    it('should complete normal operations within timeout', () => {
      const normalObject = {
        level1: {
          level2: {
            level3: {
              value: 'test'
            }
          }
        }
      };

      expect(() => {
        const result = flattenObject(normalObject, '', new WeakSet(), Date.now(), 1000);
        expect(result).toEqual({
          'level1.level2.level3.value': 'test'
        });
      }).not.toThrow();
    });
  });

  describe('Frontmatter Merger Timeout', () => {
    it('should timeout on complex merge operations', () => {
      // Mock Date.now to simulate timeout during merge
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = vi.fn(() => {
        callCount++;
        // Simulate timeout after several calls
        return originalDateNow() + (callCount > 5 ? 100 : 0);
      });

      const current = { field1: 'value1', field2: { nested: 'value2' } };
      const imported = { field3: 'value3', field4: { nested: 'value4' } };

      expect(() => {
        mergeFlattened(current, imported, { 
          timeoutMs: 50, // Very short timeout
          filterReserved: false
        });
      }).toThrow(/timed out after 50ms/);

      Date.now = originalDateNow;
    });

    it('should complete normal merge operations within timeout', () => {
      const current = {
        title: 'Current Document',
        config: { debug: true }
      };

      const imported = {
        author: 'John Doe',
        config: { level: 'high' }
      };

      expect(() => {
        const result = mergeFlattened(current, imported, { 
          timeoutMs: 5000,
          filterReserved: false
        });
        
        expect(result).toEqual({
          title: 'Current Document',
          config: { debug: true, level: 'high' },
          author: 'John Doe'
        });
      }).not.toThrow();
    });

    it('should provide helpful error messages on timeout', () => {
      // Use a more direct approach - pass an already expired start time
      const current = { field: 'value' };
      const imported = { another: 'value' };

      // Call mergeFlattened with a start time that's already past the timeout
      const expiredStartTime = Date.now() - 20; // 20ms ago
      
      expect(() => {
        // Use the imported flattenObject function directly with expired time
        flattenObject(current, '', new WeakSet(), expiredStartTime, 10);
      }).toThrow(/timed out after 10ms/);
    });
  });

  describe('Real-world Timeout Scenarios', () => {
    it('should handle reasonable legal document complexity', () => {
      const complexLegalDoc = {
        document: {
          metadata: {
            title: 'Complex Service Agreement',
            version: '2.1',
            authors: ['Legal Team', 'Contract Specialist'],
            classification: {
              level: 'confidential',
              categories: ['legal', 'contract', 'service'],
              retention: {
                period: '7 years',
                policy: 'automatic-deletion',
                exceptions: ['litigation-hold', 'audit-requirement']
              }
            }
          },
          parties: {
            provider: {
              name: 'Service Company Ltd',
              contact: {
                legal: { email: 'legal@service.com', phone: '+1-555-0123' },
                business: { email: 'biz@service.com', phone: '+1-555-0124' }
              },
              address: {
                street: '123 Business Ave',
                city: 'Corporate City',
                state: 'Business State',
                zip: '12345',
                country: 'USA'
              }
            },
            client: {
              name: 'Client Corporation',
              contact: {
                primary: { name: 'John Smith', email: 'john@client.com' },
                legal: { name: 'Jane Doe', email: 'legal@client.com' }
              }
            }
          },
          terms: {
            financial: {
              base_fee: 50000,
              currency: 'USD',
              payment_schedule: ['monthly', 'quarterly'],
              late_fees: { rate: 0.05, grace_period: 30 },
              discounts: {
                early_payment: 0.02,
                volume: { threshold: 100000, rate: 0.05 }
              }
            },
            service_levels: {
              availability: 0.99,
              response_times: {
                critical: '1 hour',
                high: '4 hours',
                medium: '24 hours',
                low: '72 hours'
              }
            }
          }
        }
      };

      const importedClauses = {
        clauses: {
          termination: {
            notice_period: '30 days',
            grounds: ['breach', 'insolvency', 'material_change'],
            penalties: { early: 0.1, breach: 0.25 }
          },
          liability: {
            cap: 1000000,
            exclusions: ['indirect', 'consequential', 'punitive'],
            insurance: { minimum: 2000000, types: ['general', 'professional'] }
          }
        }
      };

      expect(() => {
        const result = mergeFlattened(complexLegalDoc, importedClauses, {
          timeoutMs: 5000, // 5 second timeout should be sufficient
          filterReserved: true,
          validateTypes: true
        });

        // Should successfully merge without timeout
        expect(result.document).toBeDefined();
        expect(result.clauses).toBeDefined();
      }).not.toThrow();
    });

    it('should timeout gracefully on pathological cases', () => {
      // Mock Date.now to simulate timeout
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = vi.fn(() => {
        callCount++;
        return originalDateNow() + (callCount > 2 ? 150 : 0);
      });

      const pathological1 = { a: { b: { c: 'value1' } } };
      const pathological2 = { x: { y: { z: 'value2' } } };

      expect(() => {
        mergeFlattened(pathological1, pathological2, { 
          timeoutMs: 100 // Short timeout for pathological case
        });
      }).toThrow(/timed out after 100ms/);

      Date.now = originalDateNow;
    });
  });
});