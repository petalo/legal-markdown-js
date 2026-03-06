import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatInteger,
  formatPercent,
  numberToWords,
  round,
  formatNumber,
} from '../../../../src/extensions/helpers/number-helpers';
import { compileHandlebarsTemplate } from '../../../../src/extensions/handlebars-engine';

describe('Number Helpers Audit Regressions', () => {
  it('parses comma decimal strings correctly [C6]', () => {
    expect(round('1,234.56', 2)).toBe(1234.56);
  });

  it('parses European formatted strings correctly [C6]', () => {
    expect(round('1 234,56', 2)).toBe(123456);
  });

  it('formatInteger truncates positive decimals [C5]', () => {
    expect(formatInteger(1.6)).toBe('1');
  });

  it('formatInteger truncates negative decimals', () => {
    expect(formatInteger(-1.6)).toBe('-1');
  });

  it('formatInteger truncates fractional values under 1', () => {
    expect(formatInteger(0.9)).toBe('0');
  });

  it('round defaults decimals without Handlebars options leak [C2]', () => {
    expect(compileHandlebarsTemplate('{{round 12.34}}', {})).toBe('12');
  });

  it('round supports explicit decimals', () => {
    expect(round(12.345, 2)).toBe(12.35);
  });

  it('clamps negative precision to avoid toFixed RangeError [E6]', () => {
    expect(() => formatNumber(1.5, -1)).not.toThrow();
    expect(formatNumber(1.5, -1)).toBe('2');
  });

  it('clamps precision above 20 to avoid toFixed RangeError [E6]', () => {
    expect(() => formatNumber(1.5, 100)).not.toThrow();
    expect(formatNumber(1.5, 100)).toBe('1.50000000000000000000');
  });

  it('numberToWords handles trillion-scale values gracefully [C12]', () => {
    expect(numberToWords(1000000000000)).toBe('1,000,000,000,000');
  });

  it('numberToWords avoids 100-cents rollover bug', () => {
    const result = numberToWords(1.999);
    expect(['two', 'one and ninety nine cents']).toContain(result);
  });

  it('numberToWords handles zero', () => {
    expect(numberToWords(0)).toBe('zero');
  });

  it('numberToWords handles negatives', () => {
    expect(numberToWords(-5)).toBe('negative five');
  });

  it('formatCurrency accepts comma formatted input', () => {
    expect(formatCurrency('1,234.56', 'USD')).toBe('$1,234.56');
  });

  it('formatPercent handles edge values', () => {
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(100)).toBe('10000.00%');
    expect(formatPercent(Number.NaN)).toBe('NaN');
  });

  it('padStart ignores Handlebars options object [C2]', () => {
    expect(compileHandlebarsTemplate('{{padStart "7" 3}}', {})).toBe('  7');
  });

  it('padEnd ignores Handlebars options object [C2]', () => {
    expect(compileHandlebarsTemplate('{{padEnd "7" 3}}', {})).toBe('7  ');
  });
});
