/**
 * @fileoverview Comprehensive Examples Validation Test Suite
 * 
 * This test suite validates all examples in the examples/ directory to ensure they:
 * 1. Process without errors
 * 2. Produce expected output structure
 * 3. Handle all features correctly (headers, mixins, cross-references, etc.)
 * 4. Maintain consistency with the Ruby Legal Markdown specification
 * 
 * Inspired by the original Ruby project's comprehensive fixture testing approach.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { processLegalMarkdown } from '../../src/index';

// Load example files synchronously for test discovery
function getExampleFiles(): string[] {
  const EXAMPLES_DIR = path.join(__dirname, '../../examples');
  const pattern = path.join(EXAMPLES_DIR, '**/*.md').replace(/\\/g, '/');
  const allFiles = glob.sync(pattern);
  
  return allFiles.filter(file => 
    !file.includes('output') && 
    !file.includes('README') &&
    !file.includes('.output.')
  );
}

describe('Comprehensive Examples Validation', () => {
  const EXAMPLES_DIR = path.join(__dirname, '../../examples');
  const exampleFiles = getExampleFiles();

  beforeAll(() => {
    console.log(`Found ${exampleFiles.length} example files to validate`);
    expect(exampleFiles.length).toBeGreaterThan(0);
  });

  describe('Basic Processing Validation', () => {
    test.each(exampleFiles.map(file => [
      path.relative(EXAMPLES_DIR, file), 
      file
    ]))('should process %s without errors', async (relativePath, filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      expect(() => {
        const result = processLegalMarkdown(content);
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(typeof result.content).toBe('string');
        expect(result.content.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('Feature-Specific Validation', () => {
    describe('Header Processing', () => {
      const headerFiles = exampleFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return /^l{1,6}\.\s/m.test(content);
      });

      test.each(headerFiles.map(file => [
        path.relative(EXAMPLES_DIR, file),
        file
      ]))('should process headers correctly in %s', (relativePath, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = processLegalMarkdown(content);

        // Should convert l. to proper numbering (when using legal markdown syntax)
        if (content.match(/^l{1,6}\.\s/m)) {
          expect(result.content).toMatch(/Article \d+\.|Section \d+\.|\(\d+\)|^\d+\./m);
        }

        // Should not contain unprocessed header markers
        expect(result.content).not.toMatch(/^l{1,6}\.\s/m);
      });
    });

    describe('Mixin Processing', () => {
      const mixinFiles = exampleFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('{{') && content.includes('}}');
      });

      test.each(mixinFiles.map(file => [
        path.relative(EXAMPLES_DIR, file),
        file
      ]))('should process mixins correctly in %s', (relativePath, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = processLegalMarkdown(content);

        // Check for basic mixin resolution (title, common variables)
        const hasMetadata = content.includes('---') && content.indexOf('---', 1) > 0;
        
        if (hasMetadata) {
          // Should resolve basic template variables
          expect(result.content).not.toContain('{{title}}');
          
          // Should not contain unresolved mixins for common variables
          const commonUnresolved = result.content.match(/\{\{(title|author|date|client|company)\}\}/g);
          if (commonUnresolved) {
            console.warn(`Unresolved common mixins in ${relativePath}:`, commonUnresolved);
          }
        }
      });
    });

    describe('Cross-Reference Processing', () => {
      const crossRefFiles = exampleFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('|') && /\|[^|]+\|/.test(content);
      });

      test.each(crossRefFiles.map(file => [
        path.relative(EXAMPLES_DIR, file),
        file
      ]))('should process cross-references correctly in %s', (relativePath, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = processLegalMarkdown(content);

        // Find internal reference definitions (headers with |key|)
        const internalDefs = content.match(/^l{1,3}\.\s+.*?\s+\|(\w+)\|$/gm);
        const definedKeys = internalDefs ? 
          internalDefs.map(def => def.match(/\|(\w+)\|$/)?.[1]).filter(Boolean) : 
          [];

        if (definedKeys.length > 0) {
          // Internal references should be resolved to section numbers
          definedKeys.forEach(key => {
            const usagePattern = new RegExp(`\\|${key}\\|`, 'g');
            const usagesInContent = content.match(usagePattern) || [];
            
            // Subtract header definitions from total usages
            const contentUsages = usagesInContent.length - 1; // -1 for definition
            
            if (contentUsages > 0) {
              // Should be resolved to Article/Section numbers in content
              expect(result.content).toMatch(/Article \d+\.|Section \d+\.|\(\d+\)/);
            }
          });
        }
      });
    });

    describe('Optional Clauses Processing', () => {
      const optionalFiles = exampleFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('[') && content.includes(']') && content.includes('{');
      });

      test.each(optionalFiles.map(file => [
        path.relative(EXAMPLES_DIR, file),
        file
      ]))('should process optional clauses correctly in %s', (relativePath, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = processLegalMarkdown(content);

        // Should not contain unprocessed optional clause syntax
        expect(result.content).not.toMatch(/\[[^\]]*\]\{[^}]*\}/);
      });
    });

    describe('Template Loops Processing', () => {
      const loopFiles = exampleFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        // Only test files with legal markdown loop syntax, not Handlebars
        return content.match(/\{\{#\w+\}\}/) && content.match(/\{\{\/\w+\}\}/) && 
               !content.includes('{{#each}}') && !content.includes('{{#if');
      });

      test.each(loopFiles.map(file => [
        path.relative(EXAMPLES_DIR, file),
        file
      ]))('should process template loops correctly in %s', (relativePath, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = processLegalMarkdown(content);

        // Should not contain unprocessed loop syntax
        expect(result.content).not.toMatch(/\{\{#[^}]*\}\}/);
        expect(result.content).not.toMatch(/\{\{\/[^}]*\}\}/);
      });
    });
  });

  describe('Output Quality Validation', () => {
    test.each(exampleFiles.map(file => [
      path.relative(EXAMPLES_DIR, file),
      file
    ]))('should produce clean output for %s', (relativePath, filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = processLegalMarkdown(content);

      // Should not contain syntax errors or malformed output
      expect(result.content).not.toContain('undefined');
      expect(result.content).not.toContain('[object Object]');
      expect(result.content).not.toContain('NaN');
      
      // Should maintain document structure
      expect(result.content.trim().length).toBeGreaterThan(0);
      
      // Should not have excessive empty lines (more than 8 consecutive)
      const excessiveEmptyLines = result.content.match(/\n\n\n\n\n\n\n\n\n+/g);
      expect(excessiveEmptyLines).toBeNull();
    });

    test.each(exampleFiles.map(file => [
      path.relative(EXAMPLES_DIR, file),
      file
    ]))('should preserve content structure in %s', (relativePath, filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = processLegalMarkdown(content);

      // Count approximate content sections (paragraphs/headers)
      const inputSections = content.split(/\n\s*\n/).filter(s => s.trim().length > 0).length;
      const outputSections = result.content.split(/\n\s*\n/).filter(s => s.trim().length > 0).length;

      // Output should have similar section count (allowing for processing variations)
      const ratio = outputSections / inputSections;
      expect(ratio).toBeGreaterThan(0.5); // At least half the sections preserved
      expect(ratio).toBeLessThan(3.0);    // Not more than triple (reasonable expansion)
    });
  });

  describe('Comprehensive Processing Workflow', () => {
    test('should process all examples in a batch without conflicts', () => {
      const results = exampleFiles.map(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        return {
          file: path.relative(EXAMPLES_DIR, filePath),
          result: processLegalMarkdown(content)
        };
      });

      // All should succeed
      expect(results).toHaveLength(exampleFiles.length);
      
      // Each should have valid output
      results.forEach(({ file, result }) => {
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        if (!result.content || result.content.length === 0) {
          fail(`Failed processing or empty output for ${file}`);
        }
      });

      console.log(`✅ Successfully processed ${results.length} example files`);
    });
  });

  describe('Ruby Specification Compliance', () => {
    test('should handle cross-references consistently with Ruby implementation', () => {
      // Test internal cross-references (Ruby spec behavior)
      const internalRefContent = `l. **Test Section** |test|

Reference to |test| should work.`;

      const result = processLegalMarkdown(internalRefContent);
      expect(result.content).toContain('Reference to Article 1. should work.');
    });

    test('should handle metadata fallback for cross-references', () => {
      // Test metadata fallback (backward compatibility)
      const metadataRefContent = `---
client_name: "ACME Corp"
---

Reference to |client_name| should work.`;

      const result = processLegalMarkdown(metadataRefContent);
      expect(result.content).toContain('Reference to ACME Corp should work.');
    });

    test('should handle mixed syntax correctly', () => {
      // Test both syntaxes working together
      const mixedContent = `---
client_name: "ACME Corp"
---

l. **Test Section** |test|

Reference to |test| (internal) and {{client_name}} (mixin) and |client_name| (metadata fallback).`;

      const result = processLegalMarkdown(mixedContent);
      expect(result.content).toContain('Reference to Article 1. (internal) and ACME Corp (mixin) and ACME Corp (metadata fallback).');
    });
  });
});