/**
 * Integration tests for CLI --headers auto-population functionality
 *
 * Tests the complete CLI --headers workflow following the original Legal Markdown
 * specification for YAML front matter auto-population.
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { CliService } from '../../src/cli/service';

describe('CLI Headers Auto-Population Integration', () => {
  describe('--headers flag functionality', () => {
    it('should auto-populate YAML front matter with basic structure', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article 1."
level-2: "Section 1."
---

l. Introduction
ll. Terms and Conditions`;

      const result = await service.processContent(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section 1."');
      expect(result).toContain('level-3: "%n."'); // Inferred missing level
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: ""');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });

    it('should create YAML front matter when none exists', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `l. Introduction
ll. Terms and Conditions
lll. Payment Terms`;

      const result = await service.processContent(input);
      
      expect(result.startsWith('---\n')).toBe(true);
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article %n."');
      expect(result).toContain('level-2: "Section %n."');
      expect(result).toContain('level-3: "%n."');
      expect(result).toContain('# Properties');
      expect(result).toContain('---\n\nl. Introduction');
    });

    it('should preserve existing metadata and add Properties section', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
title: "Contract Document"
version: 2.1
level-1: "Article %n."
level-2: "Section %n."
custom-property: "custom value"
---

l. Main Content`;

      const result = await service.processContent(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article %n."');
      expect(result).toContain('level-2: "Section %n."');
      expect(result).toContain('level-3: "%n."'); // Auto-inferred
      expect(result).toContain('title: "Contract Document"');
      expect(result).toContain('version: 2.1');
      expect(result).toContain('custom-property: "custom value"');
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: ""');
    });

    it('should handle all 9 header levels', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article (1)"
level-5: "(%A)"
---

Content here`;

      const result = await service.processContent(input);
      
      // Should infer missing levels 2, 3, 4, 6, 7, 8, 9
      expect(result).toContain('level-1: "Article (1)"');
      expect(result).toContain('level-2: "Section %n."');
      expect(result).toContain('level-3: "%n."');
      expect(result).toContain('level-4: "(%n)"');
      expect(result).toContain('level-5: "(%A)"');
      expect(result).toContain('level-6: "(%a)"');
      expect(result).toContain('level-7: "(%R)"');
      expect(result).toContain('level-8: "(%r)"');
      expect(result).toContain('level-9: "%n."');
    });

    it('should match original Legal Markdown fixture behavior', async () => {
      // Based on 20.block_no_addons.headers fixture
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article 1."
level-2: "Section 1."
level-3: 1.
---

l. Introduction`;

      const result = await service.processContent(input);
      
      expect(result).toMatch(/# Structured Headers\s*\n/);
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section 1."');
      expect(result).toContain('level-3: "1"'); // Number becomes quoted string
      expect(result).toMatch(/# Properties\s*\n/);
      expect(result).toContain('no-indent: ""');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });

    it('should handle complex no-indent patterns like 30.block_all_leader_types', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article (1)"
level-2: "Section (a)"
level-3: "A."
level-4: "I."
level-5: "i."
level-6: "a."
level-7: "1."
level-8: "(A)"
level-9: "(I)"
no-indent: "l., ll., lll., llll., lllll., lllll., lllllll., llllllll., lllllllll."
---

l. Content`;

      const result = await service.processContent(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article (1)"');
      expect(result).toContain('level-9: "(I)"');
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: "l., ll., lll., llll., lllll., lllll., lllllll., llllllll., lllllllll."');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });
  });

  describe('CLI service integration', () => {
    it('should not process document content when in auto-populate mode', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article 1."
---

l. Introduction
Client: {{client_name}}
Today: @today`;

      const result = await service.processContent(input);
      
      // Content should remain unprocessed (no template/date processing)
      expect(result).toContain('Client: {{client_name}}');
      expect(result).toContain('Today: @today');
      expect(result).toContain('l. Introduction'); // Headers not processed
      
      // But YAML should be enhanced
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('# Properties');
    });

    it('should work with documents that have no YAML front matter', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `This is a legal document.

l. Terms and Conditions
ll. Payment Terms
lll. Liability

Content continues here.`;

      const result = await service.processContent(input);
      
      expect(result.startsWith('---\n')).toBe(true);
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article %n."');
      expect(result).toContain('# Properties');
      expect(result).toContain('---\n\nThis is a legal document.');
      expect(result).toContain('Content continues here.');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed YAML gracefully', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const input = `---
level-1: "Article 1.
level-2: Section 1. # Missing quotes
invalid: yaml: content
---

l. Content`;

      // Should not throw and should attempt to enhance
      const result = await service.processContent(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty input', async () => {
      const service = new CliService({
        autoPopulateHeaders: true,
        debug: false
      });

      const result = await service.processContent('');
      
      expect(result.startsWith('---\n')).toBe(true);
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article %n."');
      expect(result).toContain('# Properties');
    });
  });
});