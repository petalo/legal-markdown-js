/**
 * @fileoverview Integration tests for Handlebars syntax support
 *
 * Comprehensive test suite verifying Handlebars template syntax works correctly
 * across all features: helpers, loops, conditionals, subexpressions, etc.
 */

import { describe, it, expect, vi } from 'vitest';
import { processLegalMarkdownWithRemark as processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Handlebars Syntax Support - Integration Tests', () => {
  describe('Syntax Detection', () => {
    it('should detect and process Handlebars helper syntax', async () => {
      const content = `---
date: 2025-01-15
---
Formatted: {{formatDate date "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2025-01-15');
    });

    it('should detect legacy syntax and log warnings', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const content = `---
date: 2025-01-15
---
Legacy: {{formatDate(date, "YYYY-MM-DD")}}`;

      await processLegalMarkdown(content);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: Legacy Template Syntax')
      );

      warnSpy.mockRestore();
    });

    it('should error on mixed syntax', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const content = `---
date: 2025-01-15
---
{{formatDate date "YYYY-MM-DD"}}
{{addYears(date, 2)}}`;

      await processLegalMarkdown(content);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mixed template syntax')
      );

      errorSpy.mockRestore();
    });
  });

  describe('Date Helpers', () => {
    it('should format dates with formatDate helper', async () => {
      const content = `---
startDate: 2025-01-15
---
Legal: {{formatDate startDate "MMMM D, YYYY"}}
ISO: {{formatDate startDate "YYYY-MM-DD"}}
US: {{formatDate startDate "MM/DD/YYYY"}}
EU: {{formatDate startDate "DD/MM/YYYY"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('2025-01-15');
      expect(result.content).toContain('01/15/2025');
      expect(result.content).toContain('15/01/2025');
    });

    it('should add years to dates with addYears', async () => {
      const content = `---
startDate: 2025-01-15
---
Future: {{formatDate (addYears startDate 2) "YYYY-MM-DD"}}
Past: {{formatDate (addYears startDate -1) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('2027-01-15');
      expect(result.content).toContain('2024-01-15');
    });

    it('should add months to dates with addMonths', async () => {
      const content = `---
startDate: 2025-01-15
---
Future: {{formatDate (addMonths startDate 6) "YYYY-MM-DD"}}
Past: {{formatDate (addMonths startDate -3) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('2025-07-15');
      expect(result.content).toContain('2024-10-15');
    });

    it('should add days to dates with addDays', async () => {
      const content = `---
startDate: 2025-01-15
---
Future: {{formatDate (addDays startDate 30) "YYYY-MM-DD"}}
Past: {{formatDate (addDays startDate -7) "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('2025-02-14');
      expect(result.content).toContain('2025-01-08');
    });

    it('should work with @today special variable', async () => {
      const content = `Date: {{formatDate @today "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);

      // Should contain a date in YYYY-MM-DD format
      expect(result.content).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Number Helpers', () => {
    it('should format currency with formatCurrency', async () => {
      const content = `---
price: 1234.56
---
USD: {{formatCurrency price "USD" 2}}
EUR: {{formatCurrency price "EUR" 2}}
GBP: {{formatCurrency price "GBP" 2}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toMatch(/\$1,234\.56/);
      expect(result.content).toMatch(/1[.,]234[.,]56\s*€/); // Euro symbol at the end
      expect(result.content).toMatch(/£1,234\.56/);
    });

    it('should format dollars with formatDollar', async () => {
      const content = `---
amount: 1234.56
---
Total: {{formatDollar amount 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/\$1,234\.56/);
    });

    it('should format percentages with formatPercent', async () => {
      const content = `---
rate: 0.075
---
Rate: {{formatPercent rate 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('7.50%');
    });

    it('should format integers with formatInteger', async () => {
      const content = `---
population: 1234567
---
Population: {{formatInteger population ","}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('1,234,567');
    });

    it('should round numbers with round', async () => {
      const content = `---
pi: 3.14159
---
Rounded: {{round pi 2}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('3.14');
    });
  });

  describe('String Helpers', () => {
    it('should capitalize strings', async () => {
      const content = `Capitalized: {{capitalize "hello world"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Hello world');
    });

    it('should title case strings', async () => {
      const content = `Title: {{titleCase "the quick brown fox"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('The Quick Brown Fox');
    });

    it('should convert to uppercase', async () => {
      const content = `Upper: {{upper "hello"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('HELLO');
    });

    it('should convert to lowercase', async () => {
      const content = `Lower: {{lower "HELLO"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello');
    });

    it('should truncate strings', async () => {
      const content = `Truncated: {{truncate "This is a very long string" 10 "..."}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('This is...');
    });

    it('should convert to kebab-case', async () => {
      const content = `Kebab: {{kebabCase "Hello World"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('hello-world');
    });

    it('should convert to snake_case', async () => {
      const content = `Snake: {{snakeCase "Hello World"}}`;

      const result = await processLegalMarkdown(content);
      // Underscore may be escaped in markdown output
      expect(result.content).toMatch(/hello[_\\]+world/);
    });

    it('should convert to camelCase', async () => {
      const content = `Camel: {{camelCase "hello world"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('helloWorld');
    });

    it('should extract initials', async () => {
      const content = `---
name: "John Doe"
---
Initials: {{initials name}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('JD');
    });
  });

  describe('Mathematical Helpers', () => {
    it('should multiply numbers', async () => {
      const content = `---
price: 100
quantity: 5
---
Total: {{multiply price quantity}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('500');
    });

    it('should divide numbers', async () => {
      const content = `---
total: 100
count: 4
---
Average: {{divide total count}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('25');
    });

    it('should add numbers', async () => {
      const content = `---
subtotal: 100
tax: 8
---
Total: {{add subtotal tax}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('108');
    });

    it('should subtract numbers', async () => {
      const content = `---
original: 100
discount: 20
---
Final: {{subtract original discount}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('80');
    });

    it('should chain mathematical operations', async () => {
      const content = `---
price: 100
quantity: 5
taxRate: 0.08
---
Total: {{add (multiply price quantity) (multiply (multiply price quantity) taxRate)}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('540');
    });
  });

  describe('Concat Helper', () => {
    it('should concatenate strings', async () => {
      const content = `---
firstName: "John"
lastName: "Doe"
---
Name: {{concat firstName " " lastName}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('John Doe');
    });

    it('should concatenate with symbols', async () => {
      const content = `---
price: 100
---
Price: {{concat "$" price}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('$100');
    });

    it('should concatenate multiple values', async () => {
      const content = `---
area: "555"
phone: "1234567"
---
Phone: {{concat "(" area ") " phone}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('(555) 1234567');
    });
  });

  describe('Subexpressions', () => {
    it('should handle nested helper calls with dates', async () => {
      const content = `---
startDate: 2025-01-15
---
Expiration: {{formatDate (addYears startDate 5) "MMMM D, YYYY"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('January 15, 2030');
    });

    it('should handle nested helper calls with numbers', async () => {
      const content = `---
price: 100
quantity: 5
---
Total: {{formatCurrency (multiply price quantity) "USD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toMatch(/\$500/);
    });

    it('should handle deeply nested subexpressions', async () => {
      const content = `---
firstName: "john"
lastName: "doe"
---
Name: {{upper (concat firstName " " lastName)}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('JOHN DOE');
    });

    it('should handle complex date calculations', async () => {
      const content = `---
startDate: 2025-01-15
---
Complex: {{formatDate (addDays (addMonths (addYears startDate 1) 6) 15) "MMMM D, YYYY"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('July 30, 2026');
    });
  });

  describe('Loops with #each', () => {
    it('should iterate over arrays with #each', async () => {
      const content = `---
items:
  - Apple
  - Banana
  - Cherry
---
{{#each items}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Apple');
      expect(result.content).toContain('Banana');
      expect(result.content).toContain('Cherry');
    });

    it('should access object properties in loops', async () => {
      const content = `---
products:
  - name: "Product A"
    price: 100
  - name: "Product B"
    price: 200
---
{{#each products}}
- {{name}}: {{formatCurrency price "USD"}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Product A');
      expect(result.content).toContain('Product B');
      expect(result.content).toMatch(/\$100/);
      expect(result.content).toMatch(/\$200/);
    });

    it('should use @index in loops', async () => {
      const content = `---
items:
  - Apple
  - Banana
  - Cherry
---
{{#each items}}
{{@index}}. {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('0. Apple');
      expect(result.content).toContain('1. Banana');
      expect(result.content).toContain('2. Cherry');
    });

    it('should use @first and @last in loops', async () => {
      const content = `---
items:
  - First
  - Middle
  - Last
---
{{#each items}}
{{#if @first}}(First) {{/if}}{{this}}{{#if @last}} (Last){{/if}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('(First) First');
      expect(result.content).toContain('Last (Last)');
    });
  });

  describe('Conditionals', () => {
    it('should render content when condition is true', async () => {
      const content = `---
isPremium: true
---
{{#if isPremium}}
Premium Member
{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Premium Member');
    });

    it('should render else block when condition is false', async () => {
      const content = `---
isPremium: false
---
{{#if isPremium}}
Premium Member
{{else}}
Standard Member
{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Standard Member');
      expect(result.content).not.toContain('Premium Member');
    });

    it('should handle nested conditionals', async () => {
      const content = `---
isPremium: true
hasDiscount: true
---
{{#if isPremium}}
Premium:
{{#if hasDiscount}}
- With discount
{{/if}}
{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Premium');
      expect(result.content).toContain('With discount');
    });

    it('should use #unless for inverse conditionals', async () => {
      const content = `---
isActive: false
---
{{#unless isActive}}
Account inactive
{{/unless}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Account inactive');
    });
  });

  describe('Parent Context Access', () => {
    it('should access parent context with ../', async () => {
      const content = `---
company: "ACME Corp"
departments:
  - name: "Sales"
    employees:
      - "Alice"
      - "Bob"
---
{{#each departments}}
{{name}} at {{../company}}:
{{#each employees}}
- {{this}}
{{/each}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Sales at ACME Corp');
      expect(result.content).toContain('Alice');
      expect(result.content).toContain('Bob');
    });

    it('should access grandparent context with ../../', async () => {
      const content = `---
company: "ACME Corp"
domain: "acme.com"
departments:
  - name: "Sales"
    employees:
      - "Alice"
      - "Bob"
---
{{#each departments}}
{{#each employees}}
- {{this}} at {{../../company}} ({{this}}@{{../../domain}})
{{/each}}
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Alice at ACME Corp');
      expect(result.content).toContain('Alice@acme.com');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should process a contract with all features', async () => {
      const content = `---
contractDate: 2025-01-15
parties:
  - name: "ACME Corp"
    role: "Provider"
  - name: "Client Inc"
    role: "Client"
amount: 50000
duration: 2
services:
  - "Consulting"
  - "Development"
  - "Support"
---
# SERVICE AGREEMENT

Date: {{formatDate contractDate "MMMM D, YYYY"}}

## Parties

{{#each parties}}
{{@index}}. {{name}} ({{role}})
{{/each}}

## Terms

- Amount: {{formatCurrency amount "USD"}}
- Duration: {{duration}} years
- Expiration: {{formatDate (addYears contractDate duration) "MMMM D, YYYY"}}

## Services

{{#each services}}
- {{this}}{{#unless @last}};{{/unless}}
{{/each}}

Total Value: {{formatCurrency (multiply amount duration) "USD"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('ACME Corp');
      expect(result.content).toContain('Provider');
      expect(result.content).toContain('Client Inc');
      expect(result.content).toMatch(/\$50,000/);
      expect(result.content).toContain('January 15, 2027');
      expect(result.content).toContain('Consulting');
      expect(result.content).toContain('Development');
      expect(result.content).toContain('Support');
      expect(result.content).toMatch(/\$100,000/);
    });

    it('should handle office lease with nested data', async () => {
      const content = `---
lessor: "Property Management LLC"
lessee: "Tech Startup Inc"
startDate: 2025-01-15
duration: 5
monthlyRent: 5000
services:
  included:
    - "Water"
    - "Electricity"
    - "Internet"
  additional:
    - "Cleaning"
    - "Security"
---
# OFFICE LEASE AGREEMENT

Between {{lessor}} and {{lessee}}

**Term:** {{formatDate startDate "MMMM D, YYYY"}} to {{formatDate (addYears startDate duration) "MMMM D, YYYY"}}

**Monthly Rent:** {{formatCurrency monthlyRent "USD"}}

## Included Services
{{#each services.included}}
- {{this}}
{{/each}}

## Additional Services (extra cost)
{{#each services.additional}}
- {{this}}
{{/each}}

**Total Contract Value:** {{formatCurrency (multiply monthlyRent (multiply 12 duration)) "USD"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Property Management LLC');
      expect(result.content).toContain('Tech Startup Inc');
      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('January 15, 2030');
      expect(result.content).toMatch(/\$5,000/);
      expect(result.content).toContain('Water');
      expect(result.content).toContain('Electricity');
      expect(result.content).toContain('Cleaning');
      expect(result.content).toMatch(/\$300,000/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', async () => {
      const content = `---
items: []
---
{{#each items}}
- {{this}}
{{else}}
No items
{{/each}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('No items');
    });

    it('should handle undefined variables gracefully', async () => {
      const content = `Value: {{undefinedVar}}`;

      const result = await processLegalMarkdown(content);
      // Should not throw error
      expect(result.content).toBeDefined();
    });

    it('should handle null values', async () => {
      const content = `---
value: null
---
{{#if value}}
Has value
{{else}}
No value
{{/if}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('No value');
    });

    it('should handle special characters in strings', async () => {
      const content = `Special: {{concat "Price: $" 100 " (inc. tax)"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('Price: $100 (inc. tax)');
    });

    it('should handle numbers with many decimals', async () => {
      const content = `---
pi: 3.141592653589793
---
Pi: {{round pi 5}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('3.14159');
    });
  });

  describe('ISO Date Parsing from YAML', () => {
    it('should parse ISO date strings as Date objects', async () => {
      const content = `---
startDate: 2025-01-15
endDate: 2027-12-31
---
Start: {{formatDate startDate "MMMM D, YYYY"}}
End: {{formatDate endDate "MMMM D, YYYY"}}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('December 31, 2027');
    });

    it('should work with date arithmetic on ISO dates', async () => {
      const content = `---
contractDate: 2025-01-15
---
Expiration: {{formatDate (addYears contractDate 3) "MMMM D, YYYY"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('January 15, 2028');
    });

    it('should parse ISO datetime strings', async () => {
      const content = `---
timestamp: 2025-01-15T10:30:00Z
---
Date: {{formatDate timestamp "YYYY-MM-DD"}}`;

      const result = await processLegalMarkdown(content);
      expect(result.content).toContain('2025-01-15');
    });
  });
});
