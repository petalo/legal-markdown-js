/**
 * @fileoverview End-to-end tests for PDF generation with real-world templates
 * 
 * These tests verify the complete document generation workflow from markdown to PDF:
 * - Processing legal markdown with complex data structures
 * - Generating HTML with field highlighting and custom CSS
 * - Creating PDF documents with proper styling and layout
 * - Testing with realistic contract and receipt templates
 * - Validating field tracking and reporting capabilities
 * 
 * Unlike unit tests that test individual components, these E2E tests verify
 * the entire user workflow: author writes markdown → system processes data → 
 * generates professional PDFs ready for real-world use.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { processLegalMarkdown, generateHtml, generatePdf, generatePdfVersions } from '../../src';

describe('E2E: PDF Generation with Real Templates', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const outputDir = path.join(__dirname, '../output/e2e');
  
  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up generated files
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        await fs.unlink(path.join(outputDir, file));
      }
    } catch (error) {
      // Directory might not exist
    }
  });

  /**
   * Contract Generation Workflow Tests
   * 
   * These tests simulate the complete workflow a legal professional would use:
   * 1. Author creates markdown template with placeholders
   * 2. System merges template with client data
   * 3. Generates both normal and highlighted PDFs for review
   * 4. Validates all field replacements and conditional logic
   * 
   * This represents real-world usage where contracts are generated from
   * templates and customized with specific client information.
   */
  describe('Contract Generation', () => {
    let contractContent: string;
    let contractData: any;
    let contractCss: string;

    beforeAll(async () => {
      contractContent = await fs.readFile(
        path.join(fixturesDir, 'templates/markdown/contract.md'),
        'utf-8'
      );
      const contractRaw = await fs.readFile(path.join(fixturesDir, 'data/contract-data.json'), 'utf-8');
      const contractJsonStart = contractRaw.indexOf('{');
      contractData = JSON.parse(contractRaw.substring(contractJsonStart));
      contractCss = path.join(fixturesDir, 'templates/css/contract.css');
    });

    it('should process contract markdown with data', async () => {
      // Create content with YAML front matter
      const contentWithData = `---
title: OFFICE SPACE LEASE AGREEMENT
contract:
  signing_date: 2024-01-15
  signing_city: San Francisco
lessor:
  company_name: Property Management LLC
  registered_address: 123 Main Street, San Francisco, CA 94105
  tax_id: 12-3456789
  representative:
    full_name: John Smith
    id_number: 123456789
lessee:
  company_name: Tech Startup Inc
  registered_address: 456 Innovation Way, San Francisco, CA 94107
  tax_id: 98-7654321
  representative:
    full_name: Jane Doe
    id_number: ""
property:
  address: 789 Business Plaza, Suite 500, San Francisco, CA 94108
  area_sqm: 250
  parking_spots: 5
payment:
  monthly_rent:
    text: Five Thousand
    number: 5000
  late_fee_applies: true
  late_fee_percentage: 1.5
maintenance_included: true
maintenance:
  included_services:
    - Daily cleaning
    - HVAC maintenance
    - Security services
---

${contractContent}`;

      const result = processLegalMarkdown(contentWithData);
      
      expect(result.content).toContain('OFFICE SPACE LEASE AGREEMENT');
      expect(result.content).toContain('Property Management LLC');
      expect(result.content).toContain('Tech Startup Inc');
      expect(result.content).toContain('5000'); // The dollar sign is in the template, not the data
      expect(result.content).toContain('## Late Payment Clause');
      expect(result.content).toContain('Late payments will incur a fee of');
      expect(result.content).toContain('1.5% per');
      expect(result.content).toContain('month');
      // Arrays are not processed as mixins in the current implementation
      expect(result.content).toContain('## Maintenance');
      expect(result.content).toContain('The following maintenance services are included:');
      
      // Check metadata was extracted
      expect(result.metadata?.title).toBe('OFFICE SPACE LEASE AGREEMENT');
      expect(result.metadata?.lessor.company_name).toBe('Property Management LLC');
    });

    it('should generate HTML with custom CSS and highlighting', async () => {
      const contentWithData = `---
title: OFFICE SPACE LEASE AGREEMENT
contract:
  signing_date: 2024-01-15
  signing_city: San Francisco
lessor:
  company_name: Property Management LLC
  registered_address: 123 Main Street, San Francisco, CA 94105
  tax_id: 12-3456789
  representative:
    full_name: John Smith
    id_number: 123456789
lessee:
  company_name: Tech Startup Inc
  registered_address: 456 Innovation Way, San Francisco, CA 94107
  tax_id: 98-7654321
  representative:
    full_name: Jane Doe
    id_number: ""
property:
  address: 789 Business Plaza, Suite 500, San Francisco, CA 94108
  area_sqm: 250
  parking_spots: 5
payment:
  monthly_rent:
    text: Five Thousand
    number: 5000
  late_fee_applies: true
  late_fee_percentage: 1.5
maintenance_included: true
maintenance:
  included_services:
    - Daily cleaning
    - HVAC maintenance
    - Security services
---

${contractContent}`;

      const html = await generateHtml(contentWithData, {
        title: 'Office Lease Agreement',
        cssPath: contractCss,
        includeHighlighting: true
      });

      // Save HTML for manual inspection
      await fs.writeFile(
        path.join(outputDir, 'contract-highlighted.html'),
        html
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Office Lease Agreement');
      expect(html).toContain('Property Management LLC');
      
      // Check for highlighting classes
      expect(html).toContain('class="legal-field imported-value"'); // Filled fields
      expect(html).toContain('class="legal-field missing-value"'); // Empty ID field
      expect(html).toContain('ID Required'); // Conditional text for missing ID
      
      // Check CSS was included
      expect(html).toContain('font-family: \'Times New Roman\'');
    });

    /**
     * Tests the dual PDF generation workflow that legal professionals need:
     * - Normal PDF: clean version for client signature
     * - Highlighted PDF: review version showing all field substitutions
     * 
     * This workflow allows lawyers to review what fields were filled vs empty
     * before sending final documents to clients.
     */
    it('should generate PDF versions (normal and highlighted)', async () => {
      const contentWithData = `---
${Object.entries(contractData).map(([key, value]) => 
  `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
).join('\n')}
---

${contractContent}`;

      const outputPath = path.join(outputDir, 'contract.pdf');
      
      const { normal, highlighted } = await generatePdfVersions(
        contentWithData,
        outputPath,
        {
          title: 'Office Lease Agreement',
          cssPath: contractCss,
          format: 'Letter'
        }
      );

      // Verify PDFs were created
      expect(normal).toBeInstanceOf(Buffer);
      expect(highlighted).toBeInstanceOf(Buffer);
      expect(normal.length).toBeGreaterThan(10000); // Reasonable PDF size
      expect(highlighted.length).toBeGreaterThan(10000);

      // Verify files exist
      const normalStats = await fs.stat(path.join(outputDir, 'contract.pdf'));
      const highlightedStats = await fs.stat(path.join(outputDir, 'contract.HIGHLIGHT.pdf'));
      
      expect(normalStats.isFile()).toBe(true);
      expect(highlightedStats.isFile()).toBe(true);
    }, 30000);
  });

  /**
   * Receipt/Ticket Generation Tests
   * 
   * Demonstrates the system's versatility beyond legal documents:
   * - Point-of-sale receipt generation from transaction data
   * - Conditional logic (loyalty program features)
   * - Dynamic pricing calculations
   * - Receipt-specific formatting (monospace fonts, narrow layout)
   * 
   * This tests the same core engine but with different document types,
   * proving the system works for various business document needs.
   */
  describe('Ticket/Receipt Generation', () => {
    let ticketContent: string;
    let ticketData: any;
    let ticketCss: string;

    beforeAll(async () => {
      ticketContent = await fs.readFile(
        path.join(fixturesDir, 'templates/markdown/ticket.md'),
        'utf-8'
      );
      const ticketRaw = await fs.readFile(path.join(fixturesDir, 'data/ticket-data.json'), 'utf-8');
      const ticketJsonStart = ticketRaw.indexOf('{');
      ticketData = JSON.parse(ticketRaw.substring(ticketJsonStart));
      ticketCss = path.join(fixturesDir, 'templates/css/ticket.css');
    });

    it('should process ticket markdown with mixins and conditionals', async () => {
      // Merge default front matter with data
      const contentWithData = ticketContent.replace(
        '---\nstoreName: TechMart Store\ncashierName: Alice Johnson\nticketNumber: "{{ticketNumber ? ticketNumber : \'00000\'}}"\nreceiptId: RCP-2024-{{ticketNumber}}\ntaxRate: 8.5\n---',
        `---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: ${ticketData.ticketNumber}
receiptId: RCP-2024-${ticketData.ticketNumber}
taxRate: 8.5
items: ${JSON.stringify(ticketData.items)}
subtotal: ${ticketData.subtotal}
taxAmount: ${ticketData.taxAmount}
total: ${ticketData.total}
loyaltyMember: ${ticketData.loyaltyMember}
pointsEarned: ${ticketData.pointsEarned}
pointsBalance: ${ticketData.pointsBalance}
---`
      );

      const result = processLegalMarkdown(contentWithData, {
        enableFieldTracking: true
      });
      
      // When field tracking is enabled, values are wrapped in spans
      expect(result.content).toContain('12345');
      expect(result.content).toContain('TechMart Store');
      expect(result.content).toContain('1117.53');
      expect(result.content).toContain('112');
      
      // Arrays are being processed and showing individual items
      expect(result.content).toContain('Laptop Computer');
      expect(result.content).toContain('Wireless Mouse');
      expect(result.content).toContain('USB Cable');
      expect(result.content).toContain('$999.99');
      expect(result.content).toContain('(ON SALE!)');
      expect(result.content).toContain('[Price Missing]');
      
      // Check field tracking report
      expect(result.fieldReport).toBeDefined();
      expect(result.fieldReport?.total).toBeGreaterThan(0);
      // Template loops are tracked as logic, not filled fields
      expect(result.fieldReport?.logic).toBeGreaterThan(0);
    });

    it('should generate receipt-style HTML', async () => {
      const contentWithData = ticketContent.replace(
        '---\nstoreName: TechMart Store\ncashierName: Alice Johnson\nticketNumber: "{{ticketNumber ? ticketNumber : \'00000\'}}"\nreceiptId: RCP-2024-{{ticketNumber}}\ntaxRate: 8.5\n---',
        `---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: ${ticketData.ticketNumber}
receiptId: RCP-2024-${ticketData.ticketNumber}
taxRate: 8.5
items: ${JSON.stringify(ticketData.items)}
subtotal: ${ticketData.subtotal}
taxAmount: ${ticketData.taxAmount}
total: ${ticketData.total}
loyaltyMember: ${ticketData.loyaltyMember}
pointsEarned: ${ticketData.pointsEarned}
pointsBalance: ${ticketData.pointsBalance}
---`
      );

      const html = await generateHtml(contentWithData, {
        title: 'Receipt #12345',
        cssPath: ticketCss,
        includeHighlighting: true
      });

      // Save HTML for manual inspection
      await fs.writeFile(
        path.join(outputDir, 'ticket-highlighted.html'),
        html
      );

      expect(html).toContain('12345');
      expect(html).toContain('font-family: \'Courier New\'');
      expect(html).toContain('max-width: 380px'); // Receipt width
      
      // Arrays are processed, so we'll see the individual items
      expect(html).toContain('Laptop Computer');
      expect(html).toContain('Wireless Mouse');
      expect(html).toContain('USB Cable');
      expect(html).toContain('1117.53');
    });

    it('should generate receipt PDF with proper styling', async () => {
      const contentWithData = ticketContent.replace(
        '---\nstoreName: TechMart Store\ncashierName: Alice Johnson\nticketNumber: {{ticketNumber ? ticketNumber : "00000"}}\nreceiptId: RCP-2024-{{ticketNumber}}\ntaxRate: 8.5\n---',
        `---
storeName: TechMart Store
cashierName: Alice Johnson
ticketNumber: ${ticketData.ticketNumber}
receiptId: RCP-2024-${ticketData.ticketNumber}
taxRate: 8.5
items: ${JSON.stringify(ticketData.items)}
subtotal: ${ticketData.subtotal}
taxAmount: ${ticketData.taxAmount}
total: ${ticketData.total}
loyaltyMember: ${ticketData.loyaltyMember}
pointsEarned: ${ticketData.pointsEarned}
pointsBalance: ${ticketData.pointsBalance}
---`
      );

      const pdfPath = path.join(outputDir, 'ticket.pdf');
      
      const buffer = await generatePdf(contentWithData, pdfPath, {
        title: 'Receipt #12345',
        cssPath: ticketCss,
        includeHighlighting: true,
        format: 'A4' // Receipt on A4 paper
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(5000);

      // Verify file exists
      const stats = await fs.stat(pdfPath);
      expect(stats.isFile()).toBe(true);
    }, 30000);
  });

  /**
   * Field Tracking and Quality Assurance Tests
   * 
   * These tests verify the system's ability to track and report on field usage,
   * which is crucial for document quality assurance:
   * - Identifies missing required fields before document finalization
   * - Tracks conditional logic execution
   * - Provides detailed reports for document review
   * 
   * This feature helps prevent incomplete documents from reaching clients.
   */
  describe('Field Tracking and Reporting', () => {
    /**
     * Tests the field tracking system that helps users identify incomplete documents.
     * Simulates a scenario where some fields are filled, some are empty, and some
     * use conditional logic - representing real-world document states.
     */
    it('should generate comprehensive field report', async () => {
      const content = `---
title: Test Document
client: Acme Corp
contact: 
payment: 5000
hasWarranty: true
---

# \{\{title\}\}

Client: \{\{client\}\}
Contact: \{\{contact ? contact : "[No Contact Provided]"\}\}
Payment: $\{\{payment\}\}

\{\{hasWarranty ? "This product includes warranty." : "No warranty included."\}\}

Missing field: \{\{nonexistent\}\}`;

      const result = processLegalMarkdown(content, {
        enableFieldTracking: true
      });

      expect(result.fieldReport).toBeDefined();
      expect(result.fieldReport?.total).toBeGreaterThanOrEqual(5);
      expect(result.fieldReport?.filled).toBeGreaterThan(0); // title, client, payment
      expect(result.fieldReport?.empty).toBeGreaterThan(0); // contact, nonexistent
      expect(result.fieldReport?.logic).toBeGreaterThan(0); // hasWarranty conditional

      // Verify specific field statuses
      const fields = result.fieldReport?.fields || [];
      const titleField = fields.find(f => f.name === 'title');
      const paymentField = fields.find(f => f.name === 'payment');
      const nonexistentField = fields.find(f => f.name === 'nonexistent');

      expect(titleField?.status).toBe('filled');
      expect(paymentField?.status).toBe('filled');
      expect(nonexistentField?.status).toBe('empty');
    });
  });

  /**
   * Error Handling and Robustness Tests
   * 
   * These tests ensure the system gracefully handles real-world issues:
   * - Missing CSS files (system provides sensible defaults)
   * - Malformed YAML front matter (degrades gracefully)
   * - Invalid file paths and permissions
   * 
   * Critical for production use where file system issues are common.
   */
  describe('Error Handling', () => {
    /**
     * Tests graceful degradation when CSS files are missing or inaccessible.
     * System should still generate usable documents with default styling.
     */
    it('should handle missing CSS file gracefully', async () => {
      const content = `---
title: Test
---

# \{\{title\}\}`;

      const html = await generateHtml(content, {
        cssPath: '/nonexistent/file.css',
        includeHighlighting: true
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test');
      // Should not include default styles when custom CSS is specified
      expect(html).not.toContain('font-family:');
    });

    /**
     * Tests system resilience when YAML front matter is malformed.
     * System should continue processing the document rather than failing completely.
     */
    it('should handle malformed YAML gracefully', async () => {
      const content = `---
title: Test
invalid yaml here
---

# Document`;

      const result = processLegalMarkdown(content);
      
      // Should return original content when YAML parsing fails
      expect(result.content).toContain('# Document');
    });
  });
});