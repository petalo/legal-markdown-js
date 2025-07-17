/**
 * @fileoverview Utility Functions for Legal Document Analysis
 *
 * This module provides utility functions for analyzing and extracting information
 * from Legal Markdown documents. These are extensions beyond the core functionality
 * that provide insights into document structure, content, and usage patterns.
 *
 * Features:
 * - Document statistics and analysis
 * - Reference extraction and analysis
 * - Condition extraction from optional clauses
 * - Word count and character count metrics
 * - Header and structure analysis
 * - Import usage tracking
 * - Extensions not present in the original legal-markdown
 *
 * @example
 * ```typescript
 * import { analyzeDocument, extractReferences, extractConditions } from './utilities';
 *
 * // Analyze document statistics
 * const stats = analyzeDocument(content);
 * console.log(`Document contains ${stats.wordCount} words and ${stats.headerCount} headers`);
 *
 * // Extract references
 * const references = extractReferences(content);
 * console.log('References used:', references);
 *
 * // Extract conditions
 * const conditions = extractConditions(content);
 * console.log('Conditions used:', conditions);
 * ```
 */

// Utility functions - Extensions for utility functions beyond core functionality

/**
 * Analyzes document statistics and structure
 *
 * Provides comprehensive analysis of Legal Markdown document content including
 * word counts, structural elements, and usage patterns. This is an extension
 * not present in the original legal-markdown specification.
 *
 * @function analyzeDocument
 * @param {string} content - The legal document content to analyze
 * @returns {Object} Object containing document statistics
 * @returns {number} returns.wordCount - Total number of words in the document
 * @returns {number} returns.characterCount - Total number of characters in the document
 * @returns {number} returns.headerCount - Number of header structures (l., ll., etc.)
 * @returns {number} returns.optionalClauseCount - Number of optional clauses found
 * @returns {number} returns.crossReferenceCount - Number of cross-references found
 * @returns {number} returns.importCount - Number of import statements found
 * @example
 * ```typescript
 * import { analyzeDocument } from './utilities';
 *
 * const stats = analyzeDocument(documentContent);
 * console.log(`Document Analysis:`);
 * console.log(`- Words: ${stats.wordCount}`);
 * console.log(`- Characters: ${stats.characterCount}`);
 * console.log(`- Headers: ${stats.headerCount}`);
 * console.log(`- Optional Clauses: ${stats.optionalClauseCount}`);
 * console.log(`- Cross References: ${stats.crossReferenceCount}`);
 * console.log(`- Imports: ${stats.importCount}`);
 * ```
 */
export function analyzeDocument(content: string): {
  wordCount: number;
  characterCount: number;
  headerCount: number;
  optionalClauseCount: number;
  crossReferenceCount: number;
  importCount: number;
} {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const headers = content.match(/^l+\./gm) || [];
  const optionalClauses = content.match(/\[.*?\]\{.*?\}/g) || [];
  const crossReferences = content.match(/\|.*?\|/g) || [];
  const imports = content.match(/@import\s+/g) || [];

  return {
    wordCount: words.length,
    characterCount: content.length,
    headerCount: headers.length,
    optionalClauseCount: optionalClauses.length,
    crossReferenceCount: crossReferences.length,
    importCount: imports.length,
  };
}

/**
 * Extracts all references used in a document
 *
 * Scans the document content for cross-reference patterns and returns a unique
 * list of all references found. Useful for understanding document dependencies
 * and reference usage patterns.
 *
 * @function extractReferences
 * @param {string} content - The legal document content to analyze
 * @returns {string[]} Array of unique reference names found in the document
 * @example
 * ```typescript
 * import { extractReferences } from './utilities';
 *
 * const references = extractReferences(documentContent);
 * console.log('References used in document:', references);
 *
 * // Example output: ['section-1', 'definitions', 'termination-clause']
 * ```
 */
export function extractReferences(content: string): string[] {
  const references = content.match(/\|(.*?)\|/g) || [];
  return references
    .map(ref => ref.slice(1, -1))
    .filter((ref, index, arr) => arr.indexOf(ref) === index);
}

/**
 * Extracts all conditions used in optional clauses
 *
 * Scans the document content for conditional clause patterns and returns a unique
 * list of all conditions found. Useful for understanding document logic and
 * conditional content usage.
 *
 * @function extractConditions
 * @param {string} content - The legal document content to analyze
 * @returns {string[]} Array of unique condition names found in the document
 * @example
 * ```typescript
 * import { extractConditions } from './utilities';
 *
 * const conditions = extractConditions(documentContent);
 * console.log('Conditions used in document:', conditions);
 *
 * // Example output: ['include-warranty', 'corporate-client', 'international-law']
 * ```
 */
export function extractConditions(content: string): string[] {
  const conditions = content.match(/\{(.*?)\}/g) || [];
  return conditions
    .map(cond => cond.slice(1, -1))
    .filter((cond, index, arr) => arr.indexOf(cond) === index);
}
