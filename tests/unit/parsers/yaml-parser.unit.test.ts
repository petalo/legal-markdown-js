/**
 * @fileoverview Tests for YAML front matter parsing and serialization
 * 
 * This test suite covers the YAML front matter system:
 * - Basic YAML parsing with --- delimiters
 * - Support for complex nested structures and arrays
 * - Legal document specific fields (parties, jurisdiction, dates)
 * - Custom variable definitions and metadata configuration
 * - YAML validation, error handling, and serialization
 * - Metadata output configuration extraction
 */

import { parseYamlFrontMatter, serializeToYaml, extractMetadataOutputConfig } from '../../../src/core/parsers/yaml-parser';

describe('YAML Front Matter', () => {
  describe('Parse YAML front matter starting with ---', () => {
    it('should parse valid YAML front matter', () => {
      const content = `---
title: Test Document
author: John Doe
---

Document content here`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Test Document');
      expect(result.metadata.author).toBe('John Doe');
      expect(result.content).toBe('Document content here');
    });

    it('should handle YAML front matter with complex indentation', () => {
      const content = `---
title: Complex Document
nested:
  level1:
    level2: value
  array:
    - item1
    - item2
---

Content after YAML`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Complex Document');
      expect(result.metadata.nested.level1.level2).toBe('value');
      expect(result.metadata.nested.array).toEqual(['item1', 'item2']);
    });
  });

  describe('Parse YAML front matter ending with ---', () => {
    it('should correctly identify end delimiter', () => {
      const content = `---
title: Test
description: This is a test document
date: 2024-01-01
---

# Main Content

This is the main content of the document.`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Test');
      expect(result.metadata.description).toBe('This is a test document');
      expect(result.metadata.date).toEqual(new Date('2024-01-01'));
      expect(result.content).toBe('# Main Content\n\nThis is the main content of the document.');
    });

    it('should handle multiple --- in content', () => {
      const content = `---
title: Test
---

# Content

This document has --- in the middle of content.

More content here.`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Test');
      expect(result.content).toContain('This document has --- in the middle of content.');
    });
  });

  describe('Support basic fields (title, author, date)', () => {
    it('should parse basic metadata fields', () => {
      const content = `---
title: Legal Document
author: Jane Smith
date: 2024-06-24
---

Document content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Legal Document');
      expect(result.metadata.author).toBe('Jane Smith');
      expect(result.metadata.date).toEqual(new Date('2024-06-24'));
    });

    it('should handle missing basic fields gracefully', () => {
      const content = `---
title: Partial Document
---

Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.title).toBe('Partial Document');
      expect(result.metadata.author).toBeUndefined();
      expect(result.metadata.date).toBeUndefined();
    });
  });

  describe('Support parties array with name and type', () => {
    it('should parse parties array correctly', () => {
      const content = `---
title: Contract
parties:
  - name: "Company A"
    type: "Corporation"
    role: "Buyer"
  - name: "Company B"
    type: "LLC"
    role: "Seller"
---

Contract content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.parties).toHaveLength(2);
      expect(result.metadata.parties[0].name).toBe('Company A');
      expect(result.metadata.parties[0].type).toBe('Corporation');
      expect(result.metadata.parties[0].role).toBe('Buyer');
      expect(result.metadata.parties[1].name).toBe('Company B');
      expect(result.metadata.parties[1].type).toBe('LLC');
    });

    /**
     * Tests complex nested party structures with addresses and contacts
     * Critical for comprehensive contract metadata representation
     */
    it('should handle complex party structures', () => {
      const content = `---
parties:
  - name: "Individual Client"
    type: "Person"
    address:
      street: "123 Main St"
      city: "Anytown"
      state: "CA"
  - name: "Service Provider"
    type: "Corporation"
    contacts:
      - email: "info@provider.com"
      - phone: "555-1234"
---

Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.parties[0].address.street).toBe('123 Main St');
      expect(result.metadata.parties[1].contacts[0].email).toBe('info@provider.com');
    });
  });

  describe('Support jurisdiction and governing-law fields', () => {
    it('should parse jurisdiction and governing law', () => {
      const content = `---
title: Legal Agreement
jurisdiction: "New York"
governing-law: "New York State Law"
venue: "Manhattan County"
---

Legal content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.jurisdiction).toBe('New York');
      expect(result.metadata['governing-law']).toBe('New York State Law');
      expect(result.metadata.venue).toBe('Manhattan County');
    });

    it('should handle international jurisdiction', () => {
      const content = `---
jurisdiction: "England and Wales"
governing-law: "English Law"
dispute-resolution: "London Court of International Arbitration"
---

International contract`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.jurisdiction).toBe('England and Wales');
      expect(result.metadata['governing-law']).toBe('English Law');
      expect(result.metadata['dispute-resolution']).toBe('London Court of International Arbitration');
    });
  });

  describe('Support effective-date field', () => {
    it('should parse effective date', () => {
      const content = `---
title: Service Agreement
effective-date: "2024-01-01"
expiration-date: "2025-01-01"
---

Agreement content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata['effective-date']).toBe('2024-01-01');
      expect(result.metadata['expiration-date']).toBe('2025-01-01');
    });

    it('should handle date formats', () => {
      const content = `---
effective-date: 2024-06-24
created-date: "June 24, 2024"
---

Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata['effective-date']).toEqual(new Date('2024-06-24'));
      expect(result.metadata['created-date']).toBe('June 24, 2024');
    });
  });

  describe('Support custom variable definitions', () => {
    it('should parse custom variables', () => {
      const content = `---
title: Custom Contract
company_name: "ACME Corp"
contract_value: 50000
include_warranty: true
custom_terms:
  payment_days: 30
  late_fee: 0.05
---

Contract with custom variables`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.company_name).toBe('ACME Corp');
      expect(result.metadata.contract_value).toBe(50000);
      expect(result.metadata.include_warranty).toBe(true);
      expect(result.metadata.custom_terms.payment_days).toBe(30);
      expect(result.metadata.custom_terms.late_fee).toBe(0.05);
    });

    it('should handle complex custom variables', () => {
      const content = `---
variables:
  client:
    name: "Tech Solutions Inc"
    industry: "Technology"
    size: "Large Enterprise"
  project:
    name: "Digital Transformation"
    duration: "12 months"
    budget: 1000000
  conditions:
    include_maintenance: true
    include_training: false
---

Project agreement`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.metadata.variables.client.name).toBe('Tech Solutions Inc');
      expect(result.metadata.variables.project.budget).toBe(1000000);
      expect(result.metadata.variables.conditions.include_maintenance).toBe(true);
    });
  });

  describe('Validate YAML syntax and structure', () => {
    it('should handle invalid YAML gracefully', () => {
      const content = `---
title: Invalid YAML
invalid: [unclosed array
---

Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.content).toBe(content);
      expect(result.metadata).toEqual({});
    });

    it('should handle empty YAML', () => {
      const content = `---
---

Content only`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.content).toBe('Content only');
      expect(result.metadata).toEqual({});
    });

    it('should handle malformed YAML delimiters', () => {
      const content = `---
title: Test
--

Content`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.content).toBe(content);
      expect(result.metadata).toEqual({});
    });

    it('should handle content without YAML', () => {
      const content = `# Regular Markdown

No YAML front matter here.`;

      const result = parseYamlFrontMatter(content);
      
      expect(result.content).toBe(content);
      expect(result.metadata).toEqual({});
    });
  });

  describe('YAML serialization', () => {
    it('should serialize metadata to YAML', () => {
      const metadata = {
        title: 'Test Document',
        author: 'John Doe',
        date: '2024-06-24'
      };

      const yaml = serializeToYaml(metadata);
      
      expect(yaml).toContain('title: Test Document');
      expect(yaml).toContain('author: John Doe');
      expect(yaml).toContain('date: \'2024-06-24\'');
    });

    it('should handle complex metadata serialization', () => {
      const metadata = {
        parties: [
          { name: 'Company A', type: 'Corporation' },
          { name: 'Company B', type: 'LLC' }
        ],
        terms: {
          duration: '12 months',
          value: 100000
        }
      };

      const yaml = serializeToYaml(metadata);
      
      expect(yaml).toContain('parties:');
      expect(yaml).toContain('- name: Company A');
      expect(yaml).toContain('terms:');
      expect(yaml).toContain('duration: 12 months');
    });
  });

  describe('Metadata output configuration', () => {
    it('should extract metadata output configuration', () => {
      const metadata = {
        'meta-yaml-output': 'output.yaml',
        'meta-json-output': 'output.json',
        'meta-output-path': '/path/to/output',
        'meta-include-original': true
      };

      const config = extractMetadataOutputConfig(metadata);
      
      expect(config.yamlOutput).toBe('output.yaml');
      expect(config.jsonOutput).toBe('output.json');
      expect(config.outputPath).toBe('/path/to/output');
      expect(config.includeOriginal).toBe(true);
    });

    it('should handle missing output configuration', () => {
      const metadata = {
        title: 'Test Document'
      };

      const config = extractMetadataOutputConfig(metadata);
      
      expect(config.yamlOutput).toBeUndefined();
      expect(config.jsonOutput).toBeUndefined();
      expect(config.outputPath).toBeUndefined();
      expect(config.includeOriginal).toBeUndefined();
    });
  });
});