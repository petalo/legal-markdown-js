/**
 * @fileoverview Unit tests for Frontmatter Merger
 *
 * This test suite validates the frontmatter merging functionality with
 * "source always wins" strategy and flattened granular merging.
 */

import { vi } from 'vitest';

// Import fail function from vitest
const fail = (message: string) => {
  throw new Error(message);
};
import {
  mergeFlattened,
  validateMergeCompatibility,
  previewMerge,
  mergeSequentially,
  MergeValidationError,
  MergeOptions,
  MergeResult
} from '../../../../src/core/utils/frontmatter-merger';

describe('Frontmatter Merger', () => {
  describe('mergeFlattened', () => {
    it('should merge simple objects with source wins strategy', () => {
      const current = {
        title: 'Main Document',
        client: 'Primary Client'
      };

      const imported = {
        title: 'Imported Document', // Conflict - current should win
        author: 'John Doe',          // New field - should be added
        date: '@today'               // New field - should be added
      };

      const result = mergeFlattened(current, imported);

      expect(result).toEqual({
        title: 'Main Document',    // Current value preserved
        client: 'Primary Client',  // Current value preserved
        author: 'John Doe',        // New field added
        date: '@today'             // New field added
      });
    });

    it('should handle nested object merging with granular control', () => {
      const current = {
        client: {
          name: 'Acme Corp',
          contact: {
            email: 'current@acme.com'
          }
        },
        contract_value: 10000
      };

      const imported = {
        client: {
          name: 'Different Corp',      // Conflict - current wins
          contact: {
            email: 'imported@diff.com', // Conflict - current wins
            phone: '555-0123'           // New field - added
          },
          address: '123 Main St'        // New field - added
        },
        effective_date: '2024-01-01'    // New field - added
      };

      const result = mergeFlattened(current, imported);

      expect(result).toEqual({
        client: {
          name: 'Acme Corp',              // Current wins
          contact: {
            email: 'current@acme.com',   // Current wins
            phone: '555-0123'            // Added from import
          },
          address: '123 Main St'          // Added from import
        },
        contract_value: 10000,            // Current preserved
        effective_date: '2024-01-01'     // Added from import
      });
    });

    it('should filter reserved fields when enabled', () => {
      const current = {
        title: 'Current Title',
        client: 'Current Client'
      };

      const imported = {
        title: 'Imported Title',
        author: 'John Doe',
        'level-one': 'ARTICLE %n.',    // Reserved field
        'force_commands': '--pdf',     // Reserved field
        'meta-yaml-output': 'hack.yml' // Reserved field
      };

      const result = mergeFlattened(current, imported, { 
        filterReserved: true 
      });

      expect(result).toEqual({
        title: 'Current Title',  // Current wins
        client: 'Current Client', // Current preserved
        author: 'John Doe'       // Only non-reserved field added
      });
    });

    it('should return statistics when requested', () => {
      const current = {
        title: 'Current Title',
        client: 'Current Client'
      };

      const imported = {
        title: 'Imported Title',    // Conflict
        author: 'John Doe',         // New field
        date: '@today',             // New field
        'level-one': 'ARTICLE %n.'  // Reserved field
      };

      const result = mergeFlattened(current, imported, { 
        includeStats: true,
        filterReserved: true
      }) as MergeResult;

      expect(result.metadata).toEqual({
        title: 'Current Title',
        client: 'Current Client',
        author: 'John Doe',
        date: '@today'
      });

      expect(result.stats).toBeDefined();
      expect(result.stats!.propertiesAdded).toBe(2);
      expect(result.stats!.conflictsResolved).toBe(1);
      expect(result.stats!.reservedFieldsFiltered).toBe(1);
      expect(result.stats!.addedFields).toEqual(['author', 'date']);
      expect(result.stats!.conflictedFields).toEqual(['title']);
      expect(result.stats!.filteredFields).toEqual(['level-one']);
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(mergeFlattened(null as any, { key: 'value' })).toEqual({ key: 'value' });
      expect(mergeFlattened({ key: 'value' }, null as any)).toEqual({ key: 'value' });
      expect(mergeFlattened(undefined as any, undefined as any)).toEqual({});
    });

    it('should validate types when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const current = {
        count: 42,
        config: { debug: true }
      };

      const imported = {
        count: [1, 2, 3],       // Type conflict: number vs array
        config: 'not an object' // Type conflict: object vs string
      };

      const result = mergeFlattened(current, imported, { 
        validateTypes: true,
        logOperations: true
      });

      expect(result).toEqual({
        count: 42,                    // Current value preserved
        config: { debug: true }       // Current value preserved
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Type conflict for 'count'")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Type conflict for 'config'")
      );

      consoleSpy.mockRestore();
    });

    it('should handle arrays as atomic values', () => {
      const current = {
        tags: ['legal', 'contract'],
        parties: ['Company A']
      };

      const imported = {
        tags: ['imported', 'different'], // Conflict - current wins
        categories: ['new', 'category']   // New field - added
      };

      const result = mergeFlattened(current, imported);

      expect(result).toEqual({
        tags: ['legal', 'contract'],     // Current wins
        parties: ['Company A'],          // Current preserved
        categories: ['new', 'category']  // Added from import
      });
    });

    it('should log operations when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const current = { title: 'Current' };
      const imported = { title: 'Imported', author: 'John' };

      mergeFlattened(current, imported, { logOperations: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Merging frontmatter')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Conflict for 'title': current value kept")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Added 'author' from import")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateMergeCompatibility', () => {
    it('should allow compatible types', () => {
      expect(() => validateMergeCompatibility('string', 'another string', 'field')).not.toThrow();
      expect(() => validateMergeCompatibility(42, 100, 'number_field')).not.toThrow();
      expect(() => validateMergeCompatibility(true, false, 'bool_field')).not.toThrow();
      expect(() => validateMergeCompatibility([1, 2], [3, 4], 'array_field')).not.toThrow();
    });

    it('should allow null/undefined compatibility', () => {
      expect(() => validateMergeCompatibility(null, 'string', 'field')).not.toThrow();
      expect(() => validateMergeCompatibility('string', null, 'field')).not.toThrow();
      expect(() => validateMergeCompatibility(undefined, 42, 'field')).not.toThrow();
      expect(() => validateMergeCompatibility(42, undefined, 'field')).not.toThrow();
    });

    it('should allow compatible cross-type combinations', () => {
      expect(() => validateMergeCompatibility('123', 456, 'field')).not.toThrow();
      expect(() => validateMergeCompatibility(789, '456', 'field')).not.toThrow();
      expect(() => validateMergeCompatibility(true, 'true', 'field')).not.toThrow();
      expect(() => validateMergeCompatibility('false', false, 'field')).not.toThrow();
    });

    it('should throw for incompatible types', () => {
      expect(() => validateMergeCompatibility('string', { object: true }, 'field'))
        .toThrow(MergeValidationError);
      
      expect(() => validateMergeCompatibility([1, 2], { not: 'array' }, 'field'))
        .toThrow(MergeValidationError);
      
      expect(() => validateMergeCompatibility({ object: true }, [1, 2], 'field'))
        .toThrow(MergeValidationError);
    });

    it('should provide detailed error information', () => {
      try {
        validateMergeCompatibility('string', { object: true }, 'test_field');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(MergeValidationError);
        expect((error as Error).message).toContain('Type conflict for \'test_field\'');
        expect((error as Error).message).toContain('current=string');
        expect((error as Error).message).toContain('imported=object');
        expect((error as MergeValidationError).field).toBe('test_field');
        expect((error as MergeValidationError).currentType).toBe('string');
        expect((error as MergeValidationError).importedType).toBe('object');
      }
    });
  });

  describe('previewMerge', () => {
    it('should preview merge results without modifying inputs', () => {
      const current = { title: 'Current', client: 'Client A' };
      const imported = { title: 'Imported', author: 'John Doe' };

      const originalCurrent = { ...current };
      const originalImported = { ...imported };

      const preview = previewMerge(current, imported, { filterReserved: true });

      // Inputs should be unchanged
      expect(current).toEqual(originalCurrent);
      expect(imported).toEqual(originalImported);

      // Preview should show expected results
      expect(preview.metadata).toEqual({
        title: 'Current',
        client: 'Client A',
        author: 'John Doe'
      });

      expect(preview.stats).toBeDefined();
      expect(preview.stats!.propertiesAdded).toBe(1);
      expect(preview.stats!.conflictsResolved).toBe(1);
    });
  });

  describe('mergeSequentially', () => {
    it('should merge multiple imports sequentially', () => {
      const initial = {
        title: 'Main Document',
        client: 'Primary Client'
      };

      const imports = [
        {
          author: 'John Doe',
          version: '1.0'
        },
        {
          author: 'Jane Smith',      // Conflict with previous import
          editor: 'Bob Wilson',      // New field
          version: '2.0'            // Conflict with previous import
        },
        {
          date: '@today',           // New field
          status: 'draft'           // New field
        }
      ];

      const result = mergeSequentially(initial, imports);

      expect(result.metadata).toEqual({
        title: 'Main Document',     // From initial (always wins)
        client: 'Primary Client',   // From initial (always wins)
        author: 'John Doe',         // From first import (wins over second)
        version: '1.0',             // From first import (wins over second)
        editor: 'Bob Wilson',       // From second import
        date: '@today',             // From third import
        status: 'draft'             // From third import
      });

      expect(result.stats).toBeDefined();
      expect(result.stats!.propertiesAdded).toBe(5); // Total new fields added
      expect(result.stats!.conflictsResolved).toBe(2); // author and version conflicts
    });

    it('should accumulate statistics across all merges', () => {
      const initial = { title: 'Main' };
      const imports = [
        { title: 'Import 1', field1: 'value1' },  // 1 conflict, 1 addition
        { title: 'Import 2', field2: 'value2' },  // 1 conflict, 1 addition
        { field3: 'value3' }                      // 0 conflicts, 1 addition
      ];

      const result = mergeSequentially(initial, imports, { includeStats: true });

      expect(result.stats!.conflictsResolved).toBe(2); // title conflicts in imports 1 and 2
      expect(result.stats!.propertiesAdded).toBe(3);   // field1, field2, field3
      expect(result.stats!.addedFields).toEqual(['field1', 'field2', 'field3']);
      expect(result.stats!.conflictedFields).toEqual(['title', 'title']);
    });

    it('should handle empty imports array', () => {
      const initial = { title: 'Main Document' };
      const result = mergeSequentially(initial, []);

      expect(result.metadata).toEqual(initial);
      expect(result.stats!.propertiesAdded).toBe(0);
      expect(result.stats!.conflictsResolved).toBe(0);
    });

    it('should log sequential operations when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const initial = { title: 'Main' };
      const imports = [
        { author: 'John' },
        { editor: 'Jane' }
      ];

      mergeSequentially(initial, imports, { logOperations: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Merged import 1/2: +1 properties')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Merged import 2/2: +1 properties')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Real-world Legal Document Scenarios', () => {
    it('should handle contract frontmatter merging', () => {
      const mainDocument = {
        title: 'Service Agreement',
        parties: ['Main Company', 'Client Corp'],
        effective_date: '2024-01-01'
      };

      const importedClauses = {
        title: 'Standard Clauses',           // Conflict - main wins
        confidentiality_clause: true,       // New field
        termination_notice: '30 days',      // New field
        governing_law: 'State of New York'  // New field
      };

      const importedTerms = {
        payment_terms: 'Net 30',            // New field
        confidentiality_clause: false,     // Conflict - previous wins
        liability_cap: 1000000              // New field
      };

      const result = mergeSequentially(mainDocument, [importedClauses, importedTerms]);

      expect(result.metadata).toEqual({
        title: 'Service Agreement',          // Main document wins
        parties: ['Main Company', 'Client Corp'], // Main preserved
        effective_date: '2024-01-01',       // Main preserved
        confidentiality_clause: true,       // First import wins over second
        termination_notice: '30 days',      // From first import
        governing_law: 'State of New York', // From first import
        payment_terms: 'Net 30',            // From second import
        liability_cap: 1000000               // From second import
      });
    });

    it('should handle complex nested client information', () => {
      const mainDocument = {
        contract_type: 'service_agreement',
        client: {
          name: 'Acme Corporation',
          contact: {
            email: 'main@acme.com'
          }
        }
      };

      const importedClientDetails = {
        client: {
          name: 'Different Corp',             // Conflict - main wins
          contact: {
            email: 'imported@different.com',  // Conflict - main wins
            phone: '555-0123'                 // New field - added
          },
          address: {
            street: '123 Business Ave',       // New nested object
            city: 'New York'
          }
        },
        account_manager: 'John Doe'           // New field
      };

      const result = mergeFlattened(mainDocument, importedClientDetails);

      expect(result).toEqual({
        contract_type: 'service_agreement',
        client: {
          name: 'Acme Corporation',           // Main wins
          contact: {
            email: 'main@acme.com',          // Main wins
            phone: '555-0123'                // Added from import
          },
          address: {
            street: '123 Business Ave',      // Added from import
            city: 'New York'                 // Added from import
          }
        },
        account_manager: 'John Doe'          // Added from import
      });
    });

    it('should prevent malicious override attempts', () => {
      const mainDocument = {
        title: 'Legitimate Contract',
        client: 'Trusted Client'
      };

      const maliciousImport = {
        title: 'HACKED DOCUMENT',
        'level-one': 'COMPROMISED %n',
        'force_commands': 'rm -rf /',
        'meta-yaml-output': '/etc/passwd',
        // Some legitimate fields mixed in
        payment_terms: 'Net 30',
        currency: 'USD'
      };

      const result = mergeFlattened(mainDocument, maliciousImport, {
        filterReserved: true
      });

      expect(result).toEqual({
        title: 'Legitimate Contract',  // Main wins over malicious title
        client: 'Trusted Client',      // Main preserved
        payment_terms: 'Net 30',       // Legitimate field added
        currency: 'USD'                // Legitimate field added
        // All malicious reserved fields filtered out
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle circular reference attempts gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const current = { title: 'Current' };

      // Should not throw, but may not preserve circular structure
      expect(() => mergeFlattened(current, circular)).not.toThrow();
    });

    it('should handle very deep nesting', () => {
      const current = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'current'
              }
            }
          }
        }
      };

      const imported = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'imported',      // Conflict - current wins
                newField: 'added'       // New field - added
              },
              newLevel4: 'added'        // New field - added
            }
          }
        }
      };

      const result = mergeFlattened(current, imported);

      expect(result.level1.level2.level3.level4.value).toBe('current');
      expect(result.level1.level2.level3.level4.newField).toBe('added');
      expect(result.level1.level2.level3.newLevel4).toBe('added');
    });

    it('should handle mixed data types in arrays', () => {
      const current = {
        mixed_array: ['string', 123, true, { nested: 'object' }]
      };

      const imported = {
        mixed_array: ['different', 'array'],  // Conflict - current wins
        new_array: [null, undefined, 'value'] // New field - added
      };

      const result = mergeFlattened(current, imported);

      expect(result.mixed_array).toEqual(['string', 123, true, { nested: 'object' }]);
      expect(result.new_array).toEqual([null, undefined, 'value']);
    });
  });
});