/**
 * @fileoverview Unit tests for Reserved Fields Filter
 *
 * This test suite validates the filtering of reserved fields from imported
 * frontmatter to prevent security vulnerabilities and system configuration override.
 */

import { vi } from 'vitest';
import {
  filterReservedFields,
  isReservedField,
  getReservedFieldsByCategory,
  validateNoReservedFields,
  createFieldFilter,
  RESERVED_FIELDS
} from '../../../../src/core/utils/reserved-fields-filter';

describe('Reserved Fields Filter', () => {
  describe('RESERVED_FIELDS constant', () => {
    it('should contain all expected reserved field categories', () => {
      const fieldString = RESERVED_FIELDS.join(' ');
      
      // Document structure fields
      expect(fieldString).toMatch(/level-one|level-two|level-three/);
      expect(fieldString).toMatch(/no-reset|no-indent/);
      
      // Security-critical fields
      expect(fieldString).toMatch(/force_commands|force-commands|forceCommands/);
      
      // Metadata configuration
      expect(fieldString).toMatch(/meta-yaml-output|meta-json-output/);
      
      // Date and localization
      expect(fieldString).toMatch(/date-format|dateFormat|timezone/);
      
      // Import configuration
      expect(fieldString).toMatch(/import-tracing|disable-frontmatter-merge/);
    });

    it('should have security-critical fields', () => {
      expect(RESERVED_FIELDS).toContain('force_commands');
      expect(RESERVED_FIELDS).toContain('force-commands');
      expect(RESERVED_FIELDS).toContain('forceCommands');
      expect(RESERVED_FIELDS).toContain('commands');
    });
  });

  describe('isReservedField', () => {
    it('should identify reserved fields correctly', () => {
      expect(isReservedField('level-one')).toBe(true);
      expect(isReservedField('force_commands')).toBe(true);
      expect(isReservedField('meta-yaml-output')).toBe(true);
      expect(isReservedField('date-format')).toBe(true);
    });

    it('should be case-insensitive by default', () => {
      expect(isReservedField('LEVEL-ONE')).toBe(true);
      expect(isReservedField('Level-Two')).toBe(true);
      expect(isReservedField('FORCE_COMMANDS')).toBe(true);
      expect(isReservedField('Meta-Yaml-Output')).toBe(true);
    });

    it('should respect strict mode', () => {
      expect(isReservedField('LEVEL-ONE', { strictMode: true })).toBe(false);
      expect(isReservedField('level-one', { strictMode: true })).toBe(true);
    });

    it('should handle additional reserved fields', () => {
      const additionalReserved = ['custom-field', 'special-config'];
      
      expect(isReservedField('custom-field', { additionalReserved })).toBe(true);
      expect(isReservedField('special-config', { additionalReserved })).toBe(true);
      expect(isReservedField('normal-field', { additionalReserved })).toBe(false);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(isReservedField('')).toBe(false);
      expect(isReservedField(null as any)).toBe(false);
      expect(isReservedField(undefined as any)).toBe(false);
      expect(isReservedField(123 as any)).toBe(false);
    });

    it('should identify non-reserved fields correctly', () => {
      const normalFields = [
        'client_name',
        'contract_date',
        'parties',
        'terms_and_conditions',
        'payment_amount',
        'effective_date'
      ];

      normalFields.forEach(field => {
        expect(isReservedField(field)).toBe(false);
      });
    });
  });

  describe('filterReservedFields', () => {
    it('should filter out reserved fields', () => {
      const input = {
        'level-one': 'ARTICLE %n.',
        'force_commands': '--pdf',
        'client_name': 'Acme Corp',
        'contract_date': '@today',
        'meta-yaml-output': 'metadata.yaml'
      };

      const result = filterReservedFields(input);

      expect(result).toEqual({
        'client_name': 'Acme Corp',
        'contract_date': '@today'
      });
    });

    it('should preserve non-reserved fields', () => {
      const input = {
        title: 'Legal Agreement',
        parties: ['Company A', 'Company B'],
        effective_date: '2024-01-01',
        terms: {
          duration: '12 months',
          payment: 10000
        }
      };

      const result = filterReservedFields(input);

      expect(result).toEqual(input);
    });

    it('should handle empty and null inputs', () => {
      expect(filterReservedFields({})).toEqual({});
      expect(filterReservedFields(null as any)).toEqual(null);
      expect(filterReservedFields(undefined as any)).toEqual(undefined);
    });

    it('should support logging of filtered fields', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const input = {
        'level-one': 'ARTICLE %n.',
        'force_commands': '--pdf',
        'client_name': 'Acme Corp'
      };

      filterReservedFields(input, { logFiltered: true });

      expect(consoleSpy).toHaveBeenCalledWith("Reserved field 'level-one' ignored from import");
      expect(consoleSpy).toHaveBeenCalledWith("Reserved field 'force_commands' ignored from import");
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should handle additional reserved fields', () => {
      const input = {
        'custom-reserved': 'value',
        'normal-field': 'keep this',
        'level-one': 'filter this'
      };

      const result = filterReservedFields(input, { 
        additionalReserved: ['custom-reserved'] 
      });

      expect(result).toEqual({
        'normal-field': 'keep this'
      });
    });

    it('should respect strict mode', () => {
      const input = {
        'LEVEL-ONE': 'uppercase version',
        'level-one': 'lowercase version',
        'normal_field': 'keep this'
      };

      const strictResult = filterReservedFields(input, { strictMode: true });
      const nonStrictResult = filterReservedFields(input, { strictMode: false });

      expect(strictResult).toEqual({
        'LEVEL-ONE': 'uppercase version',
        'normal_field': 'keep this'
      });

      expect(nonStrictResult).toEqual({
        'normal_field': 'keep this'
      });
    });
  });

  describe('getReservedFieldsByCategory', () => {
    it('should return fields grouped by category', () => {
      const categories = getReservedFieldsByCategory();

      expect(categories).toHaveProperty('structure');
      expect(categories).toHaveProperty('metadata');
      expect(categories).toHaveProperty('localization');
      expect(categories).toHaveProperty('security');
      expect(categories).toHaveProperty('imports');
      expect(categories).toHaveProperty('system');
    });

    it('should contain expected fields in security category', () => {
      const categories = getReservedFieldsByCategory();
      
      expect(categories.security).toContain('force_commands');
      expect(categories.security).toContain('force-commands');
      expect(categories.security).toContain('forceCommands');
      expect(categories.security).toContain('commands');
    });

    it('should contain structure configuration fields', () => {
      const categories = getReservedFieldsByCategory();
      
      expect(categories.structure).toContain('level-one');
      expect(categories.structure).toContain('level-two');
      expect(categories.structure).toContain('no-reset');
      expect(categories.structure).toContain('no-indent');
    });
  });

  describe('validateNoReservedFields', () => {
    it('should validate clean metadata', () => {
      const metadata = {
        title: 'Legal Document',
        client: 'Acme Corp',
        date: '2024-01-01'
      };

      const result = validateNoReservedFields(metadata);

      expect(result.isValid).toBe(true);
      expect(result.reservedFields).toEqual([]);
      expect(result.message).toBe('No reserved fields found');
    });

    it('should detect reserved fields', () => {
      const metadata = {
        title: 'Legal Document',
        'level-one': 'ARTICLE %n.',
        client: 'Acme Corp',
        'force_commands': '--pdf'
      };

      const result = validateNoReservedFields(metadata);

      expect(result.isValid).toBe(false);
      expect(result.reservedFields).toEqual(['level-one', 'force_commands']);
      expect(result.message).toBe('Found 2 reserved fields: level-one, force_commands');
    });

    it('should handle empty metadata', () => {
      const result = validateNoReservedFields({});

      expect(result.isValid).toBe(true);
      expect(result.reservedFields).toEqual([]);
      expect(result.message).toBe('No reserved fields found');
    });

    it('should handle null/undefined metadata', () => {
      const nullResult = validateNoReservedFields(null as any);
      const undefinedResult = validateNoReservedFields(undefined as any);

      expect(nullResult.isValid).toBe(true);
      expect(nullResult.message).toBe('No metadata to validate');

      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.message).toBe('No metadata to validate');
    });
  });

  describe('createFieldFilter', () => {
    it('should create a reusable filter function', () => {
      const filter = createFieldFilter({ 
        logFiltered: false,
        additionalReserved: ['custom-field']
      });

      const input1 = {
        'level-one': 'filter this',
        'custom-field': 'also filter this',
        'keep': 'this value'
      };

      const input2 = {
        'force_commands': 'dangerous',
        'normal': 'safe value'
      };

      expect(filter(input1)).toEqual({ 'keep': 'this value' });
      expect(filter(input2)).toEqual({ 'normal': 'safe value' });
    });

    it('should work with default options', () => {
      const filter = createFieldFilter();

      const input = {
        'level-one': 'reserved',
        'normal_field': 'not reserved'
      };

      expect(filter(input)).toEqual({
        'normal_field': 'not reserved'
      });
    });
  });

  describe('Security Tests', () => {
    it('should prevent force command injection', () => {
      const maliciousInput = {
        'force_commands': '--rm -rf /',
        'force-commands': 'dangerous command',
        'forceCommands': 'another dangerous command',
        'commands': 'system command',
        'legitimate_field': 'safe value'
      };

      const result = filterReservedFields(maliciousInput);

      expect(result).toEqual({
        'legitimate_field': 'safe value'
      });
    });

    it('should prevent system configuration override', () => {
      const maliciousInput = {
        'level-one': 'HACKED %n',
        'level-two': 'COMPROMISED %n',
        'meta-yaml-output': '/etc/passwd',
        'pipeline-config': 'malicious config',
        'safe_field': 'legitimate value'
      };

      const result = filterReservedFields(maliciousInput);

      expect(result).toEqual({
        'safe_field': 'legitimate value'
      });
    });

    it('should handle case variations of dangerous fields', () => {
      const maliciousInput = {
        'FORCE_COMMANDS': 'uppercase dangerous',
        'Force-Commands': 'mixed case dangerous',
        'force_COMMANDS': 'partial uppercase dangerous',
        'legitimate': 'safe'
      };

      const result = filterReservedFields(maliciousInput);

      expect(result).toEqual({
        'legitimate': 'safe'
      });
    });
  });

  describe('Real-world Import Scenarios', () => {
    it('should handle typical legal document frontmatter', () => {
      const importedFrontmatter = {
        // Legitimate fields that should be kept
        client_name: 'Acme Corporation',
        client_address: '123 Business St, City, State 12345',
        contract_date: '@today',
        effective_date: '2024-01-01',
        parties: ['Company A', 'Company B'],
        contract_value: 50000,
        
        // Reserved fields that should be filtered
        'level-one': 'ARTICLE %n.',
        'level-two': 'Section %n',
        'force_commands': '--pdf --title "Hacked"',
        'meta-yaml-output': 'steal-metadata.yaml'
      };

      const result = filterReservedFields(importedFrontmatter);

      expect(result).toEqual({
        client_name: 'Acme Corporation',
        client_address: '123 Business St, City, State 12345',
        contract_date: '@today',
        effective_date: '2024-01-01',
        parties: ['Company A', 'Company B'],
        contract_value: 50000
      });
    });

    it('should preserve complex nested legitimate data', () => {
      const importedFrontmatter = {
        client: {
          name: 'Acme Corp',
          contact: {
            email: 'legal@acme.com',
            phone: '555-0123'
          },
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          }
        },
        contract: {
          type: 'service_agreement',
          duration: '12 months',
          value: 100000,
          terms: ['net 30', 'milestone based']
        },
        // This should be filtered
        'level-one': 'COMPROMISED'
      };

      const result = filterReservedFields(importedFrontmatter);

      expect(result.client).toBeDefined();
      expect(result.contract).toBeDefined();
      expect(result['level-one']).toBeUndefined();
      expect(result.client.name).toBe('Acme Corp');
      expect(result.contract.value).toBe(100000);
    });
  });
});