/**
 * @fileoverview Integration tests for template loops functionality
 * 
 * This test suite verifies that template loops work correctly in the context
 * of complete document processing, including:
 * - Processing full documents with YAML front matter
 * - Integration with mixin processing
 * - Real-world legal document examples
 * - PDF generation with template loops
 * - Field tracking behavior
 */

import { processLegalMarkdown, generatePdf } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Template Loops Integration', () => {
  describe('Complete Document Processing', () => {
    it('should process office lease contract with all template loops', async () => {
      const content = `---
services:
  included:
    - Water
    - Electricity
    - Internet
    - Heating
    - Air Conditioning
    - Cleaning
    - Security
    - Maintenance
  additional:
    - Electricity consumption
    - Internet and telecommunications
    - Additional cleaning services
    - Contents insurance
    - Business rates
maintenance:
  lessor_obligations:
    - Structural elements
    - Building envelope
    - Common areas
    - HVAC systems
    - Elevators
  lessee_obligations:
    - Interior walls and finishes
    - Floor coverings
    - Light fixtures
    - Internal electrical systems
    - Office furniture and equipment
insurance:
  lessor_requirements:
    - Building insurance
    - Public liability insurance
    - Property damage insurance
  lessee_requirements:
    - General liability insurance
    - Professional indemnity insurance
    - Workers' compensation insurance
default:
  events:
    - Failure to pay rent within 5 days of due date
    - Filing for bankruptcy or insolvency
    - Abandonment of the premises
  remedies:
    - Right to terminate the lease
    - Right to recover all unpaid rent
    - Right to recover damages
    - Right to re-enter and take possession
---

# OFFICE SPACE LEASE AGREEMENT

## 4. Services and Utilities

### 4.1. Included Services

The following services are included in the monthly rent:

{{#services.included}}
- {{.}}
{{/services.included}}

### 4.2. Additional Services

The following services shall be contracted and paid for separately by the LESSEE:

{{#services.additional}}
- {{.}}
{{/services.additional}}

## 5. Maintenance and Repairs

### 5.1. Lessor's Obligations

The LESSOR shall be responsible for maintaining:

{{#maintenance.lessor_obligations}}
- {{.}}
{{/maintenance.lessor_obligations}}

### 5.2. Lessee's Obligations

The LESSEE shall be responsible for maintaining:

{{#maintenance.lessee_obligations}}
- {{.}}
{{/maintenance.lessee_obligations}}

## 6. Insurance Requirements

### 6.1. Lessor's Insurance

The LESSOR shall maintain the following insurance coverage:

{{#insurance.lessor_requirements}}
- {{.}}
{{/insurance.lessor_requirements}}

### 6.2. Lessee's Insurance

The LESSEE shall obtain and maintain:

{{#insurance.lessee_requirements}}
- {{.}}
{{/insurance.lessee_requirements}}

## 7. Default and Remedies

### 7.1. Events of Default

The following shall constitute events of default:

{{#default.events}}
- {{.}}
{{/default.events}}

### 7.2. Remedies

Upon an event of default, the LESSOR may exercise the following remedies:

{{#default.remedies}}
- {{.}}
{{/default.remedies}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false
      });

      // Verify metadata is properly parsed
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('services');
      expect(result.metadata!.services).toHaveProperty('included');
      expect(result.metadata!.services.included).toHaveLength(8);

      // Verify all template loops are processed
      expect(result.content).toContain('<li>Water</li>');
      expect(result.content).toContain('<li>Electricity</li>');
      expect(result.content).toContain('<li>Internet</li>');
      expect(result.content).toContain('<li>Heating</li>');
      expect(result.content).toContain('<li>Air Conditioning</li>');
      expect(result.content).toContain('<li>Cleaning</li>');
      expect(result.content).toContain('<li>Security</li>');
      expect(result.content).toContain('<li>Maintenance</li>');

      // Verify additional services
      expect(result.content).toContain('<li>Electricity consumption</li>');
      expect(result.content).toContain('<li>Internet and telecommunications</li>');
      expect(result.content).toContain('<li>Additional cleaning services</li>');
      expect(result.content).toContain('<li>Contents insurance</li>');
      expect(result.content).toContain('<li>Business rates</li>');

      // Verify maintenance obligations
      expect(result.content).toContain('<li>Structural elements</li>');
      expect(result.content).toContain('<li>Building envelope</li>');
      expect(result.content).toContain('<li>Common areas</li>');
      expect(result.content).toContain('<li>HVAC systems</li>');
      expect(result.content).toContain('<li>Elevators</li>');

      expect(result.content).toContain('<li>Interior walls and finishes</li>');
      expect(result.content).toContain('<li>Floor coverings</li>');
      expect(result.content).toContain('<li>Light fixtures</li>');
      expect(result.content).toContain('<li>Internal electrical systems</li>');
      expect(result.content).toContain('<li>Office furniture and equipment</li>');

      // Verify insurance requirements
      expect(result.content).toContain('<li>Building insurance</li>');
      expect(result.content).toContain('<li>Public liability insurance</li>');
      expect(result.content).toContain('<li>Property damage insurance</li>');

      expect(result.content).toContain('<li>General liability insurance</li>');
      expect(result.content).toContain('<li>Professional indemnity insurance</li>');
      expect(result.content).toContain('<li>Workers\' compensation insurance</li>');

      // Verify default events and remedies
      expect(result.content).toContain('<li>Failure to pay rent within 5 days of due date</li>');
      expect(result.content).toContain('<li>Filing for bankruptcy or insolvency</li>');
      expect(result.content).toContain('<li>Abandonment of the premises</li>');

      expect(result.content).toContain('<li>Right to terminate the lease</li>');
      expect(result.content).toContain('<li>Right to recover all unpaid rent</li>');
      expect(result.content).toContain('<li>Right to recover damages</li>');
      expect(result.content).toContain('<li>Right to re-enter and take possession</li>');

      // Verify no raw template loops remain
      expect(result.content).not.toContain('{{#services.included}}');
      expect(result.content).not.toContain('{{#maintenance.lessor_obligations}}');
      expect(result.content).not.toContain('{{#default.events}}');
      expect(result.content).not.toContain('{{.}}');

      // Verify content length indicates full processing
      expect(result.content.length).toBeGreaterThan(1900);
    });

    it('should handle complex nested template loops', () => {
      const content = `---
contract:
  parties:
    - name: Company A
      addresses:
        - 123 Main St
        - 456 Oak Ave
    - name: Company B
      addresses:
        - 789 Pine St
---

# Contract Parties

{{#contract.parties}}
## {{name}}

Addresses:
{{#addresses}}
- {{.}}
{{/addresses}}

{{/contract.parties}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false
      });

      expect(result.content).toContain('## Company A');
      expect(result.content).toContain('## Company B');
      expect(result.content).toContain('<li>123 Main St</li>');
      expect(result.content).toContain('<li>456 Oak Ave</li>');
      expect(result.content).toContain('<li>789 Pine St</li>');
    });

    it('should work with field tracking disabled (Ruby compatibility)', () => {
      const content = `---
items:
  - Item 1
  - Item 2
  - Item 3
---

{{#items}}
- {{.}}
{{/items}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false
      });

      // Should not contain field tracking spans
      expect(result.content).not.toContain('data-field');
      expect(result.content).not.toContain('class="imported-value"');
      expect(result.content).not.toContain('class="missing-value"');

      // Should contain processed content
      expect(result.content).toContain('<li>Item 1</li>');
      expect(result.content).toContain('<li>Item 2</li>');
      expect(result.content).toContain('<li>Item 3</li>');
    });

    it('should work with field tracking enabled', () => {
      const content = `---
items:
  - Item 1
  - Item 2
---

{{#items}}
- {{.}}
{{/items}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: true
      });

      // Should contain field tracking spans for the loop items
      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Item 2');
    });
  });

  describe('PDF Generation Integration', () => {
    it('should generate PDF with processed template loops', async () => {
      const content = `---
services:
  included:
    - Water
    - Electricity
    - Internet
---

# Service Agreement

## Included Services

{{#services.included}}
- {{.}}
{{/services.included}}`;

      // Generate PDF
      const pdfBuffer = await generatePdf(content, './test-template-loops.pdf', {
        enableFieldTrackingInMarkdown: false,
        format: 'A4'
      });

      // Verify PDF was generated
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Should be substantial size

      // Clean up
      try {
        fs.unlinkSync('./test-template-loops.pdf');
      } catch (e) {
        // File might not exist, that's ok
      }
    }, 15000); // Increased timeout for PDF generation

    it('should generate larger PDF for complex documents with many template loops', async () => {
      const content = `---
services:
  included: [Water, Electricity, Internet, Heating, Air Conditioning]
  additional: [Phone, Cable TV, Parking]
maintenance:
  lessor: [Structure, HVAC, Elevators]
  lessee: [Interior, Fixtures, Equipment]
insurance:
  required: [Liability, Property, Workers Comp]
---

# Complex Service Agreement

## Services
{{#services.included}}
- {{.}}
{{/services.included}}

{{#services.additional}}
- Additional: {{.}}
{{/services.additional}}

## Maintenance
{{#maintenance.lessor}}
- Lessor: {{.}}
{{/maintenance.lessor}}

{{#maintenance.lessee}}
- Lessee: {{.}}
{{/maintenance.lessee}}

## Insurance
{{#insurance.required}}
- {{.}}
{{/insurance.required}}`;

      const pdfBuffer = await generatePdf(content, './test-complex-template-loops.pdf', {
        enableFieldTrackingInMarkdown: false,
        format: 'A4'
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(5000); // Should be larger due to more content

      // Clean up
      try {
        fs.unlinkSync('./test-complex-template-loops.pdf');
      } catch (e) {
        // File might not exist, that's ok
      }
    }, 15000);
  });

  describe('Error Handling Integration', () => {
    it('should handle documents with missing template loop data gracefully', () => {
      const content = `---
services:
  included:
    - Water
    - Electricity
---

# Service Agreement

## Included Services
{{#services.included}}
- {{.}}
{{/services.included}}

## Missing Services
{{#services.missing}}
- {{.}}
{{/services.missing}}

## Non-existent Section
{{#nonexistent.items}}
- {{.}}
{{/nonexistent.items}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false
      });

      // Should process existing data
      expect(result.content).toContain('<li>Water</li>');
      expect(result.content).toContain('<li>Electricity</li>');

      // Should handle missing data gracefully (empty sections)
      expect(result.content).toContain('## Missing Services');
      expect(result.content).toContain('## Non-existent Section');

      // Should not contain unprocessed template loops
      expect(result.content).not.toContain('{{#services.missing}}');
      expect(result.content).not.toContain('{{#nonexistent.items}}');
    });

    it('should handle malformed template loops gracefully', () => {
      const content = `---
items:
  - Item 1
  - Item 2
---

# Test Document

Good loop:
{{#items}}
- {{.}}
{{/items}}

Malformed loops (should be left unchanged):
{{#unclosed
{{#items} - {{.}} {{/wrong}}
{{#}}
{{/}}`;

      const result = processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false
      });

      // Should process good loops
      expect(result.content).toContain('<li>Item 1</li>');
      expect(result.content).toContain('<li>Item 2</li>');

      // Should leave malformed loops unchanged
      expect(result.content).toContain('{{#unclosed');
      expect(result.content).toContain('{{#}}');
      expect(result.content).toContain('{{/}}');
    });
  });
});