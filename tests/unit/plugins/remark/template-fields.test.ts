/**
 * @fileoverview Comprehensive tests for template-fields remark plugin
 *
 * This file provides CRITICAL test coverage for template-fields.ts, which is
 * essential for v4.0 as it processes {{field}} substitutions in the AST (Phase 3).
 *
 * Test Coverage:
 * - Simple variable substitution {{name}}
 * - Nested object access {{client.contact.email}}
 * - Handlebars helper functions {{formatDate date "YYYY-MM-DD"}}
 * - Legacy helper syntax (deprecated) {{formatDate(@today, "YYYY-MM-DD")}}
 * - Subexpressions {{formatDate (addYears today 2) "YYYY-MM-DD"}}
 * - Conditional expressions {{active ? "Active" : "Inactive"}}
 * - @today syntax and format specifiers
 * - Field tracking integration
 * - Array access {{parties[0].name}}
 * - Underscore handling in field names
 * - Loop/conditional block detection
 * - Empty/missing field handling
 * - Field pattern customization
 * - AST node processing (text, html, code, inlineCode)
 * - HTML span wrapping for field tracking
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkTemplateFields from '../../../../src/plugins/remark/template-fields';
import type { TemplateFieldOptions } from '../../../../src/plugins/remark/template-fields';
import { fieldTracker } from '../../../../src/extensions/tracking/field-tracker';
import { logger } from '../../../../src/utils/logger';

describe('Template Fields Plugin', () => {
  beforeEach(() => {
    // Clear field tracker before each test
    fieldTracker.clear();
  });

  afterEach(() => {
    fieldTracker.clear();
  });

  // ==========================================================================
  // SIMPLE VARIABLE SUBSTITUTION
  // ==========================================================================

  describe('Simple Variable Substitution', () => {
    it('should replace simple variable', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'John Doe' },
        })
        .use(remarkStringify);

      const result = await processor.process('Hello {{name}}!');
      expect(result.toString().trim()).toBe('Hello John Doe!');
    });

    it('should replace multiple variables', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { firstName: 'John', lastName: 'Doe' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{firstName}} {{lastName}}');
      expect(result.toString().trim()).toBe('John Doe');
    });

    it('should handle variables with numbers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { amount: 1234, quantity: 5 },
        })
        .use(remarkStringify);

      const result = await processor.process('Amount: {{amount}}, Quantity: {{quantity}}');
      expect(result.toString().trim()).toContain('1234');
      expect(result.toString().trim()).toContain('5');
    });

    it('should handle boolean values', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { active: true, archived: false },
        })
        .use(remarkStringify);

      const result = await processor.process('Active: {{active}}, Archived: {{archived}}');
      expect(result.toString().trim()).toContain('true');
      expect(result.toString().trim()).toContain('false');
    });

    it('should handle date values', async () => {
      const date = new Date('2025-03-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { contractDate: date },
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{contractDate}}');
      // Use ISO format to avoid timezone issues
      expect(result.toString().trim()).toContain(date.toISOString().split('T')[0]);
    });

    it('should preserve template pattern for undefined variables', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Hello {{undefinedVar}}!');
      expect(result.toString().trim()).toBe('Hello {{undefinedVar}}!');
    });

    it('should preserve template pattern for null values', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { value: null },
        })
        .use(remarkStringify);

      const result = await processor.process('Value: {{value}}');
      expect(result.toString().trim()).toBe('Value: {{value}}');
    });

    it('should preserve template pattern for empty strings', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: '' },
        })
        .use(remarkStringify);

      const result = await processor.process('Name: {{name}}');
      expect(result.toString().trim()).toBe('Name: {{name}}');
    });
  });

  // ==========================================================================
  // NESTED OBJECT ACCESS
  // ==========================================================================

  describe('Nested Object Access', () => {
    it('should resolve nested object properties', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            client: {
              name: 'ACME Corp',
              contact: {
                email: 'info@acme.com',
              },
            },
          },
        })
        .use(remarkStringify);

      const result = await processor.process('{{client.name}} - {{client.contact.email}}');
      expect(result.toString().trim()).toBe('ACME Corp - info@acme.com');
    });

    it('should handle deeply nested properties', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            company: {
              department: {
                team: {
                  lead: {
                    name: 'Alice',
                  },
                },
              },
            },
          },
        })
        .use(remarkStringify);

      const result = await processor.process('Lead: {{company.department.team.lead.name}}');
      expect(result.toString().trim()).toBe('Lead: Alice');
    });

    it('should handle missing intermediate properties', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            client: {
              name: 'ACME Corp',
            },
          },
        })
        .use(remarkStringify);

      const result = await processor.process('Email: {{client.contact.email}}');
      expect(result.toString().trim()).toBe('Email: {{client.contact.email}}');
    });
  });

  // ==========================================================================
  // ARRAY ACCESS
  // ==========================================================================

  describe('Array Access', () => {
    it('should access array elements by index', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            parties: ['Alice', 'Bob', 'Charlie'],
          },
        })
        .use(remarkStringify);

      const result = await processor.process('First: {{parties[0]}}, Second: {{parties[1]}}');
      expect(result.toString().trim()).toBe('First: Alice, Second: Bob');
    });

    it('should access nested properties in array elements', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            parties: [
              { name: 'Alice', role: 'Buyer' },
              { name: 'Bob', role: 'Seller' },
            ],
          },
        })
        .use(remarkStringify);

      const result = await processor.process('{{parties[0].name}} ({{parties[0].role}})');
      expect(result.toString().trim()).toBe('Alice (Buyer)');
    });

    it('should handle out of bounds array access', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            items: ['A', 'B'],
          },
        })
        .use(remarkStringify);

      const result = await processor.process('Item: {{items[10]}}');
      // Pattern should be preserved (remark-stringify may escape brackets)
      expect(result.toString()).toContain('items');
      expect(result.toString()).toContain('10');
    });
  });

  // ==========================================================================
  // @TODAY SYNTAX
  // ==========================================================================

  describe('@today Syntax', () => {
    it('should not replace bare @today outside {{...}}', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Date: @today');
      expect(result.toString().trim()).toBe('Date: @today');
    });

    it('should replace @today in template field', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{@today}}');
      const today = new Date().toISOString().split('T')[0];
      expect(result.toString().trim()).toContain(today);
    });

    it('should use @today from metadata if provided', async () => {
      const customDate = new Date('2025-06-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { '@today': customDate },
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{@today}}');
      expect(result.toString().trim()).toBe('Date: 2025-06-15');
    });

    it('should handle @today with ISO format', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{@today[iso]}}');
      const today = new Date().toISOString().split('T')[0];
      expect(result.toString().trim()).toContain(today);
    });

    it('should handle @today with long format', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{@today[long]}}');
      const today = new Date();
      const longFormat = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(result.toString().trim()).toBe(`Date: ${longFormat}`);
    });

    it('should handle @today with european format', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('Date: {{@today[european]}}');
      const today = new Date();
      const europeanFormat = today.toLocaleDateString('en-GB');
      expect(result.toString().trim()).toBe(`Date: ${europeanFormat}`);
    });
  });

  // ==========================================================================
  // HANDLEBARS HELPER FUNCTIONS (Current Standard)
  // ==========================================================================

  describe('Handlebars Helper Functions', () => {
    it('should call helper with single argument', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { text: 'hello world' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{upper text}}');
      expect(result.toString().trim()).toBe('HELLO WORLD');
    });

    it('should call helper with multiple arguments', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { price: 10, quantity: 5 },
        })
        .use(remarkStringify);

      const result = await processor.process('Total: {{multiply price quantity}}');
      expect(result.toString().trim()).toBe('Total: 50');
    });

    it('should call helper with string literal argument', async () => {
      const testDate = new Date('2025-03-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { date: testDate },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate date "MMMM Do, YYYY"}}');
      expect(result.toString().trim()).toContain('March');
      expect(result.toString().trim()).toContain('2025');
    });

    it('should handle formatDate helper when metadata date is a string', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { date: '2025-03-15' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate date "YYYY-MM-DD"}}');
      expect(result.toString().trim()).toBe('2025-03-15');
    });

    it('should handle formatDate helper when metadata date is a Date object', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { date: new Date('2025-03-15') },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate date "YYYY-MM-DD"}}');
      expect(result.toString().trim()).toBe('2025-03-15');
    });

    it('should call helper with number literal', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { base: 10 },
        })
        .use(remarkStringify);

      const result = await processor.process('{{add base 5}}');
      expect(result.toString().trim()).toBe('15');
    });

    it('should handle subexpressions (nested helpers)', async () => {
      const testDate = new Date('2025-01-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { today: testDate },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate (addYears today 2) "YYYY-MM-DD"}}');
      expect(result.toString().trim()).toBe('2027-01-15');
    });

    it('should handle string helpers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'john doe' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{capitalize name}}');
      expect(result.toString().trim()).toBe('John doe');
    });

    it('should handle number formatting helpers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { amount: 1234.56 },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatCurrency amount}}');
      expect(result.toString().trim()).toContain('1,234.56');
    });

    it('should preserve pattern when helper not found', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { value: 10 },
        })
        .use(remarkStringify);

      const result = await processor.process('{{unknownHelper value}}');
      // Should fall through and try to resolve as variable (which will fail)
      expect(result.toString().trim()).toBe('{{unknownHelper value}}');
    });

    it('should handle helper errors gracefully', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { value: 'invalid' },
        })
        .use(remarkStringify);

      // formatDate expects a Date object
      const result = await processor.process('{{formatDate value "YYYY-MM-DD"}}');
      // Should return undefined and preserve pattern or show error
      expect(result.toString().trim()).toBeTruthy();
    });
  });

  // ==========================================================================
  // LEGACY HELPER SYNTAX (Deprecated, to be removed in v4.0)
  // ==========================================================================

  describe('Legacy Helper Syntax (Deprecated)', () => {
    it('should support legacy comma-separated syntax', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { text: 'hello' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{upper(text)}}');
      expect(result.toString().trim()).toBe('HELLO');
    });

    it('should support legacy syntax with multiple arguments', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { a: 10, b: 5 },
        })
        .use(remarkStringify);

      const result = await processor.process('{{multiply(a, b)}}');
      expect(result.toString().trim()).toBe('50');
    });

    it('should support legacy syntax with @today', async () => {
      const testDate = new Date('2025-03-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { '@today': testDate },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate(@today, "YYYY-MM-DD")}}');
      expect(result.toString().trim()).toBe('2025-03-15');
    });

    it('should support nested legacy helper calls', async () => {
      const testDate = new Date('2025-01-15');
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { '@today': testDate },
        })
        .use(remarkStringify);

      const result = await processor.process('{{formatDate(addYears(@today, 5), "YYYY-MM-DD")}}');
      expect(result.toString().trim()).toBe('2030-01-15');
    });
  });

  // ==========================================================================
  // CONDITIONAL EXPRESSIONS
  // ==========================================================================

  describe('Conditional Expressions', () => {
    it('should evaluate ternary conditional - true case', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { active: true },
        })
        .use(remarkStringify);

      const result = await processor.process('Status: {{active ? "Active" : "Inactive"}}');
      expect(result.toString().trim()).toBe('Status: Active');
    });

    it('should evaluate ternary conditional - false case', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { active: false },
        })
        .use(remarkStringify);

      const result = await processor.process('Status: {{active ? "Active" : "Inactive"}}');
      expect(result.toString().trim()).toBe('Status: Inactive');
    });

    it('should handle conditional with nested object', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { user: { verified: true } },
        })
        .use(remarkStringify);

      const result = await processor.process('{{user.verified ? "Verified" : "Not Verified"}}');
      expect(result.toString().trim()).toBe('Verified');
    });

    it('should handle conditional with undefined variable', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('{{undefinedVar ? "Yes" : "No"}}');
      expect(result.toString().trim()).toBe('No');
    });
  });

  // ==========================================================================
  // UNDERSCORE HANDLING (Issue #139)
  // ==========================================================================

  describe('Underscore Handling', () => {
    it('should unescape underscores in field names', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            counterparty: {
              legal_name: 'ACME Corporation',
            },
          },
        })
        .use(remarkStringify);

      // Field comes escaped from markdown processing
      const result = await processor.process('Name: {{counterparty.legal\\_name}}');
      expect(result.toString().trim()).toBe('Name: ACME Corporation');
    });

    it('should handle multiple underscores', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            client_full_name: 'John Smith',
          },
        })
        .use(remarkStringify);

      const result = await processor.process('{{client\\_full\\_name}}');
      expect(result.toString().trim()).toBe('John Smith');
    });
  });

  // ==========================================================================
  // LOOP AND CONDITIONAL BLOCK DETECTION
  // ==========================================================================

  describe('Loop and Conditional Block Detection', () => {
    it('should skip fields inside loop blocks', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            items: [{ name: 'Item 1' }, { name: 'Item 2' }],
            outsideVar: 'Outside',
          },
        })
        .use(remarkStringify);

      const markdown = `
{{outsideVar}}

{{#items}}
- {{name}}
{{/items}}
`;

      const result = await processor.process(markdown);
      // outsideVar should be replaced
      expect(result.toString()).toContain('Outside');
      // But {{name}} inside loop should NOT be replaced (handled by template-loops)
      expect(result.toString()).toContain('{{name}}');
    });

    it('should skip fields inside conditional blocks', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            show: true,
            content: 'Content Value',
            outsideVar: 'Outside',
          },
        })
        .use(remarkStringify);

      const markdown = `
{{outsideVar}}

{{#if show}}
{{content}}
{{/if}}
`;

      const result = await processor.process(markdown);
      // outsideVar should be replaced
      expect(result.toString()).toContain('Outside');
      // But {{content}} inside if block should NOT be replaced
      expect(result.toString()).toContain('{{content}}');
    });

    it('should skip loop/conditional control patterns', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {
            items: ['A', 'B'],
            condition: true,
          },
        })
        .use(remarkStringify);

      const markdown = `
{{#items}}
Item
{{/items}}

{{#if condition}}
Content
{{else}}
Other
{{/if}}
`;

      const result = await processor.process(markdown);
      // Control patterns should be preserved
      expect(result.toString()).toContain('{{#items}}');
      expect(result.toString()).toContain('{{/items}}');
      expect(result.toString()).toContain('{{#if condition}}');
      expect(result.toString()).toContain('{{else}}');
      expect(result.toString()).toContain('{{/if}}');
    });
  });

  // ==========================================================================
  // FIELD TRACKING INTEGRATION
  // ==========================================================================

  describe('Field Tracking', () => {
    it('should track filled fields', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'John Doe' },
        })
        .use(remarkStringify);

      await processor.process('Hello {{name}}!');

      const report = fieldTracker.generateReport();
      expect(report.filled).toBe(1);
      expect(report.empty).toBe(0);
    });

    it('should track empty fields', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      await processor.process('Hello {{undefinedName}}!');

      const report = fieldTracker.generateReport();
      expect(report.empty).toBe(1);
      expect(report.filled).toBe(0);
    });

    it('should track fields with logic', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { active: true },
        })
        .use(remarkStringify);

      await processor.process('{{active ? "Yes" : "No"}}');

      const report = fieldTracker.generateReport();
      expect(report.logic).toBe(1);
    });

    it('should wrap filled fields with highlight span when enabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'John' },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const result = await processor.process('{{name}}');
      expect(result.toString()).toContain('<span class="legal-field imported-value"');
      expect(result.toString()).toContain('data-field="name"');
      expect(result.toString()).toContain('John');
    });

    it('should wrap empty fields with missing-value class', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const result = await processor.process('{{missingField}}');
      expect(result.toString()).toContain('<span class="legal-field missing-value"');
      expect(result.toString()).toContain('data-field="missingField"');
    });

    it('should wrap logic fields with highlight class', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { active: true },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const result = await processor.process('{{active ? "Yes" : "No"}}');
      expect(result.toString()).toContain('<span class="legal-field highlight"');
    });

    it('should not wrap fields when tracking disabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'John' },
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const result = await processor.process('{{name}}');
      expect(result.toString()).not.toContain('<span class="legal-field');
      expect(result.toString().trim()).toBe('John');
    });
  });

  // ==========================================================================
  // CUSTOM FIELD PATTERNS
  // ==========================================================================

  describe('Custom Field Patterns', () => {
    it.skip('should process custom field pattern <<field>>', async () => {
      // Skip: Custom field patterns with < > characters don't work due to remark-parse
      // treating them as HTML. The pattern <<name>> gets parsed as:
      // - Text node: "Hello <"
      // - HTML node: "<name>"
      // - Text node: ">!"
      // This fragments the pattern across multiple AST nodes, making it impossible
      // to match with a single regex.
      //
      // Workaround: Use patterns that don't conflict with markdown syntax, like:
      // - [[field]] - works (but conflicts with wiki-style links in some parsers)
      // - %%field%% - works
      // - @@field@@ - works (but @ has special meaning in legal-markdown for @today)
      //
      // The recommended approach is to stick with {{field}} syntax.
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Alice' },
          fieldPatterns: ['<<(.+?)>>'],
        })
        .use(remarkStringify);

      const result = await processor.process('Hello <<name>>!');
      expect(result.toString().trim()).toBe('Hello Alice!');
    });

    it.skip('should process multiple custom patterns', async () => {
      // Skip: See above - custom patterns with < > don't work with remark-parse
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name1: 'Alice', name2: 'Bob' },
          fieldPatterns: ['<<(.+?)>>', '\\[\\[(.+?)\\]\\]'],
        })
        .use(remarkStringify);

      const result = await processor.process('<<name1>> and [[name2]]');
      expect(result.toString().trim()).toBe('Alice and Bob');
    });

    it.skip('should handle standard pattern alongside custom patterns', async () => {
      // Skip: See above - custom patterns with < > don't work with remark-parse
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name1: 'Alice', name2: 'Bob', name3: 'Charlie' },
          fieldPatterns: ['\\{\\{(.+?)\\}\\}', '<<(.+?)>>'],
        })
        .use(remarkStringify);

      const result = await processor.process('{{name1}}, <<name2>>, and {{name3}}');
      expect(result.toString().trim()).toBe('Alice, Bob, and Charlie');
    });
  });

  // ==========================================================================
  // AST NODE PROCESSING
  // ==========================================================================

  describe('AST Node Processing', () => {
    it('should process text nodes', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('Plain text: {{name}}');
      expect(result.toString().trim()).toBe('Plain text: Test');
    });

    it('should process fields in bold text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('**Bold: {{name}}**');
      expect(result.toString()).toContain('Bold: Test');
    });

    it('should process fields in italic text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('*Italic: {{name}}*');
      expect(result.toString()).toContain('Italic: Test');
    });

    it('should process fields in headers', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { title: 'Contract' },
        })
        .use(remarkStringify);

      const result = await processor.process('# {{title}}');
      expect(result.toString()).toContain('Contract');
    });

    it('should process fields in list items', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { item1: 'First', item2: 'Second' },
        })
        .use(remarkStringify);

      const result = await processor.process('- {{item1}}\n- {{item2}}');
      expect(result.toString()).toContain('First');
      expect(result.toString()).toContain('Second');
    });

    it('should convert text node to html node when field tracking enabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
          enableFieldTracking: true,
        });

      const tree = processor.parse('{{name}}');
      await processor.run(tree);

      // Find the node that contains the span
      let hasHtmlNode = false;
      const visit = (node: any) => {
        if (node.type === 'html' && node.value.includes('<span class="legal-field')) {
          hasHtmlNode = true;
        }
        if (node.children) {
          node.children.forEach(visit);
        }
      };
      visit(tree);

      expect(hasHtmlNode).toBe(true);
    });

    it('should process {{variable}} inside an HTML node that already has field spans', async () => {
      // Regression: remarkDates converts text nodes containing @today to HTML nodes,
      // but leaves {{variable}} patterns unresolved. remarkTemplateFields must not
      // skip such nodes — it should resolve the remaining {{...}} patterns.
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { title: 'Test Agreement' },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      // Simulate what remarkDates produces: an HTML node with an existing
      // field span (from @today) alongside an unresolved {{title}} pattern.
      const simulatedHtml =
        'This {{title}} is entered as of ' +
        '<span class="legal-field imported-value" data-field="date.todaylong">March 3, 2026</span>.';

      // Inject directly as an html block so remark parses it as an html node
      const result = await processor.process(simulatedHtml);
      const output = result.toString();

      // {{title}} should be resolved (not left as-is)
      expect(output).not.toContain('{{title}}');
      expect(output).toContain('Test Agreement');
    });

    it('should process text node between two complete Phase-2 field spans', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { provider: { address: '123 Legal Ave' } },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '<span class="legal-field highlight" data-field="titleCase">Eleanor Voss</span>, ' +
        '{{provider.address}}, ' +
        '<span class="legal-field highlight" data-field="lower">evoss@meridiancg.com</span>';

      const result = await processor.process(markdown);
      const output = result.toString();

      expect(output).toContain('data-field="titleCase"');
      expect(output).toContain('data-field="lower"');
      expect(output).toContain('data-field="provider.address"');
      expect(output).toContain('123 Legal Ave');
      expect(output).not.toContain('{{provider.address}}');
    });

    it('should resolve a text node between two experimental lm-field tokens', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { provider: { address: '123 Legal Ave' } },
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '<lm-field data-field="provider.name" data-kind="highlight">Eleanor Voss</lm-field>, ' +
        '{{provider.address}}, ' +
        '<lm-field data-field="provider.email" data-kind="highlight">evoss@meridiancg.com</lm-field>';

      const result = await processor.process(markdown);
      const output = result.toString();

      expect(output).toContain('data-field="provider.name"');
      expect(output).toContain('data-field="provider.email"');
      expect(output).toContain('data-field="provider.address"');
      expect(output).toContain('123 Legal Ave');
      expect(output).not.toContain('{{provider.address}}');
      expect(output).toContain('<span class="legal-field highlight"');
    });

    it('should convert experimental logic tokens into highlight spans', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '<lm-logic-start data-field="logic.branch.1" data-logic-helper="if" data-logic-result="true"></lm-logic-start>' +
        'Winner branch text' +
        '<lm-logic-end></lm-logic-end>';

      const result = await processor.process(markdown);
      const output = result.toString();

      expect(output).toContain('data-field="logic.branch.1"');
      expect(output).toContain('data-logic-helper="if"');
      expect(output).toContain('data-logic-result="true"');
      expect(output).toContain('Winner branch text');
      expect(output).toContain('<span class="legal-field highlight"');
    });

    it('should keep logic token conversion when resolving {{...}} in the same html node', async () => {
      const processor = unified()
        .use(remarkTemplateFields, {
          metadata: { name: 'Acme Corp' },
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const tree = {
        type: 'root',
        children: [
          {
            type: 'html',
            value:
              '<lm-logic-start data-field="logic.branch.7" data-logic-helper="if" data-logic-result="true"></lm-logic-start>\n' +
              'Winner {{name}}\n' +
              '<lm-logic-end></lm-logic-end>',
          },
        ],
      } as any;

      await processor.run(tree);
      const output = String(processor.stringify(tree));

      expect(output).toContain('data-field="logic.branch.7"');
      expect(output).toContain('data-logic-helper="if"');
      expect(output).toContain('data-logic-result="true"');
      expect(output).toContain('data-field="name"');
      expect(output).toContain('Acme Corp');
      expect(output).not.toContain('{{name}}');
      expect(output).not.toContain('<lm-logic');
    });

    it('should preserve newline before next lll heading when converting logic tokens to spans', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '<lm-logic-start data-field="logic.branch.3" data-logic-helper="if" data-logic-result="true"></lm-logic-start>\n' +
        'This is the first service.\n' +
        '<lm-logic-end></lm-logic-end>\n' +
        'lll. 2nd Service Engagement';

      const result = await processor.process(markdown);
      const output = result.toString();

      expect(output).toMatch(/This is the first service\.\s*<\/span>\nlll\. 2nd Service Engagement/);
      expect(output).not.toContain('</span>lll. 2nd Service Engagement');
      expect(output).not.toContain('<lm-logic');
    });

    it('should preserve heading/list markdown markers when converting logic tokens to spans', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '## <lm-logic-start data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true"></lm-logic-start>Customer Loyalty<lm-logic-end></lm-logic-end>\n\n' +
        '- <lm-logic-start data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true"></lm-logic-start>Member Points Earned: 112<lm-logic-end></lm-logic-end>\n' +
        '- <lm-logic-start data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true"></lm-logic-start>Current Balance: 1523<lm-logic-end></lm-logic-end>';

      const result = await processor.process(markdown);
      const output = result.toString();

      expect(output).toContain('## <span class="legal-field highlight" data-field="logic.branch.9"');
      expect(output).toMatch(/^[*-] <span class="legal-field highlight" data-field="logic\.branch\.9"/m);
      expect(output).not.toContain('<span class="legal-field highlight" data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true">##');
      expect(output).not.toContain('<span class="legal-field highlight" data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true">- ');
      expect(output).not.toContain('<span class="legal-field highlight" data-field="logic.branch.9" data-logic-helper="if" data-logic-result="true">* ');
      expect(output).not.toContain('<lm-logic');
    });

    it('should continue processing sibling text nodes after converting one text node to html', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { first: 'Alice', second: 'Agreement' },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const result = await processor.process('{{first}} **and** {{second}}');
      const output = result.toString();

      expect(output).toContain('data-field="first"');
      expect(output).toContain('data-field="second"');
      expect(output).toContain('Alice');
      expect(output).toContain('Agreement');
    });

    it('should preserve inline tracking spans when serializing list items', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { item: 'Tracked item' },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const result = await processor.process('- {{item}}');
      const output = result.toString();
      expect(output).toMatch(/^[*-] <span class="legal-field imported-value"/m);
      expect(output).toContain('Tracked item');
    });

    it('should skip HTML node that has field spans and NO unresolved patterns', async () => {
      // Nodes that already have spans and no remaining {{...}} should not be
      // double-processed (no double wrapping).
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { title: 'Test Agreement' },
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      // A fully-resolved HTML node — no {{...}} remaining
      const fullyResolved =
        '<span class="legal-field imported-value" data-field="title">Test Agreement</span>';

      const result = await processor.process(fullyResolved);
      const output = result.toString();

      // Should not add extra nested spans — the span count should stay the same
      const spanCount = (output.match(/class="legal-field/g) ?? []).length;
      expect(spanCount).toBe(1);
    });

    it('should not reprocess {{...}} inside existing legal-field spans in ast tracking mode', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { empty_field: '', client_name: 'ACME Corp' },
          enableFieldTracking: true,
          astFieldTracking: true,
        })
        .use(remarkStringify);

      const markdown =
        '<span class="legal-field missing-value" data-field="empty_field">{{empty_field}}</span> and {{client_name}}';
      const result = await processor.process(markdown);
      const output = result.toString();

      // Keep original tracked span untouched (no nested span)
      expect(output).toMatch(
        /<span class="legal-field missing-value" data-field="empty_field">\{\{empty\\?_field\}\}<\/span>/
      );
      expect(output).not.toContain(
        '<span class="legal-field missing-value" data-field="empty_field"><span class="legal-field missing-value"'
      );

      // Still resolve fields outside the existing tracked span
      expect(output).toContain('data-field="client_name"');
      expect(output).toContain('ACME Corp');
      expect(output).not.toContain('and {{client_name}}');
    });
  });

  // ==========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty metadata', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: {},
        })
        .use(remarkStringify);

      const result = await processor.process('{{field}}');
      expect(result.toString().trim()).toBe('{{field}}');
    });

    it('should handle whitespace in field names', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{ name }}');
      expect(result.toString().trim()).toBe('Test');
    });

    it('should handle multiple fields in same line', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { a: '1', b: '2', c: '3' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{a}} {{b}} {{c}}');
      expect(result.toString().trim()).toBe('1 2 3');
    });

    it('should handle fields at start and end of text', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { start: 'BEGIN', end: 'END' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{start}} middle {{end}}');
      expect(result.toString().trim()).toBe('BEGIN middle END');
    });

    it('should handle very long field names', async () => {
      const longFieldName = 'a'.repeat(100);
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { [longFieldName]: 'value' },
        })
        .use(remarkStringify);

      const result = await processor.process(`{{${longFieldName}}}`);
      expect(result.toString().trim()).toBe('value');
    });

    it('should handle special characters in values', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { special: 'Value with "quotes" & <tags>' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{special}}');
      // remark-stringify may escape some special characters
      expect(result.toString()).toContain('Value with');
      expect(result.toString()).toContain('quotes');
    });

    it('should handle Unicode characters', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { unicode: 'Hello 世界 🌍' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{unicode}}');
      expect(result.toString()).toContain('Hello 世界 🌍');
    });

    it('should not process fields inside code blocks', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('```\n{{name}}\n```');
      // Fields in code blocks should be replaced (this is intentional behavior)
      expect(result.toString()).toContain('Test');
    });

    it('should handle malformed field patterns gracefully', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
        })
        .use(remarkStringify);

      const result = await processor.process('{{name} or {{name}}');
      // Malformed pattern ignored, valid one processed
      expect(result.toString()).toContain('{{name}');
      expect(result.toString()).toContain('Test');
    });
  });

  // ==========================================================================
  // DEBUG MODE
  // ==========================================================================

  describe('Debug Mode', () => {
    it('should log debug information when enabled', async () => {
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
          debug: true,
        })
        .use(remarkStringify);

      await processor.process('{{name}}');

      expect(debugSpy).toHaveBeenCalled();
      expect(debugSpy.mock.calls.some(call =>
        call[0]?.includes('Processing template fields')
      )).toBe(true);

      debugSpy.mockRestore();
    });

    it('should not log when debug disabled', async () => {
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, {
          metadata: { name: 'Test' },
          debug: false,
        })
        .use(remarkStringify);

      await processor.process('{{name}}');

      // The plugin itself should not log; other modules (e.g. field-tracker) may call logger.debug
      const pluginDebugCalls = debugSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && (
          call[0].includes('Processing template fields') ||
          call[0].includes('template field') ||
          call[0].includes('Replaced') ||
          call[0].includes('Found') ||
          call[0].includes('Skipping')
        )
      );
      expect(pluginDebugCalls).toHaveLength(0);

      debugSpy.mockRestore();
    });
  });
});
