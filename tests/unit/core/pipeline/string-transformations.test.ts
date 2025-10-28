/**
 * Unit tests for Phase 2: String Transformations
 *
 * These tests verify that string-level transformations correctly process patterns
 * before remark AST parsing.
 *
 * @see src/core/pipeline/string-transformations.ts
 * @see Issue #149
 */

import { describe, it, expect } from 'vitest';
import { applyStringTransformations } from '../../../../src/core/pipeline/string-transformations';

describe('String Transformations', () => {
  describe('applyStringTransformations', () => {
    it('should process simple content without transformations', async () => {
      const content = 'Simple markdown content';
      const result = await applyStringTransformations(content, {
        metadata: {},
      });

      expect(result.content).toBe(content);
      expect(result.metadata).toBeDefined();
    });

    it('should preserve content when no transformations apply', async () => {
      const content = `# Title

Normal paragraph text.

- List item 1
- List item 2
`;

      const result = await applyStringTransformations(content, {
        metadata: {},
      });

      expect(result.content).toBe(content);
    });
  });

  describe('Optional Clauses', () => {
    it('should include optional clause when condition is true', async () => {
      const content = '[Optional content]{showThis}';
      const metadata = { showThis: true };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toBe('Optional content');
    });

    it('should exclude optional clause when condition is false', async () => {
      const content = '[Optional content]{showThis}';
      const metadata = { showThis: false };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toBe('');
    });

    it('should exclude optional clause when condition is undefined', async () => {
      const content = '[Optional content]{showThis}';
      const metadata = {};

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toBe('');
    });

    it('should handle multi-line optional clauses', async () => {
      const content = `[Line 1
Line 2
Line 3]{includeLines}`;
      const metadata = { includeLines: true };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toBe(`Line 1
Line 2
Line 3`);
    });

    it('should handle optional clauses with markdown formatting', async () => {
      const content = '[l. **Warranties**\n\nThe seller provides warranties.]{includeWarranties}';
      const metadata = { includeWarranties: true };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toContain('**Warranties**');
      expect(result.content).toContain('The seller provides warranties.');
    });

    it('should handle multiple optional clauses', async () => {
      const content = `[First clause]{showFirst}

[Second clause]{showSecond}

[Third clause]{showThird}`;
      const metadata = {
        showFirst: true,
        showSecond: false,
        showThird: true,
      };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.content).toContain('First clause');
      expect(result.content).not.toContain('Second clause');
      expect(result.content).toContain('Third clause');
    });

    it('should respect noClauses flag', async () => {
      const content = '[Optional content]{showThis}';
      const metadata = { showThis: true };

      const result = await applyStringTransformations(content, {
        metadata,
        noClauses: true,
      });

      // Should keep original pattern when noClauses is true
      expect(result.content).toBe('[Optional content]{showThis}');
    });
  });

  describe('Template Loops', () => {
    it('should expand simple Handlebars each loop', async () => {
      const content = `{{#each items}}
- {{name}}
{{/each}}`;
      const metadata = {
        items: [{ name: 'Item 1' }, { name: 'Item 2' }],
      };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Item 2');
    });

    it('should expand Handlebars if conditional', async () => {
      const content = `{{#if showContent}}
Conditional content
{{/if}}`;
      const metadata = { showContent: true };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).toContain('Conditional content');
    });

    it('should remove content when if conditional is false', async () => {
      const content = `{{#if showContent}}
Conditional content
{{/if}}`;
      const metadata = { showContent: false };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).not.toContain('Conditional content');
    });

    it('should handle nested loops', async () => {
      const content = `{{#each items}}
- {{name}}
  {{#each subitems}}
  - {{name}}
  {{/each}}
{{/each}}`;
      const metadata = {
        items: [
          {
            name: 'Item 1',
            subitems: [{ name: 'Sub 1.1' }, { name: 'Sub 1.2' }],
          },
        ],
      };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Sub 1.1');
      expect(result.content).toContain('Sub 1.2');
    });
  });

  describe('Transformation Order', () => {
    it('should apply transformations in correct order', async () => {
      // This tests that optional clauses are processed before template loops
      const content = `[{{#each items}}
- {{name}}
{{/each}}]{includeList}`;
      const metadata = {
        includeList: true,
        items: [{ name: 'Item 1' }],
      };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      // Optional clause should be processed first, then loop expansion
      expect(result.content).toContain('Item 1');
    });

    it('should process optional clauses before loops', async () => {
      // Template loop inside optional clause
      const content = '[Loop: {{#each items}}{{name}} {{/each}}]{showLoop}';
      const metadata = {
        showLoop: true,
        items: [{ name: 'A' }, { name: 'B' }],
      };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).toContain('A');
      expect(result.content).toContain('B');
    });
  });

  describe('Metadata Handling', () => {
    it('should preserve original metadata', async () => {
      const content = 'Test content';
      const metadata = { key1: 'value1', key2: 'value2' };

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.metadata.key1).toBe('value1');
      expect(result.metadata.key2).toBe('value2');
    });

    it('should add field mappings to metadata', async () => {
      const content = 'Test content';
      const metadata = {};

      const result = await applyStringTransformations(content, {
        metadata,
      });

      expect(result.metadata._field_mappings).toBeDefined();
      expect(result.metadata._field_mappings instanceof Map).toBe(true);
    });

    it('should not mutate input metadata', async () => {
      const content = 'Test content';
      const metadata = { key: 'value' };
      const originalMetadata = { ...metadata };

      await applyStringTransformations(content, {
        metadata,
      });

      // Original metadata should not be mutated
      expect(metadata).toEqual(originalMetadata);
    });
  });

  describe('Debug Mode', () => {
    it('should accept debug option without errors', async () => {
      const content = '[Optional]{show}';
      const metadata = { show: true };

      const result = await applyStringTransformations(content, {
        metadata,
        debug: true,
      });

      expect(result.content).toBe('Optional');
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle document with multiple transformation types', async () => {
      const content = `# Document Title

[l. **Warranties**

The following warranties apply:
{{#each warranties}}
- {{name}}: {{description}}
{{/each}}]{includeWarranties}

[l. **Limitations**

{{#if hasLimitations}}
Limitations apply.
{{/if}}]{includeLimitations}`;

      const metadata = {
        includeWarranties: true,
        includeLimitations: false,
        warranties: [
          { name: 'Warranty 1', description: 'Description 1' },
          { name: 'Warranty 2', description: 'Description 2' },
        ],
        hasLimitations: true,
      };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      // Warranties section should be included and expanded
      expect(result.content).toContain('Warranties');
      expect(result.content).toContain('Warranty 1');
      expect(result.content).toContain('Description 1');
      expect(result.content).toContain('Warranty 2');

      // Limitations section should be excluded
      expect(result.content).not.toContain('Limitations');
      expect(result.content).not.toContain('Limitations apply');
    });

    it('should handle empty arrays in loops', async () => {
      const content = `{{#each items}}
- {{name}}
{{/each}}`;
      const metadata = { items: [] };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      // Empty loop should produce empty content
      expect(result.content.trim()).toBe('');
    });

    it('should handle missing metadata gracefully', async () => {
      const content = '{{#if undefinedVar}}Content{{/if}}';
      const metadata = {};

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      // Should not include content when variable is undefined
      expect(result.content).not.toContain('Content');
    });
  });

  describe('Field Tracking', () => {
    it('should pass enableFieldTracking to template loops', async () => {
      const content = '{{#each items}}{{name}}{{/each}}';
      const metadata = { items: [{ name: 'Test' }] };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: true,
      });

      // When field tracking is enabled, output should contain tracking spans
      expect(result.content).toContain('Test');
    });

    it('should work without field tracking', async () => {
      const content = '{{#each items}}{{name}}{{/each}}';
      const metadata = { items: [{ name: 'Test' }] };

      const result = await applyStringTransformations(content, {
        metadata,
        enableFieldTracking: false,
      });

      expect(result.content).toContain('Test');
    });
  });
});
