import * as fs from 'fs';
import * as path from 'path';
import { ImportProcessingResult } from '../../types';

/**
 * Processes partial imports in a LegalMarkdown document
 * 
 * @param content - The document content
 * @param basePath - Optional base path for resolving imports
 * @returns Processed content with imports resolved
 */
export function processPartialImports(
  content: string,
  basePath?: string
): ImportProcessingResult {
  // Regular expression to match import statements
  // Format: @import [filename]
  const importPattern = /@import\s+(.+?)(?:\s|$)/g;
  
  const importedFiles: string[] = [];
  const processedContent = content.replace(importPattern, (match, filename) => {
    // Clean up filename (remove quotes, etc.)
    const cleanFilename = filename.trim().replace(/['"]/g, '');
    
    try {
      // Resolve the import path
      const importPath = resolveImportPath(cleanFilename, basePath);
      
      // Read the imported file
      const importedContent = fs.readFileSync(importPath, 'utf8');
      
      // Track imported files
      importedFiles.push(importPath);
      
      // Process nested imports
      const nestedResult = processPartialImports(importedContent, path.dirname(importPath));
      importedFiles.push(...nestedResult.importedFiles);
      
      return nestedResult.content;
    } catch (error) {
      console.error(`Error importing file ${cleanFilename}:`, error);
      return `<!-- Error importing ${cleanFilename} -->`;
    }
  });
  
  return {
    content: processedContent,
    importedFiles
  };
}

/**
 * Resolves the absolute path of an import
 * 
 * @param importPath - Relative or absolute import path
 * @param basePath - Base path for resolving relative imports
 * @returns Absolute path to the imported file
 */
function resolveImportPath(importPath: string, basePath?: string): string {
  // If the import path is absolute, use it directly
  if (path.isAbsolute(importPath)) {
    return importPath;
  }
  
  // If no base path provided, use current working directory
  const base = basePath || process.cwd();
  
  // Resolve relative to base path
  return path.resolve(base, importPath);
}

/**
 * Validates that all import paths in a document exist
 * 
 * @param content - The document content
 * @param basePath - Optional base path for resolving imports
 * @returns Array of validation errors, empty if all imports are valid
 */
export function validateImports(
  content: string,
  basePath?: string
): string[] {
  const importPattern = /@import\s+(.+?)(?:\s|$)/g;
  const errors: string[] = [];
  
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const filename = match[1].trim().replace(/['"]/g, '');
    
    try {
      const importPath = resolveImportPath(filename, basePath);
      
      // Check if file exists
      if (!fs.existsSync(importPath)) {
        errors.push(`Import file not found: ${importPath}`);
      }
    } catch (error) {
      errors.push(`Error resolving import: ${filename}`);
    }
  }
  
  return errors;
}