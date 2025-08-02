/**
 * Unit Tests for Remark Clauses Plugin
 *
 * Comprehensive test suite for the remark clauses plugin, covering conditional
 * logic, expression evaluation, security, edge cases, and integration scenarios.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkClauses, RemarkClausesOptions } from '../../../../src/plugins/remark/clauses';

/**
 * Helper function to process markdown with clauses plugin
 */
import { vi } from 'vitest';
async function processMarkdownWithClauses(
  markdown: string,
  options: RemarkClausesOptions
): Promise<string> {
  const processor = unified().use(remarkParse).use(remarkClauses, options).use(remarkStringify, {
    bullet: '-',
    fences: true,
    incrementListMarker: false,
  });

  const result = await processor.process(markdown);
  return result.toString();
}

describe('remarkClauses Plugin', () => {
  describe('Basic Conditional Processing', () => {
    it('should include content when condition is true', async () => {
      const input = `This is {{#if hasWarranty}}warranty content{{/if}} in the document.`;
      const options: RemarkClausesOptions = {
        metadata: { hasWarranty: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This is warranty content in the document.');
    });

    it('should exclude content when condition is false', async () => {
      const input = `This is {{#if hasWarranty}}warranty content{{/if}} in the document.`;
      const options: RemarkClausesOptions = {
        metadata: { hasWarranty: false },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This is  in the document.');
      expect(result).not.toContain('warranty content');
    });

    it('should handle missing variables as false', async () => {
      const input = `This is {{#if missingVariable}}content{{/if}} in the document.`;
      const options: RemarkClausesOptions = {
        metadata: {},
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This is  in the document.');
      expect(result).not.toContain('content');
    });

    it('should handle undefined variables as false', async () => {
      const input = `This is {{#if undefinedVar}}content{{/if}} in the document.`;
      const options: RemarkClausesOptions = {
        metadata: { undefinedVar: undefined },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('content');
    });

    it('should handle null variables as false', async () => {
      const input = `This is {{#if nullVar}}content{{/if}} in the document.`;
      const options: RemarkClausesOptions = {
        metadata: { nullVar: null },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('content');
    });
  });

  describe('If-Else Conditional Processing', () => {
    it('should include if-content when condition is true', async () => {
      const input = `{{#if hasInsurance}}Full coverage{{else}}Basic coverage{{/if}} applies.`;
      const options: RemarkClausesOptions = {
        metadata: { hasInsurance: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Full coverage applies.');
      expect(result).not.toContain('Basic coverage');
    });

    it('should include else-content when condition is false', async () => {
      const input = `{{#if hasInsurance}}Full coverage{{else}}Basic coverage{{/if}} applies.`;
      const options: RemarkClausesOptions = {
        metadata: { hasInsurance: false },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Basic coverage applies.');
      expect(result).not.toContain('Full coverage');
    });

    it('should handle complex if-else content', async () => {
      const input = `{{#if jurisdiction == "US"}}This agreement is governed by US law.{{else}}This agreement is governed by international law.{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { jurisdiction: 'US' },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('governed by US law');
      expect(result).not.toContain('international law');
    });
  });

  describe('Comparison Operators', () => {
    describe('Equality (==)', () => {
      it('should handle string equality', async () => {
        const input = `{{#if country == "USA"}}US specific clause{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { country: 'USA' },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('US specific clause');
      });

      it('should handle number equality', async () => {
        const input = `{{#if employees == 50}}Medium company{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { employees: 50 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Medium company');
      });

      it('should handle boolean equality', async () => {
        const input = `{{#if isActive == true}}Active status{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isActive: true },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Active status');
      });
    });

    describe('Inequality (!=)', () => {
      it('should handle string inequality', async () => {
        const input = `{{#if status != "pending"}}Processing complete{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { status: 'approved' },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Processing complete');
      });

      it('should exclude when inequality is false', async () => {
        const input = `{{#if status != "pending"}}Processing complete{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { status: 'pending' },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Processing complete');
      });
    });

    describe('Numeric Comparisons', () => {
      it('should handle greater than (>)', async () => {
        const input = `{{#if revenue > 1000000}}Large enterprise{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { revenue: 1500000 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Large enterprise');
      });

      it('should handle less than (<)', async () => {
        const input = `{{#if employees < 10}}Small business{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { employees: 5 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Small business');
      });

      it('should handle greater than or equal (>=)', async () => {
        const input = `{{#if age >= 18}}Adult terms{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { age: 18 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Adult terms');
      });

      it('should handle less than or equal (<=)', async () => {
        const input = `{{#if discount <= 10}}Standard rate{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { discount: 10 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Standard rate');
      });
    });
  });

  describe('Boolean Operators', () => {
    describe('AND (&&)', () => {
      it('should handle simple AND conditions', async () => {
        const input = `{{#if hasLicense && isActive}}Licensed and active{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { hasLicense: true, isActive: true },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Licensed and active');
      });

      it('should fail when any AND condition is false', async () => {
        const input = `{{#if hasLicense && isActive}}Licensed and active{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { hasLicense: true, isActive: false },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Licensed and active');
      });

      it('should handle multiple AND conditions', async () => {
        const input = `{{#if hasLicense && isActive && isPaid}}All requirements met{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { hasLicense: true, isActive: true, isPaid: true },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('All requirements met');
      });
    });

    describe('OR (||)', () => {
      it('should handle simple OR conditions', async () => {
        const input = `{{#if isVip || isPremium}}Special treatment{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isVip: false, isPremium: true },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Special treatment');
      });

      it('should succeed when any OR condition is true', async () => {
        const input = `{{#if isVip || isPremium}}Special treatment{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isVip: true, isPremium: false },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Special treatment');
      });

      it('should fail when all OR conditions are false', async () => {
        const input = `{{#if isVip || isPremium}}Special treatment{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isVip: false, isPremium: false },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Special treatment');
      });
    });

    describe('Complex Boolean Logic', () => {
      it('should handle mixed AND and OR operators', async () => {
        const input = `{{#if isVip && isActive || isPremium && isActive}}Active premium user{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isVip: false, isPremium: true, isActive: true },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Active premium user');
      });

      it('should respect operator precedence (AND before OR)', async () => {
        const input = `{{#if isVip || isPremium && isActive}}Show content{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { isVip: true, isPremium: false, isActive: false },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Show content'); // isVip is true, so OR succeeds
      });
    });
  });

  describe('Nested Object Access', () => {
    it('should handle simple nested properties', async () => {
      const input = `{{#if client.isActive}}Client is active{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          client: { isActive: true },
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Client is active');
    });

    it('should handle deep nested properties', async () => {
      const input = `{{#if company.address.country == "US"}}US company{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          company: {
            address: {
              country: 'US',
            },
          },
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('US company');
    });

    it('should handle missing nested properties', async () => {
      const input = `{{#if client.settings.notifications}}Notifications enabled{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          client: { name: 'John' }, // Missing settings property
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('Notifications enabled');
    });

    it('should handle nested array access', async () => {
      const input = `{{#if contracts.length > 0}}Has contracts{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          contracts: ['contract1', 'contract2'],
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Has contracts');
    });
  });

  describe('Data Type Handling', () => {
    describe('Strings', () => {
      it('should treat non-empty strings as truthy', async () => {
        const input = `{{#if message}}Has message{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { message: 'Hello' },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Has message');
      });

      it('should treat empty strings as falsy', async () => {
        const input = `{{#if message}}Has message{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { message: '' },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Has message');
      });
    });

    describe('Numbers', () => {
      it('should treat non-zero numbers as truthy', async () => {
        const input = `{{#if count}}Has count{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { count: 5 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Has count');
      });

      it('should treat zero as falsy', async () => {
        const input = `{{#if count}}Has count{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { count: 0 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Has count');
      });

      it('should treat negative numbers as truthy', async () => {
        const input = `{{#if balance}}Has balance{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { balance: -100 },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Has balance');
      });
    });

    describe('Arrays', () => {
      it('should treat non-empty arrays as truthy', async () => {
        const input = `{{#if items}}Has items{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { items: [1, 2, 3] },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Has items');
      });

      it('should treat empty arrays as falsy', async () => {
        const input = `{{#if items}}Has items{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { items: [] },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Has items');
      });
    });

    describe('Objects', () => {
      it('should treat non-empty objects as truthy', async () => {
        const input = `{{#if config}}Has config{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { config: { setting: 'value' } },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).toContain('Has config');
      });

      it('should treat empty objects as falsy', async () => {
        const input = `{{#if config}}Has config{{/if}}`;
        const options: RemarkClausesOptions = {
          metadata: { config: {} },
        };

        const result = await processMarkdownWithClauses(input, options);

        expect(result).not.toContain('Has config');
      });
    });
  });

  describe('Multiple Conditional Blocks', () => {
    it('should handle multiple independent blocks', async () => {
      const input = `
{{#if hasWarranty}}Warranty clause included.{{/if}}

{{#if hasInsurance}}Insurance requirements apply.{{/if}}

{{#if isCommercial}}Commercial terms in effect.{{/if}}
`;
      const options: RemarkClausesOptions = {
        metadata: {
          hasWarranty: true,
          hasInsurance: false,
          isCommercial: true,
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Warranty clause included.');
      expect(result).not.toContain('Insurance requirements apply.');
      expect(result).toContain('Commercial terms in effect.');
    });

    it('should handle blocks within the same paragraph', async () => {
      const input = `This contract {{#if hasWarranty}}includes warranty{{else}}excludes warranty{{/if}} and {{#if hasSupport}}includes support{{else}}excludes support{{/if}}.`;
      const options: RemarkClausesOptions = {
        metadata: {
          hasWarranty: true,
          hasSupport: false,
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This contract includes warranty and excludes support.');
    });
  });

  describe('Nested Conditional Blocks', () => {
    it('should handle nested if statements', async () => {
      const input = `{{#if isEnterprise}}{{#if hasSupport}}Enterprise with support{{else}}Enterprise without support{{/if}}{{else}}Standard plan{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          isEnterprise: true,
          hasSupport: true,
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Enterprise with support');
      expect(result).not.toContain('Standard plan');
    });

    it('should handle deeply nested conditions', async () => {
      const input = `{{#if level1}}{{#if level2}}{{#if level3}}Deep content{{/if}}{{/if}}{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          level1: true,
          level2: true,
          level3: true,
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Deep content');
    });

    it('should fail nested conditions when parent is false', async () => {
      const input = `{{#if level1}}{{#if level2}}Nested content{{/if}}{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          level1: false,
          level2: true,
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('Nested content');
    });
  });

  describe('Security and Sanitization', () => {
    it('should reject unsafe condition expressions', async () => {
      const input = `{{#if eval('1+1')}}Dangerous content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {},
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await processMarkdownWithClauses(input, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsafe condition'),
        expect.stringContaining("eval('1+1')")
      );

      // Should not include the content due to safety rejection
      expect(result).not.toContain('Dangerous content');

      consoleSpy.mockRestore();
    });

    it('should reject conditions with script tags', async () => {
      const input = `{{#if <script>alert(1)</script>}}Bad content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {},
        debug: true,
      };

      const result = await processMarkdownWithClauses(input, options);

      // Should not process the content and leave the original conditional block
      expect(result).toContain('{{#if <script>alert(1)</script>}}Bad content{{/if}}');
      // Content should not be extracted and processed (should remain in conditional block)
      expect(result).not.toMatch(/^Bad content$/); // Should not be standalone
    });

    it('should allow safe condition expressions', async () => {
      const input = `{{#if name == "John" && age > 18}}Safe content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { name: 'John', age: 25 },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Safe content');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed conditional blocks gracefully', async () => {
      const input = `{{#if condition}}Content without closing tag`;
      const options: RemarkClausesOptions = {
        metadata: { condition: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      // Malformed blocks should be left unchanged
      expect(result).toContain('{{#if condition}}Content without closing tag');
    });

    it('should handle unmatched else blocks', async () => {
      const input = `{{else}}Orphaned else block{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {},
      };

      const result = await processMarkdownWithClauses(input, options);

      // Should leave malformed content unchanged
      expect(result).toContain('{{else}}Orphaned else block{{/if}}');
    });

    it('should include content on condition evaluation errors', async () => {
      const input = `{{#if}}Empty condition{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {},
      };

      const result = await processMarkdownWithClauses(input, options);

      // Should default to including content for safety
      expect(result).toContain('Empty condition');
    });
  });

  describe('Debug Mode', () => {
    it('should provide debug output when enabled', async () => {
      const input = `{{#if testCondition}}Test content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { testCondition: true },
        debug: true,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await processMarkdownWithClauses(input, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[remarkClauses] Processing clauses with metadata:'),
        expect.any(Array)
      );

      consoleSpy.mockRestore();
    });

    it('should show condition evaluation in debug mode', async () => {
      const input = `{{#if complexCondition == "test"}}Debug content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { complexCondition: 'test' },
        debug: true,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await processMarkdownWithClauses(input, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[remarkClauses] Condition'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('should not produce debug output when disabled', async () => {
      const input = `{{#if testCondition}}Test content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { testCondition: true },
        debug: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await processMarkdownWithClauses(input, options);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Markdown Content', () => {
    it('should work with formatted text inside conditions', async () => {
      const input = `{{#if showImportant}}**Important:** This is critical information.{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { showImportant: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('**Important:** This is critical information.');
    });

    it('should work with links inside conditions', async () => {
      const input = `{{#if showLink}}Visit [our website](https://example.com) for more info.{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { showLink: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('[our website](https://example.com)');
    });

    it('should work within list items', async () => {
      const input = `
- Standard terms apply
- {{#if hasWarranty}}Warranty terms included{{/if}}
- {{#if hasSupport}}Support terms included{{/if}}
`;
      const options: RemarkClausesOptions = {
        metadata: { hasWarranty: true, hasSupport: false },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('- Warranty terms included');
      expect(result).not.toContain('Support terms included');
    });

    it('should work within headers', async () => {
      const input = `# {{#if isContract}}Contract{{else}}Agreement{{/if}} Terms`;
      const options: RemarkClausesOptions = {
        metadata: { isContract: true },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('# Contract Terms');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle documents with many conditional blocks', async () => {
      const blocks = Array.from(
        { length: 50 },
        (_, i) => `{{#if condition${i}}}Content ${i}{{/if}}`
      );
      const input = blocks.join(' ');

      const metadata: Record<string, any> = {};
      for (let i = 0; i < 50; i++) {
        metadata[`condition${i}`] = i < 25; // Half true, half false
      }

      const options: RemarkClausesOptions = { metadata };

      const startTime = Date.now();
      const result = await processMarkdownWithClauses(input, options);
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should include content for conditions 0-24
      for (let i = 0; i < 25; i++) {
        expect(result).toContain(`Content ${i}`);
      }

      // Should not include content for conditions 25-49
      for (let i = 25; i < 50; i++) {
        expect(result).not.toContain(`Content ${i}`);
      }
    });

    it('should not leak memory with repeated processing', async () => {
      const input = `{{#if testVar}}Test content{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: { testVar: true },
      };

      // Process the same document multiple times
      for (let i = 0; i < 20; i++) {
        const result = await processMarkdownWithClauses(input, options);
        expect(result).toContain('Test content');
      }

      // If we get here without running out of memory, the test passes
      expect(true).toBe(true);
    });
  });

  describe('Array Loops and Context Variables', () => {
    it('should process array loops with @total variable', async () => {
      const input = `{{#items}}Item {{@index}} of {{@total}}: {{name}}{{/items}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          items: [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }],
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Item 0 of 3: First');
      expect(result).toContain('Item 1 of 3: Second');
      expect(result).toContain('Item 2 of 3: Third');
    });

    it('should provide all loop context variables including @first and @last', async () => {
      const input = `{{#services}}{{#if @first}}First: {{/if}}{{name}}{{#if @last}} (Total: {{@total}}){{/if}}{{/services}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          services: [{ name: 'Service A' }, { name: 'Service B' }],
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('First: Service A');
      expect(result).toContain('Service B (Total: 2)');
    });

    it('should not show content for empty arrays', async () => {
      const input = `{{#items}}This should not appear{{/items}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          items: [],
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('This should not appear');
    });

    it('should handle nested loops within clauses', async () => {
      const input = `{{#if showDepartments}}{{#departments}}Department: {{name}}{{#employees}} - {{name}}{{/employees}}{{/departments}}{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          showDepartments: true,
          departments: [
            {
              name: 'Engineering',
              employees: [{ name: 'Alice' }, { name: 'Bob' }],
            },
          ],
        },
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Department: Engineering');
      expect(result).toContain(' - Alice');
      expect(result).toContain(' - Bob');
    });
  });
});
