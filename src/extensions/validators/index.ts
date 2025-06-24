// Document validators - Extensions for validation beyond core functionality

/**
 * Validates document structure and content
 * This is an extension not present in the original legal-markdown
 */
export function validateDocumentStructure(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation rules
  if (!content.trim()) {
    errors.push('Document cannot be empty');
  }
  
  // Check for unmatched optional clause brackets
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched optional clause brackets');
  }
  
  // Check for unmatched conditional braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unmatched conditional braces');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}