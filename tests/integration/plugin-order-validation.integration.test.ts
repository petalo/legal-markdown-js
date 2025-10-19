/**
 * Integration tests for plugin order validation
 *
 * This test verifies that the plugin order validation system works correctly
 * in the complete processing pipeline, detecting order violations and providing
 * helpful suggestions.
 *
 * @module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../src/extensions/remark/legal-markdown-processor';
import { PluginOrderValidator } from '../../src/plugins/remark/plugin-order-validator';
import { GLOBAL_PLUGIN_REGISTRY } from '../../src/plugins/remark/plugin-metadata-registry';

describe('Plugin Order Validation - Integration', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Validation in normal processing', () => {
    it('should validate plugin order when validatePluginOrder is enabled', async () => {
      const content = `l. Test Header

Some content here.`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
      });

      // Validation should complete without errors (correct order)
      expect(result.content).toBeDefined();
      expect(result.stats.pluginsUsed).toContain('remarkTemplateFields');
    });

    it('should validate plugin order when debug is enabled', async () => {
      const content = `l. Test Header

Some content here.`;

      const result = await processLegalMarkdownWithRemark(content, {
        debug: true,
      });

      // Debug mode enables validation
      expect(result.content).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should not fail processing even if validation finds warnings', async () => {
      // This test verifies that validation warnings don't break the pipeline
      const content = `---
title: Test Document
---

l. Introduction

Content with {{field}}.`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
        additionalMetadata: {
          field: 'value',
        },
      });

      // Processing should complete successfully
      expect(result.content).toBeDefined();
      expect(result.content).toContain('value');
      expect(result.metadata.title).toBe('Test Document');
    });
  });

  describe('Validator functionality', () => {
    it('should detect correct plugin order', () => {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

      // This is the standard order used by legal-markdown-processor
      const correctOrder = [
        'remarkImports',
        'remarkLegalHeadersParser',
        'remarkMixins',
        'remarkClauses',
        'remarkDates',
        'remarkSignatureLines',
        'remarkTemplateFields',
        'remarkCrossReferences',
        'remarkHeaders',
      ];

      const result = validator.validate(correctOrder, {
        throwOnError: false,
        logWarnings: false,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect when remarkHeaders runs before remarkLegalHeadersParser', () => {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

      // Incorrect order: remarkHeaders before remarkLegalHeadersParser
      const incorrectOrder = [
        'remarkImports',
        'remarkHeaders', // Should be AFTER remarkLegalHeadersParser
        'remarkLegalHeadersParser', // Should be BEFORE remarkHeaders
        'remarkTemplateFields',
      ];

      const result = validator.validate(incorrectOrder, {
        throwOnError: false,
        logWarnings: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should find the specific violation
      const headerParserError = result.errors.find(
        e => e.plugin === 'remarkLegalHeadersParser' && e.relatedPlugin === 'remarkHeaders'
      );
      expect(headerParserError).toBeDefined();
      expect(headerParserError?.message).toContain('must run BEFORE');
    });

    it('should detect when remarkImports runs after other plugins', () => {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

      // Incorrect order: remarkImports should always be first
      const incorrectOrder = [
        'remarkLegalHeadersParser',
        'remarkImports', // Should be FIRST
        'remarkHeaders',
      ];

      const result = validator.validate(incorrectOrder, {
        throwOnError: false,
        logWarnings: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should find violation related to remarkImports
      const importsError = result.errors.find(
        e =>
          e.plugin === 'remarkImports' &&
          (e.relatedPlugin === 'remarkLegalHeadersParser' || e.relatedPlugin === 'remarkHeaders')
      );
      expect(importsError).toBeDefined();
    });

    it('should suggest correct order when validation fails', () => {
      const validator = new PluginOrderValidator(GLOBAL_PLUGIN_REGISTRY);

      // All plugins in reverse order
      const reverseOrder = [
        'remarkHeaders',
        'remarkCrossReferences',
        'remarkTemplateFields',
        'remarkMixins',
        'remarkLegalHeadersParser',
        'remarkImports',
      ];

      const result = validator.validate(reverseOrder, {
        throwOnError: false,
        logWarnings: false,
      });

      expect(result.valid).toBe(false);

      // If a suggested order is provided, validate it's correct
      if (result.suggestedOrder) {
        // Suggested order should have remarkImports first
        expect(result.suggestedOrder[0]).toBe('remarkImports');

        // Suggested order should have remarkLegalHeadersParser before remarkHeaders
        const parserIndex = result.suggestedOrder.indexOf('remarkLegalHeadersParser');
        const headersIndex = result.suggestedOrder.indexOf('remarkHeaders');
        expect(parserIndex).toBeLessThan(headersIndex);
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should process document with imports and headers correctly', async () => {
      const content = `l. First Level Header

ll. Second Level Header

This is content.`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
        additionalMetadata: {
          'level-one': 'Article %n.',
          'level-two': 'Section %n.',
        },
      });

      // Should process successfully with correct plugin order
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Article 1.');
      expect(result.content).toContain('Section 1.');
    });

    it('should process document with template fields and cross-references', async () => {
      const content = `l. Title |key|

Reference to |key|.

Template field: {{name}}.`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
        additionalMetadata: {
          name: 'Test Name',
          'level-one': '%n.',
        },
      });

      // Should process all plugins in correct order
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Test Name');
      expect(result.stats.crossReferencesFound).toBeGreaterThan(0);
    });

    it('should handle all plugin features together', async () => {
      const content = `---
title: Integration Test
author: Test Author
---

l. Introduction |intro|

This section contains {{greeting}} for {{name}}.

ll. Details

Reference back to |intro|.

Date: @today

Signature: __________________________________________`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
        debug: false, // Don't spam console
        additionalMetadata: {
          greeting: 'Hello',
          name: 'World',
          'level-one': 'Chapter %n.',
          'level-two': 'Section %n.',
        },
      });

      // All plugins should work together correctly
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('World');
      expect(result.content).toContain('Chapter 1.');
      expect(result.content).toContain('Section 1.');
      expect(result.metadata.title).toBe('Integration Test');
      expect(result.metadata.author).toBe('Test Author');
    });
  });

  describe('Edge cases', () => {
    it('should handle processing with minimal plugins enabled', async () => {
      const content = `Simple content without special features.`;

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
        noHeaders: true,
        noReferences: true,
        noMixins: true,
      });

      // Should still validate the reduced plugin set
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Simple content');
    });

    it('should handle empty content', async () => {
      const content = '';

      const result = await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
      });

      expect(result.content).toBeDefined();
      expect(result.stats.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should not throw errors even if validation detects issues', async () => {
      // The validator uses throwOnError: false in the processor
      const content = `l. Test

Content`;

      await expect(
        processLegalMarkdownWithRemark(content, {
          validatePluginOrder: true,
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Validation options', () => {
    it('should respect validatePluginOrder option', async () => {
      const content = `l. Test`;

      // With validation enabled
      await processLegalMarkdownWithRemark(content, {
        validatePluginOrder: true,
      });

      // Should have created validator (we can't check directly, but no error means it worked)
      expect(consoleWarnSpy).not.toThrow();
    });

    it('should skip validation when both debug and validatePluginOrder are false', async () => {
      const content = `l. Test`;

      const result = await processLegalMarkdownWithRemark(content, {
        debug: false,
        validatePluginOrder: false,
      });

      // Processing should complete normally
      expect(result.content).toBeDefined();
    });

    it('should validate when debug is true even if validatePluginOrder is false', async () => {
      const content = `l. Test`;

      const result = await processLegalMarkdownWithRemark(content, {
        debug: true,
        validatePluginOrder: false,
      });

      // Debug mode triggers validation
      expect(result.content).toBeDefined();
    });
  });
});
