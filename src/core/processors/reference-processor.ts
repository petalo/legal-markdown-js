/**
 * @fileoverview Cross-Reference Processing Module for Legal Markdown Documents
 *
 * This module provides functionality to process cross-references in Legal Markdown
 * documents, replacing reference placeholders with actual values from metadata.
 * It supports various formatting options including date formatting, currency
 * formatting, and nested metadata access through dot notation.
 *
 * Features:
 * - Cross-reference syntax: |reference_key|
 * - Date reference processing with @today support
 * - Automatic currency formatting for amount fields
 * - Nested metadata value access with dot notation
 * - Type-aware value formatting (dates, numbers, strings)
 * - Fallback to original reference if value not found
 * - Integration with date-processor for date handling
 *
 * @example
 * ```typescript
 * import { processCrossReferences } from './reference-processor';
 *
 * const content = `
 * This agreement is between |client.name| and |provider.name|.
 * The total amount is |contract.amount| due on |contract.due_date|.
 * Document generated on |@today|.
 * `;
 *
 * const metadata = {
 *   client: { name: "Acme Corp" },
 *   provider: { name: "Service Ltd" },
 *   contract: {
 *     amount: 25000,
 *     due_date: new Date("2024-12-31")
 *   },
 *   payment_currency: "USD"
 * };
 *
 * const processed = processCrossReferences(content, metadata);
 * console.log(processed);
 * // Output:
 * // This agreement is between Acme Corp and Service Ltd.
 * // The total amount is $25,000.00 due on 2024-12-31.
 * // Document generated on 2024-01-15.
 * ```
 */

import { processDateReferences } from './date-processor';

/**
 * Processes cross-references in a LegalMarkdown document
 *
 * This is the main function that processes cross-references using the |reference_key|
 * syntax. It first processes date references, then handles regular cross-references
 * with automatic formatting based on value type and field names.
 *
 * @param {string} content - The document content containing cross-references
 * @param {Record<string, any>} metadata - Document metadata with reference values
 * @returns {string} Processed content with references replaced by their values
 * @example
 * ```typescript
 * // Basic reference processing
 * const content = "Payment due: |payment.amount| on |payment.date|";
 * const metadata = {
 *   payment: {
 *     amount: 1500,
 *     date: new Date("2024-03-15")
 *   },
 *   payment_currency: "EUR"
 * };
 *
 * const result = processCrossReferences(content, metadata);
 * // Output: "Payment due: €1,500.00 on 2024-03-15"
 *
 * // Nested reference access
 * const content2 = "Contact: |client.contact.email| (|client.contact.phone|)";
 * const metadata2 = {
 *   client: {
 *     contact: {
 *       email: "info@client.com",
 *       phone: "+1-555-0123"
 *     }
 *   }
 * };
 *
 * const result2 = processCrossReferences(content2, metadata2);
 * // Output: "Contact: info@client.com (+1-555-0123)"
 * ```
 */
export function processCrossReferences(content: string, metadata: Record<string, any>): string {
  // First process date references (@today)
  const processedContent = processDateReferences(content, metadata);

  // Then process regular cross-references
  // Format: |reference_key|
  const referencePattern = /\|(.*?)\|/g;

  return processedContent.replace(referencePattern, (match, key) => {
    // Get the reference value from metadata
    const value = getNestedValue(metadata, key.trim());

    if (value === undefined) {
      return match;
    }

    // Format value based on type
    if (value instanceof Date) {
      return formatDate(value);
    } else if (typeof value === 'number' && key.includes('amount')) {
      // Format currency if key contains 'amount'
      const currency = metadata.payment_currency || 'USD';
      return formatCurrency(value, `currency:${currency}`);
    }

    // Default string conversion
    return String(value);
  });
}

/**
 * Gets a potentially nested value from an object
 *
 * Traverses an object using dot notation to access nested properties safely.
 * Returns undefined if any part of the path doesn't exist, preventing errors
 * when accessing deeply nested properties.
 *
 * @private
 * @param {Record<string, any>} obj - Object to extract value from
 * @param {string} path - Dot-separated path to the value (e.g., "user.profile.name")
 * @returns {any} The value at the specified path, or undefined if not found
 * @example
 * ```typescript
 * const obj = {
 *   contract: {
 *     parties: {
 *       client: { name: "Acme Corp", id: 12345 },
 *       provider: { name: "Service Ltd" }
 *     },
 *     terms: { duration: 12 }
 *   }
 * };
 *
 * console.log(getNestedValue(obj, "contract.parties.client.name")); // "Acme Corp"
 * console.log(getNestedValue(obj, "contract.terms.duration"));      // 12
 * console.log(getNestedValue(obj, "contract.nonexistent"));         // undefined
 * ```
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }

    value = value[key];
  }

  return value;
}

/**
 * Processes special reference formats like dates and currency amounts
 *
 * Applies appropriate formatting to reference values based on their type and
 * optional format specifiers. Handles dates, currency amounts, and falls back
 * to string conversion for other types.
 *
 * @param {any} value - The reference value to format
 * @param {string} [format] - Optional format specifier (e.g., "currency:USD:en-US")
 * @returns {string} Formatted value as string
 * @example
 * ```typescript
 * // Date formatting
 * const date = new Date("2024-03-15");
 * console.log(formatReferenceValue(date));           // "2024-03-15"
 * console.log(formatReferenceValue(date, "long"));   // "March 15, 2024"
 * console.log(formatReferenceValue(date, "short"));  // "3/15/2024"
 *
 * // Currency formatting
 * console.log(formatReferenceValue(1500, "currency:USD"));       // "$1,500.00"
 * console.log(formatReferenceValue(1500, "currency:EUR:de-DE")); // "1.500,00 €"
 *
 * // Default string conversion
 * console.log(formatReferenceValue("Hello World"));  // "Hello World"
 * console.log(formatReferenceValue(12345));          // "12345"
 * ```
 */
export function formatReferenceValue(value: any, format?: string): string {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle different types
  if (typeof value === 'object' && value instanceof Date) {
    return formatDate(value, format);
  }

  if (typeof value === 'number' && format?.startsWith('currency')) {
    return formatCurrency(value, format);
  }

  // Default: convert to string
  return String(value);
}

/**
 * Formats a date value
 *
 * Converts a Date object to a formatted string using various format options.
 * Supports ISO format (default), short format, and long format for different
 * document presentation needs.
 *
 * @private
 * @param {Date} date - Date to format
 * @param {string} [format] - Date format specification ("short", "long", or default ISO)
 * @returns {string} Formatted date string
 * @example
 * ```typescript
 * const date = new Date("2024-03-15T10:30:00Z");
 *
 * console.log(formatDate(date));         // "2024-03-15" (ISO format)
 * console.log(formatDate(date, "short")); // "3/15/2024" (locale-specific)
 * console.log(formatDate(date, "long"));  // "March 15, 2024" (long format)
 * ```
 */
function formatDate(date: Date, format?: string): string {
  if (!format) {
    // Default format: YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  // Custom date formatting
  if (format === 'short') {
    return date.toLocaleDateString();
  } else if (format === 'long') {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toISOString().split('T')[0]; // Default to ISO format
}

/**
 * Formats a number as currency
 *
 * Converts a numeric amount to a formatted currency string using the
 * Intl.NumberFormat API. Supports different currencies and locales
 * based on the format specification.
 *
 * @private
 * @param {number} amount - Amount to format
 * @param {string} [format] - Currency format specification ("currency:CODE:locale")
 * @returns {string} Formatted currency string
 * @example
 * ```typescript
 * console.log(formatCurrency(1500));                          // "$1,500.00" (default USD)
 * console.log(formatCurrency(1500, "currency:EUR"));         // "€1,500.00"
 * console.log(formatCurrency(1500, "currency:GBP:en-GB"));   // "£1,500.00"
 * console.log(formatCurrency(1500, "currency:JPY:ja-JP"));   // "¥1,500"
 * console.log(formatCurrency(1500, "currency:EUR:de-DE"));   // "1.500,00 €"
 * ```
 */
function formatCurrency(amount: number, format?: string): string {
  let currency = 'USD';
  let locale = 'en-US';

  // Parse format specification
  if (format) {
    const parts = format.split(':');
    if (parts.length > 1) {
      currency = parts[1].trim().toUpperCase();
    }
    if (parts.length > 2) {
      locale = parts[2].trim();
    }
  }

  // Format using Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
