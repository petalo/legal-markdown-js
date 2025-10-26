/**
 * @fileoverview Integration tests for Handlebars syntax with Legal Headers
 *
 * Tests that Handlebars helpers work correctly inside legal header definitions (ll.)
 * This is critical for contracts that use dynamic section names.
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark as processLegalMarkdown } from '../../src/extensions/remark/legal-markdown-processor';

describe('Handlebars + Legal Headers Integration', () => {
  describe('Helpers in Header Text', () => {
    it('should process helpers in legal header text', async () => {
      const content = `---
sectionName: "payment terms"
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. {{titleCase sectionName}}

This section describes payment.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Payment Terms');
      expect(result.content).toMatch(/<h2|Section/);
    });

    it('should process date helpers in headers', async () => {
      const content = `---
effectiveDate: 2025-01-15
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. Effective {{formatDate effectiveDate "MMMM YYYY"}}

Content here.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Effective January 2025');
    });

    it('should process number helpers in headers', async () => {
      const content = `---
sectionNumber: 5
version: 1.2
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. Section {{sectionNumber}} - Version {{version}}

Content here.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Section');
      expect(result.content).toContain('5');
      expect(result.content).toContain('1.2');
    });
  });

  describe('Complex Headers with Multiple Helpers', () => {
    it('should handle multiple helpers in one header', async () => {
      const content = `---
client: "acme corp"
date: 2025-01-15
amount: 5000
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. {{titleCase client}} - {{formatDate date "MMMM D, YYYY"}} - {{formatCurrency amount "USD" 0}}

Agreement details.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Acme Corp');
      expect(result.content).toContain('January 15, 2025');
      expect(result.content).toContain('$5,000');
    });

    it('should handle subexpressions in headers', async () => {
      const content = `---
startDate: 2025-01-01
duration: 2
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. Contract Period: {{formatDate startDate "MMM YYYY"}} to {{formatDate (addYears startDate duration) "MMM YYYY"}}

Terms and conditions.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Jan 2025');
      expect(result.content).toContain('Jan 2027');
    });
  });

  describe('Headers with Conditionals', () => {
    it('should handle conditionals in header text', async () => {
      const content = `---
isAmendment: true
version: 2
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. {{#if isAmendment}}Amendment {{version}}{{else}}Original Agreement{{/if}}

Content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Amendment 2');
      expect(result.content).not.toContain('Original Agreement');
    });

    it('should handle ternary conditionals in headers', async () => {
      const content = `---
isFinal: false
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. {{isFinal ? "Final" : "Draft"}} Version

Content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Draft Version');
    });
  });

  describe('Nested Headers with Handlebars', () => {
    it('should process helpers in hierarchical headers', async () => {
      const content = `---
sectionOne: "introduction"
sectionTwo: "scope"
level-one: 'Article %n.'
level-two: 'Section %n.%s'
---
l. {{titleCase sectionOne}}

Some intro text.

ll. {{titleCase sectionTwo}}

Scope details.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Introduction');
      expect(result.content).toContain('Scope');
      expect(result.content).toMatch(/Article \d+\./);
      expect(result.content).toMatch(/Section \d+/);
    });
  });

  describe('Headers with String Manipulation Helpers', () => {
    it('should process string helpers in headers', async () => {
      const content = `---
company: "ACME CORPORATION"
code: "SVC-2025-001"
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. {{lower company}} - {{upper code}}

Details.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('acme corporation');
      expect(result.content).toContain('SVC-2025-001');
    });

    it('should handle initials helper in headers', async () => {
      const content = `---
partyA: "John Michael Smith"
partyB: "Sarah Jane Doe"
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. Agreement between {{initials partyA}} and {{initials partyB}}

Terms.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('JMS');
      expect(result.content).toContain('SJD');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty values in headers gracefully', async () => {
      const content = `---
sectionName: ""
level-one: "Article %n."
level-two: "Section %n.%s"
---
ll. Payment Terms {{titleCase sectionName}}

Content.`;

      const result = await processLegalMarkdown(content);

      // Should render the header with empty value processed
      expect(result.content).toContain('Payment Terms');
      expect(result.content).toMatch(/<h2|Section/);
    });

    it('should handle undefined variables in headers', async () => {
      const content = `---
level-one: 'Article %n.'
level-two: 'Section %n.%s'
---
ll. {{titleCase missingVar}}

Content.`;

      const result = await processLegalMarkdown(content);

      // Should handle undefined gracefully
      expect(result.content).toBeDefined();
    });

    it('should handle mathematical helpers in headers', async () => {
      const content = `---
year: 2025
quarter: 1
level-one: 'Section %n'
---
ll. Q{{quarter}} {{year}} - Total: {{multiply quarter 3}} months

Content.`;

      const result = await processLegalMarkdown(content);

      expect(result.content).toContain('Q1 2025');
      expect(result.content).toContain('Total: 3 months');
    });
  });
});
