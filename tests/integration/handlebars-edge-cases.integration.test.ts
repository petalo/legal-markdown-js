/**
 * @fileoverview Edge case tests for Handlebars helpers
 *
 * Comprehensive edge case testing for all main helpers:
 * - null, undefined, empty string values
 * - Invalid inputs
 * - Boundary values
 * - Type mismatches
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark as processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Handlebars Helpers - Edge Cases', () => {
  describe('formatCurrency Edge Cases', () => {
    it('should handle zero', async () => {
      const content = `---
amount: 0
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('$0.00');
    });

    it('should handle negative numbers', async () => {
      const content = `---
amount: -1234.56
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      // Accept both $-1,234.56 and -$1,234.56 formats
      expect(result.content).toMatch(/[-$].*1,234\.56/);
    });

    it('should handle very large numbers', async () => {
      const content = `---
amount: 999999999.99
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('$999,999,999.99');
    });

    it('should handle undefined gracefully', async () => {
      const content = `Amount: {{formatCurrency undefined_var "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      // Should not crash
      expect(result.content).toBeDefined();
    });

    it('should handle null gracefully', async () => {
      const content = `---
amount: null
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle string numbers', async () => {
      const content = `---
amount: "1234.56"
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('$1,234.56');
    });

    it('should handle invalid strings', async () => {
      const content = `---
amount: "not a number"
---
Amount: {{formatCurrency amount "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      // Should handle gracefully
      expect(result.content).toBeDefined();
    });
  });

  describe('formatDate Edge Cases', () => {
    it('should handle undefined date', async () => {
      const content = `Date: {{formatDate undefined_date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle null date', async () => {
      const content = `---
date: null
---
Date: {{formatDate date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle invalid date string', async () => {
      const content = `---
date: "not a date"
---
Date: {{formatDate date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle very old dates', async () => {
      const content = `---
date: 1800-01-01
---
Date: {{formatDate date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      // Accept 1799-12-31 or 1800-01-01 (timezone differences)
      expect(result.content).toMatch(/179[0-9]-12-31|1800-01-01/);
    });

    it('should handle far future dates', async () => {
      const content = `---
date: 2999-12-31
---
Date: {{formatDate date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2999-12-31');
    });
  });

  describe('String Helpers Edge Cases', () => {
    it('should handle empty strings in titleCase', async () => {
      const content = `---
text: ""
---
Text: {{titleCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle undefined in titleCase', async () => {
      const content = `Text: {{titleCase undefined_var}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle null in titleCase', async () => {
      const content = `---
text: null
---
Text: {{titleCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle very long strings', async () => {
      const content = `---
text: "a very long string that goes on and on and on and on and on and on and on and on and on and on"
---
Text: {{truncate text 20 "..."}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('...');
    });

    it('should handle special characters in titleCase', async () => {
      const content = `---
text: "hello@world.com & test-case_example"
---
Text: {{titleCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const content = `---
text: "josé maría garcía"
---
Text: {{titleCase text}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('José');
    });

    it('should handle initials with empty string', async () => {
      const content = `---
name: ""
---
Initials: {{initials name}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle initials with single word', async () => {
      const content = `---
name: "John"
---
Initials: {{initials name}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('J');
    });
  });

  describe('Mathematical Helpers Edge Cases', () => {
    it('should handle division by zero', async () => {
      const content = `---
a: 10
b: 0
---
Result: {{divide a b}}`;

      const result = await processLegalMarkdown(content);
      // Should handle gracefully (might be Infinity)
      expect(result.content).toBeDefined();
    });

    it('should handle negative numbers in multiply', async () => {
      const content = `---
a: -5
b: 10
---
Result: {{multiply a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('-50');
    });

    it('should handle very large multiplication', async () => {
      const content = `---
a: 999999
b: 999999
---
Result: {{multiply a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle decimal precision in divide', async () => {
      const content = `---
a: 10
b: 3
---
Result: {{divide a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('3.3');
    });

    it('should handle undefined in mathematical operations', async () => {
      const content = `Result: {{multiply undefined_var 5}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle string numbers in math operations', async () => {
      const content = `---
a: "10"
b: "5"
---
Result: {{add a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('15');
    });
  });

  describe('Date Arithmetic Edge Cases', () => {
    it('should handle addYears with negative numbers', async () => {
      const content = `---
date: 2025-01-15
---
Past: {{formatDate (addYears date -5) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2020-01-15');
    });

    it('should handle addYears with zero', async () => {
      const content = `---
date: 2025-01-15
---
Same: {{formatDate (addYears date 0) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2025-01-15');
    });

    it('should handle addDays with very large numbers', async () => {
      const content = `---
date: 2025-01-01
---
Future: {{formatDate (addDays date 1000) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      // Should be about 2.7 years later
      expect(result.content).toContain('2027');
    });

    it('should handle addMonths across year boundary', async () => {
      const content = `---
date: 2025-11-15
---
Next: {{formatDate (addMonths date 3) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2026-02-15');
    });

    it('should handle addDays with negative (go back in time)', async () => {
      const content = `---
date: 2025-01-15
---
Past: {{formatDate (addDays date -30) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2024-12-16');
    });

    it('should handle undefined date in addYears', async () => {
      const content = `Result: {{formatDate (addYears undefined_date 1) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      // Should not crash
      expect(result.content).toBeDefined();
    });
  });

  describe('formatPercent Edge Cases', () => {
    it('should handle zero percent', async () => {
      const content = `---
rate: 0
---
Rate: {{formatPercent rate 1}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('0.0%');
    });

    it('should handle negative percent', async () => {
      const content = `---
rate: -0.05
---
Rate: {{formatPercent rate 1}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('-5.0%');
    });

    it('should handle percent greater than 100%', async () => {
      const content = `---
rate: 1.5
---
Rate: {{formatPercent rate 0}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('150%');
    });

    it('should handle very small decimals', async () => {
      const content = `---
rate: 0.00125
---
Rate: {{formatPercent rate 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('0.13%');
    });

    it('should handle undefined in formatPercent', async () => {
      const content = `Rate: {{formatPercent undefined_var 1}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });
  });

  describe('formatInteger Edge Cases', () => {
    it('should handle zero', async () => {
      const content = `---
num: 0
---
Number: {{formatInteger num ","}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('0');
    });

    it('should handle negative integers', async () => {
      const content = `---
num: -1234567
---
Number: {{formatInteger num ","}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('-1,234,567');
    });

    it('should handle very large integers', async () => {
      const content = `---
num: 999999999999
---
Number: {{formatInteger num ","}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/999,999,999,999/);
    });

    it('should round decimals to integers', async () => {
      const content = `---
num: 1234.56
---
Number: {{formatInteger num ","}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('1,235');
    });
  });

  describe('round Edge Cases', () => {
    it('should handle zero decimals', async () => {
      const content = `---
num: 3.14159
---
Rounded: {{round num 0}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('3');
    });

    it('should handle negative decimals parameter', async () => {
      const content = `---
num: 1234.56
---
Rounded: {{round num -1}}`;

      const result = await processLegalMarkdown(content);
      // Should handle gracefully
      expect(result.content).toBeDefined();
    });

    it('should handle very high decimals parameter', async () => {
      const content = `---
num: 3.14159265359
---
Rounded: {{round num 10}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('3.14159');
    });
  });

  describe('concat Edge Cases', () => {
    it('should handle empty strings', async () => {
      const content = `---
a: ""
b: "test"
---
Result: {{concat a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('test');
    });

    it('should handle undefined values', async () => {
      const content = `Result: {{concat undefined_var "test"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle many arguments', async () => {
      const content = `Result: {{concat "a" "b" "c" "d" "e" "f"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('abcdef');
    });

    it('should handle numbers as strings', async () => {
      const content = `---
a: 123
b: 456
---
Result: {{concat a b}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('123456');
    });
  });

  describe('Combined Edge Cases', () => {
    it('should handle complex nested operations with edge values', async () => {
      const content = `---
zero: 0
negative: -100
positive: 100
---
Result: {{add (multiply zero negative) positive}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('100');
    });

    it('should handle undefined in nested operations', async () => {
      const content = `Result: {{formatCurrency (multiply undefined_var 100) "USD" 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toBeDefined();
    });

    it('should handle empty array in loops', async () => {
      const content = `---
items: []
---
{{#each items}}
- {{this}}
{{/each}}
No items`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('No items');
    });
  });
});
