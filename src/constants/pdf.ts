/**
 * PDF generation constants and configuration
 *
 * This module contains all constants related to PDF generation,
 * including template styling, logo constraints, and layout specifications.
 */

/**
 * Configuration constants for PDF generation and template styling
 * @example
 * ```typescript
 * import { PDF_TEMPLATE_CONSTANTS } from './constants';
 *
 * // Use PDF template constants
 * const logoHeight = PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT;
 * const maxSize = PDF_TEMPLATE_CONSTANTS.MAX_LOGO_SIZE;
 *
 * // Create custom header with constants
 * const header = `<div style="height: ${PDF_TEMPLATE_CONSTANTS.LOGO_HEIGHT};">...</div>`;
 * ```
 */
export const PDF_TEMPLATE_CONSTANTS = {
  /** Maximum logo file size in bytes (500KB) */
  MAX_LOGO_SIZE: 500 * 1024,
  /** Fixed logo height in CSS units */
  LOGO_HEIGHT: '40px',
  /** Header padding for alignment with document margins */
  HEADER_PADDING: '25mm',
  /** Footer padding for alignment with document margins */
  FOOTER_PADDING: '25mm',
  /** Font size for header and footer text */
  FONT_SIZE: '10px',
  /** Font family for consistent typography */
  FONT_FAMILY: 'Helvetica, Arial, sans-serif',
} as const;
