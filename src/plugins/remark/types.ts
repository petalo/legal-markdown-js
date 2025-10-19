/**
 * Plugin metadata system for remark plugins
 *
 * This module defines interfaces for declaring plugin dependencies and execution order.
 * It helps prevent plugin ordering bugs by making dependencies explicit and validatable.
 *
 * @module plugins/remark/types
 */

/**
 * Metadata for a remark plugin that declares its dependencies and constraints
 *
 * This metadata is used by the PluginOrderValidator to ensure plugins are
 * executed in the correct order and prevent runtime bugs.
 *
 * @example
 * ```typescript
 * export const remarkImportsMetadata: PluginMetadata = {
 *   name: 'remarkImports',
 *   runBefore: ['remarkTemplateFields', 'remarkLegalHeadersParser'],
 *   description: 'Process @import directives and insert AST nodes'
 * };
 * ```
 */
export interface PluginMetadata {
  /**
   * Unique identifier for the plugin
   * Should match the plugin function name (e.g., 'remarkImports')
   */
  name: string;

  /**
   * Human-readable description of what the plugin does
   */
  description: string;

  /**
   * List of plugin names that this plugin MUST run before
   *
   * If any of these plugins are in the pipeline, this plugin
   * must be executed before them.
   *
   * @example
   * // remarkImports must run before remarkTemplateFields
   * runBefore: ['remarkTemplateFields']
   */
  runBefore?: string[];

  /**
   * List of plugin names that this plugin MUST run after
   *
   * If any of these plugins are in the pipeline, this plugin
   * must be executed after them.
   *
   * @example
   * // remarkLegalHeadersParser must run after remarkImports
   * runAfter: ['remarkImports']
   */
  runAfter?: string[];

  /**
   * List of plugin names that conflict with this plugin
   *
   * If any of these plugins are in the pipeline together with
   * this plugin, the validator will throw an error.
   *
   * @example
   * conflicts: ['remarkOldLegacyProcessor']
   */
  conflicts?: string[];

  /**
   * Whether this plugin is required for core functionality
   *
   * If true, the validator will warn if the plugin is missing
   * from common pipelines.
   */
  required?: boolean;

  /**
   * Version of the plugin (for compatibility checks)
   */
  version?: string;
}

/**
 * Registry of all plugin metadata
 *
 * This maps plugin names to their metadata declarations.
 * Used by the validator to look up dependencies.
 */
export type PluginMetadataRegistry = Map<string, PluginMetadata>;

/**
 * Validation result from plugin order validation
 */
export interface PluginOrderValidationResult {
  /**
   * Whether the plugin order is valid
   */
  valid: boolean;

  /**
   * List of validation errors (if any)
   */
  errors: PluginOrderError[];

  /**
   * List of validation warnings (if any)
   */
  warnings: PluginOrderWarning[];

  /**
   * Suggested order if validation failed
   */
  suggestedOrder?: string[];
}

/**
 * Error in plugin ordering
 */
export interface PluginOrderError {
  /**
   * Type of error
   */
  type: 'dependency-violation' | 'conflict' | 'circular-dependency';

  /**
   * Plugin name that caused the error
   */
  plugin: string;

  /**
   * Related plugin (for dependency violations and conflicts)
   */
  relatedPlugin?: string;

  /**
   * Human-readable error message
   */
  message: string;
}

/**
 * Warning about plugin ordering
 */
export interface PluginOrderWarning {
  /**
   * Type of warning
   */
  type: 'missing-required' | 'suboptimal-order' | 'unknown-plugin';

  /**
   * Plugin name related to the warning
   */
  plugin: string;

  /**
   * Human-readable warning message
   */
  message: string;
}

/**
 * Configuration for plugin order validation
 */
export interface PluginOrderValidationOptions {
  /**
   * Whether to throw errors on validation failure (default: true)
   */
  throwOnError?: boolean;

  /**
   * Whether to log warnings to console (default: true)
   */
  logWarnings?: boolean;

  /**
   * Whether to validate unknown plugins (default: false)
   */
  strictMode?: boolean;

  /**
   * Whether to include debug information in results (default: false)
   */
  debug?: boolean;
}
