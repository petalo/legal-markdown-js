/**
 * Header Level Pattern Constants for Legal Markdown
 *
 * This module contains the default header patterns used by the auto-population feature
 * when the CLI --headers flag is used. Users can modify these patterns to customize
 * the default behavior for their organization or projects.
 *
 * For complete documentation on header formats and variable usage, see:
 * @see {@link ../docs/headers_numbering.md} - Complete guide to headers and numbering system
 *
 * @example
 * ```typescript
 * import { DEFAULT_HEADER_PATTERNS } from './constants/headers';
 *
 * // Use in auto-population
 * const pattern = DEFAULT_HEADER_PATTERNS['level-1']; // "Article %n."
 * ```
 *
 * @module
 */

/**
 * Default header level patterns following Legal Markdown conventions
 *
 * These patterns are used by the YAML auto-population feature when processing
 * documents with the CLI --headers flag. Each pattern supports template variables:
 *
 * - %n: Current level number
 * - %A: Uppercase letters (A, B, C)
 * - %a: Lowercase letters (a, b, c)
 * - %R: Uppercase roman numerals (I, II, III)
 * - %r: Lowercase roman numerals (i, ii, iii)
 * - %l1-%l9: Direct level references
 * - %o: Ordinal numbers (fallback to %n)
 *
 * For complete documentation on all available variables and formatting options,
 * see: docs/headers_numbering.md
 */
export const DEFAULT_HEADER_PATTERNS = {
  'level-1': 'Article %n.',
  'level-2': 'Section %n.',
  'level-3': '%n.',
  'level-4': '(%n)',
  'level-5': '(%A)',
  'level-6': '(%a)',
  'level-7': '(%R)',
  'level-8': '(%r)',
  'level-9': '%n.',
} as const;

/**
 * Default properties configuration for YAML auto-population
 *
 * These properties control processing behavior and are added to the Properties
 * section of the YAML front matter when using auto-population.
 */
export const DEFAULT_PROPERTIES = {
  'no-indent': '',
  'no-reset': '',
  'level-style': '',
} as const;

/**
 * Type definition for header patterns
 */
export type HeaderPatterns = typeof DEFAULT_HEADER_PATTERNS;

/**
 * Type definition for header pattern keys
 */
export type HeaderPatternKey = keyof HeaderPatterns;

/**
 * Type definition for properties configuration
 */
export type PropertiesConfig = typeof DEFAULT_PROPERTIES;
