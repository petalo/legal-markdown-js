/**
 * Unit tests for YAML front matter auto-population functionality
 *
 * Tests the auto-population of YAML front matter with inferred header patterns
 * and properties following the original Legal Markdown specification.
 *
 * @module
 */

import { describe, it, expect } from 'vitest';
import { 
  autoPopulateYamlFrontMatter, 
  generateNoIndentPattern, 
  normalizeYamlStructure 
} from '../../../src/core/yaml/yaml-auto-population';

describe('YAML Auto-Population', () => {
  describe('autoPopulateYamlFrontMatter', () => {
    it('should add Properties section to existing YAML', () => {
      const input = `---
level-1: "Article 1."
level-2: "Section 1."
---

l. Introduction
ll. Terms`;

      const result = autoPopulateYamlFrontMatter(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section 1."');
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: ""');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });

    it('should infer missing header levels', () => {
      const input = `---
level-1: "Article 1."
---

l. Introduction`;

      const result = autoPopulateYamlFrontMatter(input, {
        inferMissingLevels: true
      });
      
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section %n."');
      expect(result).toContain('level-3: "%n."');
      expect(result).toContain('level-9: "%n."');
    });

    it('should create YAML front matter when none exists', () => {
      const input = `l. Introduction
ll. Terms and Conditions`;

      const result = autoPopulateYamlFrontMatter(input);
      
      expect(result.startsWith('---\n')).toBe(true);
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article %n."');
      expect(result).toContain('# Properties');
      expect(result.endsWith('l. Introduction\nll. Terms and Conditions')).toBe(true);
    });

    it('should ensure level definitions are quoted', () => {
      const input = `---
level-1: Article 1.
level-2: "Section 1."
---

content`;

      const result = autoPopulateYamlFrontMatter(input, {
        ensureQuotedLevels: true
      });
      
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section 1."');
    });

    it('should preserve existing properties', () => {
      const input = `---
level-1: "Article 1."
no-indent: "l., ll."
custom-property: "custom value"
---

content`;

      const result = autoPopulateYamlFrontMatter(input);
      
      expect(result).toContain('no-indent: "l., ll."');
      expect(result).toContain('custom-property: "custom value"');
      expect(result).toContain('no-reset: ""'); // Should add missing properties
    });

    it('should skip Properties section when requested', () => {
      const input = `---
level-1: "Article 1."
---

content`;

      const result = autoPopulateYamlFrontMatter(input, {
        includeProperties: false
      });
      
      expect(result).toContain('# Structured Headers');
      expect(result).not.toContain('# Properties');
      expect(result).not.toContain('no-indent:');
    });
  });

  describe('generateNoIndentPattern', () => {
    it('should generate pattern for traditional syntax', () => {
      const content = `l. First Level
ll. Second Level
lll. Third Level`;

      const result = generateNoIndentPattern(content);
      
      expect(result).toBe('l., ll., lll.');
    });

    it('should generate pattern for alternative syntax', () => {
      const content = `l2. Second Level
l3. Third Level
l5. Fifth Level`;

      const result = generateNoIndentPattern(content);
      
      expect(result).toBe('l2., l3., l5.');
    });

    it('should generate mixed pattern', () => {
      const content = `l. First Level
ll. Second Level
l3. Third Level (alternative)
lll. Third Level (traditional)`;

      const result = generateNoIndentPattern(content);
      
      expect(result).toContain('l.');
      expect(result).toContain('ll.');
      expect(result).toContain('l3.');
      expect(result).toContain('lll.');
    });

    it('should return empty string for no header patterns', () => {
      const content = `Just regular content
No headers here`;

      const result = generateNoIndentPattern(content);
      
      expect(result).toBe('');
    });
  });

  describe('normalizeYamlStructure', () => {
    it('should organize metadata with proper sectioning', () => {
      const metadata = {
        'level-3': '3.',
        'level-1': 'Article 1.',
        'custom-prop': 'value',
        'no-indent': 'l., ll.',
        'level-2': 'Section 1.',
        'no-reset': ''
      };

      const result = normalizeYamlStructure(metadata);
      
      // Check structure ordering
      const keys = Object.keys(result);
      expect(keys[0]).toBe('# Structured Headers');
      expect(keys.indexOf('level-1')).toBeLessThan(keys.indexOf('level-2'));
      expect(keys.indexOf('level-2')).toBeLessThan(keys.indexOf('level-3'));
      expect(keys.indexOf('custom-prop')).toBeGreaterThan(keys.indexOf('level-3'));
      expect(keys.indexOf('# Properties')).toBeGreaterThan(keys.indexOf('custom-prop'));
    });

    it('should include only relevant levels', () => {
      const metadata = {
        'level-1': 'Article 1.',
        'level-5': '(%A)',
        'other-prop': 'value'
      };

      const result = normalizeYamlStructure(metadata);
      
      expect(result['level-1']).toBe('Article 1.');
      expect(result['level-5']).toBe('(%A)');
      expect(result['level-2']).toBeUndefined();
      expect(result['level-3']).toBeUndefined();
      expect(result['other-prop']).toBe('value');
    });

    it('should handle metadata without properties section', () => {
      const metadata = {
        'level-1': 'Article 1.',
        'custom-prop': 'value'
      };

      const result = normalizeYamlStructure(metadata);
      
      expect(result['# Structured Headers']).toBeNull();
      expect(result['level-1']).toBe('Article 1.');
      expect(result['custom-prop']).toBe('value');
      expect(result['# Properties']).toBeUndefined();
    });
  });

  describe('Real-world Examples', () => {
    it('should match original Legal Markdown fixture pattern', () => {
      // Based on 20.block_no_addons fixture
      const input = `---
level-1: "Article 1."
level-2: "Section 1."
level-3: 1.
---

l. Introduction
ll. Terms`;

      const result = autoPopulateYamlFrontMatter(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article 1."');
      expect(result).toContain('level-2: "Section 1."');
      expect(result).toContain('level-3: "1"'); // Should be quoted (original was parsed as number)
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: ""');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });

    it('should handle complex header structure', () => {
      // Based on 30.block_all_leader_types fixture pattern
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

l. First
ll. Second`;

      const result = autoPopulateYamlFrontMatter(input);
      
      expect(result).toContain('# Structured Headers');
      expect(result).toContain('level-1: "Article (1)"');
      expect(result).toContain('level-9: "(I)"');
      expect(result).toContain('# Properties');
      expect(result).toContain('no-indent: "l., ll., lll., llll., lllll., lllll., lllllll., llllllll., lllllllll."');
      expect(result).toContain('no-reset: ""');
      expect(result).toContain('level-style: ""');
    });
  });
});