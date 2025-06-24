/**
 * Processes cross-references in a LegalMarkdown document
 * 
 * @param content - The document content
 * @param metadata - Document metadata with reference values
 * @returns Processed content with references replaced by their values
 */
export function processCrossReferences(
  content: string,
  metadata: Record<string, any>
): string {
  // Regular expression to match cross-references
  // Format: |reference_key|
  const referencePattern = /\|(.*?)\|/g;
  
  return content.replace(referencePattern, (match, key) => {
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
 * @param obj - Object to extract value from
 * @param path - Dot-separated path to the value
 * @returns The value at the specified path
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
 * @param value - The reference value
 * @param format - Optional format specifier
 * @returns Formatted value
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
 * @param date - Date to format
 * @param format - Date format specification
 * @returns Formatted date string
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
      day: 'numeric'
    });
  }
  
  return date.toISOString().split('T')[0]; // Default to ISO format
}

/**
 * Formats a number as currency
 * 
 * @param amount - Amount to format
 * @param format - Currency format specification
 * @returns Formatted currency string
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
    currency
  }).format(amount);
}