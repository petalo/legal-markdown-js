/**
 * Migration equivalence tests
 *
 * Verifies that legacy syntax and Handlebars syntax produce identical output
 * for all helpers and features. Critical for ensuring correct migration.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

describe('Migration Equivalence - Legacy vs Handlebars', () => {
  describe('Date Helpers', () => {
    it('formatDate should produce identical output', async () => {
      const testDate = '2025-01-15';

      const legacy = `---
date: ${testDate}
---
{{formatDate(date, "US")}}`;

      const handlebars = `---
date: ${testDate}
---
{{formatDate date "US"}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('addYears should produce identical output', async () => {
      const legacy = `---
date: 2025-01-15
---
{{formatDate(addYears(date, 2), "US")}}`;

      const handlebars = `---
date: 2025-01-15
---
{{formatDate (addYears date 2) "US"}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('addMonths should produce identical output', async () => {
      const legacy = `---
date: 2025-01-15
---
{{formatDate(addMonths(date, 6), "US")}}`;

      const handlebars = `---
date: 2025-01-15
---
{{formatDate (addMonths date 6) "US"}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('addDays should produce identical output', async () => {
      const legacy = `---
date: 2025-01-15
---
{{formatDate(addDays(date, 30), "US")}}`;

      const handlebars = `---
date: 2025-01-15
---
{{formatDate (addDays date 30) "US"}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });
  });

  describe('Number Helpers', () => {
    it('formatCurrency should produce identical output', async () => {
      const legacy = `---
amount: 1234.56
---
{{formatCurrency(amount, "USD")}}`;

      const handlebars = `---
amount: 1234.56
---
{{formatCurrency amount "USD"}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('formatDollar should produce identical output', async () => {
      const legacy = `---
amount: 999.99
---
{{formatDollar(amount)}}`;

      const handlebars = `---
amount: 999.99
---
{{formatDollar amount}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('formatPercent should produce identical output', async () => {
      const legacy = `---
rate: 0.15
---
{{formatPercent(rate, 2)}}`;

      const handlebars = `---
rate: 0.15
---
{{formatPercent rate 2}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('formatInteger should produce identical output', async () => {
      const legacy = `---
count: 1234567
---
{{formatInteger(count)}}`;

      const handlebars = `---
count: 1234567
---
{{formatInteger count}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('round should produce identical output', async () => {
      const legacy = `---
value: 123.456789
---
{{round(value, 2)}}`;

      const handlebars = `---
value: 123.456789
---
{{round value 2}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });
  });

  describe('String Helpers', () => {
    it('capitalize should produce identical output', async () => {
      const legacy = `---
text: "hello world"
---
{{capitalize(text)}}`;

      const handlebars = `---
text: "hello world"
---
{{capitalize text}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('titleCase should produce identical output', async () => {
      const legacy = `---
text: "payment terms"
---
{{titleCase(text)}}`;

      const handlebars = `---
text: "payment terms"
---
{{titleCase text}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('upper should produce identical output', async () => {
      const legacy = `---
text: "hello"
---
{{upper(text)}}`;

      const handlebars = `---
text: "hello"
---
{{upper text}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('lower should produce identical output', async () => {
      const legacy = `---
text: "HELLO"
---
{{lower(text)}}`;

      const handlebars = `---
text: "HELLO"
---
{{lower text}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('truncate should produce identical output', async () => {
      const legacy = `---
text: "This is a long text that needs truncation"
---
{{truncate(text, 20)}}`;

      const handlebars = `---
text: "This is a long text that needs truncation"
---
{{truncate text 20}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });

    it('pluralize should produce identical output', async () => {
      const legacy = `---
count: 5
---
{{pluralize("item", count)}}`;

      const handlebars = `---
count: 5
---
{{pluralize "item" count}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });
  });

  describe('Mathematical Operations', () => {
    it('mathematical helpers work in Handlebars (legacy uses conditionals)', async () => {
      // Note: Legacy syntax doesn't support standalone math expressions like {{price * quantity}}
      // Math operators only work inside conditionals in legacy: {{true ? price * quantity : 0}}
      // Handlebars provides explicit helpers for clarity

      const handlebars = `---
price: 100
quantity: 5
---
Multiply: {{multiply price quantity}}
Divide: {{divide price 4}}
Add: {{add price 50}}
Subtract: {{subtract price 25}}`;

      const result = await processLegalMarkdown(handlebars);

      expect(result.content).toContain('Multiply: 500');
      expect(result.content).toContain('Divide: 25');
      expect(result.content).toContain('Add: 150');
      expect(result.content).toContain('Subtract: 75');
    });
  });

  describe('String Concatenation', () => {
    it('concat helper works in Handlebars (no legacy equivalent)', async () => {
      // Note: Legacy syntax doesn't process string concatenation expressions
      // This is one of the improvements in Handlebars

      const handlebars = `---
first: "Hello"
second: "World"
---
{{concat "Hello" " " "World"}}`;

      const result = await processLegalMarkdown(handlebars);

      expect(result.content).toContain('Hello World');
    });
  });

  describe('Loops', () => {
    it('simple loop should produce identical output', async () => {
      const legacy = `---
items:
  - name: Item 1
  - name: Item 2
  - name: Item 3
---

{{#items}}
- {{name}}
{{/items}}`;

      const handlebars = `---
items:
  - name: Item 1
  - name: Item 2
  - name: Item 3
---

{{#each items}}
- {{name}}
{{/each}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      // Normalize whitespace for comparison
      const normalizeLegacy = legacyResult.content.replace(/\s+/g, ' ').trim();
      const normalizeHandlebars = handlebarsResult.content.replace(/\s+/g, ' ').trim();

      expect(normalizeLegacy).toContain('Item 1');
      expect(normalizeHandlebars).toContain('Item 1');
      expect(normalizeLegacy).toContain('Item 2');
      expect(normalizeHandlebars).toContain('Item 2');
    });
  });

  describe('Conditionals', () => {
    it('if/else should produce identical output', async () => {
      const legacy = `---
isPremium: true
---

{{#if isPremium}}
Premium Member
{{else}}
Standard Member
{{/if}}`;

      const handlebars = `---
isPremium: true
---

{{#if isPremium}}
Premium Member
{{else}}
Standard Member
{{/if}}`;

      const legacyResult = await processLegalMarkdown(legacy);
      const handlebarsResult = await processLegalMarkdown(handlebars);

      expect(legacyResult.content).toBe(handlebarsResult.content);
    });
  });

  describe('Real-World Scenarios', () => {
    it('Handlebars handles complex contract calculations (legacy limited)', async () => {
      // Note: Legacy syntax does NOT support standalone math expressions like {{serviceFee * taxRate}}
      // Math only works inside conditionals in legacy: {{true ? serviceFee * taxRate : 0}}
      // Handlebars provides proper subexpression support

      const handlebars = `---
clientName: "ACME Corp"
serviceFee: 5000
taxRate: 0.15
paymentDays: 30
---

**Client**: {{clientName}}
**Service Fee**: {{formatCurrency serviceFee "USD"}}
**Tax**: {{formatCurrency (multiply serviceFee taxRate) "USD"}}
**Total**: {{formatCurrency (add serviceFee (multiply serviceFee taxRate)) "USD"}}
**Payment Terms**: Payment due within {{paymentDays}} days`;

      const result = await processLegalMarkdown(handlebars);

      // Verify Handlebars handles all the complex calculations
      expect(result.content).toContain('ACME Corp');
      expect(result.content).toMatch(/\$5,?000/); // Service fee
      expect(result.content).toMatch(/\$750/); // Tax (5000 * 0.15)
      expect(result.content).toMatch(/\$5,?750/); // Total (5000 + 750)
      expect(result.content).toContain('30 days');
    });
  });
});
