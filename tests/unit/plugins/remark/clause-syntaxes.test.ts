/**
 * Unit Tests for All Clause Syntaxes
 *
 * Tests all supported conditional clause syntaxes in the remark clauses plugin:
 * 1. {{#if condition}}content{{/if}} - conditional with if keyword
 * 2. {{#variable}}content{{/variable}} - simple conditional
 * 3. [content]{condition} - current bracket syntax
 * 4. [{{condition}}content] - original Legal Markdown bracket syntax
 */

import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkClauses, RemarkClausesOptions } from '../../../../src/plugins/remark/clauses';

/**
 * Helper function to process markdown with clauses plugin
 */
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

describe('All Clause Syntaxes', () => {
  describe('{{#if condition}}content{{/if}} Syntax', () => {
    it('should process if conditions with true values', async () => {
      const input = `{{#if premium}}Premium features enabled{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Premium features enabled');
      expect(result).not.toContain('{{#if');
      expect(result).not.toContain('{{/if}}');
    });

    it('should process if conditions with false values', async () => {
      const input = `{{#if premium}}Premium features enabled{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('Premium features enabled');
      expect(result).not.toContain('{{#if');
      expect(result).not.toContain('{{/if}}');
    });

    it('should process if-else conditions', async () => {
      const input = `{{#if premium}}Premium features{{else}}Basic features{{/if}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Basic features');
      expect(result).not.toContain('Premium features');
    });
  });

  describe('{{#variable}}content{{/variable}} Syntax', () => {
    it('should process simple variable conditions with true values', async () => {
      const input = `{{#include_warranty}}This warranty clause is included.{{/include_warranty}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          include_warranty: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This warranty clause is included.');
      expect(result).not.toContain('{{#include_warranty}}');
      expect(result).not.toContain('{{/include_warranty}}');
    });

    it('should process simple variable conditions with false values', async () => {
      const input = `{{#include_warranty}}This warranty clause is included.{{/include_warranty}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          include_warranty: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('This warranty clause is included.');
      expect(result).not.toContain('{{#include_warranty}}');
      expect(result).not.toContain('{{/include_warranty}}');
    });

    it('should handle variables with underscores', async () => {
      const input = `{{#client_has_premium}}Premium content{{/client_has_premium}}`;
      const options: RemarkClausesOptions = {
        metadata: {
          client_has_premium: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Premium content');
    });
  });

  describe('[content]{condition} Syntax', () => {
    it('should process bracket syntax with true conditions', async () => {
      const input = `[This content is conditional]{premium}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This content is conditional');
      expect(result).not.toContain('[');
      expect(result).not.toContain('{premium}');
    });

    it('should process bracket syntax with false conditions', async () => {
      const input = `[This content is conditional]{premium}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('This content is conditional');
      expect(result).not.toContain('[');
      expect(result).not.toContain('{premium}');
    });

    it('should handle complex expressions in bracket syntax', async () => {
      const input = `[Advanced features available]{premium && status == "active"}`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
          status: 'active',
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Advanced features available');
    });
  });

  describe('[{{condition}}content] Syntax - Original Legal Markdown', () => {
    it('should process original bracket syntax with true conditions', async () => {
      const input = `[{{premium}}This is premium content]`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('This is premium content');
      expect(result).not.toContain('[{{premium}}');
      expect(result).not.toContain(']');
    });

    it('should process original bracket syntax with false conditions', async () => {
      const input = `[{{premium}}This is premium content]`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).not.toContain('This is premium content');
      expect(result).not.toContain('[{{premium}}');
      expect(result).not.toContain(']');
    });

    it('should handle variables with underscores in original syntax', async () => {
      const input = `[{{client_has_warranty}}Warranty terms apply]`;
      const options: RemarkClausesOptions = {
        metadata: {
          client_has_warranty: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Warranty terms apply');
    });

    it('should handle nested content in original syntax', async () => {
      const input = `[{{show_details}}For more information, see Section 5.2]`;
      const options: RemarkClausesOptions = {
        metadata: {
          show_details: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('For more information, see Section 5.2');
    });

    it('should handle mixed content with original syntax', async () => {
      const input = `Contract terms: [{{include_standard_terms}}Standard terms apply] [{{include_custom_terms}}Custom terms in Appendix A]`;
      const options: RemarkClausesOptions = {
        metadata: {
          include_standard_terms: true,
          include_custom_terms: false,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Standard terms apply');
      expect(result).not.toContain('Custom terms in Appendix A');
      expect(result).toContain('Contract terms:'); // Should contain the base text
    });
  });

  describe('Mixed Syntaxes', () => {
    it('should handle all syntaxes in the same document', async () => {
      const input = `l. Terms and Conditions

{{#if premium}}Premium Features: Premium users get access to advanced features.{{/if}}

{{#standard_warranty}}Warranty: Standard warranty terms apply.{{/standard_warranty}}

Additional terms: [See Appendix A]{has_appendix}

Legal notice: [{{show_legal_notice}}This document is legally binding]`;

      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
          standard_warranty: false,
          has_appendix: true,
          show_legal_notice: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      // Check if syntax inclusion
      expect(result).toContain('Premium Features');
      expect(result).toContain('Premium users get access');

      // Check standard warranty exclusion
      expect(result).not.toContain('Warranty: Standard warranty terms');

      // Check bracket syntax inclusion
      expect(result).toContain('See Appendix A');

      // Check original bracket syntax inclusion
      expect(result).toContain('This document is legally binding');

      // Make sure no syntax markers remain
      expect(result).not.toContain('{{#if');
      expect(result).not.toContain('{{/if}}');
      expect(result).not.toContain('{{#standard_warranty}}');
      expect(result).not.toContain('{has_appendix}');
      expect(result).not.toContain('[{{show_legal_notice}}');
    });

    it('should handle complex boolean expressions in all syntaxes', async () => {
      const input = `{{#if premium && status == "active"}}Premium active{{/if}}
{{#basic_user}}Basic content{{/basic_user}}
[Advanced content]{premium && advanced_features}
[{{enterprise_user}}Enterprise features available]`;

      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
          status: 'active',
          basic_user: false,
          advanced_features: true,
          enterprise_user: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Premium active');
      expect(result).not.toContain('Basic content');
      expect(result).toContain('Advanced content');
      expect(result).toContain('Enterprise features available');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conditions gracefully', async () => {
      const input = `[{{}}Empty condition test]`;
      const options: RemarkClausesOptions = {
        metadata: {},
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      // Empty condition should be left untouched (not processed)
      expect(result).toContain('[{{}}Empty condition test]');
    });

    it('should handle whitespace in conditions', async () => {
      const input = `[{{ premium }}Whitespace condition]`;
      const options: RemarkClausesOptions = {
        metadata: {
          premium: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Whitespace condition');
    });

    it('should handle nested brackets in content', async () => {
      const input = `[{{show_note}}Note: See details below]`;
      const options: RemarkClausesOptions = {
        metadata: {
          show_note: true,
        },
        debug: false,
      };

      const result = await processMarkdownWithClauses(input, options);

      expect(result).toContain('Note: See details below');
      expect(result).not.toContain('[{{show_note}}');
    });
  });
});
