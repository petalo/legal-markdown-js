/**
 * @fileoverview Integration test for advanced features of the legal-markdown system
 *
 * Tests the full document processing pipeline combining YAML front matter,
 * custom templates, variable substitution, and conditional clauses.
 */

import { processLegalMarkdown } from '../../../src/index';
import fs from 'node:fs';
import path from 'node:path';

describe('Advanced Features', () => {
  const metadataOutputPath = path.join(process.cwd(), 'tests/output/advanced-metadata.json');

  afterAll(() => {
    fs.rmSync(metadataOutputPath, { force: true });
  });

  describe('Error handling and validation', () => {
    /**
     * Integration test combining all major features: YAML front matter,
     * custom templates, variable substitution, and conditional clauses
     */
    it('should handle processing with all features enabled', async () => {
      const content = `---
title: Complete Feature Test
client_name: "Advanced Corp"
include_advanced: true
meta-json-output: "tests/output/advanced-metadata.json"
level-one: "Article %n."
level-two: "Section %n.%s"
level-three: "(%n)"
---

l. Introduction
This document is for |client_name|.

[Advanced features are enabled]{include_advanced}.

ll. Background
lll. Historical Context

l. Terms and Conditions
ll. Payment Terms
[Net 30 payment terms apply]{include_advanced}.`;

      const result = await processLegalMarkdown(content, {
        exportMetadata: true,
        exportFormat: 'json',
      });

      expect(result.content).toContain('Article 1. Introduction');
      expect(result.content).toContain('This document is for Advanced Corp.');
      expect(result.content).toContain('Advanced features are enabled.');
      expect(result.content).toContain('Section 1.1 Background');
      expect(result.content).toContain('    (1) Historical Context');
      expect(result.content).toContain('Article 2. Terms and Conditions');
      expect(result.content).toContain('Section 1.2 Payment Terms');
      expect(result.content).toContain('Net 30 payment terms apply.');

      expect(result.metadata?.title).toBe('Complete Feature Test');
      expect(result.metadata?.client_name).toBe('Advanced Corp');
      expect(result.exportedFiles).toBeDefined();
    });
  });
});
