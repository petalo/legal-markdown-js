/**
 * @fileoverview Integration tests for Legal Markdown processing
 *
 * Tests complete document processing workflows including:
 * - Full document processing with all features
 * - Complex nested structures and numbering
 * - Error handling and graceful degradation
 * - Selective processing options
 *
 * These are integration tests because they test the entire Legal Markdown pipeline
 * from YAML parsing through template processing to final document generation,
 * involving multiple components working together (parser, template engine,
 * header numbering, file imports, metadata export).
 */

import { processLegalMarkdown } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Legal Markdown Integration', () => {
  /** Temporary directory for test files */
  const testDir = path.join(__dirname, 'temp');

  /**
   * Setup test directory before each test
   */
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  /**
   * Clean up test directory after each test
   */
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Complete document processing workflow', () => {
    /**
     * Test comprehensive document processing with all features:
     * - YAML metadata processing
     * - Cross-references between data
     * - Optional clauses with conditions
     * - File imports
     * - Header numbering with custom formats
     * - Metadata export
     */
    it('should process a complete legal document with all features', () => {
      // Create a partial import file
      const importContent = `ll. Payment Terms
The payment shall be made within |payment_days| days.

[Late fees apply]{late_fees_apply}.`;

      const importPath = path.join(testDir, 'payment-terms.md');
      fs.writeFileSync(importPath, importContent);

      const content = `---
title: "Software License Agreement"
parties:
  - name: "TechCorp Inc."
    type: "Corporation"
    role: "Licensor"
  - name: "ClientCorp LLC"
    type: "LLC"
    role: "Licensee"
effective_date: "2024-01-01"
jurisdiction: "California"
governing_law: "California State Law"
payment_days: 30
late_fees_apply: true
include_warranty: false
meta-json-output: "tests/output/agreement-metadata.json"
level-one: "Article %n."
level-two: "Section %n.%s"
level-three: "(%n)"
---

l. Definitions
ll. Software
The "Software" means the computer program licensed under this Agreement.

ll. License
The license granted to |parties.1.name| by |parties.0.name|.

l. License Grant
ll. Scope
[The license includes warranty coverage]{include_warranty}.

@import payment-terms.md

l. Governing Law
This Agreement shall be governed by |governing_law| in |jurisdiction|.`;

      const result = processLegalMarkdown(content, {
        basePath: testDir,
        exportMetadata: true,
        exportFormat: 'json',
      });

      // Verify content processing
      expect(result.content).toContain('Article 1. Definitions');
      expect(result.content).toContain('  Section 1.1 Software');
      expect(result.content).toContain('  Section 2.1 License');
      expect(result.content).toContain('Article 2. License Grant');
      expect(result.content).toContain('  Section 1.2 Scope');
      expect(result.content).toContain('Article 3. Governing Law');

      // Verify cross-references
      expect(result.content).toContain('ClientCorp LLC');
      expect(result.content).toContain('TechCorp Inc.');
      expect(result.content).toContain('California State Law');
      expect(result.content).toContain('within 30 days');

      // Verify optional clauses
      expect(result.content).not.toContain('warranty coverage'); // should be excluded
      expect(result.content).toContain('Late fees apply'); // should be included

      // Verify imports
      expect(result.content).toContain('Payment Terms');

      // Verify metadata
      expect(result.metadata?.title).toBe('Software License Agreement');
      expect(result.metadata?.parties).toHaveLength(2);
      expect(result.metadata?.jurisdiction).toBe('California');

      // Verify metadata export
      expect(result.exportedFiles).toBeDefined();
      expect(result.exportedFiles?.length).toBeGreaterThan(0);
    });

    /**
     * Test deep header nesting (5 levels) with complex data structures and conditional clauses
     */
    it('should handle complex nested structures', () => {
      const content = `---
title: "Complex Legal Document"
company: "ACME Corporation"
contract_value: 1000000
currency: "USD"
conditions:
  premium: true
  enterprise: false
  support_included: true
sections:
  - name: "Introduction"
  - name: "Terms"
---

l. |sections.0.name|
This agreement is between the parties for |company|.

ll. Contract Value
The total value is |contract_value| |currency|.

l. |sections.1.name|
ll. Service Level
[Premium support is included]{conditions.premium AND conditions.support_included}.

lll. Response Times
Normal response time applies.

llll. Escalation
[Enterprise escalation procedures]{conditions.enterprise}.

lllll. Final Level
Ultimate escalation to executive team.`;

      const result = processLegalMarkdown(content);

      // Verify complex header numbering
      expect(result.content).toContain('Article 1. Introduction');
      expect(result.content).toContain('  Section 1. Contract Value');
      expect(result.content).toContain('Article 2. Terms');
      expect(result.content).toContain('  Section 1. Service Level');
      expect(result.content).toContain('    (1) Response Times');
      expect(result.content).toContain('      (1a) Escalation');
      expect(result.content).toContain('        (1ai) Final Level');

      // Verify complex references
      expect(result.content).toContain('ACME Corporation');
      expect(result.content).toContain('1000000 USD');

      // Verify complex conditions
      expect(result.content).toContain('Premium support is included');
      expect(result.content).not.toContain('Enterprise escalation procedures');
    });

    /**
     * Test error handling with null values and missing references
     */
    it('should handle error scenarios gracefully', () => {
      const content = `---
title: "Error Test Document"
invalid_reference: null
---

l. Valid Header
Cross reference to |valid_field| works.

ll. Invalid Reference
This |invalid_reference| should handle null.

lll. Missing Reference
This |missing_field| should remain unchanged.`;

      const result = processLegalMarkdown(content);

      expect(result.content).toContain('Article 1. Valid Header');
      expect(result.content).toContain('  Section 1. Invalid Reference');
      expect(result.content).toContain('    (1) Missing Reference');
      expect(result.content).toContain('This null should handle null');
      expect(result.content).toContain('This |missing_field| should remain unchanged');
    });

    /**
     * Test selective processing flags to disable specific features
     */
    it('should support selective processing options', () => {
      const content = `---
title: "Selective Processing Test"
client: "Test Client"
---

l. Header One
ll. Header Two

[Optional content]{condition}

Reference: |client|`;

      // Test YAML only
      const yamlOnlyResult = processLegalMarkdown(content, { yamlOnly: true });
      expect(yamlOnlyResult.content).toContain('l. Header One');
      expect(yamlOnlyResult.content).toContain('[Optional content]{condition}');
      expect(yamlOnlyResult.content).toContain('Reference: |client|');

      // Test no headers
      const noHeadersResult = processLegalMarkdown(content, { noHeaders: true });
      expect(noHeadersResult.content).toContain('l. Header One');
      expect(noHeadersResult.content).toContain('Reference: Test Client');

      // Test no references
      const noReferencesResult = processLegalMarkdown(content, { noReferences: true });
      expect(noReferencesResult.content).toContain('Article 1. Header One');
      expect(noReferencesResult.content).toContain('Reference: |client|');

      // Test no clauses
      const noClausesResult = processLegalMarkdown(content, { noClauses: true });
      expect(noClausesResult.content).toContain('Article 1. Header One');
      expect(noClausesResult.content).toContain('[Optional content]{condition}');
      expect(noClausesResult.content).toContain('Reference: Test Client');
    });
  });
});
