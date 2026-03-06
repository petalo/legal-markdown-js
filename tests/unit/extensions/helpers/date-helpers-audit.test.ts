import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  formatDate,
} from '../../../../src/extensions/helpers/advanced-date-helpers';

describe('Date Helpers Audit Regressions', () => {
  it('formatDate does not shift date-only input across timezone boundaries [C7]', () => {
    expect(formatDate('2025-01-01', 'YYYY-MM-DD')).toBe('2025-01-01');
  });

  it('formatDate supports DD/MM/YYYY', () => {
    expect(formatDate('2025-06-15', 'DD/MM/YYYY')).toBe('15/06/2025');
  });

  it('addMonths handles January 31 to end of February [C8]', () => {
    expect(formatDate(addMonths('2025-01-31', 1), 'YYYY-MM-DD')).toBe('2025-02-28');
  });

  it('addMonths handles March 31 to April 30', () => {
    expect(formatDate(addMonths('2025-03-31', 1), 'YYYY-MM-DD')).toBe('2025-04-30');
  });

  it('addMonths respects leap years', () => {
    expect(formatDate(addMonths('2024-01-29', 1), 'YYYY-MM-DD')).toBe('2024-02-29');
  });

  it('addMonths handles non-leap years', () => {
    expect(formatDate(addMonths('2025-01-29', 1), 'YYYY-MM-DD')).toBe('2025-02-28');
  });

  it('addDays with date-only string preserves local calendar date semantics', () => {
    expect(formatDate(addDays('2025-01-01', 1), 'YYYY-MM-DD')).toBe('2025-01-02');
  });

  it('addYears with date-only string preserves local calendar date semantics', () => {
    expect(formatDate(addYears('2025-01-01', 1), 'YYYY-MM-DD')).toBe('2026-01-01');
  });
});
