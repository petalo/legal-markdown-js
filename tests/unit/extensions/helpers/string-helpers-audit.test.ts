import { describe, it, expect } from 'vitest';
import {
  contains,
  initials,
  pluralize,
  replaceAll,
  truncate,
} from '../../../../src/extensions/helpers/string-helpers';
import { compileHandlebarsTemplate } from '../../../../src/extensions/handlebars-engine';

describe('String Helpers Audit Regressions', () => {
  it('pluralize handles class -> classes [C4]', () => {
    expect(pluralize('class', 2)).toBe('classes');
  });

  it('pluralize handles bus -> buses', () => {
    expect(pluralize('bus', 2)).toBe('buses');
  });

  it('pluralize handles baby -> babies', () => {
    expect(pluralize('baby', 2)).toBe('babies');
  });

  it('pluralize supports irregular children', () => {
    expect(pluralize('child', 2, 'children')).toBe('children');
  });

  it('pluralize preserves singular', () => {
    expect(pluralize('person', 1, 'people')).toBe('person');
  });

  it('truncate handles short limits [E4]', () => {
    expect(truncate('Hello', 2)).toBe('He');
  });

  it('truncate leaves shorter strings unchanged', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('truncate applies suffix when truncating', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('initials handles hyphenated names [E5]', () => {
    expect(initials('Jean-Claude Van Damme')).toBe('JCVD');
  });

  it('initials handles mixed spacing and hyphens', () => {
    expect(initials('Mary Jane Watson-Parker')).toBe('MJWP');
  });

  it('initials handles single-letter names', () => {
    expect(initials('X')).toBe('X');
  });

  it('contains remains case-sensitive when enabled [C2]', () => {
    expect(contains('abc', 'A', true)).toBe(false);
    expect(contains('abc', 'a', true)).toBe(true);
  });

  it('contains strips Handlebars options leak [C2]', () => {
    expect(compileHandlebarsTemplate('{{contains "abc" "A"}}', {})).toBe('true');
    expect(compileHandlebarsTemplate('{{contains "abc" "a"}}', {})).toBe('true');
  });

  it('replaceAll replaces all occurrences [C2]', () => {
    expect(replaceAll('foo-bar-baz', '-', ' ')).toBe('foo bar baz');
    expect(compileHandlebarsTemplate('{{replaceAll "foo-bar-baz" "-" " "}}', {})).toBe(
      'foo bar baz'
    );
  });
});
