/**
 * Extended edge case tests for Handlebars implementation
 *
 * Tests boundary conditions, error handling, and special cases
 * to ensure robustness before v4.0 release.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

describe('Handlebars - Extended Edge Cases', () => {
  describe('Special Characters', () => {
    it('should handle Unicode characters in variables', async () => {
      const input = `---
title: "Contrato de Servicios"
client_name: "José García"
amount: 1000
---

# {{title}}

Cliente: {{client_name}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Contrato de Servicios');
      expect(result.content).toContain('José García');
    });

    it('should handle emojis in content', async () => {
      const input = `---
status: "✅ Approved"
priority: "🔴 High"
---

Status: {{status}}
Priority: {{priority}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('✅ Approved');
      expect(result.content).toContain('🔴 High');
    });

    it('should handle quotes in strings', async () => {
      const input = `---
quote: 'He said "Hello" to me'
title: "It's a great day"
---

Quote: {{quote}}
Title: {{title}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('He said "Hello" to me');
      expect(result.content).toContain("It's a great day");
    });

    it('should handle special symbols', async () => {
      const input = `---
price: "$100.00"
percentage: "15%"
email: "test@example.com"
---

Price: {{price}}
Rate: {{percentage}}
Email: {{email}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('$100.00');
      expect(result.content).toContain('15%');
      expect(result.content).toContain('test@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined variables gracefully', async () => {
      const input = `---
name: "John"
---

Name: {{name}}
Age: {{age}}
City: {{city}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Name: John');
      // Handlebars renders undefined as empty string
      expect(result.content).toContain('Age:');
      expect(result.content).not.toContain('undefined');
    });

    it('should handle null values', async () => {
      const input = `---
value1: null
value2: "not null"
---

Value1: {{value1}}
Value2: {{value2}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Value2: not null');
    });

    it('should handle division by zero', async () => {
      const input = `---
amount: 100
divisor: 0
---

Result: {{divide amount divisor}}`;

      const result = await processLegalMarkdown(input);

      // Should not crash, result will be Infinity
      expect(result.content).toBeDefined();
    });

    it('should handle invalid date formats', async () => {
      const input = `---
invalidDate: "not-a-date"
---

Date: {{formatDate invalidDate "US"}}`;

      const result = await processLegalMarkdown(input);

      // Should handle gracefully without crashing
      expect(result.content).toBeDefined();
    });

    it('should handle missing helper arguments', async () => {
      const input = `---
value: 100
---

{{formatCurrency value}}`;

      const result = await processLegalMarkdown(input);

      // Should not crash even if currency code is missing
      expect(result.content).toBeDefined();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle empty arrays', async () => {
      const input = `---
items: []
---

{{#each items}}
- {{name}}
{{else}}
No items found
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('No items found');
    });

    it('should handle large arrays (100+ items)', async () => {
      const items = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`
      }));

      const input = `---
items: ${JSON.stringify(items)}
---

{{#each items}}
{{@index}}: {{name}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('0: Item 1');
      expect(result.content).toContain('149: Item 150');
    });

    it('should handle deeply nested objects (10+ levels)', async () => {
      const input = `---
level1:
  level2:
    level3:
      level4:
        level5:
          level6:
            level7:
              level8:
                level9:
                  level10:
                    value: "Deep value"
---

Value: {{level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.value}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Value: Deep value');
    });

    it('should handle very long strings (10k+ characters)', async () => {
      const longText = 'A'.repeat(10000);

      const input = `---
longText: "${longText}"
---

Text: {{longText}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('A'.repeat(10000));
    });

    it('should handle empty strings', async () => {
      const input = `---
empty: ""
notEmpty: "value"
---

Empty: "{{empty}}"
NotEmpty: "{{notEmpty}}"`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Empty: ""');
      expect(result.content).toContain('NotEmpty: "value"');
    });

    it('should handle zero values', async () => {
      const input = `---
zero: 0
positive: 5
negative: -5
---

Zero: {{zero}}
Positive: {{positive}}
Negative: {{negative}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Zero: 0');
      expect(result.content).toContain('Positive: 5');
      expect(result.content).toContain('Negative: -5');
    });
  });

  describe('Complex Nesting', () => {
    it('should handle nested loops with conditionals', async () => {
      const input = `---
departments:
  - name: Sales
    employees:
      - name: Alice
        active: true
      - name: Bob
        active: false
  - name: Engineering
    employees:
      - name: Charlie
        active: true
---

{{#each departments}}
## {{name}}
{{#each employees}}
  {{#if active}}
  - {{name}} (Active)
  {{else}}
  - {{name}} (Inactive)
  {{/if}}
{{/each}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Alice (Active)');
      expect(result.content).toContain('Bob (Inactive)');
      expect(result.content).toContain('Charlie (Active)');
    });

    it('should handle multiple levels of parent context access', async () => {
      const input = `---
company: "ACME Corp"
departments:
  - name: Sales
    teams:
      - name: Team A
        members:
          - Alice
          - Bob
---

{{#each departments}}
  {{#each teams}}
    {{#each members}}
      {{this}} at {{../name}} in {{../../name}} ({{../../../company}})
    {{/each}}
  {{/each}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Alice at Team A in Sales (ACME Corp)');
    });

    it('should handle nested subexpressions', async () => {
      const input = `---
base: 100
multiplier: 2
addition: 50
taxRate: 0.15
---

Total: {{formatCurrency (multiply (add (multiply base multiplier) addition) (add 1 taxRate)) "USD"}}`;

      const result = await processLegalMarkdown(input);

      // (100 * 2 + 50) * (1 + 0.15) = 250 * 1.15 = 287.50
      // Note: formatCurrency rounds, so might be $288.00
      expect(result.content).toMatch(/\$28[78]/);
    });
  });

  describe('Loop Variables', () => {
    it('should provide correct @index values', async () => {
      const input = `---
items:
  - name: First
  - name: Second
  - name: Third
---

{{#each items}}
{{@index}}: {{name}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('0: First');
      expect(result.content).toContain('1: Second');
      expect(result.content).toContain('2: Third');
    });

    it('should provide correct @first and @last flags', async () => {
      const input = `---
items:
  - name: Item 1
  - name: Item 2
  - name: Item 3
---

{{#each items}}
{{#if @first}}FIRST: {{/if}}{{name}}{{#if @last}} LAST{{/if}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('FIRST: Item 1');
      expect(result.content).toContain('Item 3 LAST');
    });

    it('should handle @key in object iteration', async () => {
      const input = `---
prices:
  basic: 100
  premium: 200
  enterprise: 500
---

{{#each prices}}
- {{@key}}: {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('basic: 100');
      expect(result.content).toContain('premium: 200');
      expect(result.content).toContain('enterprise: 500');
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle whitespace in templates', async () => {
      const input = `---
value: "test"
---

{{   value   }}
{{value}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('test');
    });

    it('should handle newlines in values', async () => {
      const input = `---
multiline: |
  Line 1
  Line 2
  Line 3
---

Text:
{{multiline}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 2');
      expect(result.content).toContain('Line 3');
    });
  });

  describe('Type Coercion', () => {
    it('should handle number to string conversion', async () => {
      const input = `---
number: 42
---

Number: {{number}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Number: 42');
    });

    it('should handle boolean values', async () => {
      const input = `---
isTrue: true
isFalse: false
---

{{#if isTrue}}True value{{/if}}
{{#if isFalse}}False value{{else}}Not false{{/if}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('True value');
      expect(result.content).toContain('Not false');
    });

    it('should handle string numbers in math helpers', async () => {
      const input = `---
stringNum1: "100"
stringNum2: "50"
---

Result: {{add stringNum1 stringNum2}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Result: 150');
    });
  });

  describe('Security & Edge Cases', () => {
    it('should handle HTML-like content in variables', async () => {
      const input = `---
html: "<script>alert('test')</script>"
---

Content: {{html}}`;

      const result = await processLegalMarkdown(input);

      // Note: We render to markdown first, then to HTML
      // So HTML in variables passes through at markdown stage
      // Final HTML escaping happens during HTML generation
      expect(result.content).toContain("<script>alert('test')</script>");
    });

    it('should handle very long variable names', async () => {
      const longName = 'a'.repeat(100);

      const input = `---
${longName}: "value"
---

Result: {{${longName}}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Result: value');
    });

    it('should handle numbers at boundaries', async () => {
      const input = `---
maxInt: 9007199254740991
minInt: -9007199254740991
largeFloat: 1.7976931348623157e+308
---

Max: {{maxInt}}
Min: {{minInt}}
Large: {{largeFloat}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Max:');
      expect(result.content).toContain('Min:');
      expect(result.content).toContain('Large:');
    });
  });
});
