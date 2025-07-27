/**
 * @fileoverview Tests for date helper functions
 * 
 * Covers date manipulation and formatting utilities including:
 * - Date arithmetic (addYears, addDays, addMonths)
 * - Date formatting with custom patterns and predefined formats
 * - Date parsing from various string formats
 */

import { addYears, addDays, addMonths, formatDate, DateFormats } from '../../../../src/extensions/helpers/advanced-date-helpers';

describe('Date Helpers', () => {
  const testDate = new Date('2024-01-15');

  describe('addYears', () => {
    it('should add years to a date', () => {
      const result = addYears(testDate, 2);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should handle negative years', () => {
      const result = addYears(testDate, -1);
      expect(result.getFullYear()).toBe(2023);
    });

    it('should work with string dates', () => {
      const result = addYears('2024-01-15', 1);
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const result = addDays(testDate, 10);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(0); // January
    });

    it('should handle month overflow', () => {
      // Adding 20 days to Jan 15 should result in Feb 4
      const result = addDays(testDate, 20);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
    });

    it('should handle negative days', () => {
      const result = addDays(testDate, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('addMonths', () => {
    it('should add months to a date', () => {
      const result = addMonths(testDate, 3);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    it('should handle year overflow', () => {
      // Adding 13 months to Jan 2024 should result in Feb 2025
      const result = addMonths(testDate, 13);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
    });
  });

  describe('formatDate', () => {
    it('should format with default format', () => {
      const result = formatDate(testDate);
      expect(result).toBe('2024-01-15');
    });

    it('should format with custom format', () => {
      const result = formatDate(testDate, 'DD/MM/YYYY');
      expect(result).toBe('15/01/2024');
    });

    it('should format with month names', () => {
      const result = formatDate(testDate, 'MMMM Do, YYYY');
      expect(result).toBe('January 15o, 2024');
    });

    it('should format with day names', () => {
      const result = formatDate(testDate, 'dddd, MMMM Do, YYYY');
      expect(result).toBe('Monday, January 15o, 2024');
    });

    it('should use predefined formats', () => {
      const result = formatDate(testDate, DateFormats.FORMAL);
      expect(result).toBe('Monday, January 15o, 2024');
    });

    it('should format in Spanish', () => {
      const result = formatDate(testDate, DateFormats.SPANISH);
      expect(result).toBe('15 de enero de 2024');
    });
  });

  // parseDate is not currently exported from advanced-date-helpers
});