/**
 * Unit tests for remark dates plugin
 *
 * Tests the complete date processing functionality including @today tokens,
 * arithmetic operations, format specifiers, and field tracking integration.
 *
 * @module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkDates from '../../../../src/plugins/remark/dates';
import { fieldTracker } from '../../../../src/extensions/tracking/field-tracker';
import { addDays, addMonths, addYears } from '../../../../src/extensions/helpers/advanced-date-helpers';

// Mock the current date for consistent testing
const MOCK_DATE = new Date('2024-01-15T10:00:00Z');

describe('remarkDates Plugin', () => {
  let processor: ReturnType<typeof unified>;

  beforeEach(() => {
    // Clear field tracker before each test
    fieldTracker.clear();
    
    // Mock Date constructor for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
    
    // Create processor with default options
    processor = unified()
      .use(remarkParse)
      .use(remarkDates, {
        metadata: {},
        debug: false,
        enableFieldTracking: false,
      })
      .use(remarkStringify);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic @today Processing', () => {
    it('should process @today with default format', async () => {
      const input = 'Contract signed on @today.';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('Contract signed on 2024-01-15.');
    });

    it('should process @today with ISO format specifier', async () => {
      const input = 'Document dated @today[ISO].';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('Document dated 2024-01-15.');
    });

    it('should process @today with US format specifier', async () => {
      const input = 'Document dated @today[US].';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('Document dated 01/15/2024.');
    });

    it('should process @today with legal format specifier', async () => {
      const input = 'Document dated @today[legal].';
      const result = await processor.process(input);

      expect(result.toString().trim()).toBe('Document dated January 15th, 2024.');
    });

    it('should process multiple @today references', async () => {
      const input = 'From @today to @today[US].';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('From 2024-01-15 to 01/15/2024.');
    });
  });

  describe('Date Helpers Available', () => {
    it('should have addDays helper available for external use', () => {
      // The addDays, addMonths, addYears helpers are imported and available
      // for direct use in other parts of the system
      expect(typeof addDays).toBe('function');
      expect(typeof addMonths).toBe('function');  
      expect(typeof addYears).toBe('function');
    });
  });

  describe('Format Processing', () => {
    it('should process @today with EU format', async () => {
      const input = 'Document dated @today[EU].';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('Document dated 15/01/2024.');
    });

    it('should handle all documented date formats', async () => {
      const testCases = [
        { format: 'ISO', expected: '2024-01-15' },
        { format: 'YYYY-MM-DD', expected: '2024-01-15' },
        { format: 'US', expected: '01/15/2024' },
        { format: 'MM/DD/YYYY', expected: '01/15/2024' },
        { format: 'EU', expected: '15/01/2024' },
        { format: 'DD/MM/YYYY', expected: '15/01/2024' },
        { format: 'european', expected: '15/01/2024' },
        { format: 'long', expected: 'January 15, 2024' },
        { format: 'medium', expected: 'Jan 15, 2024' },
        { format: 'short', expected: 'Jan 15, 24' },
        { format: 'legal', expected: 'January 15th, 2024' },
      ];

      for (const testCase of testCases) {
        const input = `Date: @today[${testCase.format}]`;
        const result = await processor.process(input);
        expect(result.toString().trim()).toBe(`Date: ${testCase.expected}`);
      }
    });

    it('should fallback to ISO format for unknown formats', async () => {
      const input = 'Date: @today[unknown_format]';
      const result = await processor.process(input);
      
      expect(result.toString().trim()).toBe('Date: 2024-01-15');
    });
  });

  describe('Metadata Integration', () => {
    it('should use metadata date-format as default', async () => {
      const processorWithMetadata = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: { 'date-format': 'legal' },
          debug: false,
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Document dated @today.';
      const result = await processorWithMetadata.process(input);

      expect(result.toString().trim()).toBe('Document dated January 15th, 2024.');
    });

    it('should override metadata format with explicit format specifier', async () => {
      const processorWithMetadata = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: { 'date-format': 'legal' },
          debug: false,
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = 'Document dated @today[US].';
      const result = await processorWithMetadata.process(input);
      
      expect(result.toString().trim()).toBe('Document dated 01/15/2024.');
    });
  });

  describe('Field Tracking', () => {
    it('should track date fields when field tracking is enabled', async () => {
      const processorWithTracking = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: {},
          debug: false,
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const input = 'Contract dated @today.';
      const result = await processorWithTracking.process(input);
      
      // Check that field was tracked
      const fields = fieldTracker.getFields();
      expect(fields.size).toBeGreaterThan(0);
      
      // Check that result contains HTML spans for field tracking
      expect(result.toString()).toContain('<span class="legal-field imported-value"');
      expect(result.toString()).toContain('data-field="date.today"');
    });

    it('should use imported-value class for basic @today dates', async () => {
      const processorWithTracking = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: {},
          debug: false,
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const input = 'Today: @today, Also: @today[legal]';
      const result = await processorWithTracking.process(input);
      const output = result.toString();
      
      // Both dates should have 'imported-value' class since they're basic @today without arithmetic
      expect(output).toContain('class="legal-field imported-value"');
      expect(output).toContain('data-field="date.today"');
      expect(output).toContain('data-field="date.todaylegal"');
    });
  });

  describe('Date Arithmetic Operations', () => {
    it('should process @today with addition operations', async () => {
      const input = 'Payment due: @today+30';
      const result = await processor.process(input);
      
      // 2024-01-15 + 30 days = 2024-02-14
      expect(result.toString().trim()).toBe('Payment due: 2024-02-14');
    });

    it('should process @today with subtraction operations', async () => {
      const input = 'Document created: @today-7';
      const result = await processor.process(input);
      
      // 2024-01-15 - 7 days = 2024-01-08
      expect(result.toString().trim()).toBe('Document created: 2024-01-08');
    });

    it('should process @today with month arithmetic', async () => {
      const input = 'Renewal date: @today+6m';
      const result = await processor.process(input);
      
      // 2024-01-15 + 6 months = 2024-07-15
      expect(result.toString().trim()).toBe('Renewal date: 2024-07-15');
    });

    it('should process @today with year arithmetic', async () => {
      const input = 'Contract expires: @today+1y';
      const result = await processor.process(input);
      
      // 2024-01-15 + 1 year = 2025-01-15
      expect(result.toString().trim()).toBe('Contract expires: 2025-01-15');
    });

    it('should process arithmetic with format specifiers', async () => {
      const input = 'Due date: @today+30[US]';
      const result = await processor.process(input);
      
      // Should apply arithmetic then format
      expect(result.toString().trim()).toBe('Due date: 02/14/2024');
    });

    it('should handle complex arithmetic operations', async () => {
      const testCases = [
        { input: '@today+365', expected: '2025-01-14' }, // +365 days (not exactly 1 year)
        { input: '@today-365', expected: '2023-01-15' }, // -365 days
        { input: '@today+1m', expected: '2024-02-15' },  // +1 month
        { input: '@today-1m', expected: '2023-12-15' },  // -1 month
        { input: '@today+1y', expected: '2025-01-15' },  // +1 year
        { input: '@today-1y', expected: '2023-01-15' },  // -1 year
      ];

      for (const testCase of testCases) {
        const result = await processor.process(testCase.input);
        expect(result.toString().trim()).toBe(testCase.expected);
      }
    });

    it('should track arithmetic operations with highlight class', async () => {
      const processorWithTracking = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: {},
          debug: false,
          enableFieldTracking: true,
        })
        .use(remarkStringify);

      const input = 'Due: @today+30';
      const result = await processorWithTracking.process(input);
      
      // Arithmetic operations should get 'highlight' class
      expect(result.toString()).toContain('class="legal-field highlight"');
      expect(result.toString()).toContain('data-field="date.today+30"');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid format gracefully', async () => {
      const input = 'Document dated @today[invalid_format].';
      const result = await processor.process(input);
      
      // Should fall back to ISO format
      expect(result.toString().trim()).toBe('Document dated 2024-01-15.');
    });

    it('should handle invalid arithmetic gracefully', async () => {
      const input = 'Invalid: @today+invalid';
      const result = await processor.process(input);
      
      // Should process @today correctly and leave invalid arithmetic as text
      expect(result.toString().trim()).toBe('Invalid: 2024-01-15+invalid');
    });
  });

  describe('Complex Scenarios', () => {
    it('should process dates in different parts of document', async () => {
      const input = `# Contract

This agreement is effective @today.

**Payment Terms:**
- Initial payment: @today[legal]
- Review date: @today[US]

*Note: All dates are in ISO format: @today[ISO]*`;

      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('effective 2024-01-15');
      expect(output).toContain('Initial payment: January 15th, 2024');
      expect(output).toContain('Review date: 01/15/2024');
      expect(output).toContain('ISO format: 2024-01-15');
    });

    it('should process dates in HTML nodes', async () => {
      const input = 'Document with <em>@today</em> and <strong>@today[US]</strong>';
      const result = await processor.process(input);
      
      const output = result.toString().trim();
      expect(output).toContain('<em>2024-01-15</em>');
      expect(output).toContain('<strong>01/15/2024</strong>');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle document dating', async () => {
      const input = `This contract begins on @today.
All references are current as of @today[legal].`;

      const result = await processor.process(input);
      const output = result.toString();

      expect(output).toContain('begins on 2024-01-15');
      expect(output).toContain('as of January 15th, 2024');
    });

    it('should handle various date formats in templates', async () => {
      const processorWithLegal = unified()
        .use(remarkParse)
        .use(remarkDates, {
          metadata: { 'date-format': 'legal' },
          debug: false,
          enableFieldTracking: false,
        })
        .use(remarkStringify);

      const input = `Document Information:
- Date created: @today
- ISO format: @today[ISO]
- US format: @today[US]
- EU format: @today[EU]`;

      const result = await processorWithLegal.process(input);
      const output = result.toString();

      expect(output).toContain('Date created: January 15th, 2024'); // Uses metadata format
      expect(output).toContain('ISO format: 2024-01-15');
      expect(output).toContain('US format: 01/15/2024');
      expect(output).toContain('EU format: 15/01/2024');
    });
  });
});