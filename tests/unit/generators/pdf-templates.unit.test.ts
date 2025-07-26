/**
 * @fileoverview Unit tests for PDF Templates system
 * 
 * Tests the PDF template generation functions for headers and footers,
 * including logo integration and proper HTML/CSS output.
 */

import { PdfTemplates } from '../../../src/generators/pdf-templates';
import { PDF_TEMPLATE_CONSTANTS } from '../../../src/constants';

describe('PDF Templates', () => {
  describe('PDF_TEMPLATE_CONSTANTS', () => {
    it('should define all required constants', () => {
      expect(PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE).toBe(500 * 1024);
      expect(PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT).toBe('40px');
      expect(PDF_TEMPLATE_CONSTANTS.HEADER_PADDING).toBe('25mm');
      expect(PDF_TEMPLATE_CONSTANTS.FOOTER_PADDING).toBe('25mm');
      expect(PDF_TEMPLATE_CONSTANTS.FONT_SIZE).toBe('10px');
      expect(PDF_TEMPLATE_CONSTANTS.FONT_FAMILY).toBe('Helvetica, Arial, sans-serif');
    });

    it('should have sensible size limit for logos', () => {
      expect(PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE).toBeGreaterThan(100 * 1024); // > 100KB
      expect(PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE).toBeLessThanOrEqual(1024 * 1024); // <= 1MB
    });
  });

  describe('generateHeaderTemplate', () => {
    it('should return empty div when no logo provided', () => {
      const result = PdfTemplates.generateHeaderTemplate();
      expect(result).toBe('<div></div>');
    });

    it('should return empty div when logo is undefined', () => {
      const result = PdfTemplates.generateHeaderTemplate(undefined);
      expect(result).toBe('<div></div>');
    });

    it('should return empty div when logo is empty string', () => {
      const result = PdfTemplates.generateHeaderTemplate('');
      expect(result).toBe('<div></div>');
    });

    it('should generate proper header template with logo', () => {
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const result = PdfTemplates.generateHeaderTemplate(mockBase64);

      // Check that it contains the base64 data URL
      expect(result).toContain(`data:image/png;base64,${mockBase64}`);
      
      // Check styling properties
      expect(result).toContain('width: 100%');
      expect(result).toContain(`font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}`);
      expect(result).toContain(`padding-right: ${PDF_TEMPLATE_CONSTANTS.HEADER_PADDING}`);
      expect(result).toContain('display: flex');
      expect(result).toContain('justify-content: flex-end');
      expect(result).toContain(`font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY}`);
      
      // Check logo styling
      expect(result).toContain(`height: ${PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT}`);
      expect(result).toContain('alt="Logo"');
    });

    it('should trim whitespace from template', () => {
      const mockBase64 = 'test-base64';
      const result = PdfTemplates.generateHeaderTemplate(mockBase64);
      
      expect(result).not.toMatch(/^\s/); // No leading whitespace
      expect(result).not.toMatch(/\s$/); // No trailing whitespace
    });

    it('should generate valid HTML structure', () => {
      const mockBase64 = 'test-base64';
      const result = PdfTemplates.generateHeaderTemplate(mockBase64);
      
      // Should have proper div structure (accounting for multiline)
      expect(result).toMatch(/^<div[^>]*>[\s\S]*<\/div>$/);
      
      // Should have proper img tag within div
      expect(result).toContain('<img');
      expect(result).toContain('/>');
    });
  });

  describe('generateFooterTemplate', () => {
    it('should generate footer with page numbers', () => {
      const result = PdfTemplates.generateFooterTemplate();
      
      // Check page number placeholders
      expect(result).toContain('class="pageNumber"');
      expect(result).toContain('class="totalPages"');
      expect(result).toContain('Pg:');
      
      // Check styling
      expect(result).toContain('width: 100%');
      expect(result).toContain(`font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}`);
      expect(result).toContain(`padding: 10px ${PDF_TEMPLATE_CONSTANTS.FOOTER_PADDING}`);
      expect(result).toContain('text-align: right');
      expect(result).toContain(`font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY}`);
    });

    it('should trim whitespace from template', () => {
      const result = PdfTemplates.generateFooterTemplate();
      
      expect(result).not.toMatch(/^\s/); // No leading whitespace
      expect(result).not.toMatch(/\s$/); // No trailing whitespace
    });

    it('should generate valid HTML structure', () => {
      const result = PdfTemplates.generateFooterTemplate();
      
      // Should have proper div structure (accounting for multiline)
      expect(result).toMatch(/^<div[^>]*>[\s\S]*<\/div>$/);
      
      // Should have nested span elements
      expect(result).toContain('<span>');
      expect(result).toContain('</span>');
    });

    it('should include proper page format', () => {
      const result = PdfTemplates.generateFooterTemplate();
      
      // Should follow "Pg: X / Y" format
      expect(result).toMatch(/Pg:\s*<span[^>]*class="pageNumber"[^>]*><\/span>\s*\/\s*<span[^>]*class="totalPages"[^>]*><\/span>/);
    });
  });

  describe('generateCustomHeaderTemplate', () => {
    const testHeaderText = 'Confidential Agreement';

    it('should generate header with text only', () => {
      const result = PdfTemplates.generateCustomHeaderTemplate(testHeaderText);
      
      expect(result).toContain(testHeaderText);
      expect(result).toContain('font-weight: bold');
      expect(result).toContain('justify-content: space-between');
      expect(result).not.toContain('data:image/png;base64');
    });

    it('should generate header with text and logo', () => {
      const mockBase64 = 'test-logo-base64';
      const result = PdfTemplates.generateCustomHeaderTemplate(testHeaderText, mockBase64);
      
      expect(result).toContain(testHeaderText);
      expect(result).toContain(`data:image/png;base64,${mockBase64}`);
      expect(result).toContain('font-weight: bold');
      expect(result).toContain('justify-content: space-between');
      expect(result).toContain('align-items: center');
    });

    it('should handle special characters in header text', () => {
      const specialText = 'Contract & Agreement "2024" <Company>';
      const result = PdfTemplates.generateCustomHeaderTemplate(specialText);
      
      expect(result).toContain(specialText);
    });

    it('should apply proper styling', () => {
      const result = PdfTemplates.generateCustomHeaderTemplate(testHeaderText);
      
      expect(result).toContain('width: 100%');
      expect(result).toContain(`font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}`);
      expect(result).toContain(`padding: 10px ${PDF_TEMPLATE_CONSTANTS.HEADER_PADDING}`);
      expect(result).toContain(`font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY}`);
    });
  });

  describe('generateCustomFooterTemplate', () => {
    const testFooterText = '© 2024 Company Name';

    it('should generate footer with custom text and page numbers', () => {
      const result = PdfTemplates.generateCustomFooterTemplate(testFooterText);
      
      expect(result).toContain(testFooterText);
      expect(result).toContain('class="pageNumber"');
      expect(result).toContain('class="totalPages"');
      expect(result).toContain('justify-content: space-between');
      expect(result).toContain('align-items: center');
    });

    it('should handle special characters in footer text', () => {
      const specialText = 'Copyright © 2024 "Company & Associates"';
      const result = PdfTemplates.generateCustomFooterTemplate(specialText);
      
      expect(result).toContain(specialText);
    });

    it('should apply proper styling', () => {
      const result = PdfTemplates.generateCustomFooterTemplate(testFooterText);
      
      expect(result).toContain('width: 100%');
      expect(result).toContain(`font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}`);
      expect(result).toContain(`padding: 10px ${PDF_TEMPLATE_CONSTANTS.FOOTER_PADDING}`);
      expect(result).toContain(`font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY}`);
    });

    it('should maintain page number format', () => {
      const result = PdfTemplates.generateCustomFooterTemplate(testFooterText);
      
      // Should still follow "Pg: X / Y" format
      expect(result).toMatch(/Pg:\s*<span[^>]*class="pageNumber"[^>]*><\/span>\s*\/\s*<span[^>]*class="totalPages"[^>]*><\/span>/);
    });
  });

  describe('Template consistency', () => {
    it('should use consistent font family across all templates', () => {
      const headerWithLogo = PdfTemplates.generateHeaderTemplate('test-base64');
      const footer = PdfTemplates.generateFooterTemplate();
      const customHeader = PdfTemplates.generateCustomHeaderTemplate('Test', 'test-base64');
      const customFooter = PdfTemplates.generateCustomFooterTemplate('Test');

      const expectedFont = PDF_TEMPLATE_CONSTANTS.FONT_FAMILY;
      
      expect(headerWithLogo).toContain(expectedFont);
      expect(footer).toContain(expectedFont);
      expect(customHeader).toContain(expectedFont);
      expect(customFooter).toContain(expectedFont);
    });

    it('should use consistent font size across all templates', () => {
      const headerWithLogo = PdfTemplates.generateHeaderTemplate('test-base64');
      const footer = PdfTemplates.generateFooterTemplate();
      const customHeader = PdfTemplates.generateCustomHeaderTemplate('Test', 'test-base64');
      const customFooter = PdfTemplates.generateCustomFooterTemplate('Test');

      const expectedSize = PDF_TEMPLATE_CONSTANTS.FONT_SIZE;
      
      expect(headerWithLogo).toContain(expectedSize);
      expect(footer).toContain(expectedSize);
      expect(customHeader).toContain(expectedSize);
      expect(customFooter).toContain(expectedSize);
    });

    it('should use consistent logo height across all templates', () => {
      const headerWithLogo = PdfTemplates.generateHeaderTemplate('test-base64');
      const customHeader = PdfTemplates.generateCustomHeaderTemplate('Test', 'test-base64');

      const expectedHeight = PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT;
      
      expect(headerWithLogo).toContain(expectedHeight);
      expect(customHeader).toContain(expectedHeight);
    });
  });

  describe('HTML validation', () => {
    it('should generate valid HTML for all template types', () => {
      const templates = [
        PdfTemplates.generateHeaderTemplate('test-base64'),
        PdfTemplates.generateFooterTemplate(),
        PdfTemplates.generateCustomHeaderTemplate('Test', 'test-base64'),
        PdfTemplates.generateCustomFooterTemplate('Test')
      ];

      templates.forEach(template => {
        // Basic HTML structure validation (accounting for multiline)
        expect(template).toMatch(/^<div[^>]*>[\s\S]*<\/div>$/);
        
        // No unclosed tags
        const openTags = (template.match(/<[^\/][^>]*>/g) || []).length;
        const closeTags = (template.match(/<\/[^>]*>/g) || []).length;
        const selfClosingTags = (template.match(/<[^>]*\/>/g) || []).length;
        
        expect(openTags).toBe(closeTags + selfClosingTags);
      });
    });
  });
});