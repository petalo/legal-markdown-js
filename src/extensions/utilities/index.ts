// Utility functions - Extensions for utility functions beyond core functionality

/**
 * Analyzes document statistics
 * This is an extension not present in the original legal-markdown
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
    importCount: imports.length
  };
}

/**
 * Extracts all references used in a document
 */
export function extractReferences(content: string): string[] {
  const references = content.match(/\|(.*?)\|/g) || [];
  return references.map(ref => ref.slice(1, -1)).filter((ref, index, arr) => arr.indexOf(ref) === index);
}

/**
 * Extracts all conditions used in optional clauses
 */
export function extractConditions(content: string): string[] {
  const conditions = content.match(/\{(.*?)\}/g) || [];
  return conditions.map(cond => cond.slice(1, -1)).filter((cond, index, arr) => arr.indexOf(cond) === index);
}