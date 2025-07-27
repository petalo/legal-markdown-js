/**
 * @fileoverview Tests for number helper functions
 * 
 * Covers number formatting and manipulation utilities including:
 * - Integer formatting with thousands separators
 * - Percentage formatting with decimal control
 * - Currency formatting for different locales (EUR, USD, GBP)
 * - Number-to-words conversion for legal documents
 * - Number rounding and precision control
 */

import {
  formatInteger,
  formatPercent,
  formatCurrency,
  formatEuro,
  formatDollar,
  formatPound,
  numberToWords,
  formatNumber,
  round,
} from '../../../../src/extensions/helpers/number-helpers';

describe('Number Helpers', () => {
  describe('formatInteger', () => {
    it('should format integers with default separator', () => {
      expect(formatInteger(1234)).toBe('1,234');
      expect(formatInteger(1234567)).toBe('1,234,567');
    });

    it('should format with custom separator', () => {
      expect(formatInteger(1234, '.')).toBe('1.234');
    });

    it('should handle string input', () => {
      expect(formatInteger('1234')).toBe('1,234');
    });

    it('should handle invalid input', () => {
      expect(formatInteger('abc')).toBe('abc');
    });
  });

  describe('formatPercent', () => {
    it('should format as percentage', () => {
      expect(formatPercent(0.15)).toBe('15.00%');
      expect(formatPercent(0.255)).toBe('25.50%');
    });

    it('should format with custom decimals', () => {
      expect(formatPercent(0.156, 1)).toBe('15.6%');
    });

    it('should format without symbol', () => {
      expect(formatPercent(0.15, 2, false)).toBe('15.00');
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('1,234.56 €');
    });

    it('should format USD currency', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should format GBP currency', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('should format with custom decimals', () => {
      expect(formatCurrency(1234, 'USD', 0)).toBe('$1,234');
    });
  });

  describe('formatEuro', () => {
    it('should format as Euro', () => {
      expect(formatEuro(1234.56)).toBe('1,234.56 €');
    });
  });

  describe('formatDollar', () => {
    it('should format as Dollar', () => {
      expect(formatDollar(1234.56)).toBe('$1,234.56');
    });
  });

  describe('formatPound', () => {
    it('should format as Pound', () => {
      expect(formatPound(1234.56)).toBe('£1,234.56');
    });
  });

  describe('numberToWords', () => {
    it('should convert small numbers to words', () => {
      expect(numberToWords(0)).toBe('zero');
      expect(numberToWords(1)).toBe('one');
      expect(numberToWords(15)).toBe('fifteen');
      expect(numberToWords(42)).toBe('forty two');
    });

    it('should convert hundreds to words', () => {
      expect(numberToWords(100)).toBe('one hundred');
      expect(numberToWords(123)).toBe('one hundred twenty three');
    });

    it('should convert thousands to words', () => {
      expect(numberToWords(1000)).toBe('one thousand');
      expect(numberToWords(1234)).toBe('one thousand two hundred thirty four');
    });

    it('should handle negative numbers', () => {
      expect(numberToWords(-42)).toBe('negative forty two');
    });

    it('should handle decimal numbers', () => {
      // Decimal numbers are formatted with "cents" suffix for legal documents
      expect(numberToWords(1.25)).toBe('one and twenty five cents');
    });
  });

  describe('formatNumber', () => {
    it('should format with custom separators', () => {
      expect(formatNumber(1234.56, 2, ',', '.')).toBe('1.234,56');
    });
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(round(1.234, 2)).toBe(1.23);
      expect(round(1.236, 2)).toBe(1.24);
    });

    it('should handle integer rounding', () => {
      expect(round(1.6)).toBe(2);
      expect(round(1.4)).toBe(1);
    });

    it('should handle string input', () => {
      expect(round('1.234', 2)).toBe(1.23);
    });
  });
});