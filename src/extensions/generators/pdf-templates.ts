/**
 * PDF Template Generation for Headers and Footers
 *
 * This module provides reusable templates for PDF headers and footers with logo support.
 * It handles logo integration, positioning, and consistent styling across all PDF documents.
 *
 * @module
 */

import { PDF_TEMPLATE_CONSTANTS } from '../../constants/index';

/**
 * PDF Templates utility class for generating header and footer HTML templates
 *
 * Provides static methods to generate consistent header and footer templates
 * with optional logo integration and proper positioning for PDF generation.
 *
 * @class PdfTemplates
 * @example
 * ```typescript
 * const headerWithLogo = PdfTemplates.generateHeaderTemplate(logoBase64);
 * const footer = PdfTemplates.generateFooterTemplate();
 * ```
 */
export class PdfTemplates {
  /**
   * Generates HTML template for PDF headers with optional logo
   *
   * Creates a right-aligned header with logo support. The template uses flexbox
   * for proper positioning and maintains consistent spacing with document margins.
   *
   * @param {string} [logoBase64] - Optional base64 encoded logo image
   * @returns {string} HTML template string for the header
   * @example
   * ```typescript
   * // Header with logo
   * const headerWithLogo = PdfTemplates.generateHeaderTemplate('iVBORw0KGgoAAAANS...');
   *
   * // Header without logo (empty)
   * const emptyHeader = PdfTemplates.generateHeaderTemplate();
   * ```
   */
  static generateHeaderTemplate(logoBase64?: string): string {
    if (!logoBase64) {
      return '<div></div>';
    }

    return `
      <div style="
        width: 100%; 
        font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}; 
        padding-right: ${PDF_TEMPLATE_CONSTANTS.HEADER_PADDING}; 
        display: flex; 
        justify-content: flex-end;
        font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY};
      ">
        <img 
          src="data:image/png;base64,${logoBase64}" 
          style="height: ${PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT};" 
          alt="Logo"
        />
      </div>
    `.trim();
  }

  /**
   * Generates HTML template for PDF footers with page numbers
   *
   * Creates a right-aligned footer with "Page X / Y" format using Puppeteer's
   * special classes for dynamic page numbering.
   *
   * @returns {string} HTML template string for the footer
   * @example
   * ```typescript
   * const footer = PdfTemplates.generateFooterTemplate();
   * // Results in: "Pg: 1 / 10" format in the PDF
   * ```
   */
  static generateFooterTemplate(): string {
    return `
      <div style="
        width: 100%; 
        font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}; 
        padding: 10px ${PDF_TEMPLATE_CONSTANTS.FOOTER_PADDING}; 
        text-align: right; 
        font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY};
      ">
        <span>Pg: <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `.trim();
  }

  /**
   * Generates a custom header template with text and optional logo
   *
   * Creates a header with both text content and logo, useful for documents
   * that need title information in addition to branding.
   *
   * @param {string} headerText - Text to display in the header
   * @param {string} [logoBase64] - Optional base64 encoded logo image
   * @returns {string} HTML template string for the custom header
   * @example
   * ```typescript
   * const customHeader = PdfTemplates.generateCustomHeaderTemplate(
   *   'Confidential Agreement',
   *   logoBase64
   * );
   * ```
   */
  static generateCustomHeaderTemplate(headerText: string, logoBase64?: string): string {
    const logoElement = logoBase64
      ? `<img src="data:image/png;base64,${logoBase64}" ` +
        `style="height: ${PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT};" alt="Logo" />`
      : '';

    return `
      <div style="
        width: 100%; 
        font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}; 
        padding: 10px ${PDF_TEMPLATE_CONSTANTS.HEADER_PADDING}; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY};
      ">
        <span style="font-weight: bold;">${headerText}</span>
        ${logoElement}
      </div>
    `.trim();
  }

  /**
   * Generates a custom footer template with text and page numbers
   *
   * Creates a footer with custom text on the left and page numbers on the right.
   *
   * @param {string} footerText - Text to display in the footer
   * @returns {string} HTML template string for the custom footer
   * @example
   * ```typescript
   * const customFooter = PdfTemplates.generateCustomFooterTemplate('© 2024 Company Name');
   * ```
   */
  static generateCustomFooterTemplate(footerText: string): string {
    return `
      <div style="
        width: 100%; 
        font-size: ${PDF_TEMPLATE_CONSTANTS.FONT_SIZE}; 
        padding: 10px ${PDF_TEMPLATE_CONSTANTS.FOOTER_PADDING}; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        font-family: ${PDF_TEMPLATE_CONSTANTS.FONT_FAMILY};
      ">
        <span>${footerText}</span>
        <span>Pg: <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `.trim();
  }
}
