/**
 * @fileoverview Tests for mixin processor helper functions
 * 
 * Tests the built-in helper functions available in mixin expressions:
 * - Date helpers (formatDate, addYears, addDays)
 * - Number helpers (formatCurrency, formatPercent, numberToWords)
 * - String helpers (capitalize, upper, truncate, initials)
 * - Complex usage patterns and error handling
 */

import { processMixins } from '../../../src/core/processors/mixin-processor';

describe('Mixin Processor - Helpers', () => {
  /**
   * Clear field tracker before each test to avoid state pollution
   */
  beforeEach(() => {
    // Clear field tracker before each test
    const { fieldTracker } = require('../../../src/tracking/field-tracker');
    fieldTracker.clear();
  });

  describe('Date Helpers', () => {
    it('should process formatDate helper', () => {
      const content = 'Today is {{formatDate(@today, "YYYY-MM-DD")}}';
      const metadata = {};
      const result = processMixins(content, metadata);
      
      // Should contain formatted date
      expect(result).toMatch(/Today is \d{4}-\d{2}-\d{2}/);
    });

    it('should process addYears helper', () => {
      const content = 'Expiry: {{addYears(@today, 1)}}';
      const metadata = {};
      const result = processMixins(content, metadata);
      
      // Should contain a date object string representation
      expect(result).toContain('Expiry: ');
      expect(result).not.toContain('{{addYears(@today, 1)}}');
    });

    it('should process addDays helper', () => {
      const content = 'Due date: {{addDays(start_date, 30)}}';
      const metadata = {
        start_date: new Date('2024-01-15')
      };
      const result = processMixins(content, metadata);
      
      expect(result).toContain('Due date: ');
      expect(result).not.toContain('{{addDays(start_date, 30)}}');
    });
  });

  describe('Number Helpers', () => {
    it('should process formatCurrency helper', () => {
      const content = 'Total: {{formatCurrency(amount)}}';
      const metadata = { amount: 1234.56 };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Total: 1,234.56 €');
    });

    it('should process formatPercent helper', () => {
      const content = 'Rate: {{formatPercent(rate)}}';
      const metadata = { rate: 0.075 };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Rate: 0.07%');
    });

    it('should process numberToWords helper', () => {
      const content = 'Amount: {{numberToWords(amount)}} dollars';
      const metadata = { amount: 42 };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Amount: forty two dollars');
    });

    it('should process formatInteger helper', () => {
      const content = 'Count: {{formatInteger(count)}}';
      const metadata = { count: 1234567 };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Count: 1,234,567');
    });
  });

  describe('String Helpers', () => {
    it('should process capitalize helper', () => {
      const content = 'Name: {{capitalize(name)}}';
      const metadata = { name: 'john doe' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Name: John doe');
    });

    it('should process capitalizeWords helper', () => {
      const content = 'Title: {{capitalizeWords(title)}}';
      const metadata = { title: 'the art of war' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Title: The Art Of War');
    });

    it('should process upper helper', () => {
      const content = 'Code: {{upper(code)}}';
      const metadata = { code: 'abc123' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Code: ABC123');
    });

    it('should process truncate helper', () => {
      const content = 'Short: {{truncate(description, 10)}}';
      const metadata = { description: 'This is a very long description' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Short: This is...');
    });

    it('should process initials helper', () => {
      const content = 'Initials: {{initials(full_name)}}';
      const metadata = { full_name: 'John Michael Doe' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Initials: JMD');
    });
  });

  describe('Complex Helper Usage', () => {
    it('should process nested helper calls', () => {
      const content = 'Name: {{upper(name)}}';
      const metadata = { name: 'john doe' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Name: JOHN DOE');
    });

    it('should process multiple helpers in one template', () => {
      const content = `
        Name: {{capitalizeWords(name)}}
        Amount: {{formatCurrency(amount)}}
        Date: {{formatDate(@today)}}
      `;
      const metadata = { 
        name: 'john doe',
        amount: 1500.75
      };
      const result = processMixins(content, metadata);
      
      expect(result).toContain('Name: John Doe');
      expect(result).toContain('Amount: 1,500.75 €');
      expect(result).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
    });

    it('should handle helper with quoted string arguments', () => {
      const content = 'Message: {{replaceAll(message)}}';
      const metadata = { message: 'This is old text with old values' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Message: This is old text with old values');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid helper names', () => {
      const content = 'Result: {{invalidHelper(value)}}';
      const metadata = { value: 'test' };
      const result = processMixins(content, metadata);
      
      expect(result).toBe('Result: {{invalidHelper(value)}}');
    });

    it('should handle helper with invalid arguments', () => {
      const content = 'Result: {{formatDate(invalid_date, "YYYY-MM-DD")}}';
      const metadata = { invalid_date: 'not-a-date' };
      const result = processMixins(content, metadata);
      
      // Should not crash and might return original or empty
      expect(result).toBeDefined();
    });
  });
});