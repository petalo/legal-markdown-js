/**
 * @fileoverview Regular expression patterns for Legal Markdown parsing
 *
 * This module contains all the regex patterns used throughout the system
 * for parsing different markdown elements like headers, imports, clauses, and references.
 */

/**
 * Regular expression patterns for parsing header structures
 *
 * @constant {Object} HEADER_PATTERNS
 * @example
 * ```typescript
 * import { HEADER_PATTERNS } from './constants';
 *
 * // Match traditional headers: l. Section, ll. Subsection
 * const traditionalHeaders = content.match(HEADER_PATTERNS.TRADITIONAL);
 *
 * // Match alternative headers: l1. Section, l2. Subsection
 * const alternativeHeaders = content.match(HEADER_PATTERNS.ALTERNATIVE);
 * ```
 */
export const HEADER_PATTERNS = {
  /** Traditional header pattern: l. Section, ll. Subsection, etc. */
  TRADITIONAL: /^(l+)\.\s+(.*?)$/gm,
  /** Alternative header pattern: l1. Section, l2. Subsection, etc. */
  ALTERNATIVE: /^l(\d+)\.\s+(.*?)$/gm,
} as const;

/**
 * Regular expression patterns for parsing import statements
 *
 * @constant {Object} IMPORT_PATTERNS
 * @example
 * ```typescript
 * import { IMPORT_PATTERNS } from './constants';
 *
 * // Match partial imports: [[filename]]
 * const partialImports = content.match(IMPORT_PATTERNS.PARTIAL);
 *
 * // Match full file imports: @import filename
 * const fullImports = content.match(IMPORT_PATTERNS.FULL_FILE);
 * ```
 */
export const IMPORT_PATTERNS = {
  /** Partial import pattern: [[filename]] */
  PARTIAL: /\[\[(.*?)\]\]/g,
  /** Full file import pattern: @import filename */
  FULL_FILE: /^@import\s+(.+)$/gm,
} as const;

/**
 * Regular expression patterns for parsing optional and conditional clauses
 *
 * @constant {Object} CLAUSE_PATTERNS
 * @example
 * ```typescript
 * import { CLAUSE_PATTERNS } from './constants';
 *
 * // Match optional clauses: {{field.name}}
 * const optionalClauses = content.match(CLAUSE_PATTERNS.OPTIONAL);
 *
 * // Match conditional clauses: {{#if condition}}content{{/if}}
 * const conditionalClauses = content.match(CLAUSE_PATTERNS.CONDITIONAL);
 * ```
 */
export const CLAUSE_PATTERNS = {
  /** Optional clause pattern: {{field.name}} */
  OPTIONAL: /\{\{\s*([^}]+)\s*\}\}/g,
  /** Conditional clause pattern: {{#if condition}}content{{/if}} */
  CONDITIONAL: /\{\{\s*#if\s+([^}]+)\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g,
} as const;

/**
 * Regular expression patterns for parsing cross-references
 *
 * @constant {Object} REFERENCE_PATTERNS
 * @example
 * ```typescript
 * import { REFERENCE_PATTERNS } from './constants';
 *
 * // Match cross-references: [[reference]]
 * const crossRefs = content.match(REFERENCE_PATTERNS.CROSS_REF);
 *
 * // Match numbered references: [1], [2], etc.
 * const numberedRefs = content.match(REFERENCE_PATTERNS.NUMBERED_REF);
 * ```
 */
export const REFERENCE_PATTERNS = {
  /** Cross-reference pattern: [[reference]] */
  CROSS_REF: /\[\[([^\]]+)\]\]/g,
  /** Numbered reference pattern: [1], [2], etc. */
  NUMBERED_REF: /\[(\d+)\]/g,
} as const;
