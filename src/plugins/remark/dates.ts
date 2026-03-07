/**
 * Remark plugin for Legal Markdown date processing
 *
 * This plugin processes date references in Legal Markdown documents using
 * AST-based processing. It handles {{@today}} tokens with format specifiers and
 * arithmetic operations, integrating with the comprehensive date helper system.
 *
 * Features:
 * - {{@today}} token processing with format specifiers ({{@today[format]}})
 * - Date arithmetic with +/- operations ({{@today+30}}, {{@today-365}})
 * - Advanced date formatting (legal, ISO, US, European, etc.)
 * - Timezone and locale support
 * - Integration with field tracking for highlighting
 * - Comprehensive error handling with fallback formatting
 *
 * Architecture:
 * 1. Scan document content for {{@today}} patterns
 * 2. Parse format specifiers and arithmetic operations
 * 3. Process dates using advanced date helpers
 * 4. Replace tokens with formatted dates
 * 5. Integrate with field tracker for highlighting support
 *
 * Ordering:
 * - Run before `remarkTemplateFields` so `{{@today...}}` arithmetic expressions
 *   are resolved before general `{{...}}` field expansion.
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
 * const result = await processor.process('Contract signed on {{@today[legal]}}.');
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
import { fieldSpan } from '../../extensions/tracking/field-span';
import type { YamlValue } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Plugin options for date processing
 */
interface DateProcessingOptions {
  /** Document metadata containing date formatting options */
  metadata: Record<string, YamlValue>;
  /** Enable debug logging */
  debug?: boolean;
  /** Enable field tracking with highlighting during AST processing */
  enableFieldTracking?: boolean;
}

/**
 * Pattern to match @today with optional chained arithmetic and format specifiers.
 * Supports one or more arithmetic segments (e.g. +2y-90d) followed by an optional
 * format specifier (e.g. [US]), or a format specifier alone.
 *
 * Examples: @today, @today+30, @today+2y-90d, @today+2y-90d[US], @today[legal]
 */
const WRAPPED_DATE_PATTERN =
  /\{\{\s*(@today((?:[+-]\d+[dmy]?)+(?:\[[^\]]+\])?|\[[^\]]+\])?)\s*\}\}/g;

/** A single arithmetic step to apply to a date */
interface ArithmeticOp {
  type: 'days' | 'months' | 'years';
  amount: number;
}

/**
 * Parse date token to extract a list of arithmetic operations and an optional format.
 * @param token - Everything after @today (e.g. "+2y-90d[US]", "[legal]", "+1y", "")
 * @returns { arithmeticList, format, isValid }
 */
function parseDateToken(token: string): {
  arithmeticList: ArithmeticOp[];
  format: string | null;
  isValid: boolean;
} {
  if (!token) return { arithmeticList: [], format: null, isValid: true };

  // Valid token: zero-or-more arithmetic segments + optional [format]
  if (!/^(?:[+-]\d+[dmy]?)*(?:\[[^\]]+\])?$/.test(token)) {
    return { arithmeticList: [], format: null, isValid: false };
  }

  // Extract optional [format] specifier
  const formatMatch = token.match(/\[([^\]]+)\]/);
  const format = formatMatch ? formatMatch[1] : null;

  // Remove [format] to isolate arithmetic part
  const arithmeticPart = token.replace(/\[[^\]]+\]/, '');

  // Parse every [+-]\d+[dmy]? segment in order
  const arithmeticList: ArithmeticOp[] = [];
  const opRe = /([+-])(\d+)([dmy]?)/g;
  let m: RegExpExecArray | null;
  while ((m = opRe.exec(arithmeticPart)) !== null) {
    const [, sign, digits, suffix] = m;
    const amount = parseInt(digits) * (sign === '-' ? -1 : 1);
    switch (suffix) {
      case 'm':
        arithmeticList.push({ type: 'months', amount });
        break;
      case 'y':
        arithmeticList.push({ type: 'years', amount });
        break;
      default: // 'd' or no suffix → days
        arithmeticList.push({ type: 'days', amount });
    }
  }

  return { arithmeticList, format, isValid: true };
}

/**
 * Apply arithmetic operation to a date
 */
function applyDateArithmetic(
  baseDate: Date,
  arithmetic: { type: 'days' | 'months' | 'years'; amount: number } | null
): Date {
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
 * Get ordinal suffix for a day number (st, nd, rd, th)
 *
 * Returns the appropriate English ordinal suffix for a given day number.
 * Special handling for 11-13: these always end in "th" (11th, 12th, 13th)
 * rather than following the last-digit rule (which would give 11st, 12nd, 13rd).
 * This is because the teens are irregular in English ordinal numbering.
 *
 * @param day - The day number (1-31)
 * @returns The ordinal suffix ('st', 'nd', 'rd', or 'th')
 *
 * @example
 * getOrdinalSuffix(1)  // returns 'st' -> "1st"
 * getOrdinalSuffix(2)  // returns 'nd' -> "2nd"
 * getOrdinalSuffix(3)  // returns 'rd' -> "3rd"
 * getOrdinalSuffix(11) // returns 'th' -> "11th" (special case)
 * getOrdinalSuffix(21) // returns 'st' -> "21st"
 */
function getOrdinalSuffix(day: number): string {
  // Handle special case: 11th, 12th, 13th (teens are irregular in English)
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  // Handle regular cases based on last digit
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

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
    case 'european':
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'long':
      // Long format: "March 15, 2024"
      return `${monthNames[date.getMonth()]} ${dayNumber}, ${year}`;
    case 'medium':
      // Medium format: "Mar 15, 2024"
      return `${monthNames[date.getMonth()].substring(0, 3)} ${dayNumber}, ${year}`;
    case 'short':
      // Short format: "Mar 15, 24"
      return `${monthNames[date.getMonth()].substring(0, 3)} ${dayNumber}, ${String(year).substring(2)}`;
    case 'legal': {
      // Legal format with ordinal suffix: "March 15th, 2024"
      const suffix = getOrdinalSuffix(dayNumber);
      return `${monthNames[date.getMonth()]} ${dayNumber}${suffix}, ${year}`;
    }
    default:
      return `${year}-${month}-${day}`;
  }
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

  const fieldName = `date.${originalToken.replace(/[@[\]]/g, '')}`;
  const kind = hasArithmetic ? 'highlight' : 'imported';
  return fieldSpan(fieldName, value, kind);
}

/**
 * Process date references in text nodes with field tracking
 */
function processDateReferencesInAST(
  root: Root,
  metadata: Record<string, YamlValue>,
  enableFieldTracking: boolean = false
): void {
  visit(root, 'text', (node: Text, index, parent) => {
    const originalValue = node.value;
    let modifiedValue = originalValue;
    let hasChanges = false;

    // Process wrapped {{@today...}} tokens with arithmetic
    modifiedValue = modifiedValue.replace(WRAPPED_DATE_PATTERN, (match, fullToken, token) => {
      try {
        // Parse the token to get arithmetic operations and format
        const { arithmeticList, format: tokenFormat, isValid } = parseDateToken(token);

        // If token is invalid, return original match
        if (!isValid) {
          return match;
        }

        // Use current date as base, then apply each arithmetic step in order
        let date = new Date();
        const hasArithmetic = arithmeticList.length > 0;
        for (const op of arithmeticList) {
          date = applyDateArithmetic(date, op);
        }

        // Determine format
        const format =
          tokenFormat ||
          (typeof metadata['date-format'] === 'string' ? metadata['date-format'] : 'YYYY-MM-DD');

        // Format the date using our basic formatter
        const formattedDate = formatDateBasic(date, format);

        // Track the date field for statistics
        fieldTracker.trackField(`date.${fullToken.replace(/[@[\]]/g, '')}`, {
          value: formattedDate,
          originalValue: match,
          hasLogic: hasArithmetic,
        });

        hasChanges = true;
        return formatDateValue(formattedDate, fullToken, enableFieldTracking, hasArithmetic);
      } catch (error) {
        logger.warn(`Error processing date reference ${match}:`, error);
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
          parent.children[index] = htmlNode as unknown as import('mdast').Content;
        }
      } else {
        node.value = modifiedValue;
      }
    }
  });

  // Also process HTML nodes that might contain date references
  visit(root, 'html', (node: { value: string }) => {
    if (!node.value || !node.value.includes('{{') || !node.value.includes('@today')) {
      return;
    }

    let modifiedValue = node.value;
    let hasChanges = false;

    // Process wrapped {{@today...}} tokens in HTML content
    modifiedValue = modifiedValue.replace(
      WRAPPED_DATE_PATTERN,
      (match: string, fullToken: string, token: string) => {
        try {
          const { arithmeticList, format: tokenFormat, isValid } = parseDateToken(token);
          if (!isValid) {
            return match;
          }

          let date = new Date();
          const hasArithmetic = arithmeticList.length > 0;
          for (const op of arithmeticList) {
            date = applyDateArithmetic(date, op);
          }

          // Determine format
          const format =
            tokenFormat ||
            (typeof metadata['date-format'] === 'string' ? metadata['date-format'] : 'YYYY-MM-DD');

          // Format the date
          const formattedDate = formatDateBasic(date, format);

          // Track the date field for statistics
          fieldTracker.trackField(`date.${fullToken.replace(/[@[\]]/g, '')}`, {
            value: formattedDate,
            originalValue: match,
            hasLogic: hasArithmetic,
          });

          hasChanges = true;

          // For HTML nodes, generate HTML span if field tracking is enabled
          if (enableFieldTracking) {
            const fieldName = `date.${fullToken.replace(/[@[\]]/g, '')}`;
            return fieldSpan(fieldName, formattedDate, hasArithmetic ? 'highlight' : 'imported');
          } else {
            return formattedDate;
          }
        } catch (error) {
          logger.warn(`Error processing date reference ${match}:`, error);
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
      logger.debug('Processing date references with remark plugin');
    }

    // Process date references in the AST
    processDateReferencesInAST(tree, metadata, enableFieldTracking);

    if (debug) {
      logger.debug('Date reference processing completed');
    }
  };
};

export default remarkDates;
export type { DateProcessingOptions };

// Exported for testing - not part of public API
export {
  parseDateToken as _parseDateToken,
  applyDateArithmetic as _applyDateArithmetic,
  getOrdinalSuffix as _getOrdinalSuffix,
  formatDateBasic as _formatDateBasic,
  formatDateValue as _formatDateValue,
};
