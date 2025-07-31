/**
 * @fileoverview Unit Tests for Nested Helper Function Support
 * 
 * Tests the ability to use nested helper function calls within template fields,
 * such as {{formatDate(addYears(@today, 5), "YYYY-MM-DD")}}.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkTemplateFields from '../../../../src/plugins/remark/template-fields';

/**
 * Helper function to process markdown with template fields
 */
async function processWithNestedHelpers(
  markdown: string, 
  metadata: Record<string, any> = {}
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkTemplateFields, { 
      metadata,
      enableFieldTracking: false,
      debug: false
    })
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      incrementListMarker: false,
    });

  const result = await processor.process(markdown);
  return result.toString().trim();
}

describe('Nested Helper Function Support', () => {
  describe('Date Helper Nesting', () => {
    it('should process formatDate with addYears nested call', async () => {
      const input = 'Expiry: {{formatDate(addYears(@today, 5), "YYYY-MM-DD")}}.';
      const metadata = { '@today': new Date('2023-01-15') };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Expiry: 2028-01-15.');
    });

    it('should process formatDate with addMonths nested call', async () => {
      const input = 'Review date: {{formatDate(addMonths(@today, 6), "MMMM D, YYYY")}}.';
      const metadata = { '@today': new Date('2023-01-15') };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Review date: July 15, 2023.');
    });

    it('should process formatDate with addDays nested call', async () => {
      const input = 'Deadline: {{formatDate(addDays(@today, 30), "DD/MM/YYYY")}}.';
      const metadata = { '@today': new Date('2023-01-15') };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Deadline: 14/02/2023.');
    });

    it('should handle complex date formatting with nested calls', async () => {
      const input = 'Contract expires on {{formatDate(addYears(contractStart, 3), "MMMM Do, YYYY")}}.';
      const metadata = { contractStart: new Date('2020-03-20') };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Contract expires on March 20th, 2023.');
    });
  });

  describe('String Helper Nesting', () => {
    it('should process truncate with upper nested call', async () => {
      const input = 'Summary: {{truncate(upper(title), 15)}}.';
      const metadata = { title: 'service agreement document' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Summary: SERVICE AGRE....');
    });

    it('should process titleCase with truncate nested call', async () => {
      const input = 'Short title: {{titleCase(truncate(longTitle, 20))}}.';
      const metadata = { longTitle: 'this is a very long document title that needs truncation' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Short title: This Is a Very Lo....'); 
    });

    it('should process capitalize with lower nested call', async () => {
      const input = 'Name: {{capitalize(lower(fullName))}}.';
      const metadata = { fullName: 'JOHN DOE SMITH' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Name: John doe smith.');
    });
  });

  describe('Number Helper Nesting', () => {
    it('should process formatCurrency with round nested call', async () => {
      const input = 'Total: {{formatCurrency(round(amount, 2), "USD")}}.';
      const metadata = { amount: 1234.5678 };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Total: $1,234.57.');
    });

    it('should process numberToWords with round nested call', async () => {
      const input = 'Amount: {{numberToWords(round(payment, 0))}} dollars.';
      const metadata = { payment: 1499.87 };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Amount: one thousand five hundred dollars.');
    });
  });

  describe('Complex Nested Expressions', () => {
    it('should handle multiple levels of nesting', async () => {
      const input = 'Formatted: {{upper(truncate(titleCase(description), 25))}}.';
      const metadata = { description: 'comprehensive legal service agreement document' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Formatted: COMPREHENSIVE LEGAL SE....');
    });

    it('should handle mixed helper types in nesting', async () => {
      const input = 'Info: {{formatCurrency(round(amount, 0), "USD")}} on {{formatDate(addDays(@today, 30), "MMMM D")}}.';
      const metadata = { 
        amount: 2499.99, 
        '@today': new Date('2023-01-15') 
      };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Info: $2,500.00 on February 14.');
    });

    it('should handle nested calls with string literals', async () => {
      const input = 'Padded: {{padStart(upper("hello"), 10, "*")}}.';
      const metadata = {};

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Padded: \\*\\*\\*\\*\\*HELLO.');
    });
  });

  describe('Error Handling in Nested Calls', () => {
    it('should handle errors in nested helper gracefully', async () => {
      const input = 'Result: {{formatDate(invalidHelper(date), "YYYY")}}.';
      const metadata = { date: new Date('2023-01-15') };

      const result = await processWithNestedHelpers(input, metadata);

      // Should leave the template field unprocessed when nested helper fails
      expect(result).toBe('Result: {{formatDate(invalidHelper(date), "YYYY")}}.');
    });

    it('should handle invalid arguments in nested calls', async () => {
      const input = 'Date: {{formatDate(addYears("invalid", 5), "YYYY")}}.';
      const metadata = {};

      const result = await processWithNestedHelpers(input, metadata);

      // Should leave the template field unprocessed when nested call fails
      expect(result).toBe('Date: {{formatDate(addYears("invalid", 5), "YYYY")}}.');
    });

    it('should handle partial nesting failures', async () => {
      const input = 'Mixed: {{upper(title)}} and {{formatDate(invalidHelper(date), "YYYY")}}.';
      const metadata = { 
        title: 'working title',
        date: new Date('2023-01-15')
      };

      const result = await processWithNestedHelpers(input, metadata);

      // Should process valid parts and leave invalid parts unprocessed
      expect(result).toBe('Mixed: WORKING TITLE and {{formatDate(invalidHelper(date), "YYYY")}}.');
    });
  });

  describe('Argument Parsing with Nesting', () => {
    it('should correctly parse nested calls with commas in strings', async () => {
      const input = 'Result: {{formatDate(addYears(@today, 2), "MMMM Do, YYYY")}}.';
      const metadata = { '@today': new Date('2023-03-20') };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Result: March 20th, 2025.');
    });

    it('should handle nested calls with multiple arguments', async () => {
      const input = 'Padded: {{padStart(truncate(title, 10), 15, "-")}}.';
      const metadata = { title: 'Legal Document Title' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Padded: -----Legal D....');
    });

    it('should handle deeply nested parentheses', async () => {
      const input = 'Complex: {{upper(padStart(truncate(lower(title), 8), 12, "*"))}}.';
      const metadata = { title: 'SERVICE AGREEMENT' };

      const result = await processWithNestedHelpers(input, metadata);

      expect(result).toBe('Complex: \\*\\*\\*\\*SERVI....');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty nested calls gracefully', async () => {
      const input = 'Result: {{upper(truncate(title, ))}}.';
      const metadata = { title: 'test title' };

      const result = await processWithNestedHelpers(input, metadata);

      // Empty argument gets treated as undefined, truncate returns '...' for undefined length
      expect(result).toBe('Result: ....');
    });

    it('should handle unmatched parentheses', async () => {
      const input = 'Result: {{upper(truncate(title, 10)}}.';
      const metadata = { title: 'test title' };

      const result = await processWithNestedHelpers(input, metadata);

      // Should handle malformed calls gracefully
      expect(result).toBe('Result: {{upper(truncate(title, 10)}}.');
    });

    it('should work with field tracking enabled', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkTemplateFields, { 
          metadata: { '@today': new Date('2023-01-15') },
          enableFieldTracking: true,
          debug: false
        })
        .use(remarkStringify, {
          bullet: '-',
          fences: true,
          incrementListMarker: false,
        });

      const result = await processor.process('Date: {{formatDate(addYears(@today, 1), "YYYY-MM-DD")}}.');
      const output = result.toString().trim();

      // Should include both the nested result and field tracking
      expect(output).toContain('2024-01-15');
      expect(output).toContain('legal-field');
    });
  });
});