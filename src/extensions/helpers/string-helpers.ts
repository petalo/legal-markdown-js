/**
 * @fileoverview String Manipulation and Formatting Helpers
 *
 * This module provides comprehensive string manipulation utilities designed
 * for legal document processing. It includes functions for case conversion,
 * text formatting, string validation, and various text processing operations
 * commonly needed in legal document generation and formatting.
 *
 * Features:
 * - Case conversion (capitalize, title case, upper, lower)
 * - String formatting (camelCase, kebab-case, snake_case, PascalCase)
 * - Text manipulation (truncate, clean, pad, pluralize)
 * - String validation and search (contains, replace)
 * - Name processing (initials extraction)
 * - Safe handling of null/undefined values
 *
 * @example
 * ```typescript
 * import { capitalize, titleCase, pluralize } from './string-helpers';
 *
 * // Case conversion
 * const title = titleCase('legal document processing');  // \"Legal Document Processing\"\n *\n * // Text formatting\n * const name = capitalize('john doe');                   // \"John doe\"\n *\n * // Pluralization\n * const items = pluralize('contract', 5);               // \"contracts\"\n * ```\n */

/**
 * Capitalizes the first letter of a string
 *
 * Converts the first character to uppercase and the rest to lowercase.
 * Safely handles null and undefined values by returning an empty string.
 *
 * @param {string | undefined | null} str - The string to capitalize
 * @returns {string} The capitalized string, or empty string if input is null/undefined
 *
 * @example
 * ```typescript
 * capitalize('hello world');    // "Hello world"
 * capitalize('HELLO WORLD');    // "Hello world"
 * capitalize('hELLO wORLD');    // "Hello world"
 * capitalize('');               // ""
 * capitalize(null);             // ""
 * capitalize(undefined);        // ""
 * ```
 */
export function capitalize(str: string | undefined | null): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word in a string
 *
 * Applies the capitalize function to each word separated by spaces,
 * useful for formatting names, titles, and other multi-word strings.
 *
 * @param {string | undefined | null} str - The string to capitalize
 * @returns {string} The string with each word capitalized
 *
 * @example
 * ```typescript
 * capitalizeWords('john doe');           // "John Doe"
 * capitalizeWords('legal document');     // "Legal Document"
 * capitalizeWords('HELLO WORLD');        // "Hello World"
 * capitalizeWords('mixed CaSe WoRdS');   // "Mixed Case Words"
 * capitalizeWords('');                   // ""
 * capitalizeWords(null);                 // ""
 * ```
 */
export function capitalizeWords(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Converts a string to uppercase
 *
 * Safely converts all characters in the string to uppercase,
 * handling null and undefined values gracefully.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The uppercase string, or empty string if input is null/undefined
 *
 * @example
 * ```typescript
 * upper('hello world');    // "HELLO WORLD"
 * upper('Mixed Case');     // "MIXED CASE"
 * upper('');               // ""
 * upper(null);             // ""
 * upper(undefined);        // ""
 * ```
 */
export function upper(str: string | undefined | null): string {
  return str ? str.toUpperCase() : '';
}

/**
 * Converts a string to lowercase
 *
 * Safely converts all characters in the string to lowercase,
 * handling null and undefined values gracefully.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The lowercase string, or empty string if input is null/undefined
 *
 * @example
 * ```typescript
 * lower('HELLO WORLD');    // "hello world"
 * lower('Mixed Case');     // "mixed case"
 * lower('');               // ""
 * lower(null);             // ""
 * lower(undefined);        // ""
 * ```
 */
export function lower(str: string | undefined | null): string {
  return str ? str.toLowerCase() : '';
}

/**
 * Converts a string to title case with proper handling of articles and prepositions
 *
 * Applies title case rules where the first and last words are always capitalized,
 * and small words (articles, prepositions, conjunctions) are kept lowercase
 * unless they appear at the beginning or end of the string.
 *
 * @param {string | undefined | null} str - The string to convert to title case
 * @returns {string} The title-cased string
 *
 * Small words that remain lowercase: a, an, and, as, at, but, by, for, if, in,
 * nor, of, on, or, so, the, to, up, yet
 *
 * @example
 * ```typescript
 * titleCase('the quick brown fox');     // "The Quick Brown Fox"
 * titleCase('a tale of two cities');    // "A Tale of Two Cities"
 * titleCase('for whom the bell tolls'); // "For Whom the Bell Tolls"
 * titleCase('HELLO WORLD');             // "Hello World"
 * titleCase('');                        // ""
 * titleCase(null);                      // ""
 * ```
 */
export function titleCase(str: string | undefined | null): string {
  if (!str) return '';

  const smallWords = new Set([
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'if',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'so',
    'the',
    'to',
    'up',
    'yet',
  ]);

  return str
    .split(' ')
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      // Always capitalize first and last word
      if (index === 0 || index === str.split(' ').length - 1) {
        return capitalize(word);
      }
      // Don't capitalize small words unless they start the string
      if (smallWords.has(lowerWord)) {
        return lowerWord;
      }
      return capitalize(word);
    })
    .join(' ');
}

/**
 * Converts a string to kebab-case format
 *
 * Transforms camelCase, PascalCase, or space-separated strings into
 * kebab-case (lowercase with hyphens). Useful for URL slugs, CSS classes,
 * and file names.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The kebab-cased string
 *
 * @example
 * ```typescript
 * kebabCase('camelCaseString');     // "camel-case-string"
 * kebabCase('PascalCaseString');    // "pascal-case-string"
 * kebabCase('normal string');       // "normal-string"
 * kebabCase('mixed_case string');   // "mixed-case-string"
 * kebabCase('');                    // ""
 * kebabCase(null);                  // ""
 * ```
 */
export function kebabCase(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts a string to snake_case format
 *
 * Transforms camelCase, PascalCase, or space-separated strings into
 * snake_case (lowercase with underscores). Commonly used for variable
 * names, database fields, and API parameters.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The snake_cased string
 *
 * @example
 * ```typescript
 * snakeCase('camelCaseString');     // "camel_case_string"
 * snakeCase('PascalCaseString');    // "pascal_case_string"
 * snakeCase('normal string');       // "normal_string"
 * snakeCase('kebab-case-string');   // "kebab_case_string"
 * snakeCase('');                    // ""
 * snakeCase(null);                  // ""
 * ```
 */
export function snakeCase(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Converts a string to camelCase format
 *
 * Transforms space-separated, hyphenated, or snake_case strings into
 * camelCase where the first word is lowercase and subsequent words
 * are capitalized. Commonly used for JavaScript variable names.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The camelCased string
 *
 * @example
 * ```typescript
 * camelCase('normal string');       // "normalString"
 * camelCase('kebab-case-string');   // "kebabCaseString"
 * camelCase('snake_case_string');   // "snakeCaseString"
 * camelCase('PascalCaseString');    // "pascalCaseString"
 * camelCase('');                    // ""
 * camelCase(null);                  // ""
 * ```
 */
export function camelCase(str: string | undefined | null): string {
  if (!str) return '';

  // Split on spaces, hyphens, underscores, or camelCase boundaries
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space before capitals in camelCase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle acronyms like "XMLParser"
    .split(/[\s-_]+/)
    .filter(Boolean);

  return words
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Converts a string to PascalCase format
 *
 * Transforms strings into PascalCase where the first letter of each word
 * is capitalized and there are no spaces or separators. Commonly used
 * for class names, constructor functions, and type names.
 *
 * @param {string | undefined | null} str - The string to convert
 * @returns {string} The PascalCased string
 *
 * @example
 * ```typescript
 * pascalCase('normal string');       // "NormalString"
 * pascalCase('kebab-case-string');   // "KebabCaseString"
 * pascalCase('snake_case_string');   // "SnakeCaseString"
 * pascalCase('camelCaseString');     // "CamelCaseString"
 * pascalCase('');                    // ""
 * pascalCase(null);                  // ""
 * ```
 */
export function pascalCase(str: string | undefined | null): string {
  if (!str) return '';
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Truncates a string to a specified length with optional suffix
 *
 * Shortens a string to the specified maximum length and appends a suffix
 * (default: '...') if the string exceeds the limit. Useful for creating
 * previews, summaries, or fitting text into constrained spaces.
 *
 * @param {string | undefined | null} str - The string to truncate
 * @param {number} length - The maximum length of the result
 * @param {string} suffix - The suffix to append when truncating (default: '...')
 * @returns {string} The truncated string with suffix if needed
 *
 * @example
 * ```typescript
 * truncate('This is a long string', 10);           // "This is a..."
 * truncate('Short', 10);                           // "Short"
 * truncate('This is a long string', 15, '…');      // "This is a long…"
 * truncate('', 10);                                // ""
 * truncate(null, 10);                              // ""
 * ```
 */
export function truncate(
  str: string | undefined | null,
  length: number,
  suffix: string = '...'
): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Removes extra whitespace and trims a string
 *
 * Collapses multiple consecutive whitespace characters into single spaces
 * and removes leading/trailing whitespace. Useful for cleaning up user
 * input or text from various sources.
 *
 * @param {string | undefined | null} str - The string to clean
 * @returns {string} The cleaned string with normalized whitespace
 *
 * @example
 * ```typescript
 * clean('  hello    world  ');        // "hello world"
 * clean('\t\n  text  \r\n');           // "text"
 * clean('normal   spacing');           // "normal spacing"
 * clean('');                           // ""
 * clean(null);                         // ""
 * ```
 */
export function clean(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Pluralizes a word based on count with optional custom plural form
 *
 * Returns the singular form if count is 1, otherwise returns the plural form.
 * Can accept a custom plural form or will apply basic English pluralization
 * rules automatically.
 *
 * @param {string} word - The singular form of the word
 * @param {number} count - The count to determine singular/plural
 * @param {string} [plural] - Optional custom plural form
 * @returns {string} The appropriate singular or plural form
 *
 * Basic pluralization rules applied:
 * - Words ending in 's', 'x', 'z', 'sh', 'ch' → add 'es'
 * - Words ending in consonant + 'y' → change 'y' to 'ies'
 * - All other words → add 's'
 *
 * @example
 * ```typescript
 * pluralize('cat', 1);                 // "cat"
 * pluralize('cat', 2);                 // "cats"
 * pluralize('box', 5);                 // "boxes"
 * pluralize('city', 3);                // "cities"
 * pluralize('child', 2, 'children');   // "children"
 * pluralize('person', 1, 'people');    // "person"
 * pluralize('person', 3, 'people');    // "people"
 * ```
 */
export function pluralize(word: string, count: number, plural?: string | object): string {
  // Handle Handlebars options object as last argument
  if (typeof plural === 'object') {
    plural = undefined;
  }

  if (count === 1) return word;

  if (plural) return plural;

  // Simple pluralization rules
  const rules: Array<[RegExp, string]> = [
    [/s$/i, 's'],
    [/([^aeiou])y$/i, '$1ies'],
    [/(x|z|s|sh|ch)$/i, '$1es'],
    [/$/i, 's'],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }

  return word + 's';
}

/**
 * Pads a string to a specified length from the start (left side)
 *
 * Adds padding characters to the beginning of a string until it reaches
 * the specified length. Useful for formatting numbers, creating aligned
 * text, or ensuring consistent string lengths.
 *
 * @param {string | undefined | null} str - The string to pad
 * @param {number} length - The target length of the result
 * @param {string} char - The character to use for padding (default: ' ')
 * @returns {string} The padded string
 *
 * @example
 * ```typescript
 * padStart('42', 5);           // "   42"
 * padStart('42', 5, '0');      // "00042"
 * padStart('hello', 8, '-');   // "---hello"
 * padStart('toolong', 4);      // "toolong" (no padding if already longer)
 * padStart('', 3);             // "   "
 * padStart(null, 5);           // "     "
 * ```
 */
export function padStart(
  str: string | number | undefined | null,
  length: number,
  char: string = ' '
): string {
  if (!str && str !== 0) return char.repeat(length);
  const strValue = String(str);
  return strValue.padStart(length, char);
}

/**
 * Pads a string to a specified length from the end (right side)
 *
 * Adds padding characters to the end of a string until it reaches
 * the specified length. Useful for creating aligned columns,
 * formatting output, or ensuring consistent string lengths.
 *
 * @param {string | undefined | null} str - The string to pad
 * @param {number} length - The target length of the result
 * @param {string} char - The character to use for padding (default: ' ')
 * @returns {string} The padded string
 *
 * @example
 * ```typescript
 * padEnd('42', 5);           // "42   "
 * padEnd('42', 5, '0');      // "42000"
 * padEnd('hello', 8, '-');   // "hello---"
 * padEnd('toolong', 4);      // "toolong" (no padding if already longer)
 * padEnd('', 3);             // "   "
 * padEnd(null, 5);           // "     "
 * ```
 */
export function padEnd(
  str: string | number | undefined | null,
  length: number,
  char: string = ' '
): string {
  if (!str && str !== 0) return char.repeat(length);
  const strValue = String(str);
  return strValue.padEnd(length, char);
}

/**
 * Checks if a string contains a substring with optional case sensitivity
 *
 * Performs substring search with configurable case sensitivity.
 * Useful for filtering, validation, and text analysis.
 *
 * @param {string | undefined | null} str - The string to search in
 * @param {string} substring - The substring to search for
 * @param {boolean} caseSensitive - Whether the search is case sensitive (default: false)
 * @returns {boolean} True if the substring is found, false otherwise
 *
 * @example
 * ```typescript
 * contains('Hello World', 'hello');           // true (case insensitive)
 * contains('Hello World', 'hello', true);     // false (case sensitive)
 * contains('Hello World', 'World');           // true
 * contains('Hello World', 'xyz');             // false
 * contains('', 'test');                       // false
 * contains(null, 'test');                     // false
 * contains('test', '');                       // false
 * ```
 */
export function contains(
  str: string | undefined | null,
  substring: string,
  caseSensitive: boolean = false
): boolean {
  if (!str || !substring) return false;

  if (caseSensitive) {
    return str.includes(substring);
  }

  return str.toLowerCase().includes(substring.toLowerCase());
}

/**
 * Replaces all occurrences of a substring with a replacement string
 *
 * Performs global string replacement without using regular expressions.
 * Useful for text processing, template substitution, and content cleanup.
 *
 * @param {string | undefined | null} str - The string to perform replacements on
 * @param {string} search - The substring to search for
 * @param {string} replace - The replacement string
 * @returns {string} The string with all occurrences replaced
 *
 * @example
 * ```typescript
 * replaceAll('hello world hello', 'hello', 'hi');  // "hi world hi"
 * replaceAll('a,b,c', ',', ' | ');                 // "a | b | c"
 * replaceAll('test', 'x', 'y');                    // "test" (no change)
 * replaceAll('', 'x', 'y');                        // ""
 * replaceAll(null, 'x', 'y');                      // ""
 * ```
 */
export function replaceAll(
  str: string | undefined | null,
  search: string,
  replace: string
): string {
  if (!str) return '';
  return str.split(search).join(replace);
}

/**
 * Extracts initials from a name or multi-word string
 *
 * Takes the first character of each word (separated by spaces) and
 * combines them into uppercase initials. Useful for creating
 * abbreviated representations of names or titles.
 *
 * @param {string | undefined | null} name - The name or string to extract initials from
 * @returns {string} The initials in uppercase
 *
 * @example
 * ```typescript
 * initials('John Doe');                // "JD"
 * initials('Mary Jane Watson');        // "MJW"
 * initials('single');                  // "S"
 * initials('jean-claude van damme');   // "JVD" (hyphens treated as separators)
 * initials('');                        // ""
 * initials(null);                      // ""
 * ```
 */
export function initials(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
