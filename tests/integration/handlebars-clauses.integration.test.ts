/**
 * @fileoverview Integration tests for Handlebars syntax with Optional Clauses
 *
 * Tests that Handlebars helpers work correctly inside optional/conditional clauses [content]{condition}.
 * This is critical for dynamic contract generation with conditional sections.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark as processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Handlebars + Optional Clauses Integration', () => {
  describe('Helpers Inside Optional Clauses', () => {
    it('should process helpers when clause is shown', async () => {
      const content = `---
showPayment: true
amount: 5000
date: 2025-01-15
---
[**Payment:** {{formatCurrency amount "USD" 2}} due by {{formatDate date "MMMM D, YYYY"}}]{showPayment}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('$5,000.00');
      expect(result.content).toContain('January 15, 2025');
    });

    it('should not render helpers when clause is hidden', async () => {
      const content = `---
showPayment: false
amount: 5000
---
[**Payment:** {{formatCurrency amount "USD" 2}}]{showPayment}

Other content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).not.toContain('$5,000');
      expect(result.content).toContain('Other content');
    });

    it('should handle string helpers in optional clauses', async () => {
      const content = `---
includeWarranty: true
client: "john doe"
---
[**Warranty Holder:** {{titleCase client}}]{includeWarranty}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('John Doe');
    });
  });

  describe('Multi-line Clauses with Markdown', () => {
    it('should process multi-line clauses with legal headers', async () => {
      const content = `---
includeWarranties: true
level-one: "Section %n."
level-two: "%n.%s"
---
[l. **Warranties**

The Provider warrants that services will be performed professionally.]{includeWarranties}

Other content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Warranties');
      expect(result.content).toContain('professionally');
      expect(result.content).toContain('Other content');
      expect(result.content).toMatch(/Section|#/); // Should have header formatting
    });

    it('should process multi-line clauses with helpers', async () => {
      const content = `---
showLateFee: true
lateFeeRate: 0.015
gracePeriod: 15
---
[Late payments will incur a {{formatPercent lateFeeRate 1}} monthly fee
after {{gracePeriod}} days grace period.]{showLateFee}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('1.5%');
      expect(result.content).toContain('15 days');
    });

    it('should hide multi-line clauses when condition is false', async () => {
      const content = `---
showSection: false
---
[## Important Section

This should not appear.

With multiple lines.]{showSection}

Visible content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).not.toContain('Important Section');
      expect(result.content).not.toContain('should not appear');
      expect(result.content).toContain('Visible content');
    });
  });

  describe('Multiple Helpers in One Clause', () => {
    it('should process multiple helpers in single optional clause', async () => {
      const content = `---
showTermination: true
startDate: 2025-01-01
noticeDays: 30
---
[This agreement may be terminated with {{noticeDays}} days notice, effective no earlier than {{formatDate (addDays startDate noticeDays) "MMMM D, YYYY"}}.]{showTermination}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('30 days notice');
      expect(result.content).toContain('January 31, 2025');
    });
  });

  describe('Nested Clauses', () => {
    it('should handle nested clauses with helpers', async () => {
      const content = `---
includeSection: true
showDetails: true
amount: 1000
---
[## Payment Section

Base amount: {{formatCurrency amount "USD" 0}}

[Additional details: {{formatCurrency (multiply amount 1.1) "USD" 2}}]{showDetails}
]{includeSection}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Payment Section');
      expect(result.content).toContain('$1,000');
      expect(result.content).toContain('$1,100.00');
    });
  });

  describe('Date Helpers in Clauses', () => {
    it('should process date arithmetic in optional clauses', async () => {
      const content = `---
showTimeline: true
startDate: 2025-01-15
---
[Project timeline: Start on {{formatDate startDate "MMMM D, YYYY"}}, complete by {{formatDate (addMonths startDate 6) "MMMM D, YYYY"}}]{showTimeline}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('July 15, 2025');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty values in helpers within clauses', async () => {
      const content = `---
showClient: true
clientName: ""
---
[**Client:** {{titleCase clientName}}]{showClient}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toBeDefined();
      expect(result.content).toContain('**Client:**');
    });

    it('should handle complex boolean conditions with helpers', async () => {
      const content = `---
showAmount: true
amount: 5000
threshold: 1000
---
[**High Value Transaction:** {{formatCurrency amount "USD" 2}}]{showAmount}`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('$5,000.00');
    });
  });
});
