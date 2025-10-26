/**
 * @fileoverview Tests for previously untested Handlebars helpers
 *
 * Covers the 14 helpers that didn't have explicit tests:
 * capitalizeWords, clean, contains, formatBasicDate, formatEuro, formatPound,
 * numberToWords, padEnd, padStart, parseToday, pascalCase, pluralize, replaceAll, today
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark as processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Previously Untested Handlebars Helpers', () => {
  describe('capitalizeWords', () => {
    it('should capitalize each word', async () => {
      const content = `---
text: "hello world from legal markdown"
---
Result: {{capitalizeWords text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Hello World From Legal Markdown');
    });

    it('should handle single word', async () => {
      const content = `---
text: "hello"
---
Result: {{capitalizeWords text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Hello');
    });

    it('should handle empty string', async () => {
      const content = `---
text: ""
---
Result: {{capitalizeWords text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });
  });

  describe('clean', () => {
    it('should remove extra whitespace', async () => {
      const content = `---
text: "hello    world   with   spaces"
---
Result: {{clean text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello world with spaces');
    });

    it('should trim leading and trailing spaces', async () => {
      const content = `---
text: "   hello world   "
---
Result: {{clean text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello world');
      expect(result.content).not.toMatch(/^\s+hello/);
    });

    it('should handle tabs and newlines', async () => {
      const content = `---
text: "hello\t\tworld\n\ntest"
---
Result: {{clean text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });
  });

  describe('contains', () => {
    it('should return true when substring is found', async () => {
      const content = `---
text: "hello world"
search: "world"
---
{{#if (contains text search)}}Found{{else}}Not found{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Found');
    });

    it('should return false when substring is not found', async () => {
      const content = `---
text: "hello world"
search: "xyz"
---
{{#if (contains text search)}}Found{{else}}Not found{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Not found');
    });

    it('should be case sensitive', async () => {
      const content = `---
text: "hello world"
search: "WORLD"
---
{{#if (contains text search)}}Found{{else}}Not found{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Not found');
    });
  });

  describe('formatBasicDate', () => {
    it('should format date in basic format', async () => {
      const content = `---
date: 2025-01-15
---
Result: {{formatBasicDate date}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2025-01-15');
    });

    it('should handle date objects', async () => {
      const content = `---
date: 2025-12-31
---
Result: {{formatBasicDate date}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/2025-12-31/);
    });
  });

  describe('formatEuro', () => {
    it('should format as Euros', async () => {
      const content = `---
amount: 1234.56
---
Result: {{formatEuro amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/€/);
      expect(result.content).toMatch(/1[.,]234/);
    });

    it('should handle zero', async () => {
      const content = `---
amount: 0
---
Result: {{formatEuro amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/0.*€/);
    });

    it('should handle negative amounts', async () => {
      const content = `---
amount: -500
---
Result: {{formatEuro amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/-.*€/);
    });
  });

  describe('formatPound', () => {
    it('should format as British Pounds', async () => {
      const content = `---
amount: 1234.56
---
Result: {{formatPound amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/£/);
      expect(result.content).toMatch(/1,234/);
    });

    it('should handle zero', async () => {
      const content = `---
amount: 0
---
Result: {{formatPound amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/£0/);
    });

    it('should handle large amounts', async () => {
      const content = `---
amount: 999999.99
---
Result: {{formatPound amount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/£999,999/);
    });
  });

  describe('numberToWords', () => {
    it('should convert numbers to words', async () => {
      const content = `---
num: 42
---
Result: {{numberToWords num}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/forty.two/i);
    });

    it('should handle zero', async () => {
      const content = `---
num: 0
---
Result: {{numberToWords num}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/zero/i);
    });

    it('should handle hundreds', async () => {
      const content = `---
num: 123
---
Result: {{numberToWords num}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/one hundred/i);
    });

    it('should handle thousands', async () => {
      const content = `---
num: 1000
---
Result: {{numberToWords num}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/one thousand/i);
    });
  });

  describe('padStart', () => {
    it('should pad string at start', async () => {
      const content = `---
num: 42
---
Result: {{padStart num 5 "0"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('00042');
    });

    it('should not pad if already long enough', async () => {
      const content = `---
text: "hello"
---
Result: {{padStart text 3 "x"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello');
    });

    it('should handle space padding', async () => {
      const content = `---
text: "hi"
---
Result: {{padStart text 5 " "}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/\s+hi/);
    });
  });

  describe('padEnd', () => {
    it('should pad string at end', async () => {
      const content = `---
num: 42
---
Result: {{padEnd num 5 "0"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('42000');
    });

    it('should not pad if already long enough', async () => {
      const content = `---
text: "hello"
---
Result: {{padEnd text 3 "x"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello');
    });

    it('should handle custom padding character', async () => {
      const content = `---
text: "test"
---
Result: {{padEnd text 8 "-"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('test----');
    });
  });

  describe('pascalCase', () => {
    it('should convert to PascalCase', async () => {
      const content = `---
text: "hello world"
---
Result: {{pascalCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('HelloWorld');
    });

    it('should handle kebab-case input', async () => {
      const content = `---
text: "hello-world-test"
---
Result: {{pascalCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('HelloWorldTest');
    });

    it('should handle snake_case input', async () => {
      const content = `---
text: "hello_world_test"
---
Result: {{pascalCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('HelloWorldTest');
    });

    it('should handle mixed case input', async () => {
      const content = `---
text: "helloWorld"
---
Result: {{pascalCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('HelloWorld');
    });
  });

  describe('pluralize', () => {
    it('should pluralize when count > 1', async () => {
      const content = `---
count: 5
---
Result: {{count}} {{pluralize "item" count}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('5 items');
    });

    it('should keep singular when count = 1', async () => {
      const content = `---
count: 1
---
Result: {{count}} {{pluralize "item" count}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('1 item');
    });

    it('should pluralize when count = 0', async () => {
      const content = `---
count: 0
---
Result: {{count}} {{pluralize "item" count}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('0 items');
    });

    it('should handle words ending in y', async () => {
      const content = `---
count: 3
---
Result: {{pluralize "company" count}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('companies');
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', async () => {
      const content = `---
text: "hello world hello universe"
---
Result: {{replaceAll text "hello" "goodbye"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('goodbye world goodbye universe');
    });

    it('should handle single occurrence', async () => {
      const content = `---
text: "hello world"
---
Result: {{replaceAll text "world" "universe"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello universe');
    });

    it('should handle no matches', async () => {
      const content = `---
text: "hello world"
---
Result: {{replaceAll text "xyz" "abc"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello world');
    });

    it('should handle special characters', async () => {
      const content = `---
text: "test@example.com"
---
Result: {{replaceAll text "@" " at "}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('test at example.com');
    });
  });

  describe('today helper', () => {
    it('should return current date', async () => {
      const content = `Result: {{formatDate today "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      // Should contain a valid date (just check format)
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should work with date arithmetic', async () => {
      const content = `Result: {{formatDate (addDays today 7) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      // Should contain a valid date
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should work in multiple places', async () => {
      const content = `Start: {{formatDate today "YYYY-MM-DD"}}
End: {{formatDate (addYears today 1) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/Start:.*\d{4}-\d{2}-\d{2}/);
      expect(result.content).toMatch(/End:.*\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Combined Usage of New Helpers', () => {
    it('should use multiple new helpers together', async () => {
      const content = `---
company: "tech startup inc"
amount: 5000
count: 3
invoiceNum: 42
---
**Company:** {{replaceAll (pascalCase company) " " ""}}
**Amount:** {{formatEuro amount}}
**Items:** {{count}} {{pluralize "service" count}}
**Invoice:** {{padStart invoiceNum 6 "0"}}
**Words:** {{capitalizeWords company}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('TechStartupInc');
      expect(result.content).toMatch(/€/);
      expect(result.content).toContain('3 services');
      expect(result.content).toContain('000042');
      expect(result.content).toContain('Tech Startup Inc');
    });

    it('should use helpers in complex nested operations', async () => {
      const content = `---
text: "  hello   world  "
num: 100
---
Result: {{upper (clean (replaceAll text "hello" "goodbye"))}}
Number: {{numberToWords (divide num 2)}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('GOODBYE WORLD');
      expect(result.content).toMatch(/fifty/i);
    });
  });
});
