/**
 * @fileoverview Tests for string helper functions
 * 
 * Covers all string manipulation utilities including:
 * - Case transformations (capitalize, upper, lower, titleCase, etc.)
 * - String formatting (kebab, snake, camel, pascal cases)
 * - String manipulation (truncate, clean, pluralize, pad)
 * - String utilities (contains, replaceAll, initials)
 */

import {
  capitalize,
  capitalizeWords,
  upper,
  lower,
  titleCase,
  kebabCase,
  snakeCase,
  camelCase,
  pascalCase,
  truncate,
  clean,
  pluralize,
  padStart,
  padEnd,
  contains,
  replaceAll,
  initials,
} from '../../../../src/extensions/helpers/string-helpers';

describe('String Helpers', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('john doe smith')).toBe('John Doe Smith');
    });
  });

  describe('upper', () => {
    it('should convert to uppercase', () => {
      expect(upper('hello')).toBe('HELLO');
    });
  });

  describe('lower', () => {
    it('should convert to lowercase', () => {
      expect(lower('HELLO')).toBe('hello');
    });
  });

  describe('titleCase', () => {
    it('should convert to title case', () => {
      expect(titleCase('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(titleCase('a tale of two cities')).toBe('A Tale of Two Cities');
    });

    it('should handle articles and prepositions', () => {
      expect(titleCase('the art of war')).toBe('The Art of War');
      expect(titleCase('lord of the rings')).toBe('Lord of the Rings');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
      expect(kebabCase('helloWorld')).toBe('hello-world');
      expect(kebabCase('HelloWorld')).toBe('hello-world');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(snakeCase('hello world')).toBe('hello_world');
      expect(snakeCase('helloWorld')).toBe('hello_world');
      expect(snakeCase('HelloWorld')).toBe('hello_world');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
    });
  });

  describe('pascalCase', () => {
    it('should convert to PascalCase', () => {
      expect(pascalCase('hello world')).toBe('HelloWorld');
      expect(pascalCase('hello-world')).toBe('HelloWorld');
      expect(pascalCase('hello_world')).toBe('HelloWorld');
    });
  });

  describe('truncate', () => {
    it('should truncate string with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '---')).toBe('hello---');
    });
  });

  describe('clean', () => {
    it('should remove extra whitespace', () => {
      expect(clean('  hello   world  ')).toBe('hello world');
      expect(clean('hello\n\nworld')).toBe('hello world');
    });
  });

  describe('pluralize', () => {
    it('should pluralize words', () => {
      expect(pluralize('cat', 1)).toBe('cat');
      expect(pluralize('cat', 2)).toBe('cats');
      expect(pluralize('box', 2)).toBe('boxes');
      expect(pluralize('city', 2)).toBe('cities');
    });

    it('should use custom plural form', () => {
      expect(pluralize('person', 2, 'people')).toBe('people');
    });
  });

  describe('padStart', () => {
    it('should pad string to specified length', () => {
      expect(padStart('5', 3, '0')).toBe('005');
      expect(padStart('hello', 8)).toBe('   hello');
    });
  });

  describe('padEnd', () => {
    it('should pad string to specified length', () => {
      expect(padEnd('5', 3, '0')).toBe('500');
      expect(padEnd('hello', 8)).toBe('hello   ');
    });
  });

  describe('contains', () => {
    it('should check if string contains substring', () => {
      expect(contains('hello world', 'world')).toBe(true);
      expect(contains('hello world', 'WORLD')).toBe(true);
      expect(contains('hello world', 'WORLD', true)).toBe(false);
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', () => {
      expect(replaceAll('hello world world', 'world', 'universe')).toBe('hello universe universe');
    });
  });

  describe('initials', () => {
    it('should extract initials from name', () => {
      expect(initials('John Doe')).toBe('JD');
      expect(initials('John Michael Doe')).toBe('JMD');
      expect(initials('john doe')).toBe('JD');
    });
  });
});