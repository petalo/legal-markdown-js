/**
 * @fileoverview Core Helpers Module - Ruby Legal Markdown Compatibility
 *
 * This module provides the basic helper functions that were present in the
 * original Ruby legal-markdown gem. It focuses on core functionality that
 * maintains 1:1 compatibility with the Ruby implementation.
 *
 * Core helpers include:
 * - Basic date functionality (@today support)
 * - Simple date formatting compatible with Ruby output
 * - Template processing utilities for core legal-markdown features
 *
 * For advanced helper functions (currency formatting, advanced date manipulation,
 * string utilities), see src/extensions/helpers/
 *
 * @example
 * ```typescript
 * import { today, formatBasicDate } from '@core/helpers';
 *
 * // Core functionality from Ruby legal-markdown
 * const currentDate = today();
 * const formatted = formatBasicDate(currentDate, 'DD/MM/YYYY');
 * ```
 */

// Re-export all core date helpers
export * from './date-helpers';

// Individual imports for convenience
import { today, formatBasicDate, parseToday } from './date-helpers';

/**
 * Registry of core helper functions for template processing
 *
 * This object provides the basic helper functions that were available
 * in the original Ruby legal-markdown implementation. It serves as the
 * foundation for template processing and mixin resolution.
 *
 * @constant {Object} coreHelpers
 * @example
 * ```typescript
 * import { coreHelpers } from '@core/helpers';
 *
 * // Use in core template processing (Ruby compatible)
 * const todayDate = coreHelpers.today();
 * const formatted = coreHelpers.formatBasicDate(new Date(), 'YYYY-MM-DD');
 * ```
 */
export const coreHelpers = {
  // Core date helpers (Ruby compatible)
  today,
  formatBasicDate,
  parseToday,

  // Legacy alias for backward compatibility
  formatDate: formatBasicDate,
};

/**
 * Core helper function names for validation and processing
 *
 * List of helper function names that are part of the core Ruby-compatible
 * functionality. Used for validating template expressions and determining
 * which helpers are available in core processing.
 *
 * @constant {string[]} CORE_HELPER_NAMES
 */
export const CORE_HELPER_NAMES = [
  'today',
  'formatBasicDate',
  'formatDate', // alias
  'parseToday',
] as const;

/**
 * Type definition for core helper function names
 */
export type CoreHelperName = (typeof CORE_HELPER_NAMES)[number];
