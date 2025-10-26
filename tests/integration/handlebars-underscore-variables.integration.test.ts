/**
 * Integration tests for Handlebars with underscore variable names
 *
 * Tests Issue #147 fix: Underscores in variable names should not be escaped
 * when using Handlebars syntax, as they are valid identifiers.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdown } from '../../src/index';

describe('Handlebars - Underscore Variables', () => {
  describe('snake_case variable names', () => {
    it('should handle snake_case variables in Handlebars helpers', async () => {
      const input = `---
section_name: "Payment Terms"
late_fee_rate: 0.05
---

## {{titleCase section_name}}

The late fee rate is {{formatPercent late_fee_rate 1}}.`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Payment Terms');
      expect(result.content).toContain('The late fee rate is 5.0%.');
    });

    it('should handle multiple snake_case variables in same expression', async () => {
      const input = `---
first_name: "John"
last_name: "Doe"
---

Name: {{concat first_name " " last_name}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Name: John Doe');
    });

    it('should handle snake_case in nested Handlebars blocks', async () => {
      const input = `---
company_name: "ACME Corp"
has_insurance: true
---

{{#if has_insurance}}
Company: {{company_name}} has insurance coverage.
{{/if}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Company: ACME Corp has insurance coverage.');
    });

    it('should handle snake_case in loops', async () => {
      const input = `---
team_members:
  - full_name: "Alice Smith"
    job_title: "Engineer"
  - full_name: "Bob Jones"
    job_title: "Manager"
---

{{#each team_members}}
- {{full_name}}: {{job_title}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Alice Smith: Engineer');
      expect(result.content).toContain('Bob Jones: Manager');
    });
  });

  describe('mixed underscore patterns', () => {
    it('should handle variables with multiple underscores', async () => {
      const input = `---
first_middle_last: "John Q. Public"
service_level_agreement: "Premium"
---

Name: {{first_middle_last}}
SLA: {{service_level_agreement}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Name: John Q. Public');
      expect(result.content).toContain('SLA: Premium');
    });

    it('should handle snake_case with numbers', async () => {
      const input = `---
payment_plan_1: "Monthly"
payment_plan_2: "Quarterly"
---

Plans: {{payment_plan_1}} and {{payment_plan_2}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Plans: Monthly and Quarterly');
    });

    it('should handle snake_case in subexpressions', async () => {
      const input = `---
base_price: 100
tax_rate: 0.15
---

Total: {{formatDollar (multiply base_price (add 1 tax_rate))}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Total: $115.00');
    });
  });

  describe('edge cases', () => {
    it('should handle variables starting with underscore', async () => {
      const input = `---
_internal_code: "X-123"
---

Code: {{_internal_code}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Code: X-123');
    });

    it('should handle variables ending with underscore', async () => {
      const input = `---
temp_value_: 42
---

Value: {{temp_value_}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Value: 42');
    });

    it('should handle very long snake_case names', async () => {
      const input = `---
very_long_variable_name_with_many_underscores: "Test Value"
---

Result: {{very_long_variable_name_with_many_underscores}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Result: Test Value');
    });
  });

  describe('context access with underscores', () => {
    it('should handle parent context access with snake_case', async () => {
      const input = `---
company_name: "ACME Corp"
departments:
  - dept_name: "Engineering"
  - dept_name: "Sales"
---

{{#each departments}}
{{dept_name}} at {{../company_name}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Engineering at ACME Corp');
      expect(result.content).toContain('Sales at ACME Corp');
    });

    it('should handle deeply nested context with snake_case', async () => {
      const input = `---
top_level: "Root"
level_one:
  - name: "L1"
    level_two:
      - item_name: "L2-A"
      - item_name: "L2-B"
---

{{#each level_one}}
  {{#each level_two}}
    {{item_name}} ({{../../top_level}})
  {{/each}}
{{/each}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('L2-A (Root)');
      expect(result.content).toContain('L2-B (Root)');
    });
  });

  describe('legacy syntax compatibility', () => {
    it('should still escape underscores in legacy syntax', async () => {
      const input = `---
legal_name: "ACME Corporation"
---

{{legal_name}}`;

      // Legacy syntax detection should identify simple {{var}} as legacy
      // and escape underscores to prevent markdown italic parsing
      const result = await processLegalMarkdown(input);

      // The variable should still be replaced correctly
      expect(result.content).toContain('ACME Corporation');
    });
  });

  describe('mixed syntax handling', () => {
    it('should not escape underscores in mixed syntax documents', async () => {
      const input = `---
section_name: "Payment Terms"
old_field: "Legacy Value"
amount: 100
---

{{titleCase section_name}}

{{old_field}}

Total: {{formatDollar amount}}`;

      // Mixed syntax: contains both Handlebars (titleCase, formatDollar) and simple variables
      // Should not escape to avoid breaking Handlebars variables
      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Payment Terms');
      expect(result.content).toContain('Legacy Value');
      expect(result.content).toContain('Total: $100.00');
    });

    it('should handle mixed syntax with snake_case in both styles', async () => {
      const input = `---
company_name: "ACME Corp"
tax_rate: 0.15
base_amount: 1000
---

Company: {{company_name}}

Tax: {{formatPercent tax_rate 2}}

Total: {{formatDollar (multiply base_amount (add 1 tax_rate))}}`;

      const result = await processLegalMarkdown(input);

      expect(result.content).toContain('Company: ACME Corp');
      expect(result.content).toContain('Tax: 15.00%');
      expect(result.content).toContain('Total: $1,150.00');
    });
  });
});
