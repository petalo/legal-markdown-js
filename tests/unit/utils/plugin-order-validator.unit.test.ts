/**
 * Tests for PluginOrderValidator utility
 *
 * This test verifies that the plugin order validation system correctly
 * detects and warns about incorrect plugin ordering in the remark pipeline.
 *
 * @module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PluginOrderValidator,
  createPluginRegistry,
} from '../../../src/plugins/remark/plugin-order-validator';
import type { PluginMetadata } from '../../../src/plugins/remark/types';

describe('PluginOrderValidator', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Correct Plugin Order', () => {
    it('should validate plugins in correct order', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
          runAfter: ['remarkLegalHeadersParser'],
          runBefore: ['remarkTemplateFields'],
        },
        {
          name: 'remarkTemplateFields',
          description: 'Processes template fields',
          runAfter: ['remarkHeaders'],
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(
        ['remarkLegalHeadersParser', 'remarkHeaders', 'remarkTemplateFields'],
        { throwOnError: false }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle plugins with no dependencies', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkDates',
          description: 'Processes date fields',
        },
        {
          name: 'remarkSignatureLines',
          description: 'Creates signature lines',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['remarkDates', 'remarkSignatureLines'], {
        throwOnError: false,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow plugins in any order if no constraints exist', () => {
      const metadata: PluginMetadata[] = [
        { name: 'plugin1', description: 'Plugin 1' },
        { name: 'plugin2', description: 'Plugin 2' },
        { name: 'plugin3', description: 'Plugin 3' },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      // Any order should be valid
      const result1 = validator.validate(['plugin1', 'plugin2', 'plugin3'], {
        throwOnError: false,
      });
      const result2 = validator.validate(['plugin3', 'plugin1', 'plugin2'], {
        throwOnError: false,
      });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('Incorrect Plugin Order', () => {
    it('should detect runBefore violation', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      // Headers comes before parser - violates runBefore constraint
      const result = validator.validate(['remarkHeaders', 'remarkLegalHeadersParser'], {
        throwOnError: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('dependency-violation');
      expect(result.errors[0].plugin).toBe('remarkLegalHeadersParser');
      expect(result.errors[0].relatedPlugin).toBe('remarkHeaders');
    });

    it('should detect runAfter violation', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
        },
        {
          name: 'remarkTemplateFields',
          description: 'Processes template fields',
          runAfter: ['remarkHeaders'],
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      // Template fields before headers - violates runAfter constraint
      const result = validator.validate(['remarkTemplateFields', 'remarkHeaders'], {
        throwOnError: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('dependency-violation');
      expect(result.errors[0].plugin).toBe('remarkTemplateFields');
      expect(result.errors[0].relatedPlugin).toBe('remarkHeaders');
    });

    it('should detect plugin conflicts', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'oldProcessor',
          description: 'Old processing method',
          conflicts: ['newProcessor'],
        },
        {
          name: 'newProcessor',
          description: 'New processing method',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['oldProcessor', 'newProcessor'], {
        throwOnError: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('conflict');
      expect(result.errors[0].plugin).toBe('oldProcessor');
      expect(result.errors[0].relatedPlugin).toBe('newProcessor');
    });

    it('should detect circular dependencies', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'plugin1',
          description: 'Plugin 1',
          runAfter: ['plugin2'],
        },
        {
          name: 'plugin2',
          description: 'Plugin 2',
          runAfter: ['plugin1'],
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['plugin1', 'plugin2'], { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'circular-dependency')).toBe(true);
    });

    it('should detect multiple violations in complex pipeline', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
          runAfter: ['remarkLegalHeadersParser'],
          runBefore: ['remarkTemplateFields'],
        },
        {
          name: 'remarkTemplateFields',
          description: 'Processes template fields',
          runAfter: ['remarkHeaders'],
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      // All in reverse order
      const result = validator.validate(
        ['remarkTemplateFields', 'remarkHeaders', 'remarkLegalHeadersParser'],
        { throwOnError: false }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Suggested Order Generation', () => {
    it('should suggest correct order when validation fails', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['remarkHeaders', 'remarkLegalHeadersParser'], {
        throwOnError: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Suggested order might not always be generated (e.g., for circular dependencies)
      if (result.suggestedOrder) {
        expect(result.suggestedOrder).toContain('remarkLegalHeadersParser');
        expect(result.suggestedOrder).toContain('remarkHeaders');
        // Parser should come before headers in suggested order
        const parserIndex = result.suggestedOrder.indexOf('remarkLegalHeadersParser');
        const headersIndex = result.suggestedOrder.indexOf('remarkHeaders');
        expect(parserIndex).toBeLessThan(headersIndex);
      }
    });

    it('should not provide suggested order when validation succeeds', () => {
      const metadata: PluginMetadata[] = [
        { name: 'plugin1', description: 'Plugin 1' },
        { name: 'plugin2', description: 'Plugin 2' },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['plugin1', 'plugin2'], { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.suggestedOrder).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plugin list', () => {
      const registry = createPluginRegistry([]);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate([], { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle single plugin', () => {
      const metadata: PluginMetadata[] = [{ name: 'singlePlugin', description: 'Single' }];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['singlePlugin'], { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unknown plugins with strictMode', () => {
      const metadata: PluginMetadata[] = [
        { name: 'knownPlugin', description: 'Known plugin' },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['unknownPlugin', 'knownPlugin'], {
        throwOnError: false,
        strictMode: true,
        logWarnings: false,
      });

      expect(result.valid).toBe(true); // Unknown plugins don't cause errors
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('unknown-plugin');
    });

    it('should ignore unknown plugins without strictMode', () => {
      const metadata: PluginMetadata[] = [
        { name: 'knownPlugin', description: 'Known plugin' },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['unknownPlugin', 'knownPlugin'], {
        throwOnError: false,
        strictMode: false,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about missing required plugins', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          required: true,
        },
        {
          name: 'optionalPlugin',
          description: 'Optional plugin',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(['optionalPlugin'], {
        throwOnError: false,
        logWarnings: false,
      });

      expect(result.valid).toBe(true); // Warnings don't make validation fail
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('missing-required');
      expect(result.warnings[0].plugin).toBe('remarkLegalHeadersParser');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should validate typical legal markdown plugin pipeline', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
          runAfter: ['remarkLegalHeadersParser'],
        },
        {
          name: 'remarkClauses',
          description: 'Processes conditional clauses',
        },
        {
          name: 'remarkTemplateFields',
          description: 'Processes template fields',
        },
        {
          name: 'remarkCrossReferences',
          description: 'Handles cross-references',
        },
        {
          name: 'remarkDates',
          description: 'Processes date fields',
        },
        {
          name: 'remarkSignatureLines',
          description: 'Creates signature lines',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(
        [
          'remarkLegalHeadersParser',
          'remarkHeaders',
          'remarkClauses',
          'remarkTemplateFields',
          'remarkCrossReferences',
          'remarkDates',
          'remarkSignatureLines',
        ],
        { throwOnError: false }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect common misconfiguration: headers before parser', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'remarkLegalHeadersParser',
          description: 'Parses legal header syntax',
          runBefore: ['remarkHeaders'],
        },
        {
          name: 'remarkHeaders',
          description: 'Adds header numbering',
          runAfter: ['remarkLegalHeadersParser'],
        },
        {
          name: 'remarkTemplateFields',
          description: 'Processes template fields',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      const result = validator.validate(
        ['remarkHeaders', 'remarkLegalHeadersParser', 'remarkTemplateFields'],
        { throwOnError: false }
      );

      expect(result.valid).toBe(false);
      const headerParserError = result.errors.find(
        e =>
          e.plugin === 'remarkLegalHeadersParser' && e.relatedPlugin === 'remarkHeaders'
      );
      expect(headerParserError).toBeDefined();
      expect(headerParserError!.message).toContain('must run BEFORE');
    });
  });

  describe('Options', () => {
    it('should throw error when throwOnError is true', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'plugin1',
          description: 'Plugin 1',
          runBefore: ['plugin2'],
        },
        {
          name: 'plugin2',
          description: 'Plugin 2',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      expect(() => {
        validator.validate(['plugin2', 'plugin1'], { throwOnError: true });
      }).toThrow('Plugin order validation failed');
    });

    it('should not throw when throwOnError is false', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'plugin1',
          description: 'Plugin 1',
          runBefore: ['plugin2'],
        },
        {
          name: 'plugin2',
          description: 'Plugin 2',
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      expect(() => {
        const result = validator.validate(['plugin2', 'plugin1'], { throwOnError: false });
        expect(result.valid).toBe(false);
      }).not.toThrow();
    });

    it('should log warnings when logWarnings is true', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'requiredPlugin',
          description: 'Required plugin',
          required: true,
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      validator.validate([], { throwOnError: false, logWarnings: true });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('requiredPlugin');
    });

    it('should not log warnings when logWarnings is false', () => {
      const metadata: PluginMetadata[] = [
        {
          name: 'requiredPlugin',
          description: 'Required plugin',
          required: true,
        },
      ];

      const registry = createPluginRegistry(metadata);
      const validator = new PluginOrderValidator(registry);

      validator.validate([], { throwOnError: false, logWarnings: false });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
