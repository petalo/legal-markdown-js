/**
 * @fileoverview Lightweight Logging Utility for Legal Markdown Processing
 *
 * This module provides a simple, efficient logging utility for the Legal Markdown
 * processing system. It offers structured logging with different levels and
 * optional data context support.
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Debug mode controlled by environment variable
 * - Structured logging with contextual data
 * - Console-based output with formatted prefixes
 * - Optional data parameter for detailed logging
 * - Lightweight with no external dependencies
 *
 * @example
 * ```typescript
 * import { logger } from './logger';
 *
 * // Basic logging
 * logger.info('Processing legal document');
 * logger.warn('Missing field detected');
 * logger.error('Failed to parse YAML');
 *
 * // Logging with context data
 * logger.debug('Field processed', { fieldName: 'client.name', value: 'Acme Corp' });
 * logger.info('Document exported', { format: 'pdf', size: '2.3MB' });
 * ```
 */

/**
 * Simple logger utility for Legal Markdown processing
 *
 * Provides structured logging with different levels and optional context data.
 * Debug logging is only enabled when DEBUG environment variable is set.
 *
 * @constant {Object} logger
 * @example
 * ```typescript
 * import { logger } from './logger';
 *
 * // Set DEBUG=true in environment to see debug logs
 * logger.debug('Processing started', { file: 'contract.md' });
 * logger.info('Document processed successfully');
 * logger.warn('Optional field missing', { field: 'client.address' });
 * logger.error('Processing failed', { error: 'Invalid syntax' });
 * ```
 */
export const logger = {
  /**
   * Log debug messages (only shown when DEBUG environment variable is set)
   *
   * @method debug
   * @param {string} message - The debug message to log
   * @param {any} [data] - Optional contextual data to include with the log
   * @returns {void}
   * @example
   * ```typescript
   * // Enable debug mode: DEBUG=true node app.js
   * logger.debug('Processing field', { name: 'client.name', type: 'string' });
   * logger.debug('Import resolved', { path: './shared/header.md' });
   * ```
   */
  debug: (message: string, data?: any) => {
    // Browser-compatible debug check
    const isDebugEnabled = typeof process !== 'undefined' && process.env && process.env.DEBUG;
    if (isDebugEnabled) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  /**
   * Log informational messages
   *
   * @method info
   * @param {string} message - The informational message to log
   * @param {any} [data] - Optional contextual data to include with the log
   * @returns {void}
   * @example
   * ```typescript
   * logger.info('Document processing completed');
   * logger.info('Export successful', { format: 'html', path: './output.html' });
   * ```
   */
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '');
  },

  /**
   * Log warning messages
   *
   * @method warn
   * @param {string} message - The warning message to log
   * @param {any} [data] - Optional contextual data to include with the log
   * @returns {void}
   * @example
   * ```typescript
   * logger.warn('Missing optional field', { field: 'client.phone' });
   * logger.warn('Import file not found', { path: './missing.md' });
   * ```
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  /**
   * Log error messages
   *
   * @method error
   * @param {string} message - The error message to log
   * @param {any} [data] - Optional contextual data to include with the log
   * @returns {void}
   * @example
   * ```typescript
   * logger.error('Failed to parse YAML frontmatter', { error: 'Invalid syntax' });
   * logger.error('Document processing failed', { file: 'contract.md', reason: 'Missing imports' });
   * ```
   */
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '');
  },
};
