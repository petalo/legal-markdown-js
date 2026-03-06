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
import { isPdfAvailable } from '../../src/extensions/generators';
import * as fs from 'fs';
import * as path from 'path';

// PDF generation timeout - higher in CI environments for slower systems
const PDF_TIMEOUT = process.env.CI ? 45000 : 30000;
const pdfAvailable = await isPdfAvailable();
const describePdf = pdfAvailable ? describe : describe.skip;

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

{{#each services.included}}
- {{this}}
{{/each}}

### 4.2. Additional Services

The following services shall be contracted and paid for separately by the LESSEE:

{{#each services.additional}}
- {{this}}
{{/each}}

## 5. Maintenance and Repairs

### 5.1. Lessor's Obligations

The LESSOR shall be responsible for maintaining:

{{#each maintenance.lessor_obligations}}
- {{this}}
{{/each}}

### 5.2. Lessee's Obligations

The LESSEE shall be responsible for maintaining:

{{#each maintenance.lessee_obligations}}
- {{this}}
{{/each}}

## 6. Insurance Requirements

### 6.1. Lessor's Insurance

The LESSOR shall maintain the following insurance coverage:

{{#each insurance.lessor_requirements}}
- {{this}}
{{/each}}

### 6.2. Lessee's Insurance

The LESSEE shall obtain and maintain:

{{#each insurance.lessee_requirements}}
- {{this}}
{{/each}}

## 7. Default and Remedies

### 7.1. Events of Default

The following shall constitute events of default:

{{#each default.events}}
- {{this}}
{{/each}}

### 7.2. Remedies

Upon an event of default, the LESSOR may exercise the following remedies:

{{#each default.remedies}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false,
      });

      // Verify metadata is properly parsed
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('services');
      expect(result.metadata!.services).toHaveProperty('included');
      expect(result.metadata!.services.included).toHaveLength(8);

      // Verify all template loops are processed
      expect(result.content).toContain('- Water');
      expect(result.content).toContain('- Electricity');
      expect(result.content).toContain('- Internet');
      expect(result.content).toContain('- Heating');
      expect(result.content).toContain('- Air Conditioning');
      expect(result.content).toContain('- Cleaning');
      expect(result.content).toContain('- Security');
      expect(result.content).toContain('- Maintenance');

      // Verify additional services
      expect(result.content).toContain('- Electricity consumption');
      expect(result.content).toContain('- Internet and telecommunications');
      expect(result.content).toContain('- Additional cleaning services');
      expect(result.content).toContain('- Contents insurance');
      expect(result.content).toContain('- Business rates');

      // Verify maintenance obligations
      expect(result.content).toContain('- Structural elements');
      expect(result.content).toContain('- Building envelope');
      expect(result.content).toContain('- Common areas');
      expect(result.content).toContain('- HVAC systems');
      expect(result.content).toContain('- Elevators');

      expect(result.content).toContain('- Interior walls and finishes');
      expect(result.content).toContain('- Floor coverings');
      expect(result.content).toContain('- Light fixtures');
      expect(result.content).toContain('- Internal electrical systems');
      expect(result.content).toContain('- Office furniture and equipment');

      // Verify insurance requirements
      expect(result.content).toContain('- Building insurance');
      expect(result.content).toContain('- Public liability insurance');
      expect(result.content).toContain('- Property damage insurance');

      expect(result.content).toContain('- General liability insurance');
      expect(result.content).toContain('- Professional indemnity insurance');
      expect(result.content).toContain("- Workers' compensation insurance");

      // Verify default events and remedies
      expect(result.content).toContain('- Failure to pay rent within 5 days of due date');
      expect(result.content).toContain('- Filing for bankruptcy or insolvency');
      expect(result.content).toContain('- Abandonment of the premises');

      expect(result.content).toContain('- Right to terminate the lease');
      expect(result.content).toContain('- Right to recover all unpaid rent');
      expect(result.content).toContain('- Right to recover damages');
      expect(result.content).toContain('- Right to re-enter and take possession');

      // Verify no raw template loops remain
      expect(result.content).not.toContain('{{#each services.included}}');
      expect(result.content).not.toContain('{{#each maintenance.lessor_obligations}}');
      expect(result.content).not.toContain('{{#each default.events}}');
      expect(result.content).not.toContain('{{this}}');

      // Verify content length indicates full processing
      expect(result.content.length).toBeGreaterThan(1600);
    });

    it('should handle complex nested template loops', async () => {
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

{{#each contract.parties}}
## {{name}}

Addresses:
{{#each addresses}}
- {{this}}
{{/each}}

{{/each}}`;

      const result = await processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false,
      });

      expect(result.content).toContain('## Company A');
      expect(result.content).toContain('## Company B');
      expect(result.content).toContain('- 123 Main St');
      expect(result.content).toContain('- 456 Oak Ave');
      expect(result.content).toContain('- 789 Pine St');
    });

    it('should work with field tracking disabled (Ruby compatibility)', async () => {
      const content = `---
items:
  - Item 1
  - Item 2
  - Item 3
---

{{#each items}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false,
      });

      // Should not contain field tracking spans
      expect(result.content).not.toContain('data-field');
      expect(result.content).not.toContain('class="imported-value"');
      expect(result.content).not.toContain('class="missing-value"');

      // Should contain processed content
      expect(result.content).toContain('- Item 1');
      expect(result.content).toContain('- Item 2');
      expect(result.content).toContain('- Item 3');
    });

    it('should work with field tracking enabled', async () => {
      const content = `---
items:
  - Item 1
  - Item 2
---

{{#each items}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: true,
      });

      // Should contain field tracking spans for the loop items
      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Item 2');
    });
  });

  describePdf('PDF Generation Integration', () => {
    it(
      'should generate PDF with processed template loops',
      async () => {
        const content = `---
services:
  included:
    - Water
    - Electricity
    - Internet
---

# Service Agreement

## Included Services

{{#each services.included}}
- {{this}}
{{/each}}`;

        // Generate PDF
        const pdfPath = '/tmp/test-template-loops.pdf';
        const pdfBuffer = await generatePdf(content, pdfPath, {
          enableFieldTrackingInMarkdown: false,
          format: 'A4',
        });

        // Verify PDF was generated
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(1000); // Should be substantial size

        // Clean up
        try {
          fs.unlinkSync(pdfPath);
        } catch (e) {
          // File might not exist, that's ok
        }
      },
      PDF_TIMEOUT
    );

    it(
      'should generate larger PDF for complex documents with many template loops',
      async () => {
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
{{#each services.included}}
- {{this}}
{{/each}}

{{#each services.additional}}
- Additional: {{this}}
{{/each}}

## Maintenance
{{#each maintenance.lessor}}
- Lessor: {{this}}
{{/each}}

{{#each maintenance.lessee}}
- Lessee: {{this}}
{{/each}}

## Insurance
{{#each insurance.required}}
- {{this}}
{{/each}}`;

        const pdfPath = '/tmp/test-complex-template-loops.pdf';
        const pdfBuffer = await generatePdf(content, pdfPath, {
          enableFieldTrackingInMarkdown: false,
          format: 'A4',
        });

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(5000); // Should be larger due to more content

        // Clean up
        try {
          fs.unlinkSync(pdfPath);
        } catch (e) {
          // File might not exist, that's ok
        }
      },
      PDF_TIMEOUT
    );
  });

  describe('Error Handling Integration', () => {
    it('should handle documents with missing template loop data gracefully', async () => {
      const content = `---
services:
  included:
    - Water
    - Electricity
---

# Service Agreement

## Included Services
{{#each services.included}}
- {{this}}
{{/each}}

## Missing Services
{{#each services.missing}}
- {{this}}
{{/each}}

## Non-existent Section
{{#each nonexistent.items}}
- {{this}}
{{/each}}`;

      const result = await processLegalMarkdown(content, {
        enableFieldTrackingInMarkdown: false,
      });

      // Should process existing data
      expect(result.content).toContain('- Water');
      expect(result.content).toContain('- Electricity');

      // Should handle missing data gracefully (empty sections)
      expect(result.content).toContain('## Missing Services');
      expect(result.content).toContain('## Non-existent Section');

      // Should not contain unprocessed template loops
      expect(result.content).not.toContain('{{#each services.missing}}');
      expect(result.content).not.toContain('{{#each nonexistent.items}}');
    });

    it('should throw on malformed Handlebars loop syntax', async () => {
      const content = `---
items:
  - Item 1
  - Item 2
---

# Test Document

Good loop:
{{#each items}}
- {{this}}
{{/each}}

Malformed loops (should be left unchanged):
{{#unclosed
{{#each items} - {{this}} {{/wrong}}
{{#}}
{{/}}`;

      await expect(
        processLegalMarkdown(content, {
          enableFieldTrackingInMarkdown: false,
        })
      ).rejects.toThrow();
    });
  });
});
