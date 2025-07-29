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
 * {Object} logger
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
// Global debug state for browser compatibility
let debugEnabled = false;
// Set log level based on environment - default to 'error' for quiet operation
let logLevel = (typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL) || 'error';

export const logger = {
  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug logging
   */
  setDebugEnabled: (enabled: boolean) => {
    debugEnabled = enabled;
  },

  /**
   * Set the logging level
   * @param {string} level - The log level ('debug', 'info', 'warn', 'error', 'none')
   */
  setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error' | 'none') => {
    logLevel = level;
  },

  /**
   * Log debug messages (only shown when DEBUG environment variable is set or debug is enabled)
   *
   * debug
   * @param {string} message - The debug message to log
   * @param {any} [data] - Optional contextual data to include with the log
   * @returns {void}
   * @example
   * ```typescript
   * // Enable debug mode: DEBUG=true node app.js or logger.setDebugEnabled(true)
   * logger.debug('Processing field', { name: 'client.name', type: 'string' });
   * logger.debug('Import resolved', { path: './shared/header.md' });
   * ```
   */
  debug: (message: string, data?: any) => {
    // Browser-compatible debug check
    const isDebugEnabled =
      debugEnabled || (typeof process !== 'undefined' && process.env && process.env.DEBUG);
    if (isDebugEnabled) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  /**
   * Log informational messages
   *
   * info
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
    if (logLevel === 'none' || logLevel === 'warn' || logLevel === 'error') return;
    console.info(`[INFO] ${message}`, data || '');
  },

  /**
   * Log warning messages
   *
   * warn
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
    if (logLevel === 'none' || logLevel === 'error') return;
    console.warn(`[WARN] ${message}`, data || '');
  },

  /**
   * Log error messages
   *
   * error
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
    if (logLevel === 'none') return;
    console.error(`[ERROR] ${message}`, data || '');
  },
};
