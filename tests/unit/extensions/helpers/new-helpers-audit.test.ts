import { describe, it, expect } from 'vitest';
import { ordinal, abs, max, min } from '../../../../src/extensions/helpers/number-helpers';
import { join, length } from '../../../../src/extensions/helpers/string-helpers';
import { compileHandlebarsTemplate } from '../../../../src/extensions/handlebars-engine';

describe('New Helpers Audit', () => {
  it('ordinal formats values correctly', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(4)).toBe('4th');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(112)).toBe('112th');
  });

  it('abs returns absolute values', () => {
    expect(abs(-5)).toBe(5);
    expect(abs(5)).toBe(5);
    expect(abs(0)).toBe(0);
  });

  it('max returns greater value', () => {
    expect(max(5, 10)).toBe(10);
    expect(max(-1, -5)).toBe(-1);
  });

  it('min returns smaller value', () => {
    expect(min(5, 10)).toBe(5);
    expect(min(-1, -5)).toBe(-5);
  });

  it('join formats arrays correctly', () => {
    expect(join(['a', 'b', 'c'])).toBe('a, b, c');
    expect(join(['a', 'b'], ' and ')).toBe('a and b');
    expect(join([])).toBe('');
  });

  it('length handles arrays and strings', () => {
    expect(length([1, 2, 3])).toBe(3);
    expect(length('hello')).toBe(5);
    expect(length([])).toBe(0);
  });

  it('default helper uses fallback for falsy values', () => {
    expect(compileHandlebarsTemplate('{{default value "N/A"}}', { value: null })).toBe('N/A');
    expect(compileHandlebarsTemplate('{{default value "N/A"}}', { value: 'hello' })).toBe('hello');
    expect(compileHandlebarsTemplate('{{default value "N/A"}}', { value: '' })).toBe('N/A');
    expect(compileHandlebarsTemplate('{{default value "N/A"}}', { value: 0 })).toBe('N/A');
  });

  it('registers string helper aliases', () => {
    expect(compileHandlebarsTemplate('{{uppercase "hello"}}', {})).toBe('HELLO');
    expect(compileHandlebarsTemplate('{{lowercase "HELLO"}}', {})).toBe('hello');
    expect(compileHandlebarsTemplate('{{trim "  hello  "}}', {})).toBe('hello');
  });
});
