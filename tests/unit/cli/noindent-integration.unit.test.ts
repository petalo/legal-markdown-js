/**
 * @fileoverview Integration Tests for noIndent Option in CLI Context
 *
 * Tests how the noIndent option should be configured in different CLI scenarios:
 * - CLI markdown output: noIndent should be false (default)
 * - CLI HTML/PDF output: noIndent should be true
 * - Web playground: depends on preview type
 * - Unit tests: should use noIndent: true for clean comparison
 */

import { describe, it, expect } from 'vitest';
import { processLegalMarkdownWithRemark } from '../../../src/extensions/remark/legal-markdown-processor';

describe('noIndent Integration with CLI Scenarios', () => {
  const testInput = `l. Main Section

ll. Subsection One

lll. Deep Section

ll. Subsection Two`;

  describe('CLI Markdown Output Scenario', () => {
    it('should use default behavior (noIndent: false) for markdown files', async () => {
      // Simulates: legal2md input.lmd output.md
      const result = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        // noIndent: undefined (defaults to false)
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Should preserve indentation for proper markdown hierarchy
      expect(result.content).toContain('##   Section 1. Subsection One');
      expect(result.content).toContain('###     (1) Deep Section');
      expect(result.content).toContain('##   Section 2. Subsection Two');
    });

    it('should explicitly support noIndent: false for markdown output', async () => {
      // Explicit configuration for markdown output
      const result = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: false,
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Should preserve indentation
      expect(result.content).toContain('##   Section 1. Subsection One');
      expect(result.content).toContain('###     (1) Deep Section');
    });
  });

  describe('CLI HTML/PDF Output Scenario', () => {
    it('should use noIndent: true for HTML output', async () => {
      // Simulates: legal2md input.lmd --format html
      const result = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: true, // Critical for HTML processing
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Should not have indentation to prevent <pre><code> blocks
      expect(result.content).toContain('## Section 1. Subsection One');
      expect(result.content).toContain('### (1) Deep Section');
      expect(result.content).toContain('## Section 2. Subsection Two');
      
      // Verify NO HTML entities for spaces
      expect(result.content).not.toContain('&#x20;');
    });

    it('should use noIndent: true for PDF output', async () => {
      // Simulates: legal2md input.lmd --format pdf
      const result = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: true, // Critical for PDF processing
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Clean markdown suitable for PDF conversion
      expect(result.content).toContain('## Section 1. Subsection One');
      expect(result.content).toContain('### (1) Deep Section');
      expect(result.content).not.toContain('&#x20;');
    });
  });

  describe('Web Playground Scenarios', () => {
    it('should support both modes for dual preview', async () => {
      // Web playground shows both markdown and HTML preview
      
      // Markdown preview (with indentation)
      const markdownPreview = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: false,
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // HTML preview (without indentation)
      const htmlPreview = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: true,
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Verify different outputs
      expect(markdownPreview.content).toContain('##   Section 1.');
      expect(htmlPreview.content).toContain('## Section 1.');
      expect(htmlPreview.content).not.toContain('   '); // No extra spaces
    });
  });

  describe('Unit Test Scenarios', () => {
    it('should use noIndent: true for clean test comparisons', async () => {
      // Unit tests should use noIndent: true for cleaner assertions
      const result = await processLegalMarkdownWithRemark(testInput, {
        enableFieldTracking: false,
        debug: false,
        noIndent: true,
        additionalMetadata: {
          'level-1': 'Article %n.',
          'level-2': 'Section %n.',
          'level-3': '(%n)'
        }
      });

      // Easy to test without HTML entities
      expect(result.content).toContain('# Article 1. Main Section');
      expect(result.content).toContain('## Section 1. Subsection One');
      expect(result.content).toContain('### (1) Deep Section');
      expect(result.content).toContain('## Section 2. Subsection Two');
    });
  });

  describe('Field Tracking Integration', () => {
    it('should work correctly with field tracking enabled', async () => {
      const inputWithFields = `l. {{section_title}}

ll. Contract Details

Client: {{client_name}}
Amount: {{amount}}`;

      // Test with field tracking and no indentation (HTML scenario)
      const result = await processLegalMarkdownWithRemark(inputWithFields, {
        enableFieldTracking: true,
        debug: false,
        noIndent: true,
        additionalMetadata: {
          section_title: 'Legal Agreement',
          client_name: 'ACME Corp',
          amount: 1500,
          'level-1': 'Article %n.',
          'level-2': 'Section %n.'
        }
      });

      // Headers should be clean (with field tracking HTML)
      expect(result.content).toContain('# Article 1. <span class="legal-field imported-value" data-field="section_title">Legal Agreement</span>');
      expect(result.content).toContain('## Section 1. Contract Details');
      
      // Field tracking should still work
      expect(result.content).toContain('<span class="legal-field imported-value" data-field="client_name">ACME Corp</span>');
      expect(result.content).toContain('<span class="legal-field imported-value" data-field="amount">1500</span>');
      expect(result.content).not.toContain('&#x20;');
    });

    it('should work with field tracking and indentation (markdown scenario)', async () => {
      const inputWithFields = `l. {{section_title}}

ll. Contract Details`;

      const result = await processLegalMarkdownWithRemark(inputWithFields, {
        enableFieldTracking: true,
        debug: false,
        noIndent: false,
        additionalMetadata: {
          section_title: 'Legal Agreement',
          'level-1': 'Article %n.',
          'level-2': 'Section %n.'
        }
      });

      // Should have indentation and field tracking
      expect(result.content).toContain('# Article 1. <span class="legal-field imported-value" data-field="section_title">Legal Agreement</span>');
      expect(result.content).toContain('##   Section 1. Contract Details');
    });
  });

  describe('Documentation and Best Practices', () => {
    it('should document the decision matrix', () => {
      // DECISION MATRIX FOR noIndent OPTION:
      
      // CLI Usage:
      // - legal2md input.lmd output.md          → noIndent: false (default)
      // - legal2md input.lmd --format html      → noIndent: true
      // - legal2md input.lmd --format pdf       → noIndent: true
      
      // Web Playground:
      // - Markdown preview pane                 → noIndent: false
      // - HTML preview pane                     → noIndent: true
      
      // Unit Tests:
      // - Testing markdown parsing/generation   → noIndent: true (cleaner)
      // - Testing indentation behavior         → both modes
      
      // Integration Tests:
      // - CLI integration tests                → match actual CLI behavior
      // - E2E tests                            → match expected output format
      
      expect(true).toBe(true); // Documentation test
    });

    it('should provide configuration examples', () => {
      // CONFIGURATION EXAMPLES:
      
      // For CLI service when processing to markdown:
      const markdownConfig = {
        enableFieldTracking: false,
        debug: false
        // noIndent: undefined → defaults to false
      };
      
      // For CLI service when processing to HTML/PDF:
      const htmlConfig = {
        enableFieldTracking: true,
        debug: false,
        noIndent: true
      };
      
      // For unit tests:
      const testConfig = {
        enableFieldTracking: false,
        debug: false,
        noIndent: true
      };
      
      expect(markdownConfig).toBeDefined();
      expect(htmlConfig.noIndent).toBe(true);
      expect(testConfig.noIndent).toBe(true);
    });
  });
});