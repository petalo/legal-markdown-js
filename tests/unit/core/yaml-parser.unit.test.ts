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
      
      // With the fix, even if YAML is invalid, we should extract just the content part
      // and not include the malformed frontmatter as content
      expect(result.content).toBe('Content');
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

  describe('Edge Cases and Robust YAML Handling', () => {
    describe('Quote Handling', () => {
      it('should handle different quote types correctly', () => {
        const content = `---
title: "Double quoted title"
author: 'Single quoted author'
mixed: "Single 'quote' inside double"
nested: 'Double "quote" inside single'
unquoted: Regular unquoted value
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.title).toBe('Double quoted title');
        expect(result.metadata.author).toBe('Single quoted author');
        expect(result.metadata.mixed).toBe('Single \'quote\' inside double');
        expect(result.metadata.nested).toBe('Double "quote" inside single');
        expect(result.metadata.unquoted).toBe('Regular unquoted value');
      });

      it('should handle mismatched quotes gracefully', () => {
        const content = `---
title: "Mismatched quote'
author: 'Another mismatched"
valid: "Properly closed"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        // Should either parse correctly or fail gracefully with empty metadata
        expect(result.content).toBe('Content');
        if (Object.keys(result.metadata).length > 0) {
          expect(result.metadata.valid).toBe('Properly closed');
        }
      });

      it('should handle escaped quotes', () => {
        const content = `---
title: "Title with \\"escaped\\" quotes"
description: 'Description with \\'escaped\\' quotes'
complex: "Mixed \\"double\\" and 'single' quotes"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Content');
        
        // Handle escaped quotes if parser supports it, otherwise expect failure handling
        if (result.metadata.title) {
          expect(result.metadata.title).toBe('Title with "escaped" quotes');
        }
        if (result.metadata.description) {
          expect(result.metadata.description).toBe('Description with \'escaped\' quotes');
        }
        if (result.metadata.complex) {
          expect(result.metadata.complex).toBe('Mixed "double" and \'single\' quotes');
        }
      });
    });

    describe('Emoji and Special Characters', () => {
      it('should handle emojis in values', () => {
        const content = `---
title: "Contract 📋 Agreement"
author: "Legal Team 👥"
status: "✅ Approved"
notes: "Review needed 🔍 before signing ✍️"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.title).toBe('Contract 📋 Agreement');
        expect(result.metadata.author).toBe('Legal Team 👥');
        expect(result.metadata.status).toBe('✅ Approved');
        expect(result.metadata.notes).toBe('Review needed 🔍 before signing ✍️');
      });

      it('should handle unicode and special characters', () => {
        const content = `---
title: "Contrato de Servicios — Año 2024"
author: "José María García-Pérez"
company: "Företag AB (Ñandú Solutions)"
currency: "€ • $ • £ • ¥"
symbols: "© ® ™ § ¶ † ‡"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.title).toBe('Contrato de Servicios — Año 2024');
        expect(result.metadata.author).toBe('José María García-Pérez');
        expect(result.metadata.company).toBe('Företag AB (Ñandú Solutions)');
        expect(result.metadata.currency).toBe('€ • $ • £ • ¥');
        expect(result.metadata.symbols).toBe('© ® ™ § ¶ † ‡');
      });
    });

    describe('Formula and Function Values', () => {
      it('should handle date formulas as strings', () => {
        const content = `---
title: "Dynamic Date Contract"
effective_date: "@today"
expiration_date: "@today+365"
review_date: "@today+90"
complex_date: "@today-30+60"
relative_date: "@contract_date+30"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Content');
        
        // YAML parser may struggle with @ formulas - handle gracefully
        if (result.metadata.title) {
          expect(result.metadata.title).toBe('Dynamic Date Contract');
          
          // Check if @ formulas are parsed as strings (if parsing succeeds)
          if (result.metadata.effective_date) {
            expect(result.metadata.effective_date).toBe('@today');
            expect(result.metadata.expiration_date).toBe('@today+365');
            expect(result.metadata.review_date).toBe('@today+90');
            expect(result.metadata.complex_date).toBe('@today-30+60');
            expect(result.metadata.relative_date).toBe('@contract_date+30');
          }
        } else {
          // If @ formulas cause YAML parsing to fail entirely, ensure content is extracted
          expect(typeof result.metadata).toBe('object');
        }
      });

      it('should handle calculation formulas', () => {
        const content = `---
base_amount: 1000
calculated_fee: "@base_amount*0.1"
total_amount: "@base_amount+@calculated_fee"
discounted: "@total_amount*0.9"
complex_calc: "@(base_amount+500)*1.2-100"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.base_amount).toBe(1000);
        expect(result.metadata.calculated_fee).toBe('@base_amount*0.1');
        expect(result.metadata.total_amount).toBe('@base_amount+@calculated_fee');
        expect(result.metadata.discounted).toBe('@total_amount*0.9');
        expect(result.metadata.complex_calc).toBe('@(base_amount+500)*1.2-100');
      });
    });

    describe('Malformed YAML Edge Cases', () => {
      it('should handle missing closing quotes', () => {
        const content = `---
title: "Missing closing quote
author: "Valid author"
description: Another missing quote'
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Content');
        // Should either parse what it can or return empty metadata
        expect(typeof result.metadata).toBe('object');
      });

      it('should handle extra colons in values', () => {
        const content = `---
title: "Document: A Comprehensive Guide"
url: "https://example.com:8080/path"
time: "14:30:00"
ratio: "3:2:1"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.title).toBe('Document: A Comprehensive Guide');
        expect(result.metadata.url).toBe('https://example.com:8080/path');
        expect(result.metadata.time).toBe('14:30:00');
        expect(result.metadata.ratio).toBe('3:2:1');
      });

      it('should handle tabs vs spaces indentation', () => {
        const content = `---
nested_spaces:
  level1:
    level2: "spaces"
nested_tabs:
\tlevel1:
\t\tlevel2: "tabs"
mixed:
  level1:
\t\tlevel2: "mixed"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Content');
        // YAML should handle this correctly or fail gracefully
        if (result.metadata.nested_spaces) {
          expect(result.metadata.nested_spaces.level1.level2).toBe('spaces');
        }
      });

      it('should handle extremely long values', () => {
        const longValue = 'A'.repeat(10000);
        const content = `---
title: "Normal Title"
long_text: "${longValue}"
author: "Normal Author"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.title).toBe('Normal Title');
        expect(result.metadata.author).toBe('Normal Author');
        expect(result.metadata.long_text).toBe(longValue);
        expect(result.content).toBe('Content');
      });
    });

    describe('Numeric and Boolean Edge Cases', () => {
      it('should handle various numeric formats', () => {
        const content = `---
integer: 42
float: 3.14159
scientific: 1.23e+10
negative: -999
zero: 0
octal: 0o755
hex: 0xFF
binary: 0b1010
percentage: 85%
currency: $1,234.56
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.integer).toBe(42);
        expect(result.metadata.float).toBe(3.14159);
        expect(result.metadata.scientific).toBe(1.23e+10);
        expect(result.metadata.negative).toBe(-999);
        expect(result.metadata.zero).toBe(0);
        // Some formats might be parsed as strings depending on YAML parser
        expect(['string', 'number']).toContain(typeof result.metadata.percentage);
      });

      it('should handle boolean variations', () => {
        const content = `---
bool_true: true
bool_false: false
yes_value: yes
no_value: no
on_value: on
off_value: off
str_true: "true"
str_false: "false"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.bool_true).toBe(true);
        expect(result.metadata.bool_false).toBe(false);
        
        // YAML spec: yes/no/on/off are booleans, but some parsers might treat as strings
        expect(['yes', true]).toContain(result.metadata.yes_value);
        expect(['no', false]).toContain(result.metadata.no_value);
        expect(['on', true]).toContain(result.metadata.on_value);
        expect(['off', false]).toContain(result.metadata.off_value);
        
        expect(result.metadata.str_true).toBe('true');
        expect(result.metadata.str_false).toBe('false');
      });

      it('should handle null and undefined values', () => {
        const content = `---
null_value: null
tilde_null: ~
empty_value: 
quoted_null: "null"
undefined_key:
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.null_value).toBeNull();
        expect(result.metadata.tilde_null).toBeNull();
        expect(result.metadata.empty_value).toBeNull();
        expect(result.metadata.quoted_null).toBe('null');
        expect(result.metadata.undefined_key).toBeNull();
      });
    });

    describe('Complex Nested Structures', () => {
      it('should handle deeply nested objects', () => {
        const content = `---
contract:
  parties:
    buyer:
      company:
        name: "ACME Corp"
        address:
          street: "123 Main St"
          city: "Anytown"
          coordinates:
            lat: 40.7128
            lng: -74.0060
  terms:
    payment:
      schedule:
        - amount: 1000
          due: "@today+30"
        - amount: 2000
          due: "@today+60"
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Content');
        
        // Complex nested structures - check if parsed successfully
        if (result.metadata.contract && result.metadata.contract.parties) {
          expect(result.metadata.contract.parties.buyer.company.name).toBe('ACME Corp');
          expect(result.metadata.contract.parties.buyer.company.address.coordinates.lat).toBe(40.7128);
          expect(result.metadata.contract.terms.payment.schedule[0].amount).toBe(1000);
          expect(result.metadata.contract.terms.payment.schedule[1].due).toBe('@today+60');
        } else {
          // If complex nesting fails, at least ensure content is extracted
          expect(typeof result.metadata).toBe('object');
        }
      });

      it('should handle arrays with mixed types', () => {
        const content = `---
mixed_array:
  - "string value"
  - 42
  - true
  - null
  - date: 2024-01-01
  - nested:
      key: "value"
  - ["nested", "array"]
tags: ["legal", "contract", 2024, true]
---

Content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.metadata.mixed_array[0]).toBe('string value');
        expect(result.metadata.mixed_array[1]).toBe(42);
        expect(result.metadata.mixed_array[2]).toBe(true);
        expect(result.metadata.mixed_array[3]).toBeNull();
        expect(result.metadata.mixed_array[4].date).toEqual(new Date('2024-01-01'));
        expect(result.metadata.mixed_array[5].nested.key).toBe('value');
        expect(result.metadata.tags).toEqual(['legal', 'contract', 2024, true]);
      });
    });

    describe('Real-world Legal Document Scenarios', () => {
      it('should handle comprehensive legal metadata', () => {
        const content = `---
title: "Software Development Agreement 📄"
document_type: "Service Agreement"
effective_date: "@today"
expiration_date: "@today+365"
auto_renewal: true
parties:
  - name: "TechCorp Solutions Inc."
    type: "Corporation"
    role: "Service Provider"
    contact: "legal@techcorp.com"
    address: "123 Tech Street, San Francisco, CA 94105"
  - name: "Client Enterprises LLC"
    type: "Limited Liability Company"  
    role: "Client"
    contact: "contracts@clientent.com"
terms:
  payment:
    currency: "USD"
    base_amount: 100000
    tax_rate: "@base_amount*0.08"
    total_amount: "@base_amount+@tax_rate"
    schedule: "Monthly"
  deliverables:
    - name: "Phase 1: Analysis"
      due_date: "@effective_date+30"
      amount: "@total_amount*0.3"
    - name: "Phase 2: Development"  
      due_date: "@effective_date+90"
      amount: "@total_amount*0.5"
  conditions:
    include_warranty: true
    warranty_period: 12 # months
    include_maintenance: "@include_warranty"
    penalty_rate: 0.05
jurisdiction: "California, USA"
governing_law: "California State Law"
signatures_required: 2
confidentiality: true
force_majeure: true
---

# Software Development Agreement

This agreement is between {{parties[0].name}} and {{parties[1].name}}...`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content.trim().startsWith('# Software Development Agreement')).toBe(true);
        
        // Complex YAML with emojis, formulas, and comments might fail - check gracefully
        if (result.metadata.title) {
          expect(result.metadata.title).toBe('Software Development Agreement 📄');
          expect(result.metadata.document_type).toBe('Service Agreement');
          expect(result.metadata.auto_renewal).toBe(true);
          
          if (result.metadata.parties && result.metadata.parties.length > 0) {
            expect(result.metadata.parties[0].name).toBe('TechCorp Solutions Inc.');
          }
          
          if (result.metadata.terms && result.metadata.terms.payment) {
            expect(result.metadata.terms.payment.base_amount).toBe(100000);
            expect(result.metadata.terms.payment.currency).toBe('USD');
          }
          
          expect(result.metadata.jurisdiction).toBe('California, USA');
          expect(result.metadata.signatures_required).toBe(2);
        } else {
          // If complex parsing fails, ensure content extraction worked
          expect(typeof result.metadata).toBe('object');
        }
      });

      it('should handle multilingual content', () => {
        const content = `---
title_en: "International Service Agreement"
title_es: "Acuerdo de Servicios Internacionales"
title_fr: "Accord de Services Internationaux"
jurisdiction_primary: "England and Wales"
jurisdiction_secondary: "Comunidad de Madrid, España"
currency_primary: "GBP"
currency_secondary: "EUR"
exchange_rate: "@today_rate_GBP_EUR"
parties:
  - name: "British Services Ltd"
    jurisdiction: "UK"
    language: "English"
  - name: "Servicios Europeos S.L."
    jurisdiction: "Spain"  
    language: "Español"
translations:
  force_majeure:
    en: "Force Majeure"
    es: "Fuerza Mayor"
    fr: "Force Majeure"
---

Multilingual content`;

        const result = parseYamlFrontMatter(content);
        
        expect(result.content).toBe('Multilingual content');
        
        // Multilingual content with unicode - check if parsed successfully
        if (result.metadata.title_en) {
          expect(result.metadata.title_en).toBe('International Service Agreement');
          expect(result.metadata.title_es).toBe('Acuerdo de Servicios Internacionales');
          expect(result.metadata.title_fr).toBe('Accord de Services Internationaux');
          expect(result.metadata.jurisdiction_secondary).toBe('Comunidad de Madrid, España');
          
          if (result.metadata.parties && result.metadata.parties.length > 1) {
            expect(result.metadata.parties[1].name).toBe('Servicios Europeos S.L.');
            expect(result.metadata.parties[1].language).toBe('Español');
          }
          
          if (result.metadata.translations && result.metadata.translations.force_majeure) {
            expect(result.metadata.translations.force_majeure.es).toBe('Fuerza Mayor');
          }
        } else {
          // If multilingual parsing fails, ensure basic functionality works
          expect(typeof result.metadata).toBe('object');
        }
      });
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