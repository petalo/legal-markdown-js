/**
 * @fileoverview Unit tests for Import Processor with Frontmatter Merge
 *
 * This test suite validates the enhanced import processor that includes
 * automatic frontmatter merging capabilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import { processPartialImports, validateImports } from '../../../../src/core/processors/import-processor';
import { LegalMarkdownOptions } from '../../../../src/types';
import { vi } from 'vitest';

describe('Import Processor with Frontmatter Merge', () => {
  const testDir = path.join(__dirname, 'temp-frontmatter');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });

  describe('Basic Frontmatter Merging', () => {
    it('should merge frontmatter from imported files by default', () => {
      // Create imported file with frontmatter
      const importedContent = `---
author: John Doe
version: 1.0
tags:
  - legal
  - contract
---

# Imported Content
This is imported content with frontmatter.`;

      fs.writeFileSync(path.join(testDir, 'with-frontmatter.md'), importedContent);

      // Main document content (without frontmatter - that should be parsed separately)
      const mainContent = `# Main Document
@import with-frontmatter.md

End of document.`;

      const currentMetadata = {
        title: 'Main Document',
        client: 'Acme Corp'
      };

      const result = processPartialImports(mainContent, testDir, currentMetadata);

      expect(result.content).toContain('# Imported Content');
      expect(result.content).toContain('This is imported content with frontmatter.');
      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('author: John Doe');

      expect(result.mergedMetadata).toBeDefined();
      expect(result.mergedMetadata).toEqual({
        title: 'Main Document',    // Current wins
        client: 'Acme Corp',       // Current preserved
        author: 'John Doe',        // Added from import
        version: 1.0,              // Added from import
        tags: ['legal', 'contract'] // Added from import
      });
    });

    it('should handle conflicts with "source always wins" strategy', () => {
      const importedContent = `---
title: Imported Title
client: Different Corp
author: Jane Smith
---

Imported content.`;

      fs.writeFileSync(path.join(testDir, 'conflicting.md'), importedContent);

      const mainContent = `@import conflicting.md`;

      const currentMetadata = {
        title: 'Main Title',
        client: 'Main Corp',
        date: '@today'
      };

      const result = processPartialImports(mainContent, testDir, currentMetadata);

      expect(result.mergedMetadata).toEqual({
        title: 'Main Title',      // Current wins over import
        client: 'Main Corp',      // Current wins over import
        date: '@today',           // Current preserved
        author: 'Jane Smith'      // Added from import (no conflict)
      });
    });

    it('should disable frontmatter merging when explicitly disabled', () => {
      const importedContent = `---
author: John Doe
version: 1.0
---

Imported content without frontmatter merge.`;

      fs.writeFileSync(path.join(testDir, 'disabled-merge.md'), importedContent);

      const mainContent = `@import disabled-merge.md`;

      const options: LegalMarkdownOptions = {
        disableFrontmatterMerge: true
      };

      const result = processPartialImports(mainContent, testDir, {}, options);

      expect(result.content).toContain('Imported content without frontmatter merge.');
      expect(result.mergedMetadata).toBeUndefined();
    });
  });

  describe('Nested Import Scenarios', () => {
    it('should handle nested imports with cascading frontmatter', () => {
      // Create deeply nested import
      const level3Content = `---
level: 3
author: Level 3 Author
common_field: level3_value
---

Level 3 content.`;

      const level2Content = `---
level: 2
editor: Level 2 Editor
common_field: level2_value
---

Level 2 content.
@import level3.md`;

      const level1Content = `---
level: 1
reviewer: Level 1 Reviewer
common_field: level1_value
---

Level 1 content.
@import level2.md`;

      fs.writeFileSync(path.join(testDir, 'level3.md'), level3Content);
      fs.writeFileSync(path.join(testDir, 'level2.md'), level2Content);
      fs.writeFileSync(path.join(testDir, 'level1.md'), level1Content);

      const mainContent = `@import level1.md`;

      const currentMetadata = {
        title: 'Main Document',
        common_field: 'main_value'
      };

      const result = processPartialImports(mainContent, testDir, currentMetadata);

      expect(result.mergedMetadata).toEqual({
        title: 'Main Document',     // Current preserved
        common_field: 'main_value', // Current wins over all imports
        level: 1,                   // First import wins over subsequent
        reviewer: 'Level 1 Reviewer', // From level 1
        editor: 'Level 2 Editor',   // From level 2
        author: 'Level 3 Author'    // From level 3
      });
    });

    it('should handle circular import detection', () => {
      const fileA = `---
source: fileA
---

Content from A.
@import fileB.md`;

      const fileB = `---
source: fileB
---

Content from B.
@import fileA.md`;

      fs.writeFileSync(path.join(testDir, 'fileA.md'), fileA);
      fs.writeFileSync(path.join(testDir, 'fileB.md'), fileB);

      const mainContent = `@import fileA.md`;

      // This should not cause infinite recursion
      // The system should handle it gracefully
      expect(() => {
        processPartialImports(mainContent, testDir, {});
      }).not.toThrow();
    });
  });

  describe('Reserved Fields Filtering', () => {
    it('should filter reserved fields from imported frontmatter', () => {
      const maliciousImport = `---
title: Legitimate Title
client: Legitimate Client
level-one: HACKED LEVEL
force_commands: rm -rf /
meta-yaml-output: steal-data.yml
---

Legitimate content.`;

      fs.writeFileSync(path.join(testDir, 'malicious.md'), maliciousImport);

      const mainContent = `@import malicious.md`;

      const currentMetadata = {
        title: 'Safe Title'
      };

      const result = processPartialImports(mainContent, testDir, currentMetadata);

      expect(result.mergedMetadata).toEqual({
        title: 'Safe Title',           // Current wins
        client: 'Legitimate Client'    // Only non-reserved field added
        // All reserved fields filtered out
      });
    });

    it('should log filtered reserved fields when logging enabled', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const importWithReserved = `---
author: John Doe
level-one: ARTICLE %n
force_commands: --pdf
---

Content.`;

      fs.writeFileSync(path.join(testDir, 'reserved.md'), importWithReserved);

      const mainContent = `@import reserved.md`;

      const options: LegalMarkdownOptions = {
        logImportOperations: true
      };

      processPartialImports(mainContent, testDir, {}, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Reserved field 'level-one' ignored from import")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Reserved field 'force_commands' ignored from import")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Import Tracing', () => {
    it('should add tracing comments when enabled', () => {
      const importedContent = `---
author: John Doe
---

Traced imported content.`;

      fs.writeFileSync(path.join(testDir, 'traced.md'), importedContent);

      const mainContent = `Main content.
@import traced.md
More main content.`;

      const options: LegalMarkdownOptions = {
        importTracing: true
      };

      const result = processPartialImports(mainContent, testDir, {}, options);

      expect(result.content).toContain('<!-- start import: traced.md -->');
      expect(result.content).toContain('Traced imported content.');
      expect(result.content).toContain('<!-- end import: traced.md -->');
    });

    it('should handle nested tracing correctly', () => {
      const nestedImport = `---
nested: true
---

Nested import content.`;

      const parentImport = `---
parent: true
---

Parent content.
@import nested-traced.md
End of parent.`;

      fs.writeFileSync(path.join(testDir, 'nested-traced.md'), nestedImport);
      fs.writeFileSync(path.join(testDir, 'parent-traced.md'), parentImport);

      const mainContent = `@import parent-traced.md`;

      const options: LegalMarkdownOptions = {
        importTracing: true
      };

      const result = processPartialImports(mainContent, testDir, {}, options);

      expect(result.content).toContain('<!-- start import: parent-traced.md -->');
      expect(result.content).toContain('<!-- start import: nested-traced.md -->');
      expect(result.content).toContain('Nested import content.');
      expect(result.content).toContain('<!-- end import: nested-traced.md -->');
      expect(result.content).toContain('<!-- end import: parent-traced.md -->');
    });
  });

  describe('Type Validation', () => {
    it('should validate type compatibility when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const importWithTypeConflicts = `---
count: [1, 2, 3]
enabled: { not: "boolean" }
items: "not an array"
config: "not an object"
compatible: "string value"
---

Content with type conflicts.`;

      fs.writeFileSync(path.join(testDir, 'types.md'), importWithTypeConflicts);

      const mainContent = `@import types.md`;

      const currentMetadata = {
        count: 42,
        enabled: true,
        items: [1, 2, 3],
        config: { debug: true }
      };

      const options: LegalMarkdownOptions = {
        validateImportTypes: true,
        logImportOperations: true
      };

      const result = processPartialImports(mainContent, testDir, currentMetadata, options);

      // Current values should be preserved due to type conflicts
      expect(result.mergedMetadata).toEqual({
        count: 42,                    // Current preserved
        enabled: true,                // Current preserved
        items: [1, 2, 3],            // Current preserved
        config: { debug: true },      // Current preserved
        compatible: 'string value'    // Added (no type conflict)
      });

      // Should log type conflicts
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Type conflict for 'count'")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Type conflict for 'enabled'")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Complex Real-world Scenarios', () => {
    it('should handle legal document template composition', () => {
      // Standard terms import
      const standardTerms = `---
confidentiality: true
termination_notice: "30 days"
governing_law: "State of California"
liability_cap: 1000000
---

## Standard Terms
These are the standard terms and conditions.`;

      // Client-specific terms
      const clientTerms = `---
client_name: "Acme Corporation"
client_address: "123 Business Ave, San Francisco, CA"
payment_terms: "Net 30"
liability_cap: 2000000
---

## Client-Specific Terms
Special terms for this client.`;

      // Project-specific terms
      const projectTerms = `---
project_name: "Software Development Project"
project_duration: "6 months"
project_value: 150000
payment_terms: "Milestone-based"
---

## Project Terms
Project-specific clauses.`;

      // Create test files
      fs.writeFileSync(path.join(testDir, 'standard-terms.md'), standardTerms);
      fs.writeFileSync(path.join(testDir, 'client-terms.md'), clientTerms);
      fs.writeFileSync(path.join(testDir, 'project-terms.md'), projectTerms);

      // Main contract template
      const mainContract = `# Service Agreement

@import standard-terms.md
@import client-terms.md  
@import project-terms.md

## Signatures
Signature block here.`;

      const initialMetadata = {
        title: 'Service Agreement',
        effective_date: '2024-01-01',
        liability_cap: 500000  // This should win over all imports
      };

      const result = processPartialImports(mainContract, testDir, initialMetadata);

      expect(result.mergedMetadata).toEqual({
        title: 'Service Agreement',
        effective_date: '2024-01-01',
        liability_cap: 500000,           // Current wins over all imports
        confidentiality: true,           // From standard terms
        termination_notice: '30 days',   // From standard terms
        governing_law: 'State of California', // From standard terms
        client_name: 'Acme Corporation', // From client terms
        client_address: '123 Business Ave, San Francisco, CA', // From client terms
        payment_terms: 'Net 30',         // From client terms (wins over project)
        project_name: 'Software Development Project', // From project terms
        project_duration: '6 months',    // From project terms
        project_value: 150000            // From project terms
      });

      expect(result.content).toContain('Standard Terms');
      expect(result.content).toContain('Client-Specific Terms');
      expect(result.content).toContain('Project Terms');
      expect(result.importedFiles).toHaveLength(3);
    });

    it('should handle partial imports with mixed content types', () => {
      // Text-only import (no frontmatter)
      const textOnly = `This is just text content without frontmatter.`;

      // Frontmatter only (no content)
      const frontmatterOnly = `---
metadata_field: "value"
config_setting: true
---`;

      // Mixed content
      const mixedContent = `---
mixed_field: "mixed value"
---

Mixed content with both frontmatter and text.`;

      fs.writeFileSync(path.join(testDir, 'text-only.md'), textOnly);
      fs.writeFileSync(path.join(testDir, 'frontmatter-only.md'), frontmatterOnly);
      fs.writeFileSync(path.join(testDir, 'mixed.md'), mixedContent);

      const mainContent = `# Main Document
@import text-only.md
@import frontmatter-only.md
@import mixed.md`;

      const result = processPartialImports(mainContent, testDir, {});

      expect(result.content).toContain('This is just text content');
      expect(result.content).toContain('Mixed content with both frontmatter');
      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('metadata_field:');

      expect(result.mergedMetadata).toEqual({
        metadata_field: 'value',
        config_setting: true,
        mixed_field: 'mixed value'
      });
    });
  });

  describe('Detailed Logging and Statistics', () => {
    it('should provide detailed merge statistics when logging enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const importWithStats = `---
author: John Doe
version: 1.0
level-one: FILTERED
---

Content for statistics test.`;

      fs.writeFileSync(path.join(testDir, 'stats.md'), importWithStats);

      const mainContent = `@import stats.md`;

      const currentMetadata = {
        title: 'Current Title',
        author: 'Current Author'  // This will conflict with import
      };

      const options: LegalMarkdownOptions = {
        logImportOperations: true
      };

      processPartialImports(mainContent, testDir, currentMetadata, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extracted 3 metadata fields from stats.md')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Merging metadata from 1 imports with 2 current fields')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Frontmatter merge completed:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Properties added: 1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Conflicts resolved: 1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reserved fields filtered: 1')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed YAML gracefully', () => {
      const malformedYaml = `---
invalid: yaml: content: here
unclosed: [array
---

Content after malformed YAML.`;

      fs.writeFileSync(path.join(testDir, 'malformed.md'), malformedYaml);

      const mainContent = `@import malformed.md`;

      expect(() => {
        processPartialImports(mainContent, testDir, {});
      }).not.toThrow();

      const result = processPartialImports(mainContent, testDir, {});
      expect(result.content).toContain('Content after malformed YAML.');
    });

    it('should handle missing files gracefully', () => {
      const mainContent = `@import nonexistent.md`;

      const result = processPartialImports(mainContent, testDir, {});

      expect(result.content).toContain('<!-- Error importing nonexistent.md -->');
      expect(result.mergedMetadata).toBeUndefined();
    });

    it('should handle empty current metadata', () => {
      const importContent = `---
field: value
---

Content.`;

      fs.writeFileSync(path.join(testDir, 'empty-current.md'), importContent);

      const mainContent = `@import empty-current.md`;

      const result = processPartialImports(mainContent, testDir, undefined);

      expect(result.mergedMetadata).toEqual({
        field: 'value'
      });
    });

    it('should handle null and undefined metadata values', () => {
      const importContent = `---
null_field: null
undefined_field: ~
empty_string: ""
zero_value: 0
false_value: false
---

Content with various falsy values.`;

      fs.writeFileSync(path.join(testDir, 'falsy.md'), importContent);

      const mainContent = `@import falsy.md`;

      const result = processPartialImports(mainContent, testDir, {});

      expect(result.mergedMetadata).toEqual({
        null_field: null,
        undefined_field: null, // YAML ~ becomes null
        empty_string: '',
        zero_value: 0,
        false_value: false
      });
    });
  });
});