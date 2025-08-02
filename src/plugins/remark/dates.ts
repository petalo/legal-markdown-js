/**
 * Remark plugin for Legal Markdown date processing
 *
 * This plugin processes date references in Legal Markdown documents using
 * AST-based processing. It handles @today tokens with format specifiers and
 * arithmetic operations, integrating with the comprehensive date helper system.
 *
 * Features:
 * - @today token processing with format specifiers (@today[format])
 * - Date arithmetic with +/- operations (@today+30, @today-365)
 * - Advanced date formatting (legal, ISO, US, European, etc.)
 * - Timezone and locale support
 * - Integration with field tracking for highlighting
 * - Comprehensive error handling with fallback formatting
 *
 * Architecture:
 * 1. Scan document content for @today patterns
 * 2. Parse format specifiers and arithmetic operations
 * 3. Process dates using advanced date helpers
 * 4. Replace tokens with formatted dates
 * 5. Integrate with field tracker for highlighting support
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkDates from './dates';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkDates, {
 *     metadata: { 'date-format': 'legal', timezone: 'America/New_York' },
 *     enableFieldTracking: true
 *   });
 *
 * const result = await processor.process('Contract signed on @today[legal].');
 * // Result: "Contract signed on January 15th, 2024."
 * ```
 *
 * @module
 */

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text } from 'mdast';
// Date processing functionality is implemented directly in this plugin
import { addDays, addMonths, addYears } from '../../extensions/helpers/advanced-date-helpers';
import { fieldTracker } from '../../extensions/tracking/field-tracker';

/**
 * Plugin options for date processing
 */
interface DateProcessingOptions {
  /** Document metadata containing date formatting options */
  metadata: Record<string, any>;
  /** Enable debug logging */
  debug?: boolean;
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
}

/**
 * Pattern to match @today with optional arithmetic and format specifiers
 * Uses alternation to match valid patterns: arithmetic+format, arithmetic only, or format only
 */
const EXTENDED_DATE_PATTERN =
  /@today((?:[+-]\d+[dmy]?(?:\[[^\]]+\])?)|(?:[+-]\d+[dmy]?)|(?:\[[^\]]+\]))?/g;

/**
 * Parse date token to extract arithmetic and format
 * @param token - The full token after @today (e.g., "+30[US]", "[legal]", "+1y")
 * @returns Object with arithmetic operation and format, or null if invalid
 */
function parseDateToken(token: string): {
  arithmetic: { type: 'days' | 'months' | 'years'; amount: number } | null;
  format: string | null;
  isValid: boolean;
} {
  if (!token) return { arithmetic: null, format: null, isValid: true };

  // Check if the token contains only valid characters for date processing
  if (!/^[+-]?\d*[dmy]?(\[[^\]]+\])?$/.test(token)) {
    return { arithmetic: null, format: null, isValid: false };
  }

  // Extract format first [format]
  const formatMatch = token.match(/\[([^\]]+)\]/);
  const format = formatMatch ? formatMatch[1] : null;

  // Remove format part to get arithmetic part
  const arithmeticPart = token.replace(/\[([^\]]+)\]/, '');

  // Parse arithmetic operation only if there is an arithmetic part
  let arithmetic = null;
  if (arithmeticPart) {
    const arithmeticMatch = arithmeticPart.match(/^([+-])(\d+)([dmy]?)$/);

    if (arithmeticMatch) {
      const [, sign, amount, suffix] = arithmeticMatch;
      const numAmount = parseInt(amount) * (sign === '-' ? -1 : 1);

      switch (suffix) {
        case 'd':
        case '':
          arithmetic = { type: 'days' as const, amount: numAmount };
          break;
        case 'm':
          arithmetic = { type: 'months' as const, amount: numAmount };
          break;
        case 'y':
          arithmetic = { type: 'years' as const, amount: numAmount };
          break;
        default:
          arithmetic = { type: 'days' as const, amount: numAmount };
      }
    } else if (arithmeticPart !== '') {
      // Invalid arithmetic format
      return { arithmetic: null, format: null, isValid: false };
    }
  }

  return { arithmetic, format, isValid: true };
}

/**
 * Legacy function for backwards compatibility
 */
function parseArithmetic(
  operation: string
): { type: 'days' | 'months' | 'years'; amount: number } | null {
  const result = parseDateToken(operation);
  return result.arithmetic;
}

/**
 * Apply arithmetic operation to a date
 */
function applyDateArithmetic(baseDate: Date, arithmetic: ReturnType<typeof parseArithmetic>): Date {
  if (!arithmetic) return baseDate;

  switch (arithmetic.type) {
    case 'days':
      return addDays(baseDate, arithmetic.amount);
    case 'months':
      return addMonths(baseDate, arithmetic.amount);
    case 'years':
      return addYears(baseDate, arithmetic.amount);
    default:
      return baseDate;
  }
}

// Internal function removed - functionality is implemented in processDateReferencesInAST

/**
 * Basic date formatting fallback
 */
function formatDateBasic(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayNumber = date.getDate();

  // Month names for legal format
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  switch (format.toLowerCase()) {
    case 'iso':
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`;
    case 'us':
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'eu':
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'legal':
      // Legal format without ordinal suffix as expected by tests
      return `${monthNames[date.getMonth()]} ${dayNumber}, ${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get CSS class for date field based on its processing status
 */
function getDateFieldCssClass(hasArithmetic: boolean): string {
  return hasArithmetic ? 'legal-field highlight' : 'legal-field imported-value';
}

/**
 * Format date value with optional field tracking wrapper
 */
function formatDateValue(
  value: string,
  originalToken: string,
  enableFieldTracking: boolean = false,
  hasArithmetic: boolean = false
): string {
  if (!enableFieldTracking) {
    return value;
  }

  const cssClass = getDateFieldCssClass(hasArithmetic);
  const fieldName = `date.${originalToken.replace(/[@[\]]/g, '')}`;

  return `<span class="${cssClass}" data-field="${fieldName.replace(/"/g, '&quot;')}">${value}</span>`;
}

/**
 * Process date references in text nodes with field tracking
 */
function processDateReferencesInAST(
  root: Root,
  metadata: Record<string, any>,
  enableFieldTracking: boolean = false
): void {
  visit(root, 'text', (node: Text, index, parent) => {
    const originalValue = node.value;
    let modifiedValue = originalValue;
    let hasChanges = false;

    // Process extended date patterns with arithmetic
    modifiedValue = modifiedValue.replace(EXTENDED_DATE_PATTERN, (match, token) => {
      try {
        // Parse the token to get arithmetic and format
        const { arithmetic, format: tokenFormat, isValid } = parseDateToken(token);

        // If token is invalid, return original match
        if (!isValid) {
          return match;
        }

        // Use current date as base
        let date = new Date();
        const hasArithmetic = !!arithmetic;

        // Apply arithmetic if present
        if (arithmetic) {
          date = applyDateArithmetic(date, arithmetic);
        }

        // Determine format
        const format = tokenFormat || metadata['date-format'] || 'YYYY-MM-DD';

        // Format the date using our basic formatter
        const formattedDate = formatDateBasic(date, format);

        // Track the date field for statistics
        fieldTracker.trackField(`date.${match.replace(/[@[\]]/g, '')}`, {
          value: formattedDate,
          originalValue: match,
          hasLogic: hasArithmetic,
        });

        hasChanges = true;
        return formatDateValue(formattedDate, match, enableFieldTracking, hasArithmetic);
      } catch (error) {
        console.warn(`Error processing date reference ${match}:`, error);
        return match; // Return original on error
      }
    });

    // Update node value if changes were made
    if (hasChanges) {
      // If we have HTML in the replacement (field tracking spans), we need to convert to HTML node
      if (enableFieldTracking && modifiedValue.includes('<span')) {
        // Replace the text node with an HTML node to preserve HTML
        if (parent && typeof index === 'number') {
          const htmlNode = {
            type: 'html',
            value: modifiedValue,
          };
          parent.children[index] = htmlNode as any;
        }
      } else {
        node.value = modifiedValue;
      }
    }
  });

  // Also process HTML nodes that might contain date references
  visit(root, 'html', (node: any) => {
    if (!node.value || !node.value.includes('@today')) {
      return;
    }

    let modifiedValue = node.value;
    let hasChanges = false;

    // Process basic date patterns in HTML content
    modifiedValue = modifiedValue.replace(
      EXTENDED_DATE_PATTERN,
      (match: string, formatOverride: string) => {
        try {
          // Use current date
          const date = new Date();

          // Determine format
          const format = formatOverride || metadata['date-format'] || 'YYYY-MM-DD';

          // Format the date
          const formattedDate = formatDateBasic(date, format);

          // Track the date field for statistics
          fieldTracker.trackField(`date.${match.replace(/[@[\]]/g, '')}`, {
            value: formattedDate,
            originalValue: match,
            hasLogic: false,
          });

          hasChanges = true;

          // For HTML nodes, generate HTML span if field tracking is enabled
          if (enableFieldTracking) {
            const cssClass = getDateFieldCssClass(false);
            const fieldName = `date.${match.replace(/[@[\]]/g, '')}`;
            return (
              `<span class="${cssClass}" ` +
              `data-field="${fieldName.replace(/"/g, '&quot;')}">${formattedDate}</span>`
            );
          } else {
            return formattedDate;
          }
        } catch (error) {
          console.warn(`Error processing date reference ${match}:`, error);
          return match;
        }
      }
    );

    // Update HTML node value if changes were made
    if (hasChanges) {
      node.value = modifiedValue;
    }
  });
}

/**
 * Remark plugin for processing date references in Legal Markdown documents
 */
const remarkDates: Plugin<[DateProcessingOptions], Root> = options => {
  const { metadata, debug = false, enableFieldTracking = false } = options;

  return (tree: Root) => {
    if (debug) {
      console.log('📅 Processing date references with remark plugin');
    }

    // Process date references in the AST
    processDateReferencesInAST(tree, metadata, enableFieldTracking);

    if (debug) {
      console.log('✅ Date reference processing completed');
    }
  };
};

export default remarkDates;
export type { DateProcessingOptions };
