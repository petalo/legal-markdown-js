const mockFieldSpan = vi.fn(
  (name: string, content: string, _kind: string) =>
    `<span class="legal-field" data-field="${name}">${content}</span>`
);

const mockAddDays = vi.fn((date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
});
const mockAddMonths = vi.fn((date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
});
const mockAddYears = vi.fn((date: Date, years: number) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
});

vi.mock('../../../../src/extensions/helpers/advanced-date-helpers', () => ({
  addDays: (...args: unknown[]) => mockAddDays(...(args as [Date, number])),
  addMonths: (...args: unknown[]) => mockAddMonths(...(args as [Date, number])),
  addYears: (...args: unknown[]) => mockAddYears(...(args as [Date, number])),
}));

vi.mock('../../../../src/extensions/tracking/field-tracker', () => ({
  fieldTracker: { trackField: vi.fn() },
}));

vi.mock('../../../../src/extensions/tracking/field-span', () => ({
  fieldSpan: (...args: unknown[]) => mockFieldSpan(...(args as [string, string, string])),
}));

import {
  _parseDateToken,
  _applyDateArithmetic,
  _getOrdinalSuffix,
  _formatDateBasic,
  _formatDateValue,
} from '../../../../src/plugins/remark/dates';

describe('dates.ts internals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── parseDateToken ─────────────────────────────────────────────────

  describe('parseDateToken', () => {
    it('returns empty result for empty token', () => {
      const result = _parseDateToken('');
      expect(result.arithmeticList).toEqual([]);
      expect(result.format).toBeNull();
      expect(result.isValid).toBe(true);
    });

    it('parses format-only token [legal]', () => {
      const result = _parseDateToken('[legal]');
      expect(result.format).toBe('legal');
      expect(result.arithmeticList).toEqual([]);
      expect(result.isValid).toBe(true);
    });

    it('parses days arithmetic +30', () => {
      const result = _parseDateToken('+30');
      expect(result.arithmeticList).toEqual([{ type: 'days', amount: 30 }]);
      expect(result.format).toBeNull();
    });

    it('parses days arithmetic with d suffix +30d', () => {
      const result = _parseDateToken('+30d');
      expect(result.arithmeticList).toEqual([{ type: 'days', amount: 30 }]);
    });

    it('parses months arithmetic +6m', () => {
      const result = _parseDateToken('+6m');
      expect(result.arithmeticList).toEqual([{ type: 'months', amount: 6 }]);
    });

    it('parses years arithmetic +2y', () => {
      const result = _parseDateToken('+2y');
      expect(result.arithmeticList).toEqual([{ type: 'years', amount: 2 }]);
    });

    it('parses negative arithmetic -365', () => {
      const result = _parseDateToken('-365');
      expect(result.arithmeticList).toEqual([{ type: 'days', amount: -365 }]);
    });

    it('parses chained arithmetic +2y-90d', () => {
      const result = _parseDateToken('+2y-90d');
      expect(result.arithmeticList).toEqual([
        { type: 'years', amount: 2 },
        { type: 'days', amount: -90 },
      ]);
    });

    it('parses arithmetic with format +2y[US]', () => {
      const result = _parseDateToken('+2y[US]');
      expect(result.arithmeticList).toEqual([{ type: 'years', amount: 2 }]);
      expect(result.format).toBe('US');
    });

    it('parses complex chained arithmetic +1y+6m-15d[legal]', () => {
      const result = _parseDateToken('+1y+6m-15d[legal]');
      expect(result.arithmeticList).toEqual([
        { type: 'years', amount: 1 },
        { type: 'months', amount: 6 },
        { type: 'days', amount: -15 },
      ]);
      expect(result.format).toBe('legal');
    });

    it('returns invalid for malformed token', () => {
      const result = _parseDateToken('garbage');
      expect(result.isValid).toBe(false);
    });
  });

  // ── applyDateArithmetic ────────────────────────────────────────────

  describe('applyDateArithmetic', () => {
    const base = new Date('2025-01-15T00:00:00Z');

    it('returns same date for null arithmetic', () => {
      expect(_applyDateArithmetic(base, null)).toBe(base);
    });

    it('adds days', () => {
      _applyDateArithmetic(base, { type: 'days', amount: 30 });
      expect(mockAddDays).toHaveBeenCalledWith(base, 30);
    });

    it('adds months', () => {
      _applyDateArithmetic(base, { type: 'months', amount: 6 });
      expect(mockAddMonths).toHaveBeenCalledWith(base, 6);
    });

    it('adds years', () => {
      _applyDateArithmetic(base, { type: 'years', amount: 2 });
      expect(mockAddYears).toHaveBeenCalledWith(base, 2);
    });
  });

  // ── getOrdinalSuffix ───────────────────────────────────────────────

  describe('getOrdinalSuffix', () => {
    it('returns st for 1', () => expect(_getOrdinalSuffix(1)).toBe('st'));
    it('returns nd for 2', () => expect(_getOrdinalSuffix(2)).toBe('nd'));
    it('returns rd for 3', () => expect(_getOrdinalSuffix(3)).toBe('rd'));
    it('returns th for 4', () => expect(_getOrdinalSuffix(4)).toBe('th'));
    it('returns th for 11 (teen exception)', () => expect(_getOrdinalSuffix(11)).toBe('th'));
    it('returns th for 12 (teen exception)', () => expect(_getOrdinalSuffix(12)).toBe('th'));
    it('returns th for 13 (teen exception)', () => expect(_getOrdinalSuffix(13)).toBe('th'));
    it('returns st for 21', () => expect(_getOrdinalSuffix(21)).toBe('st'));
    it('returns nd for 22', () => expect(_getOrdinalSuffix(22)).toBe('nd'));
    it('returns rd for 23', () => expect(_getOrdinalSuffix(23)).toBe('rd'));
    it('returns th for 30', () => expect(_getOrdinalSuffix(30)).toBe('th'));
    it('returns st for 31', () => expect(_getOrdinalSuffix(31)).toBe('st'));
  });

  // ── formatDateBasic ────────────────────────────────────────────────

  describe('formatDateBasic', () => {
    // Use a fixed UTC date to avoid timezone issues
    const date = new Date(2025, 0, 15); // Jan 15, 2025 local

    it('formats ISO', () => {
      expect(_formatDateBasic(date, 'iso')).toBe('2025-01-15');
    });

    it('formats YYYY-MM-DD', () => {
      expect(_formatDateBasic(date, 'YYYY-MM-DD')).toBe('2025-01-15');
    });

    it('formats US (MM/DD/YYYY)', () => {
      expect(_formatDateBasic(date, 'US')).toBe('01/15/2025');
    });

    it('formats European (DD/MM/YYYY)', () => {
      expect(_formatDateBasic(date, 'european')).toBe('15/01/2025');
    });

    it('formats EU alias', () => {
      expect(_formatDateBasic(date, 'EU')).toBe('15/01/2025');
    });

    it('formats long', () => {
      expect(_formatDateBasic(date, 'long')).toBe('January 15, 2025');
    });

    it('formats medium', () => {
      expect(_formatDateBasic(date, 'medium')).toBe('Jan 15, 2025');
    });

    it('formats short', () => {
      expect(_formatDateBasic(date, 'short')).toBe('Jan 15, 25');
    });

    it('formats legal with ordinal', () => {
      expect(_formatDateBasic(date, 'legal')).toBe('January 15th, 2025');
    });

    it('formats legal for 1st', () => {
      const jan1 = new Date(2025, 0, 1);
      expect(_formatDateBasic(jan1, 'legal')).toBe('January 1st, 2025');
    });

    it('formats legal for 2nd', () => {
      const jan2 = new Date(2025, 0, 2);
      expect(_formatDateBasic(jan2, 'legal')).toBe('January 2nd, 2025');
    });

    it('formats legal for 3rd', () => {
      const jan3 = new Date(2025, 0, 3);
      expect(_formatDateBasic(jan3, 'legal')).toBe('January 3rd, 2025');
    });

    it('defaults to ISO for unknown format', () => {
      expect(_formatDateBasic(date, 'unknown')).toBe('2025-01-15');
    });
  });

  // ── formatDateValue ────────────────────────────────────────────────

  describe('formatDateValue', () => {
    it('returns plain value when tracking disabled', () => {
      expect(_formatDateValue('2025-01-15', '@today', false, false)).toBe('2025-01-15');
    });

    it('wraps with imported span when tracking enabled', () => {
      _formatDateValue('2025-01-15', '@today', true, false);
      expect(mockFieldSpan).toHaveBeenCalledWith('date.today', '2025-01-15', 'imported');
    });

    it('wraps with highlight span when has arithmetic', () => {
      _formatDateValue('2025-04-15', '@today+90', true, true);
      expect(mockFieldSpan).toHaveBeenCalledWith('date.today+90', '2025-04-15', 'highlight');
    });

    it('strips @, [, ] from field name', () => {
      _formatDateValue('Jan 15, 2025', '@today[legal]', true, false);
      expect(mockFieldSpan).toHaveBeenCalledWith('date.todaylegal', 'Jan 15, 2025', 'imported');
    });
  });
});
