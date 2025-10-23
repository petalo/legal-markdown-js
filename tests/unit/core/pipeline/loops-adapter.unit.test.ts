/**
 * Tests for Template Loops Adapter
 *
 * Verifies that the loops adapter correctly wraps processTemplateLoops
 * and integrates it into the remark pipeline.
 */

import { describe, it, expect } from 'vitest';
import { templateLoopsAdapter, remarkTemplateLoops } from '../../../../src/core/pipeline/loops-adapter';

describe('Template Loops Adapter', () => {
  describe('templateLoopsAdapter', () => {
    it('should have correct name', () => {
      expect(templateLoopsAdapter.name).toBe('processTemplateLoops');
    });

    it('should execute simple loop expansion', () => {
      const content = '{{#items}}Item: {{name}}\n{{/items}}';
      const metadata = {
        items: [
          { name: 'First' },
          { name: 'Second' },
        ],
      };

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toContain('Item: First');
      expect(result).toContain('Item: Second');
    });

    it('should execute conditional expansion', () => {
      const content = '{{#if active}}Active{{else}}Inactive{{/if}}';
      const metadata = { active: true };

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toContain('Active');
      expect(result).not.toContain('Inactive');
    });

    it('should handle enableFieldTracking option', () => {
      const content = '{{#if test}}Success{{/if}}';
      const metadata = { test: true };

      // With tracking enabled (default)
      const resultWithTracking = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: true,
      });
      expect(resultWithTracking).toContain('Success');

      // With tracking disabled
      const resultWithoutTracking = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });
      expect(resultWithoutTracking).toContain('Success');
    });

    it('should default enableFieldTracking to true', () => {
      const content = '{{#items}}{{name}}{{/items}}';
      const metadata = { items: [{ name: 'Test' }] };

      const result = templateLoopsAdapter.execute(content, metadata, {});

      // With default (true), tracking is enabled and fields are expanded with HTML spans
      // The loop expands AND template fields are replaced with tracking spans
      expect(result).toContain('Test'); // Value is expanded
      expect(result).toContain('<span class="imported-value"'); // Tracking span added
      expect(result).toContain('data-field="name"'); // Field tracking metadata
    });

    it('should handle nested loops', () => {
      const content = '{{#items}}{{#subitems}}{{value}} {{/subitems}}{{/items}}';
      const metadata = {
        items: [
          { subitems: [{ value: 'A' }, { value: 'B' }] },
          { subitems: [{ value: 'C' }] },
        ],
      };

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('C');
    });

    it('should handle empty arrays', () => {
      const content = '{{#items}}Item{{/items}}Default';
      const metadata = { items: [] };

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toBe('Default');
      expect(result).not.toContain('Item');
    });

    it('should handle missing metadata keys', () => {
      const content = '{{#missing}}Content{{/missing}}';
      const metadata = {};

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toBe('');
    });

    it('should handle complex conditionals with comparisons', () => {
      const content = '{{#if count > 5}}Many{{else}}Few{{/if}}';
      const metadata = { count: 10 };

      const result = templateLoopsAdapter.execute(content, metadata, {
        enableFieldTracking: false,
      });

      expect(result).toContain('Many');
      expect(result).not.toContain('Few');
    });

    it('should pass through debug option', () => {
      const content = '{{#if test}}Result{{/if}}';
      const metadata = { test: true };

      // Should not throw with debug enabled
      expect(() => {
        templateLoopsAdapter.execute(content, metadata, {
          debug: true,
          enableFieldTracking: false,
        });
      }).not.toThrow();
    });
  });

  describe('remarkTemplateLoops plugin', () => {
    it('should be a function', () => {
      expect(typeof remarkTemplateLoops).toBe('function');
    });

    it('should be callable as a remark plugin', () => {
      // The plugin should accept options
      const plugin = remarkTemplateLoops({ metadata: {}, enableFieldTracking: false });
      expect(typeof plugin).toBe('function');
    });
  });
});
